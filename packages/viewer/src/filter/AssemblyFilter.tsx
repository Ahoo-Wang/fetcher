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
import { Condition, Operator } from '@ahoo-wang/fetcher-wow';
import { OPERATOR_zh_CN } from './locale';
import {
  useFilterState,
  UseFilterStateReturn,
} from './useFilterState';
import { Button, Select, Space } from 'antd';
import { ReactNode } from 'react';

export interface AssemblyFilterProps<ValueType = any>
  extends FilterProps {
  supportedOperators: Operator[];
  validate: (operator: Operator, value: ValueType | undefined) => boolean;
  friendly: (condition: Condition) => string;
  valueInputSupplier: (
    filterState: UseFilterStateReturn<ValueType>,
  ) => ReactNode;
}

export function AssemblyFilter<ValueType = any>(
  props: AssemblyFilterProps<ValueType>,
) {
  // Validate that supportedOperators is not empty
  if (!props.supportedOperators || props.supportedOperators.length === 0) {
    throw new Error('supportedOperators must be a non-empty array');
  }

  const operatorLocale = props.operator.locale ?? OPERATOR_zh_CN;

  // Determine the initial operator
  let initialOperator = props.operator.defaultValue;

  // If no operator is provided or it's not in supported operators, use the first supported operator
  if (!initialOperator || !props.supportedOperators.includes(initialOperator)) {
    initialOperator = props.supportedOperators[0];
  }

  const filterState = useFilterState({
    field: props.field.name,
    operator: initialOperator,
    value: props.value.defaultValue,
    ref: props.ref,
    validate: props.validate,
    friendly: props.friendly,
    onChange: props.onChange,
  });
  const valueInput = props.valueInputSupplier(filterState);
  const options = props.supportedOperators.map(supportedOperator => ({
    value: supportedOperator,
    label: operatorLocale[supportedOperator],
  }));
  return (
    <Space.Compact>
      <Button {...props.label}>{props.field.label}</Button>
      <Select
        onChange={filterState.setOperator}
        {...props.operator}
        value={filterState.operator}
        options={options}
      ></Select>
      {valueInput}
    </Space.Compact>
  );
}
