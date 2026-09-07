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

import { expect, it } from 'vitest';
import { filter } from '@ahoo-wang/fetcher-wow';
import { describeRecordFilter } from '../src/record/recordFilterSummary.js';
import type { ViewFieldDefinition } from '../src/record/recordModel.js';

const fields: ViewFieldDefinition[] = [
  {
    field: 'amount',
    label: '金额',
    type: 'number',
    numberFormat: { style: 'currency', currency: 'CNY' },
  },
  { field: 'active', label: '启用', type: 'boolean' },
  { field: 'customer', label: '客户', type: 'string' },
  {
    field: 'status',
    label: '状态',
    type: 'string',
    options: [{ value: 'pending', label: '待处理' }],
  },
  {
    field: 'items',
    label: '明细',
    type: 'array',
    fields: [{ field: 'quantity', label: '数量', type: 'number' }],
  },
];

it('preserves boolean branches, exact numeric thresholds and falsey values in applied summaries', () => {
  const result = describeRecordFilter(
    filter.and([
      filter.gte('amount', 1.00001),
      filter.or([filter.eq('active', false), filter.eq('customer', null)]),
      filter.nor([filter.eq('customer', '')]),
    ]),
    fields,
  );
  expect(result.count).toBe(4);
  expect(result.text).toBe(
    '满足全部条件（金额 大于等于 1.00001；满足任一条件（启用 等于 否；客户 等于 空值）；全部条件均不满足（客户 等于 空字符串））',
  );
  expect(describeRecordFilter(filter.matchAll(), fields).count).toBe(0);
  expect(
    describeRecordFilter(
      filter.or([filter.matchAll(), filter.eq('amount', 0)]),
      fields,
    ),
  ).toEqual({ count: 2, text: '满足任一条件（全部记录；金额 等于 0）' });
});

it('resolves enum labels and element-relative fields without losing the container meaning', () => {
  expect(
    describeRecordFilter(
      filter.and([
        filter.isIn('status', ['pending']),
        filter.between('amount', 0, 1000),
        filter.elementMatch('items', filter.gte('quantity', 2)),
      ]),
      fields,
    ),
  ).toEqual({
    count: 3,
    text: '满足全部条件（状态 属于 [待处理]；金额 介于 0 至 1000；明细 同一元素满足（数量 大于等于 2））',
  });
});
