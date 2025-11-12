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
import { DateTimeCell } from '../DateTimeCell';

interface Event {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: number;
}

interface Log {
  id: number;
  message: string;
  timestamp: number;
  date: Date;
}

const meta: Meta<typeof DateTimeCell> = {
  title: 'Viewer/Table/Cell/DateTimeCell',
  component: DateTimeCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A datetime cell component that renders date/time values in table cells using dayjs formatting. Supports various input formats (string, timestamp, Date object) with customizable formatting options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description: 'Text props and format string for customization',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleEvents: Event[] = [
  {
    id: 1,
    title: 'User Registration',
    createdAt: '2024-01-15T10:30:45Z',
    updatedAt: 1705312245000,
  },
  {
    id: 2,
    title: 'Password Reset',
    createdAt: '2024-01-15T14:22:30Z',
    updatedAt: 1705326150000,
  },
  {
    id: 3,
    title: 'Profile Update',
    createdAt: '2024-01-15T16:45:12Z',
    updatedAt: 1705334712000,
  },
];

const sampleLogs: Log[] = [
  {
    id: 1,
    message: 'System startup completed',
    timestamp: 1705312200000,
    date: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 2,
    message: 'Database connection established',
    timestamp: 1705312260000,
    date: new Date('2024-01-15T10:30:20Z'),
  },
];

export const Basic: Story = {
  render: () => (
    <Table
      dataSource={sampleEvents}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: 'Event',
          dataIndex: 'title',
          key: 'title',
        },
        {
          title: 'Created At',
          dataIndex: 'createdAt',
          key: 'createdAt',
          render: (value, record, index) => (
            <DateTimeCell data={{ value, record, index }} />
          ),
        },
        {
          title: 'Updated At',
          dataIndex: 'updatedAt',
          key: 'updatedAt',
          render: (value, record, index) => (
            <DateTimeCell data={{ value, record, index }} />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithCustomFormats: Story = {
  render: () => (
    <Table
      dataSource={sampleEvents}
      columns={[
        {
          title: 'Event',
          dataIndex: 'title',
          key: 'title',
        },
        {
          title: 'Date Only',
          dataIndex: 'createdAt',
          key: 'dateOnly',
          render: (value, record, index) => (
            <DateTimeCell
              data={{ value, record, index }}
              attributes={{ format: 'YYYY-MM-DD' }}
            />
          ),
        },
        {
          title: 'Time Only',
          dataIndex: 'createdAt',
          key: 'timeOnly',
          render: (value, record, index) => (
            <DateTimeCell
              data={{ value, record, index }}
              attributes={{ format: 'HH:mm:ss' }}
            />
          ),
        },
        {
          title: 'Short Format',
          dataIndex: 'createdAt',
          key: 'shortFormat',
          render: (value, record, index) => (
            <DateTimeCell
              data={{ value, record, index }}
              attributes={{ format: 'MM/DD HH:mm' }}
            />
          ),
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
      dataSource={sampleEvents}
      columns={[
        {
          title: 'Event',
          dataIndex: 'title',
          key: 'title',
        },
        {
          title: 'Created At',
          dataIndex: 'createdAt',
          key: 'createdAt',
          render: (value, record, index) => (
            <DateTimeCell
              data={{ value, record, index }}
              attributes={{
                style: { color: '#1890ff', fontWeight: 'bold' },
              }}
            />
          ),
        },
        {
          title: 'Updated At',
          dataIndex: 'updatedAt',
          key: 'updatedAt',
          render: (value, record, index) => (
            <DateTimeCell
              data={{ value, record, index }}
              attributes={{
                style: { color: '#52c41a', fontSize: '12px' },
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

export const DifferentInputTypes: Story = {
  render: () => {
    const mixedData = [
      {
        id: 1,
        description: 'String ISO format',
        datetime: '2024-01-15T10:30:45Z',
      },
      {
        id: 2,
        description: 'Unix timestamp',
        datetime: 1705312245000,
      },
      {
        id: 3,
        description: 'Date object',
        datetime: new Date('2024-01-15T10:30:45Z'),
      },
    ];

    return (
      <Table
        dataSource={mixedData}
        columns={[
          {
            title: 'Type',
            dataIndex: 'description',
            key: 'description',
          },
          {
            title: 'DateTime',
            dataIndex: 'datetime',
            key: 'datetime',
            render: (value, record, index) => (
              <DateTimeCell
                data={{ value, record, index }}
                attributes={{ format: 'YYYY-MM-DD HH:mm:ss' }}
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

export const WithEllipsis: Story = {
  render: () => {
    const longFormatData = [
      {
        id: 1,
        event: 'System Maintenance',
        timestamp: '2024-01-15T10:30:45.123Z',
      },
      {
        id: 2,
        event: 'Database Backup',
        timestamp: '2024-01-15T14:22:30.456Z',
      },
    ];

    return (
      <Table
        dataSource={longFormatData}
        columns={[
          {
            title: 'Event',
            dataIndex: 'event',
            key: 'event',
          },
          {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 150,
            render: (value, record, index) => (
              <DateTimeCell
                data={{ value, record, index }}
                attributes={{
                  format: 'YYYY-MM-DD HH:mm:ss.SSS',
                  ellipsis: { tooltip: true },
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

export const EmptyAndInvalidValues: Story = {
  render: () => {
    const dataWithIssues = [
      { id: 1, event: 'Valid event', datetime: '2024-01-15T10:30:45Z' },
      { id: 2, event: 'Null datetime', datetime: null },
      { id: 3, event: 'Invalid date', datetime: 'invalid-date' },
      { id: 4, event: 'Empty string', datetime: '' },
      { id: 5, event: 'Undefined', datetime: undefined },
    ];

    return (
      <Table
        dataSource={dataWithIssues}
        columns={[
          {
            title: 'Event',
            dataIndex: 'event',
            key: 'event',
          },
          {
            title: 'DateTime',
            dataIndex: 'datetime',
            key: 'datetime',
            render: (value, record, index) => (
              <DateTimeCell
                data={{ value, record, index }}
                attributes={{
                  style: value ? {} : { color: '#999' },
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

export const LocalizedFormats: Story = {
  render: () => {
    const localizedData = [
      {
        id: 1,
        event: 'Meeting scheduled',
        datetime: '2024-01-15T10:30:45Z',
      },
      {
        id: 2,
        event: 'Report generated',
        datetime: '2024-01-15T14:22:30Z',
      },
    ];

    return (
      <Table
        dataSource={localizedData}
        columns={[
          {
            title: 'Event',
            dataIndex: 'event',
            key: 'event',
          },
          {
            title: 'US Format',
            dataIndex: 'datetime',
            key: 'usFormat',
            render: (value, record, index) => (
              <DateTimeCell
                data={{ value, record, index }}
                attributes={{ format: 'MM/DD/YYYY hh:mm A' }}
              />
            ),
          },
          {
            title: 'European Format',
            dataIndex: 'datetime',
            key: 'euFormat',
            render: (value, record, index) => (
              <DateTimeCell
                data={{ value, record, index }}
                attributes={{ format: 'DD/MM/YYYY HH:mm' }}
              />
            ),
          },
          {
            title: 'Long Format',
            dataIndex: 'datetime',
            key: 'longFormat',
            render: (value, record, index) => (
              <DateTimeCell
                data={{ value, record, index }}
                attributes={{ format: 'dddd, MMMM Do YYYY, h:mm:ss a' }}
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

export const WithCustomClass: Story = {
  render: () => {
    return (
      <div>
        <style>
          {`
            .datetime-cell {
              background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 12px;
            }
          `}
        </style>
        <Table
          dataSource={sampleEvents.slice(0, 2)}
          columns={[
            {
              title: 'Event',
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: 'Created At',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (value, record, index) => (
                <DateTimeCell
                  data={{ value, record, index }}
                  attributes={{
                    className: 'datetime-cell',
                    format: 'MM/DD HH:mm',
                  }}
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
