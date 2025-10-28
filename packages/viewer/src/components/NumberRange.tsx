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

import { Input, InputNumber, Space } from 'antd';
import { useState } from 'react';

type NumberRangeValue = (number | undefined)[];

export interface NumberRangeProps {
  value?: number | NumberRangeValue;
  defaultValue?: number | NumberRangeValue;
  min?: number;
  max?: number;
  precision?: number;
  placeholder?: string[];
  onChange?: (value: NumberRangeValue) => void;
}

const convertToRangeValue = (
  value: number | NumberRangeValue | undefined,
): NumberRangeValue => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value, undefined];
};

const DEFAULT_PLACEHOLDER = ['最小值', '最大值'];

export function NumberRange(props: NumberRangeProps) {
  const isControlled = props.value !== undefined;
  const [internalValue, setInternalValue] = useState<NumberRangeValue>(
    convertToRangeValue(props.defaultValue),
  );
  const value = isControlled ? convertToRangeValue(props.value) : internalValue;
  const [start, end] = value;
  const handleValueChange = (newValue: NumberRangeValue) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    props.onChange?.(newValue);
  };

  const handleStartChange = (newStart: number | null) => {
    const startVal = newStart ?? undefined;
    handleValueChange([startVal, end]);
  };

  const handleEndChange = (newEnd: number | null) => {
    const endVal = newEnd ?? undefined;
    handleValueChange([start, endVal]);
  };

  const startMax = end !== undefined ? end : props.max;
  const endMin = start !== undefined ? start : props.min;
  const placeholder = props.placeholder
    ? [
      props.placeholder[0] || DEFAULT_PLACEHOLDER[0],
      props.placeholder[1] || DEFAULT_PLACEHOLDER[1],
    ]
    : DEFAULT_PLACEHOLDER;
  return (
    <Space.Compact block>
      <InputNumber
        value={start}
        min={props.min}
        max={startMax}
        precision={props.precision}
        placeholder={placeholder[0]}
        onChange={handleStartChange}
      />
      <Input
        style={{
          width: 30,
          borderInlineStart: 0,
          borderInlineEnd: 0,
          pointerEvents: 'none',
        }}
        placeholder="~"
        disabled
      />
      <InputNumber
        value={end}
        min={endMin}
        max={props.max}
        precision={props.precision}
        placeholder={placeholder[1]}
        onChange={handleEndChange}
      />
    </Space.Compact>
  );
}
