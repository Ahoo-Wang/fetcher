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
  DeletionState,
  filter,
  FilterOperator as Op,
  StringComparison,
  TimeUnit,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import { compileFilterDraft } from '../../src/filter/filterCore';
import type {
  FilterDraftNode,
  FilterFieldDefinition,
} from '../../src/filter/filterModel';

export const fields: FilterFieldDefinition[] = [
  { field: 'name', label: '名称', type: 'string' },
  { field: 'amount', label: '金额', type: 'number' },
  { field: 'enabled', label: '启用', type: 'boolean' },
  { field: 'day', label: '日期', type: 'date' },
  {
    field: 'created',
    label: '时间',
    type: 'datetime',
    editor: { name: 'builtin', options: { showTime: true } },
  },
  {
    field: 'items',
    label: '明细',
    type: 'array',
    fields: [{ field: 'quantity', label: '数量', type: 'number' }],
  },
  {
    field: 'status',
    label: '状态',
    options: [
      { value: 0, label: '零' },
      { value: false, label: '否' },
      { value: '', label: '空' },
    ],
  },
];
export const calendar = [
  Op.TODAY,
  Op.TOMORROW,
  Op.THIS_WEEK,
  Op.NEXT_WEEK,
  Op.LAST_WEEK,
  Op.THIS_MONTH,
  Op.LAST_MONTH,
  Op.YESTERDAY,
  Op.NEXT_MONTH,
  Op.LAST_YEAR,
  Op.THIS_YEAR,
  Op.NEXT_YEAR,
] as const;
export const expressions: FilterExpression[] = [
  filter.matchAll(),
  filter.matchNone(),
  filter.id('001'),
  filter.ids(['001', '002']),
  filter.aggregateId('001'),
  filter.aggregateIds(['001']),
  filter.tenantId('01'),
  filter.ownerId('02'),
  filter.spaceId('03'),
  filter.and([filter.eq('amount', 0)]),
  filter.or([filter.eq('name', '')]),
  filter.nor([filter.eq('enabled', false)]),
  filter.eq('amount', null),
  filter.ne('name', null),
  filter.gt('amount', 1),
  filter.gte('amount', 1),
  filter.lt('amount', 2),
  filter.lte('amount', 2),
  { op: Op.CONTAINS, field: 'name', value: '' },
  {
    op: Op.STARTS_WITH,
    field: 'name',
    value: 'a',
    stringComparison: StringComparison.CASE_INSENSITIVE,
  },
  { op: Op.ENDS_WITH, field: 'name', value: 'z' },
  filter.isIn('amount', [0, 2]),
  filter.notIn('enabled', [false]),
  filter.between('amount', 0, 10),
  filter.containsAll('items', ['a', 0, false]),
  filter.isEmpty('items'),
  filter.isEmptyString('name'),
  filter.isNotEmptyString('name'),
  filter.isNull('amount'),
  filter.isNotNull('amount'),
  filter.exists('name'),
  filter.notExists('name'),
  filter.deletion(DeletionState.ALL),
  filter.elementMatch('items', filter.and([filter.gt('quantity', 0)])),
  { op: Op.SEARCH, query: '订单' },
  ...calendar.map(op => ({ op, field: 'created', zoneId: 'Asia/Shanghai' })),
  {
    op: Op.BEFORE_TODAY,
    field: 'created',
    time: '12:30:59',
    zoneId: 'Asia/Shanghai',
    datePattern: 'yyyy-MM-dd',
    timeUnit: TimeUnit.SECONDS,
  },
  { op: Op.RECENT_DAYS, field: 'created', days: 7, zoneId: 'Asia/Shanghai' },
  { op: Op.EARLIER_DAYS, field: 'created', days: 1, zoneId: 'Asia/Shanghai' },
];
export const compile = (
  node: FilterDraftNode,
  definitions = fields,
  timeZone = 'Asia/Shanghai',
) =>
  compileFilterDraft(
    node,
    definitions,
    undefined,
    undefined,
    undefined,
    timeZone,
  );
export function node(
  op: Op,
  field?: string,
  values: Partial<FilterDraftNode> = {},
): FilterDraftNode {
  return {
    id: crypto.randomUUID(),
    op,
    ...(field === undefined ? {} : { field }),
    ...values,
  };
}
