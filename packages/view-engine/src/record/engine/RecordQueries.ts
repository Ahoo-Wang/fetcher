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

import type { RecordQuerySource } from '../recordModel.js';
import type { ViewHost } from '../ViewHost.js';
import { validateRecordRows } from '../recordValidation.js';
import { getRecordRefreshBlockReason } from '../recordRefreshPolicy.js';
import { cloneSnapshot } from '../../lib/types.js';
import type { EngineScope } from './EngineScope.js';
import type { SessionStore } from './SessionStore.js';
import type { RecordSummaries } from './RecordSummaries.js';
import { copy, message } from './recordSnapshot.js';

/** Owns record reads; pagination and UI edits only submit explicit query commands. */
export class RecordQueries {
  private readonly queries = new Map<string, AbortController>();
  constructor(
    private readonly store: SessionStore,
    private readonly scope: EngineScope,
    private readonly host: ViewHost,
    private readonly summaries: RecordSummaries,
  ) {}
  reset(): void {
    this.queries.forEach(controller => controller.abort());
    this.queries.clear();
    this.summaries.reset();
  }

  cancel(id: string): void {
    this.replaceController(id);
  }

  private replaceController(id: string, next?: AbortController): void {
    const previous = this.queries.get(id);
    if (next) this.queries.set(id, next);
    else this.queries.delete(id);
    previous?.abort();
    // Abort listeners may already have started a newer read.
    if (this.queries.get(id) !== next) return;
    const session = this.store.find(id);
    if (session?.queryStatus === 'loading' || session?.refreshing)
      this.store.patch(id, {
        refreshing: false,
        ...(session.queryStatus === 'loading' ? { queryStatus: 'idle' } : {}),
      });
  }

  async run(id: string, background = false): Promise<void> {
    const session = this.store.session(id);
    const definition = this.store.definition();
    const lifecycle = this.scope.version;
    const controller = new AbortController();
    const current = () =>
      this.scope.current(lifecycle) && this.queries.get(id) === controller;
    this.replaceController(id, controller);
    if (!current()) return;
    this.store.patch(
      id,
      background
        ? { refreshing: true, queryError: null }
        : {
            rows: [],
            selectedRowKeys: [],
            total: null,
            nextCursor: null,
            queryError: null,
            queryStatus: 'loading',
            refreshing: false,
          },
    );
    if (!background) this.summaries.sync(id, undefined, false);
    try {
      if (!current()) return;
      const filter = session.appliedFilter;
      if (filter === null)
        throw new Error('筛选组件配置无法编译，请先修正筛选');
      const source = await this.host.resolveSource(definition.sourceId);
      if (!current()) return;
      const { sort, pagination } = session.instance.config;
      if (!source || typeof source[pagination.mode] !== 'function')
        throw new Error(`数据源不支持 ${pagination.mode} 分页查询`);
      if (!background) this.summaries.sync(id, source);
      if (!current()) return;
      const result =
        pagination.mode === 'paged'
          ? await source.paged!(
              cloneSnapshot<
                Parameters<NonNullable<RecordQuerySource['paged']>>[0]
              >({
                filter,
                sort,
                pagination: { index: session.page, size: pagination.size },
              }),
              undefined,
              controller,
            )
          : await source.cursor!(
              cloneSnapshot<
                Parameters<NonNullable<RecordQuerySource['cursor']>>[0]
              >({
                filter,
                sort,
                size: pagination.size,
                cursor: session.cursor,
              }),
              undefined,
              controller,
            );
      if (!current()) return;
      if (!result || typeof result !== 'object' || Array.isArray(result))
        throw new Error('查询结果必须是分页对象');
      validateRecordRows(result.list, definition.rowKey);
      let total: number | null = null;
      let nextCursor: string | null = null;
      if (pagination.mode === 'paged') {
        if (
          !('total' in result) ||
          !Number.isSafeInteger(result.total) ||
          result.total < 0
        )
          throw new Error('查询结果 total 必须是非负整数');
        total = result.total;
      } else {
        if (
          !('nextCursor' in result) ||
          (result.nextCursor !== null &&
            (typeof result.nextCursor !== 'string' || !result.nextCursor))
        )
          throw new Error('查询结果 nextCursor 必须是非空字符串或 null');
        nextCursor = result.nextCursor;
      }
      if (background) this.summaries.invalidate(id);
      if (!current()) return;
      this.store.patch(id, {
        rows: copy(result.list),
        refreshing: false,
        total,
        nextCursor,
        queryStatus: 'success',
      });
      this.summaries.sync(id, source);
    } catch (error) {
      if (!current()) return;
      this.store.patch(id, {
        queryStatus: 'error',
        queryError: message(error),
        refreshing: false,
      });
      if (!background) this.summaries.updatePage(id);
      throw error;
    } finally {
      if (this.queries.get(id) === controller) this.queries.delete(id);
    }
  }

  async refresh(
    id?: string,
    options?: { background?: boolean },
  ): Promise<void> {
    const session = this.store.session(id);
    if (options?.background) {
      if (getRecordRefreshBlockReason(session)) return;
      await this.run(session.instance.id, true);
      return;
    }
    this.summaries.invalidate(session.instance.id);
    if (session.instance.config.pagination.mode === 'cursor')
      this.store.patch(session.instance.id, { page: 1, cursor: null });
    await this.run(session.instance.id);
  }
}
