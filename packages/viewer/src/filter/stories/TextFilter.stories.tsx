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

import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { TextFilter } from '../TextFilter';
import { FilterValue } from '../types';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { Card, Typography, Space, Divider } from 'antd';

const meta: Meta<typeof TextFilter> = {
  title: 'Viewer/Filter/TextFilter',
  component: TextFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A versatile text filter component that supports various string matching operations.

## Supported Operators
- **EQ**: Equal to (equals)
- **NE**: Not equal to (not equals)
- **CONTAINS**: Contains substring (contains)
- **STARTS_WITH**: Starts with prefix (starts with)
- **ENDS_WITH**: Ends with suffix (ends with)
- **IN**: Value in array (contains - multiple values)
- **NOT_IN**: Value not in array (not contains - multiple values)

## Input Types
- **Single Value**: Uses Input component for EQ, NE, CONTAINS, STARTS_WITH, ENDS_WITH
- **Multiple Values**: Uses TagInput component for IN, NOT_IN operators
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
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

// 基础文本过滤器 - 包含操作符
export const Default: Story = {
  args: {
    field: {
      name: 'name',
      label: 'Name',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.CONTAINS,
    },
    value: {
      placeholder: 'Enter name to search...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="Text Filter - Contains" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary" code>
              Filter: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};

// 精确匹配
export const ExactMatch: Story = {
  args: {
    field: {
      name: 'username',
      label: 'Username',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.EQ,
    },
    value: {
      placeholder: 'Enter exact username...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="Text Filter - Exact Match" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              Filter: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};

// 前缀匹配
export const StartsWith: Story = {
  args: {
    field: {
      name: 'title',
      label: 'Title',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.STARTS_WITH,
    },
    value: {
      placeholder: 'Enter title prefix...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="Text Filter - Starts With" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              Filter: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};

// 多值包含过滤器
export const MultipleValues: Story = {
  args: {
    field: {
      name: 'tags',
      label: 'Tags',
      type: 'string[]',
    },
    label: {},
    operator: {
      defaultValue: Operator.IN,
    },
    value: {
      placeholder: 'Enter tags (press Enter to add)...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="Text Filter - Multiple Values (IN)" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              Filter: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};

// 多值排除过滤器
export const ExcludeMultipleValues: Story = {
  args: {
    field: {
      name: 'categories',
      label: 'Categories',
      type: 'string[]',
    },
    label: {},
    operator: {
      defaultValue: Operator.NOT_IN,
    },
    value: {
      placeholder: 'Enter categories to exclude...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card
        title="Text Filter - Exclude Multiple Values (NOT IN)"
        style={{ width: 400 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              Filter: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};

// 动态操作符切换演示
export const DynamicOperatorSwitching: Story = {
  args: {
    field: {
      name: 'content',
      label: 'Content',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.CONTAINS,
    },
    value: {
      placeholder: 'Enter search text...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();
    const [currentOperator, setCurrentOperator] = useState(Operator.CONTAINS);

    const operators = [
      { value: Operator.EQ, label: '等于' },
      { value: Operator.NE, label: '不等于' },
      { value: Operator.CONTAINS, label: '包含' },
      { value: Operator.STARTS_WITH, label: '以...开头' },
      { value: Operator.ENDS_WITH, label: '以...结尾' },
      { value: Operator.IN, label: '包含(多值)' },
      { value: Operator.NOT_IN, label: '不包含(多值)' },
    ];

    return (
      <Card
        title="Text Filter - Dynamic Operator Switching"
        style={{ width: 500 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>
            Try different operators to see input type changes:
          </Typography.Text>

          <Space wrap>
            {operators.map(op => (
              <Typography.Link
                key={op.value}
                onClick={() => setCurrentOperator(op.value)}
                style={{
                  fontWeight: currentOperator === op.value ? 'bold' : 'normal',
                  color: currentOperator === op.value ? '#1890ff' : 'inherit',
                }}
              >
                {op.label}
              </Typography.Link>
            ))}
          </Space>

          <Divider />

          <TextFilter
            {...args}
            operator={{ ...args.operator, value: currentOperator }}
            onChange={setFilterValue}
          />

          {filterValue && (
            <Typography.Text type="secondary">
              Current filter: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}

          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            Note: IN/NOT_IN operators use TagInput for multiple values, others
            use regular Input.
          </Typography.Text>
        </Space>
      </Card>
    );
  },
};

// 带预设值的过滤器
export const WithPresetValue: Story = {
  args: {
    field: {
      name: 'description',
      label: 'Description',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.CONTAINS,
    },
    value: {
      defaultValue: 'sample text',
      placeholder: 'Search in description...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="Text Filter - With Preset Value" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              Filter: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};
