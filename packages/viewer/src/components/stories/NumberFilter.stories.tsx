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
import { NumberFilter } from '../../filter/NumberFilter';
import { FilterValue } from '../../filter/types';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { Card, Typography, Space, Divider } from 'antd';

const meta: Meta<typeof NumberFilter> = {
  title: 'Viewer/Filter/NumberFilter',
  component: NumberFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A versatile number filter component that supports various numerical comparison operations.

## Supported Operators
- **EQ**: Equal to (等于)
- **NE**: Not equal to (不等于)
- **GT**: Greater than (大于)
- **LT**: Less than (小于)
- **GTE**: Greater than or equal to (大于等于)
- **LTE**: Less than or equal to (小于等于)
- **BETWEEN**: Between two values (在范围内)
- **IN**: Value in array (包含任一)
- **NOT_IN**: Value not in array (不包含任一)

## Input Types
- **Single Value**: Uses number Input for EQ, NE, GT, LT, GTE, LTE
- **Range Values**: Uses dual number Inputs for BETWEEN operator
- **Multiple Values**: Uses comma-separated Input for IN, NOT_IN operators
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

// 基础数字过滤器 - 等于
export const Default: Story = {
  args: {
    field: {
      name: 'age',
      label: '年龄',
      type: 'number',
    },
    label: {},
    operator: {
      defaultValue: Operator.EQ,
    },
    value: {
      placeholder: '输入年龄...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="数字筛选器 - 等于" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <NumberFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              筛选条件: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};

// 大于比较
export const GreaterThan: Story = {
  args: {
    field: {
      name: 'price',
      label: '价格',
      type: 'number',
    },
    label: {},
    operator: {
      defaultValue: Operator.GT,
    },
    value: {
      placeholder: '输入最低价格...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="数字筛选器 - 大于" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <NumberFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              筛选条件: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};

// 范围筛选
export const Between: Story = {
  args: {
    field: {
      name: 'score',
      label: '分数',
      type: 'number',
    },
    label: {},
    operator: {
      defaultValue: Operator.BETWEEN,
    },
    value: {
      placeholder: '分数范围',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="数字筛选器 - 范围" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <NumberFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              筛选条件: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};

// 多值包含
export const MultipleValues: Story = {
  args: {
    field: {
      name: 'ids',
      label: 'ID列表',
      type: 'number[]',
    },
    label: {},
    operator: {
      defaultValue: Operator.IN,
    },
    value: {
      placeholder: '输入ID，用逗号分隔...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="数字筛选器 - 多值包含" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <NumberFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              筛选条件: {JSON.stringify(filterValue.condition)}
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
      name: 'quantity',
      label: '数量',
      type: 'number',
    },
    label: {},
    operator: {
      defaultValue: Operator.EQ,
    },
    value: {
      placeholder: '输入数值...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();
    const [currentOperator, setCurrentOperator] = useState(Operator.EQ);

    const operators = [
      { value: Operator.EQ, label: '等于' },
      { value: Operator.NE, label: '不等于' },
      { value: Operator.GT, label: '大于' },
      { value: Operator.LT, label: '小于' },
      { value: Operator.GTE, label: '大于等于' },
      { value: Operator.LTE, label: '小于等于' },
      { value: Operator.BETWEEN, label: '范围' },
      { value: Operator.IN, label: '包含(多值)' },
      { value: Operator.NOT_IN, label: '不包含(多值)' },
    ];

    return (
      <Card title="数字筛选器 - 动态操作符切换" style={{ width: 500 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>尝试不同的操作符查看输入类型变化:</Typography.Text>

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

          <NumberFilter
            {...args}
            operator={{ ...args.operator, value: currentOperator }}
            onChange={setFilterValue}
          />

          {filterValue && (
            <Typography.Text type="secondary">
              当前筛选: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}

          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            注意:
            BETWEEN使用双输入框，IN/NOT_IN使用逗号分隔输入，其他使用单数字输入。
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
      name: 'rating',
      label: '评分',
      type: 'number',
    },
    label: {},
    operator: {
      defaultValue: Operator.GTE,
    },
    value: {
      defaultValue: 4,
      placeholder: '最低评分...',
    },
  },
  render: (args: any) => {
    const [filterValue, setFilterValue] = useState<FilterValue>();

    return (
      <Card title="数字筛选器 - 带预设值" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <NumberFilter {...args} onChange={setFilterValue} />
          {filterValue && (
            <Typography.Text type="secondary">
              筛选条件: {JSON.stringify(filterValue.condition)}
            </Typography.Text>
          )}
        </Space>
      </Card>
    );
  },
};
