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
import { TEXT_CELL_TYPE, TAG_CELL_TYPE, CURRENCY_CELL_TYPE } from '../../cell';
import { ViewColumn } from '../../types';

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
    columns: {
      control: 'object',
      description: 'Array of columns with visibility and fixed state',
    },
    onColumnsChange: {
      action: 'columnsChanged',
      description:
        'Callback fired when columns are reordered or visibility changes',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleColumns: (ViewColumn & { index: number })[] = [
  {
    columnDefinition: {
      title: 'ID',
      dataIndex: 'id',
      cell: { type: TEXT_CELL_TYPE },
      primaryKey: true,
    },
    visible: true,
    fixed: true,
    index: 0,
  },
  {
    columnDefinition: {
      title: 'Product Name',
      dataIndex: 'name',
      cell: { type: TEXT_CELL_TYPE },
      primaryKey: false,
    },
    visible: true,
    fixed: false,
    index: 1,
  },
  {
    columnDefinition: {
      title: 'Category',
      dataIndex: 'category',
      cell: { type: TAG_CELL_TYPE },
      primaryKey: false,
    },
    visible: true,
    fixed: false,
    index: 2,
  },
  {
    columnDefinition: {
      title: 'Price',
      dataIndex: 'price',
      cell: { type: CURRENCY_CELL_TYPE },
      primaryKey: false,
    },
    visible: false,
    fixed: false,
    index: 3,
  },
  {
    columnDefinition: {
      title: 'Status',
      dataIndex: 'status',
      cell: { type: TAG_CELL_TYPE },
      primaryKey: false,
    },
    visible: false,
    fixed: false,
    index: 4,
  },
];

const TableSettingPanelWrapper = (args: any) => {
  const [columns, setColumns] = useState(args.columns);

  const handleColumnsChange = (newColumns: ViewColumn[]) => {
    setColumns(newColumns);
    args.onColumnsChange(newColumns);
  };

  return (
    <TableSettingPanel
      {...args}
      columns={columns}
      onColumnsChange={handleColumnsChange}
    />
  );
};

export const Basic: Story = {
  args: {
    columns: sampleColumns,
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const WithHiddenColumns: Story = {
  args: {
    columns: [
      ...sampleColumns.slice(0, 2),
      { ...sampleColumns[2], visible: false },
      { ...sampleColumns[3], visible: true },
      { ...sampleColumns[4], visible: false },
    ]
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const AllVisible: Story = {
  args: {
    columns: sampleColumns.map(col => ({ ...col, visible: true })),
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const FixedLimitReached: Story = {
  args: {
    columns: [
      { ...sampleColumns[0], fixed: true, visible: true, index: 0 },
      { ...sampleColumns[1], fixed: true, visible: true, index: 1 },
      { ...sampleColumns[2], fixed: true, visible: true, index: 2 },
      { ...sampleColumns[3], fixed: false, visible: true, index: 3 },
      { ...sampleColumns[4], fixed: false, visible: false, index: 4 },
    ],
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const MixedStates: Story = {
  args: {
    columns: [
      { ...sampleColumns[0], fixed: true, visible: true, index: 0 },
      { ...sampleColumns[1], fixed: false, visible: true, index: 1 },
      { ...sampleColumns[2], fixed: false, visible: true, index: 2 },
      { ...sampleColumns[3], fixed: false, visible: false, index: 3 },
      { ...sampleColumns[4], fixed: false, visible: false, index: 4 },
    ],
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};
