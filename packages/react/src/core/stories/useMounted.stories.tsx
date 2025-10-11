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
import { useMounted } from '../useMounted';
import { Button, Card, Typography, Space, Alert } from 'antd';

const { Text } = Typography;

// Component that demonstrates useMounted
function MountedDemo() {
  const [showChild, setShowChild] = React.useState(true);
  const [logs, setLogs] = React.useState<string[]>([]);

  const handleToggleChild = () => {
    setShowChild(prev => !prev);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <Card title="useMounted Demo" style={{ width: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button onClick={handleToggleChild} type="primary">
            {showChild ? 'Unmount Child' : 'Mount Child'}
          </Button>
          <Button onClick={handleClearLogs}>Clear Logs</Button>
        </Space>

        <div>
          <Text strong>Child Component:</Text>
          {showChild && <ChildComponent onLog={setLogs} />}
        </div>

        <div>
          <Text strong>Mount/Unmount Logs:</Text>
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
          description="Toggle the child component on/off. The child uses useMounted to check if it's still mounted before performing async operations."
          type="info"
          showIcon
        />

        <Text type="secondary">
          This demonstrates the useMounted hook for checking component mount
          status in async operations.
        </Text>
      </Space>
    </Card>
  );
}

// Child component that uses useMounted
interface ChildComponentProps {
  onLog: React.Dispatch<React.SetStateAction<string[]>>;
}

function ChildComponent({ onLog }: ChildComponentProps) {
  const isMounted = useMounted();

  React.useEffect(() => {
    onLog(prev => [...prev, 'Child component mounted']);

    // Simulate async operation that checks if component is still mounted
    const timeoutId = setTimeout(() => {
      if (isMounted()) {
        onLog(prev => [
          ...prev,
          'Async operation completed (component still mounted)',
        ]);
      } else {
        onLog(prev => [
          ...prev,
          'Async operation completed (component was unmounted)',
        ]);
      }
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      onLog(prev => [...prev, 'Child component unmounting']);
    };
  }, [isMounted, onLog]);

  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        marginTop: 8,
      }}
    >
      <Text>Child Component is mounted</Text>
    </div>
  );
}

const meta: Meta<typeof MountedDemo> = {
  title: 'React/Hooks/useMounted',
  component: MountedDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook that returns a function to check if the component is mounted, useful for preventing state updates after unmounting.',
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
