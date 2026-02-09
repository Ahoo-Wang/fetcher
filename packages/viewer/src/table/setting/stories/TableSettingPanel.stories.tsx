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
import { TableSettingPanel } from '../TableSettingPanel';
import {
  ActiveViewState,
  useActiveViewStateReducer,
  ViewColumn,
  ViewDefinition,
  ActiveViewStateContextProvider,
} from '../../../viewer';
import { all } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof TableSettingPanel> = {
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
    fields: {
      control: 'object',
      description: 'Field definitions for the columns',
    },
    initialColumns: {
      control: 'object',
      description: 'Column configurations including visibility and fixed state',
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
  id: 'sample',
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
    hidden: false,
    fixed: true,
  },
  {
    name: 'name',
    hidden: false,
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
    hidden: true,
    fixed: false,
  },
];

const activeViewState: ActiveViewState = {
  id: 'default-user',
  name: '全部用户',
  definitionId: 'sample',
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

interface TableSettingPanelWrapperProps {
  fields: ViewDefinition['fields'];
  viewColumns?: ViewColumn[];
  className?: string;
}

const TableSettingPanelWrapper = (args: TableSettingPanelWrapperProps) => {
  const columns = args.viewColumns || sampleColumns;
  const state: ActiveViewState = {
    ...activeViewState,
    columns,
    definitionId: 'sample',
  };

  const activeViewStateReturn = useActiveViewStateReducer(state);

  return (
    <ActiveViewStateContextProvider {...activeViewStateReturn}>
      <TableSettingPanel
        fields={args.fields}
        initialColumns={columns}
        className={args.className}
      />
    </ActiveViewStateContextProvider>
  );
};

export const Basic: Story = {
  args: {
    fields: sampleViewDefinition.fields,
    initialColumns: sampleColumns,
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const WithHiddenColumns: Story = {
  args: {
    fields: sampleViewDefinition.fields,
    initialColumns: [
      {
        name: 'id',
        hidden: false,
        fixed: true,
      },
      {
        name: 'name',
        hidden: false,
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
        hidden: true,
        fixed: false,
      },
    ],
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const AllVisible: Story = {
  args: {
    fields: sampleViewDefinition.fields,
    initialColumns: sampleColumns.map(col => ({ ...col, hidden: false })),
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const FixedLimitReached: Story = {
  args: {
    fields: sampleViewDefinition.fields,
    initialColumns: [
      { name: 'id', hidden: false, fixed: true },
      { name: 'name', hidden: false, fixed: true },
      { name: 'category', hidden: false, fixed: true },
      { name: 'price', hidden: false, fixed: false },
      { name: 'status', hidden: true, fixed: false },
    ],
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};

export const MixedStates: Story = {
  args: {
    fields: sampleViewDefinition.fields,
    initialColumns: [
      { name: 'id', hidden: false, fixed: true },
      { name: 'name', hidden: false, fixed: false },
      { name: 'category', hidden: false, fixed: false },
      { name: 'price', hidden: true, fixed: false },
      { name: 'status', hidden: true, fixed: false },
    ],
  },
  render: args => <TableSettingPanelWrapper {...args} />,
};
