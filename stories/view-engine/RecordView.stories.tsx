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

import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import {
  filter,
  FilterOperator,
  SortDirection,
  type AggregationQuery,
  type CursorPage,
  type CursorQuery,
  type FilterExpression,
  type PagedList,
  type PagedQueryRequest,
} from '@ahoo-wang/fetcher-wow';
import type {
  RecordData,
  RecordKey,
  RecordQuerySource,
  ViewDefinition,
  ViewHost,
  ViewInstance,
  ViewInstanceList,
} from '@ahoo-wang/fetcher-view-engine';
import { formatRecordNumber } from '@ahoo-wang/fetcher-view-engine';
import {
  Button,
  RecordTable,
  ViewPage,
  type CellRendererProps,
  type GlobalActionsRendererProps,
  type RowActionsRendererProps,
  type ViewExtensions,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

interface DemoArgs {
  appearance: 'light' | 'dark';
}
interface ScenarioOptions {
  mode?: 'paged' | 'cursor';
  empty?: boolean;
  failFirstQuery?: boolean;
  local?: boolean;
  summaries?: boolean;
  failFirstSummary?: boolean;
  failFirstDelete?: boolean;
  saveOnly?: boolean;
  pageSize?: number;
  sidebarCollapsed?: boolean;
}

const statuses = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];
const equalityOperators = [FilterOperator.EQ, FilterOperator.NE];
const numberOperators = [
  ...equalityOperators,
  FilterOperator.GT,
  FilterOperator.GTE,
  FilterOperator.LT,
  FilterOperator.LTE,
];
const definition: ViewDefinition = {
  id: 'order-management',
  title: '订单管理',
  sourceId: 'orders',
  rowKey: 'id',
  allowedOperators: [
    FilterOperator.MATCH_ALL,
    FilterOperator.AND,
    FilterOperator.OR,
    ...numberOperators,
  ],
  fields: [
    {
      field: 'id',
      label: '订单编号',
      type: 'string',
      sortable: true,
      operators: equalityOperators,
    },
    {
      field: 'customer',
      group: '客户信息',
      label: '客户',
      type: 'string',
      sortable: true,
      operators: equalityOperators,
    },
    {
      field: 'amount',
      group: '订单信息',
      label: '订单金额',
      type: 'number',
      sortable: true,
      operators: numberOperators,
      numberFormat: { style: 'currency', currency: 'CNY' },
      cellRenderer: { name: 'order-amount' },
    },
    {
      field: 'status',
      group: '订单信息',
      label: '订单状态',
      type: 'string',
      options: statuses,
      operators: equalityOperators,
      cellRenderer: { name: 'order-status' },
    },
    {
      field: 'createdAt',
      group: '时间',
      label: '下单时间',
      type: 'string',
      sortable: true,
      operators: equalityOperators,
    },
  ],
  recordActions: {
    global: { name: 'order-actions' },
    table: { name: 'order-table-actions' },
    row: { name: 'order-row-actions' },
  },
};

const customers = [
  '青岚科技',
  '晨星零售',
  '云杉制造',
  '海川物流',
  '远山商贸',
  '山海设计',
];
const amounts = [
  680, 1280, 2399, 540, 3600, 899, 1680, 4999, 1180, 780, 2800, 1399, 960, 5600,
  2100, 480, 3200, 1880,
];
const orders: RecordData[] = amounts.map((amount, index) => ({
  id: `ORD-202609-${1001 + index}`,
  customer: customers[index % customers.length],
  amount,
  status: statuses[index % statuses.length].value,
  createdAt: `2026-09-06 ${String(9 + Math.floor(index / 6)).padStart(2, '0')}:${String((index % 6) * 10).padStart(2, '0')}`,
  owner: ['林晨', '顾嘉', '陈宁'][index % 3],
  region: ['上海', '杭州', '深圳'][index % 3],
}));

function makeInstances(
  mode: 'paged' | 'cursor',
  summaries = false,
  pageSize = 5,
): ViewInstanceList {
  const personal: ViewInstance = {
    id: 'my-orders',
    definitionId: definition.id,
    title: '我的订单',
    kind: 'record',
    scope: { type: 'personal' },
    revision: '1',
    config: {
      filter: filter.gte('amount', 0),
      sort: [{ field: 'id', direction: SortDirection.ASC }],
      pagination: { mode, size: pageSize },
      presentation: {
        layout: 'table',
        table: {
          columns: [
            {
              id: 'id',
              kind: 'field',
              field: 'id',
              width: 210,
            },
            { id: 'customer', kind: 'field', field: 'customer' },
            {
              id: 'amount',
              kind: 'field',
              field: 'amount',
              width: 150,
              ...(summaries ? { summary: ['SUM'] as const } : {}),
            },
            { id: 'status', kind: 'field', field: 'status' },
            { id: 'createdAt', kind: 'field', field: 'createdAt', width: 190 },
            { id: 'actions', kind: 'actions', title: '操作', width: 110 },
          ],
        },
      },
    },
  };
  const system: ViewInstance = {
    ...structuredClone(personal),
    id: 'all-orders',
    title: '全部订单',
    scope: { type: 'public', source: 'system' },
    config: { ...structuredClone(personal.config), filter: filter.matchAll() },
  };
  const shared: ViewInstance = {
    ...structuredClone(personal),
    id: 'priority-orders',
    title: '团队重点订单',
    scope: { type: 'public', source: 'shared' },
    config: {
      ...structuredClone(personal.config),
      filter: filter.and([
        filter.or([
          filter.eq('status', 'pending'),
          filter.eq('status', 'processing'),
        ]),
        filter.gte('amount', 1000),
      ]),
    },
  };
  return {
    instances: [personal, system, shared],
    defaultInstanceId: personal.id,
  };
}

function matches(record: RecordData, expression: FilterExpression): boolean {
  switch (expression.op) {
    case FilterOperator.MATCH_ALL:
      return true;
    case FilterOperator.AND:
      return expression.operands.every(child => matches(record, child));
    case FilterOperator.OR:
      return expression.operands.some(child => matches(record, child));
    case FilterOperator.EQ:
      return record[expression.field] === expression.value;
    case FilterOperator.NE:
      return record[expression.field] !== expression.value;
    case FilterOperator.GT:
    case FilterOperator.GTE:
    case FilterOperator.LT:
    case FilterOperator.LTE: {
      const actual = record[expression.field];
      if (typeof actual !== 'number' || typeof expression.value !== 'number')
        throw new Error('演示服务的大小比较仅支持数值字段。');
      if (expression.op === FilterOperator.GT) return actual > expression.value;
      if (expression.op === FilterOperator.GTE)
        return actual >= expression.value;
      if (expression.op === FilterOperator.LT) return actual < expression.value;
      return actual <= expression.value;
    }
    default:
      throw new Error(`演示服务未实现操作 ${expression.op}。`);
  }
}

function compare(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number')
    return left - right;
  if (typeof left === 'string' && typeof right === 'string')
    return left.localeCompare(right, 'zh-CN');
  throw new Error('演示服务仅支持字符串和数值排序。');
}

const pause = () => new Promise<void>(resolve => setTimeout(resolve, 120));
type DemoQuery = PagedQueryRequest | CursorQuery;
interface QueryDiagnostic {
  calls: number;
  method: 'paged' | 'cursor' | null;
  request: DemoQuery | null;
}
interface WriteDiagnostic {
  saves: number;
  creates: number;
  deletes: number;
  renames: number;
  instance: ViewInstance | null;
}

function createHost(
  {
    mode = 'paged',
    empty = false,
    failFirstQuery = false,
    failFirstSummary = false,
    failFirstDelete = false,
    summaries = false,
    saveOnly = false,
    pageSize = 5,
    local,
  }: ScenarioOptions,
  onQuery: (method: 'paged' | 'cursor', request: DemoQuery) => void,
  onWrite: (
    operation: 'save' | 'create' | 'delete' | 'rename',
    instance: ViewInstance,
  ) => void,
  onSummary: (query: AggregationQuery) => void,
  onOrder: (ids: string[]) => void,
) {
  let records = structuredClone(empty ? [] : orders);
  const initialInstances = makeInstances(mode, summaries, pageSize);
  const saved = new Map(
    initialInstances.instances.map(instance => [
      instance.id,
      structuredClone(instance),
    ]),
  );
  let instanceOrder = [...saved.keys()];
  let failNext = failFirstQuery;
  let failNextSummary = failFirstSummary;
  let failNextDelete = failFirstDelete;
  let nextOrder = 1019;
  let nextInstance = 1;

  // ponytail: this small in-memory server supports only the operators advertised above; use a real QueryApi for production data.
  async function queryRecords(
    method: 'paged' | 'cursor',
    query: DemoQuery,
    abortController?: AbortController,
  ) {
    abortController?.signal.throwIfAborted();
    onQuery(method, structuredClone(query));
    await pause();
    abortController?.signal.throwIfAborted();
    if (failNext) {
      failNext = false;
      throw new Error('订单服务暂时不可用，请重试查询。');
    }
    if (!('filter' in query))
      throw new Error('演示服务只接收 Wow Filter 查询。');
    return records
      .filter(record => matches(record, query.filter))
      .sort((left, right) => {
        for (const sort of query.sort ?? []) {
          const result = compare(left[sort.field], right[sort.field]);
          if (result)
            return sort.direction === SortDirection.ASC ? result : -result;
        }
        return 0;
      });
  }

  const source: RecordQuerySource = {
    async aggregate<
      Row extends RecordData = RecordData,
      Fields extends string = string,
    >(
      query: AggregationQuery<string, Fields>,
      _attributes?: Record<string, unknown>,
      abortController?: AbortController,
    ): Promise<Row[]> {
      abortController?.signal.throwIfAborted();
      onSummary(structuredClone(query));
      await pause();
      abortController?.signal.throwIfAborted();
      if (failNextSummary) {
        failNextSummary = false;
        throw new Error('汇总服务暂时不可用，请重试汇总。');
      }
      if (query.groupBy?.length || query.elements?.length || query.sort?.length)
        throw new Error('演示服务仅支持无分组字段汇总');
      const matched = records.filter(record =>
        matches(record, query.filter ?? filter.matchAll()),
      );
      const result: RecordData = {};
      for (const metric of query.metrics) {
        if (metric.type !== 'NUMERIC' || metric.expression.type !== 'FIELD')
          throw new Error('演示服务仅支持数值字段汇总');
        const field = metric.expression.field;
        const values = matched
          .map(record => record[field])
          .filter(
            (value): value is number =>
              typeof value === 'number' && Number.isFinite(value),
          );
        if (!values.length) {
          result[metric.alias] = null;
          continue;
        }
        const sum = values.reduce((sum, value) => sum + value, 0);
        result[metric.alias] =
          metric.function === 'SUM'
            ? sum
            : metric.function === 'AVG'
              ? sum / values.length
              : metric.function === 'MIN'
                ? Math.min(...values)
                : Math.max(...values);
      }
      return [result as Row];
    },
    async paged<T extends Partial<RecordData> = RecordData>(
      query: PagedQueryRequest,
      _attributes?: Record<string, unknown>,
      abortController?: AbortController,
    ): Promise<PagedList<T>> {
      const result = await queryRecords('paged', query, abortController);
      const { index = 1, size = 5 } = query.pagination ?? {};
      return {
        total: result.length,
        list: structuredClone(
          result.slice((index - 1) * size, index * size),
        ) as T[],
      };
    },
    async cursor<T extends Partial<RecordData> = RecordData>(
      query: CursorQuery,
      _attributes?: Record<string, unknown>,
      abortController?: AbortController,
    ): Promise<CursorPage<T>> {
      const result = await queryRecords('cursor', query, abortController);
      const token = query.cursor?.match(/^orders:(\d+)$/);
      if (query.cursor && !token) throw new Error('无效的订单游标。');
      const offset = token ? Number(token[1]) : 0;
      const end = offset + (query.size ?? 5);
      return {
        list: structuredClone(result.slice(offset, end)) as T[],
        nextCursor: end < result.length ? `orders:${end}` : null,
      };
    },
  };
  function loadInstance(id: string) {
    const instance = saved.get(id);
    if (!instance) throw new Error(`视图 ${id} 不存在。`);
    return structuredClone(instance);
  }
  const host: ViewHost = {
    ...(!local && {
      async loadDefinition(id: string) {
        if (id !== definition.id) throw new Error('订单视图定义不存在。');
        return structuredClone(definition);
      },
      async listInstances(id: string) {
        if (id !== definition.id) throw new Error('订单视图定义不存在。');
        return {
          instances: instanceOrder
            .filter(id => saved.has(id))
            .map(loadInstance),
          defaultInstanceId: saved.has(initialInstances.defaultInstanceId ?? '')
            ? initialInstances.defaultInstanceId
            : (instanceOrder[0] ?? null),
        };
      },
      async loadInstance(id: string) {
        return loadInstance(id);
      },
    }),
    resolveSource(id) {
      if (id !== definition.sourceId) throw new Error('订单数据源不存在。');
      return source;
    },
    getInstancePermissions(instance) {
      return {
        save:
          instance.scope.type === 'personal' ||
          instance.scope.source === 'shared',
        saveAsPersonal: !saveOnly,
        saveAsShared: !saveOnly,
        rename:
          !saveOnly &&
          (instance.scope.type === 'personal' ||
            instance.scope.source === 'shared'),
        delete:
          !saveOnly &&
          (instance.scope.type === 'personal' ||
            instance.scope.source === 'shared'),
      };
    },
    async renameInstance(id, title, revision) {
      await pause();
      const previous = loadInstance(id);
      if (
        previous.scope.type === 'public' &&
        previous.scope.source === 'system'
      )
        throw new Error('系统视图不能编辑名称。');
      if (revision !== previous.revision)
        throw new Error('视图已被更新，请重新加载。');
      const updated = {
        ...previous,
        title,
        revision: String(Number(previous.revision) + 1),
      };
      saved.set(id, updated);
      onWrite('rename', structuredClone(updated));
      return structuredClone(updated);
    },
    async saveInstanceOrder(definitionId, ids) {
      await pause();
      if (
        definitionId !== definition.id ||
        ids.length !== saved.size ||
        new Set(ids).size !== saved.size ||
        ids.some(id => !saved.has(id))
      )
        throw new Error('可用视图已变化，请重新加载。');
      instanceOrder = [...ids];
      onOrder([...ids]);
    },
    async deleteInstance(id, revision) {
      await pause();
      const previous = saved.get(id);
      if (!previous) return;
      if (
        previous.scope.type === 'public' &&
        previous.scope.source === 'system'
      )
        throw new Error('系统视图不能删除。');
      if (revision !== previous.revision)
        throw new Error('视图已被更新，请重新加载后再删除。');
      if (failNextDelete) {
        failNextDelete = false;
        throw new Error('删除失败，请重试。');
      }
      saved.delete(id);
      instanceOrder = instanceOrder.filter(value => value !== id);
      onWrite('delete', structuredClone(previous));
    },
    async saveInstance(instance) {
      await pause();
      const previous = loadInstance(instance.id);
      if (instance.revision !== previous.revision)
        throw new Error('视图已被更新，请重新加载后再保存。');
      const updated = {
        ...structuredClone(instance),
        revision: String(Number(previous.revision) + 1),
      };
      saved.set(updated.id, updated);
      onWrite('save', structuredClone(updated));
      return structuredClone(updated);
    },
    async createInstance(instance) {
      await pause();
      const created = {
        ...structuredClone(instance),
        id: `orders-copy-${nextInstance++}`,
        revision: '1',
      };
      saved.set(created.id, created);
      instanceOrder.push(created.id);
      onWrite('create', structuredClone(created));
      return structuredClone(created);
    },
  };
  return {
    host,
    initialInstances,
    createOrder() {
      const order = {
        ...structuredClone(orders[0]),
        id: `ORD-202609-${nextOrder++}`,
        customer: '新叶商贸',
        amount: 3200,
        status: 'pending',
        createdAt: '2026-09-06 12:30',
      };
      records.push(order);
      return order;
    },
    processOrders(keys: readonly RecordKey[]) {
      records = records.map(record =>
        keys.includes(String(record.id))
          ? { ...record, status: 'processing' }
          : record,
      );
    },
  };
}

function AmountCell({ value, field }: CellRendererProps) {
  return (
    <span className="fve:font-medium fve:tabular-nums">
      {formatRecordNumber(Number(value), field)}
    </span>
  );
}
function StatusCell({ value }: CellRendererProps) {
  return (
    <span className="fve:whitespace-nowrap">
      {statuses.find(status => status.value === value)?.label ?? String(value)}
    </span>
  );
}

function OrderActions({
  selectedRowKeys,
  querying,
  refresh,
  runtime,
  onNotice,
  action,
}: GlobalActionsRendererProps & {
  runtime: ReturnType<typeof createHost>;
  action: 'create' | 'batch';
  onNotice: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function run(action: () => string) {
    setBusy(true);
    try {
      const message = action();
      await refresh();
      onNotice(message);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : '订单操作失败。');
    } finally {
      setBusy(false);
    }
  }
  return action === 'create' ? (
    <Button
      disabled={querying || busy}
      onClick={() =>
        void run(() => `已创建订单 ${runtime.createOrder().id}，列表已刷新。`)
      }
    >
      创建订单
    </Button>
  ) : (
    <Button
      variant="outline"
      disabled={querying || busy || !selectedRowKeys.length}
      onClick={() =>
        void run(() => {
          runtime.processOrders(selectedRowKeys);
          return `已处理 ${selectedRowKeys.length} 笔订单，列表已刷新。`;
        })
      }
    >
      批量处理
    </Button>
  );
}

function Scenario({ appearance, ...options }: DemoArgs & ScenarioOptions) {
  const [query, setQuery] = useState<QueryDiagnostic>({
    calls: 0,
    method: null,
    request: null,
  });
  const [writes, setWrites] = useState<WriteDiagnostic>({
    saves: 0,
    creates: 0,
    deletes: 0,
    renames: 0,
    instance: null,
  });
  const [notice, setNotice] = useState('');
  const [order, setOrder] = useState<{ calls: number; ids: string[] }>({
    calls: 0,
    ids: [],
  });
  const [summary, setSummary] = useState<{
    calls: number;
    request: AggregationQuery | null;
  }>({ calls: 0, request: null });
  // One stable host and instance list per mounted story, including when diagnostics update.
  const [runtime] = useState(() =>
    createHost(
      options,
      (method, request) => {
        setQuery(current => ({ calls: current.calls + 1, method, request }));
      },
      (operation, instance) => {
        setWrites(current => ({
          saves: current.saves + Number(operation === 'save'),
          creates: current.creates + Number(operation === 'create'),
          deletes: current.deletes + Number(operation === 'delete'),
          renames: current.renames + Number(operation === 'rename'),
          instance,
        }));
      },
      request => setSummary(current => ({ calls: current.calls + 1, request })),
      ids => setOrder(current => ({ calls: current.calls + 1, ids })),
    ),
  );
  const extensions = useMemo<ViewExtensions>(
    () => ({
      cells: { 'order-amount': AmountCell, 'order-status': StatusCell },
      globalActions: {
        'order-actions': props => (
          <OrderActions
            {...props}
            action="create"
            runtime={runtime}
            onNotice={setNotice}
          />
        ),
      },
      tableActions: {
        'order-table-actions': props => (
          <OrderActions
            {...props}
            action="batch"
            runtime={runtime}
            onNotice={setNotice}
          />
        ),
      },
      rowActions: {
        'order-row-actions': ({
          record,
          rowKey,
          instance,
        }: RowActionsRendererProps) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`查看订单 ${rowKey}`}
            onClick={() =>
              setNotice(
                `订单 ${rowKey} · ${record.customer} · 负责人 ${record.owner} · ${record.region} · 当前视图：${instance.title}`,
              )
            }
          >
            查看订单
          </Button>
        ),
      },
    }),
    [runtime],
  );
  return (
    <div
      className="fve-root"
      data-theme={appearance}
      style={{
        minHeight: '100vh',
        background: 'var(--fve-background)',
        padding: 16,
      }}
    >
      <ViewPage
        definitionId={definition.id}
        host={runtime.host}
        definition={options.local ? definition : undefined}
        instances={options.local ? runtime.initialInstances : undefined}
        extensions={extensions}
        initialSidebarCollapsed={options.sidebarCollapsed}
        selectable
      />
      <div
        role="status"
        aria-label="订单操作结果"
        style={{ padding: '0 16px' }}
      >
        {notice}
      </div>
      <details
        style={{
          margin: '24px 16px 0',
          fontSize: 12,
          color: 'var(--fve-muted-foreground)',
        }}
      >
        <summary>开发者：查看宿主查询与保存结果</summary>
        <p>
          当前场景使用隔离的内存宿主。筛选、排序和分页在宿主执行；保存校验
          revision 并返回完整实例。
        </p>
        <p>
          查询次数：
          <output data-testid="record-query-count">{query.calls}</output> ·
          保存次数：
          <output data-testid="record-save-count">{writes.saves}</output> ·
          新建视图：
          <output data-testid="record-create-count">{writes.creates}</output> ·
          改名次数：
          <output data-testid="record-rename-count">{writes.renames}</output> ·
          排序次数：
          <output data-testid="record-order-count">{order.calls}</output> ·
          删除视图：
          <output data-testid="record-delete-count">{writes.deletes}</output> ·
          汇总次数：
          <output data-testid="record-summary-count">{summary.calls}</output>
        </p>
        <pre
          data-testid="record-query"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {JSON.stringify({ method: query.method, ...query.request }, null, 2)}
        </pre>
        <pre
          data-testid="record-write"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {JSON.stringify(writes.instance, null, 2)}
        </pre>
        <pre
          data-testid="record-order"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {JSON.stringify(order.ids, null, 2)}
        </pre>
        <pre
          data-testid="record-summary-query"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {JSON.stringify(summary.request, null, 2)}
        </pre>
      </details>
    </div>
  );
}

const meta = {
  title: 'View Engine/Record View',
  args: { appearance: 'light' },
  argTypes: {
    appearance: { control: 'inline-radio', options: ['light', 'dark'] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '以 definitionId 打开订单页。个人、系统与共享视图复用同一 ViewDefinition；每个实例独立保留筛选草稿与已应用配置。演示通过公开包入口接入 ViewHost、Wow paged/cursor 查询与自定义操作、单元格。',
      },
    },
  },
} satisfies Meta<DemoArgs>;
export default meta;
type Story = StoryObj<DemoArgs>;

async function chooseInstance(canvasElement: HTMLElement, title: string) {
  const canvas = within(canvasElement);
  const collapse = canvas.queryByRole('button', { name: '收起视图列表' });
  if (collapse) await userEvent.click(collapse);
  await userEvent.click(canvas.getByRole('combobox', { name: '选择视图实例' }));
  await userEvent.click(
    await within(canvasElement.ownerDocument.body).findByRole('option', {
      name: title,
    }),
  );
}

export const BusinessRecords: Story = {
  name: '订单工作台 · 查询与保存',
  render: args => <Scenario {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    const sidebar = within(
      canvas.getByRole('complementary', { name: '视图列表', hidden: true }),
    );
    await expect(
      sidebar
        .getAllByRole('heading', { hidden: true })
        .map(item => item.textContent),
    ).toEqual(['个人视图', '公共视图']);
    const systemView = sidebar.getByRole('button', {
      name: '全部订单 系统',
      hidden: true,
    });
    await expect(within(systemView).getByText('系统')).toBeInTheDocument();
    await expect(systemView.parentElement).toContainElement(
      sidebar.getByRole('button', { name: '团队重点订单', hidden: true }),
    );
    await expect(canvas.getByText('共 18 条记录')).toBeInTheDocument();
    await expect(
      within(canvas.getByRole('table')).getAllByRole('row'),
    ).toHaveLength(6);
    const amount = canvas.getByLabelText('订单金额值');
    await userEvent.clear(amount);
    await userEvent.type(amount, '1000');
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled();
    await expect(canvas.getByText('筛选未生效')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await canvas.findByRole('row', { name: /ORD-202609-1002/ });
    await expect(canvas.getByText('共 12 条记录')).toBeInTheDocument();
    await expect(canvas.getByTestId('record-query')).toHaveTextContent('1000');

    await userEvent.click(
      canvas.getByRole('checkbox', { name: '选择记录 ORD-202609-1002' }),
    );
    await expect(
      canvas.getByRole('button', { name: /批量处理/ }),
    ).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: /订单金额排序/ }));
    await waitFor(() =>
      expect(
        within(canvas.getByRole('table')).getAllByRole('row')[1],
      ).toHaveTextContent('ORD-202609-1009'),
    );
    await expect(
      canvas.getByRole('button', { name: /批量处理/ }),
    ).toBeDisabled();
    await expect(canvas.getByTestId('record-query')).toHaveTextContent(
      '"field": "amount"',
    );
    await userEvent.click(
      canvas.getByRole('checkbox', { name: '选择记录 ORD-202609-1009' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: '下一页' }));
    await canvas.findByRole('row', { name: /ORD-202609-1015/ });
    await expect(canvas.getByText('第 2 / 3 页')).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: /批量处理/ }),
    ).toBeDisabled();
    await userEvent.click(canvas.getByRole('combobox', { name: '每页记录数' }));
    await userEvent.click(await page.findByRole('option', { name: '10 条' }));
    await waitFor(() =>
      expect(
        within(canvas.getByRole('table')).getAllByRole('row'),
      ).toHaveLength(11),
    );
    await expect(canvas.getByText('第 1 / 2 页')).toBeInTheDocument();

    const callsBeforeColumns =
      canvas.getByTestId('record-query-count').textContent;
    await userEvent.click(canvas.getByRole('button', { name: '列设置' }));
    await userEvent.click(
      await page.findByRole('checkbox', { name: /^显示\s*客户$/ }),
    );
    await userEvent.keyboard('{Escape}');
    await expect(
      canvas.queryByRole('columnheader', { name: /客户/ }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      callsBeforeColumns!,
    );
    await userEvent.click(canvas.getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(canvas.getByTestId('record-save-count')).toHaveTextContent(/^1$/),
    );
    await expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled();
    await expect(canvas.getByTestId('record-write')).toHaveTextContent(
      '"revision": "2"',
    );
    await expect(
      canvas.queryByText('已编辑', { exact: true }),
    ).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: '视图选项' }));
    await userEvent.click(
      await page.findByRole('menuitem', { name: '另存为' }),
    );
    const saveDialog = await page.findByRole('dialog', { name: '另存为视图' });
    await userEvent.clear(
      within(saveDialog).getByRole('textbox', { name: '视图名称' }),
    );
    await userEvent.type(
      within(saveDialog).getByRole('textbox', { name: '视图名称' }),
      '高额订单 · 共享',
    );
    const visibility = within(saveDialog).getByRole('radiogroup', {
      name: '可见范围',
    });
    await expect(
      within(visibility).getByRole('radio', { name: '个人视图' }),
    ).toBeChecked();
    await expect(
      within(visibility).getByRole('radio', { name: '个人视图' }),
    ).toHaveAccessibleDescription('仅自己可见，适合保存个人常用配置。');
    await expect(
      within(visibility).getByRole('radio', { name: '公共视图' }),
    ).toHaveAccessibleDescription('对有访问权限的用户可见，适合团队共享。');
    await userEvent.click(
      within(visibility).getByText('公共视图', { exact: true }),
    );
    await expect(
      within(visibility).getByRole('radio', { name: '公共视图' }),
    ).toBeChecked();
    await userEvent.click(
      within(saveDialog).getByRole('button', { name: '创建视图' }),
    );
    await waitFor(() =>
      expect(
        page.queryByRole('dialog', { name: '另存为视图' }),
      ).not.toBeInTheDocument(),
    );
    await expect(canvas.getByTestId('record-create-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByTestId('record-write')).toHaveTextContent(
      '高额订单 · 共享',
    );
    await expect(canvas.getByTestId('record-write')).toHaveTextContent(
      '"source": "shared"',
    );

    await chooseInstance(canvasElement, '我的订单');
    await userEvent.clear(canvas.getByLabelText('订单金额值'));
    await userEvent.type(canvas.getByLabelText('订单金额值'), '2500');
    await chooseInstance(canvasElement, '全部订单 系统');
    await expect(
      canvas.queryByRole('button', { name: '保存' }),
    ).not.toBeInTheDocument();
    await chooseInstance(canvasElement, '我的订单 · 待查询');
    await expect(canvas.getByLabelText('订单金额值')).toHaveValue('2500');
    await userEvent.click(canvas.getByRole('button', { name: '视图选项' }));
    await userEvent.click(await page.findByRole('menuitem', { name: '还原' }));
    await expect(canvas.getByLabelText('订单金额值')).toHaveValue('1000');
  },
};

export const CompactWorkbench: Story = {
  name: '紧凑工作台 · 工具栏与筛选收起',
  render: args => <Scenario {...args} summaries pageSize={15} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    const page = within(canvasElement.ownerDocument.body);
    const toolbar = canvas.getByRole('group', { name: '全局工具栏' });
    const tableToolbar = canvas.getByRole('group', { name: '表格工具栏' });
    const save = within(toolbar)
      .getByRole('button', { name: '保存' })
      .getBoundingClientRect();
    const title = within(toolbar)
      .getByRole('heading', { name: '订单管理' })
      .getBoundingClientRect();
    const create = within(toolbar)
      .getByRole('button', { name: '创建订单' })
      .getBoundingClientRect();
    await expect(
      Math.abs(save.top + save.height / 2 - create.top - create.height / 2),
    ).toBeLessThan(2);
    await expect(title.right).toBeLessThan(save.left);
    await expect(title.right).toBeLessThan(create.left);
    await expect(
      within(toolbar).queryByRole('button', { name: /批量处理|列设置/ }),
    ).not.toBeInTheDocument();
    await expect(
      within(tableToolbar).getByRole('button', { name: /批量处理/ }),
    ).toBeInTheDocument();
    await expect(
      within(tableToolbar).getByRole('button', { name: '列设置' }),
    ).toBeInTheDocument();
    const batch = within(tableToolbar)
      .getByRole('button', { name: /批量处理/ })
      .getBoundingClientRect();
    const columns = within(tableToolbar)
      .getByRole('button', { name: '列设置' })
      .getBoundingClientRect();
    await expect(batch.left).toBeGreaterThan(
      tableToolbar.getBoundingClientRect().left +
        tableToolbar.getBoundingClientRect().width / 2,
    );
    await expect(batch.right).toBeLessThan(columns.left);
    await expect(
      canvas.queryByText('筛选条件', { exact: true }),
    ).not.toBeInTheDocument();
    const query = canvas
      .getByRole('button', { name: '查询' })
      .getBoundingClientRect();
    await expect(
      canvas.getByRole('button', { name: '清空条件' }).getBoundingClientRect()
        .right,
    ).toBeLessThan(query.left);

    const saveOptions = canvas.getByRole('button', { name: '视图选项' });
    await userEvent.click(saveOptions);
    await userEvent.click(
      await page.findByRole('menuitem', { name: '另存为' }),
    );
    const dialog = await page.findByRole('dialog', { name: '另存为视图' });
    await waitFor(() =>
      expect(
        within(dialog).getByRole('textbox', { name: '视图名称' }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(saveOptions).toHaveFocus());
    const mode = within(toolbar).getByRole('button', { name: '筛选模式' });
    await userEvent.click(mode);
    await userEvent.click(
      await page.findByRole('menuitemradio', { name: '高级' }),
    );
    await waitFor(() =>
      expect(page.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await expect(
      within(toolbar).getByRole('button', { name: '收起筛选' }),
    ).toHaveTextContent('高级');
    await userEvent.click(mode);
    await userEvent.click(
      await page.findByRole('menuitemradio', { name: '简单' }),
    );
    await waitFor(() =>
      expect(page.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await expect(
      within(toolbar).getByRole('button', { name: '收起筛选' }),
    ).toHaveTextContent('简单');
    await expect(
      within(canvas.getByRole('navigation', { name: '记录分页' })).getByText(
        '共 18 条记录',
      ),
    ).toBeInTheDocument();
    const amount = canvas.getByRole('textbox', { name: '订单金额值' });
    await userEvent.clear(amount);
    await userEvent.type(amount, '2500');
    await expect(canvas.getByText('筛选未生效')).toBeVisible();
    await expect(
      within(toolbar).getByRole('button', { name: '收起筛选' }),
    ).not.toHaveTextContent('待查询');
    const tableTop = canvas.getByRole('table').getBoundingClientRect().top;
    await userEvent.click(
      within(toolbar).getByRole('button', { name: '收起筛选' }),
    );
    const expand = within(toolbar).getByRole('button', { name: '展开筛选' });
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await expect(expand).toHaveFocus();
    await expect(expand).toHaveTextContent('待查询');
    await expect(amount).toBeInTheDocument();
    await expect(amount).not.toBeVisible();
    await expect(
      tableTop - canvas.getByRole('table').getBoundingClientRect().top,
    ).toBeGreaterThan(60);
    await userEvent.click(
      canvas.getByRole('checkbox', { name: '选择记录 ORD-202609-1001' }),
    );
    await expect(
      within(tableToolbar).getByText('已选本页 1 条'),
    ).toBeInTheDocument();
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled();
    await userEvent.click(expand);
    await expect(canvas.getByRole('textbox', { name: '订单金额值' })).toBe(
      amount,
    );
    await expect(amount).toHaveValue('2500');
    await userEvent.click(
      within(tableToolbar).getByRole('button', { name: '取消选择' }),
    );
    await expect(tableToolbar).toHaveFocus();
    await expect(
      canvas.getByRole('checkbox', { name: '选择记录 ORD-202609-1001' }),
    ).not.toBeChecked();
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await waitFor(() =>
      expect(canvas.getByTestId('record-query-count')).toHaveTextContent(/^2$/),
    );
    await expect(canvas.getByTestId('record-query')).toHaveTextContent('2500');
    await userEvent.click(
      within(toolbar).getByRole('button', { name: '收起筛选' }),
    );
  },
};

function ResponsiveWorkbench(args: DemoArgs) {
  const [narrow, setNarrow] = useState(false);
  return (
    <>
      <Button onClick={() => setNarrow(value => !value)}>
        {narrow ? '展开工作区' : '切换窄容器'}
      </Button>
      <div
        data-testid="responsive-record-host"
        style={{ width: narrow ? 414 : '100%', maxWidth: '100%' }}
      >
        <Scenario {...args} summaries pageSize={15} sidebarCollapsed />
      </div>
    </>
  );
}
export const ResponsiveColumns: Story = {
  name: '业务工作台 · 自动列宽与更多记录',
  render: args => <ResponsiveWorkbench {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1015/ });
    const table = canvas.getByRole('table');
    const scroller = table.parentElement!;
    const row = canvas.getByRole('row', { name: /ORD-202609-1001/ });
    const id = within(row).getByText('ORD-202609-1001').closest('td')!;
    const idHandle = canvas.getByRole('separator', {
      name: '调整订单编号列宽',
    });
    await expect(getComputedStyle(idHandle).borderRightWidth).toBe('0px');
    await expect(getComputedStyle(idHandle.closest('th')!).boxShadow).toBe(
      getComputedStyle(id).boxShadow,
    );
    const startX = idHandle.getBoundingClientRect().right;
    await fireEvent.mouseDown(idHandle, { clientX: startX });
    await fireEvent.mouseMove(canvasElement.ownerDocument, {
      clientX: startX + 24,
    });
    await waitFor(() =>
      expect(getComputedStyle(idHandle).borderRightWidth).toBe('1px'),
    );
    await fireEvent.mouseUp(canvasElement.ownerDocument, { clientX: startX });
    await waitFor(() =>
      expect(getComputedStyle(idHandle).borderRightWidth).toBe('0px'),
    );
    const amount = within(row).getByText('¥680.00').closest('td')!;
    const customer = within(row).getByText('青岚科技').closest('td')!;
    const actions = within(row)
      .getByRole('button', { name: '查看订单 ORD-202609-1001' })
      .closest('td')!;
    const near = (a: number, b: number) =>
      expect(Math.abs(a - b)).toBeLessThan(2);
    await waitFor(() => {
      near(table.getBoundingClientRect().width, scroller.clientWidth);
      expect(customer.getBoundingClientRect().width).toBeGreaterThan(180);
      near(id.getBoundingClientRect().width, 210);
      near(amount.getBoundingClientRect().width, 150);
      near(actions.getBoundingClientRect().width, 110);
      near(
        actions.getBoundingClientRect().right,
        scroller.getBoundingClientRect().right,
      );
    });
    await expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: '切换窄容器' }));
    await waitFor(() => {
      near(customer.getBoundingClientRect().width, 180);
      expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    });
    await userEvent.click(canvas.getByRole('button', { name: '展开工作区' }));
    await waitFor(() =>
      expect(customer.getBoundingClientRect().width).toBeGreaterThan(180),
    );
    const previousWidth = customer.getBoundingClientRect().width;
    const handle = canvas.getByRole('separator', { name: '调整客户列宽' });
    await expect(getComputedStyle(handle).borderRightWidth).toBe('1px');
    handle.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() =>
      near(customer.getBoundingClientRect().width, previousWidth - 10),
    );
    await expect(canvas.getByRole('button', { name: '保存' })).toBeEnabled();
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByTestId('record-summary-count')).toHaveTextContent(
      /^1$/,
    );
    await userEvent.click(canvas.getByRole('button', { name: '视图选项' }));
    await userEvent.click(await page.findByRole('menuitem', { name: '还原' }));
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled(),
    );
  },
};

export const CursorRecords: Story = {
  name: '游标查询 · 只向后翻页',
  render: args => <Scenario {...args} mode="cursor" summaries />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    await expect(
      canvas.queryByRole('button', { name: '上一页' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole('checkbox', { name: '选择记录 ORD-202609-1001' }),
    );
    for (const id of ['1006', '1011', '1016']) {
      await userEvent.click(canvas.getByRole('button', { name: '下一页' }));
      await canvas.findByRole('row', { name: new RegExp(`ORD-202609-${id}`) });
      await expect(
        canvas.getByRole('button', { name: /批量处理/ }),
      ).toBeDisabled();
    }
    await expect(canvas.getByText('第 4 页')).toBeInTheDocument();
    await expect(canvas.getByText('本页 3 条记录')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '下一页' })).toBeDisabled();
    await expect(canvas.getByTestId('record-query')).toHaveTextContent(
      'orders:15',
    );
  },
};

export const EmptyRecords: Story = {
  name: '空列表 · 保留创建入口',
  render: args => <Scenario {...args} empty />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('共 0 条记录');
    await expect(
      canvas.getByRole('button', { name: '创建订单' }),
    ).toBeEnabled();
    await expect(
      canvas.getByRole('button', { name: /批量处理/ }),
    ).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: '创建订单' }));
    await canvas.findByRole('row', { name: /ORD-202609-1019/ });
    await expect(canvas.getByText('共 1 条记录')).toBeInTheDocument();
    await expect(
      canvas.getByRole('status', { name: '订单操作结果' }),
    ).toHaveTextContent('已创建订单 ORD-202609-1019');
  },
};

export const QueryFailure: Story = {
  name: '查询失败 · 保留草稿重试',
  render: args => <Scenario {...args} failFirstQuery />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('订单服务暂时不可用，请重试查询。');
    await expect(canvas.getByRole('alert').closest('table')).toBe(
      canvas.getByRole('table'),
    );
    await expect(canvas.queryByRole('img', { name: '暂无记录' })).toBeNull();
    await expect(canvas.queryByText('本页 0 条记录')).toBeNull();
    await expect(
      canvas.queryByRole('navigation', { name: '记录分页' }),
    ).toBeNull();
    await userEvent.clear(canvas.getByLabelText('订单金额值'));
    await userEvent.type(canvas.getByLabelText('订单金额值'), '1000');
    await userEvent.click(canvas.getByRole('button', { name: '重试查询' }));
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    await expect(canvas.getByLabelText('订单金额值')).toHaveValue('1000');
    await expect(canvas.getByText('筛选未生效')).toBeInTheDocument();
    await expect(canvas.getByTestId('record-query')).toHaveTextContent(
      '"value": 0',
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await canvas.findByText('共 12 条记录');
    await expect(
      canvas.queryByText('订单服务暂时不可用，请重试查询。'),
    ).not.toBeInTheDocument();
    await expect(canvas.getByTestId('record-query')).toHaveTextContent('1000');
  },
};

export const DarkRecords: Story = {
  name: '深色 · 订单工作台',
  args: { appearance: 'dark' },
  render: args => <Scenario {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    for (const trigger of ['视图选项', '筛选模式']) {
      const button = canvas.getByRole('button', { name: trigger });
      await userEvent.click(button);
      await expect(
        getComputedStyle(await page.findByRole('menu')).colorScheme,
      ).toBe(args.appearance);
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(button).toHaveFocus());
    }
    await userEvent.click(canvas.getByRole('button', { name: '列设置' }));
    await expect(
      getComputedStyle(await page.findByRole('dialog', { name: '列设置' }))
        .colorScheme,
    ).toBe(args.appearance);
    await expect(
      await page.findByRole('checkbox', { name: /^显示\s*订单金额$/ }),
    ).toBeChecked();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '列设置' })).toHaveFocus(),
    );
  },
};

function ThemeSwitchingRecords({ appearance }: DemoArgs) {
  const [theme, setTheme] = useState(appearance);
  return (
    <>
      <Button
        onClick={() =>
          setTheme(value => (value === 'light' ? 'dark' : 'light'))
        }
      >
        切换主题
      </Button>
      <Scenario appearance={theme} />
    </>
  );
}

export const ThemeSwitching: Story = {
  name: '主题切换 · 保存弹层',
  render: args => <ThemeSwitchingRecords {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    for (const theme of [
      args.appearance === 'light' ? 'dark' : 'light',
      args.appearance,
    ]) {
      await userEvent.click(canvas.getByRole('button', { name: '切换主题' }));
      const menu = canvas.getByRole('button', { name: '视图选项' });
      await userEvent.click(menu);
      await expect(
        getComputedStyle(await page.findByRole('menu')).colorScheme,
      ).toBe(theme);
      await userEvent.click(
        await page.findByRole('menuitem', { name: '另存为' }),
      );
      const dialog = await page.findByRole('dialog', { name: '另存为视图' });
      await waitFor(() =>
        expect(getComputedStyle(dialog).colorScheme).toBe(theme),
      );
      const visibility = within(dialog).getByRole('radiogroup', {
        name: '可见范围',
      });
      await expect(getComputedStyle(visibility).colorScheme).toBe(theme);
      await userEvent.click(
        within(visibility).getByRole('radio', { name: '个人视图' }),
      );
      await userEvent.keyboard('{ArrowDown}');
      await expect(
        within(visibility).getByRole('radio', { name: '公共视图' }),
      ).toBeChecked();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(menu).toHaveFocus());
    }
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByTestId('record-create-count')).toHaveTextContent(
      /^0$/,
    );
  },
};

export const RestoreFocus: Story = {
  name: '仅保存权限 · 还原焦点',
  render: args => <Scenario {...args} saveOnly />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    for (const interaction of ['keyboard', 'pointer']) {
      await userEvent.click(canvas.getByRole('button', { name: '列设置' }));
      await userEvent.click(
        await page.findByRole('checkbox', { name: /^显示\s*客户$/ }),
      );
      await userEvent.keyboard('{Escape}');
      const actions = canvas.getByRole('group', { name: '视图操作' });
      const menu = within(actions).getByRole('button', { name: '视图选项' });
      if (interaction === 'keyboard') {
        menu.focus();
        await userEvent.keyboard('{Enter}');
        await page.findByRole('menuitem', { name: '还原' });
        await userEvent.keyboard('{ArrowDown}{Enter}');
      } else {
        await userEvent.click(menu);
        await userEvent.click(
          await page.findByRole('menuitem', { name: '还原' }),
        );
      }
      await waitFor(() => expect(actions).toHaveFocus());
      await expect(menu).not.toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled();
      await expect(
        canvas.getByRole('columnheader', { name: /客户/ }),
      ).toBeVisible();
      await expect(
        canvas.queryByText('已编辑', { exact: true }),
      ).not.toBeInTheDocument();
      await userEvent.keyboard('{Tab}');
      await expect(
        canvas.getByRole('button', { name: '收起筛选' }),
      ).toHaveFocus();
    }
    await expect(canvas.getByTestId('record-save-count')).toHaveTextContent(
      /^0$/,
    );
  },
};

export const NarrowRecords: Story = {
  name: '窄容器 · 实例选择与表格滚动',
  render: args => (
    <div data-testid="narrow-record-host" style={{ maxWidth: 414 }}>
      <Scenario {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = canvasElement.ownerDocument;
    const page = within(document.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    const firstRow = canvas.getByRole('row', { name: /ORD-202609-1001/ });
    const keyCell = within(firstRow)
      .getByLabelText('ORD-202609-1001')
      .closest('td')!;
    const actionTrigger = within(firstRow).getByRole('button', {
      name: '记录 ORD-202609-1001 操作',
    });
    await waitFor(() =>
      expect(
        actionTrigger.closest('td')!.getBoundingClientRect().left -
          keyCell.getBoundingClientRect().right,
      ).toBeGreaterThanOrEqual(127),
    );
    await userEvent.click(actionTrigger);
    const actions = await page.findByRole('dialog', {
      name: '记录 ORD-202609-1001 操作',
    });
    await userEvent.click(
      within(actions).getByRole('button', { name: '查看订单 ORD-202609-1001' }),
    );
    await expect(
      canvas.getByRole('status', { name: '订单操作结果' }),
    ).toHaveTextContent('青岚科技');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(actionTrigger).toHaveFocus());
    await expect(
      canvas.queryByRole('complementary', { name: '视图列表' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('combobox', { name: '选择视图实例' }),
    ).toBeVisible();
    await chooseInstance(canvasElement, '全部订单 系统');
    await expect(
      canvas.getByRole('combobox', { name: '选择视图实例' }),
    ).toHaveTextContent('全部订单');

    // A modified read-only instance offers Save As as the primary button and Restore in the menu.
    await userEvent.click(canvas.getByRole('button', { name: '列设置' }));
    await userEvent.click(
      await page.findByRole('checkbox', { name: /^显示\s*客户$/ }),
    );
    await userEvent.keyboard('{Escape}');
    await expect(
      canvas.getByRole('button', { name: '视图选项' }),
    ).toBeVisible();

    const host = canvas.getByTestId('narrow-record-host');
    const scroller = canvas.getByRole('table').parentElement!;
    await expect(host.getBoundingClientRect().width).toBeLessThanOrEqual(414);
    await expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await expect(getComputedStyle(scroller).overflowX).toBe('auto');
    scroller.scrollLeft = scroller.scrollWidth;
    await expect(scroller.scrollLeft).toBeGreaterThan(0);
    scroller.scrollLeft = 0;
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );

    for (const [trigger, title] of [
      ['列设置', '列设置'],
      ['另存为', '另存为视图'],
    ]) {
      await userEvent.click(canvas.getByRole('button', { name: trigger }));
      const dialog = await page.findByRole('dialog', { name: title });
      if (title === '另存为视图') {
        await waitFor(() => {
          const rect = dialog.getBoundingClientRect();
          expect(
            Math.abs(
              rect.left +
                rect.width / 2 -
                document.documentElement.clientWidth / 2,
            ),
          ).toBeLessThan(2);
          expect(
            Math.abs(
              rect.top +
                rect.height / 2 -
                document.documentElement.clientHeight / 2,
            ),
          ).toBeLessThan(2);
          expect(getComputedStyle(dialog).boxSizing).toBe('border-box');
        });
      }
      const bounds = dialog.getBoundingClientRect();
      await expect(bounds.left).toBeGreaterThanOrEqual(0);
      await expect(bounds.right).toBeLessThanOrEqual(
        document.documentElement.clientWidth,
      );
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(
          page.queryByRole('dialog', { name: title }),
        ).not.toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: trigger })).toHaveFocus(),
      );
    }
  },
};

export const LocalDefinitions: Story = {
  name: '本地定义 · 自定义订单操作',
  render: args => <Scenario {...args} local />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    await userEvent.click(
      canvas.getByRole('button', { name: '查看订单 ORD-202609-1001' }),
    );
    await expect(
      canvas.getByRole('status', { name: '订单操作结果' }),
    ).toHaveTextContent('青岚科技 · 负责人 林晨 · 上海 · 当前视图：我的订单');
    await userEvent.click(
      canvas.getByRole('checkbox', { name: '选择记录 ORD-202609-1001' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: /批量处理/ }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: '订单操作结果' }),
      ).toHaveTextContent('已处理 1 笔订单'),
    );
    await expect(
      canvas.getByRole('row', { name: /ORD-202609-1001/ }),
    ).toHaveTextContent('处理中');
    await expect(
      canvas.getByRole('checkbox', { name: '选择记录 ORD-202609-1001' }),
    ).not.toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: '创建订单' }));
    await canvas.findByText('共 19 条记录');
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^3$/,
    );
  },
};

export const Summaries: Story = {
  name: '汇总 · 本页与所有同时展示',
  render: args => <Scenario {...args} summaries />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    const local = () => canvas.getByRole('row', { name: '本页汇总' });
    const all = () => canvas.getByRole('row', { name: '所有汇总' });
    await expect(local()).toHaveTextContent('8,499');
    await waitFor(() => expect(all()).toHaveTextContent('36,456'));
    await expect(
      canvas.queryByRole('combobox', { name: '汇总范围' }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByTestId('record-summary-count')).toHaveTextContent(
      /^1$/,
    );
    await userEvent.click(canvas.getByRole('button', { name: '下一页' }));
    await canvas.findByRole('row', { name: /ORD-202609-1006/ });
    await expect(local()).toHaveTextContent('9,538');
    await expect(all()).toHaveTextContent('36,456');
    await expect(canvas.getByTestId('record-summary-count')).toHaveTextContent(
      /^1$/,
    );
    await userEvent.clear(canvas.getByRole('textbox', { name: '订单金额值' }));
    await userEvent.type(
      canvas.getByRole('textbox', { name: '订单金额值' }),
      '1000',
    );
    await expect(local()).toHaveTextContent('9,538');
    await expect(all()).toHaveTextContent('36,456');
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(all()).toHaveTextContent('32,117'));
    await expect(local()).toHaveTextContent('13,958');
    await expect(canvas.getByTestId('record-summary-count')).toHaveTextContent(
      /^2$/,
    );
    await userEvent.click(canvas.getByRole('button', { name: '列设置' }));
    for (const title of ['订单编号', '客户', '订单状态', '下单时间'])
      await expect(
        page.queryByRole('combobox', { name: `${title}汇总方式` }),
      ).not.toBeInTheDocument();
    await userEvent.click(
      await page.findByRole('combobox', { name: '订单金额汇总方式' }),
    );
    await expect(
      page.queryByRole('option', { name: '记录数' }),
    ).not.toBeInTheDocument();
    await userEvent.click(await page.findByRole('option', { name: '平均值' }));
    await expect(page.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    );
    await expect(page.getByRole('option', { name: '合计' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('option', { name: '平均值' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        page.getByRole('combobox', { name: '订单金额汇总方式' }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        page.queryByRole('dialog', { name: '列设置' }),
      ).not.toBeInTheDocument(),
    );
    await expect(local()).toHaveTextContent('13,958');
    await expect(local()).toHaveTextContent('¥2,791.60');
    await waitFor(() => expect(all()).toHaveTextContent('¥2,676.42'));
    await expect(all()).toHaveTextContent('32,117');
    await expect(canvas.getAllByText('本页', { exact: true })).toHaveLength(1);
    await expect(canvas.getAllByText('所有', { exact: true })).toHaveLength(1);
    const average = within(all()).getByLabelText(
      '所有订单金额平均值：¥2,676.42',
    );
    await expect(getComputedStyle(average).whiteSpace).toBe('nowrap');
    average.focus();
    await expect(await page.findByRole('tooltip')).toHaveTextContent(
      '原值：2676.4166666666665',
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('tooltip')).toBeNull());
    average.blur();
    await userEvent.hover(average);
    await expect(await page.findByRole('tooltip')).toHaveTextContent(
      '原值：2676.4166666666665',
    );
    await userEvent.unhover(average);
    await waitFor(() => expect(page.queryByRole('tooltip')).toBeNull());
    await expect(canvas.getByTestId('record-summary-count')).toHaveTextContent(
      /^3$/,
    );
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^3$/,
    );
    await userEvent.click(canvas.getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(canvas.getByTestId('record-save-count')).toHaveTextContent(/^1$/),
    );
    await expect(canvas.getByTestId('record-write')).toHaveTextContent(
      /"summary":\s*\[\s*"SUM",\s*"AVG"\s*\]/,
    );
  },
};

export const LoadingSummaries: Story = {
  name: '加载状态 · Spin 与汇总',
  render: args => {
    const instance = makeInstances('paged', true).instances[0];
    instance.config.presentation.table.columns =
      instance.config.presentation.table.columns.map(column =>
        column.kind === 'field' && column.field === 'amount'
          ? { ...column, summary: ['AVG', 'MIN', 'MAX'] }
          : column,
      );
    const loading = { status: 'loading' as const, values: {}, error: null };
    return (
      <div
        className="fve-root"
        data-theme={args.appearance}
        style={{
          padding: 16,
          minHeight: '100vh',
          background: 'var(--fve-background)',
        }}
      >
        <RecordTable
          definition={definition}
          instance={instance}
          rows={[]}
          querying
          selectable
          pageSummary={loading}
          allSummary={loading}
          selectedRowKeys={[]}
          onSelectionChange={() => {}}
          onColumnsChange={() => {}}
          onSortChange={() => {}}
          refresh={async () => {}}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('status')).toHaveLength(3);
    await expect(
      canvas.getByRole('status', { name: '正在加载记录' }),
    ).toBeVisible();
    for (const label of ['本页', '所有']) {
      const scope = within(canvas.getByRole('row', { name: `${label}汇总` }));
      await expect(
        scope.getByRole('status', { name: `${label}汇总加载中` }),
      ).toBeVisible();
      await expect(scope.getAllByRole('group')).toHaveLength(3);
    }
    await expect(canvas.queryByText(/统计中|正在加载/)).toBeNull();
  },
};

export const SummaryFailure: Story = {
  name: '汇总失败 · 保留本页与独立重试',
  render: args => <Scenario {...args} summaries failFirstSummary />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const firstRow = await canvas.findByRole('row', {
      name: /ORD-202609-1001/,
    });
    const selectionCell = within(firstRow).getByRole('checkbox').closest('td')!;
    const idCell = within(firstRow).getByText('ORD-202609-1001').closest('td')!;
    await waitFor(() => {
      for (const label of ['本页', '所有']) {
        const scope = canvas.getByLabelText(`${label}汇总状态`);
        const area = scope.closest('th')!.getBoundingClientRect();
        const content = scope.getBoundingClientRect();
        expect(
          Math.abs(area.left - selectionCell.getBoundingClientRect().left),
        ).toBeLessThan(2);
        expect(
          Math.abs(area.right - idCell.getBoundingClientRect().right),
        ).toBeLessThan(2);
        expect(
          Math.abs(
            content.left + content.width / 2 - (area.left + area.width / 2),
          ),
        ).toBeLessThan(2);
      }
    });
    const all = canvas.getByRole('row', { name: '所有汇总' });
    const error = await within(all).findByRole('button', {
      name: '所有汇总失败，查看详情',
    });
    await expect(canvas.getAllByRole('alert')).toHaveLength(1);
    await expect(within(all).getByRole('alert')).toHaveTextContent(
      '所有汇总失败',
    );
    await expect(within(all).getByText('—')).toBeVisible();
    await expect(
      canvas.queryByText('汇总服务暂时不可用，请重试汇总。'),
    ).toBeNull();
    await expect(
      canvas.getByRole('row', { name: '本页汇总' }),
    ).toHaveTextContent('8,499');
    await expect(
      canvas.getByRole('row', { name: /ORD-202609-1001/ }),
    ).toBeInTheDocument();
    await userEvent.click(error);
    await expect(
      await page.findByRole('dialog', { name: '所有汇总失败' }),
    ).toHaveTextContent('汇总服务暂时不可用，请重试汇总。');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(error).toHaveFocus());
    await userEvent.click(error);
    const details = await page.findByRole('dialog', { name: '所有汇总失败' });
    await userEvent.click(
      within(details).getByRole('button', { name: '重试汇总' }),
    );
    await waitFor(() => expect(all).toHaveTextContent('36,456'));
    await expect(page.queryByRole('dialog')).toBeNull();
    await expect(canvas.queryByRole('alert')).toBeNull();
    await waitFor(() =>
      expect(canvas.getByLabelText('所有汇总状态')).toHaveFocus(),
    );
    await expect(
      canvas.getByRole('row', { name: '本页汇总' }),
    ).toHaveTextContent('8,499');
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByTestId('record-summary-count')).toHaveTextContent(
      /^2$/,
    );
  },
};

export const PinnedColumns: Story = {
  name: '固定列 · 主键在左操作在右',
  render: args => (
    <div style={{ maxWidth: 900 }}>
      <Scenario {...args} summaries />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const row = await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    const table = canvas.getByRole('table');
    const scroller = table.parentElement!;
    const actionCell = within(row)
      .getByRole('button', { name: '查看订单 ORD-202609-1001' })
      .closest('td')!;
    const actionHeader = canvas
      .getByRole('separator', { name: '调整操作列宽' })
      .closest('th')!;
    const idCell = within(row).getByText('ORD-202609-1001').closest('td')!;
    const idHeader = canvas
      .getByRole('separator', { name: '调整订单编号列宽' })
      .closest('th')!;
    const rightEdge = () => scroller.getBoundingClientRect().right;
    const near = (actual: number, expected: number) =>
      expect(Math.abs(actual - expected)).toBeLessThan(2);
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    for (const scrollLeft of [0, 120, scroller.scrollWidth]) {
      scroller.scrollLeft = scrollLeft;
      await waitFor(() => {
        near(actionCell.getBoundingClientRect().right, rightEdge());
        near(actionHeader.getBoundingClientRect().right, rightEdge());
        near(
          idCell.getBoundingClientRect().left,
          scroller.getBoundingClientRect().left + 48,
        );
        near(
          idHeader.getBoundingClientRect().left,
          idCell.getBoundingClientRect().left,
        );
      });
    }
    await userEvent.click(within(row).getByRole('checkbox'));
    await waitFor(() =>
      expect(getComputedStyle(actionCell).backgroundColor).toBe(
        getComputedStyle(row).backgroundColor,
      ),
    );
    await userEvent.click(within(row).getByRole('checkbox'));

    async function togglePin(title: string, pressed: boolean) {
      await userEvent.click(canvas.getByRole('button', { name: '列设置' }));
      const pin = await page.findByRole('button', { name: `固定${title}` });
      pin.focus();
      await userEvent.keyboard(' ');
      await expect(pin).toHaveAttribute('aria-pressed', String(pressed));
      await expect(pin).toHaveFocus();
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(
          page.queryByRole('dialog', { name: '列设置' }),
        ).not.toBeInTheDocument(),
      );
    }
    await userEvent.click(canvas.getByRole('button', { name: '列设置' }));
    await expect(
      page.queryByRole('combobox', { name: /固定位置/ }),
    ).not.toBeInTheDocument();
    for (const title of ['订单编号', '操作']) {
      await expect(
        page.getByRole('button', { name: `固定${title}` }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: `固定${title}` }),
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(
        page.getByRole('button', { name: `拖动调整${title}顺序` }),
      ).toBeDisabled();
    }
    await expect(page.queryByRole('spinbutton')).not.toBeInTheDocument();
    await expect(
      page.getByRole('button', { name: '固定订单金额' }),
    ).toBeDisabled();
    await expect(page.getByRole('button', { name: '固定客户' })).toBeEnabled();
    await expect(
      page.getByRole('button', { name: '固定下单时间' }),
    ).toBeEnabled();
    const summaryControl = page.getByRole('combobox', {
      name: '订单金额汇总方式',
    });
    near(
      summaryControl.getBoundingClientRect().top +
        summaryControl.getBoundingClientRect().height / 2,
      page.getByRole('button', { name: '固定订单金额' }).getBoundingClientRect()
        .top +
        page
          .getByRole('button', { name: '固定订单金额' })
          .getBoundingClientRect().height /
          2,
    );
    const customerHandle = page.getByRole('button', {
      name: '拖动调整客户顺序',
    });
    const amountItem = page
      .getByRole('checkbox', { name: /显示\s*订单金额/ })
      .closest('li')!;
    const columnList = amountItem.parentElement!;
    const dropY =
      (amountItem.getBoundingClientRect().bottom +
        amountItem.nextElementSibling!.getBoundingClientRect().top) /
      2;
    const dataTransfer = new DataTransfer();
    await fireEvent.dragStart(customerHandle, { dataTransfer });
    await fireEvent.dragOver(columnList, { dataTransfer, clientY: dropY });
    const dropIndicator = columnList.querySelector(
      '[data-slot="column-drop-indicator"]',
    )!;
    await expect(dropIndicator).toBeInTheDocument();
    near(dropIndicator.getBoundingClientRect().top, dropY);
    await expect(
      canvas.queryByText('已编辑', { exact: true }),
    ).not.toBeInTheDocument();
    await fireEvent.drop(columnList, { dataTransfer, clientY: dropY });
    await fireEvent.dragEnd(customerHandle, { dataTransfer });
    await expect(canvas.getByRole('button', { name: '保存' })).toBeEnabled();
    await expect(
      canvas
        .getAllByRole('columnheader')
        .slice(1, 4)
        .map(header => header.textContent),
    ).toEqual(['订单编号', '订单金额', '客户']);
    customerHandle.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(customerHandle).toHaveFocus();
    await expect(
      canvas
        .getAllByRole('columnheader')
        .slice(1, 5)
        .map(header => header.textContent),
    ).toEqual(['订单编号', '订单金额', '订单状态', '客户']);
    await expect(
      page.queryByRole('button', { name: /上移|下移/ }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        page.queryByRole('dialog', { name: '列设置' }),
      ).not.toBeInTheDocument(),
    );
    await togglePin('订单金额', true);
    const amountCell = within(row).getByText('¥680.00').closest('td')!;
    const idSummary = within(
      canvas.getByRole('row', { name: '本页汇总' }),
    ).getByRole('rowheader', { name: '本页' });
    const amountSummary = within(canvas.getByRole('row', { name: '本页汇总' }))
      .getByRole('group', { name: '订单金额合计' })
      .closest('td')!;
    scroller.scrollLeft = 80;
    await waitFor(() => {
      near(
        idCell.getBoundingClientRect().left,
        scroller.getBoundingClientRect().left + 48,
      );
      near(
        idSummary.getBoundingClientRect().left,
        scroller.getBoundingClientRect().left,
      );
      near(
        amountCell.getBoundingClientRect().left,
        idCell.getBoundingClientRect().right,
      );
      near(
        amountSummary.getBoundingClientRect().left,
        amountCell.getBoundingClientRect().left,
      );
    });
    const handle = canvas.getByRole('separator', { name: '调整订单编号列宽' });
    handle.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      near(idCell.getBoundingClientRect().width, 220);
      near(idSummary.getBoundingClientRect().width, 220 + 48);
    });
    await togglePin('订单金额', false);
    await expect(getComputedStyle(amountCell).position).not.toBe('sticky');
    await expect(getComputedStyle(idCell).position).toBe('sticky');
    await expect(getComputedStyle(actionCell).position).toBe('sticky');
    await userEvent.click(canvas.getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(canvas.getByTestId('record-write')).toHaveTextContent(
        '"pinned": false',
      ),
    );
    const saved = JSON.parse(
      canvas.getByTestId('record-write').textContent!,
    ) as ViewInstance;
    await expect(
      saved.config.presentation.table.columns.map(column => column.id),
    ).toEqual(['id', 'amount', 'status', 'customer', 'createdAt', 'actions']);
    await togglePin('订单金额', true);
    await userEvent.click(canvas.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(canvas.getByTestId('record-write')).toHaveTextContent(
        '"pinned": "left"',
      );
    });
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByTestId('record-summary-count')).toHaveTextContent(
      /^1$/,
    );
    await userEvent.click(
      within(row).getByRole('button', { name: '查看订单 ORD-202609-1001' }),
    );
    await expect(
      canvas.getByRole('status', { name: '订单操作结果' }),
    ).toHaveTextContent('青岚科技 · 负责人 林晨 · 上海 · 当前视图：我的订单');
  },
};

export const EmptySummary: Story = {
  name: '空集汇总 · 保留空值',
  render: args => <Scenario {...args} summaries empty />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('img', { name: '暂无记录' }),
    ).toBeVisible();
    await expect(canvas.queryByText('暂无记录')).toBeNull();
    for (const name of ['本页汇总', '所有汇总']) {
      await waitFor(() =>
        expect(
          within(canvas.getByRole('row', { name })).getByText('—', {
            exact: true,
          }),
        ).toBeInTheDocument(),
      );
    }
    await expect(
      canvas.queryByText('记录数', { exact: true }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByTestId('record-summary-count')).toHaveTextContent(
      /^1$/,
    );
  },
};

export const ManageViews: Story = {
  name: '管理视图 · 改名、排序与删除',
  render: args => <Scenario {...args} failFirstDelete sidebarCollapsed />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    const amount = canvas.getByRole('textbox', { name: '订单金额值' });
    await userEvent.clear(amount);
    await userEvent.type(amount, '2000');
    await userEvent.click(canvas.getByRole('button', { name: '视图选项' }));
    await expect(
      page.queryByRole('menuitem', { name: '删除视图' }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(
      canvas.queryByRole('button', { name: '管理视图' }),
    ).not.toBeInTheDocument();
    const chooser = canvas.getByRole('combobox', { name: '选择视图实例' });
    await userEvent.click(chooser);
    const manage = await page.findByRole('button', { name: '管理视图' });
    await expect(manage.closest('[role="listbox"]')).toBeNull();
    page.getByRole('option', { name: '我的订单' }).focus();
    await userEvent.keyboard('{Tab}');
    await expect(manage).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const manager = within(
      await page.findByRole('dialog', { name: '管理视图' }),
    );
    await expect(page.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(chooser).toHaveTextContent('我的订单');
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(
      manager.queryByRole('textbox', { name: '全部订单名称' }),
    ).not.toBeInTheDocument();
    await expect(
      manager.queryByRole('button', { name: '删除全部订单' }),
    ).not.toBeInTheDocument();
    await expect(manager.queryByRole('textbox')).not.toBeInTheDocument();
    await expect(
      manager.queryByRole('button', { name: '编辑全部订单名称' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      manager.getByRole('button', { name: '编辑我的订单名称' }),
    );
    const name = manager.getByRole('textbox', { name: '我的订单名称' });
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.clear(name);
    await userEvent.type(name, '我的工作台');
    await userEvent.click(
      manager.getByRole('button', { name: '保存我的订单名称' }),
    );
    const renamed = await manager.findByRole('button', {
      name: '编辑我的工作台名称',
    });
    await expect(manager.queryByRole('textbox')).not.toBeInTheDocument();
    await waitFor(() => expect(renamed).toHaveFocus());
    await expect(canvas.getByTestId('record-rename-count')).toHaveTextContent(
      /^1$/,
    );
    await expect(canvas.getByTestId('record-save-count')).toHaveTextContent(
      /^0$/,
    );
    await expect(amount).toHaveValue('2000');
    const publicList = manager.getByRole('list', { name: '公共视图顺序' });
    const labels = () =>
      within(publicList)
        .getAllByRole('listitem')
        .map(item => item.getAttribute('aria-label'));
    const handle = manager.getByRole('button', {
      name: '拖动调整全部订单顺序',
    });
    handle.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(labels()).toEqual(['团队重点订单', '全部订单']));
    await waitFor(() => expect(handle).toHaveFocus());
    const personalList = manager.getByRole('list', { name: '个人视图顺序' });
    const dataTransfer = new DataTransfer();
    await fireEvent.dragStart(handle, { dataTransfer });
    await fireEvent.dragOver(personalList, {
      dataTransfer,
      clientY: personalList.getBoundingClientRect().top,
    });
    await expect(
      personalList.querySelector('[data-slot="view-drop-indicator"]'),
    ).not.toBeInTheDocument();
    await fireEvent.drop(personalList, {
      dataTransfer,
      clientY: personalList.getBoundingClientRect().top,
    });
    await fireEvent.dragEnd(handle, { dataTransfer });
    await expect(canvas.getByTestId('record-order-count')).toHaveTextContent(
      /^1$/,
    );
    await fireEvent.dragStart(handle, { dataTransfer });
    const top = publicList.getBoundingClientRect().top;
    await fireEvent.dragOver(publicList, { dataTransfer, clientY: top });
    await expect(
      publicList.querySelector('[data-slot="view-drop-indicator"]'),
    ).toBeInTheDocument();
    await fireEvent.drop(publicList, { dataTransfer, clientY: top });
    await fireEvent.dragEnd(handle, { dataTransfer });
    await waitFor(() => expect(labels()).toEqual(['全部订单', '团队重点订单']));
    await expect(canvas.getByTestId('record-order-count')).toHaveTextContent(
      /^2$/,
    );
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    async function openDelete(title: string) {
      await userEvent.click(
        manager.getByRole('button', { name: `删除${title}` }),
      );
      return within(await page.findByRole('dialog', { name: '删除视图' }));
    }
    let confirm = await openDelete('我的工作台');
    await expect(confirm.getByText(/我的工作台/)).toHaveTextContent(
      '待查询的修改也会丢弃',
    );
    await waitFor(() =>
      expect(confirm.getByRole('button', { name: '取消' })).toHaveFocus(),
    );
    await userEvent.click(confirm.getByRole('button', { name: '取消' }));
    await expect(canvas.getByTestId('record-delete-count')).toHaveTextContent(
      /^0$/,
    );
    confirm = await openDelete('我的工作台');
    await userEvent.click(confirm.getByRole('button', { name: '删除视图' }));
    await expect(await confirm.findByRole('alert')).toHaveTextContent(
      '删除失败',
    );
    await expect(amount).toHaveValue('2000');
    await userEvent.click(confirm.getByRole('button', { name: '删除视图' }));
    await waitFor(() =>
      expect(
        page.queryByRole('dialog', { name: '删除视图' }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      page.getByRole('dialog', { name: '管理视图' }),
    ).toBeInTheDocument();
    await expect(
      manager.queryByRole('textbox', { name: '我的工作台名称' }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(manager.getByRole('heading', { name: '管理视图' })).toHaveFocus(),
    );
    confirm = await openDelete('团队重点订单');
    await expect(confirm.getByText(/其他使用者/)).toBeInTheDocument();
    await userEvent.click(confirm.getByRole('button', { name: '删除视图' }));
    await waitFor(() =>
      expect(
        page.queryByRole('dialog', { name: '删除视图' }),
      ).not.toBeInTheDocument(),
    );
    await expect(canvas.getByTestId('record-delete-count')).toHaveTextContent(
      /^2$/,
    );
    await expect(manager.queryByRole('textbox')).not.toBeInTheDocument();
    await userEvent.click(manager.getByRole('button', { name: '完成' }));
    await canvas.findByText('共 18 条记录');
    await waitFor(() =>
      expect(
        canvas.getByRole('combobox', { name: '选择视图实例' }),
      ).toHaveFocus(),
    );
    await expect(
      canvas.queryByRole('button', { name: '管理视图' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('button', { name: '视图选项' }),
    ).not.toBeInTheDocument();
  },
};

export const RuntimeTools: Story = {
  name: '自动刷新与页面展开',
  render: args => (
    <div style={{ maxWidth: 900 }}>
      <Scenario {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    const view = canvasElement.querySelector('[data-slot="view-page"]')!;
    const input = canvas.getByRole('textbox', { name: '订单金额值' });
    const globalToolbar = within(
      canvas.getByRole('group', { name: '全局工具栏' }),
    );
    const tableToolbar = within(
      canvas.getByRole('group', { name: '表格工具栏' }),
    );
    const table = canvas.getByRole('table');
    const query = canvas.getByRole('button', { name: '查询' });
    const tableTop = table.getBoundingClientRect().top;
    const queryTop = query.getBoundingClientRect().top;
    const addFilter = canvas.getByRole('button', { name: '添加筛选' });
    await userEvent.click(addFilter);
    const fieldPicker = await page.findByRole('dialog', {
      name: '选择筛选字段',
    });
    await waitFor(() => expect(fieldPicker).toBeVisible());
    await expect(table.getBoundingClientRect().top).toBe(tableTop);
    await expect(query.getBoundingClientRect().top).toBe(queryTop);
    await expect(
      fieldPicker.getBoundingClientRect().height,
    ).toBeLessThanOrEqual(448);
    await expect(fieldPicker.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
    await userEvent.click(
      within(fieldPicker).getByRole('button', { name: '完成' }),
    );
    await waitFor(() =>
      expect(page.queryByRole('dialog', { name: '选择筛选字段' })).toBeNull(),
    );
    await expect(addFilter).toHaveFocus();
    await expect(table.getBoundingClientRect().top).toBe(tableTop);
    await userEvent.click(addFilter);
    await page.findByRole('dialog', { name: '选择筛选字段' });
    await userEvent.click(input);
    await waitFor(() =>
      expect(page.queryByRole('dialog', { name: '选择筛选字段' })).toBeNull(),
    );
    await expect(input).toHaveFocus();
    for (const name of ['刷新', '自动刷新设置', '展开视图']) {
      await expect(globalToolbar.getByRole('button', { name })).toBeVisible();
      await expect(tableToolbar.queryByRole('button', { name })).toBeNull();
    }
    await userEvent.clear(input);
    await userEvent.type(input, '500');
    for (const label of ['30 秒', '1 分钟', '5 分钟']) {
      await userEvent.click(
        globalToolbar.getByRole('button', { name: '自动刷新设置' }),
      );
      await expect(
        (await page.findAllByRole('menuitemradio')).map(
          item => item.textContent,
        ),
      ).toEqual(['关闭自动刷新', '每 30 秒', '每 1 分钟', '每 5 分钟']);
      await userEvent.click(
        await page.findByRole('menuitemradio', { name: `每 ${label}` }),
      );
      await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
      await expect(
        globalToolbar.getByRole('button', { name: '刷新' }),
      ).toHaveTextContent(label);
    }
    await expect(
      canvas.getByRole('button', { name: '刷新' }),
    ).toHaveTextContent('已暂停');
    await userEvent.click(canvas.getByRole('button', { name: '展开视图' }));
    await waitFor(() => {
      expect(view.getBoundingClientRect().left).toBe(0);
      expect(view.getBoundingClientRect().top).toBe(0);
      expect(view.getBoundingClientRect().width).toBe(
        canvasElement.ownerDocument.documentElement.clientWidth,
      );
      expect(view.getBoundingClientRect().height).toBe(
        canvasElement.ownerDocument.documentElement.clientHeight,
      );
    });
    await expect(canvas.getByRole('textbox', { name: '订单金额值' })).toBe(
      input,
    );
    await userEvent.click(canvas.getByRole('button', { name: '列设置' }));
    const columns = await page.findByRole('dialog', { name: '列设置' });
    await expect(columns.getBoundingClientRect().right).toBeLessThanOrEqual(
      view.getBoundingClientRect().right,
    );
    await userEvent.keyboard('{Escape}');
    await expect(
      canvas.getByRole('button', { name: '收起视图' }),
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: '展开视图' }),
      ).toBeInTheDocument(),
    );
    await expect(input).toHaveValue('500');
    await expect(
      canvas.getByRole('button', { name: '展开视图' }),
    ).toHaveFocus();
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await userEvent.click(canvas.getByRole('button', { name: '自动刷新设置' }));
    await userEvent.click(
      await page.findByRole('menuitemradio', { name: '关闭自动刷新' }),
    );
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
    await userEvent.click(canvas.getByRole('button', { name: '撤销筛选修改' }));
    await expect(
      canvas.getByRole('button', { name: '刷新' }),
    ).not.toHaveTextContent('5 分钟');
    await userEvent.click(
      globalToolbar.getByRole('button', { name: '自动刷新设置' }),
    );
    await userEvent.click(
      await page.findByRole('menuitemradio', { name: '每 30 秒' }),
    );
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
    const refresh = globalToolbar.getByRole('button', { name: '刷新' });
    await waitFor(() => expect(refresh).toHaveTextContent(/00:2[89]/), {
      timeout: 3000,
    });
    await userEvent.click(canvas.getByRole('textbox', { name: '订单金额值' }));
    await expect(refresh).toHaveTextContent('已暂停');
    await userEvent.tab();
    await expect(refresh).toHaveTextContent('00:30');
    await userEvent.click(
      globalToolbar.getByRole('button', { name: '自动刷新设置' }),
    );
    await userEvent.click(
      await page.findByRole('menuitemradio', { name: '关闭自动刷新' }),
    );
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
    await expect(refresh).not.toHaveTextContent(/\d{2}:\d{2}/);
  },
};
