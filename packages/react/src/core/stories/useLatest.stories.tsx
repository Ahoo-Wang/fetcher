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
import { useLatest } from '../useLatest';
import { Button, Card, Typography, Space, Alert } from 'antd';

const { Text } = Typography;

// Component that demonstrates useLatest
function LatestValueDemo() {
  const [count, setCount] = React.useState(0);
  const [logs, setLogs] = React.useState<string[]>([]);
  const latestCount = useLatest(count);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  const handleAsyncLog = () => {
    setLogs(prev => [...prev, `Starting async operation with count: ${count}`]);

    // Simulate async operation that uses the latest value
    setTimeout(() => {
      const latestValue = latestCount.current;
      setLogs(prev => [
        ...prev,
        `Async operation completed with latest count: ${latestValue}`,
      ]);
    }, 2000);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <Card title="useLatest Demo" style={{ width: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Current Count: </Text>
          <span>{count}</span>
        </div>

        <Space>
          <Button onClick={handleIncrement} type="primary">
            Increment Count
          </Button>
          <Button onClick={handleAsyncLog}>Start Async Log</Button>
          <Button onClick={handleClearLogs}>Clear Logs</Button>
        </Space>

        <div>
          <Text strong>Operation Logs:</Text>
          <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <Text type="secondary">No logs yet</Text>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  <Text>{log}</Text>
                </div>
              ))
            )}
          </div>
        </div>

        <Alert
          message="How it works"
          description="Increment the count quickly, then start an async operation. The async operation will always use the latest count value, even if the count changes while the operation is running."
          type="info"
          showIcon
        />

        <Text type="secondary">
          This demonstrates the useLatest hook for accessing the current value
          in async callbacks.
        </Text>
      </Space>
    </Card>
  );
}

const meta: Meta<typeof LatestValueDemo> = {
  title: 'React/Hooks/useLatest',
  component: LatestValueDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook that returns a ref containing the latest value, useful for accessing the current value in async callbacks.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
