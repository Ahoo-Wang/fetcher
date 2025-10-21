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
import { FilterPanel, FilterItem } from '../FilterPanel';
import { Condition } from '@ahoo-wang/fetcher-wow';
import { Card, Typography, Space } from 'antd';
import '../IdFilter';
import '../TextFilter';

const meta: Meta<typeof FilterPanel> = {
  title: 'Viewer/Filter/FilterPanel',
  component: FilterPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A comprehensive filter panel component that provides a unified interface for managing multiple dynamic filters.

## Key Features
- **Dynamic Filter Management**: Add, remove, and clear filters dynamically
- **External/Internal State**: Supports both controlled and uncontrolled usage
- **Condition Aggregation**: Automatically aggregates valid filter conditions
- **User-Friendly UI**: Clean Antd-based interface with collapsible options
- **Type Safety**: Full TypeScript support with proper typing
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    availableFields: {
      control: 'object',
      description: 'Available filter fields configuration',
    },
    filters: {
      control: 'object',
      description: 'Current active filters (for controlled mode)',
    },
    onFiltersChange: {
      action: 'filtersChanged',
      description: 'Callback when filters list changes',
    },
    onFilterChange: {
      action: 'filterChanged',
      description: 'Callback when aggregated conditions change',
    },
    title: {
      control: 'text',
      description: 'Panel title',
    },
    collapsible: {
      control: 'boolean',
      description: 'Whether the panel can be collapsed',
    },
    defaultExpanded: {
      control: 'boolean',
      description: 'Default expanded state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 默认过滤面板
export const Default: Story = {
  args: {
    availableFields: [
      {
        name: 'id',
        label: 'ID',
        type: 'id',
      },
      {
        name: 'name',
        label: '名称',
        type: 'text',
      },
      {
        name: 'email',
        label: '邮箱',
        type: 'text',
      },
    ],
    title: '用户过滤',
  },
  render: (args: any) => {
    const [filters, setFilters] = useState<FilterItem[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);

    return (
      <Card style={{ width: 600 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <FilterPanel
            {...args}
            filters={filters}
            onFiltersChange={setFilters}
            onFilterChange={setConditions}
          />
          {conditions.length > 0 && (
            <Card size="small" title="生成的查询条件">
              <Typography.Text code>
                {JSON.stringify(conditions, null, 2)}
              </Typography.Text>
            </Card>
          )}
        </Space>
      </Card>
    );
  },
};

// 空状态
export const Empty: Story = {
  args: {
    availableFields: [],
    title: '过滤条件',
  },
  render: (args: any) => (
    <Card style={{ width: 400 }}>
      <FilterPanel {...args} />
    </Card>
  ),
};

// 可折叠面板
export const Collapsible: Story = {
  args: {
    availableFields: [
      {
        name: 'status',
        label: '状态',
        type: 'text',
      },
    ],
    title: '高级过滤',
    collapsible: true,
    defaultExpanded: false,
  },
  render: (args: any) => {
    const [filters, setFilters] = useState<FilterItem[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);

    return (
      <Card style={{ width: 600 }}>
        <FilterPanel
          {...args}
          filters={filters}
          onFiltersChange={setFilters}
          onFilterChange={setConditions}
        />
      </Card>
    );
  },
};

// 预设过滤器
export const WithInitialFilters: Story = {
  args: {
    availableFields: [
      {
        name: 'id',
        label: 'ID',
        type: 'id',
      },
      {
        name: 'name',
        label: '名称',
        type: 'text',
      },
    ],
    title: '用户过滤',
  },
  render: (args: any) => {
    const [filters, setFilters] = useState<FilterItem[]>([
      {
        id: 'filter1',
        field: {
          name: 'name',
          label: '名称',
          type: 'text',
        },
        type: 'text',
      },
    ]);
    const [conditions, setConditions] = useState<Condition[]>([]);

    return (
      <Card style={{ width: 600 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <FilterPanel
            {...args}
            filters={filters}
            onFiltersChange={setFilters}
            onFilterChange={setConditions}
          />
          {conditions.length > 0 && (
            <Card size="small" title="生成的查询条件">
              <Typography.Text code>
                {JSON.stringify(conditions, null, 2)}
              </Typography.Text>
            </Card>
          )}
        </Space>
      </Card>
    );
  },
};
