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

import { ConditionFilterProps, ValueProps } from './types';
import { Condition, Operator } from '@ahoo-wang/fetcher-wow';
import { OPERATOR_zh_CN } from './locale';
import { useConditionFilterState, UseConditionFilterStateReturn } from './useConditionFilterState';
import { Button, Select, Space } from 'antd';
import { ReactNode } from 'react';

export interface AssemblyConditionFilterProps<ValueType = any> extends ConditionFilterProps {
  supportedOperators: Operator[];
  validate: (operator: Operator, value: ValueType | undefined) => boolean;
  friendly: (condition: Condition) => string;
  valueInputSupplier: (filterState: UseConditionFilterStateReturn<ValueType>) => ReactNode;
}

export function AssemblyConditionFilter<ValueType = any>(
  props: AssemblyConditionFilterProps<ValueType>,
) {
  const operatorLocale = props.operator.locale ?? OPERATOR_zh_CN;
  const filterState = useConditionFilterState({
    field: props.field.name,
    operator: props.operator.value || props.supportedOperators[0],
    value: props.value.value,
    ref: props.ref,
    validate: props.validate,
    friendly: props.friendly,
    onChange: props.onChange,
  });
  const valueInput = props.valueInputSupplier(filterState);
  return (
    <Space.Compact>
      <Button {...props.label}>{props.field.label}</Button>
      <Select
        value={filterState.operator}
        onChange={filterState.setOperator}
        {...props.operator}
      >
        {props.supportedOperators.map((supportedOperator) => (
          <Select.Option key={supportedOperator} value={supportedOperator}>
            {operatorLocale[supportedOperator]}
          </Select.Option>
        ))}
      </Select>
      {valueInput}
    </Space.Compact>
  );
}