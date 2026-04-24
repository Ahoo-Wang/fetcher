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
import React from 'react';
import { useDataMonitor } from '../useDataMonitor';
import { Card, Button, Space, Typography, Badge, Switch, Input, Form } from 'antd';

const { Text } = Typography;

interface DataMonitorDemoProps {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Record<string, unknown>;
  notificationTitle: string;
  notificationNavigationUrl?: string;
  interval?: number;
}

function DataMonitorDemo({
  viewId,
  countUrl,
  viewName,
  condition,
  notificationTitle,
  notificationNavigationUrl,
  interval = 30000,
}: DataMonitorDemoProps) {
  const { isEnabled, enable, disable, toggle } = useDataMonitor({
    viewId,
    countUrl,
    viewName,
    condition,
    notification: {
      title: notificationTitle,
      navigationUrl: notificationNavigationUrl,
    },
    interval,
  });

  return (
    <Card
      title="Data Monitor Demo"
      style={{ width: 450 }}
      extra={
        <Badge status={isEnabled ? 'success' : 'default'} text={isEnabled ? 'Enabled' : 'Disabled'} />
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>View ID: </Text>
          <Text>{viewId}</Text>
        </div>
        <div>
          <Text strong>View Name: </Text>
          <Text>{viewName}</Text>
        </div>
        <div>
          <Text strong>Count URL: </Text>
          <Text>{countUrl}</Text>
        </div>
        <div>
          <Text strong>Interval: </Text>
          <Text>{interval}ms</Text>
        </div>

        <Space style={{ marginTop: 16 }}>
          <Button type="primary" onClick={enable} disabled={isEnabled}>
            Enable
          </Button>
          <Button onClick={disable} disabled={!isEnabled}>
            Disable
          </Button>
          <Button onClick={toggle}>{isEnabled ? 'Disable' : 'Enable'}</Button>
        </Space>

        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
            Current State: {isEnabled ? 'Monitoring active' : 'Monitoring paused'}
          </Text>
        </div>
      </Space>
    </Card>
  );
}

const meta: Meta<typeof DataMonitorDemo> = {
  title: 'React/Hooks/useDataMonitor',
  component: DataMonitorDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook for monitoring data changes in views with configurable polling intervals and notifications.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    viewId: {
      control: 'text',
      description: 'Unique identifier for the monitored view',
    },
    countUrl: {
      control: 'text',
      description: 'API endpoint to fetch current data count',
    },
    viewName: {
      control: 'text',
      description: 'Display name for the view',
    },
    condition: {
      control: 'object',
      description: 'Query condition to filter data',
    },
    notificationTitle: {
      control: 'text',
      description: 'Title for browser notifications',
    },
    notificationNavigationUrl: {
      control: 'text',
      description: 'URL to navigate when notification is clicked',
    },
    interval: {
      control: 'number',
      description: 'Polling interval in milliseconds',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    viewId: 'default-view',
    countUrl: '/api/count',
    viewName: 'Default View',
    condition: {},
    notificationTitle: 'Data Changed',
    interval: 30000,
  },
};

export const WithCondition: Story = {
  args: {
    viewId: 'filtered-view',
    countUrl: '/api/count',
    viewName: 'Filtered View',
    condition: { status: 'active' },
    notificationTitle: 'Active Data Changed',
    interval: 30000,
  },
};

export const ShortInterval: Story = {
  args: {
    viewId: 'fast-view',
    countUrl: '/api/count',
    viewName: 'Fast Polling View',
    condition: {},
    notificationTitle: 'Data Updated',
    interval: 5000,
  },
};
