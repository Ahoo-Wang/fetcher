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
import { ViewTable } from '../ViewTable';
import { FieldDefinition, ViewColumn } from '../../viewer';
import { SizeType } from 'antd/es/config-provider/SizeContext';

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
    lastLogin: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Inactive',
    lastLogin: '2024-01-10',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'Active',
    lastLogin: '2024-01-12',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'User',
    status: 'Active',
    lastLogin: '2024-01-14',
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'Admin',
    status: 'Inactive',
    lastLogin: '2024-01-08',
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
  { key: 'id', name: 'id', fixed: true, hidden: false },
  { key: 'name', name: 'name', fixed: false, hidden: false },
  { key: 'email', name: 'email', fixed: false, hidden: false },
  { key: 'role', name: 'role', fixed: false, hidden: false },
  { key: 'status', name: 'status', fixed: false, hidden: false },
  { key: 'lastLogin', name: 'lastLogin', fixed: false, hidden: false },
];

const meta: Meta<typeof ViewTable> = {
  title: 'Viewer/Table/ViewTable',
  component: ViewTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A comprehensive data table component that integrates with the Viewer ecosystem. Provides dynamic column rendering, row selection, sorting, and customizable cell types.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    fields: {
      control: 'object',
      description: 'Field definitions for table columns',
    },
    columns: {
      control: 'object',
      description:
        'Column configurations including visibility, fixed position, and sorting',
    },
    dataSource: {
      control: 'object',
      description: 'Data records to display',
    },
    tableSize: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Table size (small, middle, large)',
    },
    enableRowSelection: {
      control: 'boolean',
      description: 'Whether to enable row selection',
    },
    viewTableSetting: {
      control: 'object',
      description: 'Table settings panel configuration',
    },
    onSortChanged: {
      action: 'sort changed',
      description: 'Callback fired when sort order changes',
    },
    onSelectChange: {
      action: 'select changed',
      description: 'Callback fired when row selection changes',
    },
    onClickPrimaryKey: {
      action: 'primary key clicked',
      description: 'Callback fired when primary key cell is clicked',
    },
    onColumnsChange: {
      action: 'columns changed',
      description: 'Callback fired when column configuration changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ViewTableWrapper = (args: any) => {
  const handleSortChanged = (sorter: any | any[]) => {
    console.log('Sort changed:', sorter);
  };

  const handleSelectChange = (items: User[]) => {
    console.log('Select changed:', items);
  };

  const handleClickPrimaryKey = (id: any, record: User) => {
    console.log('Click primary key:', id, record);
  };

  const handleColumnsChange = (cols: ViewColumn[]) => {
    console.log('Columns changed:', cols);
  };

  return (
    <ViewTable
      {...args}
      onSortChanged={handleSortChanged}
      onSelectChange={handleSelectChange}
      onClickPrimaryKey={handleClickPrimaryKey}
      onColumnsChange={handleColumnsChange}
    />
  );
};

export const Basic: Story = {
  args: {
    fields,
    columns,
    dataSource: mockData,
    tableSize: 'middle',
    enableRowSelection: false,
    viewTableSetting: false,
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const WithRowSelection: Story = {
  args: {
    fields,
    columns,
    dataSource: mockData,
    tableSize: 'middle',
    enableRowSelection: true,
    viewTableSetting: false,
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const WithActionColumn: Story = {
  args: {
    fields,
    columns,
    dataSource: mockData,
    tableSize: 'middle',
    enableRowSelection: true,
    viewTableSetting: false,
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
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const WithTableSettings: Story = {
  args: {
    fields,
    columns,
    dataSource: mockData,
    tableSize: 'middle',
    enableRowSelection: false,
    viewTableSetting: { title: 'Column Settings' },
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const WithHiddenColumns: Story = {
  args: {
    fields,
    columns: [
      { key: 'id', name: 'id', fixed: true, hidden: false },
      { key: 'name', name: 'name', fixed: false, hidden: false },
      { key: 'email', name: 'email', fixed: false, hidden: true },
      { key: 'role', name: 'role', fixed: false, hidden: true },
      { key: 'status', name: 'status', fixed: false, hidden: false },
      { key: 'lastLogin', name: 'lastLogin', fixed: false, hidden: false },
    ],
    dataSource: mockData,
    tableSize: 'middle',
    enableRowSelection: false,
    viewTableSetting: { title: 'Column Settings' },
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const WithFixedColumns: Story = {
  args: {
    fields,
    columns: [
      { key: 'id', name: 'id', fixed: true, hidden: false, width: '80px' },
      { key: 'name', name: 'name', fixed: true, hidden: false, width: '150px' },
      { key: 'email', name: 'email', fixed: false, hidden: false },
      { key: 'role', name: 'role', fixed: false, hidden: false },
      { key: 'status', name: 'status', fixed: false, hidden: false },
      { key: 'lastLogin', name: 'lastLogin', fixed: false, hidden: false },
    ],
    dataSource: mockData,
    tableSize: 'middle',
    enableRowSelection: false,
    viewTableSetting: { title: 'Column Settings' },
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const SmallTableSize: Story = {
  args: {
    fields,
    columns,
    dataSource: mockData,
    tableSize: 'small',
    enableRowSelection: false,
    viewTableSetting: false,
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const LargeTableSize: Story = {
  args: {
    fields,
    columns,
    dataSource: mockData,
    tableSize: 'large',
    enableRowSelection: false,
    viewTableSetting: false,
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const WithCustomRenderers: Story = {
  args: {
    fields: [
      { name: 'id', label: 'ID', primaryKey: true, type: 'number' },
      { name: 'name', label: 'Name', primaryKey: false, type: 'text' },
      { name: 'email', label: 'Email', primaryKey: false, type: 'text' },
      {
        name: 'role',
        label: 'Role',
        primaryKey: false,
        type: 'text',
        render: (value: any) => (
          <span style={{ color: value === 'Admin' ? 'blue' : 'green' }}>
            {value}
          </span>
        ),
      },
      {
        name: 'status',
        label: 'Status',
        primaryKey: false,
        type: 'text',
        render: (value: any) => (
          <span style={{ color: value === 'Active' ? 'green' : 'red' }}>
            {value}
          </span>
        ),
      },
      {
        name: 'lastLogin',
        label: 'Last Login',
        primaryKey: false,
        type: 'date',
      },
    ],
    columns,
    dataSource: mockData,
    tableSize: 'middle',
    enableRowSelection: false,
    viewTableSetting: false,
  },
  render: args => <ViewTableWrapper {...args} />,
};

export const WithActionColumnAndSettings: Story = {
  args: {
    fields,
    columns,
    dataSource: mockData,
    tableSize: 'middle',
    enableRowSelection: true,
    viewTableSetting: { title: 'Table Settings' },
    actionColumn: {
      title: 'Actions',
      actions: (record: any) => ({
        primaryAction: {
          data: { value: 'Edit', record, index: 0 },
          attributes: { onClick: () => console.log('Edit', record) },
        },
        secondaryActions: [
          {
            data: { value: 'View', record, index: 1 },
            attributes: { onClick: () => console.log('View', record) },
          },
          {
            data: { value: 'Delete', record, index: 2 },
            attributes: {
              onClick: () => console.log('Delete', record),
              danger: true,
            },
          },
        ],
      }),
    },
  },
  render: args => <ViewTableWrapper {...args} />,
};
