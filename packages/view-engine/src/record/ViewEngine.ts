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
import {
  compileFilterDraft,
  createFilterDraft,
  isSimpleFilter,
} from '../filter/filterCore.js';
import type { FilterDraftNode, FilterMode } from '../filter/filterModel.js';
import { cloneSnapshot, type DeepReadonly } from '../lib/types.js';
import { isFilterDraftPending, sameFilterState } from '../filter/filterTree.js';
import { getRecordRefreshBlockReason } from './recordRefreshPolicy.js';
import { getRecordSummaryMetrics } from './recordPresentation.js';
import type {
  RecordColumn,
  RecordQuerySource,
  RecordKey,
  RecordSession,
  RecordSummaryResult,
  SaveAsScope,
  ViewDefinition,
  ViewEngineOptions,
  ViewEngineState,
  ViewHost,
  ViewInstance,
  ViewInstanceList,
  ViewInstancePermissions,
} from './recordModel.js';
import {
  getRecordKey,
  validateRecordRows,
  validateViewDefinition,
  validateViewInstance,
} from './recordValidation.js';
import {
  calculateRecordSummary,
  createRecordSummaryQuery,
  EMPTY_RECORD_SUMMARY,
  readRecordSummaryResult,
} from './recordSummary.js';

function freeze<T>(value: T, ancestors = new Set<object>()): T {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  )
    return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object') throw new Error('视图数据必须可序列化为 JSON');
  if (Object.isFrozen(value)) return value;
  if (
    (!Array.isArray(value) &&
      Object.prototype.toString.call(value) !== '[object Object]') ||
    ancestors.has(value)
  )
    throw new Error('视图数据必须为无循环引用的 JSON 数据');
  ancestors.add(value);
  Object.values(value).forEach(item => freeze(item, ancestors));
  ancestors.delete(value);
  return Object.freeze(value);
}

function copy<T>(value: T): T {
  try {
    return freeze(structuredClone(value));
  } catch (error) {
    throw Object.assign(
      new Error(`视图数据包含非 JSON 值：${message(error)}`),
      { cause: error },
    );
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sessionFor(instance: ViewInstance): RecordSession {
  const filterDraft = createFilterDraft(instance.config.filter);
  return {
    baseline: instance,
    instance,
    dirty: false,
    filterDraft,
    filterBaseline: filterDraft,
    filterValid: true,
    filterMode: isSimpleFilter(filterDraft) ? 'simple' : 'advanced',
    filterPending: false,
    page: 1,
    cursor: null,
    nextCursor: null,
    rows: [],
    total: null,
    pageSummary: EMPTY_RECORD_SUMMARY,
    allSummary: EMPTY_RECORD_SUMMARY,
    selectedRowKeys: [],
    queryStatus: 'idle',
    refreshing: false,
    queryError: null,
    writeStatus: 'idle',
    writeError: null,
    requiresReload: false,
  };
}

function content({ title, scope, config }: DeepReadonly<ViewInstance>) {
  return { title, scope, config };
}

function edited(session: RecordSession): RecordSession {
  return {
    ...session,
    filterPending: isFilterDraftPending(
      session.filterDraft,
      session.filterBaseline,
      session.filterValid,
    ),
    dirty: !sameFilterState(
      content(session.instance),
      content(session.baseline),
    ),
  };
}

/** A fixed-scope host and independent immutable sessions, with server-side queries. */
export class ViewEngine {
  private readonly host: ViewHost;
  private readonly definitionId: string;
  private readonly localDefinition?: ViewDefinition;
  private readonly localInstances?: ViewInstanceList;
  private readonly inputError?: unknown;
  private state: ViewEngineState = freeze({
    status: 'idle',
    error: null,
    definition: null,
    instanceIds: [],
    selectedInstanceId: null,
    sessions: Object.create(null),
  });
  private readonly listeners = new Set<() => void>();
  private disposed = false;
  private lifecycle = 0;
  private selection = 0;
  private ordering?: symbol;
  private loadController?: AbortController;
  private selectController?: AbortController;
  private readonly queries = new Map<string, AbortController>();
  private readonly reloads = new Map<string, AbortController>();
  private readonly writes = new Map<string, symbol>();
  private readonly summaryQueries = new Map<string, AbortController>();
  private readonly summaryKeys = new Map<string, string>();
  private readonly unverifiedCreates = new Map<
    string,
    {
      id: string | null;
      submitted: ViewInstance;
      knownIds: ReadonlySet<string>;
    }
  >();

  constructor(options: ViewEngineOptions) {
    this.host = options.host;
    this.definitionId = options.definitionId;
    try {
      this.localDefinition =
        options.definition === undefined ? undefined : copy(options.definition);
      this.localInstances =
        options.instances === undefined ? undefined : copy(options.instances);
    } catch (error) {
      this.inputError = error;
    }
  }

  getSnapshot = (): ViewEngineState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    if (!this.disposed) this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(patch: Partial<ViewEngineState>): void {
    if (this.disposed) return;
    this.state = freeze({ ...this.state, ...patch });
    this.listeners.forEach(listener => listener());
  }

  private patch(id: string, patch: Partial<RecordSession>): void {
    const session = this.find(id);
    if (!session || this.disposed) return;
    this.publish({
      sessions: {
        ...this.state.sessions,
        [id]: edited({ ...session, ...patch }),
      },
    });
  }

  private find(id: string): RecordSession | undefined {
    return Object.prototype.hasOwnProperty.call(this.state.sessions, id)
      ? this.state.sessions[id]
      : undefined;
  }

  private active(): void {
    if (this.disposed) throw new Error('视图引擎已释放');
  }

  private current(lifecycle: number): boolean {
    return !this.disposed && this.lifecycle === lifecycle;
  }

  private definition(): ViewDefinition {
    this.active();
    if (!this.state.definition) throw new Error('视图定义尚未加载');
    return this.state.definition;
  }

  private session(id = this.state.selectedInstanceId): RecordSession {
    this.active();
    if (id === null || !this.find(id))
      throw new Error('请先选择有效的视图实例');
    return this.find(id)!;
  }

  private cancelQuery(id: string): void {
    const controller = this.queries.get(id);
    this.queries.delete(id);
    controller?.abort();
    const session = this.find(id);
    if (session?.queryStatus === 'loading' || session?.refreshing)
      this.patch(id, {
        refreshing: false,
        ...(session.queryStatus === 'loading' ? { queryStatus: 'idle' } : {}),
      });
  }

  private invalidateSummary(id: string): void {
    const controller = this.summaryQueries.get(id);
    this.summaryQueries.delete(id);
    this.summaryKeys.delete(id);
    if (this.find(id)?.allSummary.status !== 'idle')
      this.patch(id, { allSummary: EMPTY_RECORD_SUMMARY });
    controller?.abort();
  }

  private summaryKey(session: RecordSession): string | undefined {
    const metrics = getRecordSummaryMetrics(
      session.instance.config.presentation,
    );
    if (!metrics.length) return undefined;
    return JSON.stringify([
      session.instance.config.filter,
      metrics.map(({ id, field, function: fn }) => [id, field, fn]),
    ]);
  }

  private updatePageSummary(id: string): void {
    const session = this.session(id);
    const metrics = getRecordSummaryMetrics(
      session.instance.config.presentation,
    );
    let pageSummary: RecordSummaryResult = EMPTY_RECORD_SUMMARY;
    if (metrics.length) {
      if (session.queryStatus === 'loading')
        pageSummary = { status: 'loading', values: {}, error: null };
      else if (session.queryStatus === 'success') {
        try {
          pageSummary = {
            status: 'success',
            values: calculateRecordSummary(session.rows, metrics),
            error: null,
          };
        } catch (error) {
          pageSummary = { status: 'error', values: {}, error: message(error) };
        }
      }
    }
    if (!sameFilterState(session.pageSummary, pageSummary))
      this.patch(id, { pageSummary });
  }

  private syncSummaries(
    id: string,
    source?: RecordQuerySource,
    request = true,
  ): void {
    if (this.disposed || !this.find(id)) return;
    const lifecycle = this.lifecycle;
    this.updatePageSummary(id);
    if (!this.current(lifecycle) || !this.find(id)) return;
    const session = this.session(id);
    if (this.summaryKeys.get(id) !== this.summaryKey(session))
      this.invalidateSummary(id);
    if (request) void this.querySummary(id, source).catch(() => {});
  }

  private async querySummary(
    id: string,
    source?: RecordQuerySource,
  ): Promise<void> {
    const session = this.session(id);
    const key = this.summaryKey(session);
    if (
      !key ||
      (this.summaryKeys.get(id) === key && session.allSummary.status !== 'idle')
    )
      return;
    const lifecycle = this.lifecycle;
    this.invalidateSummary(id);
    if (!this.current(lifecycle) || !this.find(id)) return;
    const latest = this.session(id);
    if (this.summaryKey(latest) !== key || this.summaryKeys.get(id) === key)
      return;
    const controller = new AbortController();
    this.summaryQueries.set(id, controller);
    this.summaryKeys.set(id, key);
    const current = () =>
      this.current(lifecycle) && this.summaryQueries.get(id) === controller;
    const metrics = getRecordSummaryMetrics(
      session.instance.config.presentation,
    );
    this.patch(id, {
      allSummary: { status: 'loading', values: {}, error: null },
    });
    try {
      if (!current()) return;
      source ??= await this.host.resolveSource(this.definition().sourceId);
      if (!current()) return;
      if (!source.aggregate)
        throw new Error('数据源未提供 aggregate，无法汇总所有记录');
      const result = await source.aggregate(
        createRecordSummaryQuery(session.instance.config.filter, metrics),
        undefined,
        controller,
      );
      if (!current()) return;
      this.patch(id, {
        allSummary: {
          status: 'success',
          values: copy(readRecordSummaryResult(result, metrics)),
          error: null,
        },
      });
    } catch (error) {
      if (!current()) return;
      this.patch(id, {
        allSummary: { status: 'error', values: {}, error: message(error) },
      });
      throw error;
    } finally {
      if (this.summaryQueries.get(id) === controller)
        this.summaryQueries.delete(id);
    }
  }

  async refreshSummary(id?: string): Promise<void> {
    const session = this.session(id);
    this.updatePageSummary(session.instance.id);
    this.invalidateSummary(session.instance.id);
    await this.querySummary(session.instance.id);
  }

  async load(): Promise<void> {
    this.active();
    const lifecycle = ++this.lifecycle;
    ++this.selection;
    this.loadController?.abort();
    this.selectController?.abort();
    this.reloads.forEach(controller => controller.abort());
    this.reloads.clear();
    this.queries.forEach(controller => controller.abort());
    this.queries.clear();
    this.summaryQueries.forEach(controller => controller.abort());
    this.summaryQueries.clear();
    this.summaryKeys.clear();
    const controller = new AbortController();
    this.loadController = controller;
    this.publish({
      status: 'loading',
      error: null,
      definition: null,
      instanceIds: [],
      selectedInstanceId: null,
      sessions: Object.create(null),
    });
    let defaultId: string | null = null;
    try {
      if (this.inputError) throw this.inputError;
      const [definition, list] = await Promise.all([
        Promise.resolve().then(() => {
          if (this.localDefinition !== undefined) return this.localDefinition;
          if (!this.host.loadDefinition)
            throw new Error('缺少视图定义或 loadDefinition');
          return this.host.loadDefinition(this.definitionId, controller.signal);
        }),
        Promise.resolve().then(() => {
          if (this.localInstances !== undefined) return this.localInstances;
          if (!this.host.listInstances)
            throw new Error('缺少实例列表或 listInstances');
          return this.host.listInstances(this.definitionId, controller.signal);
        }),
      ]);
      if (!this.current(lifecycle)) return;
      validateViewDefinition(definition);
      if (definition.id !== this.definitionId)
        throw new Error('返回的视图定义 ID 不匹配');
      if (!list || !Array.isArray(list.instances))
        throw new Error('实例列表必须包含 instances 数组');
      const sessions: Record<string, RecordSession> = Object.create(null);
      for (const instance of list.instances) {
        validateViewInstance(instance, definition);
        if (Object.prototype.hasOwnProperty.call(sessions, instance.id))
          throw new Error(`实例 ID 重复：${instance.id}`);
        sessions[instance.id] = {
          ...sessionFor(copy(instance)),
          requiresReload: this.unverifiedCreates.has(instance.id),
          writeError: this.unverifiedCreates.has(instance.id)
            ? '另存结果尚未核对，请重新加载核对'
            : null,
        };
      }
      if (
        typeof list.defaultInstanceId === 'string' &&
        Object.prototype.hasOwnProperty.call(sessions, list.defaultInstanceId)
      )
        defaultId = list.defaultInstanceId;
      this.publish({
        status: 'ready',
        error: null,
        definition: copy(definition),
        instanceIds: list.instances.map(instance => instance.id),
        selectedInstanceId: defaultId,
        sessions,
      });
    } catch (error) {
      if (!this.current(lifecycle)) return;
      controller.abort();
      this.publish({ status: 'error', error: message(error) });
      throw error;
    }
    if (
      defaultId !== null &&
      this.current(lifecycle) &&
      this.state.selectedInstanceId === defaultId
    )
      await this.query(defaultId);
  }

  async selectInstance(id: string): Promise<void> {
    const definition = this.definition();
    const lifecycle = this.lifecycle;
    const selection = ++this.selection;
    this.selectController?.abort();
    const controller = new AbortController();
    this.selectController = controller;
    if (!this.find(id)) {
      try {
        if (!this.host.loadInstance) throw new Error(`无法加载实例：${id}`);
        const instance = await this.host.loadInstance(id, controller.signal);
        if (!this.current(lifecycle) || this.selection !== selection) return;
        validateViewInstance(instance, definition, id);
        this.publish({
          sessions: {
            ...this.state.sessions,
            [id]: sessionFor(copy(instance)),
          },
          instanceIds: [...this.state.instanceIds, id],
        });
      } catch (error) {
        if (!this.current(lifecycle) || this.selection !== selection) return;
        this.publish({ error: message(error) });
        throw error;
      }
    }
    if (!this.current(lifecycle) || this.selection !== selection) return;
    if (this.state.selectedInstanceId === id) return;
    if (this.state.selectedInstanceId !== null) {
      this.cancelQuery(this.state.selectedInstanceId);
      if (this.summaryQueries.has(this.state.selectedInstanceId))
        this.invalidateSummary(this.state.selectedInstanceId);
    }
    this.invalidateSummary(id);
    this.publish({ selectedInstanceId: id, error: null });
    if (this.current(lifecycle) && this.selection === selection)
      await this.query(id);
  }

  async reloadInstance(id?: string): Promise<void> {
    const session = this.session(id);
    id = session.instance.id;
    const lifecycle = this.lifecycle;
    const definition = this.definition();
    const controller = new AbortController();
    let started = false;
    let queryId = id;
    const selection = this.selection;
    try {
      const unverified = this.unverifiedCreates.get(id);
      if (!this.canReloadInstance(id))
        throw new Error('宿主未提供 loadInstance，无法重新加载');
      if (this.writes.has(id)) throw new Error('实例正在写入，请等待操作完成');
      this.reloads.get(id)?.abort();
      this.reloads.set(id, controller);
      started = true;
      this.cancelQuery(id);
      let result: ViewInstance;
      const additions: Record<string, RecordSession> = Object.create(null);
      if (unverified && (!unverified.id || !this.host.loadInstance)) {
        const list = await this.host.listInstances!(
          definition.id,
          controller.signal,
        );
        if (!this.current(lifecycle) || this.reloads.get(id) !== controller)
          return;
        if (!list || !Array.isArray(list.instances))
          throw new Error('实例列表必须包含 instances 数组');
        const seen = new Set<string>();
        for (const item of list.instances) {
          validateViewInstance(item, definition);
          if (seen.has(item.id)) throw new Error(`实例 ID 重复：${item.id}`);
          seen.add(item.id);
          if (!this.find(item.id)) additions[item.id] = sessionFor(copy(item));
        }
        const candidates = list.instances.filter(item =>
          unverified.id
            ? item.id === unverified.id
            : !unverified.knownIds.has(item.id) &&
              sameFilterState(content(item), content(unverified.submitted)),
        );
        if (candidates.length !== 1) {
          this.publish({
            instanceIds: [...this.state.instanceIds, ...Object.keys(additions)],
            sessions: { ...this.state.sessions, ...additions },
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
      if (!this.current(lifecycle) || this.reloads.get(id) !== controller)
        return;
      validateViewInstance(
        result,
        definition,
        unverified ? (unverified.id ?? undefined) : id,
      );
      const baseline = copy(result);
      const latest = this.session(id);
      if (unverified) {
        if (unverified.knownIds.has(baseline.id))
          throw new Error('另存结果没有新的实例 ID，仍需核对');
        const existing = this.find(baseline.id);
        // An already opened copy owns its own saves and drafts. A late reconciliation must not roll them back.
        const created =
          existing ??
          edited({
            ...sessionFor(baseline),
            instance: {
              ...baseline,
              title: unverified.submitted.title,
              scope: unverified.submitted.scope,
              config: latest.instance.config,
            },
            filterDraft: latest.filterDraft,
            filterBaseline: latest.filterBaseline,
            filterValid: latest.filterValid,
            filterMode: latest.filterMode,
            filterPending: latest.filterPending,
          });
        const selectCopy =
          this.state.selectedInstanceId === id && this.selection === selection;
        if (this.state.selectedInstanceId === baseline.id)
          queryId = baseline.id;
        this.unverifiedCreates.delete(id);
        if (selectCopy) {
          ++this.selection;
          this.selectController?.abort();
          queryId = baseline.id;
        }
        this.publish({
          instanceIds: [
            ...new Set([
              ...this.state.instanceIds,
              ...Object.keys(additions),
              baseline.id,
            ]),
          ],
          sessions: {
            ...this.state.sessions,
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
            : sessionFor(baseline);
        this.patch(id, next);
      }
    } catch (error) {
      if (
        !this.current(lifecycle) ||
        (started && this.reloads.get(id) !== controller)
      )
        return;
      this.patch(id, { writeError: message(error) });
      throw error;
    } finally {
      if (this.reloads.get(id) === controller) this.reloads.delete(id);
    }
    if (this.current(lifecycle) && this.state.selectedInstanceId === queryId)
      await this.refresh(queryId);
  }

  canReloadInstance(id = this.state.selectedInstanceId): boolean {
    if (this.disposed || !id || !this.find(id)) return false;
    const pending = this.unverifiedCreates.get(id);
    return pending
      ? Boolean(
          (pending.id && this.host.loadInstance) || this.host.listInstances,
        )
      : Boolean(this.host.loadInstance);
  }

  private async query(id: string, background = false): Promise<void> {
    const session = this.session(id);
    const definition = this.definition();
    const lifecycle = this.lifecycle;
    this.cancelQuery(id);
    const controller = new AbortController();
    this.queries.set(id, controller);
    const current = () =>
      this.current(lifecycle) && this.queries.get(id) === controller;
    this.patch(
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
    if (!background) this.syncSummaries(id, undefined, false);
    try {
      if (!current()) return;
      const source = await this.host.resolveSource(definition.sourceId);
      if (!current()) return;
      if (!background) this.syncSummaries(id, source);
      const { filter, sort, pagination } = session.instance.config;
      const result =
        pagination.mode === 'paged'
          ? await source.paged(
              cloneSnapshot<Parameters<RecordQuerySource['paged']>[0]>({
                filter,
                sort,
                pagination: { index: session.page, size: pagination.size },
              }),
              undefined,
              controller,
            )
          : await source.cursor(
              cloneSnapshot<Parameters<RecordQuerySource['cursor']>[0]>({
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
      if (background) this.invalidateSummary(id);
      if (!current()) return;
      this.patch(id, {
        rows: copy(result.list),
        refreshing: false,
        total,
        nextCursor,
        queryStatus: 'success',
      });
      this.syncSummaries(id, source);
    } catch (error) {
      if (!current()) return;
      this.patch(id, {
        queryStatus: 'error',
        queryError: message(error),
        refreshing: false,
      });
      if (!background) this.updatePageSummary(id);
      throw error;
    } finally {
      if (this.queries.get(id) === controller) this.queries.delete(id);
    }
  }

  private updateInstance(
    session: RecordSession,
    instance: DeepReadonly<ViewInstance>,
    patch: Partial<RecordSession> = {},
  ): void {
    validateViewInstance(instance, this.definition(), session.instance.id);
    this.patch(session.instance.id, { ...patch, instance: copy(instance) });
  }

  async applyFilter(
    expression: DeepReadonly<FilterExpression>,
    id?: string,
  ): Promise<void> {
    const session = this.session(id);
    if (!session.filterValid)
      throw new Error('筛选输入无效，请先修正或撤销修改');
    const definition = this.definition();
    const compiled = compileFilterDraft(
      session.filterDraft,
      definition.fields,
      definition.allowedOperators,
    );
    const filterDraft =
      !compiled.errors.length &&
      sameFilterState(compiled.expression, expression)
        ? session.filterDraft
        : createFilterDraft(expression);
    const editingBaseline = copy(filterDraft);
    this.updateInstance(
      session,
      {
        ...session.instance,
        config: { ...session.instance.config, filter: expression },
      },
      {
        filterDraft: editingBaseline,
        filterBaseline: editingBaseline,
        filterValid: true,
        page: 1,
        cursor: null,
        filterMode: isSimpleFilter(filterDraft)
          ? session.filterMode
          : 'advanced',
      },
    );
    this.invalidateSummary(session.instance.id);
    await this.query(session.instance.id);
  }

  setFilterDraft(
    draft: DeepReadonly<FilterDraftNode>,
    id?: string,
    valid?: boolean,
  ): void {
    const session = this.session(id);
    const nextValid = valid === undefined ? session.filterValid : valid;
    if (typeof nextValid !== 'boolean')
      throw new Error('筛选有效性必须是布尔值');
    if (
      sameFilterState(session.filterDraft, draft) &&
      session.filterValid === nextValid
    )
      return;
    this.patch(session.instance.id, {
      filterDraft: copy(draft),
      filterValid: nextValid,
    });
  }

  setFilterValidity(valid: boolean, id?: string): void {
    if (typeof valid !== 'boolean') throw new Error('筛选有效性必须是布尔值');
    const session = this.session(id);
    this.setFilterDraft(session.filterDraft, session.instance.id, valid);
  }

  setFilterMode(mode: FilterMode, id?: string): void {
    const session = this.session(id);
    if (mode !== 'simple' && mode !== 'advanced')
      throw new Error('筛选模式无效');
    if (mode === 'simple' && !isSimpleFilter(session.filterDraft))
      throw new Error('当前条件需要高级筛选模式');
    if (session.filterMode === mode) return;
    this.patch(session.instance.id, { filterMode: mode });
  }

  async setSort(sort: DeepReadonly<FieldSort[]>, id?: string): Promise<void> {
    const session = this.session(id);
    this.updateInstance(
      session,
      { ...session.instance, config: { ...session.instance.config, sort } },
      { page: 1, cursor: null },
    );
    await this.query(session.instance.id);
  }

  setColumns(columns: DeepReadonly<RecordColumn[]>, id?: string): void {
    const session = this.session(id);
    const key = this.summaryKey(session);
    this.updateInstance(session, {
      ...session.instance,
      config: {
        ...session.instance.config,
        presentation: {
          ...session.instance.config.presentation,
          table: { columns },
        },
      },
    });
    if (key !== this.summaryKey(this.session(session.instance.id)))
      this.syncSummaries(session.instance.id);
  }

  async setPage(index: number, id?: string): Promise<void> {
    const session = this.session(id);
    if (session.instance.config.pagination.mode !== 'paged')
      throw new Error('游标分页仅支持向后加载下一页');
    if (!Number.isSafeInteger(index) || index < 1)
      throw new Error('页码必须是正整数');
    this.patch(session.instance.id, { page: index });
    await this.query(session.instance.id);
  }

  async setPageSize(size: number, id?: string): Promise<void> {
    const session = this.session(id);
    this.updateInstance(
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
    await this.query(session.instance.id);
  }

  async nextPage(id?: string): Promise<void> {
    const session = this.session(id);
    if (session.instance.config.pagination.mode === 'paged')
      return this.setPage(session.page + 1, session.instance.id);
    if (session.queryStatus !== 'success' || session.nextCursor === null)
      return;
    this.patch(session.instance.id, {
      page: session.page + 1,
      cursor: session.nextCursor,
    });
    await this.query(session.instance.id);
  }

  setTitle(title: string, id?: string): void {
    const session = this.session(id);
    if (
      [session.baseline, session.instance].some(
        value =>
          value.scope.type === 'public' && value.scope.source === 'system',
      )
    )
      throw new Error('系统视图不能编辑名称');
    this.updateInstance(session, { ...session.instance, title });
  }

  setSelection(keys: RecordKey[], id?: string): void {
    const session = this.session(id);
    const available = new Set(
      session.rows.map(row => getRecordKey(row, this.definition().rowKey)),
    );
    if (!Array.isArray(keys) || keys.some(key => !available.has(key)))
      throw new Error('选中记录必须属于当前查询结果');
    if (session.refreshing && keys.length)
      this.cancelQuery(session.instance.id);
    this.patch(session.instance.id, { selectedRowKeys: [...new Set(keys)] });
  }

  async refresh(
    id?: string,
    options?: { background?: boolean },
  ): Promise<void> {
    const session = this.session(id);
    if (options?.background) {
      if (getRecordRefreshBlockReason(session)) return;
      await this.query(session.instance.id, true);
      return;
    }
    this.invalidateSummary(session.instance.id);
    if (session.instance.config.pagination.mode === 'cursor')
      this.patch(session.instance.id, { page: 1, cursor: null });
    await this.query(session.instance.id);
  }

  async restore(id?: string): Promise<void> {
    const session = this.session(id);
    this.invalidateSummary(session.instance.id);
    const filterDraft = createFilterDraft(session.baseline.config.filter);
    this.patch(session.instance.id, {
      instance: session.baseline,
      filterDraft,
      filterBaseline: filterDraft,
      filterValid: true,
      filterMode: isSimpleFilter(filterDraft) ? session.filterMode : 'advanced',
      page: 1,
      cursor: null,
      writeError: session.requiresReload ? session.writeError : null,
    });
    await this.query(session.instance.id);
  }

  getPermissions(id?: string): ViewInstancePermissions {
    const denied = {
      save: false,
      saveAsPersonal: false,
      saveAsShared: false,
      delete: false,
      rename: false,
    };
    if (this.disposed || !this.host.getInstancePermissions) return denied;
    const key = id ?? this.state.selectedInstanceId;
    const session = key === null ? undefined : this.find(key);
    if (!session) return denied;
    try {
      const permissions = this.host.getInstancePermissions(
        cloneSnapshot<ViewInstance>(session.instance),
      );
      const system = [session.baseline, session.instance].some(
        value =>
          value.scope.type === 'public' && value.scope.source === 'system',
      );
      return {
        delete:
          !system &&
          typeof this.host.deleteInstance === 'function' &&
          permissions?.delete === true,
        rename:
          !system &&
          typeof this.host.renameInstance === 'function' &&
          permissions?.rename === true,
        save:
          typeof this.host.saveInstance === 'function' &&
          permissions?.save === true,
        saveAsPersonal:
          typeof this.host.createInstance === 'function' &&
          permissions?.saveAsPersonal === true,
        saveAsShared:
          typeof this.host.createInstance === 'function' &&
          permissions?.saveAsShared === true,
      };
    } catch {
      return denied;
    }
  }

  async renameInstance(title: string, id?: string): Promise<void> {
    const session = this.session(id);
    id = session.instance.id;
    if (!this.getPermissions(id).rename)
      throw new Error('系统视图或宿主未授权的视图不能编辑名称');
    if (typeof title !== 'string' || !title.trim())
      throw new Error('视图名称不能为空');
    if (this.writes.has(id)) throw new Error('实例正在写入，请等待操作完成');
    if (this.reloads.has(id))
      throw new Error('实例正在重新加载，请等待加载完成');
    if (session.requiresReload)
      throw new Error('保存结果需要核对，请先重新加载实例');
    title = title.trim();
    if (title === session.baseline.title && title === session.instance.title)
      return;
    const lifecycle = this.lifecycle;
    const token = Symbol();
    const current = () =>
      this.current(lifecycle) && this.writes.get(id) === token;
    let received = false;
    this.writes.set(id, token);
    this.patch(id, { writeStatus: 'renaming', writeError: null });
    try {
      if (!current()) return;
      const result = await this.host.renameInstance!(
        id,
        title,
        session.baseline.revision,
      );
      if (!current()) return;
      received = true;
      validateViewInstance(result, this.definition(), id);
      if (
        !sameFilterState(content(result), {
          ...content(session.baseline),
          title,
        })
      )
        throw new Error('改名结果修改了其他视图配置，请重新加载核对');
      const baseline = copy(result);
      const latest = this.session(id);
      this.patch(id, {
        baseline,
        instance: {
          ...baseline,
          config: latest.instance.config,
          title:
            latest.instance.title === session.instance.title
              ? title
              : latest.instance.title,
        },
        writeStatus: 'idle',
        writeError: null,
      });
    } catch (error) {
      if (!current()) return;
      this.patch(id, {
        writeStatus: 'idle',
        writeError: message(error),
        ...(received ? { requiresReload: true } : {}),
      });
      throw error;
    } finally {
      if (this.writes.get(id) === token) this.writes.delete(id);
    }
  }

  canReorderInstances(): boolean {
    return !this.disposed && typeof this.host.saveInstanceOrder === 'function';
  }

  async reorderInstances(instanceIds: readonly string[]): Promise<void> {
    this.definition();
    if (!this.canReorderInstances()) throw new Error('宿主未提供视图排序接口');
    if (this.ordering) throw new Error('视图顺序正在保存');
    const known = new Set(this.state.instanceIds);
    if (
      !Array.isArray(instanceIds) ||
      instanceIds.length !== known.size ||
      new Set(instanceIds).size !== known.size ||
      instanceIds.some(id => !known.has(id))
    )
      throw new Error('排序必须完整包含当前视图，不能重复或添加未知视图');
    const order = [...instanceIds];
    if (order.every((id, index) => id === this.state.instanceIds[index]))
      return;
    const lifecycle = this.lifecycle;
    const token = Symbol();
    this.ordering = token;
    try {
      await this.host.saveInstanceOrder!(this.definitionId, [...order]);
      if (!this.current(lifecycle) || this.ordering !== token) return;
      const latest = new Set(this.state.instanceIds);
      const remaining = order.filter(id => latest.has(id));
      const included = new Set(remaining);
      let index = 0;
      this.publish({
        instanceIds: this.state.instanceIds.map(id =>
          included.has(id) ? remaining[index++] : id,
        ),
      });
    } finally {
      if (this.ordering === token) this.ordering = undefined;
    }
  }

  async deleteInstance(id?: string): Promise<void> {
    const session = this.session(id);
    id = session.instance.id;
    if (!this.getPermissions(id).delete)
      throw new Error('系统视图或宿主未授权的视图不能删除');
    if (this.writes.has(id)) throw new Error('实例正在写入，请等待操作完成');
    if (this.reloads.has(id))
      throw new Error('实例正在重新加载，请等待加载完成');
    if (session.requiresReload)
      throw new Error('保存结果需要核对，请先重新加载实例');
    const lifecycle = this.lifecycle;
    const token = Symbol();
    const current = () =>
      this.current(lifecycle) && this.writes.get(id) === token;
    this.writes.set(id, token);
    this.patch(id, { writeStatus: 'deleting', writeError: null });
    try {
      if (!current()) return;
      await this.host.deleteInstance!(id, session.baseline.revision);
      if (!current()) return;
      this.cancelQuery(id);
      this.invalidateSummary(id);
      if (!current()) return;
      this.unverifiedCreates.delete(id);
      const sessions = { ...this.state.sessions };
      delete sessions[id];
      const instanceIds = this.state.instanceIds.filter(key => key !== id);
      const wasSelected = this.state.selectedInstanceId === id;
      const nextId = wasSelected
        ? (instanceIds[0] ?? null)
        : this.state.selectedInstanceId;
      this.publish({ sessions, instanceIds, selectedInstanceId: nextId });
      // Deletion is complete. A failure loading the next view belongs to its query state.
      if (
        wasSelected &&
        nextId !== null &&
        current() &&
        this.state.selectedInstanceId === nextId
      )
        void this.query(nextId).catch(() => {});
    } catch (error) {
      if (!current()) return;
      this.patch(id, { writeStatus: 'idle', writeError: message(error) });
      throw error;
    } finally {
      if (this.writes.get(id) === token) this.writes.delete(id);
    }
  }

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
    const session = this.session(id);
    id = session.instance.id;
    const definition = this.definition();
    const lifecycle = this.lifecycle;
    const token = Symbol();
    const selection = this.selection;
    let received = false;
    let selectedCopy: string | undefined;
    const current = () =>
      this.current(lifecycle) && this.writes.get(id) === token;
    try {
      if (session.filterPending)
        throw new Error('请先查询或撤销筛选修改，再保存视图');
      if (this.writes.has(id)) throw new Error('实例正在写入，请等待操作完成');
      if (this.reloads.has(id))
        throw new Error('实例正在重新加载，请等待加载完成');
      if (session.requiresReload)
        throw new Error('保存结果需要核对，请先重新加载实例');
      const permissions = this.getPermissions(id);
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
      const knownIds = new Set(this.state.instanceIds);
      this.writes.set(id, token);
      this.patch(id, {
        writeStatus: options ? 'creating' : 'saving',
        writeError: null,
      });
      if (!current()) return;
      let result: ViewInstance;
      if (options) {
        const { definitionId, kind, title, scope, config } = submitted;
        result = await this.host.createInstance!(
          structuredClone({ definitionId, kind, title, scope, config }),
        );
      } else result = await this.host.saveInstance!(structuredClone(submitted));
      if (!current()) return;
      received = true;
      if (options)
        this.unverifiedCreates.set(id, {
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
      if (options && this.find(result.id))
        throw new Error('另存返回的实例 ID 已存在');
      if (!sameFilterState(content(result), content(submitted)))
        throw new Error('保存结果不符合原样保存契约，请重新加载核对');
      const saved = copy(result);
      if (options) this.unverifiedCreates.delete(id);
      const latest = this.session(id);
      if (options) {
        let created = sessionFor(saved);
        if (
          this.state.selectedInstanceId === id &&
          this.selection === selection
        ) {
          selectedCopy = saved.id;
          created = edited({
            ...created,
            instance: { ...saved, config: latest.instance.config },
            filterDraft: latest.filterDraft,
            filterBaseline: latest.filterBaseline,
            filterValid: latest.filterValid,
            filterMode: latest.filterMode,
            filterPending: latest.filterPending,
          });
          ++this.selection;
          this.selectController?.abort();
          this.cancelQuery(id);
        }
        this.publish({
          instanceIds: [...this.state.instanceIds, saved.id],
          sessions: {
            ...this.state.sessions,
            [id]: {
              ...this.session(id),
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
        this.patch(id, {
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
        !this.current(lifecycle) ||
        (this.writes.has(id) && this.writes.get(id) !== token)
      ) {
        if (this.current(lifecycle)) throw error;
        return;
      }
      this.patch(id, {
        writeError: message(error),
        ...(this.writes.get(id) === token ? { writeStatus: 'idle' } : {}),
        ...(received ? { requiresReload: true } : {}),
      });
      throw error;
    } finally {
      if (this.writes.get(id) === token) this.writes.delete(id);
    }
    if (
      selectedCopy &&
      this.current(lifecycle) &&
      this.state.selectedInstanceId === selectedCopy
    )
      await this.query(selectedCopy);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    ++this.lifecycle;
    ++this.selection;
    this.loadController?.abort();
    this.selectController?.abort();
    this.queries.forEach(controller => controller.abort());
    this.queries.clear();
    this.reloads.forEach(controller => controller.abort());
    this.reloads.clear();
    this.unverifiedCreates.clear();
    this.summaryQueries.forEach(controller => controller.abort());
    this.summaryQueries.clear();
    this.summaryKeys.clear();
    this.listeners.clear();
  }
}
