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
    layout: 'centered',
    docs: {
      description: {
        component:
          'A number range input component with two connected InputNumber fields. The start value constrains the minimum of the end field, and the end value constrains the maximum of the start field.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: 'object',
      description: 'Default values for start and end inputs',
    },
    min: {
      control: 'number',
      description: 'Minimum value for both inputs',
    },
    max: {
      control: 'number',
      description: 'Maximum value for both inputs',
    },
    precision: {
      control: 'number',
      description: 'Decimal precision for the inputs',
    },
    placeholder: {
      control: 'object',
      description: 'Placeholder text for start and end inputs',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when values change',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: args => {
    const [, setValue] = useState<(number | undefined)[]>([]);
    return <NumberRange {...args} onChange={setValue} />;
  },
};

export const WithDefaultValues: Story = {
  args: {
    defaultValue: [10, 50],
  },
  render: args => {
    const [, setValue] = useState<(number | undefined)[]>([]);
    return <NumberRange {...args} onChange={setValue} />;
  },
};

export const WithConstraints: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: [25, 75],
  },
  render: args => {
    const [, setValue] = useState<(number | undefined)[]>([]);
    return <NumberRange {...args} onChange={setValue} />;
  },
};

export const WithPrecision: Story = {
  args: {
    precision: 2,
    defaultValue: [1.5, 9.99],
  },
  render: args => {
    const [, setValue] = useState<(number | undefined)[]>([]);
    return <NumberRange {...args} onChange={setValue} />;
  },
};

export const CustomPlaceholders: Story = {
  args: {
    placeholder: ['开始值', '结束值'],
  },
  render: args => {
    const [, setValue] = useState<(number | undefined)[]>([]);
    return <NumberRange {...args} onChange={setValue} />;
  },
};

export const WithChangeHandler: Story = {
  args: {
    defaultValue: [5, 15],
  },
  render: args => {
    const [value, setValue] = useState<(number | undefined)[]>([]);
    return (
      <div>
        <NumberRange {...args} onChange={setValue} />
        <p style={{ marginTop: 16 }}>
          Current value: [{value[0] ?? 'undefined'}, {value[1] ?? 'undefined'}]
        </p>
      </div>
    );
  },
};

export const LargeRange: Story = {
  args: {
    min: -1000,
    max: 1000,
    defaultValue: [-500, 500],
  },
  render: args => {
    const [, setValue] = useState<(number | undefined)[]>([]);
    return <NumberRange {...args} onChange={setValue} />;
  },
};
