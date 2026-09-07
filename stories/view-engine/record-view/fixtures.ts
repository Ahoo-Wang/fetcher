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

import { filter, FilterOperator, SortDirection } from '@ahoo-wang/fetcher-wow';
import type {
  RecordData,
  ViewDefinition,
  ViewInstance,
  ViewInstanceList,
} from '@ahoo-wang/fetcher-view-engine';

export const statuses = [
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

export const definition: ViewDefinition = {
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

export const orders: RecordData[] = amounts.map((amount, index) => ({
  id: `ORD-202609-${1001 + index}`,
  customer: customers[index % customers.length],
  amount,
  status: statuses[index % statuses.length].value,
  createdAt: `2026-09-06 ${String(9 + Math.floor(index / 6)).padStart(2, '0')}:${String((index % 6) * 10).padStart(2, '0')}`,
  owner: ['林晨', '顾嘉', '陈宁'][index % 3],
  region: ['上海', '杭州', '深圳'][index % 3],
}));

export function makeInstances(
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

export const pause = () =>
  new Promise<void>(resolve => setTimeout(resolve, 120));
