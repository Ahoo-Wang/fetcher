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
import { Viewer } from '../Viewer';
import {
  ViewState,
  ViewDefinition,
  ViewColumn,
  FieldDefinition,
} from '../types';
import { ViewType, ViewSource } from '../types';
import { AvailableFilterGroup } from '../../filter';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { PagedList } from '@ahoo-wang/fetcher-wow';
import { Condition } from '@ahoo-wang/fetcher-wow';
import type { SorterResult } from 'antd/es/table/interface';
import type { PaginationProps } from 'antd';

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

const defaultView: ViewState = {
  id: 'default-view',
  name: 'Default View',
  definitionId: 'user-view',
  type: 'PERSONAL' as ViewType,
  source: 'SYSTEM' as ViewSource,
  isDefault: true,
  filters: [],
  columns: defaultColumns,
  tableSize: 'middle' as SizeType,
  pageSize: 10,
  condition: {} as Condition,
  internalCondition: {} as Condition,
};

const views: ViewState[] = [
  defaultView,
  {
    id: 'custom-view',
    name: 'My Custom View',
    definitionId: 'user-view',
    type: 'PERSONAL' as ViewType,
    source: 'CUSTOM' as ViewSource,
    isDefault: false,
    filters: [],
    columns: defaultColumns,
    tableSize: 'middle' as SizeType,
    pageSize: 20,
    condition: {} as Condition,
    internalCondition: {} as Condition,
  },
  {
    id: 'all-users',
    name: 'All Users',
    definitionId: 'user-view',
    type: 'SHARED' as ViewType,
    source: 'SYSTEM' as ViewSource,
    isDefault: false,
    filters: [],
    columns: defaultColumns,
    tableSize: 'middle' as SizeType,
    pageSize: 20,
    condition: {} as Condition,
    internalCondition: {} as Condition,
  },
];

const viewDefinition: ViewDefinition = {
  id: 'user-view',
  name: 'User Management',
  fields,
  availableFilters,
  dataUrl: '/api/users',
  countUrl: '/api/users/count',
};

const meta: Meta<typeof Viewer> = {
  title: 'Viewer',
  component: Viewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive viewer component that manages and renders views. Provides view switching, data display, filtering, and view management capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultViews: {
      control: 'object',
      description: 'List of available views',
    },
    defaultView: {
      control: 'object',
      description: 'Default view to display',
    },
    definition: {
      control: 'object',
      description: 'View definition including fields and filters',
    },
    dataSource: {
      control: 'object',
      description: 'Paged data source',
    },
    pagination: {
      control: 'object',
      description: 'Pagination configuration',
    },
    enableRowSelection: {
      control: 'boolean',
      description: 'Whether to enable row selection',
    },
    actionColumn: {
      control: 'object',
      description: 'Action column configuration for row operations',
    },
    viewTableSetting: {
      control: 'object',
      description: 'Table settings panel configuration',
    },
    primaryAction: {
      control: 'object',
      description: 'Primary action button in top bar',
    },
    secondaryActions: {
      control: 'object',
      description: 'Secondary action buttons in top bar',
    },
    batchActions: {
      control: 'object',
      description: 'Batch actions configuration for selected rows',
    },
    onCreateView: {
      action: 'create view',
      description: 'Callback fired when creating a new view',
    },
    onUpdateView: {
      action: 'update view',
      description: 'Callback fired when updating an existing view',
    },
    onDeleteView: {
      action: 'delete view',
      description: 'Callback fired when deleting a view',
    },
    onClickPrimaryKey: {
      action: 'primary key clicked',
      description: 'Callback fired when primary key cell is clicked',
    },
    onLoadData: {
      action: 'load data',
      description:
        'Callback fired when view state changes (filter, pagination, sort)',
    },
    onSwitchView: {
      action: 'view changed',
      description: 'Callback fired when user switches view',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ViewerWrapper = (args: any) => {
  const handleLoadData = (
    condition: Condition,
    index: number,
    size: number,
    sorter?: SorterResult<User>[],
  ) => {
    console.log('Load data:', { condition, index, size, sorter });
  };

  const handleViewChange = (view: ViewState) => {
    console.log('View changed:', view);
  };

  const handleCreateView = (
    view: ViewState,
    onSuccess?: (newView: ViewState) => void,
  ) => {
    console.log('Create view:', view);
    onSuccess?.({ ...view, id: `view-${Date.now()}` });
  };

  const handleUpdateView = (
    view: ViewState,
    onSuccess?: (newView: ViewState) => void,
  ) => {
    console.log('Update view:', view);
    onSuccess?.(view);
  };

  const handleDeleteView = (view: ViewState, onSuccess?: () => void) => {
    console.log('Delete view:', view);
    onSuccess?.();
  };

  return (
    <Viewer<User>
      {...args}
      onLoadData={handleLoadData}
      onSwitchView={handleViewChange}
      onCreateView={handleCreateView}
      onUpdateView={handleUpdateView}
      onDeleteView={handleDeleteView}
    />
  );
};

export const Basic: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: false,
    viewTableSetting: false,
    batchActions: {
      enabled: false,
      title: 'Batch Actions',
      actions: [],
    },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithRowSelection: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: true,
    viewTableSetting: false,
    batchActions: { enabled: false, title: 'Batch Actions', actions: [] },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithBatchActions: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: true,
    viewTableSetting: false,
    batchActions: {
      enabled: true,
      title: 'Batch Actions',
      actions: [
        {
          title: 'Delete',
          attributes: { danger: true },
          onClick: items => console.log('Batch delete:', items),
        },
        {
          title: 'Export',
          onClick: items => console.log('Batch export:', items),
        },
      ],
    },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithTableSettings: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: false,
    viewTableSetting: { title: 'Column Settings' },
    batchActions: { enabled: false, title: 'Batch Actions', actions: [] },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithActionColumn: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: true,
    viewTableSetting: { title: 'Column Settings' },
    batchActions: { enabled: false, title: 'Batch Actions', actions: [] },
    actionColumn: {
      title: 'Actions',
      actions: (record) => ({
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
    onClickPrimaryKey: (id, record) =>
      console.log('Click primary key:', id, record),
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithPrimaryAction: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: false,
    viewTableSetting: false,
    batchActions: { enabled: false, title: 'Batch Actions', actions: [] },
    primaryAction: {
      title: 'Create User',
      onClick: (items) => console.log('Create user'),
    },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithSecondaryActions: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: false,
    viewTableSetting: false,
    batchActions: { enabled: false, title: 'Batch Actions', actions: [] },
    primaryAction: {
      title: 'Create User',
      onClick: (items) => console.log('Create user'),
    },
    secondaryActions: [
      {
        title: 'Export',
        onClick: (items) => console.log('Export', items),
      },
      {
        title: 'Import',
        onClick: (items) => console.log('Import'),
      },
    ],
  },
  render: args => <ViewerWrapper {...args} />,
};

export const SmallTableSize: Story = {
  args: {
    defaultViews: views.map(v => ({ ...v, tableSize: 'small' as SizeType })),
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: false,
    viewTableSetting: false,
    batchActions: { enabled: false, title: 'Batch Actions', actions: [] },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const LargeTableSize: Story = {
  args: {
    defaultViews: views.map(v => ({ ...v, tableSize: 'large' as SizeType })),
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: false,
    viewTableSetting: false,
    batchActions: { enabled: false, title: 'Batch Actions', actions: [] },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithoutPagination: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: false,
    enableRowSelection: false,
    viewTableSetting: false,
    batchActions: { enabled: false, title: 'Batch Actions', actions: [] },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithAllActions: Story = {
  args: {
    defaultViews: views,
    defaultView: views[0],
    definition: viewDefinition,
    dataSource: mockPagedData,
    pagination: {} as PaginationProps,
    enableRowSelection: true,
    viewTableSetting: { title: 'Column Settings' },
    batchActions: {
      enabled: true,
      title: 'Batch',
      actions: [
        {
          title: 'Delete',
          attributes: { danger: true },
          onClick: (items) => console.log('Delete', items),
        },
      ],
    },
    primaryAction: {
      title: 'Create',
      onClick: (items) => console.log('Create'),
    },
    secondaryActions: [
      {
        title: 'Export',
        onClick: (items) => console.log('Export', items),
      },
    ],
    actionColumn: {
      title: 'Actions',
      actions: (record) => ({
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
    onClickPrimaryKey: (id, record) =>
      console.log('Click primary key:', id, record),
  },
  render: args => <ViewerWrapper {...args} />,
};
