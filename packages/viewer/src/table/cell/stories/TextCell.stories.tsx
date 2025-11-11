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
import { TextCell } from '../TextCell';

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}

const meta: Meta<typeof TextCell> = {
  title: 'Viewer/Table/Cell/TextCell',
  component: TextCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A text cell component that renders string values in table cells using Ant Design Typography.Text. Supports ellipsis, styling, and other text formatting options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description: 'Typography.Text props for customization',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Pending' },
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
          render: (value, record, index) => (
            <TextCell data={{ value: String(value), record, index }} />
          ),
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          render: (value, record, index) => (
            <TextCell data={{ value, record, index }} />
          ),
        },
        {
          title: 'Email',
          dataIndex: 'email',
          key: 'email',
          render: (value, record, index) => (
            <TextCell data={{ value, record, index }} />
          ),
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          render: (value, record, index) => (
            <TextCell data={{ value, record, index }} />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithEllipsis: Story = {
  render: () => {
    const longTextData = [
      {
        id: 1,
        description:
          'This is a very long description that should be truncated with ellipsis to demonstrate the text truncation feature in table cells.',
      },
      {
        id: 2,
        description:
          'Another long piece of text that demonstrates how the ellipsis property works when the content exceeds the available space.',
      },
      { id: 3, description: 'Short text' },
    ];

    return (
      <Table
        dataSource={longTextData}
        columns={[
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (value, record, index) => (
              <TextCell
                data={{ value, record, index }}
                attributes={{
                  ellipsis: { tooltip: true },
                  style: { maxWidth: 200 },
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

export const WithStyling: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          render: (value, record, index) => (
            <TextCell
              data={{ value, record, index }}
              attributes={{
                style: { fontWeight: 'bold', color: '#1890ff' },
              }}
            />
          ),
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          render: (value, record, index) => {
            const color =
              value === 'Active'
                ? '#52c41a'
                : value === 'Inactive'
                  ? '#ff4d4f'
                  : '#faad14';
            return (
              <TextCell
                data={{ value, record, index }}
                attributes={{
                  style: { color, fontWeight: 'bold' },
                }}
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

export const WithCustomClass: Story = {
  render: () => (
    <div>
      <style>
        {`
          .custom-text-cell {
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
          }
        `}
      </style>
      <Table
        dataSource={sampleData.slice(0, 2)}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (value, record, index) => (
              <TextCell
                data={{ value, record, index }}
                attributes={{
                  className: 'custom-text-cell',
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

export const EmptyValues: Story = {
  render: () => {
    const dataWithEmpty = [
      { id: 1, name: 'John Doe', description: 'Has description' },
      { id: 2, name: 'Jane Smith', description: '' },
      { id: 3, name: 'Bob Johnson', description: null as any },
      { id: 4, name: 'Alice Brown', description: undefined as any },
    ];

    return (
      <Table
        dataSource={dataWithEmpty}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (value, record, index) => (
              <TextCell
                data={{ value: value || 'No description', record, index }}
                attributes={{
                  style: { color: value ? 'inherit' : '#999' },
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

export const SpecialCharacters: Story = {
  render: () => {
    const specialData = [
      { id: 1, text: 'Normal text' },
      { id: 2, text: 'HTML entities: & < > " \'' },
      { id: 3, text: 'Unicode: 你好 🌟 αβγ' },
      { id: 4, text: 'Symbols: ©®™ ± × ÷' },
    ];

    return (
      <Table
        dataSource={specialData}
        columns={[
          {
            title: 'Text',
            dataIndex: 'text',
            key: 'text',
            render: (value, record, index) => (
              <TextCell
                data={{ value, record, index }}
                attributes={{
                  style: { fontFamily: 'monospace' },
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

export const Interactive: Story = {
  render: () => {
    const interactiveData = [
      { id: 1, title: 'Click me', url: 'https://example.com/1' },
      { id: 2, title: 'Hover me', url: 'https://example.com/2' },
      { id: 3, title: 'Disabled', url: null },
    ];

    return (
      <Table
        dataSource={interactiveData}
        columns={[
          {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (value, record, index) => (
              <TextCell
                data={{ value, record, index }}
                attributes={{
                  style: record.url
                    ? { cursor: 'pointer', color: '#1890ff' }
                    : { color: '#999' },
                  title: record.url
                    ? `Click to visit ${record.url}`
                    : undefined,
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
