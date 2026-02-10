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
import { ViewColumn, ViewState, FieldDefinition } from '../../viewer';
import {
  all,
  PagedQuery,
  Condition,
  SortDirection,
} from '@ahoo-wang/fetcher-wow';
import type { SorterResult } from 'antd/es/table/interface';
import type { PaginationProps } from 'antd';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
}

const mockData: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2023-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Inactive',
    lastLogin: '2023-01-10',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'Active',
    lastLogin: '2023-01-12',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'User',
    status: 'Active',
    lastLogin: '2023-01-14',
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'Admin',
    status: 'Inactive',
    lastLogin: '2023-01-08',
  },
];

const fields: FieldDefinition[] = [
  { name: 'id', label: 'ID', primaryKey: true, type: 'number', sorter: true },
  {
    name: 'name',
    label: 'Name',
    primaryKey: false,
    type: 'text',
    sorter: true,
  },
  { name: 'email', label: 'Email', primaryKey: false, type: 'text' },
  { name: 'role', label: 'Role', primaryKey: false, type: 'text' },
  { name: 'status', label: 'Status', primaryKey: false, type: 'text' },
  {
    name: 'lastLogin',
    label: 'Last Login',
    primaryKey: false,
    type: 'date',
    sorter: true,
  },
];

const columns: ViewColumn[] = [
  { name: 'id', fixed: true, hidden: false },
  { name: 'name', fixed: false, hidden: false },
  { name: 'email', fixed: false, hidden: false },
  { name: 'role', fixed: false, hidden: false },
  { name: 'status', fixed: false, hidden: false },
  { name: 'lastLogin', fixed: false, hidden: false },
];

const viewState: ViewState = {
  id: 'default-view',
  name: 'User List',
  definitionId: 'user-view',
  type: 'SHARED',
  source: 'SYSTEM',
  isDefault: true,
  filters: [],
  columns,
  tableSize: 'middle',
  pageSize: 10,
  condition: all(),
};

const meta: Meta<typeof View> = {
  title: 'Viewer/View',
  component: View,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A comprehensive view component that combines filter panel, data table, and pagination. Provides full CRUD functionality with search, sort, and pagination support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    viewState: {
      control: 'object',
      description:
        'Current view state including columns, filters, and pagination settings',
    },
    fields: {
      control: 'object',
      description: 'Field definitions for table columns',
    },
    dataSource: {
      control: 'object',
      description: 'Data records to display in the table',
    },
    defaultShowFilter: {
      control: 'boolean',
      description: 'Whether to show the filter panel by default',
    },
    enableRowSelection: {
      control: 'boolean',
      description: 'Whether to enable row selection for batch operations',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ViewWrapper = (args: any) => {
  const handleSearch = (searchBody: PagedQuery) => {
    console.log('Search:', searchBody);
  };

  const searchDataConverter = (
    condition: Condition,
    page: number,
    pageSize: number,
    sorter?: SorterResult | SorterResult[],
  ): PagedQuery => {
    return {
      condition,
      pagination: { index: page, size: pageSize },
      sort: sorter
        ? Array.isArray(sorter)
          ? sorter.map(s => ({
              field: String(s.field),
              direction:
                s.order === 'ascend' ? SortDirection.ASC : SortDirection.DESC,
            }))
          : [
              {
                field: String(sorter.field),
                direction:
                  sorter.order === 'ascend'
                    ? SortDirection.ASC
                    : SortDirection.DESC,
              },
            ]
        : [],
    };
  };

  return (
    <View
      {...args}
      onSearch={handleSearch}
      searchDataConverter={searchDataConverter}
    />
  );
};

export const Basic: Story = {
  args: {
    viewState,
    fields,
    dataSource: mockData,
    defaultShowFilter: true,
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithRowSelection: Story = {
  args: {
    viewState,
    fields,
    dataSource: mockData,
    defaultShowFilter: true,
    enableRowSelection: true,
    pagination: { pageSize: 10 } as PaginationProps,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithoutFilterPanel: Story = {
  args: {
    viewState,
    fields,
    dataSource: mockData,
    defaultShowFilter: false,
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithActionColumn: Story = {
  args: {
    viewState,
    fields,
    dataSource: mockData,
    defaultShowFilter: true,
    enableRowSelection: true,
    pagination: { pageSize: 10 } as PaginationProps,
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

export const WithHiddenColumns: Story = {
  args: {
    viewState: {
      ...viewState,
      columns: [
        { name: 'id', fixed: true, hidden: false },
        { name: 'name', fixed: false, hidden: false },
        { name: 'email', fixed: false, hidden: true },
        { name: 'role', fixed: false, hidden: true },
        { name: 'status', fixed: false, hidden: false },
        { name: 'lastLogin', fixed: false, hidden: false },
      ],
    },
    fields,
    dataSource: mockData,
    defaultShowFilter: true,
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithFixedColumns: Story = {
  args: {
    viewState: {
      ...viewState,
      columns: [
        { name: 'id', fixed: true, hidden: false, width: '80px' },
        { name: 'name', fixed: true, hidden: false, width: '150px' },
        { name: 'email', fixed: false, hidden: false },
        { name: 'role', fixed: false, hidden: false },
        { name: 'status', fixed: false, hidden: false },
        { name: 'lastLogin', fixed: false, hidden: false },
      ],
    },
    fields,
    dataSource: mockData,
    defaultShowFilter: true,
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
  },
  render: args => <ViewWrapper {...args} />,
};

export const SmallTableSize: Story = {
  args: {
    viewState: {
      ...viewState,
      tableSize: 'small',
    },
    fields,
    dataSource: mockData,
    defaultShowFilter: true,
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
  },
  render: args => <ViewWrapper {...args} />,
};

export const LargeTableSize: Story = {
  args: {
    viewState: {
      ...viewState,
      tableSize: 'large',
    },
    fields,
    dataSource: mockData,
    defaultShowFilter: true,
    enableRowSelection: false,
    pagination: { pageSize: 10 } as PaginationProps,
  },
  render: args => <ViewWrapper {...args} />,
};

export const WithoutPagination: Story = {
  args: {
    viewState,
    fields,
    dataSource: mockData,
    defaultShowFilter: true,
    enableRowSelection: false,
    pagination: false,
  },
  render: args => <ViewWrapper {...args} />,
};
