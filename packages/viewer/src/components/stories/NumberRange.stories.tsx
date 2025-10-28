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

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NumberRange } from '../NumberRange';

const meta: Meta<typeof NumberRange> = {
  title: 'Viewer/Components/NumberRange',
  component: NumberRange,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A number range input component that allows users to input a minimum and maximum value. Supports precision, min/max constraints, and custom placeholders.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<(number | undefined)[]>([]);
    return (
      <NumberRange
        placeholder={['最小值', '最大值']}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const WithDefaultValues: Story = {
  render: () => {
    const [value, setValue] = useState<(number | undefined)[]>([10, 100]);
    return (
      <NumberRange
        placeholder={['起始值', '结束值']}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const WithMinMaxConstraints: Story = {
  render: () => {
    const [value, setValue] = useState<(number | undefined)[]>([]);
    return (
      <NumberRange
        min={0}
        max={1000}
        placeholder={['最小值 (0-1000)', '最大值 (0-1000)']}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const WithPrecision: Story = {
  render: () => {
    const [value, setValue] = useState<(number | undefined)[]>([]);
    return (
      <NumberRange
        precision={2}
        placeholder={['最小值 (两位小数)', '最大值 (两位小数)']}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const PriceRange: Story = {
  render: () => {
    const [value, setValue] = useState<(number | undefined)[]>([]);
    return (
      <NumberRange
        min={0}
        precision={2}
        placeholder={['最低价格', '最高价格']}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const AgeRange: Story = {
  render: () => {
    const [value, setValue] = useState<(number | undefined)[]>([]);
    return (
      <NumberRange
        min={0}
        max={120}
        placeholder={['最小年龄', '最大年龄']}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const WithChangeHandler: Story = {
  render: () => {
    const [value, setValue] = useState<(number | undefined)[]>([]);
    return (
      <div>
        <NumberRange
          placeholder={['输入最小值', '输入最大值']}
          value={value}
          onChange={setValue}
        />
        <p style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
          当前范围: [{value[0] ?? '未设置'}, {value[1] ?? '未设置'}]
        </p>
      </div>
    );
  },
};
