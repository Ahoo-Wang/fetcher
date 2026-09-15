/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { withDeadline } from '../lib/runtimeLimits.js';
import type {
  ViewDefinitionPermissions,
  ViewInstance,
  ViewInstancePermissions,
} from '../contracts/viewModel.js';
import type { ViewHost } from '../contracts/ViewHost.js';
import { validateViewInstance } from '../contracts/validation/instanceValidation.js';
import { readPreferenceState } from '../contracts/validation/preferenceValidation.js';

import type { EngineScope } from './EngineScope.js';
import type { SessionStore } from './SessionStore.js';
import type { InstanceWork } from './InstanceWork.js';
import type { ViewQueries } from './ViewQueries.js';
import type { ViewLoader } from './ViewLoader.js';
import type { RecordSummaries } from '../record/engine/RecordSummaries.js';
import { copy, message, ownRecord, sameJsonState } from '../lib/snapshot.js';
import {
  instanceContent,
  baselinePatch,
  createSession,
} from './sessionState.js';
import { summaryOf, type ViewSession } from '../contracts/viewModel.js';
import { reconcileWriteFailure, writeFailurePatch } from './writeRecovery.js';
import {
  permissionsFor,
  summaryPermissionsFor,
} from './instancePermissions.js';
import {
  ViewServiceError,
  preconditionFor,
  readWriteObservation,
  type PreferenceState,
  type ViewDeleteReceipt,
  type WriteObservation,
  type WritePrecondition,
} from '../contracts/viewServiceContract.js';

/** 类型保持的数组守卫：Array.isArray 的 any[] 谓词会把 readonly 数组退化为 any[]。 */
function isReadonlyArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/** An uncertain preference write keeps its identity so the same intent replays under the same key. */
interface PreferenceIntent {
  key: string;
  requestId: string;
  precondition: WritePrecondition;
}

/** Explicit persisted name, deletion and user-preference operations. */
export class ViewManagement {
  private defaultWrite?: { version: number };
  private readonly preferenceIntents = new Map<
    'saveDefault' | 'saveOrder',
    PreferenceIntent
  >();
  /** Reuse the identity and precondition of an unresolved intent with the same payload. */
  private preferenceIntent(
    action: 'saveDefault' | 'saveOrder',
    payload: unknown,
  ): PreferenceIntent {
    const key = JSON.stringify(payload);
    const existing = this.preferenceIntents.get(action);
    if (existing && existing.key === key) return existing;
    const intent = {
      key,
      requestId: crypto.randomUUID(),
      precondition: preconditionFor(
        this.store.getSnapshot().preference.revision,
      ),
    };
    this.preferenceIntents.set(action, intent);
    return intent;
  }
  constructor(
    private readonly store: SessionStore,
    private readonly scope: EngineScope,
    private readonly host: ViewHost,
    private readonly work: InstanceWork,
    private readonly queries: ViewQueries,
    private readonly summaries: RecordSummaries,
    private readonly loader: ViewLoader,
    private readonly definitionId: string,
  ) {}
  getPermissions(id?: string): ViewInstancePermissions {
    const key = id ?? this.store.getSnapshot().selectedInstanceId;
    if (this.scope.disposed || key === null)
      return permissionsFor(this.host, undefined);
    const session = this.store.find(key);
    if (session) return permissionsFor(this.host, session);
    const summary = this.store.getSnapshot().catalog.summaries[key];
    return summary
      ? summaryPermissionsFor(this.host, summary)
      : permissionsFor(this.host, undefined);
  }
  /** Identity, title and revision of a saved instance, from its session or the catalog summary. */
  private target(id: string | undefined): {
    id: string;
    title: string;
    revision: string;
    session?: ViewSession;
  } {
    const key = id ?? this.store.getSnapshot().selectedInstanceId;
    this.store.definition();
    if (key !== null) {
      if (this.store.isPosition(key))
        throw new Error('运行位置不能通过实例管理接口写入，请编辑原视图');
      const session = this.store.find(key);
      if (session)
        return {
          id: session.instance.id,
          title: session.baseline.title,
          revision: session.baseline.revision,
          session,
        };
      const summary = this.store.getSnapshot().catalog.summaries[key];
      if (summary)
        return { id: key, title: summary.title, revision: summary.revision };
    }
    throw new Error('请先选择有效的视图实例');
  }
  /** Personal preference grants; without a definition grant port the user's own preferences are allowed. */
  private definitionGrant(key: keyof ViewDefinitionPermissions): boolean {
    if (!this.host.permission?.getDefinition) return true;
    try {
      return this.host.permission.getDefinition()[key] === true;
    } catch {
      return false;
    }
  }

  async renameInstance(title: string, id?: string): Promise<void> {
    const target = this.target(id);
    const { session } = target;
    id = target.id;
    if (!this.getPermissions(id).rename)
      throw new Error('系统视图或宿主未授权的视图不能编辑名称');
    if (typeof title !== 'string' || !title.trim())
      throw new Error('视图名称不能为空');
    if (session) this.work.assertWritable(session);
    else if (this.work.writeToken(id) || this.work.pendingWrite(id))
      throw new Error('实例存在未核对的写入，请等待核对完成后重试');
    title = title.trim();
    if (
      title === target.title &&
      (!session || title === session.instance.title)
    )
      return;
    const lifecycle = this.scope.version;
    const token = Symbol();
    const current = () =>
      this.scope.current(lifecycle) && this.work.writeToken(id) === token;
    const requestId = crypto.randomUUID();
    let reloadRequired = false;
    try {
      this.work.beginWrite(id, token);
      if (session)
        this.store.patch(id, { writeStatus: 'renaming', writeError: null });
      if (!current()) return;
      let observation: WriteObservation<ViewInstance>;
      const controller = new AbortController();
      try {
        observation = readWriteObservation<ViewInstance>(
          await withDeadline(
            () =>
              this.host.instance!.rename!(id, title, target.revision, {
                requestId,
                signal: controller.signal,
              }),
            this.store.limits.writeTimeoutMs,
            controller,
          ),
        );
      } catch (error) {
        reloadRequired = true;
        this.work.recordPendingWrite(id, { action: 'rename', requestId });
        throw error;
      }
      if (!current()) return;
      if (observation.outcome === 'rejected')
        throw new ViewServiceError(
          observation.issue.code,
          observation.issue.message,
        );
      if (observation.outcome !== 'committed') {
        reloadRequired = true;
        this.work.recordPendingWrite(id, {
          action: 'rename',
          requestId,
          ...(observation.outcome === 'committed_pending_receipt'
            ? { revision: observation.revision }
            : {}),
        });
        throw new ViewServiceError(
          observation.issue.code,
          observation.outcome === 'committed_pending_receipt'
            ? `已提交，回执待核对：${observation.issue.message}`
            : observation.issue.message,
        );
      }
      reloadRequired = true;
      if (observation.visibility === 'pending' && observation.readFence)
        this.work.noteCatalogReadFence(observation.readFence);
      const result = observation.value;
      validateViewInstance(result, this.store.definition(), id);
      if (
        result.revision !== observation.revision ||
        (session &&
          !sameJsonState(instanceContent(result), {
            ...instanceContent(session.baseline),
            title,
          })) ||
        (!session &&
          (result.title !== title ||
            result.kind !==
              this.store.getSnapshot().catalog.summaries[id]?.kind ||
            !sameJsonState(
              result.scope,
              this.store.getSnapshot().catalog.summaries[id]?.scope,
            )))
      )
        throw new Error('改名结果修改了其他视图配置，请重新加载核对');
      const baseline = copy(result);
      this.work.clearPendingWrite(id);
      if (!session) {
        this.work.finishWrite(id, token, () => {
          const summaries = ownRecord(
            this.store.getSnapshot().catalog.summaries,
          );
          summaries[id] = summaryOf(baseline);
          this.store.publish({
            catalog: { ...this.store.getSnapshot().catalog, summaries },
          });
        });
        return;
      }
      const latest = this.store.session(id);
      const local = {
        ...latest.instance,
        title:
          latest.instance.title === session.instance.title
            ? title
            : latest.instance.title,
      };
      this.work.finishWrite(id, token, () =>
        this.store.patch(id, {
          ...baselinePatch(baseline, local),
          writeStatus: 'idle',
          writeError: null,
          visibility: observation.visibility,
        }),
      );
    } catch (error) {
      if (!current()) return;
      if (!session) {
        this.work.finishWrite(id, token);
        throw error;
      }
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishWrite(id, token, onSettled),
        patch: writeFailurePatch(this.store, id, error, reloadRequired),
      });
    } finally {
      this.work.finishWrite(id, token);
    }
  }

  canSetDefaultInstance(): boolean {
    return (
      !this.scope.disposed &&
      typeof this.host.preference?.saveDefault === 'function' &&
      this.definitionGrant('setDefault')
    );
  }

  private assertPreferenceKnown(): void {
    const preference = this.store.getSnapshot().preference;
    if (preference.status !== 'ready')
      throw new Error('个人偏好尚未加载完成，请稍后重试或重新加载');
  }

  private adoptPreference(state: PreferenceState, readFence?: string): void {
    if (readFence) this.loader.notePreferenceReadFence(readFence);
    this.store.publish({
      defaultInstanceId: state.effectiveDefaultInstanceId,
      preference: { status: 'ready', error: null, revision: state.revision },
    });
  }

  async setDefaultInstance(instanceId: string | null): Promise<void> {
    if (
      instanceId !== null &&
      (typeof instanceId !== 'string' || !instanceId.trim())
    )
      throw new Error('默认视图必须是有效实例 ID 或 null');
    this.store.definition();
    if (!this.canSetDefaultInstance())
      throw new Error('宿主未提供默认视图保存接口');
    if (instanceId !== null) {
      if (!this.store.getSnapshot().instanceIds.includes(instanceId))
        throw new Error('默认视图必须是有效实例 ID 或 null');
      const session = this.store.find(instanceId);
      if (session) this.work.assertWritable(session);
    }
    this.assertDefaultWritable();
    // Default and order writes share one preference document; concurrent dispatch under the
    // same revision precondition would only produce a spurious REVISION_CONFLICT.
    if (this.work.ordering) throw new Error('视图顺序正在保存，请等待操作完成');
    this.assertPreferenceKnown();
    const request = { version: this.scope.version };
    this.defaultWrite = request;
    const intent = this.preferenceIntent('saveDefault', instanceId);
    try {
      const controller = new AbortController();
      const observation = readWriteObservation<PreferenceState>(
        await withDeadline(
          () =>
            this.host.preference!.saveDefault!(
              this.definitionId,
              instanceId,
              intent.precondition,
              { requestId: intent.requestId, signal: controller.signal },
            ),
          this.store.limits.writeTimeoutMs,
          controller,
        ),
      );
      if (!this.scope.current(request.version) || this.defaultWrite !== request)
        return;
      if (observation.outcome === 'rejected')
        this.preferenceIntents.delete('saveDefault');
      if (observation.outcome !== 'committed')
        throw new ViewServiceError(
          observation.issue.code,
          observation.issue.message,
        );
      const state = readPreferenceState(observation.value);
      if (state.revision !== observation.revision)
        throw new Error('偏好回执的版本不一致');
      if (state.defaultInstanceId !== instanceId)
        throw new Error('默认视图回执与请求目标不一致，请重新加载核对');
      this.preferenceIntents.delete('saveDefault');
      this.defaultWrite = undefined;
      this.adoptPreference(
        state,
        observation.visibility === 'pending'
          ? observation.readFence
          : undefined,
      );
    } catch (error) {
      if (!this.scope.current(request.version) || this.defaultWrite !== request)
        return;
      throw Object.assign(
        new Error(`${message(error)}；请重试或重新加载核对默认视图`),
        { cause: error },
      );
    } finally {
      if (this.defaultWrite === request) this.defaultWrite = undefined;
    }
  }

  private assertDefaultWritable(): void {
    if (this.defaultWrite) throw new Error('默认视图正在保存');
    if (
      Object.values(this.store.getSnapshot().sessions).some(
        session => session.writeStatus === 'deleting',
      )
    )
      throw new Error('视图正在删除，请等待操作完成');
  }

  canReorderInstances(): boolean {
    return (
      !this.scope.disposed &&
      typeof this.host.preference?.saveOrder === 'function' &&
      this.definitionGrant('reorder')
    );
  }

  /**
   * Reorders the loaded slots named by `scopeInstanceIds` (default: the ordered IDs themselves).
   * IDs outside the scope and the default view keep their positions.
   */
  async reorderInstances(
    orderedInstanceIds: readonly string[],
    scopeInstanceIds: readonly string[] = orderedInstanceIds,
  ): Promise<void> {
    this.store.definition();
    if (!this.canReorderInstances()) throw new Error('宿主未提供视图排序接口');
    if (this.work.ordering) throw new Error('视图顺序正在保存');
    if (this.defaultWrite) throw new Error('默认视图正在保存，请等待操作完成');
    const known = new Set(this.store.getSnapshot().instanceIds);
    const scope = new Set(scopeInstanceIds);
    if (
      // 类型保持守卫，避免 Array.isArray 把 readonly 参数退化为 any[]。
      !isReadonlyArray(orderedInstanceIds) ||
      !isReadonlyArray(scopeInstanceIds) ||
      scope.size !== scopeInstanceIds.length ||
      scope.size === 0 ||
      orderedInstanceIds.length !== scope.size ||
      new Set(orderedInstanceIds).size !== scope.size ||
      orderedInstanceIds.some(id => typeof id !== 'string' || !scope.has(id)) ||
      scopeInstanceIds.some(id => typeof id !== 'string' || !known.has(id))
    )
      throw new Error('排序作用集合与目标顺序必须是相同、不重复的已加载视图');
    const change = {
      scopeInstanceIds: [...scopeInstanceIds],
      orderedInstanceIds: [...orderedInstanceIds],
    };
    const currentOrder = this.store
      .getSnapshot()
      .instanceIds.filter(id => scope.has(id));
    if (currentOrder.every((id, index) => id === orderedInstanceIds[index]))
      return;
    this.assertPreferenceKnown();
    const lifecycle = this.scope.version;
    const token = Symbol();
    this.work.beginOrder(token);
    const intent = this.preferenceIntent('saveOrder', change);
    try {
      const controller = new AbortController();
      const observation = readWriteObservation<PreferenceState>(
        await withDeadline(
          () =>
            this.host.preference!.saveOrder!(
              this.definitionId,
              change,
              intent.precondition,
              { requestId: intent.requestId, signal: controller.signal },
            ),
          this.store.limits.writeTimeoutMs,
          controller,
        ),
      );
      if (!this.scope.current(lifecycle) || this.work.ordering !== token)
        return;
      if (observation.outcome === 'rejected')
        this.preferenceIntents.delete('saveOrder');
      if (observation.outcome !== 'committed')
        throw new ViewServiceError(
          observation.issue.code,
          observation.issue.message,
        );
      const state = readPreferenceState(observation.value);
      if (state.revision !== observation.revision)
        throw new Error('偏好回执的版本不一致');
      // The receipt must have implemented the requested order for the touched slots;
      // a well-formed but different order is a crossed response, not a success.
      const scoped = state.order.filter(id => scope.has(id));
      const expected = orderedInstanceIds.filter(id => scoped.includes(id));
      if (
        scoped.length === 0 ||
        scoped.length !== expected.length ||
        scoped.some((id, index) => id !== expected[index])
      )
        throw new Error('排序回执与请求顺序不一致，请重新加载核对');
      this.preferenceIntents.delete('saveOrder');
      for (const id of scopeInstanceIds) this.loader.addCatalogued(id);
      this.loader.applyCatalogOrder(state.order);
      const latest = this.store.getSnapshot().instanceIds;
      this.work.finishOrder(token);
      this.store.publish({
        instanceIds: [
          ...this.loader.catalogOrder.filter(id => latest.includes(id)),
          ...latest.filter(id => !this.loader.catalogOrder.includes(id)),
        ],
      });
      this.adoptPreference(
        state,
        observation.visibility === 'pending'
          ? observation.readFence
          : undefined,
      );
    } finally {
      this.work.finishOrder(token);
    }
  }

  canRetryDeleteInstance(id?: string): boolean {
    const key = id ?? this.store.getSnapshot().selectedInstanceId;
    if (key === null) return false;
    const session = this.store.find(key);
    const revision =
      session?.baseline.revision ??
      this.store.getSnapshot().catalog.summaries[key]?.revision;
    const pending = this.work.unverifiedDelete(key);
    return Boolean(
      pending &&
      revision !== undefined &&
      (session ? session.requiresReload : true) &&
      this.getPermissions(key).delete &&
      pending.revision === revision,
    );
  }

  async deleteInstance(id?: string): Promise<void> {
    const target = this.target(id);
    const { session } = target;
    id = target.id;
    if (!this.getPermissions(id).delete)
      throw new Error('系统视图或宿主未授权的视图不能删除');
    // Repeating the same versioned delete is idempotent; other writes still need reconciliation.
    const retrying = this.canRetryDeleteInstance(id);
    if (session) this.work.assertWritable(session, retrying);
    else if (
      this.work.writeToken(id) ||
      (!retrying && this.work.pendingWrite(id))
    )
      throw new Error('实例存在未核对的写入，请等待核对完成后重试');
    this.assertDefaultWritable();
    const lifecycle = this.scope.version;
    const token = Symbol();
    const current = () =>
      this.scope.current(lifecycle) && this.work.writeToken(id) === token;
    const revision = target.revision;
    const requestId = retrying
      ? this.work.unverifiedDelete(id)!.requestId
      : crypto.randomUUID();
    let reloadRequired = false;
    try {
      this.work.beginWrite(id, token);
      if (session)
        this.store.patch(id, { writeStatus: 'deleting', writeError: null });
      if (!current()) return;
      let observation: WriteObservation<ViewDeleteReceipt>;
      const controller = new AbortController();
      try {
        observation = readWriteObservation<ViewDeleteReceipt>(
          await withDeadline(
            () =>
              this.host.instance!.delete!(id, revision, {
                requestId,
                signal: controller.signal,
              }),
            this.store.limits.writeTimeoutMs,
            controller,
          ),
        );
      } catch (error) {
        reloadRequired = true;
        this.work.markDeleteUnverified(id, revision, requestId);
        throw error;
      }
      if (!current()) return;
      if (observation.outcome === 'rejected')
        throw new ViewServiceError(
          observation.issue.code,
          observation.issue.message,
        );
      if (observation.outcome !== 'committed') {
        reloadRequired = true;
        this.work.markDeleteUnverified(id, revision, requestId);
        throw new ViewServiceError(
          observation.issue.code,
          observation.outcome === 'committed_pending_receipt'
            ? `已提交，回执待核对：${observation.issue.message}`
            : observation.issue.message,
        );
      }
      reloadRequired = true;
      if (observation.visibility === 'pending' && observation.readFence)
        this.work.noteCatalogReadFence(observation.readFence);
      const receipt = observation.value;
      if (
        !receipt ||
        typeof receipt !== 'object' ||
        receipt.id !== id ||
        typeof receipt.revision !== 'string' ||
        !receipt.revision ||
        receipt.revision !== observation.revision
      ) {
        this.work.markDeleteUnverified(id, revision, requestId);
        throw new Error('删除回执与目标实例不一致，请重试核对');
      }
      this.work.markDeleted(id);
      this.queries.cancel(id);
      this.summaries.invalidate(id);
      if (!current()) return;
      this.work.finishCreate(id);
      this.work.clearPendingWrite(id);
      this.loader.forgetCatalogued(id);
      const wasSelected = this.store.getSnapshot().selectedInstanceId === id;
      const nextId = wasSelected
        ? (this.store.getSnapshot().instanceIds.filter(key => key !== id)[0] ??
          null)
        : this.store.getSnapshot().selectedInstanceId;
      // An unopened successor is point-read before the removal is published, so the delete
      // resolves with a consistent selection and only its first query runs in the background.
      let successorReady: ViewInstance | undefined;
      if (wasSelected && nextId !== null && !this.store.find(nextId)) {
        try {
          successorReady = await this.loader.loadSavedInstance(nextId);
          if (!current()) return;
        } catch {
          if (!current()) return;
        }
      }
      // The point read could be slow; publish against the snapshot that exists now so a
      // navigation that happened meanwhile keeps its session and selection.
      this.work.finishWrite(id, token, () => {
        const fresh = this.store.getSnapshot();
        const sessions = ownRecord(fresh.sessions);
        delete sessions[id];
        const selectionNow = fresh.selectedInstanceId;
        // Only take the successor over when the user has not navigated away from the
        // deleted instance; otherwise the user's selection stands.
        const selectionOnDeleted =
          selectionNow === id || (wasSelected && selectionNow === null);
        if (
          selectionOnDeleted &&
          successorReady !== undefined &&
          nextId !== null &&
          !Object.prototype.hasOwnProperty.call(sessions, nextId)
        )
          sessions[nextId] = createSession(
            successorReady,
            this.store.definition(),
            this.store.filterCompilers,
            this.store.analysisCompilers,
          );
        // An already-open successor takes over without any point read.
        const successorOpened =
          nextId !== null &&
          Object.prototype.hasOwnProperty.call(sessions, nextId);
        const instanceIds = fresh.instanceIds.filter(key => key !== id);
        const summaries = ownRecord(fresh.catalog.summaries);
        delete summaries[id];
        // Register the successor's first query before publishing, so a command an observer
        // issues during the publish supersedes it instead of being replaced by it.
        const followUp =
          selectionOnDeleted && successorOpened && nextId !== null
            ? this.queries.followUp(nextId)
            : undefined;
        this.store.publish({
          sessions,
          instanceIds,
          selectedInstanceId: selectionOnDeleted
            ? successorOpened
              ? nextId
              : null
            : selectionNow,
          defaultInstanceId:
            fresh.defaultInstanceId === id ? null : fresh.defaultInstanceId,
          catalog: {
            ...fresh.catalog,
            summaries,
            total:
              fresh.catalog.total === null
                ? null
                : Math.max(0, fresh.catalog.total - 1),
          },
        });
        void followUp?.().catch(() => {});
      });
    } catch (error) {
      if (!current()) return;
      if (!session) {
        this.work.finishWrite(id, token);
        throw error;
      }
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishWrite(id, token, onSettled),
        patch: writeFailurePatch(this.store, id, error, reloadRequired),
      });
    } finally {
      this.work.finishWrite(id, token);
    }
  }
}
