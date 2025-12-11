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
import { useState } from 'react';
import { useDebouncedCallback } from '../useDebouncedCallback';
import {
  Button,
  Card,
  Typography,
  Space,
  Alert,
  Input,
  Slider,
  Switch,
  Statistic,
  Row,
  Col,
  Badge,
  List,
  Divider,
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Interactive Demo Component for useDebouncedCallback
interface DebouncedCallbackDemoProps {
  delay: number;
  leading: boolean;
  trailing: boolean;
}

function DebouncedCallbackDemo({
  delay,
  leading,
  trailing,
}: DebouncedCallbackDemoProps) {
  const [callCount, setCallCount] = useState(0);
  const [debouncedCallCount, setDebouncedCallCount] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  const { run, cancel, isPending } = useDebouncedCallback(
    (value: string) => {
      setDebouncedCallCount(prev => prev + 1);
      const logEntry = {
        timestamp: new Date().toLocaleTimeString(),
        type: 'debounced',
        value,
        message: `Debounced callback executed with: "${value}"`,
      };
      setLogs(prev => [logEntry, ...prev.slice(0, 9)]);
    },
    { delay, leading, trailing },
  );

  const handleInputChange = (value: string) => {
    setCallCount(prev => prev + 1);
    setInputValue(value);

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type: 'input',
      value,
      message: `Input changed to: "${value}"`,
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 9)]);

    run(value);
  };

  const handleManualTrigger = () => {
    const value = `Manual trigger ${Date.now()}`;
    setCallCount(prev => prev + 1);
    setInputValue(value);

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type: 'manual',
      value,
      message: `Manual trigger: "${value}"`,
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 9)]);

    run(value);
  };

  const clearLogs = () => {
    setLogs([]);
    setCallCount(0);
    setDebouncedCallCount(0);
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'input':
        return 'blue';
      case 'manual':
        return 'orange';
      case 'debounced':
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: '100%', maxWidth: 1200 }}
    >
      <Card>
        <Title level={2}>🎯 useDebouncedCallback Interactive Demo</Title>
        <Paragraph>
          Experience debouncing in real-time. Type in the input field or click
          the button to trigger callbacks. Watch how the debounced execution
          responds to your configuration settings.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Configuration" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Delay: {delay}ms</Text>
                <Slider
                  min={100}
                  max={2000}
                  step={100}
                  value={delay}
                  disabled
                  tooltip={{ open: false }}
                />
              </div>

              <div>
                <Text strong>Leading Edge: </Text>
                <Switch checked={leading} disabled />
              </div>

              <div>
                <Text strong>Trailing Edge: </Text>
                <Switch checked={trailing} disabled />
              </div>

              <Divider />

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  onClick={handleManualTrigger}
                  // disabled={isPending()}
                  block
                >
                  {isPending() ? 'Pending...' : 'Trigger Manual Call'}
                </Button>

                <Button onClick={cancel} disabled={!isPending()} block>
                  Cancel Pending
                </Button>

                <Button onClick={clearLogs} danger block>
                  Clear Logs
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Live Statistics" size="small">
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Statistic
                  title="Total Calls"
                  value={callCount}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Debounced Calls"
                  value={debouncedCallCount}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Pending"
                  value={isPending() ? 'Yes' : 'No'}
                  valueStyle={{ color: isPending() ? '#faad14' : '#d9d9d9' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Efficiency"
                  value={
                    callCount > 0
                      ? Math.round((debouncedCallCount / callCount) * 100)
                      : 0
                  }
                  suffix="%"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="Input Field" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextArea
                placeholder="Type here to trigger debounced callbacks..."
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                rows={3}
              />
              <Text type="secondary">
                Each keystroke triggers a call, but only debounced executions
                count.
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Activity Log" size="small">
            <List
              size="small"
              dataSource={logs}
              renderItem={(item, index) => (
                <List.Item key={index}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Badge color={getLogColor(item.type)} />
                      <Text strong style={{ fontSize: '12px' }}>
                        {item.timestamp}
                      </Text>
                      <Text
                        type={
                          item.type === 'debounced' ? 'success' : 'secondary'
                        }
                        style={{ fontSize: '12px' }}
                      >
                        {item.type.toUpperCase()}
                      </Text>
                    </Space>
                    <Text ellipsis style={{ maxWidth: 250, fontSize: '12px' }}>
                      {item.message}
                    </Text>
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: 'No activity yet' }}
              style={{ maxHeight: 300, overflow: 'auto' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Alert
          message="Debouncing Behavior"
          description={
            <div>
              <p>
                <strong>Leading Edge ({leading ? 'ON' : 'OFF'}):</strong>{' '}
                {leading
                  ? 'Executes immediately on first call'
                  : 'No immediate execution'}
              </p>
              <p>
                <strong>Trailing Edge ({trailing ? 'ON' : 'OFF'}):</strong>{' '}
                {trailing
                  ? `Executes after ${delay}ms delay`
                  : 'No delayed execution'}
              </p>
              <p>
                <strong>Current Status:</strong>{' '}
                {isPending() ? `Waiting ${delay}ms...` : 'Ready'}
              </p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>
    </Space>
  );
}

const meta: Meta<typeof DebouncedCallbackDemo> = {
  title: 'React/Hooks/useDebouncedCallback',
  component: DebouncedCallbackDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A powerful React hook that provides debounced callback execution with configurable leading and trailing edge behavior. Perfect for optimizing performance in user interaction scenarios like search inputs, form validation, and window resizing.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    delay: {
      control: { type: 'range', min: 100, max: 2000, step: 100 },
      description: 'Delay in milliseconds before the callback executes',
    },
    leading: {
      control: 'boolean',
      description: 'Execute callback immediately on first call',
    },
    trailing: {
      control: 'boolean',
      description: 'Execute callback after delay on last call',
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
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default configuration with 500ms delay and trailing edge execution only.',
      },
    },
  },
};

export const LeadingEdge: Story = {
  args: {
    delay: 300,
    leading: true,
    trailing: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Leading edge execution - callback fires immediately, then debounces subsequent calls.',
      },
    },
  },
};

export const BothEdges: Story = {
  args: {
    delay: 800,
    leading: true,
    trailing: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Both leading and trailing edge execution - immediate execution followed by delayed execution if called again.',
      },
    },
  },
};

export const FastDebounce: Story = {
  args: {
    delay: 150,
    leading: false,
    trailing: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fast 150ms debounce for responsive interactions like search suggestions.',
      },
    },
  },
};

export const SlowDebounce: Story = {
  args: {
    delay: 1000,
    leading: false,
    trailing: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Slow 1000ms debounce for expensive operations like API calls or form submissions.',
      },
    },
  },
};
