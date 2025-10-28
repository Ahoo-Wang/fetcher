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

import { FilterProps, FilterValueProps } from './types';
import { AssemblyFilter, AssemblyFilterProps } from './AssemblyFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { UseFilterStateReturn } from './useFilterState';
import { Select, SelectProps } from 'antd';

export const SELECT_FILTER = 'select';
export type SelectFilterValueType = string[];

export interface SelectFilterValueProps extends FilterValueProps<SelectFilterValueType>,
  Omit<SelectProps<SelectFilterValueType>, 'defaultValue' | 'mode' | 'value' | 'allowClear' | 'onChange'| 'placeholder'> {
}

export function SelectFilter(props: FilterProps<SelectFilterValueType, SelectFilterValueProps>) {
  const assemblyFilterProps: AssemblyFilterProps<SelectFilterValueType> = {
    ...props,
    supportedOperators: [Operator.IN, Operator.NOT_IN],
    valueInputSupplier: (filterState: UseFilterStateReturn<SelectFilterValueType>) => {
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
  return <AssemblyFilter<SelectFilterValueType> {...assemblyFilterProps}></AssemblyFilter>;
}

SelectFilter.displayName = 'SelectFilter';