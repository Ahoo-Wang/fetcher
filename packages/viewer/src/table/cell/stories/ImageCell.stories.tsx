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
import { ImageCell } from '../ImageCell';

interface Product {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
}

interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
}

// Sample data with placeholder images
const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    imageUrl: 'https://picsum.photos/200/200?random=1',
    price: 199.99,
  },
  {
    id: 2,
    name: 'Smart Watch',
    imageUrl: 'https://picsum.photos/200/200?random=2',
    price: 299.99,
  },
  {
    id: 3,
    name: 'Laptop Computer',
    imageUrl: 'https://picsum.photos/200/200?random=3',
    price: 1299.99,
  },
  {
    id: 4,
    name: 'Gaming Mouse',
    imageUrl: 'https://picsum.photos/200/200?random=4',
    price: 79.99,
  },
  {
    id: 5,
    name: 'Mechanical Keyboard',
    imageUrl: 'https://picsum.photos/200/200?random=5',
    price: 149.99,
  },
];

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
];

const meta: Meta<typeof ImageCell> = {
  title: 'Viewer/Table/Cell/ImageCell',
  component: ImageCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An image cell component that renders image URLs in table cells using Ant Design Image component. Supports preview, fallback images, and all Image component features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description:
        'Image props for customization (width, height, preview, fallback, etc.)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      value: 'https://picsum.photos/200/200?random=1',
      record: sampleProducts[0],
      index: 0,
    },
    attributes: {
      width: 80,
      height: 80,
    },
  },
};

export const WithTable: Story = {
  render: () => (
    <Table
      dataSource={sampleProducts}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: 'Image',
          dataIndex: 'imageUrl',
          key: 'image',
          width: 100,
          render: (value, record, index) => (
            <ImageCell
              data={{ value, record, index }}
              attributes={{
                width: 60,
                height: 60,
                style: { objectFit: 'cover' },
              }}
            />
          ),
        },
        {
          title: 'Product Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Price',
          dataIndex: 'price',
          key: 'price',
          render: value => `$${value}`,
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithPreview: Story = {
  render: () => (
    <Table
      dataSource={sampleProducts.slice(0, 3)}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: 'Image (with preview)',
          dataIndex: 'imageUrl',
          key: 'image',
          width: 120,
          render: (value, record, index) => (
            <ImageCell
              data={{ value, record, index }}
              attributes={{
                width: 80,
                height: 80,
                preview: true,
                style: { objectFit: 'cover' },
              }}
            />
          ),
        },
        {
          title: 'Product Name',
          dataIndex: 'name',
          key: 'name',
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
      dataSource={sampleProducts.slice(0, 4)}
      columns={[
        {
          title: 'Small (40x40)',
          dataIndex: 'imageUrl',
          key: 'small',
          width: 80,
          render: (value, record, index) => (
            <ImageCell
              data={{ value, record, index }}
              attributes={{
                width: 40,
                height: 40,
                style: { objectFit: 'cover' },
              }}
            />
          ),
        },
        {
          title: 'Medium (60x60)',
          dataIndex: 'imageUrl',
          key: 'medium',
          width: 80,
          render: (value, record, index) => (
            <ImageCell
              data={{ value, record, index }}
              attributes={{
                width: 60,
                height: 60,
                style: { objectFit: 'cover' },
              }}
            />
          ),
        },
        {
          title: 'Large (100x100)',
          dataIndex: 'imageUrl',
          key: 'large',
          width: 120,
          render: (value, record, index) => (
            <ImageCell
              data={{ value, record, index }}
              attributes={{
                width: 100,
                height: 100,
                style: { objectFit: 'cover' },
              }}
            />
          ),
        },
        {
          title: 'Product',
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

export const AvatarStyle: Story = {
  render: () => (
    <Table
      dataSource={sampleUsers}
      columns={[
        {
          title: 'Avatar',
          dataIndex: 'avatar',
          key: 'avatar',
          width: 80,
          render: (value, record, index) => (
            <ImageCell
              data={{ value, record, index }}
              attributes={{
                width: 50,
                height: 50,
                style: {
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #f0f0f0',
                },
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

export const WithFallback: Story = {
  render: () => (
    <Table
      dataSource={[
        {
          id: 1,
          name: 'Valid Image',
          imageUrl: 'https://picsum.photos/200/200?random=1',
        },
        {
          id: 2,
          name: 'Broken Image',
          imageUrl: 'https://invalid-url-that-does-not-exist.com/image.jpg',
        },
        {
          id: 3,
          name: 'No Image',
          imageUrl: '',
        },
      ]}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: 'Image',
          dataIndex: 'imageUrl',
          key: 'image',
          width: 100,
          render: (value, record, index) => (
            <ImageCell
              data={{ value, record, index }}
              attributes={{
                width: 60,
                height: 60,
                fallback: 'https://picsum.photos/200/200?random=fallback',
                style: { objectFit: 'cover' },
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
    />
  ),
};

export const NullValues: Story = {
  args: {
    data: {
      value: null as any,
      record: sampleProducts[0],
      index: 0,
    },
    attributes: {},
  },
};
