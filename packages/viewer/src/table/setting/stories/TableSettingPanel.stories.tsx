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
import { ViewColumn, FieldDefinition } from '../../../';

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
    onChange: {
      action: 'columns changed',
      description: 'Callback when columns change',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleFields: FieldDefinition[] = [
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
];

const sampleColumns: ViewColumn[] = [
  { key: 'id', name: 'id', fixed: true, hidden: false },
  { key: 'name', name: 'name', fixed: false, hidden: false },
  { key: 'category', name: 'category', fixed: false, hidden: true },
  { key: 'price', name: 'price', fixed: false, hidden: false },
  { key: 'status', name: 'status', fixed: false, hidden: true },
];

export const Basic: Story = {
  args: {
    fields: sampleFields,
    initialColumns: sampleColumns,
  },
};

export const WithHiddenColumns: Story = {
  args: {
    fields: sampleFields,
    initialColumns: sampleColumns,
  },
};

export const AllVisible: Story = {
  args: {
    fields: sampleFields,
    initialColumns: sampleColumns.map(col => ({ ...col, hidden: false })),
  },
};

export const FixedLimitReached: Story = {
  args: {
    fields: sampleFields,
    initialColumns: [
      { key: 'id', name: 'id', fixed: true, hidden: false },
      { key: 'name', name: 'name', fixed: true, hidden: false },
      { key: 'category', name: 'category', fixed: true, hidden: false },
      { key: 'price', name: 'price', fixed: false, hidden: false },
      { key: 'status', name: 'status', fixed: false, hidden: true },
    ],
  },
};

export const MixedStates: Story = {
  args: {
    fields: sampleFields,
    initialColumns: [
      { key: 'id', name: 'id', fixed: true, hidden: false },
      { key: 'name', name: 'name', fixed: false, hidden: false },
      { key: 'category', name: 'category', fixed: false, hidden: false },
      { key: 'price', name: 'price', fixed: false, hidden: true },
      { key: 'status', name: 'status', fixed: false, hidden: true },
    ],
  },
};

export const WithCallback: Story = {
  args: {
    fields: sampleFields,
    initialColumns: sampleColumns,
    onChange: columns => {
      console.log('Columns changed:', columns);
    },
  },
};
