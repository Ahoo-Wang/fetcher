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
import { LinkCell } from '../LinkCell';

interface LinkItem {
  id: number;
  title: string;
  url: string;
  external?: boolean;
}

const meta: Meta<typeof LinkCell> = {
  title: 'Viewer/Table/Cell/LinkCell',
  component: LinkCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A link cell component that renders clickable links in table cells using Ant Design Typography.Link. Supports href, target, and other link attributes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description: 'Typography.Link props for customization',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData: LinkItem[] = [
  { id: 1, title: 'Internal Link', url: '/dashboard' },
  { id: 2, title: 'External Link', url: 'https://example.com', external: true },
  {
    id: 3,
    title: 'Documentation',
    url: 'https://docs.example.com',
    external: true,
  },
  { id: 4, title: 'Profile', url: '/profile' },
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
          render: (value, record, index) => (
            <LinkCell
              data={{ value, record, index }}
              attributes={{ href: record.url }}
            />
          ),
        },
        {
          title: 'URL',
          dataIndex: 'url',
          key: 'url',
          render: (value, record, index) => (
            <LinkCell
              data={{ value, record, index }}
              attributes={{ href: value }}
            />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithTarget: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'Link Type',
          dataIndex: 'title',
          key: 'title',
          render: (value, record, index) => (
            <LinkCell
              data={{ value, record, index }}
              attributes={{
                href: record.url,
                target: record.external ? '_blank' : '_self',
                rel: record.external ? 'noopener noreferrer' : undefined,
              }}
            />
          ),
        },
        {
          title: 'Target',
          dataIndex: 'external',
          key: 'external',
          render: value => (value ? '_blank' : '_self'),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithStyling: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'Styled Link',
          dataIndex: 'title',
          key: 'title',
          render: (value, record, index) => (
            <LinkCell
              data={{ value, record, index }}
              attributes={{
                href: record.url,
                style: {
                  color: record.external ? '#52c41a' : '#1890ff',
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                },
              }}
            />
          ),
        },
        {
          title: 'Type',
          dataIndex: 'external',
          key: 'external',
          render: value => (
            <span style={{ color: value ? '#52c41a' : '#1890ff' }}>
              {value ? 'External' : 'Internal'}
            </span>
          ),
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
          .custom-link-cell {
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            text-decoration: none !important;
          }
          .custom-link-cell:hover {
            opacity: 0.8;
          }
        `}
      </style>
      <Table
        dataSource={sampleData.slice(0, 2)}
        columns={[
          {
            title: 'Custom Styled Link',
            dataIndex: 'title',
            key: 'title',
            render: (value, record, index) => (
              <LinkCell
                data={{ value, record, index }}
                attributes={{
                  href: record.url,
                  className: 'custom-link-cell',
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

export const DisabledLinks: Story = {
  render: () => {
    const disabledData = [
      {
        id: 1,
        title: 'Active Link',
        url: 'https://example.com',
        disabled: false,
      },
      {
        id: 2,
        title: 'Disabled Link',
        url: 'https://example.com',
        disabled: true,
      },
      {
        id: 3,
        title: 'Another Active',
        url: 'https://example.com',
        disabled: false,
      },
    ];

    return (
      <Table
        dataSource={disabledData}
        columns={[
          {
            title: 'Link Status',
            dataIndex: 'title',
            key: 'title',
            render: (value, record, index) => (
              <LinkCell
                data={{ value, record, index }}
                attributes={{
                  href: record.disabled ? undefined : record.url,
                  disabled: record.disabled,
                  style: record.disabled ? { color: '#999' } : undefined,
                }}
              />
            ),
          },
          {
            title: 'Status',
            dataIndex: 'disabled',
            key: 'disabled',
            render: value => (
              <span style={{ color: value ? '#ff4d4f' : '#52c41a' }}>
                {value ? 'Disabled' : 'Active'}
              </span>
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const EmptyValues: Story = {
  render: () => {
    const dataWithEmpty = [
      { id: 1, title: 'Valid Link', url: 'https://example.com' },
      { id: 2, title: '', url: 'https://example.com' },
      { id: 3, title: null as any, url: 'https://example.com' },
      { id: 4, title: undefined as any, url: 'https://example.com' },
    ];

    return (
      <Table
        dataSource={dataWithEmpty}
        columns={[
          {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (value, record, index) => (
              <LinkCell
                data={{ value: value || 'Empty Link', record, index }}
                attributes={{
                  href: record.url,
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
