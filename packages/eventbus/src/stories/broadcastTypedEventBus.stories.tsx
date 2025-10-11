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

import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState, useEffect } from 'react';
import { Button, Card, List, Space, Typography } from 'antd';

import { BroadcastTypedEventBus, SerialTypedEventBus } from '../index';

// Example event type
interface UserEvent {
  userId: string;
  action: string;
}

// Demo component
const BroadcastTypedEventBusDemo: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [eventBus] = useState(() => {
    const delegate = new SerialTypedEventBus<UserEvent>('user-events');
    return new BroadcastTypedEventBus<UserEvent>(delegate, 'demo-channel');
  });

  useEffect(() => {
    const handler = {
      name: 'demoHandler',
      order: 1,
      handle: (event: UserEvent) => {
        setLogs(prev => [
          ...prev,
          `User ${event.userId} performed ${event.action}`,
        ]);
      },
    };
    eventBus.on(handler);

    return () => {
      eventBus.destroy();
    };
  }, [eventBus]);

  const emitUpdate = () => {
    eventBus.emit({ userId: '789', action: 'update' });
  };

  const emitLogin = () => {
    eventBus.emit({ userId: '789', action: 'login' });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Card title="BroadcastTypedEventBus Demo" style={{ maxWidth: 600 }}>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Space>
          <Button type="primary" onClick={emitUpdate}>
            Emit Update Event
          </Button>
          <Button type="primary" onClick={emitLogin}>
            Emit Login Event
          </Button>
          <Button onClick={clearLogs}>Clear Logs</Button>
        </Space>
        <div>
          <Typography.Title level={5}>Event Logs:</Typography.Title>
          <List
            size="small"
            bordered
            dataSource={logs}
            renderItem={(item, index) => (
              <List.Item key={index}>
                <Typography.Text>{item}</Typography.Text>
              </List.Item>
            )}
            locale={{ emptyText: 'No events yet' }}
          />
        </div>
      </Space>
    </Card>
  );
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'EventBus/BroadcastTypedEventBus',
  component: BroadcastTypedEventBusDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'BroadcastTypedEventBus enables cross-tab/window event broadcasting using BroadcastChannel API.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BroadcastTypedEventBusDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const BasicUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates basic usage of BroadcastTypedEventBus for cross-tab communication.',
      },
    },
  },
};
