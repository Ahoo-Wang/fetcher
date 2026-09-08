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

import type {
  FilterFieldDefinition,
  FilterComponentProperties,
} from './filterModel.js';
import { FilterOperator } from '@ahoo-wang/fetcher-wow';
import { ScalarEditor } from './FilterScalarEditor.js';
import { getBuiltinFilterCompiler } from './builtinFilterCompilers.js';
import { InputGroupText } from '../components/ui/input-group.js';
export interface FilterDateTimeRangeProps {
  field: FilterFieldDefinition;
  value: Partial<Pick<FilterComponentProperties, 'lowerBound' | 'upperBound'>>;
  onValueChange(value: FilterDateTimeRangeProps['value']): void;
  onValidityChange?(valid: boolean, message?: string): void;
  disabled?: boolean;
}
export function FilterDateTimeRange({
  field,
  value,
  onValueChange,
  onValidityChange,
  disabled,
}: FilterDateTimeRangeProps) {
  function change(next: FilterDateTimeRangeProps['value']) {
    onValueChange(next);
    try {
      getBuiltinFilterCompiler('fve/datetime-range')!.compile(next, {
        operator: FilterOperator.BETWEEN,
        field,
        fields: [field],
      });
      onValidityChange?.(true);
    } catch (error) {
      onValidityChange?.(
        false,
        error instanceof Error ? error.message : '区间无效',
      );
    }
  }
  return (
    <span className="fve-root fve:inline-flex fve:max-w-full fve:flex-wrap fve:items-center">
      <ScalarEditor
        label={`${field.label}开始`}
        dateLabel={`${field.label}开始`}
        field={field}
        value={value.lowerBound}
        disabled={disabled}
        onChange={lowerBound =>
          change({
            ...value,
            lowerBound: lowerBound as FilterComponentProperties['lowerBound'],
          })
        }
      />
      <InputGroupText>至</InputGroupText>
      <ScalarEditor
        label={`${field.label}结束`}
        dateLabel={`${field.label}结束`}
        field={field}
        value={value.upperBound}
        disabled={disabled}
        onChange={upperBound =>
          change({
            ...value,
            upperBound: upperBound as FilterComponentProperties['upperBound'],
          })
        }
      />
    </span>
  );
}
