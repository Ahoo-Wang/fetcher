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
import { useDebouncedExecutePromise } from '../useDebouncedExecutePromise';
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
  Select,
  Progress,
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Interactive Demo Component for useDebouncedExecutePromise
interface DebouncedExecutePromiseDemoProps {
  delay: number;
  leading: boolean;
  trailing: boolean;
  scenario: 'success' | 'error' | 'slow' | 'random';
}

function DebouncedExecutePromiseDemo({
  delay,
  leading,
  trailing,
  scenario,
}: DebouncedExecutePromiseDemoProps) {
  const [callCount, setCallCount] = useState(0);
  const [executionCount, setExecutionCount] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Create promise factory based on scenario
  const createPromise = (value: string) => {
    return async () => {
      const startTime = Date.now();

      switch (scenario) {
        case 'success':
          await new Promise(resolve => setTimeout(resolve, 1000));
          return {
            success: true,
            data: `Processed: ${value}`,
            duration: Date.now() - startTime,
          };

        case 'error':
          await new Promise(resolve => setTimeout(resolve, 800));
          throw new Error(`Failed to process: ${value}`);

        case 'slow':
          await new Promise(resolve => setTimeout(resolve, 3000));
          return {
            success: true,
            data: `Slow processed: ${value}`,
            duration: Date.now() - startTime,
          };

        case 'random':
          await new Promise(resolve =>
            setTimeout(resolve, 500 + Math.random() * 1500),
          );
          if (Math.random() > 0.7) {
            throw new Error(`Random failure for: ${value}`);
          }
          return {
            success: true,
            data: `Random success: ${value}`,
            duration: Date.now() - startTime,
          };

        default:
          await new Promise(resolve => setTimeout(resolve, 1000));
          return {
            success: true,
            data: `Default: ${value}`,
            duration: Date.now() - startTime,
          };
      }
    };
  };

  const { loading, result, error, status, run, cancel, isPending, reset } =
    useDebouncedExecutePromise({
      debounce: { delay, leading, trailing },
      onSuccess: data => {
        const logEntry = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'success',
          value: inputValue,
          message: `Promise resolved: ${JSON.stringify(data)}`,
          data,
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 9)]);
      },
      onError: err => {
        const logEntry = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          value: inputValue,
          message: `Promise rejected: ${err.message}`,
          error: err.message,
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 9)]);
      },
    });

  const handleInputChange = (value: string) => {
    setCallCount(prev => prev + 1);
    setInputValue(value);

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type: 'input',
      value,
      message: `Input changed, triggering debounced promise...`,
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 9)]);

    run(createPromise(value));
  };

  const handleManualTrigger = () => {
    const value = `Manual ${Date.now()}`;
    setCallCount(prev => prev + 1);
    setInputValue(value);

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type: 'manual',
      value,
      message: `Manual trigger initiated...`,
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 9)]);

    run(createPromise(value));
    setExecutionCount(prev => prev + 1);
  };

  const clearLogs = () => {
    setLogs([]);
    setCallCount(0);
    setExecutionCount(0);
    reset();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'default';
      case 'loading':
        return 'processing';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'input':
        return 'blue';
      case 'manual':
        return 'orange';
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'default';
    }
  };

  const getScenarioDescription = () => {
    switch (scenario) {
      case 'success':
        return 'Always succeeds after 1 second';
      case 'error':
        return 'Always fails after 0.8 seconds';
      case 'slow':
        return 'Succeeds after 3 seconds (slow operation)';
      case 'random':
        return '70% success rate, random duration (0.5-2s)';
      default:
        return 'Default behavior';
    }
  };

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: '100%', maxWidth: 1200 }}
    >
      <Card>
        <Title level={2}>⚡ useDebouncedExecutePromise Interactive Demo</Title>
        <Paragraph>
          Combine promise execution with debouncing. Watch how rapid input
          changes are debounced while maintaining proper promise lifecycle
          management. Try different scenarios to see error handling and loading
          states.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Configuration" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Debounce Delay: {delay}ms</Text>
                <Slider
                  min={200}
                  max={2000}
                  step={200}
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

              <div>
                <Text strong>Scenario: </Text>
                <Select value={scenario} disabled style={{ width: '100%' }}>
                  <Option value="success">Success</Option>
                  <Option value="error">Error</Option>
                  <Option value="slow">Slow</Option>
                  <Option value="random">Random</Option>
                </Select>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {getScenarioDescription()}
                </Text>
              </div>

              <Divider />

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  onClick={handleManualTrigger}
                  loading={loading}
                  disabled={isPending()}
                  block
                >
                  {loading ? 'Executing...' : 'Trigger Promise'}
                </Button>

                <Button onClick={cancel} disabled={!isPending()} block>
                  Cancel Pending
                </Button>

                <Button onClick={reset} disabled={status === 'idle'} block>
                  Reset State
                </Button>

                <Button onClick={clearLogs} danger block>
                  Clear Logs
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Promise Status" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Status: </Text>
                <Badge
                  status={getStatusColor(status)}
                  text={status.toUpperCase()}
                />
              </div>

              <div>
                <Text strong>Debounce Pending: </Text>
                <Badge
                  status={isPending() ? 'processing' : 'default'}
                  text={isPending() ? 'YES' : 'NO'}
                />
              </div>

              {loading && (
                <Progress
                  percent={100}
                  status="active"
                  showInfo={false}
                  size="small"
                  strokeColor="#1890ff"
                />
              )}

              <Divider />

              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Statistic
                    title="Input Changes"
                    value={callCount}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Executions"
                    value={executionCount}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Space>
          </Card>

          <Card title="Input Field" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextArea
                placeholder="Type here to trigger debounced promises..."
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                rows={3}
              />
              <Text type="secondary">
                Each change triggers a debounced promise execution.
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Results" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {result ? (
                <Alert
                  message="Success Result"
                  description={
                    <pre style={{ fontSize: '12px', margin: 0 }}>
                      {(() => {
                        try {
                          return typeof result === 'object' && result !== null
                            ? JSON.stringify(result, null, 2)
                            : String(result);
                        } catch {
                          return String(result);
                        }
                      })()}
                    </pre>
                  }
                  type="success"
                  showIcon
                />
              ) : null}

              {error && (
                <Alert
                  message="Error Result"
                  description={error.message}
                  type="error"
                  showIcon
                />
              )}

              {!result && !error && (
                <Alert
                  message="No Result"
                  description="Trigger a promise to see results here"
                  type="info"
                  showIcon
                />
              )}
            </Space>
          </Card>

          <Card title="Activity Log" size="small" style={{ marginTop: 16 }}>
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
                          item.type === 'success'
                            ? 'success'
                            : item.type === 'error'
                              ? 'danger'
                              : 'secondary'
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
              style={{ maxHeight: 250, overflow: 'auto' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Alert
          message="Debounced Promise Behavior"
          description={
            <div>
              <p>
                <strong>Debouncing:</strong> Rapid input changes are debounced
                to prevent excessive promise executions.
              </p>
              <p>
                <strong>Promise Lifecycle:</strong> Each execution goes through
                loading → success/error states.
              </p>
              <p>
                <strong>Cancellation:</strong> Pending debounced executions can
                be cancelled before they run.
              </p>
              <p>
                <strong>Current State:</strong>{' '}
                {isPending()
                  ? `Debounce pending (${delay}ms)...`
                  : 'Ready for input'}
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

const meta: Meta<typeof DebouncedExecutePromiseDemo> = {
  title: 'React/Hooks/useDebouncedExecutePromise',
  component: DebouncedExecutePromiseDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Combines promise execution with debouncing for optimal performance. Perfect for search APIs, form validation, and any scenario where you want to debounce asynchronous operations while maintaining proper loading states and error handling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    delay: {
      control: { type: 'range', min: 200, max: 2000, step: 200 },
      description: 'Debounce delay in milliseconds',
    },
    leading: {
      control: 'boolean',
      description: 'Execute promise immediately on first call',
    },
    trailing: {
      control: 'boolean',
      description: 'Execute promise after delay on last call',
    },
    scenario: {
      control: { type: 'select' },
      options: ['success', 'error', 'slow', 'random'],
      description: 'Promise execution scenario for testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SuccessScenario: Story = {
  args: {
    delay: 500,
    leading: false,
    trailing: true,
    scenario: 'success',
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard success scenario with 500ms debounce delay.',
      },
    },
  },
};

export const ErrorHandling: Story = {
  args: {
    delay: 300,
    leading: false,
    trailing: true,
    scenario: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling with debounced promise execution.',
      },
    },
  },
};

export const SlowOperation: Story = {
  args: {
    delay: 800,
    leading: false,
    trailing: true,
    scenario: 'slow',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Slow promise execution (3 seconds) with debouncing to prevent multiple concurrent requests.',
      },
    },
  },
};

export const RandomScenario: Story = {
  args: {
    delay: 400,
    leading: false,
    trailing: true,
    scenario: 'random',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Random success/failure with variable timing to test robust error handling.',
      },
    },
  },
};

export const LeadingEdge: Story = {
  args: {
    delay: 600,
    leading: true,
    trailing: false,
    scenario: 'success',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Leading edge execution - promise runs immediately, then debounces subsequent calls.',
      },
    },
  },
};
