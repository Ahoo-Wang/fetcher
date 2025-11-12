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
import { Table } from 'antd';
import { AvatarCell } from '../AvatarCell';

interface User {
  id: number;
  name: string;
  avatar?: string;
  role: string;
}

// Sample data with placeholder images
const sampleUsers: User[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    avatar: 'https://picsum.photos/100/100?random=10',
    role: 'Admin',
  },
  {
    id: 2,
    name: 'Bob Smith',
    avatar: 'https://picsum.photos/100/100?random=11',
    role: 'User',
  },
  {
    id: 3,
    name: 'Carol Williams',
    avatar: 'https://picsum.photos/100/100?random=12',
    role: 'Moderator',
  },
  {
    id: 4,
    name: 'David Brown',
    role: 'User',
  },
  {
    id: 5,
    name: 'Eva Davis',
    avatar: 'https://picsum.photos/100/100?random=13',
    role: 'Editor',
  },
];

const meta: Meta<typeof AvatarCell> = {
  title: 'Viewer/Table/Cell/AvatarCell',
  component: AvatarCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An avatar cell component that renders user avatars in table cells using Ant Design Avatar component. Supports images, text initials, and all Avatar component features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description: 'Avatar props for customization (size, shape, style, etc.)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      value: 'https://picsum.photos/100/100?random=1',
      record: sampleUsers[0],
      index: 0,
    },
    attributes: {
      size: 40,
    },
  },
};

export const WithTable: Story = {
  render: () => (
    <Table
      dataSource={sampleUsers}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: 'Avatar',
          dataIndex: 'avatar',
          key: 'avatar',
          width: 80,
          render: (value, record, index) => (
            <AvatarCell
              data={{ value: value || record.name.charAt(0), record, index }}
              attributes={{
                size: 32,
              }}
            />
          ),
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Role',
          dataIndex: 'role',
          key: 'role',
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const DifferentSizes: Story = {
  render: () => (
    <Table
      dataSource={sampleUsers.slice(0, 4)}
      columns={[
        {
          title: 'Small (24px)',
          dataIndex: 'avatar',
          key: 'small',
          width: 80,
          render: (value, record, index) => (
            <AvatarCell
              data={{ value: value || record.name.charAt(0), record, index }}
              attributes={{
                size: 24,
              }}
            />
          ),
        },
        {
          title: 'Medium (32px)',
          dataIndex: 'avatar',
          key: 'medium',
          width: 80,
          render: (value, record, index) => (
            <AvatarCell
              data={{ value: value || record.name.charAt(0), record, index }}
              attributes={{
                size: 32,
              }}
            />
          ),
        },
        {
          title: 'Large (48px)',
          dataIndex: 'avatar',
          key: 'large',
          width: 80,
          render: (value, record, index) => (
            <AvatarCell
              data={{ value: value || record.name.charAt(0), record, index }}
              attributes={{
                size: 48,
              }}
            />
          ),
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
      ]}
      rowKey="id"
      pagination={false}
      showHeader={false}
    />
  ),
};

export const WithTextFallback: Story = {
  render: () => (
    <Table
      dataSource={[
        {
          id: 1,
          name: 'Alice Johnson',
          avatar: 'https://picsum.photos/100/100?random=10',
          role: 'Admin',
        },
        {
          id: 2,
          name: 'Bob Smith',
          role: 'User',
        },
        {
          id: 3,
          name: 'Carol Williams',
          avatar: 'https://picsum.photos/100/100?random=12',
          role: 'Moderator',
        },
        {
          id: 4,
          name: 'David Brown',
          role: 'User',
        },
      ]}
      columns={[
        {
          title: 'Avatar',
          dataIndex: 'avatar',
          key: 'avatar',
          width: 80,
          render: (value, record, index) => (
            <AvatarCell
              data={{
                value:
                  value ||
                  record.name
                    .split(' ')
                    .map(n => n[0])
                    .join(''),
                record,
                index,
              }}
              attributes={{
                size: 40,
                style: { backgroundColor: '#1890ff' },
              }}
            />
          ),
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Role',
          dataIndex: 'role',
          key: 'role',
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const CustomStyles: Story = {
  render: () => (
    <Table
      dataSource={sampleUsers.slice(0, 3)}
      columns={[
        {
          title: 'Default',
          dataIndex: 'avatar',
          key: 'default',
          width: 80,
          render: (value, record, index) => (
            <AvatarCell
              data={{ value: value || record.name.charAt(0), record, index }}
              attributes={{
                size: 32,
              }}
            />
          ),
        },
        {
          title: 'Square',
          dataIndex: 'avatar',
          key: 'square',
          width: 80,
          render: (value, record, index) => (
            <AvatarCell
              data={{ value: value || record.name.charAt(0), record, index }}
              attributes={{
                size: 32,
                shape: 'square',
              }}
            />
          ),
        },
        {
          title: 'Colored',
          dataIndex: 'avatar',
          key: 'colored',
          width: 80,
          render: (value, record, index) => (
            <AvatarCell
              data={{ value: value || record.name.charAt(0), record, index }}
              attributes={{
                size: 32,
                style: { backgroundColor: '#52c41a' },
              }}
            />
          ),
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
      ]}
      rowKey="id"
      pagination={false}
      showHeader={false}
    />
  ),
};

export const NullValues: Story = {
  args: {
    data: {
      value: null as any,
      record: sampleUsers[0],
      index: 0,
    },
    attributes: {
      size: 32,
    },
  },
};
