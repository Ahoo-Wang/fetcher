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
import { Optional } from '../types';
import { ExtendedOperator, SelectOperator } from './operator';

export type OnOperatorChangeValueConverter<ValueType = any> = (beforeOperator: SelectOperator, afterOperator: SelectOperator, value: Optional<ValueType>) => Optional<ValueType>
export type ValidateValue<ValueType = any> = (operator: Operator, value: Optional<ValueType>) => boolean;
export type OnChange = (condition: Optional<FilterValue>) => void;

export interface UseFilterStateOptions<ValueType = any> extends RefAttributes<FilterRef> {
  field?: string;
  operator: SelectOperator;
  value: Optional<ValueType>;
  valueConverter?: OnOperatorChangeValueConverter;
  validate?: ValidateValue<ValueType>;
  onChange?: OnChange;
}

export interface UseFilterStateReturn<ValueType = any> {
  operator: SelectOperator;
  value: Optional<ValueType>;
  setOperator: (operator: SelectOperator) => void;
  setValue: (value: Optional<ValueType>) => void;
  reset: () => void;
}

const defaultValueValidate: ValidateValue = (operator: Operator, value: any): operator is Operator => {
  if (!operator) return false;
  if (!value) return false;
  return !(Array.isArray(value) && value.length === 0);
};

const defaultValueConverter: OnOperatorChangeValueConverter = (beforeOperator: SelectOperator, afterOperator: SelectOperator, value: any) => {
  return value;
};

export function useFilterState<ValueType = any>(options: UseFilterStateOptions<ValueType>): UseFilterStateReturn<ValueType> {
  const [operator, setOperator] = useState<SelectOperator>(options.operator);
  const [value, setValue] = useState<Optional<ValueType>>(options.value);
  const valueValidate = options.validate ?? defaultValueValidate;
  const valueConverter = options.valueConverter ?? defaultValueConverter;
  const resolveFilterValue = (currentOperator: SelectOperator, currentValue: Optional<ValueType>): Optional<FilterValue> => {
    if (currentOperator === ExtendedOperator.UNDEFINED) {
      return undefined;
    }
    if (!valueValidate(currentOperator, currentValue)) {
      return undefined;
    }
    const condition: Condition = {
      field: options.field,
      operator: currentOperator,
      value: currentValue,
    };
    return {
      condition,
    };
  };
  const setOperatorFn = (newOperator: SelectOperator) => {
    const afterValue = valueConverter(operator, newOperator, value);
    setOperator(newOperator);
    setValue(afterValue);
    const filterValue = resolveFilterValue(newOperator, afterValue);
    options.onChange?.(filterValue);
  };
  const setValueFn = (newValue: Optional<ValueType>) => {
    setValue(newValue);
    const filterValue = resolveFilterValue(operator, newValue);
    options.onChange?.(filterValue);
  };
  const resetFn = () => {
    setOperator(options.operator);
    setValue(options.value);
    const filterValue = resolveFilterValue(options.operator, options.value);
    options.onChange?.(filterValue);
  };
  useImperativeHandle<FilterRef, FilterRef>(options.ref, () => ({
    getValue(): FilterValue | undefined {
      return resolveFilterValue(operator, value);
    },
    reset: resetFn,
  }));

  return {
    operator,
    value,
    setOperator: setOperatorFn,
    setValue: setValueFn,
    reset: resetFn,
  };
}