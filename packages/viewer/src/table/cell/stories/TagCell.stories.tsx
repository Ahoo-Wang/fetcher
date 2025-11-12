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
import { TagCell } from '../TagCell';

interface Task {
  id: number;
  title: string;
  priority: string;
  status: string;
}

const meta: Meta<typeof TagCell> = {
  title: 'Viewer/Table/Cell/TagCell',
  component: TagCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A tag cell component that renders string values as styled tags in table cells using Ant Design Tag. Supports color customization, closable tags, and other tag formatting options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description: 'Tag props for customization (color, closable, etc.)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData: Task[] = [
  { id: 1, title: 'Fix login bug', priority: 'high', status: 'in-progress' },
  { id: 2, title: 'Update documentation', priority: 'medium', status: 'todo' },
  { id: 3, title: 'Add new feature', priority: 'low', status: 'done' },
  { id: 4, title: 'Code review', priority: 'high', status: 'review' },
];

export const Basic: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: 'Title',
          dataIndex: 'title',
          key: 'title',
        },
        {
          title: 'Priority',
          dataIndex: 'priority',
          key: 'priority',
          render: (value, record, index) => (
            <TagCell data={{ value, record, index }} />
          ),
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          render: (value, record, index) => (
            <TagCell data={{ value, record, index }} />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithColors: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'Priority',
          dataIndex: 'priority',
          key: 'priority',
          render: (value, record, index) => {
            const color =
              value === 'high'
                ? 'red'
                : value === 'medium'
                  ? 'orange'
                  : 'green';
            return (
              <TagCell data={{ value, record, index }} attributes={{ color }} />
            );
          },
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          render: (value, record, index) => {
            const colorMap: Record<string, string> = {
              'in-progress': 'blue',
              todo: 'gray',
              done: 'green',
              review: 'purple',
            };
            return (
              <TagCell
                data={{ value, record, index }}
                attributes={{ color: colorMap[value] || 'default' }}
              />
            );
          },
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const Closable: Story = {
  render: () => (
    <Table
      dataSource={sampleData.slice(0, 2)}
      columns={[
        {
          title: 'Priority',
          dataIndex: 'priority',
          key: 'priority',
          render: (value, record, index) => (
            <TagCell
              data={{ value, record, index }}
              attributes={{
                color: 'red',
                closable: true,
                onClose: () => console.log(`Closed ${value}`),
              }}
            />
          ),
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          render: (value, record, index) => (
            <TagCell
              data={{ value, record, index }}
              attributes={{
                color: 'blue',
                closable: true,
                onClose: () => console.log(`Closed ${value}`),
              }}
            />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithCustomStyling: Story = {
  render: () => (
    <div>
      <style>
        {`
          .custom-tag {
            font-weight: bold;
            font-size: 12px;
            border: 2px solid;
            padding: 2px 6px;
          }
        `}
      </style>
      <Table
        dataSource={sampleData.slice(0, 3)}
        columns={[
          {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (value, record, index) => (
              <TagCell
                data={{ value, record, index }}
                attributes={{
                  color: 'geekblue',
                  className: 'custom-tag',
                  style: { fontStyle: 'italic' },
                }}
              />
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    </div>
  ),
};

export const EmptyAndWhitespace: Story = {
  render: () => {
    const dataWithEmpty = [
      { id: 1, tag: 'valid-tag' },
      { id: 2, tag: '' },
      { id: 3, tag: '   ' },
      { id: 4, tag: '\t\n' },
      { id: 5, tag: 'another-valid' },
    ];

    return (
      <Table
        dataSource={dataWithEmpty}
        columns={[
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
          },
          {
            title: 'Tag',
            dataIndex: 'tag',
            key: 'tag',
            render: (value, record, index) => (
              <TagCell
                data={{ value, record, index }}
                attributes={{ color: 'blue' }}
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

export const SpecialCharacters: Story = {
  render: () => {
    const specialData = [
      { id: 1, tag: 'normal' },
      { id: 2, tag: 'with-dash' },
      { id: 3, tag: 'with_underscore' },
      { id: 4, tag: 'with.dots' },
      { id: 5, tag: '中文标签' },
      { id: 6, tag: '🚀 emoji' },
      { id: 7, tag: 'café' },
    ];

    return (
      <Table
        dataSource={specialData}
        columns={[
          {
            title: 'Tag',
            dataIndex: 'tag',
            key: 'tag',
            render: (value, record, index) => (
              <TagCell
                data={{ value, record, index }}
                attributes={{
                  color: index % 2 === 0 ? 'blue' : 'green',
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

export const WithChildren: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'Priority',
          dataIndex: 'priority',
          key: 'priority',
          render: (value, record, index) => (
            <TagCell
              data={{ value, record, index }}
              attributes={{
                children: `children-${value}`,
              }}
            />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};
