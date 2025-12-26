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
import { TableSettingPanel } from '../TableSettingPanel';
import {
  ViewColumn,
  ViewDefinition,
  TableStateContextProvider,
} from '../../../viewer';

const meta: Meta = {
  title: 'Viewer/Table/Setting/TableSettingPanel',
  component: TableSettingPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A panel component for managing table column settings. Allows users to toggle column visibility and reorder columns via drag and drop.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    viewDefinition: {
      control: 'object',
      description: 'View definition containing column definitions',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleViewDefinition: ViewDefinition = {
  name: 'Sample View',
  fields: [
    {
      label: 'ID',
      name: 'id',
      primaryKey: true,
      type: 'text',
      sorter: true,
    },
    {
      label: 'Name',
      name: 'name',
      primaryKey: false,
      type: 'text',
      sorter: true,
    },
    {
      label: 'Category',
      name: 'category',
      primaryKey: false,
      type: 'text',
      sorter: true,
    },
    {
      label: 'Price',
      name: 'price',
      primaryKey: false,
      type: 'number',
      sorter: true,
    },
    {
      label: 'Status',
      name: 'status',
      primaryKey: false,
      type: 'text',
      sorter: true,
    },
  ],
  availableFilters: [],
  dataUrl: '/api/sample',
  countUrl: '/api/sample/count',
};

const sampleColumns: ViewColumn[] = [
  {
    name: 'id',
    visible: true,
    fixed: true,
  },
  {
    name: 'name',
    visible: true,
    fixed: false,
  },
  {
    name: 'category',
    visible: true,
    fixed: false,
  },
  {
    name: 'price',
    visible: false,
    fixed: false,
  },
  {
    name: 'status',
    visible: false,
    fixed: false,
  },
];

const TableSettingPanelWrapper = (args: any) => {
  const [columns, setColumns] = useState(args.initialColumns || sampleColumns);

  const handleColumnsChange = (newColumns: ViewColumn[]) => {
    setColumns(newColumns);
  };

  return (
    <TableStateContextProvider
      columns={columns}
      tableSize="middle"
      updateColumns={handleColumnsChange}
      updateTableSize={() => {}}
      refreshData={() => {}}
    >
      <TableSettingPanel
        viewDefinition={args.viewDefinition || sampleViewDefinition}
        className={args.className}
      />
    </TableStateContextProvider>
  );
};

export const Basic: Story = {
  args: {
    viewDefinition: sampleViewDefinition,
    initialColumns: sampleColumns,
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const WithHiddenColumns: Story = {
  args: {
    viewDefinition: sampleViewDefinition,
    initialColumns: [
      ...sampleColumns.slice(0, 2),
      { ...sampleColumns[2], visible: false },
      { ...sampleColumns[3], visible: true },
      { ...sampleColumns[4], visible: false },
    ],
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const AllVisible: Story = {
  args: {
    viewDefinition: sampleViewDefinition,
    initialColumns: sampleColumns.map(col => ({ ...col, visible: true })),
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const FixedLimitReached: Story = {
  args: {
    viewDefinition: sampleViewDefinition,
    initialColumns: [
      { ...sampleColumns[0], fixed: true, visible: true },
      { ...sampleColumns[1], fixed: true, visible: true },
      { ...sampleColumns[2], fixed: true, visible: true },
      { ...sampleColumns[3], fixed: false, visible: true },
      { ...sampleColumns[4], fixed: false, visible: false },
    ],
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const MixedStates: Story = {
  args: {
    viewDefinition: sampleViewDefinition,
    initialColumns: [
      { ...sampleColumns[0], fixed: true, visible: true },
      { ...sampleColumns[1], fixed: false, visible: true },
      { ...sampleColumns[2], fixed: false, visible: true },
      { ...sampleColumns[3], fixed: false, visible: false },
      { ...sampleColumns[4], fixed: false, visible: false },
    ],
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};
