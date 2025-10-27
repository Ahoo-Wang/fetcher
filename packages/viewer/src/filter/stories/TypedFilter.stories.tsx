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

function TypedFilterDemo(props: TypedFilterProps) {
  const [filterValue, setFilterValue] = useState<FilterValue | undefined>();
  return (
    <Card>
      <TypedFilter
        {...props}
        onChange={setFilterValue}
      />
      <Divider>Condition</Divider>
      {filterValue?.condition && <Typography.Text code copyable>
        {JSON.stringify(filterValue.condition)}
      </Typography.Text>}
    </Card>
  );
}

const meta: Meta<typeof TypedFilterDemo> = {
  title: 'Viewer/Filters/TypedFilter',
  component: TypedFilterDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A dynamic filter component that selects the appropriate filter based on the type prop. It uses the filter registry to find the correct filter component for the specified type.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

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
      options: [],
    },
    value: {
      defaultValue: '',
    },
  }
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
      options: [],
    },
    value: {
      defaultValue: 25,
    },
  }
};

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
      options: [],
    },
    value: {
      defaultValue: '',
    },
  }
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
      options: [],
    },
    value: {
      defaultValue: '',
    },
  }
};
