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

import type { FilterProps, FilterValueProps } from './types';
import type { AssemblyFilterProps } from './AssemblyFilter';
import { AssemblyFilter } from './AssemblyFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';
import type {
  OnOperatorChangeValueConverter,
  UseFilterStateReturn,
} from './useFilterState';
import type { SelectProps } from 'antd';
import { Select } from 'antd';

export const SELECT_FILTER = 'select';

export interface SelectFilterValueProps
  extends
    FilterValueProps,
    Omit<
      SelectProps,
      | 'defaultValue'
      | 'mode'
      | 'value'
      | 'allowClear'
      | 'onChange'
      | 'placeholder'
    > {}

export const SelectOnOperatorChangeValueConverter: OnOperatorChangeValueConverter =
  (_beforeOperator, _afterOperator, value) => {
    if (value === undefined || value === null) {
      return value;
    }
    return Array.isArray(value) ? value : [value];
  };

export function SelectFilter(props: FilterProps<SelectFilterValueProps>) {
  const assemblyFilterProps: AssemblyFilterProps = {
    ...props,
    supportedOperators: [Operator.IN, Operator.NOT_IN],
    onOperatorChangeValueConverter: SelectOnOperatorChangeValueConverter,
    valueInputRender: (filterState: UseFilterStateReturn) => {
      return (
        <Select
          mode={'multiple'}
          value={filterState.value}
          onChange={filterState.setValue}
          allowClear
          {...props.value}
        />
      );
    },
  };
  return <AssemblyFilter {...assemblyFilterProps}></AssemblyFilter>;
}

SelectFilter.displayName = 'SelectFilter';
