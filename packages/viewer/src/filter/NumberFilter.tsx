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
import { Input, InputNumber } from 'antd';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { NumberTagValueItemSerializer, TagInput } from '../components';
import { AssemblyFilter, AssemblyFilterProps } from './AssemblyFilter';
import { UseFilterStateReturn } from './useFilterState';

export const NUMBER_FILTER = 'number';

export function NumberFilter(props: FilterProps<number | (number | undefined)[]>) {
  const assemblyConditionFilterProps: AssemblyFilterProps<number | (number | undefined)[]> = {
    ...props,
    supportedOperators: [
      Operator.EQ,
      Operator.NE,
      Operator.GT,
      Operator.LT,
      Operator.GTE,
      Operator.LTE,
      Operator.BETWEEN,
      Operator.IN,
      Operator.NOT_IN,
    ],
    valueInputSupplier: (
      filterState: UseFilterStateReturn<number | (number | undefined)[]>,
    ) => {
      switch (filterState.operator) {
        case Operator.IN:
        case Operator.NOT_IN: {
          return <TagInput
            value={filterState.value}
            serializer={NumberTagValueItemSerializer}
            onChange={e => filterState.setValue(e)}
            {...props.value}
          />;
        }
        case Operator.BETWEEN: {
          let [start, end]: (number | undefined)[] = [undefined, undefined];
          if (Array.isArray(filterState.value)) {
            [start, end] = filterState.value;
          }
          return (
            <>
              <InputNumber
                defaultValue={start}
                onChange={e => filterState.setValue([e ?? undefined, end])}
              />
              <InputNumber
                defaultValue={end}
                onChange={e => filterState.setValue([start, e ?? undefined])}
              /></>
          );
        }
        default: {
          const defaultValue: number | undefined = Array.isArray(filterState.value) ? filterState.value[0] : filterState.value ?? undefined;
          return (
            <InputNumber defaultValue={defaultValue}
                         onChange={filterState.setValue} {...props.value}></InputNumber>
          );
        }
      }
    },
  };
  return (
    <AssemblyFilter<number | (number | undefined)[]>
      {...assemblyConditionFilterProps}
    ></AssemblyFilter>
  );
}

NumberFilter.displayName = 'NumberFilter';
