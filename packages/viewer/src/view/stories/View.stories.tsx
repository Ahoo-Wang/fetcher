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
import { View } from '../View';
import { ViewColumn, FieldDefinition } from '../../viewer';
import { AvailableFilterGroup } from '../../filter';
import type { PaginationProps } from 'antd';
import { PagedList } from '@ahoo-wang/fetcher-wow';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

const mockData: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Inactive',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'User',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'Admin',
    status: 'Inactive',
  },
];

const mockPagedData: PagedList<User> = {
  list: mockData,
  total: 100,
};

const fields: FieldDefinition[] = [
  { name: 'id', label: 'ID', primaryKey: true, type: 'number' },
  { name: 'name', label: 'Name', primaryKey: false, type: 'text' },
  { name: 'email', label: 'Email', primaryKey: false, type: 'text' },
  { name: 'role', label: 'Role', primaryKey: false, type: 'text' },
  { name: 'status', label: 'Status', primaryKey: false, type: 'text' },
];

const defaultColumns: ViewColumn[] = [
  { key: 'id', name: 'id', fixed: true, hidden: false },
  { key: 'name', name: 'name', fixed: false, hidden: false },
  { key: 'email', name: 'email', fixed: false, hidden: false },
  { key: 'role', name: 'role', fixed: false, hidden: false },
  { key: 'status', name: 'status', fixed: false, hidden: false },
];

const availableFilters: AvailableFilterGroup[] = [
  {
    label: 'Status',
    filters: [
      { field: { name: 'status', label: 'Status' }, component: 'select' },
      { field: { name: 'role', label: 'Role' }, component: 'select' },
    ],
  },
];

const meta: Meta<typeof View> = {
  title: 'Viewer/View',
  component: View,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive view component that combines filter panel and data table. Supports internal state management with optional external control for filters, columns, page size, and table size.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    fields: {
      control: 'object',
      description: 'Field definitions for table columns',
    },
    availableFilters: {
      control: 'object',
      description: 'Available filter groups for the filter panel',
    },
    defaultTableSize: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Default table size (small, middle, large)',
    },
    dataSource: {
      control: 'object',
      description: 'Paged data source with list and total',
    },
    showFilter: {
      control: 'boolean',
      description: 'Whether to show the filter panel',
    },
    filterMode: {
      control: 'select',
      options: ['none', 'normal', 'editable'],
      description: 'Whether filter panel mode',
    },
    defaultActiveFilters: {
      control: 'object',
      description: 'Default active filters',
    },
    defaultColumns: {
      control: 'object',
      description: 'Default column configurations',
    },
    defaultPageSize: {
      control: 'number',
      description: 'Default number of items per page',
    },
    enableRowSelection: {
      control: 'boolean',
      description: 'Whether to enable row selection',
    },
    viewTableSetting: {
      control: 'object',
      description: 'Table settings panel configuration',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ViewWrapper = (args: any) => {
  const handleChange = (
    action: 'pagination' | 'sorter' | 'filter' | 'reset',
    condition?: any,
    index?: number,
    size?: number,
    sorter?: any[],
  ) => {
    console.log('View change:', { action, condition, index, size, sorter });
  };

  const handleSelectedDataChange = (data: User[]) => {
    console.log('Selected data:', data);
  };

  return (
    <View
      {...args}
      onChange={handleChange}
      onSelectedDataChange={handleSelectedDataChange}
    />
  );
};

export const Basic: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [
      {
        key: 'status',
        type: 'select',
        field: { type: 'select', name: 'status', label: 'Status' },
        operator: {},
        value: { defaultValue: 'Active' },
      },
    ],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: false,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithRowSelection: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [
      {
        key: 'status',
        type: 'select',
        field: { type: 'select', name: 'status', label: 'Status' },
        operator: {},
        value: { defaultValue: 'Active' },
      },
    ],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: true,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: false,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithoutFilterPanel: Story = {
  args: {
    fields,
    availableFilters: [],
    dataSource: mockPagedData,
    showFilter: false,
    defaultActiveFilters: [],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: false,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithActionColumn: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: true,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: { title: '表格设置' },
    actionColumn: {
      title: 'Actions',
      actions: (record: any) => ({
        primaryAction: {
          data: { value: 'Edit', record, index: 0 },
          attributes: { onClick: () => console.log('Edit', record) },
        },
        secondaryActions: [
          {
            data: { value: 'Delete', record, index: 1 },
            attributes: {
              onClick: () => console.log('Delete', record),
              danger: true,
            },
          },
        ],
      }),
    },
    onClickPrimaryKey: (id: any, record: any) =>
      console.log('Click primary key:', id, record),
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithTableSettings: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: { title: 'Column Settings' },
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithHiddenColumns: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [],
    defaultColumns: [
      { key: 'id', name: 'id', fixed: true, hidden: false },
      { key: 'name', name: 'name', fixed: false, hidden: false },
      { key: 'email', name: 'email', fixed: false, hidden: true },
      { key: 'role', name: 'role', fixed: false, hidden: true },
      { key: 'status', name: 'status', fixed: false, hidden: false },
    ],
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: { title: 'Column Settings' },
  },
  render: args => <ViewWrapper {...args} />,
};

export const SmallTableSize: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'small',
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: false,
  },
  render: args => <ViewWrapper {...args} />,
};

export const LargeTableSize: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'large',
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: false,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithoutPagination: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: false,
    pagination: false,
    viewTableSetting: false,
  },
  render: args => <ViewWrapper {...args} />,
};

export const ControlledActiveFilters: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    filterMode: 'editable',
    defaultActiveFilters: [],
    externalActiveFilters: [
      {
        key: 'status',
        type: 'text',
        field: { name: 'status', label: 'Status' },
        operator: {},
        value: { defaultValue: 'Controlled' },
      },
    ],
    defaultColumns,
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: false,
  },
  render: args => <ViewWrapper {...args} />,
};

export const ControlledColumns: Story = {
  args: {
    fields,
    availableFilters,
    dataSource: mockPagedData,
    showFilter: true,
    defaultActiveFilters: [],
    defaultColumns,
    externalColumns: [
      { key: 'id', name: 'id', fixed: true, hidden: false },
      { key: 'name', name: 'name', fixed: false, hidden: false },
      { key: 'email', name: 'email', fixed: false, hidden: true },
    ],
    defaultPageSize: 10,
    defaultTableSize: 'middle',
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
    viewTableSetting: { title: 'Column Settings' },
  },
  render: args => <ViewWrapper {...args} />,
};
