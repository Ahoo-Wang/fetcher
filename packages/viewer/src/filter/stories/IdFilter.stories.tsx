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
import { IdFilter } from '../IdFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof IdFilter> = {
  title: 'Viewer/Filters/IdFilter',
  component: IdFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An ID filter component that supports filtering by single ID or multiple IDs. Uses different input components based on the selected operator.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleId: Story = {
  args: {
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
      defaultValue: 'user123',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <IdFilter {...args} onChange={setValue} />;
  },
};

export const MultipleIds: Story = {
  args: {
    field: {
      name: 'userIds',
      label: 'User IDs',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.IDS,
      options: [],
    },
    value: {
      defaultValue: ['user1', 'user2', 'user3'],
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <IdFilter {...args} onChange={setValue} />;
  },
};

export const SingleIdWithPlaceholder: Story = {
  args: {
    field: {
      name: 'productId',
      label: 'Product ID',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.ID,
      options: [],
    },
    value: {
      defaultValue: '',
      placeholder: 'Enter product ID...',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <IdFilter {...args} onChange={setValue} />;
  },
};

export const MultipleIdsWithDefaults: Story = {
  args: {
    field: {
      name: 'categoryIds',
      label: 'Category IDs',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.IDS,
      options: [],
    },
    value: {
      defaultValue: ['cat1', 'cat2', 'cat3', 'cat4'],
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <IdFilter {...args} onChange={setValue} />;
  },
};

export const EmptyMultipleIds: Story = {
  args: {
    field: {
      name: 'selectedIds',
      label: 'Selected IDs',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.IDS,
      options: [],
    },
    value: {
      defaultValue: [],
      placeholder: 'Select multiple IDs...',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <IdFilter {...args} onChange={setValue} />;
  },
};

export const WithChangeHandler: Story = {
  args: {
    field: {
      name: 'itemId',
      label: 'Item ID',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.ID,
      options: [],
    },
    value: {
      defaultValue: '',
    },
  },
  render: args => {
    const [value, setValue] = useState<any>();
    return (
      <div>
        <IdFilter {...args} onChange={setValue} />
        <p style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
          Current filter: {JSON.stringify(value, null, 2)}
        </p>
      </div>
    );
  },
};

export const MultipleWithChangeHandler: Story = {
  args: {
    field: {
      name: 'groupIds',
      label: 'Group IDs',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.IDS,
      options: [],
    },
    value: {
      defaultValue: [],
    },
  },
  render: args => {
    const [value, setValue] = useState<any>();
    return (
      <div>
        <IdFilter {...args} onChange={setValue} />
        <p style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
          Selected IDs: {value ? JSON.stringify(value, null, 2) : 'None'}
        </p>
        <p style={{ fontSize: '12px', color: '#999' }}>
          Try typing: group1, group2; group3
        </p>
      </div>
    );
  },
};
