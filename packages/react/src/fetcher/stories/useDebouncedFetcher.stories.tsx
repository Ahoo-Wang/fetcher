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
import { useDebouncedFetcher } from '../useDebouncedFetcher';
import { ResultExtractors } from '@ahoo-wang/fetcher';
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
  Tabs,
  Tag,
  Progress,
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Mock API endpoints for demonstration
const MOCK_ENDPOINTS = {
  users: 'https://jsonplaceholder.typicode.com/users',
  posts: 'https://jsonplaceholder.typicode.com/posts',
  todos: 'https://jsonplaceholder.typicode.com/todos',
  comments: 'https://jsonplaceholder.typicode.com/comments',
};

// Interactive Demo Component for useDebouncedFetcher
interface DebouncedFetcherDemoProps {
  delay: number;
  leading: boolean;
  trailing: boolean;
}

function DebouncedFetcherDemo({
  delay,
  leading,
  trailing,
}: DebouncedFetcherDemoProps) {
  const [activeTab, setActiveTab] = useState('interactive');
  const [logs, setLogs] = useState<any[]>([]);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState(
    MOCK_ENDPOINTS.users,
  );

  // Main debounced fetcher instance
  const { loading, result, error, status, exchange, run, cancel, isPending } =
    useDebouncedFetcher<any>({
      resultExtractor: ResultExtractors.Json,
      debounce: { delay, leading, trailing },
      onSuccess: data => {
        const logEntry = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'success',
          method: exchange?.request.method,
          url: exchange?.request.url,
          status: '✅ Success',
          dataLength: Array.isArray(data) ? data.length : 1,
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 9)]);
        setRequestHistory(prev => [logEntry, ...prev.slice(0, 9)]);
      },
      onError: err => {
        const logEntry = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          method: exchange?.request.method,
          url: exchange?.request.url,
          status: '❌ Failed',
          error: err?.message || String(err),
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 9)]);
        setRequestHistory(prev => [logEntry, ...prev.slice(0, 9)]);
      },
    });

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim()) {
      // Simulate search API with query parameter
      const searchUrl = `${selectedEndpoint}?q=${encodeURIComponent(query)}`;
      run({
        url: searchUrl,
        method: 'GET',
      });
    } else {
      cancel(); // Cancel any pending search if query is empty
    }
  };

  const handleEndpointChange = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    setSearchQuery('');

    // Load initial data for the selected endpoint
    run({
      url: endpoint,
      method: 'GET',
    });
  };

  const handleManualRequest = (method: string = 'GET') => {
    const request: any = {
      url: selectedEndpoint,
      method,
    };

    if (method === 'POST' && searchQuery.trim()) {
      request.body = JSON.stringify({
        title: searchQuery,
        body: `Created at ${new Date().toISOString()}`,
        userId: 1,
      });
      request.headers = { 'Content-Type': 'application/json' };
    }

    run(request);
  };

  const clearLogs = () => {
    setLogs([]);
    setRequestHistory([]);
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
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'search':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'blue';
      case 'POST':
        return 'green';
      case 'PUT':
        return 'orange';
      case 'DELETE':
        return 'red';
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
        <Title level={2}>🌐 useDebouncedFetcher Interactive Demo</Title>
        <Paragraph>
          Experience debounced HTTP requests in real-time. Search through
          different API endpoints, watch requests being debounced, and monitor
          performance with comprehensive request history.
        </Paragraph>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane tab="🔍 Search Demo" key="interactive">
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

                  <Divider />

                  <div>
                    <Text strong>API Endpoint:</Text>
                    <Select
                      value={selectedEndpoint}
                      onChange={handleEndpointChange}
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      {Object.entries(MOCK_ENDPOINTS).map(([key, url]) => (
                        <Option key={key} value={url}>
                          {key.toUpperCase()}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      onClick={() => handleManualRequest('GET')}
                      loading={loading}
                      disabled={isPending()}
                      block
                    >
                      {loading ? 'Fetching...' : 'GET Request'}
                    </Button>

                    <Button
                      onClick={() => handleManualRequest('POST')}
                      disabled={isPending()}
                      block
                    >
                      POST Request
                    </Button>

                    <Button onClick={cancel} disabled={!isPending()} block>
                      Cancel Pending
                    </Button>

                    <Button onClick={clearLogs} danger block>
                      Clear History
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Search Input" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder="Type to search (debounced API calls)..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    allowClear
                  />

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
                        title="Total Requests"
                        value={requestHistory.length}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Success Rate"
                        value={
                          requestHistory.length > 0
                            ? Math.round(
                                (requestHistory.filter(
                                  r => r.type === 'success',
                                ).length /
                                  requestHistory.length) *
                                  100,
                              )
                            : 0
                        }
                        suffix="%"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Response & Status" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {result && (
                    <Alert
                      message="Success Response"
                      description={`Received ${Array.isArray(result) ? result.length : 1} item(s)`}
                      type="success"
                      showIcon
                    />
                  )}

                  {error && (
                    <Alert
                      message="Error Response"
                      description={error.message}
                      type="error"
                      showIcon
                    />
                  )}

                  {!result && !error && (
                    <Alert
                      message="Ready"
                      description="Make a request to see results"
                      type="info"
                      showIcon
                    />
                  )}
                </Space>
              </Card>

              <Card
                title="Request History"
                size="small"
                style={{ marginTop: 16 }}
              >
                <List
                  size="small"
                  dataSource={logs.slice(0, 5)}
                  renderItem={(item, index) => (
                    <List.Item key={index}>
                      <Space>
                        <Badge color={getLogColor(item.type)} />
                        <Text>{item.timestamp}</Text>
                        <Tag color={getMethodColor(item.method || 'GET')}>
                          {item.method || 'GET'}
                        </Tag>
                        <Text ellipsis style={{ maxWidth: 150 }}>
                          {item.url}
                        </Text>
                        <Text
                          type={item.type === 'success' ? 'success' : 'danger'}
                        >
                          {item.status}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No requests yet' }}
                  style={{ maxHeight: 200, overflow: 'auto' }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="📊 Performance Metrics" key="metrics">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Request Statistics" size="small">
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Statistic
                      title="Total Requests"
                      value={requestHistory.length}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Success Count"
                      value={
                        requestHistory.filter(r => r.type === 'success').length
                      }
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Error Count"
                      value={
                        requestHistory.filter(r => r.type === 'error').length
                      }
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Avg Response Size"
                      value={
                        requestHistory.length > 0
                          ? Math.round(
                              requestHistory
                                .filter(r => r.dataLength)
                                .reduce(
                                  (sum, r) => sum + (r.dataLength || 0),
                                  0,
                                ) /
                                requestHistory.filter(r => r.dataLength).length,
                            )
                          : 0
                      }
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Debouncing Effectiveness" size="small">
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Statistic
                      title="Debounce Delay"
                      value={delay}
                      suffix="ms"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Leading Edge"
                      value={leading ? 'ON' : 'OFF'}
                      valueStyle={{ color: leading ? '#52c41a' : '#d9d9d9' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Trailing Edge"
                      value={trailing ? 'ON' : 'OFF'}
                      valueStyle={{ color: trailing ? '#52c41a' : '#d9d9d9' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Current Status"
                      value={isPending() ? 'Pending' : 'Ready'}
                      valueStyle={{
                        color: isPending() ? '#faad14' : '#52c41a',
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card title="Recent Activity" size="small" style={{ marginTop: 16 }}>
            <List
              size="small"
              dataSource={requestHistory.slice(0, 10)}
              renderItem={(item, index) => (
                <List.Item key={index}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Badge color={getLogColor(item.type)} />
                      <Text strong>{item.method}</Text>
                      <Text>{item.status}</Text>
                      <Text type="secondary">{item.timestamp}</Text>
                    </Space>
                    <Text ellipsis style={{ maxWidth: 400 }}>
                      {item.url}
                    </Text>
                    {item.error && (
                      <Text type="danger" style={{ fontSize: '12px' }}>
                        {item.error}
                      </Text>
                    )}
                    {item.dataLength && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {item.dataLength} items returned
                      </Text>
                    )}
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: 'No activity yet' }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Card>
        <Alert
          message="Debounced HTTP Fetching"
          description={
            <div>
              <p>
                <strong>Search Optimization:</strong> Rapid typing triggers
                debounced API calls, preventing excessive requests.
              </p>
              <p>
                <strong>Request Management:</strong> Automatic cancellation of
                pending requests when new searches begin.
              </p>
              <p>
                <strong>Performance Monitoring:</strong> Track request success
                rates, response sizes, and debouncing effectiveness.
              </p>
              <p>
                <strong>Current Configuration:</strong> {delay}ms delay,
                Leading: {leading ? 'ON' : 'OFF'}, Trailing:{' '}
                {trailing ? 'ON' : 'OFF'}
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

const meta: Meta<typeof DebouncedFetcherDemo> = {
  title: 'React/Hooks/useDebouncedFetcher',
  component: DebouncedFetcherDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Combines HTTP fetching with debouncing for optimal API performance. Perfect for search interfaces, autocomplete, and any scenario requiring rate-limited network requests with comprehensive error handling and request lifecycle management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    delay: {
      control: { type: 'range', min: 200, max: 2000, step: 200 },
      description: 'Debounce delay in milliseconds before API requests',
    },
    leading: {
      control: 'boolean',
      description: 'Execute request immediately on first call',
    },
    trailing: {
      control: 'boolean',
      description: 'Execute request after delay on last call',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchInterface: Story = {
  args: {
    delay: 300,
    leading: false,
    trailing: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Classic search interface with 300ms debounce - perfect for user experience without overwhelming the API.',
      },
    },
  },
};

export const FastResponse: Story = {
  args: {
    delay: 150,
    leading: false,
    trailing: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fast 150ms debounce for responsive autocomplete and instant search features.',
      },
    },
  },
};

export const LeadingEdgeExecution: Story = {
  args: {
    delay: 500,
    leading: true,
    trailing: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Leading edge execution - first request happens immediately, subsequent requests are debounced.',
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
          'Slow 1000ms debounce for expensive operations or rate-limited APIs.',
      },
    },
  },
};

export const BalancedApproach: Story = {
  args: {
    delay: 400,
    leading: true,
    trailing: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Balanced approach with both leading and trailing edge execution for comprehensive user interaction handling.',
      },
    },
  },
};
