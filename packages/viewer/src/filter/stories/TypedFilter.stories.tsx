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
import React, { useState } from 'react';
import { TypedFilter } from '../TypedFilter';
import '../IdFilter';
import { FilterValue } from '../types';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { Card, Typography, Space } from 'antd';

const meta: Meta<typeof TypedFilter> = {
  title: 'Viewer/Filter/TypedFilter',
  component: TypedFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A dynamic filter component that automatically renders the appropriate filter UI based on the \`type\` prop using a registry pattern.

## Key Features
- **Dynamic Rendering**: Automatically selects filter component based on type
- **Registry Pattern**: Extensible filter system
- **Type Safety**: Full TypeScript support
- **Fallback Handling**: Graceful degradation for unsupported types
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['id', 'text', 'unsupported'],
      description: 'Filter type that determines which component to render',
    },
    field: {
      control: 'object',
      description: 'Field configuration with name, label, and type',
    },
    label: {
      control: 'object',
      description: 'Button styling configuration',
    },
    operator: {
      control: 'object',
      description: 'Operator selection configuration',
    },
    value: {
      control: 'object',
      description: 'Input value configuration',
    },
    onChange: {
      action: 'changed',
      description: 'Callback fired when filter value changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;


// 带交互的字符串过滤器
export const Default: Story = {
  args: {
    type: 'text',
    field: {
      name: 'email',
      label: 'Email',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.CONTAINS,
    },
    value: {
      placeholder: 'Search emails...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="Interactive Filter Demo" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TypedFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary" code copyable>
              {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};
