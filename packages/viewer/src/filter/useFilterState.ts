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

import { Condition, Operator } from '@ahoo-wang/fetcher-wow';
import { RefAttributes, useImperativeHandle, useState } from 'react';
import { FilterRef, FilterValue } from './types';

export interface UseFilterStateOptions<ValueType = any> extends RefAttributes<FilterRef> {
  field?: string;
  operator: Operator;
  value: ValueType | undefined;
  validate: (operator: Operator, value: ValueType | undefined) => boolean;
  friendly: (condition: Condition) => string;
  onChange?: (condition: FilterValue | undefined) => void;
}

export interface UseFilterStateReturn<ValueType = any> {
  operator: Operator;
  value: ValueType | undefined;
  setOperator: (operator: Operator) => void;
  setValue: (value: ValueType | undefined) => void;
}

export function useFilterState<ValueType = any>(options: UseFilterStateOptions<ValueType>): UseFilterStateReturn<ValueType> {
  const [operator, setOperator] = useState<Operator>(options.operator);
  const [value, setValue] = useState(options.value);

  const resolveFilterValue = (currentOperator: Operator, currentValue: ValueType | undefined): FilterValue | undefined => {
    if (!options.validate(currentOperator, currentValue)) {
      return undefined;
    }
    const condition: Condition = {
      field: options.field,
      operator: currentOperator,
      value: currentValue,
    };
    return {
      condition,
      friendly: options.friendly(condition),
    };
  };
  const setOperatorFn = (newOperator: Operator) => {
    setOperator(newOperator);
    setValue(undefined);
    const conditionFilterValue = resolveFilterValue(newOperator, undefined);
    options.onChange?.(conditionFilterValue);
  };
  const setValueFn = (newValue: ValueType | undefined) => {
    setValue(newValue);
    const conditionFilterValue = resolveFilterValue(operator, newValue);
    options.onChange?.(conditionFilterValue);
  };
  useImperativeHandle(options.ref, () => ({
    getValue(): FilterValue | undefined {
      return resolveFilterValue(operator, value);
    },
  }));

  return {
    operator,
    value,
    setOperator: setOperatorFn,
    setValue: setValueFn,
  };
}