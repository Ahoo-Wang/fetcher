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

import { type FilterFieldDefinition } from '@ahoo-wang/fetcher-view-engine';
import {
  FilterSearchSelect,
  FilterSelect,
  InputGroupButton,
  type FilterComponentProps,
  type FilterEditorProps,
  type FilterExtensions,
} from '@ahoo-wang/fetcher-view-engine/react';
import { filter, FilterOperator } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';
import { fields } from './FilterPanelExamples.js';

function CustomerEditor({
  node,
  field,
  onChange,
  onValidityChange,
  disabled,
}: FilterEditorProps) {
  const [unavailable, setUnavailable] = useState(false);
  const selected =
    node?.op === FilterOperator.IN &&
    node.values.join(',') === 'customer-1,customer-2'
      ? 'vip'
      : null;
  return (
    <>
      <FilterSelect
        label="客户分组"
        placeholder="不限客户"
        value={selected}
        options={[{ value: 'vip', label: '重点客户' }]}
        disabled={disabled || unavailable}
        onClear={() => onChange(undefined)}
        onValueChange={() =>
          onChange(filter.isIn(field!.field, ['customer-1', 'customer-2']))
        }
        inline
      />
      <InputGroupButton
        disabled={disabled}
        onClick={() => {
          const next = !unavailable;
          setUnavailable(next);
          onValidityChange(
            !next,
            next ? '候选加载失败，请恢复后重试。' : undefined,
          );
        }}
      >
        {unavailable ? '恢复候选' : '模拟候选失败'}
      </InputGroupButton>
    </>
  );
}
export const customFields = fields.map(field =>
  field.field === 'customer'
    ? { ...field, editor: { name: 'customer-groups' } }
    : field,
);
export const customExtensions: FilterExtensions = {
  filters: {
    'customer-groups': { component: CustomerEditor, modes: ['simple'] },
  },
};
const customers = [
  { value: 'customer-1', label: '远山科技' },
  { value: 'customer-2', label: '晨星零售' },
  { value: 'customer-3', label: '云杉制造' },
  { value: 'customer-4', label: '海川物流' },
  { value: 'customer-5', label: '云海商贸（停用）', disabled: true },
];
function SearchableCustomerEditor({
  node,
  field,
  disabled,
  onChange,
}: FilterEditorProps) {
  return (
    <FilterSearchSelect
      label="客户选择"
      placeholder="选择客户"
      searchPlaceholder="输入客户名称"
      options={customers}
      value={
        node?.op === FilterOperator.EQ && typeof node.value === 'string'
          ? node.value
          : null
      }
      onValueChange={id => onChange(filter.eq(field!.field, id))}
      onClear={() => onChange(undefined)}
      disabled={disabled}
      inline
    />
  );
}
export const searchableFields: FilterFieldDefinition[] = [
  {
    field: 'customer',
    label: '客户',
    type: 'string',
    operators: [FilterOperator.EQ],
    editor: { name: 'customer-search' },
  },
];
export const searchableExtensions: FilterExtensions = {
  filters: {
    'customer-search': {
      component: SearchableCustomerEditor,
      modes: ['simple', 'advanced'],
      supports: node =>
        node === undefined ||
        (node.op === FilterOperator.EQ &&
          customers.some(customer => customer.value === node.value)),
    },
  },
};
function CompleteCustomerFilter({
  node,
  field,
  disabled,
  onChange,
  onClear,
  onRemove,
  errorId,
}: FilterComponentProps) {
  return (
    <div
      role="group"
      aria-label="自定义客户筛选器"
      aria-describedby={errorId}
      className="fve:flex fve:w-full fve:flex-wrap fve:items-center fve:gap-2 fve:rounded-lg fve:border fve:border-input fve:p-2"
    >
      <strong>客户范围</strong>
      <FilterSearchSelect
        label="客户选择"
        placeholder="不限客户"
        options={customers}
        value={
          node?.op === FilterOperator.EQ && typeof node.value === 'string'
            ? node.value
            : null
        }
        onValueChange={id => onChange(filter.eq(field!.field, id))}
        onClear={onClear}
        disabled={disabled}
        inline
      />
      <InputGroupButton onClick={onRemove} disabled={disabled}>
        移除此筛选
      </InputGroupButton>
    </div>
  );
}
export const completeExtensions: FilterExtensions = {
  filters: {
    'customer-search': {
      ...searchableExtensions.filters!['customer-search'],
      render: 'filter',
      component: CompleteCustomerFilter,
    },
  },
};
