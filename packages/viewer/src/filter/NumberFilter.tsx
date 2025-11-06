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
import { InputNumber } from 'antd';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { NumberTagValueItemSerializer, TagInput } from '../components';
import { AssemblyFilter, AssemblyFilterProps } from './AssemblyFilter';
import { UseFilterStateReturn } from './useFilterState';
import { NumberRange } from '../components';

export const NUMBER_FILTER = 'number';

export function NumberFilter(props: FilterProps) {
  const assemblyFilterProps: AssemblyFilterProps = {
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
    validate: (operator, value) => {
      if (operator === Operator.BETWEEN) {
        if (!Array.isArray(value)) {
          return false;
        }
        return value[0] !== undefined && value[1] !== undefined;
      }
      return value != undefined;
    },
    valueInputRender: (
      filterState: UseFilterStateReturn,
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { placeholder, ...restValue } = props.value ?? {};
          return (
            <NumberRange value={filterState.value} onChange={filterState.setValue} {...restValue}></NumberRange>
          );
        }
        default: {
          const { defaultValue, ...restValue } = props.value ?? {};
          const defaultInputNumber = Array.isArray(defaultValue) ? defaultValue[0] : defaultValue;
          const value = Array.isArray(filterState.value) ? filterState.value[0] : filterState.value;
          return (
            <InputNumber<number>
              value={value}
              defaultValue={defaultInputNumber}
              onChange={v => {
                filterState.setValue(v ?? undefined);
              }} {...restValue}></InputNumber>
          );
        }
      }
    },
  };
  return (
    <AssemblyFilter
      {...assemblyFilterProps}
    ></AssemblyFilter>
  );
}

NumberFilter.displayName = 'NumberFilter';
