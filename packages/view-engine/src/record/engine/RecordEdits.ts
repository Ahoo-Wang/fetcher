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

import type { FieldSort, FilterExpression } from '@ahoo-wang/fetcher-wow';
import type { FilterDraftNode, FilterMode } from '../../filter/filterModel.js';
import {
  compileFilterDraft,
  createFilterConfiguration,
  compileFilterConfiguration,
  restoreFilterConfiguration,
  isSimpleFilter,
} from '../../filter/filterCore.js';
import { validateFilterJson } from '../../filter/filterConfigurationValidation.js';
import { sameFilterQuery, sameFilterState } from '../../filter/filterTree.js';
import type { DeepReadonly } from '../../lib/types.js';
import type { RecordColumn, RecordKey } from '../recordModel.js';
import { getRecordKey } from '../recordValidation.js';
import type { SessionStore } from './SessionStore.js';
import type { RecordQueries } from './RecordQueries.js';
import type { RecordSummaries } from './RecordSummaries.js';
import { copy } from './recordSnapshot.js';
import { isSystemSession } from './sessionState.js';

/** Explicit session edits, validation and the queries each edit requires. */
export class RecordEdits {
  constructor(
    private readonly store: SessionStore,
    private readonly queries: RecordQueries,
    private readonly summaries: RecordSummaries,
  ) {}

  async applyFilter(
    expression?: DeepReadonly<FilterExpression>,
    id?: string,
  ): Promise<void> {
    const session = this.store.session(id);
    if (!session.filterValid)
      throw new Error('筛选输入无效，请先修正或撤销修改');
    const definition = this.store.definition();
    const compiled = compileFilterDraft(
      session.filterDraft,
      definition.fields,
      definition.allowedOperators,
      this.store.filterCompilers,
      definition.filterEditors,
    );
    if (compiled.errors.length || !compiled.expression)
      throw new Error(
        compiled.errors.map(error => error.message).join('；') ||
          '筛选组件无法编译',
      );
    if (
      expression !== undefined &&
      !sameFilterQuery(compiled.expression, expression)
    )
      throw new Error('查询条件必须由当前筛选组件配置编译生成');
    const filterDraft = session.filterDraft;
    const filterMode = isSimpleFilter(filterDraft)
      ? session.filterMode
      : 'advanced';
    const filters = createFilterConfiguration(
      filterDraft,
      filterMode,
      definition.fields,
      definition.filterEditors,
    );
    const editingBaseline = copy(filterDraft);
    this.store.updateInstance(
      session,
      {
        ...session.instance,
        config: { ...session.instance.config, filters },
      },
      {
        filterDraft: editingBaseline,
        filterBaseline: editingBaseline,
        filterValid: true,
        page: 1,
        cursor: null,
        filterMode,
        appliedFilter: compiled.expression,
      },
    );
    this.summaries.invalidate(session.instance.id);
    await this.queries.run(session.instance.id);
  }

  setFilterDraft(
    draft: DeepReadonly<FilterDraftNode>,
    id?: string,
    valid?: boolean,
  ): void {
    const session = this.store.session(id);
    const nextValid = valid === undefined ? session.filterValid : valid;
    if (typeof nextValid !== 'boolean')
      throw new Error('筛选有效性必须是布尔值');
    validateFilterJson(draft);
    if (
      sameFilterState(session.filterDraft, draft) &&
      session.filterValid === nextValid
    )
      return;
    const patch = { filterDraft: copy(draft), filterValid: nextValid };
    const definition = this.store.definition();
    const compiled = compileFilterDraft(
      draft,
      definition.fields,
      definition.allowedOperators,
      this.store.filterCompilers,
      definition.filterEditors,
    );
    if (
      nextValid &&
      !compiled.errors.length &&
      sameFilterQuery(compiled.expression, session.appliedFilter)
    ) {
      const filterMode = isSimpleFilter(draft)
        ? session.filterMode
        : 'advanced';
      const filters = createFilterConfiguration(
        draft,
        filterMode,
        definition.fields,
        definition.filterEditors,
      );
      this.store.updateInstance(
        session,
        {
          ...session.instance,
          config: { ...session.instance.config, filters },
        },
        { ...patch, filterBaseline: patch.filterDraft, filterMode },
      );
    } else this.store.patch(session.instance.id, patch);
  }

  setFilterValidity(valid: boolean, id?: string): void {
    if (typeof valid !== 'boolean') throw new Error('筛选有效性必须是布尔值');
    const session = this.store.session(id);
    this.setFilterDraft(session.filterDraft, session.instance.id, valid);
  }

  setFilterMode(mode: FilterMode, id?: string): void {
    const session = this.store.session(id);
    if (mode !== 'simple' && mode !== 'advanced')
      throw new Error('筛选模式无效');
    if (mode === 'simple' && !isSimpleFilter(session.filterDraft))
      throw new Error('当前条件需要高级筛选模式');
    if (session.filterMode === mode) return;
    if (session.filterPending)
      this.store.patch(session.instance.id, { filterMode: mode });
    else
      this.store.updateInstance(
        session,
        {
          ...session.instance,
          config: {
            ...session.instance.config,
            filters: { ...session.instance.config.filters, mode },
          },
        },
        { filterMode: mode },
      );
  }

  async setSort(sort: DeepReadonly<FieldSort[]>, id?: string): Promise<void> {
    const session = this.store.session(id);
    this.store.updateInstance(
      session,
      { ...session.instance, config: { ...session.instance.config, sort } },
      { page: 1, cursor: null },
    );
    await this.queries.run(session.instance.id);
  }

  setColumns(columns: DeepReadonly<RecordColumn[]>, id?: string): void {
    const session = this.store.session(id);
    const key = this.summaries.key(session);
    this.store.updateInstance(session, {
      ...session.instance,
      config: {
        ...session.instance.config,
        presentation: {
          ...session.instance.config.presentation,
          table: { columns },
        },
      },
    });
    if (key !== this.summaries.key(this.store.session(session.instance.id)))
      this.summaries.sync(session.instance.id);
  }

  async setPage(index: number, id?: string): Promise<void> {
    const session = this.store.session(id);
    if (session.instance.config.pagination.mode !== 'paged')
      throw new Error('游标分页仅支持向后加载下一页');
    if (!Number.isSafeInteger(index) || index < 1)
      throw new Error('页码必须是正整数');
    this.store.patch(session.instance.id, { page: index });
    await this.queries.run(session.instance.id);
  }

  async setPageSize(size: number, id?: string): Promise<void> {
    const session = this.store.session(id);
    this.store.updateInstance(
      session,
      {
        ...session.instance,
        config: {
          ...session.instance.config,
          pagination: { ...session.instance.config.pagination, size },
        },
      },
      { page: 1, cursor: null },
    );
    await this.queries.run(session.instance.id);
  }

  async nextPage(id?: string): Promise<void> {
    const session = this.store.session(id);
    if (session.instance.config.pagination.mode === 'paged')
      return this.setPage(session.page + 1, session.instance.id);
    if (session.queryStatus !== 'success' || session.nextCursor === null)
      return;
    this.store.patch(session.instance.id, {
      page: session.page + 1,
      cursor: session.nextCursor,
    });
    await this.queries.run(session.instance.id);
  }

  setTitle(title: string, id?: string): void {
    const session = this.store.session(id);
    if (isSystemSession(session)) throw new Error('系统视图不能编辑名称');
    this.store.updateInstance(session, { ...session.instance, title });
  }

  setSelection(keys: RecordKey[], id?: string): void {
    const session = this.store.session(id);
    const available = new Set(
      session.rows.map(row =>
        getRecordKey(row, this.store.definition().rowKey),
      ),
    );
    if (!Array.isArray(keys) || keys.some(key => !available.has(key)))
      throw new Error('选中记录必须属于当前查询结果');
    if (session.refreshing && keys.length)
      this.queries.cancel(session.instance.id);
    this.store.patch(session.instance.id, {
      selectedRowKeys: [...new Set(keys)],
    });
  }

  async restore(id?: string): Promise<void> {
    const session = this.store.session(id);
    this.summaries.invalidate(session.instance.id);
    const filters = session.baseline.config.filters;
    const filterDraft = restoreFilterConfiguration(filters);
    const definition = this.store.definition();
    const compiled = compileFilterConfiguration(
      filters,
      definition.fields,
      definition.allowedOperators,
      this.store.filterCompilers,
    );
    this.store.patch(session.instance.id, {
      instance: session.baseline,
      filterDraft,
      filterBaseline: filterDraft,
      filterValid: true,
      filterMode: filters.mode,
      appliedFilter: compiled.expression ?? null,
      page: 1,
      cursor: null,
      writeError: session.requiresReload ? session.writeError : null,
    });
    await this.queries.run(session.instance.id);
  }
}
