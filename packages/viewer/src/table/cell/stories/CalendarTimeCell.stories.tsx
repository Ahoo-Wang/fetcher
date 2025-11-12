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
import dayjs from 'dayjs';
import { CalendarTimeCell, DEFAULT_CALENDAR_FORMATS } from '../CalendarTime';

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

// Sample data with relative dates
const now = dayjs();
const today = now;
const yesterday = now.subtract(1, 'day');
const tomorrow = now.add(1, 'day');
const lastWeek = now.subtract(1, 'week').add(1, 'day');
const nextWeek = now.add(1, 'week').subtract(1, 'day');
const oldDate = now.subtract(2, 'months');

const sampleEvents: Event[] = [
  {
    id: 1,
    title: 'Today',
    createdAt: today.format(),
    updatedAt: today.valueOf(),
  },
  {
    id: 2,
    title: 'Yesterday',
    createdAt: yesterday.format(),
    updatedAt: yesterday.valueOf(),
  },
  {
    id: 3,
    title: 'Tomorrow',
    createdAt: tomorrow.format(),
    updatedAt: tomorrow.valueOf(),
  },
  {
    id: 4,
    title: 'Last Week',
    createdAt: lastWeek.format(),
    updatedAt: lastWeek.valueOf(),
  },
  {
    id: 5,
    title: 'Next Week',
    createdAt: nextWeek.format(),
    updatedAt: nextWeek.valueOf(),
  },
  {
    id: 6,
    title: 'Old Event',
    createdAt: oldDate.format(),
    updatedAt: oldDate.valueOf(),
  },
];

const sampleLogs: Log[] = [
  {
    id: 1,
    message: 'System startup completed',
    timestamp: today.valueOf(),
    date: today.toDate(),
  },
  {
    id: 2,
    message: 'Database backup finished',
    timestamp: yesterday.valueOf(),
    date: yesterday.toDate(),
  },
  {
    id: 3,
    message: 'Scheduled maintenance',
    timestamp: tomorrow.valueOf(),
    date: tomorrow.toDate(),
  },
];

const meta: Meta<typeof CalendarTimeCell> = {
  title: 'Viewer/Table/Cell/CalendarTimeCell',
  component: CalendarTimeCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A calendar time cell component that renders date/time values in table cells using relative time formats (e.g., "今天 10:30", "昨天 15:45"). Uses dayjs calendar plugin for intelligent relative time display based on current date.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description: 'Text props and calendar formats for customization',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      value: today.format(),
      record: sampleEvents[0],
      index: 0,
    },
    attributes: {},
  },
};

export const WithTable: Story = {
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
          title: 'Title',
          dataIndex: 'title',
          key: 'title',
        },
        {
          title: 'Created At',
          dataIndex: 'createdAt',
          key: 'createdAt',
          render: (value, record, index) => (
            <CalendarTimeCell data={{ value, record, index }} attributes={{}} />
          ),
        },
        {
          title: 'Updated At',
          dataIndex: 'updatedAt',
          key: 'updatedAt',
          render: (value, record, index) => (
            <CalendarTimeCell data={{ value, record, index }} attributes={{}} />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const CustomFormats: Story = {
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
          title: 'Title',
          dataIndex: 'title',
          key: 'title',
        },
        {
          title: 'Default Format',
          dataIndex: 'createdAt',
          key: 'default',
          render: (value, record, index) => (
            <CalendarTimeCell data={{ value, record, index }} attributes={{}} />
          ),
        },
        {
          title: 'Custom Format',
          dataIndex: 'createdAt',
          key: 'custom',
          render: (value, record, index) => (
            <CalendarTimeCell
              data={{ value, record, index }}
              attributes={{
                formats: {
                  sameDay: '[Today at] HH:mm',
                  nextDay: '[Tomorrow at] HH:mm',
                  nextWeek: 'dddd [at] HH:mm',
                  lastDay: '[Yesterday at] HH:mm',
                  lastWeek: '[Last] dddd [at] HH:mm',
                  sameElse: 'MMM DD, YYYY [at] HH:mm',
                },
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

export const WithStyling: Story = {
  render: () => (
    <Table
      dataSource={sampleEvents.slice(0, 3)}
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
          title: 'Created At',
          dataIndex: 'createdAt',
          key: 'createdAt',
          render: (value, record, index) => (
            <CalendarTimeCell
              data={{ value, record, index }}
              attributes={{
                style: { color: '#1890ff', fontWeight: 'bold' },
                className: 'calendar-time-cell',
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

export const WithEllipsis: Story = {
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
          title: 'Title',
          dataIndex: 'title',
          key: 'title',
          width: 200,
        },
        {
          title: 'Created At (with ellipsis)',
          dataIndex: 'createdAt',
          key: 'createdAt',
          width: 150,
          render: (value, record, index) => (
            <CalendarTimeCell
              data={{ value, record, index }}
              attributes={{
                ellipsis: true,
                style: { maxWidth: '140px' },
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
  render: () => (
    <Table
      dataSource={sampleLogs}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: 'Message',
          dataIndex: 'message',
          key: 'message',
        },
        {
          title: 'Timestamp (number)',
          dataIndex: 'timestamp',
          key: 'timestamp',
          render: (value, record, index) => (
            <CalendarTimeCell data={{ value, record, index }} attributes={{}} />
          ),
        },
        {
          title: 'Date (Date object)',
          dataIndex: 'date',
          key: 'date',
          render: (value, record, index) => (
            <CalendarTimeCell data={{ value, record, index }} attributes={{}} />
          ),
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
      record: sampleEvents[0],
      index: 0,
    },
    attributes: {},
  },
};
