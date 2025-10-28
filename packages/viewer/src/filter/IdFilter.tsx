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
import {
  OnOperatorChangeValueConverter,
  UseFilterStateReturn,
} from './useFilterState';
import { AssemblyFilter, AssemblyFilterProps } from './AssemblyFilter';

export const ID_FILTER = 'id';
export type IdFilterValueType = string | string[];

export const IdOnOperatorChangeValueConverter: OnOperatorChangeValueConverter<
  IdFilterValueType
> = (beforeOperator, afterOperator, value) => {
  if (value === undefined || value === null) {
    return value;
  }
  if (afterOperator === Operator.ID) {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value;
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }
  return [trimmedValue];
};

export function IdFilter(props: FilterProps<IdFilterValueType>) {
  const assemblyFilterProps: AssemblyFilterProps<IdFilterValueType> = {
    ...props,
    supportedOperators: [Operator.ID, Operator.IDS],
    valueConverter: IdOnOperatorChangeValueConverter,
    valueInputSupplier: (
      filterState: UseFilterStateReturn<IdFilterValueType>,
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
    <AssemblyFilter<IdFilterValueType>
      {...assemblyFilterProps}
    ></AssemblyFilter>
  );
}

IdFilter.displayName = 'IdConditionFilter';
