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
        key: 'id',
        field: {
          name: 'id',
          label: 'ID',
          type: 'string',
        },
        component: 'id',
      },
      {
        key: 'name',
        field: {
          name: 'name',
          label: 'Name',
          type: 'string',
        },
        component: 'text',
      },
      {
        key: 'age',
        field: {
          name: 'age',
          label: 'Age',
          type: 'number',
        },
        component: 'number',
      },
      {
        key: 'email',
        field: {
          name: 'email',
          label: 'Email',
          type: 'string',
        },
        component: 'text',
      },
      {
        key: 'isActive',
        field: {
          name: 'isActive',
          label: 'Is Active',
          type: 'bool',
        },
        component: 'bool',
      },
    ],
  },
  {
    label: 'Advanced Filters',
    filters: [
      {
        key: 'status',
        field: {
          name: 'status',
          label: 'Status',
          type: 'string',
        },
        component: 'select',
      },
      {
        key: 'department',
        field: {
          name: 'department',
          label: 'Department',
          type: 'string',
        },
        component: 'text',
      },
      {
        key: 'createdAt',
        field: {
          name: 'createdAt',
          label: 'Created At',
          type: 'datetime',
        },
        component: 'datetime',
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
            key: 'createdAt',
            field: {
              name: 'createdAt',
              label: 'Created At',
              type: 'date',
            },
            component: 'date',
          },
          {
            key: 'updatedAt',
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

export const WithBoolFilter: Story = {
  args: {
    filters: [
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
    ],
    availableFilters: [
      {
        label: 'Boolean Filters',
        filters: [
          {
            key: 'isActive',
            field: {
              name: 'isActive',
              label: 'Is Active',
              type: 'bool',
            },
            component: 'bool',
          },
        ],
      },
    ],
  },
};

export const WithSelectFilter: Story = {
  args: {
    filters: [
      {
        key: 'status',
        type: 'select',
        field: {
          name: 'status',
          label: 'Status',
          type: 'string',
        },
        value: {
          style: {
            width: '100%',
          },
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
    ],
    availableFilters: [
      {
        label: 'Select Filters',
        filters: [
          {
            key: 'status',
            field: {
              name: 'status',
              label: 'Status',
              type: 'string',
            },
            component: 'select',
          },
        ],
      },
    ],
  },
};

export const WithDateTimeFilter: Story = {
  args: {
    filters: [
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
    availableFilters: [
      {
        label: 'DateTime Filters',
        filters: [
          {
            key: 'createdAt',
            field: {
              name: 'createdAt',
              label: 'Created At',
              type: 'datetime',
            },
            component: 'datetime',
          },
        ],
      },
    ],
  },
};

export const Comprehensive: Story = {
  args: {
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
          style: {
            width: '100%',
          },
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
          style: {
            width: '100%',
          },
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
    availableFilters: sampleAvailableFilters,
  },
};
