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
import { UseFilterStateReturn } from './useFilterState';
import { DatePicker, InputNumber } from 'antd';

export const DATE_TIME_FILTER_NAME = 'datetime';
type DateTimeValueType = number | string | (number | string)[]

export function DateTimeFilter(
  props: FilterProps<DateTimeValueType>,
) {
  const handleChange = (value: DateTimeValueType) => {
    props.onChange?.(value);
  };
  const assemblyConditionFilterProps: AssemblyFilterProps<DateTimeValueType> = {
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
    valueInputRender: (
      filterState: UseFilterStateReturn<DateTimeValueType>,
    ) => {
      switch (filterState.operator) {
        case Operator.BETWEEN: {
          return (<DatePicker.RangePicker
            showTime
            onChange={filterState.setValue}
            {...props.value}
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
          return (<InputNumber min={1} onChange={filterState.setValue} {...props.value} />);
        }
        case Operator.BEFORE_TODAY: {
          return (<DatePicker
            picker="time"
            onChange={filterState.setValue}
            {...props.value}
          />);
        }
        default: {
          return (<DatePicker
            showTime
            onChange={filterState.setValue}
            {...props.value}
          />);
        }
      }
    },
  };
  return (
    <AssemblyFilter<DateTimeValueType>
      {...assemblyConditionFilterProps}
    ></AssemblyFilter>
  );
}

DateTimeFilter.displayName = 'DateTimeFilter';