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
  compileFilterDraft,
  FILTER_OPERATORS,
  newFilterDraft,
  type FilterFieldDefinition,
} from '@ahoo-wang/fetcher-view-engine';
import { FilterSelect } from '@ahoo-wang/fetcher-view-engine/react';
import {
  DeletionState,
  FilterOperator,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';
import { Scenario, type DemoArgs } from './FilterPanelExamples.js';

const galleryFields: FilterFieldDefinition[] = [
  {
    field: 'data',
    label: '示例字段',
    fields: [{ field: 'quantity', label: '元素数量', type: 'number' }],
  },
];
function example(op: FilterOperator): FilterExpression {
  const descriptor = FILTER_OPERATORS[op];
  const draft = newFilterDraft(
    op,
    descriptor.category === 'field' || descriptor.category === 'element'
      ? 'data'
      : undefined,
  );
  switch (descriptor.input) {
    case 'value':
      draft.value =
        descriptor.category === 'root' ||
        [
          FilterOperator.CONTAINS,
          FilterOperator.STARTS_WITH,
          FilterOperator.ENDS_WITH,
        ].includes(op)
          ? '示例'
          : 0;
      break;
    case 'values':
      draft.values =
        descriptor.category === 'root' ? ['id-1', 'id-2'] : [0, false, '示例'];
      break;
    case 'between':
      draft.lowerBound = 0;
      draft.upperBound = 10;
      break;
    case 'search':
      draft.query = '示例';
      draft.fields = ['data'];
      break;
    case 'deletion':
      draft.state = DeletionState.ACTIVE;
      break;
    case 'time':
      draft.time = '09:30:45.123456789';
      break;
    case 'days':
      draft.days = 7;
      break;
  }
  if (descriptor.category === 'logical')
    draft.operands = [
      { ...newFilterDraft(FilterOperator.EQ, 'data'), value: '示例' },
    ];
  if (descriptor.category === 'element')
    draft.predicate = {
      ...newFilterDraft(FilterOperator.GTE, 'quantity'),
      value: 1,
    };
  const result = compileFilterDraft(
    draft,
    galleryFields,
    undefined,
    undefined,
    undefined,
    'Asia/Shanghai',
  );
  if (!result.expression)
    throw new Error(result.errors.map(error => error.message).join('；'));
  return result.expression;
}
export function OperatorGallery(args: DemoArgs) {
  const [op, setOp] = useState(FilterOperator.EQ);
  return (
    <div className="fve-root" data-theme={args.appearance}>
      <FilterSelect
        label="协议操作"
        value={op}
        options={Object.values(FilterOperator).map(op => ({
          value: op,
          label: `${op} · ${FILTER_OPERATORS[op].label}`,
        }))}
        onValueChange={setOp}
      />
      <Scenario
        key={op}
        {...args}
        initial={example(op)}
        definitions={galleryFields}
        mode="advanced"
      />
    </div>
  );
}
