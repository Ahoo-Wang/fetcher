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

import {
  Condition,
  ConditionOptions,
  EMPTY_VALUE_OPERATORS,
  Operator,
} from '@ahoo-wang/fetcher-wow';
import { RefAttributes, useImperativeHandle, useState } from 'react';
import { FilterRef, FilterValue } from './types';
import { Optional } from '../types';
import { ExtendedOperator, SelectOperator } from './operator';
import { isValidBetweenValue } from './utils';

export type OnOperatorChangeValueConverter = (
  beforeOperator: SelectOperator,
  afterOperator: SelectOperator,
  value: Optional,
) => Optional;
export type OnChange = (condition: Optional<FilterValue>) => void;
export type ValidateValue = (operator: Operator, value: Optional) => boolean;
export type ConditionValueParser = (
  operator: Operator,
  value: Optional,
) => Optional;
export type FilterValueConverter = (
  filterValue: FilterValue,
) => Optional<FilterValue>;
export const TrueValidateValue: ValidateValue = (): boolean => {
  return true;
};

export interface UseFilterStateOptions extends RefAttributes<FilterRef> {
  field?: string;
  operator: SelectOperator;
  value: Optional;
  conditionOptions?: ConditionOptions;
  onOperatorChangeValueConverter?: OnOperatorChangeValueConverter;
  validate?: ValidateValue;
  conditionValueParser?: ConditionValueParser;
  filterValueConverter?: FilterValueConverter;
  onChange?: OnChange;
}

export interface UseFilterStateReturn {
  operator: SelectOperator;
  value: Optional;
  setOperator: (operator: SelectOperator) => void;
  setValue: (value: Optional) => void;
  reset: () => void;
}

const defaultValidateValue: ValidateValue = (
  operator: Operator,
  value: any,
): boolean => {
  if (!operator) return false;
  if (EMPTY_VALUE_OPERATORS.has(operator)) {
    return true;
  }
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  if (operator === Operator.BETWEEN) {
    return isValidBetweenValue(value);
  }
  return true;
};

const defaultConditionValueParser: ConditionValueParser = (
  operator: Operator,
  value: any,
): any => {
  return value;
};

const defaultValueConverter: OnOperatorChangeValueConverter = (
  beforeOperator: SelectOperator,
  afterOperator: SelectOperator,
  value: any,
) => {
  return value;
};

const defaultFilterValueConverter: FilterValueConverter = (
  filterValue: FilterValue,
): Optional<FilterValue> => {
  return filterValue;
};

export function useFilterState(
  options: UseFilterStateOptions,
): UseFilterStateReturn {
  const [operator, setOperator] = useState<SelectOperator>(options.operator);
  const [value, setValue] = useState<Optional>(options.value);
  const validate = options.validate ?? defaultValidateValue;
  const valueParser =
    options.conditionValueParser ?? defaultConditionValueParser;
  const valueConverter =
    options.onOperatorChangeValueConverter ?? defaultValueConverter;
  const filterValueConverter =
    options.filterValueConverter ?? defaultFilterValueConverter;
  const resolveFilterValue = (
    currentOperator: SelectOperator,
    currentValue: Optional,
  ): Optional<FilterValue> => {
    if (currentOperator === ExtendedOperator.UNDEFINED) {
      return undefined;
    }
    if (!validate(currentOperator, currentValue)) {
      return undefined;
    }
    const conditionValue = valueParser(currentOperator, currentValue);
    const condition: Condition = {
      field: options.field,
      operator: currentOperator,
      value: conditionValue,
      options: options.conditionOptions,
    };
    const filterValue: FilterValue = {
      condition,
    };
    return filterValueConverter(filterValue);
  };

  const setOperatorFn = (newOperator: SelectOperator) => {
    const afterValue = valueConverter(operator, newOperator, value);
    setOperator(newOperator);
    setValue(afterValue);
    const filterValue = resolveFilterValue(newOperator, afterValue);
    options.onChange?.(filterValue);
  };
  const setValueFn = (newValue: Optional) => {
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
