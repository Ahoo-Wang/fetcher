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
import { RemoteSelect } from '../RemoteSelect';
import { fetcher } from '@ahoo-wang/fetcher';
import { Card, Divider, Typography } from 'antd';
import { DefaultOptionType } from 'antd/lib/select';

// Real API functions using JSONPlaceholder
const fetchPosts = async (
  searchQuery: string,
): Promise<any[]> => {
  const response = await fetcher.get('https://jsonplaceholder.typicode.com/posts', {
    urlParams: {
      query: { userId: searchQuery },
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return await response.json();

};

const meta: Meta<typeof RemoteSelect> = {
  title: 'Viewer/Components/RemoteSelect',
  component: RemoteSelect,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A remote select component that loads options from an API with debounced search. Supports loading states, error handling, and customizable debounce configuration.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    debounce: {
      description: 'Debounce configuration for search requests',
      control: { type: 'object' },
    },
    placeholder: {
      description: 'Placeholder text for the select input',
      control: { type: 'text' },
    },
    style: {
      description: 'Custom styles for the component',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<any>();
    const [option, setOption] = useState<any>();
    return (
      <Card>
        <RemoteSelect
          placeholder="Search for posts..."
          search={fetchPosts}
          onChange={(value, option) => {
            setValue(value);
            setOption(option);
          }}
          fieldNames={{ label: 'title', value: 'id' }}
          defaultValue={['defaultValue']}
          options={[{ title: 'defaultLabel', id: 'defaultValue' }]}
          style={{ width: '100%' }}
          mode={'multiple'}
        />
        <Divider>Value</Divider>
        {value && <Typography.Text code copyable>
          {JSON.stringify(value)}
        </Typography.Text>}
        <Divider>Option</Divider>
        {option && <Typography.Text code copyable>
          {JSON.stringify(option)}
        </Typography.Text>}
      </Card>

    );
  },
};