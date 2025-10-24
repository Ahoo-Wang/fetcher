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
import { NumberFilter } from '../NumberFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof NumberFilter> = {
  title: 'Viewer/Filters/NumberFilter',
  component: NumberFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A number filter component that supports various numeric comparison operations including equals, greater than, less than, between, and in/not in operations.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    field: {
      name: 'age',
      label: 'Age',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: 25,
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <NumberFilter {...args} onChange={setValue} />;
  },
};

export const GreaterThan: Story = {
  args: {
    field: {
      name: 'price',
      label: 'Price',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.GT,
      options: [],
    },
    value: {
      defaultValue: 100,
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <NumberFilter {...args} onChange={setValue} />;
  },
};

export const LessThanOrEqual: Story = {
  args: {
    field: {
      name: 'quantity',
      label: 'Quantity',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.LTE,
      options: [],
    },
    value: {
      defaultValue: 50,
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <NumberFilter {...args} onChange={setValue} />;
  },
};

export const Between: Story = {
  args: {
    field: {
      name: 'range',
      label: 'Range',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.BETWEEN,
      options: [],
    },
    value: {
      defaultValue: [10, 100],
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <NumberFilter {...args} onChange={setValue} />;
  },
};

export const InOperator: Story = {
  args: {
    field: {
      name: 'scores',
      label: 'Scores',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.IN,
      options: [],
    },
    value: {
      defaultValue: [85, 90, 95],
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <NumberFilter {...args} onChange={setValue} />;
  },
};

export const NotInOperator: Story = {
  args: {
    field: {
      name: 'excluded',
      label: 'Excluded Values',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.NOT_IN,
      options: [],
    },
    value: {
      defaultValue: [0, 1, 2],
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <NumberFilter {...args} onChange={setValue} />;
  },
};

export const WithConstraints: Story = {
  args: {
    field: {
      name: 'percentage',
      label: 'Percentage',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.BETWEEN,
      options: [],
    },
    value: {
      defaultValue: [0, 100],
      placeholder: 'Enter range (0-100)',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <NumberFilter {...args} onChange={setValue} />;
  },
};

export const WithPrecision: Story = {
  args: {
    field: {
      name: 'rating',
      label: 'Rating',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.GTE,
      options: [],
    },
    value: {
      defaultValue: 4.5,
      placeholder: 'Enter rating (0-5)',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <NumberFilter {...args} onChange={setValue} />;
  },
};

export const WithChangeHandler: Story = {
  args: {
    field: {
      name: 'count',
      label: 'Count',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: 10,
    },
  },
  render: args => {
    const [value, setValue] = useState<any>();
    return (
      <div>
        <NumberFilter {...args} onChange={setValue} />
        <p style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
          Current filter: {JSON.stringify(value, null, 2)}
        </p>
      </div>
    );
  },
};
