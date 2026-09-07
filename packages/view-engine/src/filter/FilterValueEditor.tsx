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

import type { ReactNode } from 'react';
import { DeletionState, FilterOperator } from '@ahoo-wang/fetcher-wow';
import { PlusIcon, XIcon } from 'lucide-react';
import type { FilterDraftNode, FilterFieldDefinition } from './filterModel.js';
import { FILTER_OPERATORS, stringOperators } from './filterOperators.js';
import { ScalarEditor } from './FilterScalarEditor.js';
import { FilterSearchEditor } from './FilterSearchEditor.js';
import { FilterValueParameters } from './FilterValueParameters.js';
import { FilterSelect } from './FilterSelect.js';
import { FilterTimeInput } from './FilterTimeInput.js';
import {
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '../components/ui/input-group.js';

export interface FilterValueEditorProps {
  node: FilterDraftNode;
  field?: FilterFieldDefinition;
  fields: readonly FilterFieldDefinition[];
  disabled?: boolean;
  onChange(node: FilterDraftNode): void;
}

export function FilterValueEditor({
  node,
  field,
  fields,
  disabled,
  onChange,
}: FilterValueEditorProps) {
  const descriptor = FILTER_OPERATORS[node.op];
  if (!descriptor)
    return <InputGroupText role="alert">未知操作</InputGroupText>;
  const label = field?.label ?? descriptor.label;
  const stringOperation = stringOperators.includes(node.op);
  const valueField =
    descriptor.category === 'root' || stringOperation
      ? { field: '', label, type: 'string' as const }
      : field;
  const update = (patch: Partial<FilterDraftNode>) =>
    onChange({ ...node, ...patch });
  let input: ReactNode;
  switch (descriptor.input) {
    case 'value':
      input = (
        <ScalarEditor
          label={`${label}值`}
          dateLabel={label}
          value={node.value}
          field={valueField}
          nullable={
            node.op === FilterOperator.EQ || node.op === FilterOperator.NE
          }
          disabled={disabled}
          onChange={value => update({ value })}
        />
      );
      break;
    case 'values':
      input = (
        <span className="fve:inline-flex fve:max-w-full fve:flex-wrap fve:items-center">
          {(node.values ?? []).map((value, index) => (
            <span
              key={index}
              className="fve:inline-flex fve:max-w-full fve:flex-wrap fve:items-center"
            >
              <ScalarEditor
                label={`${label}值${index + 1}`}
                value={value}
                field={valueField}
                disabled={disabled}
                onChange={value =>
                  update({
                    values: node.values?.map((current, position) =>
                      position === index ? value : current,
                    ),
                  })
                }
              />
              <InputGroupButton
                aria-label={`删除${label}值${index + 1}`}
                disabled={disabled}
                size="icon-xs"
                onClick={() =>
                  update({
                    values: node.values?.filter(
                      (_, position) => position !== index,
                    ),
                  })
                }
              >
                <XIcon aria-hidden="true" />
              </InputGroupButton>
            </span>
          ))}
          <InputGroupButton
            aria-label={`添加${label}值`}
            disabled={disabled}
            onClick={() =>
              update({ values: [...(node.values ?? []), undefined] })
            }
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            添加值
          </InputGroupButton>
        </span>
      );
      break;
    case 'between':
      input = (
        <>
          <ScalarEditor
            label={`${label}下限`}
            value={node.lowerBound}
            field={field}
            disabled={disabled}
            onChange={lowerBound => update({ lowerBound })}
          />
          <InputGroupText>至</InputGroupText>
          <ScalarEditor
            label={`${label}上限`}
            value={node.upperBound}
            field={field}
            disabled={disabled}
            onChange={upperBound => update({ upperBound })}
          />
        </>
      );
      break;
    case 'search':
      input = (
        <FilterSearchEditor
          node={node}
          fields={fields}
          disabled={disabled}
          onChange={onChange}
        />
      );
      break;
    case 'deletion':
      input = (
        <FilterSelect
          label="删除状态"
          placeholder="未设置"
          value={node.state}
          inline
          disabled={disabled}
          options={[
            { value: DeletionState.ACTIVE, label: '未删除' },
            { value: DeletionState.DELETED, label: '已删除' },
            { value: DeletionState.ALL, label: '全部' },
          ]}
          onClear={() => update({ state: undefined })}
          onValueChange={state => update({ state })}
        />
      );
      break;
    case 'time':
      input = (
        <FilterTimeInput
          label={`${label}时间`}
          value={node.time}
          disabled={disabled}
          inline
          onValueChange={time => update({ time: time || undefined })}
        />
      );
      break;
    case 'days':
      input = (
        <>
          <InputGroupInput
            aria-label={`${label}天数`}
            value={node.days ?? ''}
            placeholder="天数"
            inputMode="numeric"
            disabled={disabled}
            className="fve:w-20 fve:flex-none"
            onChange={event =>
              update({ days: event.target.value || undefined })
            }
          />
          <InputGroupText>天</InputGroupText>
        </>
      );
      break;
  }
  return (
    <>
      {input}
      <FilterValueParameters
        node={node}
        label={label}
        disabled={disabled}
        onChange={onChange}
      />
    </>
  );
}
