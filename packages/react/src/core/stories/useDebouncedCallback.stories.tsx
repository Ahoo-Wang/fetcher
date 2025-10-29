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
import { useState, useCallback } from 'react';
import { useDebouncedCallback } from '../useDebouncedCallback';
import {
  Button,
  Card,
  Typography,
  Space,
  Input,
  Alert,
  Tag,
  Divider,
} from 'antd';

const { Text, Title } = Typography;
const { TextArea } = Input;

// Component that demonstrates useDebouncedCallback
interface DebouncedCallbackDemoProps {
  delay: number;
  leading: boolean;
  trailing: boolean;
  showLogs: boolean;
}

function DebouncedCallbackDemo({
  delay,
  leading,
  trailing,
  showLogs,
}: DebouncedCallbackDemoProps) {
  const [callCount, setCallCount] = useState(0);
  const [immediateCallCount, setImmediateCallCount] = useState(0);
  const [debouncedCallCount, setDebouncedCallCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback(
    (message: string) => {
      if (showLogs) {
        setLogs(prev => [
          ...prev.slice(-4),
          `${new Date().toLocaleTimeString()}: ${message}`,
        ]);
      }
    },
    [showLogs],
  );

  const callback = useCallback(
    (value: string) => {
      setCallCount(prev => prev + 1);
      addLog(`Callback executed with: "${value}"`);
    },
    [addLog],
  );

  const { run, cancel } = useDebouncedCallback(callback, {
    delay,
    leading,
    trailing,
  });

  const handleInputChange = (value: string) => {
    if (leading && !trailing) {
      setImmediateCallCount(prev => prev + 1);
      addLog(`Leading edge call with: "${value}"`);
    } else if (trailing && !leading) {
      setDebouncedCallCount(prev => prev + 1);
      addLog(`Trailing edge scheduled for: "${value}"`);
    } else if (leading && trailing) {
      addLog(`Leading+Trailing call with: "${value}"`);
    }
    run(value);
  };

  const handleCancel = () => {
    cancel();
    addLog('Debounced call cancelled');
  };

  const handleReset = () => {
    setCallCount(0);
    setImmediateCallCount(0);
    setDebouncedCallCount(0);
    setLogs([]);
  };

  return (
    <Card title="useDebouncedCallback Demo" style={{ width: 700 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Configuration</Title>
          <Space>
            <Tag color="blue">Delay: {delay}ms</Tag>
            <Tag color={leading ? 'green' : 'default'}>
              Leading: {leading ? 'Yes' : 'No'}
            </Tag>
            <Tag color={trailing ? 'green' : 'default'}>
              Trailing: {trailing ? 'Yes' : 'No'}
            </Tag>
          </Space>
        </div>

        <Divider />

        <div>
          <Title level={4}>Test Input</Title>
          <TextArea
            placeholder="Type here to trigger debounced callback..."
            onChange={e => handleInputChange(e.target.value)}
            rows={3}
            style={{ marginBottom: 8 }}
          />
          <Space>
            <Button onClick={handleCancel} danger>
              Cancel Pending
            </Button>
            <Button onClick={handleReset}>Reset Counters</Button>
          </Space>
        </div>

        <Divider />

        <div>
          <Title level={4}>Statistics</Title>
          <Space direction="vertical">
            <Text>
              <strong>Total Callback Executions:</strong> {callCount}
            </Text>
            {leading && (
              <Text>
                <strong>Leading Edge Calls:</strong> {immediateCallCount}
              </Text>
            )}
            {trailing && (
              <Text>
                <strong>Trailing Edge Scheduled:</strong> {debouncedCallCount}
              </Text>
            )}
          </Space>
        </div>

        {showLogs && logs.length > 0 && (
          <>
            <Divider />
            <div>
              <Title level={4}>Execution Logs</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                {logs.map((log, index) => (
                  <Alert
                    key={index}
                    message={log}
                    type="info"
                    showIcon
                    style={{ padding: '4px 8px' }}
                  />
                ))}
              </Space>
            </div>
          </>
        )}

        <Divider />

        <div>
          <Title level={4}>How it works</Title>
          <Space direction="vertical">
            <Text>
              <strong>Leading Edge:</strong> Executes immediately on first call,
              then waits for delay.
            </Text>
            <Text>
              <strong>Trailing Edge:</strong> Executes after delay on last call.
            </Text>
            <Text>
              <strong>Both:</strong> Executes immediately, then again after
              delay if called again.
            </Text>
            <Text type="secondary">
              Try typing in the input above to see the debouncing in action!
            </Text>
          </Space>
        </div>
      </Space>
    </Card>
  );
}

const meta: Meta<typeof DebouncedCallbackDemo> = {
  title: 'React/Hooks/useDebouncedCallback',
  component: DebouncedCallbackDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook that provides a debounced version of a callback function with configurable leading and trailing edge execution.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    delay: {
      control: { type: 'number', min: 100, max: 2000, step: 100 },
      description: 'Delay in milliseconds before the callback is invoked',
    },
    leading: {
      control: 'boolean',
      description:
        'Whether to invoke the callback immediately on the leading edge',
    },
    trailing: {
      control: 'boolean',
      description:
        'Whether to invoke the callback on the trailing edge after delay',
    },
    showLogs: {
      control: 'boolean',
      description: 'Whether to show execution logs',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    delay: 500,
    leading: false,
    trailing: true,
    showLogs: true,
  },
};

export const LeadingEdge: Story = {
  args: {
    delay: 1000,
    leading: true,
    trailing: false,
    showLogs: true,
  },
};

export const TrailingEdge: Story = {
  args: {
    delay: 300,
    leading: false,
    trailing: true,
    showLogs: true,
  },
};

export const LeadingAndTrailing: Story = {
  args: {
    delay: 800,
    leading: true,
    trailing: true,
    showLogs: true,
  },
};

export const FastDebounce: Story = {
  args: {
    delay: 200,
    leading: false,
    trailing: true,
    showLogs: true,
  },
};

export const SlowDebounce: Story = {
  args: {
    delay: 1500,
    leading: false,
    trailing: true,
    showLogs: true,
  },
};
