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
import { FilterPanel, FilterPanelProps } from '../FilterPanel';
import { Condition, Operator } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';
import { Button, Card, Divider, Typography } from 'antd';

const defaultFilterPanelProps: FilterPanelProps = {
  filters: [
    {
      key: 'id',
      type: 'id',
      field: {
        name: 'id',
        label: 'Id',
        type: 'string',
      },
      operator: {
        defaultValue: Operator.ID,
      },
      value: {
        defaultValue: 'id',
      },
    },
    {
      key: 'name',
      type: 'text',
      field: {
        name: 'name',
        label: 'Name',
        type: 'string',
      },
      operator: {
        defaultValue: Operator.EQ,
      },
      value: {
        defaultValue: 'test',
      },
    },
    {
      key: 'age',
      type: 'number',
      field: {
        name: 'age',
        label: 'Age',
        type: 'number',
      },
      operator: {
        defaultValue: Operator.GT,
      },
      value: {
        defaultValue: 18,
      },
    },
    {
      key: 'isActive',
      type: 'bool',
      field: {
        name: 'isActive',
        label: 'Is Active',
        type: 'bool',
      },
      operator: {
        style: {
          width: '100%',
        },
      },
    },
    {
      key: 'status',
      type: 'select',
      field: {
        name: 'status',
        label: 'Status',
        type: 'string',
      },
      value: {
        options: [
          {
            label: 'Active',
            value: 'active',
          },
          {
            label: 'Inactive',
            value: 'inactive',
          },
        ],
      },
    },
    {
      key: 'createdAt',
      type: 'datetime',
      field: {
        name: 'createdAt',
        label: 'Created At',
        type: 'datetime',
      },
      operator: {
        defaultValue: Operator.TODAY,
      },
    },
  ],
  actions: <Button>Add Filter</Button>,
  searchButton: { children: 'Search' },
  resetButton: { children: 'Reset' },
};

function FilterPanelDemo(props: FilterPanelProps) {
  const [condition, setCondition] = useState<Condition>();
  return (
    <Card>
      <FilterPanel {...props} onSearch={setCondition} />
      <Divider></Divider>
      {condition && (
        <Typography.Text code copyable>
          {JSON.stringify(condition)}
        </Typography.Text>
      )}
    </Card>
  );
}

const meta: Meta<typeof FilterPanelDemo> = {
  title: 'Viewer/Filters/Panel/FilterPanel',
  component: FilterPanelDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A panel component that renders multiple filters in a grid layout with a search button. It combines individual filters into a single search condition.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ...defaultFilterPanelProps,
  },
};
