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
import { typedCellRender } from '../TypedCell';
import { TEXT_CELL_TYPE } from '../TextCell';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
}

const meta: Meta = {
  title: 'Viewer/Table/Cell/TypedCell',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Typed cell rendering utilities that provide type-safe cell component resolution and rendering. Supports dynamic cell type registration and attribute passing.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Laptop',
    price: 999.99,
    category: 'Electronics',
    description: 'High-performance laptop',
  },
  {
    id: 2,
    name: 'Book',
    price: 19.99,
    category: 'Education',
    description: 'Programming guide',
  },
  {
    id: 3,
    name: 'Coffee Mug',
    price: 12.5,
    category: 'Kitchen',
    description: 'Ceramic coffee mug',
  },
  {
    id: 4,
    name: 'Headphones',
    price: 149.99,
    category: 'Electronics',
    description: 'Wireless noise-cancelling headphones',
  },
];

export const BasicTextCells: Story = {
  render: () => {
    return (
      <Table
        dataSource={sampleProducts}
        columns={[
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: typedCellRender(TEXT_CELL_TYPE),
          },
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: typedCellRender(TEXT_CELL_TYPE),
          },
          {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: typedCellRender(TEXT_CELL_TYPE),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const TextCellsWithEllipsis: Story = {
  render: () => {
    const textRenderer = typedCellRender(TEXT_CELL_TYPE, {
      ellipsis: { tooltip: true },
      style: { maxWidth: 150 },
    });

    return (
      <Table
        dataSource={sampleProducts}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: textRenderer,
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: textRenderer,
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const StyledTextCells: Story = {
  render: () => {
    const nameRenderer = typedCellRender(TEXT_CELL_TYPE, {
      style: { fontWeight: 'bold', color: '#1890ff' },
    });

    const priceRenderer = typedCellRender(TEXT_CELL_TYPE, {
      style: { fontFamily: 'monospace', color: '#52c41a' },
    });

    return (
      <Table
        dataSource={sampleProducts}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: nameRenderer,
          },
          {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: priceRenderer,
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const ConditionalStyling: Story = {
  render: () => {
    const categoryRenderer = (
      value: string,
      record: Product,
      index: number,
    ) => {
      const renderer = typedCellRender(TEXT_CELL_TYPE, {
        style: {
          color:
            value === 'Electronics'
              ? '#1890ff'
              : value === 'Education'
                ? '#52c41a'
                : '#faad14',
          fontWeight: 'bold',
        },
      });
      return renderer!(value, record, index);
    };

    const priceRenderer = (value: number, record: Product, index: number) => {
      const renderer = typedCellRender(TEXT_CELL_TYPE, {
        style: {
          color: value > 100 ? '#ff4d4f' : value > 50 ? '#faad14' : '#52c41a',
          fontWeight: value > 100 ? 'bold' : 'normal',
        },
      });
      return renderer!(`$${value}`, record, index);
    };

    return (
      <Table
        dataSource={sampleProducts}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (value, record, index) =>
              typedCellRender(TEXT_CELL_TYPE)!(value, record, index),
          },
          {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: categoryRenderer,
          },
          {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: priceRenderer,
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const DifferentValueTypes: Story = {
  render: () => {
    const textRenderer = typedCellRender(TEXT_CELL_TYPE);
    const dataWithTypes = [
      { id: 1, value: 'String value', type: 'string' },
      { id: 2, value: 42, type: 'number' },
      { id: 3, value: true, type: 'boolean' },
      { id: 4, value: null, type: 'null' },
      { id: 5, value: undefined, type: 'undefined' },
      { id: 6, value: ['a', 'b', 'c'], type: 'array' },
    ];

    return (
      <Table
        dataSource={dataWithTypes}
        columns={[
          {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: textRenderer,
          },
          {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            render: (value, record, index) => {
              try {
                return textRenderer!(String(value), record, index);
              } catch (error) {
                return textRenderer!('[Error rendering value]', record, index);
              }
            },
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const UnregisteredType: Story = {
  render: () => {
    const unregisteredRenderer = typedCellRender('non-existent-type');

    return (
      <div>
        <p>Attempting to render with unregistered type:</p>
        <pre>{JSON.stringify({ renderer: unregisteredRenderer }, null, 2)}</pre>
        <p>The renderer will be undefined for unregistered types.</p>
      </div>
    );
  },
};
