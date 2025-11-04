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

import { FilterProps } from './types';
import { AssemblyFilter, AssemblyFilterProps } from './AssemblyFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { UseFilterStateReturn } from './useFilterState';
import { Optional } from '../types';
import { Select } from 'antd';

export const BOOL_FILTER = 'bool';
const DEFAULT_BOOL_FILTER_VALUE_OPTIONS = [
  {
    label: '是',
    value: true,
  },
  {
    label: '否',
    value: false,
  },
];

export function BoolFilter(props: FilterProps<boolean>) {
  const assemblyFilterProps: AssemblyFilterProps<boolean> = {
    ...props,
    supportedOperators: [Operator.EQ],
    validate: (operator: Operator, value: Optional<boolean>) => {
      return value !== undefined;
    },
    valueInputRender: (filterState: UseFilterStateReturn<boolean>) => {
      return (
        <Select options={DEFAULT_BOOL_FILTER_VALUE_OPTIONS}
                allowClear
                value={filterState.value}
                onChange={filterState.setValue}
                {...props.value}
        />
      );
    },
  };
  return <AssemblyFilter<boolean> {...assemblyFilterProps}></AssemblyFilter>;
}

BoolFilter.displayName = 'BoolFilter';