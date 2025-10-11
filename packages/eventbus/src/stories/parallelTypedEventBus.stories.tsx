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

import { ParallelTypedEventBus } from '../parallelTypedEventBus';

// Example event type
interface UserEvent {
  userId: string;
  action: string;
}

// Demo component
const ParallelTypedEventBusDemo: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [eventBus] = useState(
    () => new ParallelTypedEventBus<UserEvent>('user-events'),
  );

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

  const emitLogin = () => {
    eventBus.emit({ userId: '456', action: 'login' });
  };

  const emitLogout = () => {
    eventBus.emit({ userId: '456', action: 'logout' });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Card title="ParallelTypedEventBus Demo" style={{ maxWidth: 600 }}>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Space>
          <Button type="primary" onClick={emitLogin}>
            Emit Login Event
          </Button>
          <Button type="primary" onClick={emitLogout}>
            Emit Logout Event
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
  title: 'EventBus/ParallelTypedEventBus',
  component: ParallelTypedEventBusDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'ParallelTypedEventBus handles events in parallel, calling handlers concurrently.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ParallelTypedEventBusDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const BasicUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates basic usage of ParallelTypedEventBus with concurrent event handling.',
      },
    },
  },
};
