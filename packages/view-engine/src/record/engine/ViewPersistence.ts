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

import type { ViewInstance, SaveAsScope } from '../recordModel.js';
import type { ViewHost } from '../ViewHost.js';
import { validateViewInstance } from '../recordValidation.js';
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
import { ViewServiceError } from '../viewServiceContract.js';
import { permissionsFor } from './instancePermissions.js';

/** Saved configuration writes and their immutable response reconciliation. */
export class ViewPersistence {
  constructor(
    private readonly store: SessionStore,
    private readonly scope: EngineScope,
    private readonly host: ViewHost,
    private readonly work: InstanceWork,
    private readonly queries: RecordQueries,
  ) {}

  async save(id?: string): Promise<void> {
    await this.write(undefined, id);
  }

  async saveAs(
    options: { title: string; scope: SaveAsScope },
    id?: string,
  ): Promise<void> {
    await this.write(options, id);
  }

  private async write(
    options: { title: string; scope: SaveAsScope } | undefined,
    id?: string,
  ): Promise<void> {
    const session = this.store.session(id);
    id = session.instance.id;
    const definition = this.store.definition();
    const lifecycle = this.scope.version;
    const token = Symbol();
    const selection = this.scope.selection;
    let received = false;
    let selectedCopy: string | undefined;
    const current = () =>
      this.scope.current(lifecycle) && this.work.writes.get(id) === token;
    try {
      if (session.filterPending)
        throw new Error('请先查询或撤销筛选修改，再保存视图');
      this.work.assertWritable(session);
      const permissions = permissionsFor(this.host, session);
      if (
        options &&
        !(
          options.scope?.type === 'personal' ||
          (options.scope?.type === 'public' &&
            options.scope.source === 'shared')
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
          : session.instance,
      );
      validateViewInstance(submitted, definition, id);
      const knownIds = new Set(this.store.getSnapshot().instanceIds);
      this.work.writes.set(id, token);
      this.store.patch(id, {
        writeStatus: options ? 'creating' : 'saving',
        writeError: null,
      });
      if (!current()) return;
      let result: ViewInstance;
      if (options) {
        const { definitionId, kind, title, scope, config } = submitted;
        const previous = this.work.createRequests.get(id);
        if (
          previous &&
          !sameFilterState(
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
        };
        this.work.createRequests.set(id, request);
        try {
          result = await this.host.instance!.create!(
            structuredClone({ definitionId, kind, title, scope, config }),
            { requestId: request.requestId },
          );
          this.work.createRequests.delete(id);
        } catch (error) {
          if (
            !(error instanceof ViewServiceError) ||
            ['UNKNOWN_OUTCOME', 'UNAVAILABLE'].includes(error.code)
          ) {
            if (!this.work.unverifiedCreates.has(id))
              this.work.unverifiedCreates.set(id, {
                id: null,
                submitted,
                knownIds,
              });
          } else {
            this.work.createRequests.delete(id);
          }
          throw error;
        }
      } else
        result = await this.host.instance!.save!(structuredClone(submitted));
      if (!current()) return;
      received = true;
      if (options)
        this.work.unverifiedCreates.set(id, {
          id:
            result &&
            typeof result.id === 'string' &&
            result.id.trim() &&
            !knownIds.has(result.id)
              ? result.id
              : null,
          submitted,
          knownIds,
        });
      validateViewInstance(result, definition, options ? undefined : id);
      if (options && this.store.find(result.id))
        throw new Error('另存返回的实例 ID 已存在');
      if (!sameFilterState(instanceContent(result), instanceContent(submitted)))
        throw new Error('保存结果不符合原样保存契约，请重新加载核对');
      const saved = copy(result);
      if (options) this.work.unverifiedCreates.delete(id);
      const latest = this.store.session(id);
      if (options) {
        let created = createSession(
          saved,
          definition,
          this.store.filterCompilers,
        );
        if (
          this.store.getSnapshot().selectedInstanceId === id &&
          this.scope.selection === selection
        ) {
          selectedCopy = saved.id;
          const navigation = this.scope.advanceSelection();
          if (!current()) return;
          this.queries.cancel(id);
          if (!current()) return;
          // Cancellation notifies subscribers; a newer navigation owns the selection.
          if (
            this.scope.selection !== navigation ||
            this.store.getSnapshot().selectedInstanceId !== id
          )
            selectedCopy = undefined;
          else
            created = inheritEditingSession(
              saved,
              this.store.session(id),
              definition,
              this.store.filterCompilers,
            );
        }
        this.store.publish({
          instanceIds: [...this.store.getSnapshot().instanceIds, saved.id],
          sessions: {
            ...this.store.getSnapshot().sessions,
            [id]: {
              ...this.store.session(id),
              writeStatus: 'idle',
              writeError: null,
            },
            [saved.id]: created,
          },
          ...(selectedCopy
            ? { selectedInstanceId: selectedCopy, error: null }
            : {}),
        });
      } else
        this.store.patch(id, {
          baseline: saved,
          instance: {
            ...saved,
            title: latest.instance.title,
            config: latest.instance.config,
          },
          writeStatus: 'idle',
          writeError: null,
        });
    } catch (error) {
      if (
        !this.scope.current(lifecycle) ||
        (this.work.writes.has(id) && this.work.writes.get(id) !== token)
      ) {
        if (this.scope.current(lifecycle)) throw error;
        return;
      }
      this.store.patch(id, {
        writeError: message(error),
        ...(this.work.writes.get(id) === token ? { writeStatus: 'idle' } : {}),
        ...(received ? { requiresReload: true } : {}),
      });
      throw error;
    } finally {
      if (this.work.writes.get(id) === token) this.work.writes.delete(id);
    }
    if (
      selectedCopy &&
      this.scope.current(lifecycle) &&
      this.store.getSnapshot().selectedInstanceId === selectedCopy
    )
      await this.queries.run(selectedCopy);
  }
}
