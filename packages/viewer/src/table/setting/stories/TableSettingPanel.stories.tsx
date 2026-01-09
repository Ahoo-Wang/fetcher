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
  ActiveViewState,
  useActiveViewStateReducer,
  ViewColumn,
  ViewDefinition,
  ActiveViewStateContext,
  ActiveViewStateContextProvider,
} from '../../../viewer';
import { all } from '@ahoo-wang/fetcher-wow';

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
  id:'sample',
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
    hidden: true,
    fixed: true,
  },
  {
    name: 'name',
    hidden: true,
    fixed: false,
  },
  {
    name: 'category',
    hidden: true,
    fixed: false,
  },
  {
    name: 'price',
    hidden: false,
    fixed: false,
  },
  {
    name: 'status',
    hidden: false,
    fixed: false,
  },
];

const activeViewState: ActiveViewState = {
  id: 'default-user',
  name: '全部用户',
  definitionId: 'use',
  type: 'SHARED',
  source: 'SYSTEM',
  isDefault: true,
  filters: [],
  columns: sampleColumns,
  tableSize: 'middle',
  pageSize: 10,
  sort: 1,
  pagedQuery: {
    condition: all(),
  },
};

const TableSettingPanelWrapper = (args: any) => {
  const activeViewStateReturn = useActiveViewStateReducer(activeViewState);

  const activeViewStateContext: ActiveViewStateContext = {
    ...activeViewStateReturn,
  };

  return (
    <ActiveViewStateContextProvider {...activeViewStateContext}>
      <TableSettingPanel
        viewDefinition={args.viewDefinition || sampleViewDefinition}
        className={args.className}
      />
    </ActiveViewStateContextProvider>
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
