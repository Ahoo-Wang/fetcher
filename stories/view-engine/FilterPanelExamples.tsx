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
  createFilterDraft,
  type FilterDraftNode,
  type FilterFieldDefinition,
  type FilterMode,
} from '@ahoo-wang/fetcher-view-engine';
import {
  FilterPanel,
  type FilterExtensions,
} from '@ahoo-wang/fetcher-view-engine/react';
import { filter, type FilterExpression } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';

export interface DemoArgs {
  appearance: 'light' | 'dark';
  disabled: boolean;
}
export const fields: FilterFieldDefinition[] = [
  {
    field: 'status',
    label: '订单状态',
    group: '订单信息',
    type: 'string',
    editor: { name: 'select' },
    options: [
      { value: 'pending', label: '待处理' },
      { value: 'paid', label: '已支付' },
      { value: 'closed', label: '已关闭' },
    ],
  },
  { field: 'amount', label: '订单金额', type: 'number', group: '订单信息' },
  { field: 'customer', label: '客户', type: 'string', group: '客户信息' },
  { field: 'priority', label: '优先处理', type: 'boolean', group: '订单信息' },
  {
    field: 'createdAt',
    label: '创建时间',
    group: '时间',
    type: 'datetime',
  },
  {
    field: 'items',
    label: '商品明细',
    type: 'array',
    fields: [
      { field: 'sku', label: '商品编码', type: 'string' },
      { field: 'quantity', label: '数量', type: 'number' },
    ],
  },
];
export const businessFilter = filter.and([
  filter.eq('status', 'pending'),
  filter.gte('amount', 1000),
]);
export const nestedFilter = filter.and([
  filter.or([filter.eq('status', 'pending'), filter.eq('priority', true)]),
  filter.nor([filter.eq('status', 'closed')]),
  filter.elementMatch(
    'items',
    filter.and([filter.startsWith('sku', 'SKU-'), filter.gte('quantity', 2)]),
  ),
]);

export function Scenario({
  appearance,
  disabled,
  initial = businessFilter,
  initialDraft,
  definitions = fields,
  extensions,
  mode,
  initialError,
  timeZone = 'Asia/Shanghai',
}: DemoArgs & {
  initial?: FilterExpression;
  initialDraft?: FilterDraftNode;
  definitions?: readonly FilterFieldDefinition[];
  extensions?: FilterExtensions;
  mode?: FilterMode;
  initialError?: string;
  timeZone?: string;
}) {
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState(
    () => initialDraft ?? createFilterDraft(initial),
  );
  const [calls, setCalls] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);
  return (
    <main
      className="fve-root"
      data-theme={appearance}
      style={{
        padding: 24,
        boxSizing: 'border-box',
        maxWidth: 1000,
        background: 'var(--fve-background)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <FilterPanel
        value={value}
        draft={draft}
        onDraftChange={setDraft}
        fields={definitions}
        timeZone={timeZone}
        mode={mode}
        extensions={extensions}
        disabled={disabled}
        queryError={error}
        onPendingChange={setPending}
        onApply={next => {
          setValue(next);
          setCalls(count => count + 1);
          setError(undefined);
        }}
      />
      <div aria-label="宿主状态">
        已应用 {calls} 次 · {pending ? '筛选有待查询修改' : '筛选已同步'}
      </div>
      <details>
        <summary>查看已应用的 Wow 查询条件</summary>
        <pre
          data-testid="applied-filter"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    </main>
  );
}
