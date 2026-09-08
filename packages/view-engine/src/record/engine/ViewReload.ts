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

import type { RecordSession, ViewHost, ViewInstance } from '../recordModel.js';
import { validateViewInstance } from '../recordValidation.js';
import { readInstanceList } from '../validation/instanceValidation.js';
import { sameFilterState } from '../../filter/filterTree.js';
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
          (pending.id && this.host.loadInstance) || this.host.listInstances,
        )
      : Boolean(this.host.loadInstance);
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
        throw new Error('宿主未提供 loadInstance，无法重新加载');
      if (this.work.writes.has(id))
        throw new Error('实例正在写入，请等待操作完成');
      this.work.reloads.get(id)?.abort();
      this.work.reloads.set(id, controller);
      started = true;
      this.queries.cancel(id);
      let result: ViewInstance;
      const additions: Record<string, RecordSession> = Object.create(null);
      if (unverified && (!unverified.id || !this.host.loadInstance)) {
        const list = await this.host.listInstances!(
          definition.id,
          controller.signal,
        );
        if (
          !this.scope.current(lifecycle) ||
          this.work.reloads.get(id) !== controller
        )
          return;
        const instances = readInstanceList(list, definition);
        for (const item of instances) {
          if (!this.store.find(item.id))
            additions[item.id] = createSession(
              copy(item),
              definition,
              this.store.filterCompilers,
            );
        }
        const candidates = instances.filter(item =>
          unverified.id
            ? item.id === unverified.id
            : !unverified.knownIds.has(item.id) &&
              sameFilterState(
                instanceContent(item),
                instanceContent(unverified.submitted),
              ),
        );
        if (candidates.length !== 1) {
          this.store.publish({
            instanceIds: [
              ...this.store.getSnapshot().instanceIds,
              ...Object.keys(additions),
            ],
            sessions: { ...this.store.getSnapshot().sessions, ...additions },
          });
          throw new Error(
            '无法确定另存结果；已重新加载实例列表，请核对服务端创建结果',
          );
        }
        result = candidates[0];
      } else
        result = await this.host.loadInstance!(
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
        this.work.unverifiedCreates.delete(id);
        if (selectCopy) {
          this.scope.advanceSelection();
          queryId = baseline.id;
        }
        this.store.publish({
          instanceIds: [
            ...new Set([
              ...this.store.getSnapshot().instanceIds,
              ...Object.keys(additions),
              baseline.id,
            ]),
          ],
          sessions: {
            ...this.store.getSnapshot().sessions,
            ...additions,
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
