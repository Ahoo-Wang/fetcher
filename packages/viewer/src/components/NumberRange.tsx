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

import { InputNumber } from 'antd';
import { useState } from 'react';

type NumberRangeValue = (number | undefined)[];

export interface NumberRangeProps {
  defaultValue?: NumberRangeValue;
  min?: number;
  max?: number;
  precision?: number;
  placeholder?: string[];
  onChange?: (value: NumberRangeValue) => void;
}

export function NumberRange(props: NumberRangeProps) {
  const [defaultStart, defaultEnd] = props.defaultValue || [];
  const [start, setStart] = useState<number | undefined>(defaultStart);
  const [end, setEnd] = useState<number | undefined>(defaultEnd);

  const startMax: number | undefined = end !== undefined ? end : props.max;
  const endMin: number | undefined = start !== undefined ? start : props.min;

  const handleStartChange = (value: number | null) => {
    const newStart = value ?? undefined;
    setStart(newStart);
    props.onChange?.([newStart, end]);
  };

  const handleEndChange = (value: number | null) => {
    const newEnd = value ?? undefined;
    setEnd(newEnd);
    props.onChange?.([start, newEnd]);
  };

  return (
    <>
      <InputNumber
        value={start}
        min={props.min}
        max={startMax}
        precision={props.precision}
        placeholder={props.placeholder?.[0] || '最小值'}
        onChange={handleStartChange}
      />
      <InputNumber
        value={end}
        min={endMin}
        max={props.max}
        precision={props.precision}
        placeholder={props.placeholder?.[1] || '最大值'}
        onChange={handleEndChange}
      />
    </>
  );
}
