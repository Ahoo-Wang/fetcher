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
import { DefaultRemoteSelectValueType, RemoteSelect, RemoteSelectOption } from '../RemoteSelect';
import { fetcher } from '@ahoo-wang/fetcher';
import { Card, Divider, Typography } from 'antd';

// Real API functions using JSONPlaceholder
const fetchPosts = async (
  searchQuery: string,
): Promise<RemoteSelectOption[]> => {
  const response = await fetcher.get('https://jsonplaceholder.typicode.com/posts', {
    urlParams: {
      query: { userId: searchQuery },
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  const posts = await response.json();

  // Transform posts to RemoteSelectOption format
  return posts.map((post: any) => ({
    label: post.title,
    value: post.id,
  }));
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
    const [value, setValue] = useState<DefaultRemoteSelectValueType>();
    return (
      <Card>
        <RemoteSelect
          placeholder="Search for posts..."
          value={value}
          search={fetchPosts}
          onChange={setValue}
        />
        <Divider></Divider>
        {value && <Typography.Text code copyable>
          {value}
        </Typography.Text>}
      </Card>

    );
  },
};