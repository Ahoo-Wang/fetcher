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
import {
  EditableFilterPanel,
  EditableFilterPanelProps,
} from '../EditableFilterPanel';
import { Condition, Operator } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';
import { Card, Divider, Typography } from 'antd';
import { AvailableFilterGroup } from '../AvailableFilterSelect';

function EditableFilterPanelDemo(props: EditableFilterPanelProps) {
  const [condition, setCondition] = useState<Condition>();
  return (
    <Card>
      <EditableFilterPanel {...props} onSearch={setCondition} />
      <Divider></Divider>
      {condition && (
        <Typography.Text code copyable>
          {JSON.stringify(condition)}
        </Typography.Text>
      )}
    </Card>
  );
}

const meta: Meta<typeof EditableFilterPanelDemo> = {
  title: 'Viewer/Filters/Panel/EditableFilterPanel',
  component: EditableFilterPanelDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An editable panel component that allows users to dynamically add and remove filters from a list of available filters. It extends FilterPanel with filter management capabilities.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const sampleAvailableFilters: AvailableFilterGroup[] = [
  {
    label: 'Basic Filters',
    filters: [
      {
        field: {
          name: 'name',
          label: 'Name',
          type: 'string',
        },
        component: 'text',
      },
      {
        field: {
          name: 'age',
          label: 'Age',
          type: 'number',
        },
        component: 'number',
      },
      {
        field: {
          name: 'email',
          label: 'Email',
          type: 'string',
        },
        component: 'text',
      },
    ],
  },
  {
    label: 'Advanced Filters',
    filters: [
      {
        field: {
          name: 'status',
          label: 'Status',
          type: 'string',
        },
        component: 'text',
      },
      {
        field: {
          name: 'department',
          label: 'Department',
          type: 'string',
        },
        component: 'text',
      },
    ],
  },
];

export const Default: Story = {
  args: {
    filters: [],
    availableFilters: sampleAvailableFilters,
  },
};

export const WithInitialFilters: Story = {
  args: {
    filters: [
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
    ],
    availableFilters: sampleAvailableFilters,
  },
};

export const MultipleGroups: Story = {
  args: {
    filters: [],
    availableFilters: [
      ...sampleAvailableFilters,
      {
        label: 'Date Filters',
        filters: [
          {
            field: {
              name: 'createdAt',
              label: 'Created At',
              type: 'date',
            },
            component: 'date',
          },
          {
            field: {
              name: 'updatedAt',
              label: 'Updated At',
              type: 'date',
            },
            component: 'date',
          },
        ],
      },
    ],
  },
};
