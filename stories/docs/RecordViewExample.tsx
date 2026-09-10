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
import {
  LocalStorageViewHost,
  createFilterConfiguration,
  resolveRecordPresentation,
  newFilterNode,
  type RecordData,
  type RecordQuerySource,
  type ViewDefinition,
  type ViewHost,
  type ViewInstanceList,
} from '@ahoo-wang/fetcher-view-engine';
import { useState } from 'react';
import type { RecordCardRenderContext } from '@ahoo-wang/fetcher-view-engine/react';
import type { ReactNode } from 'react';
import { ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import {
  FilterOperator,
  SortDirection,
  type FilterExpression,
  type PagedList,
  type PagedQueryRequest,
} from '@ahoo-wang/fetcher-wow';
import '@ahoo-wang/fetcher-view-engine/styles.css';

const orders = [
  { id: 'ORDER-001', amount: 120, status: 'pending' },
  { id: 'ORDER-002', amount: 250, status: 'done' },
  { id: 'ORDER-003', amount: 80, status: 'pending' },
];
const definition: ViewDefinition = {
  id: 'first-orders',
  sourceId: 'orders',
  title: '第一个数据视图',
  allowedLayouts: ['table', 'card'],
  rowKey: 'id',
  defaultPresentation: {
    card: {
      title: { id: 'title', field: 'id' },
      fields: [
        { id: 'amount', field: 'amount' },
        { id: 'status', field: 'status' },
      ],
    },
  },
  allowedOperators: [
    FilterOperator.MATCH_ALL,
    FilterOperator.AND,
    FilterOperator.GTE,
  ],
  fields: [
    {
      field: 'id',
      label: '订单编号',
      type: 'string',
      sortable: true,
      operators: [],
      cellRenderer: { name: 'text', options: { copyable: true } },
    },
    {
      field: 'amount',
      label: '金额',
      type: 'number',
      sortable: true,
      operators: [FilterOperator.GTE],
      summaryFunctions: [],
      numberFormat: { style: 'currency', currency: 'CNY' },
      cellRenderer: { name: 'number' },
    },
    {
      field: 'status',
      label: '状态',
      type: 'string',
      operators: [],
      options: [
        { value: 'pending', label: '待处理' },
        { value: 'done', label: '已完成' },
      ],
      cellRenderer: {
        name: 'status',
        options: { tones: [{ value: 'done', tone: 'success' }] },
      },
    },
  ],
};
const instances: ViewInstanceList = {
  defaultInstanceId: 'my-orders',
  instances: [
    {
      id: 'my-orders',
      definitionId: definition.id,
      title: '我的订单',
      kind: 'record',
      scope: { type: 'personal' },
      config: {
        filters: createFilterConfiguration({
          ...newFilterNode(FilterOperator.GTE, 'amount'),
          props: { value: 0 },
        }),
        sort: [{ field: 'id', direction: SortDirection.ASC }],
        pagination: { mode: 'paged', size: 2 },
        presentation: {
          layout: 'table',
          table: {
            columns: [
              { id: 'id', kind: 'field', field: 'id', width: 200 },
              { id: 'amount', kind: 'field', field: 'amount', width: 160 },
              { id: 'status', kind: 'field', field: 'status', width: 140 },
            ],
          },
        },
      },
    },
  ],
};

// ponytail: local amount/AND demo only; use a business QueryApi for other predicates.
function matches(amount: number, expression: FilterExpression): boolean {
  if (expression.op === FilterOperator.MATCH_ALL) return true;
  if (expression.op === FilterOperator.AND)
    return expression.operands.every(item => matches(amount, item));
  if (
    expression.op === FilterOperator.GTE &&
    expression.field === 'amount' &&
    typeof expression.value === 'number'
  )
    return amount >= expression.value;
  throw new Error('示例只支持金额下限和 AND 条件');
}
const source: RecordQuerySource = {
  async paged<T extends Partial<RecordData> = RecordData>(
    query: PagedQueryRequest,
    _attributes?: Record<string, unknown>,
    controller?: AbortController,
  ): Promise<PagedList<T>> {
    controller?.signal.throwIfAborted();
    if (!('filter' in query)) throw new Error('示例使用 FilterExpression 查询');
    const rows = orders.filter(order => matches(order.amount, query.filter));
    for (const sort of [...(query.sort ?? [])].reverse()) {
      if (sort.field !== 'id' && sort.field !== 'amount')
        throw new Error('示例只支持按编号或金额排序');
      const direction = sort.direction === SortDirection.ASC ? 1 : -1;
      rows.sort(
        (left, right) =>
          direction *
          (sort.field === 'amount'
            ? left.amount - right.amount
            : left.id.localeCompare(right.id)),
      );
    }
    const { index = 1, size = 2 } = query.pagination ?? {};
    // This source always returns whole rows; QueryApi also permits projected rows.
    return {
      list: rows.slice((index - 1) * size, index * size) as unknown as T[],
      total: rows.length,
    };
  },
};
const host: ViewHost = {
  resolveSource(id) {
    if (id !== definition.sourceId) throw new Error('未知数据源');
    return source;
  },
};

type RecordViewExampleProps = {
  appearance?: 'light' | 'dark';
  layout?: 'table' | 'card';
  renderCard?(context: RecordCardRenderContext): ReactNode;
  persistViews?: boolean;
};

export function RecordViewExample(props: RecordViewExampleProps) {
  return (
    <RecordViewWorkspace key={String(props.persistViews ?? false)} {...props} />
  );
}

function RecordViewWorkspace({
  appearance = 'light',
  layout = 'table',
  renderCard,
  persistViews = false,
}: RecordViewExampleProps) {
  const [viewHost] = useState(() =>
    persistViews
      ? new LocalStorageViewHost({
          scopeKey: 'card-example-user',
          serviceKey: 'card-example',
          storage: localStorage,
          lock: (name, operation, signal) =>
            navigator.locks.request(name, { signal }, operation),
          definition,
          instances: {
            ...instances,
            instances: instances.instances.map(instance => ({
              ...instance,
              config: {
                ...instance.config,
                presentation: resolveRecordPresentation(
                  definition,
                  layout,
                  instance.config.presentation,
                ),
              },
            })),
          },
          resolveSource: host.resolveSource,
        })
      : host,
  );
  return (
    <div
      className="fve-root"
      data-theme={appearance}
      style={{ padding: 16, minWidth: 0 }}
    >
      <ViewPage
        scopeKey="docs:orders"
        definitionId={definition.id}
        definition={definition}
        instances={
          persistViews
            ? undefined
            : layout === 'table'
              ? instances
              : {
                  ...instances,
                  instances: instances.instances.map(instance => ({
                    ...instance,
                    config: {
                      ...instance.config,
                      presentation: resolveRecordPresentation(
                        definition,
                        layout,
                        instance.config.presentation,
                      ),
                    },
                  })),
                }
        }
        host={viewHost}
        renderCard={renderCard}
        initialSidebarCollapsed
        selectable
      />
    </div>
  );
}
