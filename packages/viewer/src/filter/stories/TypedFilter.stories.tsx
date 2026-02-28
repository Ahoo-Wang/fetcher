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
import { TypedFilter, TypedFilterProps } from '../TypedFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { Card, Divider, Typography } from 'antd';
import { FilterValue } from '../types';
import { DATE_TIME_FILTER_NAME } from '../DateTimeFilter';
import { filterRegistry } from '../filterRegistry';

function TypedFilterStory(props: TypedFilterProps) {
  const [filterValue, setFilterValue] = useState<FilterValue>();
  return (
    <Card>
      <TypedFilter {...props} onChange={setFilterValue} />
      <Divider>Condition</Divider>
      {filterValue?.condition && (
        <Typography.Text code copyable>
          {JSON.stringify(filterValue.condition)}
        </Typography.Text>
      )}
    </Card>
  );
}

const meta: Meta<typeof TypedFilterStory> = {
  title: 'Viewer/Filters/TypedFilter',
  component: TypedFilterStory,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A dynamic filter component that selects the appropriate filter based on the type prop. It uses the filter registry to find the correct filter component for the specified type.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      options: [...Array.from(filterRegistry.types), 'unsupported'],
      control: 'select',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const IdFilter: Story = {
  args: {
    type: 'id',
    field: {
      name: 'userId',
      label: 'User ID',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.ID,
    },
    value: {
      defaultValue: '',
    },
    label: {
      style: {
        width: 200,
      },
    },
  },
};

export const TextFilter: Story = {
  args: {
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
      defaultValue: '',
    },
  },
};

export const NumberFilter: Story = {
  args: {
    type: 'number',
    field: {
      name: 'age',
      label: 'Age',
      type: 'number',
    },
    operator: {
      defaultValue: Operator.EQ,
    },
    value: {
      defaultValue: 25,
    },
  },
};

export const SelectFilter: Story = {
  args: {
    type: 'select',
    field: {
      name: 'status',
      label: 'Status',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.IN,
    },
    value: {
      defaultValue: ['active', 'pending'],
      options: [
        { label: 'Technology', value: 'tech' },
        { label: 'Design', value: 'design' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Sales', value: 'sales' },
        { label: 'HR', value: 'hr' },
      ],
    },
  },
};

export const BoolFilter: Story = {
  args: {
    type: 'bool',
    field: {
      name: 'status',
      label: 'Status',
      type: 'string',
    },
  },
};

export const DateTimeFilter: Story = {
  args: {
    type: DATE_TIME_FILTER_NAME,
    field: {
      name: 'createTime',
      label: 'Create Time',
      type: 'string',
    },
  },
};

export const UnsupportedType: Story = {
  args: {
    type: 'unsupported',
    field: {
      name: 'unknown',
      label: 'Unknown Field',
      type: 'unknown',
    },
    operator: {
      defaultValue: Operator.EQ,
    },
    value: {
      defaultValue: '',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <TypedFilter {...args} onChange={setValue} />;
  },
};
