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
  ViewInstance,
  ViewCreateInput,
  ViewSession,
  SaveAsScope,
  ViewInstanceConflict,
} from '../contracts/viewModel.js';
import type { ViewHost } from '../contracts/ViewHost.js';
import { validateViewInstance } from '../contracts/validation/instanceValidation.js';

import type { EngineScope } from './EngineScope.js';
import type { SessionStore } from './SessionStore.js';
import type { InstanceWork } from './InstanceWork.js';
import type { ViewQueries } from './ViewQueries.js';
import type { ViewLoader } from './ViewLoader.js';
import { copy, sameJsonState } from '../lib/snapshot.js';
import {
  createSession,
  assertConflictReview,
  inheritEditingSession,
  instanceContent,
  baselinePatch,
  withContent,
} from './sessionState.js';
import { reconcileWriteFailure, writeFailurePatch } from './writeRecovery.js';
import {
  ViewServiceError,
  readWriteObservation,
  type WriteObservation,
} from '../contracts/viewServiceContract.js';
import { permissionsFor } from './instancePermissions.js';

/** Marks a create reconciliation that returned without publishing a result. */
const WRITE_ABORT = Symbol();

/** Inputs resolved before dispatch, shared with dispatch and reconciliation. */
interface PreparedWrite {
  readonly submitted: ViewInstance;
  readonly knownIds: ReadonlySet<string>;
}

/** Orchestration state of an in-flight write handed to its private phases. */
interface WriteContext {
  readonly id: () => string;
  readonly lifecycle: number;
  readonly token: symbol;
  readonly current: () => boolean;
  readonly selection: () => number;
  readonly requireReload: () => void;
}

type CommittedInstance = Extract<
  WriteObservation<ViewInstance>,
  { outcome: 'committed' }
>;

/** Saved configuration writes and their immutable response reconciliation. */
export class ViewPersistence {
  constructor(
    private readonly store: SessionStore,
    private readonly scope: EngineScope,
    private readonly host: ViewHost,
    private readonly work: InstanceWork,
    private readonly queries: ViewQueries,
    private readonly loader: ViewLoader,
  ) {}

  async save(id?: string): Promise<void> {
    const session = this.store.session(id);
    await this.write(
      session.kind === 'dashboard' && !session.persisted
        ? {
            title: session.instance.title,
            scope: session.instance.scope as SaveAsScope,
          }
        : undefined,
      id,
    );
  }

  async overwriteInstance(
    review: ViewInstanceConflict,
    id?: string,
  ): Promise<void> {
    await this.write(undefined, id, review);
  }

  async saveAs(
    options: { title: string; scope: SaveAsScope },
    id?: string,
  ): Promise<string | undefined> {
    return this.write(options, id);
  }

  private async write(
    options: { title: string; scope: SaveAsScope } | undefined,
    id?: string,
    review?: ViewInstanceConflict,
  ): Promise<string | undefined> {
    const session = this.store.session(id);
    id = session.instance.id;
    const lifecycle = this.scope.version;
    const token = Symbol();
    const selection = this.scope.selection;
    let reloadRequired = false;
    const current = () =>
      this.scope.current(lifecycle) && this.work.writeToken(id) === token;
    const ctx: WriteContext = {
      id: () => id,
      lifecycle,
      token,
      current,
      selection: () => selection,
      requireReload: () => {
        reloadRequired = true;
      },
    };
    try {
      const prepared = this.prepareWrite(session, options, review);
      const observation = await this.dispatchWrite(
        prepared,
        options,
        review,
        ctx,
      );
      if (!current()) return;
      if (observation === undefined) return;
      const committed = this.settle(observation, options, ctx);
      if (options) {
        const outcome = this.reconcileCreate(prepared, committed, ctx);
        if (outcome === WRITE_ABORT) return;
        return outcome;
      }
      this.reconcileSave(prepared, committed, ctx);
    } catch (error) {
      if (
        !this.scope.current(lifecycle) ||
        (this.work.writeToken(id) && this.work.writeToken(id) !== token)
      ) {
        if (this.scope.current(lifecycle)) throw error;
        return;
      }
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishWrite(id, token, onSettled),
        patch: writeFailurePatch(
          this.store,
          id,
          error,
          reloadRequired || Boolean(this.work.unverifiedCreate(id)),
        ),
      });
    } finally {
      this.work.finishWrite(id, token);
    }
  }

  /** Turns a non-committed observation into the failure the caller sees, recording recovery state first. */
  private settle(
    observation: WriteObservation<ViewInstance>,
    options: { title: string; scope: SaveAsScope } | undefined,
    ctx: WriteContext,
  ): CommittedInstance {
    const id = ctx.id();
    switch (observation.outcome) {
      case 'committed':
        return observation;
      case 'rejected':
        if (options) this.abandonCreate(id, ctx);
        throw new ViewServiceError(
          observation.issue.code,
          observation.issue.message,
        );
      case 'committed_pending_receipt':
        ctx.requireReload();
        if (options) this.work.markCreateUnverified(id, observation.targetId);
        else
          this.work.recordPendingWrite(id, {
            action: 'save',
            requestId: this.work.lastRequestId(id)!,
            revision: observation.revision,
          });
        throw new ViewServiceError(
          observation.issue.code,
          `已提交，回执待核对：${observation.issue.message}`,
        );
      case 'unknown':
        ctx.requireReload();
        if (options) {
          if (!this.work.unverifiedCreate(id))
            this.work.markCreateUnverified(id);
        } else
          this.work.recordPendingWrite(id, {
            action: 'save',
            requestId: this.work.lastRequestId(id)!,
          });
        throw new ViewServiceError(
          observation.issue.code,
          observation.issue.message,
        );
    }
  }

  /** A definitive rejection of a new intent frees its request identity; earlier uncertain attempts are kept. */
  private abandonCreate(id: string, ctx: WriteContext): void {
    const request = this.work.createRequest(id);
    if (!request || this.work.unverifiedCreate(id)) return;
    this.work.finishCreate(id);
    this.work.finishWrite(id, ctx.token, () => {
      this.store.clearPendingCreate(id);
      if (this.store.find(id)?.requiresReload)
        this.store.patch(id, { requiresReload: false, writeError: null });
    });
  }

  private prepareWrite(
    session: ViewSession,
    options: { title: string; scope: SaveAsScope } | undefined,
    review?: ViewInstanceConflict,
  ): PreparedWrite {
    const id = session.instance.id;
    const definition = this.store.definition();
    if (session.validation.length > 0)
      throw new Error('配置无效，请先修正后保存');
    this.work.assertWritable(
      session,
      Boolean(options && this.work.createRequest(id)),
      Boolean(options || review),
    );
    if (review) assertConflictReview(session, review);
    const permissions = permissionsFor(this.host, session);
    if (
      options &&
      !(
        options.scope?.type === 'personal' ||
        (options.scope?.type === 'public' && options.scope.source === 'shared')
      )
    )
      throw new Error('另存仅支持个人或公共共享实例');
    if (
      options
        ? !(options.scope.type === 'personal'
            ? permissions.saveAsPersonal
            : permissions.saveAsShared)
        : !permissions.save
    )
      throw new Error('宿主未允许此保存操作');
    const submitted = copy(
      options
        ? { ...session.instance, title: options.title, scope: options.scope }
        : review
          ? {
              ...review.remote,
              title: session.instance.title,
              config: session.instance.config,
            }
          : session.instance,
    );
    validateViewInstance(submitted, definition, id);
    const knownIds =
      this.work.createRequest(id)?.knownIds ??
      new Set(this.store.getSnapshot().instanceIds);
    return { submitted, knownIds };
  }

  private async dispatchWrite(
    prepared: PreparedWrite,
    options: { title: string; scope: SaveAsScope } | undefined,
    review: ViewInstanceConflict | undefined,
    ctx: WriteContext,
  ): Promise<WriteObservation<ViewInstance> | undefined> {
    const id = ctx.id();
    const session = this.store.session(id);
    const { submitted, knownIds } = prepared;
    const { token, current } = ctx;
    const definitionRevision = this.store.definition().revision;
    this.work.beginWrite(id, token);
    this.store.patch(id, {
      writeStatus: options ? 'creating' : 'saving',
      writeError: null,
    });
    if (!current()) return;
    if (review) assertConflictReview(this.store.session(id), review);
    if (options) {
      const { definitionId, kind, title, scope, config } = submitted;
      const previous = this.work.createRequest(id);
      if (
        previous &&
        !sameJsonState(
          instanceContent(previous.submitted),
          instanceContent(submitted),
        )
      )
        throw new ViewServiceError(
          'UNKNOWN_OUTCOME',
          '上次另存结果尚未确认，请先使用原配置重试',
        );
      const request = previous ?? {
        requestId: crypto.randomUUID(),
        submitted,
        knownIds,
        source: session,
      };
      this.work.beginCreate(id, request);
      const controller = new AbortController();
      try {
        const observation = readWriteObservation<ViewInstance>(
          await withDeadline(
            () =>
              this.host.instance!.create!(
                structuredClone({
                  definitionId,
                  kind,
                  title,
                  scope,
                  config,
                }) as ViewCreateInput,
                {
                  requestId: request.requestId,
                  signal: controller.signal,
                  definitionRevision,
                },
              ),
            this.store.limits.writeTimeoutMs,
            controller,
          ),
        );
        // A rejection keyed by this request identity proves the intent did not commit,
        // even when a full reload has since preserved it as a recovery context.
        if (
          observation.outcome === 'rejected' &&
          !previous &&
          this.work.createRequest(id) === request
        ) {
          this.work.finishCreate(id);
          this.work.finishWrite(id, token, () => {
            this.store.clearPendingCreate(id);
            if (this.store.find(id)?.requiresReload)
              this.store.patch(id, { requiresReload: false, writeError: null });
          });
        }
        return observation;
      } catch (error) {
        // The request left the engine; nothing proves it did not commit.
        ctx.requireReload();
        if (!this.work.unverifiedCreate(id)) this.work.markCreateUnverified(id);
        throw error;
      }
    }
    const requestId = crypto.randomUUID();
    this.work.noteRequestId(id, requestId);
    const controller = new AbortController();
    try {
      return readWriteObservation<ViewInstance>(
        await withDeadline(
          () =>
            this.host.instance!.save!(structuredClone(submitted), {
              requestId,
              signal: controller.signal,
              definitionRevision,
            }),
          this.store.limits.writeTimeoutMs,
          controller,
        ),
      );
    } catch (error) {
      ctx.requireReload();
      this.work.recordPendingWrite(id, { action: 'save', requestId });
      throw error;
    }
  }

  private reconcileCreate(
    prepared: PreparedWrite,
    committed: CommittedInstance,
    ctx: WriteContext,
  ): string | typeof WRITE_ABORT {
    const id = ctx.id();
    const definition = this.store.definition();
    const { submitted, knownIds } = prepared;
    const { token, current } = ctx;
    const selection = ctx.selection();
    const result = committed.value;
    let selectedCopy: string | undefined;
    // From here on the receipt is authoritative; validation failures need reconciliation, not a retry.
    ctx.requireReload();
    this.work.markCreateUnverified(
      id,
      result &&
        typeof result === 'object' &&
        typeof (result as { id?: unknown }).id === 'string' &&
        (result as { id: string }).id.trim() &&
        !knownIds.has((result as { id: string }).id)
        ? (result as { id: string }).id
        : null,
    );
    validateViewInstance(result, definition, undefined);
    if (knownIds.has(result.id)) throw new Error('另存返回的实例 ID 已存在');
    if (result.revision !== committed.revision)
      throw new Error('创建回执的版本与实例不一致，请重新加载核对');
    if (!sameJsonState(instanceContent(result), instanceContent(submitted)))
      throw new Error('保存结果不符合原样保存契约，请重新加载核对');
    const saved = copy(result);
    const createdId = saved.id;
    this.work.finishCreate(id);
    let created = {
      ...createSession(
        saved,
        definition,
        this.store.filterCompilers,
        this.store.analysisCompilers,
      ),
      visibility: committed.visibility,
    };
    const creatingSource = this.store.session(id);
    if (creatingSource.kind === 'dashboard' && !creatingSource.persisted)
      created = {
        ...inheritEditingSession(
          saved,
          creatingSource,
          definition,
          this.store.filterCompilers,
          withContent(saved, creatingSource.instance),
          this.store.analysisCompilers,
        ),
        visibility: committed.visibility,
      };
    if (
      this.store.getSnapshot().selectedInstanceId === id &&
      this.scope.selection === selection
    ) {
      selectedCopy = saved.id;
      const navigation = this.scope.advanceSelection();
      if (!current()) return WRITE_ABORT;
      this.queries.cancel(id);
      if (!current()) return WRITE_ABORT;
      // Cancellation notifies subscribers; a newer navigation owns the selection.
      if (
        this.scope.selection !== navigation ||
        this.store.getSnapshot().selectedInstanceId !== id
      )
        selectedCopy = undefined;
      else if (!this.store.find(saved.id))
        created = {
          ...inheritEditingSession(
            saved,
            this.store.session(id),
            definition,
            this.store.filterCompilers,
            creatingSource.kind === 'dashboard' && !creatingSource.persisted
              ? withContent(saved, this.store.session(id).instance)
              : undefined,
            this.store.analysisCompilers,
          ),
          visibility: committed.visibility,
        };
    }
    if (this.work.isDeleted(saved.id)) {
      this.work.finishWrite(id, token, () =>
        this.store.patch(id, {
          writeStatus: 'idle',
          writeError: null,
          requiresReload: false,
        }),
      );
      return WRITE_ABORT;
    }

    const source = this.store.session(id);
    const draft = source.kind === 'dashboard' && !source.persisted;
    const remaining = { ...this.store.getSnapshot().sessions };
    if (draft) delete remaining[id];
    this.loader.addCatalogued(saved.id);
    this.work.finishWrite(id, token, () =>
      this.store.publish({
        instanceIds: [
          ...new Set([...this.store.getSnapshot().instanceIds, saved.id]),
        ],
        sessions: {
          ...remaining,
          ...(!draft
            ? {
                [id]: {
                  ...source,
                  writeStatus: 'idle' as const,
                  writeError: null,
                  requiresReload: false,
                },
              }
            : {}),
          // Cancellation notifies observers; an opened copy may now own newer edits.
          [saved.id]: this.store.find(saved.id) ?? created,
        },
        ...(selectedCopy
          ? { selectedInstanceId: selectedCopy, error: null }
          : {}),
      }),
    );
    return createdId;
  }

  private reconcileSave(
    prepared: PreparedWrite,
    committed: CommittedInstance,
    ctx: WriteContext,
  ): void {
    const id = ctx.id();
    const definition = this.store.definition();
    const { submitted } = prepared;
    const { token } = ctx;
    ctx.requireReload();
    const result = committed.value;
    validateViewInstance(result, definition, id);
    if (result.revision !== committed.revision)
      throw new Error('保存回执的版本与实例不一致，请重新加载核对');
    if (!sameJsonState(instanceContent(result), instanceContent(submitted)))
      throw new Error('保存结果不符合原样保存契约，请重新加载核对');
    const saved = copy(result);
    const latest = this.store.session(id);
    this.work.clearPendingWrite(id);
    this.work.finishWrite(id, token, () =>
      this.store.patch(id, {
        ...baselinePatch(saved, latest.instance),
        conflict: undefined,
        writeStatus: 'idle',
        writeError: null,
        visibility: committed.visibility,
      }),
    );
  }
}
