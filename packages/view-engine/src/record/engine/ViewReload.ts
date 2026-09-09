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

import type { ViewInstance } from '../recordModel.js';
import type { ViewHost } from '../ViewHost.js';
import { validateViewInstance } from '../recordValidation.js';
import { readInstanceList } from '../validation/instanceValidation.js';
import { sameFilterState } from '../../filter/filterTree.js';
import { permissionsFor } from './instancePermissions.js';
import type { EngineScope } from './EngineScope.js';
import type { SessionStore } from './SessionStore.js';
import type { InstanceWork } from './InstanceWork.js';
import type { RecordQueries } from './RecordQueries.js';
import { copy, message } from './recordSnapshot.js';
import {
  createSession,
  inheritEditingSession,
  instanceContent,
} from './sessionState.js';

/** Reload and uncertain-save-as reconciliation; never silently discards local edits. */
export class ViewReload {
  constructor(
    private readonly store: SessionStore,
    private readonly scope: EngineScope,
    private readonly host: ViewHost,
    private readonly work: InstanceWork,
    private readonly queries: RecordQueries,
  ) {}

  canReloadInstance(id = this.store.getSnapshot().selectedInstanceId): boolean {
    if (this.scope.disposed || !id || !this.store.find(id)) return false;
    const pending = this.work.unverifiedCreates.get(id);
    return pending
      ? Boolean(
          (pending.id &&
            (this.host.instance?.load || this.host.instance?.list)) ||
          (this.work.createRequests.has(id) && this.host.instance?.create),
        )
      : Boolean(this.host.instance?.load);
  }

  async reloadInstance(id?: string): Promise<void> {
    const session = this.store.session(id);
    id = session.instance.id;
    const lifecycle = this.scope.version;
    const definition = this.store.definition();
    const controller = new AbortController();
    let started = false;
    let queryId = id;
    const selection = this.scope.selection;
    try {
      const unverified = this.work.unverifiedCreates.get(id);
      if (!this.canReloadInstance(id))
        throw new Error('宿主未提供 instance.load，无法重新加载');
      if (this.work.writes.has(id))
        throw new Error('实例正在写入，请等待操作完成');
      const previous = this.work.reloads.get(id);
      this.work.reloads.set(id, controller);
      started = true;
      previous?.abort();
      if (this.work.reloads.get(id) !== controller) return;
      this.queries.cancel(id);
      if (
        !this.scope.current(lifecycle) ||
        this.work.reloads.get(id) !== controller
      )
        return;
      let result: ViewInstance;
      if (
        unverified?.id &&
        !this.host.instance?.load &&
        this.host.instance?.list
      ) {
        const list = await this.host.instance.list(
          definition.id,
          controller.signal,
        );
        if (
          !this.scope.current(lifecycle) ||
          this.work.reloads.get(id) !== controller
        )
          return;
        const matched = readInstanceList(list, definition).find(
          item => item.id === unverified.id,
        );
        if (!matched)
          throw new Error('实例列表未包含已返回的创建 ID，仍需核对');
        result = matched;
      } else if (unverified && (!unverified.id || !this.host.instance?.load)) {
        const request = this.work.createRequests.get(id);
        if (!request || !this.host.instance?.create)
          throw new Error('缺少原创建请求，无法确认另存结果');
        const permissions = permissionsFor(this.host, session);
        if (
          !(request.submitted.scope.type === 'personal'
            ? permissions.saveAsPersonal
            : permissions.saveAsShared)
        )
          throw new Error('宿主未允许重试此创建操作');
        // Replaying the original request is authoritative; list content is not identity.
        const { definitionId, kind, title, scope, config } = request.submitted;
        result = await this.host.instance.create(
          structuredClone({ definitionId, kind, title, scope, config }),
          { requestId: request.requestId, signal: controller.signal },
        );
        if (
          !this.scope.current(lifecycle) ||
          this.work.reloads.get(id) !== controller
        )
          return;
        validateViewInstance(result, definition, unverified.id ?? undefined);
        if (
          !sameFilterState(
            instanceContent(result),
            instanceContent(request.submitted),
          )
        )
          throw new Error('创建回执不符合原样保存契约，仍需核对');
      } else
        result = await this.host.instance!.load!(
          unverified?.id ?? id,
          controller.signal,
        );
      if (
        !this.scope.current(lifecycle) ||
        this.work.reloads.get(id) !== controller
      )
        return;
      validateViewInstance(
        result,
        definition,
        unverified ? (unverified.id ?? undefined) : id,
      );
      const baseline = copy(result);
      this.work.unverifiedDeletes.delete(id);
      const latest = this.store.session(id);
      if (unverified) {
        if (unverified.knownIds.has(baseline.id))
          throw new Error('另存结果没有新的实例 ID，仍需核对');
        const existing = this.store.find(baseline.id);
        // An already opened copy owns its own saves and drafts. A late reconciliation must not roll them back.
        const created =
          existing ??
          inheritEditingSession(
            baseline,
            latest,
            definition,
            this.store.filterCompilers,
            {
              ...baseline,
              title: unverified.submitted.title,
              scope: unverified.submitted.scope,
              config: latest.instance.config,
            },
          );
        const selectCopy =
          this.store.getSnapshot().selectedInstanceId === id &&
          this.scope.selection === selection;
        if (this.store.getSnapshot().selectedInstanceId === baseline.id)
          queryId = baseline.id;
        this.work.finishCreate(id);
        if (selectCopy) {
          this.scope.advanceSelection();
          queryId = baseline.id;
        }
        this.store.publish({
          instanceIds: [
            ...new Set([...this.store.getSnapshot().instanceIds, baseline.id]),
          ],
          sessions: {
            ...this.store.getSnapshot().sessions,
            [id]: { ...latest, writeError: null, requiresReload: false },
            [baseline.id]: created,
          },
          ...(selectCopy
            ? { selectedInstanceId: baseline.id, error: null }
            : {}),
        });
      } else {
        const next =
          latest.dirty || latest.filterPending || latest.requiresReload
            ? {
                ...latest,
                baseline,
                instance: {
                  ...baseline,
                  title: latest.instance.title,
                  scope: latest.instance.scope,
                  config: latest.instance.config,
                },
                writeError: null,
                requiresReload: false,
              }
            : createSession(baseline, definition, this.store.filterCompilers);
        this.store.patch(id, next);
      }
    } catch (error) {
      if (
        !this.scope.current(lifecycle) ||
        (started && this.work.reloads.get(id) !== controller)
      )
        return;
      this.store.patch(id, { writeError: message(error) });
      throw error;
    } finally {
      if (this.work.reloads.get(id) === controller)
        this.work.reloads.delete(id);
    }
    if (
      this.scope.current(lifecycle) &&
      this.store.getSnapshot().selectedInstanceId === queryId
    )
      await this.queries.refresh(queryId);
  }
}
