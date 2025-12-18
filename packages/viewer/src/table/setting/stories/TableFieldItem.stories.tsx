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
import { TableFieldItem } from '../TableFieldItem';
import { TEXT_CELL_TYPE } from '../../cell';
import { ViewColumnDefinition } from '../../../viewer';

const meta: Meta = {
  title: 'Viewer/Table/Setting/TableFieldItem',
  component: TableFieldItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A table field item component used in column settings. Displays a checkbox for column visibility and a drag handle for reordering.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    column: {
      control: 'object',
      description: 'Column definition with title and cell configuration',
    },
    fixed: {
      control: 'boolean',
      description: 'Whether the column is fixed and cannot be hidden',
    },
    index: {
      control: 'number',
      description: 'Index position of the column',
    },
    visible: {
      control: 'boolean',
      description: 'Whether the column is currently visible',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleColumn = {
  title: 'Product Name',
  dataIndex: 'name',
  cell: { type: TEXT_CELL_TYPE },
};

const primaryKeyColumn = {
  title: 'ID',
  dataIndex: 'id',
  primaryKey: true,
};

export const Visible: Story = {
  args: {
    column: sampleColumn,
    fixed: false,
    index: 0,
    visible: true,
    onVisibleChange: (column: ViewColumnDefinition, visible: boolean) => {
      console.log('Visible changed:', column.title, visible);
    },
  },
};

export const Hidden: Story = {
  args: {
    column: sampleColumn,
    fixed: false,
    index: 1,
    visible: false,
    onVisibleChange: (column: ViewColumnDefinition, visible: boolean) => {
      console.log('Visible changed:', column.title, visible);
    },
  },
};

export const PrimaryKey: Story = {
  args: {
    column: primaryKeyColumn,
    fixed: true,
    index: 0,
    visible: true,
    onVisibleChange: (column: ViewColumnDefinition, visible: boolean) => {
      console.log('Visible changed:', column.title, visible);
    },
  },
};

export const FixedColumn: Story = {
  args: {
    column: {
      ...sampleColumn,
      title: 'Fixed Column',
    },
    fixed: true,
    index: 2,
    visible: true,
    onVisibleChange: (column: ViewColumnDefinition, visible: boolean) => {
      console.log('Visible changed:', column.title, visible);
    },
  },
};
