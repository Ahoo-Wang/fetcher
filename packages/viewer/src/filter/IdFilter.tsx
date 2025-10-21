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
import { Input } from 'antd';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { TagInput } from '../components';
import { UseFilterStateReturn } from './useFilterState';
import {
  AssemblyFilter,
  AssemblyFilterProps,
} from './AssemblyFilter';

export const ID_FILTER = 'id';

export function IdFilter(
  props: FilterProps<string | string[]>,
) {
  const assemblyConditionFilterProps: AssemblyFilterProps<
    string | string[]
  > = {
    ...props,
    supportedOperators: [Operator.ID, Operator.IDS],
    validate: (operator: Operator, value: string | string[] | undefined) => {
      // Valid if operator exists, value exists, and arrays are non-empty
      if (!operator) return false;
      if (!value) return false;
      return !(Array.isArray(value) && value.length === 0);
    },
    valueInputSupplier: (
      filterState: UseFilterStateReturn<string | string[]>,
    ) => {
      return filterState.operator === Operator.ID ? (
        <Input
          value={filterState.value}
          onChange={e => filterState.setValue(e.target.value)}
          allowClear
          {...props.value}
        />
      ) : (
        <TagInput
          value={filterState.value}
          onChange={filterState.setValue}
          {...props.value}
        />
      );
    },
  };
  return (
    <AssemblyFilter<string | string[]>
      {...assemblyConditionFilterProps}
    ></AssemblyFilter>
  );
}

IdFilter.displayName = 'IdConditionFilter';
