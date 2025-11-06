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
import { ConditionValueParser, OnOperatorChangeValueConverter, UseFilterStateReturn } from './useFilterState';
import { DatePicker, InputNumber } from 'antd';
import { Optional } from '../types';
import { Dayjs, isDayjs } from 'dayjs';
import { ExtendedOperator, SelectOperator } from './operator';

export const DATE_TIME_FILTER_NAME = 'datetime';
const TIME_FORMAT = 'HH:mm:ss';
const DateTimeNumberValueOperators = new Set(
  [
    Operator.RECENT_DAYS,
    Operator.EARLIER_DAYS,
  ],
);

const DateTimeDayjsValueOperators = new Set(
  [
    Operator.GT,
    Operator.LT,
    Operator.GTE,
    Operator.LTE,
  ],
);

export const DateTimeOnOperatorChangeValueConverter: OnOperatorChangeValueConverter = (
  beforeOperator: SelectOperator,
  afterOperator: SelectOperator,
  value: Optional<number | Dayjs | Dayjs[]>,
) => {
  if (beforeOperator === ExtendedOperator.UNDEFINED || afterOperator === ExtendedOperator.UNDEFINED) {
    return value;
  }
  if (DateTimeNumberValueOperators.has(beforeOperator) && DateTimeNumberValueOperators.has(afterOperator)) {
    return value;
  }
  if (DateTimeDayjsValueOperators.has(beforeOperator)) {
    if (DateTimeDayjsValueOperators.has(afterOperator)) {
      return value;
    }
    if (afterOperator === Operator.BETWEEN) {
      return [value, undefined];
    }
  }
  return undefined;
};
export const TimestampConditionValueParser: ConditionValueParser = (operator: Operator, value: Optional<number | Dayjs | Dayjs[]>) => {
  if (!value) {
    return undefined;
  }

  if (operator === Operator.BETWEEN) {
    if (!Array.isArray(value) || value.length !== 2) {
      return undefined;
    }
    return [value[0]?.valueOf(), value[1]?.valueOf()];
  }
  if (DateTimeNumberValueOperators.has(operator)) {
    return value;
  }
  if (operator === Operator.BEFORE_TODAY) {
    if (isDayjs(value)) {
      return value.format(TIME_FORMAT);
    }
    return undefined;
  }
  if (isDayjs(value)) {
    return value.valueOf();
  }
  return undefined;
};

export function DateTimeFilter(
  props: FilterProps,
) {
  const assemblyConditionFilterProps: AssemblyFilterProps = {
    ...props,
    supportedOperators: [
      Operator.GT,
      Operator.LT,
      Operator.GTE,
      Operator.LTE,
      Operator.BETWEEN,
      Operator.TODAY,
      Operator.BEFORE_TODAY,
      Operator.TOMORROW,
      Operator.THIS_WEEK,
      Operator.NEXT_WEEK,
      Operator.LAST_WEEK,
      Operator.THIS_MONTH,
      Operator.LAST_MONTH,
      Operator.RECENT_DAYS,
      Operator.EARLIER_DAYS,
    ],
    onOperatorChangeValueConverter: DateTimeOnOperatorChangeValueConverter,
    conditionValueParser: TimestampConditionValueParser,
    valueInputRender: (
      filterState: UseFilterStateReturn,
    ) => {
      switch (filterState.operator) {
        case Operator.BETWEEN: {
          const { placeholder, ...rangResetProps } = props.value || {};
          return (<DatePicker.RangePicker
            value={filterState.value}
            onChange={filterState.setValue}
            {...rangResetProps}
          />);
        }
        case Operator.TODAY:
        case Operator.TOMORROW:
        case Operator.THIS_WEEK:
        case Operator.NEXT_WEEK:
        case Operator.LAST_WEEK:
        case Operator.THIS_MONTH:
        case Operator.LAST_MONTH: {
          return null;
        }
        case Operator.RECENT_DAYS:
        case Operator.EARLIER_DAYS: {
          return (<InputNumber value={filterState.value} min={1} onChange={filterState.setValue} {...props.value} />);
        }
        case Operator.BEFORE_TODAY: {
          return (<DatePicker
            picker={'time'}
            value={filterState.value}
            onChange={filterState.setValue}
            {...props.value}
          />);
        }
        default: {
          return (<DatePicker
            value={filterState.value}
            picker={'date'}
            showNow={false}
            onChange={filterState.setValue}
            {...props.value}
          />);
        }
      }
    },
  };
  return (
    <AssemblyFilter
      {...assemblyConditionFilterProps}
    ></AssemblyFilter>
  );
}

DateTimeFilter.displayName = 'DateTimeFilter';