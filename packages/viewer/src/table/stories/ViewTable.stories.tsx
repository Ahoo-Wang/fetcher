import { Meta, StoryObj } from '@storybook/react';
import { ViewTable } from '../ViewTable';
import {
  TableStateContext,
  TableStateContextProvider,
  ViewColumn,
  ViewDefinition,
} from '../../viewer';
import { useState } from 'react';
import { SizeType } from 'antd/es/config-provider/SizeContext';

// Mock data for demonstration
const mockData = [
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
];

// Mock view definition
const mockViewDefinition: ViewDefinition = {
  name: 'Users',
  fields: [
    { name: 'id', label: 'ID', primaryKey: true, type: 'number' },
    { name: 'name', label: 'Name', primaryKey: false, type: 'string' },
    { name: 'email', label: 'Email', primaryKey: false, type: 'string' },
    { name: 'role', label: 'Role', primaryKey: false, type: 'string' },
    { name: 'status', label: 'Status', primaryKey: false, type: 'string' },
    { name: 'lastLogin', label: 'Last Login', primaryKey: false, type: 'date' },
  ],
  availableFilters: [],
  dataUrl: 'https://example.com/api/users',
  countUrl: 'https://example.com/api/users/count',
  internalCondition: {},
};

const sampleColumns: ViewColumn[] = [
  {
    name: 'id',
    fixed: true,
    hidden: false,
  },
  {
    name: 'name',
    fixed: false,
    hidden: false,
  },
  {
    name: 'email',
    fixed: false,
    hidden: false,
  },
  {
    name: 'role',
    fixed: false,
    hidden: false,
  },
  {
    name: 'status',
    fixed: false,
    hidden: false,
  },
  {
    name: 'lastLogin',
    fixed: false,
    hidden: false,
  },
];

const ViewTableWrapper = (args: any) => {
  const [columns, setColumns] = useState(args.initialColumns || sampleColumns);
  const [tableSize, setTableSize] = useState<SizeType>('middle');
  const tableStateContext: TableStateContext = {
    columns: columns,
    tableSize: tableSize,
    updateColumns: newColumns => {
      setColumns(newColumns);
    },
    updateTableSize: value => {
      setTableSize(value);
    },
  };

  return (
    <TableStateContextProvider {...tableStateContext} refreshData={() => {}}>
      <ViewTable {...args}></ViewTable>
    </TableStateContextProvider>
  );
};

const meta: Meta = {
  title: 'Viewer/Table/ViewTable',
  component: ViewTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],

  render: args => <ViewTableWrapper {...args} />,
};

export default meta;

// Default story - basic usage
export const Default: StoryObj = {
  args: {
    viewDefinition: mockViewDefinition,
    dataSource: mockData,
    actionColumn: {
      title: 'Actions',
      configurable: true,
      configurePanelTitle: 'Table Settings',
      actions: (record: any) => ({
        primaryAction: {
          data: { value: 'Edit', record, index: 0 },
          attributes: { onClick: () => console.log('Edit', record) },
        },
        moreActionTitle: '更多',
        secondaryActions: [
          {
            data: { value: 'Delete', record, index: 1 },
            attributes: { onClick: () => console.log('Delete', record) },
          },
        ],
      }),
    },
    enableBatchOperation: false,
    onSortChanged: undefined,
    onSelectChange: undefined,
    onClickPrimaryKey: (value: any, record: any) =>
      console.log('Clicked primary key:', value, record),
  },
};

// With batch operations enabled
export const BatchOperations: StoryObj = {
  args: {
    viewDefinition: mockViewDefinition,
    dataSource: mockData,
    actionColumn: {
      title: 'Actions',
      configurable: true,
      configurePanelTitle: 'Table Settings',
      actions: (record: any) => ({
        primaryAction: {
          data: { value: 'Edit', record, index: 0 },
          attributes: { onClick: () => console.log('Edit', record) },
        },
        moreActionTitle: '更多',
        secondaryActions: [
          {
            data: { value: 'Delete', record, index: 1 },
            attributes: { onClick: () => console.log('Delete', record) },
          },
        ],
      }),
    },
    enableBatchOperation: true,
    onSelectChange: (selectedRows: any) =>
      console.log('Selected rows:', selectedRows),
    onClickPrimaryKey: (value: any, record: any) =>
      console.log('Clicked primary key:', value, record),
  },
};

// With sorting
export const Sorting: StoryObj = {
  args: {
    viewDefinition: {
      ...mockViewDefinition,
      fields: [
        {
          name: 'id',
          label: 'ID',
          primaryKey: true,
          type: 'number',
          sorter: true,
        },
        { name: 'name', label: 'Name', type: 'string', sorter: true },
        { name: 'email', label: 'Email', type: 'string' },
        { name: 'role', label: 'Role', type: 'string' },
        { name: 'status', label: 'Status', type: 'string' },
        { name: 'lastLogin', label: 'Last Login', type: 'date', sorter: true },
      ],
    },
    dataSource: mockData,
    actionColumn: {
      title: 'Actions',
      configurable: true,
      configurePanelTitle: 'Table Settings',
      actions: (record: any) => ({
        primaryAction: {
          data: { value: 'Edit', record, index: 0 },
          attributes: { onClick: () => console.log('Edit', record) },
        },
        moreActionTitle: '更多',
        secondaryActions: [
          {
            data: { value: 'Delete', record, index: 1 },
            attributes: { onClick: () => console.log('Delete', record) },
          },
        ],
      }),
    },
    enableBatchOperation: false,
    onSortChanged: (sorter: any) => console.log('Sort changed:', sorter),
    onClickPrimaryKey: (value: any, record: any) =>
      console.log('Clicked primary key:', value, record),
  },
};

// With custom renderers
export const CustomRenderers: StoryObj = {
  args: {
    viewDefinition: {
      ...mockViewDefinition,
      fields: [
        { name: 'id', label: 'ID', primaryKey: true, type: 'number' },
        { name: 'name', label: 'Name', type: 'string' },
        { name: 'email', label: 'Email', type: 'string' },
        { name: 'role', label: 'Role', type: 'string' },
        {
          name: 'status',
          label: 'Status',
          type: 'string',
          render: (value: any) => (
            <span style={{ color: value === 'Active' ? 'green' : 'red' }}>
              {value}
            </span>
          ),
        },
        {
          name: 'lastLogin',
          label: 'Last Login',
          type: 'date',
          render: (value: any) => (
            <span>{new Date(value).toLocaleDateString()}</span>
          ),
        },
      ],
    },
    dataSource: mockData,
    actionColumn: {
      title: 'Actions',
      configurable: true,
      configurePanelTitle: 'Table Settings',
      actions: (record: any) => ({
        primaryAction: {
          data: { value: 'Edit', record, index: 0 },
          attributes: { onClick: () => console.log('Edit', record) },
        },
        moreActionTitle: '更多',
        secondaryActions: [
          {
            data: { value: 'Delete', record, index: 1 },
            attributes: { onClick: () => console.log('Delete', record) },
          },
        ],
      }),
    },
    enableBatchOperation: false,
    onClickPrimaryKey: (value: any, record: any) =>
      console.log('Clicked primary key:', value, record),
  },
};
