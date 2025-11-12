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
import { TagsCell } from '../TagsCell';

interface Product {
  id: number;
  name: string;
  tags: string[];
  category: string;
}

interface Task {
  id: number;
  title: string;
  labels: string[];
  priority: string;
}

const meta: Meta<typeof TagsCell> = {
  title: 'Viewer/Table/Cell/TagsCell',
  component: TagsCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A tags cell component that renders arrays of string values as multiple styled tags in table cells. Each tag can have individual styling through attributes mapping.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description:
        'Mapping of tag names to Tag props for individual tag customization',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    tags: ['electronics', 'audio', 'wireless'],
    category: 'Electronics',
  },
  {
    id: 2,
    name: 'Coffee Maker',
    tags: ['kitchen', 'appliance', 'coffee'],
    category: 'Home',
  },
  {
    id: 3,
    name: 'Running Shoes',
    tags: ['sports', 'footwear', 'running'],
    category: 'Sports',
  },
  {
    id: 4,
    name: 'Laptop Stand',
    tags: ['office', 'ergonomic', 'computer'],
    category: 'Office',
  },
];

const sampleTasks: Task[] = [
  {
    id: 1,
    title: 'Fix login bug',
    labels: ['bug', 'urgent', 'frontend'],
    priority: 'high',
  },
  {
    id: 2,
    title: 'Update documentation',
    labels: ['documentation', 'enhancement'],
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Add new feature',
    labels: ['feature', 'backend', 'api'],
    priority: 'high',
  },
];

export const Basic: Story = {
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
          title: 'Product',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Tags',
          dataIndex: 'tags',
          key: 'tags',
          render: (value, record, index) => (
            <TagsCell data={{ value, record, index }} />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithTagStyling: Story = {
  render: () => {
    const tagAttributes = {
      electronics: { color: 'blue' },
      audio: { color: 'purple' },
      wireless: { color: 'cyan' },
      kitchen: { color: 'orange' },
      appliance: { color: 'red' },
      coffee: { color: 'brown' },
      sports: { color: 'green' },
      footwear: { color: 'geekblue' },
      running: { color: 'lime' },
      office: { color: 'gold' },
      ergonomic: { color: 'magenta' },
      computer: { color: 'volcano' },
    };

    return (
      <Table
        dataSource={sampleProducts}
        columns={[
          {
            title: 'Product',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (value, record, index) => (
              <TagsCell
                data={{ value, record, index }}
                attributes={tagAttributes}
              />
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const TaskLabels: Story = {
  render: () => {
    const labelAttributes = {
      bug: { color: 'red' },
      urgent: { color: 'red', closable: true },
      frontend: { color: 'blue' },
      documentation: { color: 'green' },
      enhancement: { color: 'orange' },
      feature: { color: 'purple' },
      backend: { color: 'geekblue' },
      api: { color: 'cyan' },
    };

    return (
      <Table
        dataSource={sampleTasks}
        columns={[
          {
            title: 'Task',
            dataIndex: 'title',
            key: 'title',
          },
          {
            title: 'Labels',
            dataIndex: 'labels',
            key: 'labels',
            render: (value, record, index) => (
              <TagsCell
                data={{ value, record, index }}
                attributes={labelAttributes}
              />
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const MixedTagTypes: Story = {
  render: () => {
    const mixedAttributes = {
      electronics: { color: 'blue', closable: true },
      audio: { color: 'purple' },
      wireless: { color: 'cyan', style: { fontWeight: 'bold' } },
      kitchen: { color: 'orange' },
      appliance: { color: 'red' },
      sports: { color: 'green' },
      office: { color: 'gold' },
      bug: { color: 'red' },
      urgent: { color: 'red', closable: true },
      frontend: { color: 'blue' },
    };

    const mixedData = [
      {
        id: 1,
        item: 'Wireless Headphones',
        tags: ['electronics', 'audio', 'wireless'],
      },
      {
        id: 2,
        item: 'Bug Report',
        tags: ['bug', 'urgent', 'frontend'],
      },
      {
        id: 3,
        item: 'Office Chair',
        tags: ['office', 'ergonomic'],
      },
    ];

    return (
      <Table
        dataSource={mixedData}
        columns={[
          {
            title: 'Item',
            dataIndex: 'item',
            key: 'item',
          },
          {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (value, record, index) => (
              <TagsCell
                data={{ value, record, index }}
                attributes={mixedAttributes}
              />
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const EmptyTags: Story = {
  render: () => {
    const dataWithEmptyTags = [
      { id: 1, name: 'Product A', tags: ['tag1', 'tag2'] },
      { id: 2, name: 'Product B', tags: [] },
      { id: 3, name: 'Product C', tags: ['tag3'] },
      { id: 4, name: 'Product D', tags: [] },
    ];

    return (
      <Table
        dataSource={dataWithEmptyTags}
        columns={[
          {
            title: 'Product',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (value, record, index) => (
              <TagsCell
                data={{ value, record, index }}
                attributes={{
                  tag1: { color: 'blue' },
                  tag2: { color: 'green' },
                  tag3: { color: 'red' },
                }}
              />
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const WithCustomStyling: Story = {
  render: () => {
    const customAttributes = {
      electronics: {
        color: 'blue',
        className: 'custom-tag',
        style: { fontSize: '11px', fontWeight: 'bold' },
      },
      audio: {
        color: 'purple',
        className: 'custom-tag',
        style: { fontSize: '11px' },
      },
      wireless: {
        color: 'cyan',
        className: 'custom-tag',
        style: { fontSize: '11px', fontStyle: 'italic' },
      },
    };

    return (
      <div>
        <style>
          {`
            .custom-tag {
              border-radius: 12px;
              padding: 2px 8px;
              margin: 2px;
            }
          `}
        </style>
        <Table
          dataSource={sampleProducts.slice(0, 2)}
          columns={[
            {
              title: 'Product',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: 'Tags',
              dataIndex: 'tags',
              key: 'tags',
              render: (value, record, index) => (
                <TagsCell
                  data={{ value, record, index }}
                  attributes={customAttributes}
                />
              ),
            },
          ]}
          rowKey="id"
          pagination={false}
        />
      </div>
    );
  },
};

export const SpecialCharacters: Story = {
  render: () => {
    const specialData = [
      {
        id: 1,
        name: 'Product 1',
        tags: ['café', 'naïve', '北京'],
      },
      {
        id: 2,
        name: 'Product 2',
        tags: ['🚀', '⭐', '🔥'],
      },
      {
        id: 3,
        name: 'Product 3',
        tags: ['tag-with-dash', 'tag_with_underscore', 'tag.with.dots'],
      },
    ];

    const specialAttributes = {
      café: { color: 'orange' },
      naïve: { color: 'purple' },
      北京: { color: 'red' },
      '🚀': { color: 'blue' },
      '⭐': { color: 'yellow' },
      '🔥': { color: 'red' },
      'tag-with-dash': { color: 'green' },
      tag_with_underscore: { color: 'cyan' },
      'tag.with.dots': { color: 'geekblue' },
    };

    return (
      <Table
        dataSource={specialData}
        columns={[
          {
            title: 'Product',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (value, record, index) => (
              <TagsCell
                data={{ value, record, index }}
                attributes={specialAttributes}
              />
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};
