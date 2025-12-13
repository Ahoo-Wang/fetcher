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
import { ViewTable } from '../ViewTable';
import { message } from 'antd';
import {
  TEXT_CELL_TYPE,
  TAG_CELL_TYPE,
  TAGS_CELL_TYPE,
  DATETIME_CELL_TYPE,
  CURRENCY_CELL_TYPE,
  IMAGE_CELL_TYPE,
  LINK_CELL_TYPE,
  AVATAR_CELL_TYPE,
  ACTIONS_CELL_TYPE,
} from '../cell';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  tags: string[];
  status: string;
  createdAt: string;
  image: string;
  avatar: string;
  website: string;
}

const meta: Meta = {
  title: 'Viewer/Table/ViewTable',
  component: ViewTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible table component that renders data using typed cell renderers. Supports various cell types including text, tags, dates, currency, images, and actions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'object',
      description: 'Column definitions with cell type configurations',
    },
    dataSource: {
      control: 'object',
      description: 'Array of data records to display',
    },
    actionColumn: {
      control: 'object',
      description: 'Optional action column configuration',
    },
    attributes: {
      control: 'object',
      description: 'Additional Table props from Ant Design',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: 299.99,
    category: 'Electronics',
    tags: ['wireless', 'bluetooth', 'premium'],
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    image: 'https://via.placeholder.com/64x64?text=🎧',
    avatar: 'https://via.placeholder.com/32x32?text=JH',
    website: 'https://example.com/product/1',
  },
  {
    id: 2,
    name: 'Ergonomic Chair',
    price: 499.99,
    category: 'Furniture',
    tags: ['office', 'comfort', 'adjustable'],
    status: 'active',
    createdAt: '2024-01-20T14:45:00Z',
    image: 'https://via.placeholder.com/64x64?text=🪑',
    avatar: 'https://via.placeholder.com/32x32?text=EC',
    website: 'https://example.com/product/2',
  },
  {
    id: 3,
    name: 'Coffee Maker',
    price: 89.99,
    category: 'Appliances',
    tags: ['kitchen', 'coffee', 'automatic'],
    status: 'inactive',
    createdAt: '2024-01-25T09:15:00Z',
    image: 'https://via.placeholder.com/64x64?text=☕',
    avatar: 'https://via.placeholder.com/32x32?text=CM',
    website: 'https://example.com/product/3',
  },
  {
    id: 4,
    name: 'Running Shoes',
    price: 129.99,
    category: 'Sports',
    tags: ['running', 'comfort', 'breathable'],
    status: 'pending',
    createdAt: '2024-02-01T16:20:00Z',
    image: 'https://via.placeholder.com/64x64?text=👟',
    avatar: 'https://via.placeholder.com/32x32?text=RS',
    website: 'https://example.com/product/4',
  },
];

export const Basic: Story = {
  args: {
    columns: [
      {
        title: 'ID',
        dataIndex: 'id',
        cell: { type: TEXT_CELL_TYPE },
      },
      {
        title: 'Name',
        dataIndex: 'name',
        cell: { type: TEXT_CELL_TYPE, attributes: { ellipsis: true } },
      },
      {
        title: 'Price',
        dataIndex: 'price',
        cell: { type: CURRENCY_CELL_TYPE, attributes: { currency: 'USD' } },
      },
      {
        title: 'Category',
        dataIndex: 'category',
        cell: { type: TAG_CELL_TYPE, attributes: { color: 'blue' } },
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        cell: { type: TAGS_CELL_TYPE, attributes: { color: 'green' } },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        cell: { type: TAG_CELL_TYPE, attributes: { color: 'orange' } },
      },
      {
        title: 'Created At',
        dataIndex: 'createdAt',
        cell: {
          type: DATETIME_CELL_TYPE,
          attributes: { format: 'YYYY-MM-DD HH:mm' },
        },
      },
    ],
    dataSource: sampleProducts,
    attributes: {
      rowKey: 'id',
      pagination: false,
    },
  },
};

export const WithImagesAndAvatars: Story = {
  args: {
    columns: [
      {
        title: 'Avatar',
        dataIndex: 'avatar',
        cell: { type: AVATAR_CELL_TYPE, attributes: { size: 32 } },
      },
      {
        title: 'Product',
        dataIndex: 'name',
        cell: { type: TEXT_CELL_TYPE, attributes: { strong: true } },
      },
      {
        title: 'Image',
        dataIndex: 'image',
        cell: { type: IMAGE_CELL_TYPE, attributes: { width: 64, height: 64 } },
      },
      {
        title: 'Price',
        dataIndex: 'price',
        cell: {
          type: CURRENCY_CELL_TYPE,
          attributes: { currency: 'USD', locale: 'en-US' },
        },
      },
      {
        title: 'Website',
        dataIndex: 'website',
        cell: { type: LINK_CELL_TYPE, attributes: { target: '_blank' } },
      },
    ],
    dataSource: sampleProducts,
    attributes: {
      rowKey: 'id',
      pagination: false,
    },
  },
};

export const WithActions: Story = {
  args: {
    columns: [
      {
        title: 'ID',
        dataIndex: 'id',
        cell: { type: TEXT_CELL_TYPE },
      },
      {
        title: 'Name',
        dataIndex: 'name',
        cell: { type: TEXT_CELL_TYPE },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        cell: { type: TAG_CELL_TYPE, attributes: { color: 'processing' } },
      },
      {
        title: 'Price',
        dataIndex: 'price',
        cell: { type: CURRENCY_CELL_TYPE },
      },
    ],
    dataSource: sampleProducts,
    actionColumn: {
      title: 'Actions',
      dataIndex: 'id',
      cell: { type: ACTIONS_CELL_TYPE },
      actions: (record: Product) => {
        const editAction = {
          data: {
            value: 'Edit',
            record: record,
            index: 0,
          },
          attributes: {
            onClick: (record: Product) => {
              console.log('Edit => ', record);
              message.info(`Edit => ${record.id} | ${record.name}`);
            }
          },
        };
        const deleteAction = {
          data: {
            value: 'Delete',
            record: record,
            index: 1,
          },
          attributes: {
            onClick: (record: Product) => {
              console.log('Delete => ', record);
              message.info(`Delete => ${record.id} | ${record.name}`);
            },
          },
        };
        const viewDetailsAction = {
          data: {
            value: 'View Details',
            record: record,
            index: 2,
          },
          attributes: {
            onClick: (record: Product) => {
              console.log('View Details => ', record);
              message.info(`View Details => ${record.id} | ${record.name}`);
            },
          },
        };
        const duplicateAction = {
          data: {
            value: 'Duplicate',
            record: record,
            index: 3,
          },
          attributes: {
            onClick: (record: Product) => {
              console.log('Duplicate => ', record);
              message.info(`Duplicate => ${record.id} | ${record.name}`);
            },
          },
        };

        switch (record.status) {
          case 'active':
            return {
              primaryAction: editAction,
              moreActionTitle: 'More',
              secondaryActions: [
                viewDetailsAction,
                duplicateAction,
                deleteAction,
              ],
            };
          case 'inactive':
            return {
              primaryAction: deleteAction,
              moreActionTitle: 'More',
              secondaryActions: [viewDetailsAction],
            };
          case 'pending':
            return {
              primaryAction: null,
              moreActionTitle: 'More',
              secondaryActions: [viewDetailsAction, deleteAction],
            };
          default:
            return {
              primaryAction: editAction,
              moreActionTitle: '',
              secondaryActions: [],
            };
        }
      },
    },
    attributes: {
      rowKey: 'id',
      pagination: false,
    },
  },
};

export const CompactView: Story = {
  args: {
    columns: [
      {
        title: 'Product',
        dataIndex: 'name',
        cell: { type: TEXT_CELL_TYPE, attributes: { ellipsis: true } },
      },
      {
        title: 'Category',
        dataIndex: 'category',
        cell: { type: TAG_CELL_TYPE },
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        cell: { type: TAGS_CELL_TYPE },
      },
      {
        title: 'Price',
        dataIndex: 'price',
        cell: { type: CURRENCY_CELL_TYPE, attributes: { compact: true } },
      },
    ],
    dataSource: sampleProducts,
    attributes: {
      rowKey: 'id',
      pagination: false,
      size: 'small',
    },
  },
};

export const WithPagination: Story = {
  args: {
    columns: [
      {
        title: 'ID',
        dataIndex: 'id',
        cell: { type: TEXT_CELL_TYPE },
      },
      {
        title: 'Name',
        dataIndex: 'name',
        cell: { type: TEXT_CELL_TYPE },
      },
      {
        title: 'Price',
        dataIndex: 'price',
        cell: { type: CURRENCY_CELL_TYPE },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        cell: { type: TAG_CELL_TYPE },
      },
      {
        title: 'Created At',
        dataIndex: 'createdAt',
        cell: { type: DATETIME_CELL_TYPE },
      },
    ],
    dataSource: Array.from({ length: 50 }, (_, i) => ({
      ...sampleProducts[i % sampleProducts.length],
      id: i + 1,
      name: `${sampleProducts[i % sampleProducts.length].name} ${i + 1}`,
    })),
    attributes: {
      rowKey: 'id',
      pagination: {
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    columns: [
      {
        title: 'ID',
        dataIndex: 'id',
        cell: { type: TEXT_CELL_TYPE },
      },
      {
        title: 'Name',
        dataIndex: 'name',
        cell: { type: TEXT_CELL_TYPE },
      },
      {
        title: 'Price',
        dataIndex: 'price',
        cell: { type: CURRENCY_CELL_TYPE },
      },
    ],
    dataSource: [],
    attributes: {
      rowKey: 'id',
      pagination: false,
      locale: {
        emptyText: 'No products found',
      },
    },
  },
};
