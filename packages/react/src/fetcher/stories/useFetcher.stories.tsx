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
import React, { useState } from 'react';
import { useFetcher } from '../useFetcher';
import {
  Button,
  Card,
  List,
  Space,
  Typography,
  Form,
  Input,
  Select,
  Tabs,
  Alert,
  Badge,
  Statistic,
  Row,
  Col,
  Tag,
} from 'antd';
import { ResultExtractors } from '@ahoo-wang/fetcher';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Mock API endpoints for demonstration
const MOCK_ENDPOINTS = {
  users: 'https://jsonplaceholder.typicode.com/users',
  posts: 'https://jsonplaceholder.typicode.com/posts',
  todos: 'https://jsonplaceholder.typicode.com/todos',
};

// Enhanced Interactive Demo Component
const ComprehensiveFetcherDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('interactive');
  const [logs, setLogs] = useState<any[]>([]);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [form] = Form.useForm();

  // Main fetcher instance
  const { loading, result, error, execute, exchange, status } =
    useFetcher<any>({
      resultExtractor: ResultExtractors.Json,
      onSuccess: () => {
        const logEntry = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'success',
          method: exchange?.request.method,
          url: exchange?.request.url,
          status: '✅ Success',
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 9)]);
        setRequestHistory(prev => [logEntry, ...prev.slice(0, 9)]);
      },
      onError: e => {
        const logEntry = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          method: exchange?.request.method,
          url: exchange?.request.url,
          status: '❌ Failed',
          error: e?.message || String(e),
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 9)]);
        setRequestHistory(prev => [logEntry, ...prev.slice(0, 9)]);
      },
    });

  const handleRequest = async (values: any) => {
    const url = values.url || MOCK_ENDPOINTS.users;
    const request: any = {
      url,
      method: values.method || 'GET',
    };

    if (values.body && values.method !== 'GET') {
      try {
        request.body = JSON.parse(values.body);
      } catch {
        request.body = values.body;
      }
    }

    if (values.headers) {
      try {
        request.headers = JSON.parse(values.headers);
      } catch {
        request.headers = values.headers;
      }
    }

    await execute(request);
  };

  const clearLogs = () => {
    setLogs([]);
    setRequestHistory([]);
  };

  const loadPreset = (endpoint: string) => {
    form.setFieldsValue({
      url: endpoint,
      method: 'GET',
    });
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

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: '100%', maxWidth: 1200 }}
    >
      <Card>
        <Title level={2}>🚀 Comprehensive useFetcher Demo</Title>
        <Paragraph>
          Interactive demonstration of the useFetcher hook with advanced
          features including request history, error handling, and performance
          monitoring.
        </Paragraph>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane tab="🎯 Interactive Testing" key="interactive">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Request Configuration" size="small">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleRequest}
                  initialValues={{
                    url: MOCK_ENDPOINTS.users,
                    method: 'GET',
                    body: '{"title": "foo", "body": "bar", "userId": 1}',
                    headers: '{"Content-Type": "application/json"}',
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Quick Presets:</Text>
                      <Space style={{ marginTop: 8 }}>
                        {Object.entries(MOCK_ENDPOINTS).map(([key, url]) => (
                          <Button
                            key={key}
                            size="small"
                            onClick={() => loadPreset(url)}
                          >
                            {key.toUpperCase()}
                          </Button>
                        ))}
                      </Space>
                    </div>

                    <Form.Item label="URL" name="url">
                      <Input placeholder="Enter API endpoint URL" />
                    </Form.Item>

                    <Form.Item label="Method" name="method">
                      <Select>
                        <Option value="GET">GET</Option>
                        <Option value="POST">POST</Option>
                        <Option value="PUT">PUT</Option>
                        <Option value="DELETE">DELETE</Option>
                        <Option value="PATCH">PATCH</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Request Body (JSON)" name="body">
                      <Input.TextArea rows={3} placeholder='{"key": "value"}' />
                    </Form.Item>

                    <Form.Item label="Headers (JSON)" name="headers">
                      <Input.TextArea
                        rows={2}
                        placeholder='{"Authorization": "Bearer token"}'
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                    >
                      {loading ? 'Sending Request...' : 'Send Request'}
                    </Button>
                  </Space>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Response & Status" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Status: </Text>
                    <Badge
                      status={getStatusColor(status)}
                      text={status.toUpperCase()}
                    />
                  </div>

                  {result && (
                    <Alert
                      message="Success Response"
                      description="Response received successfully"
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
                </Space>
              </Card>

              <Card
                title="Request History"
                size="small"
                style={{ marginTop: 16 }}
              >
                <List
                  size="small"
                  dataSource={logs}
                  renderItem={(item, index) => (
                    <List.Item key={index}>
                      <Space>
                        <Text>{getStatusIcon(item.type)}</Text>
                        <Text>{item.timestamp}</Text>
                        <Tag color={item.type === 'success' ? 'green' : 'red'}>
                          {item.method}
                        </Tag>
                        <Text ellipsis style={{ maxWidth: 200 }}>
                          {item.url}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No requests yet' }}
                  style={{ maxHeight: 200, overflow: 'auto' }}
                />
                <Button
                  onClick={clearLogs}
                  size="small"
                  style={{ marginTop: 8 }}
                >
                  Clear History
                </Button>
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
                      title="Success Rate"
                      value={
                        requestHistory.length > 0
                          ? Math.round(
                              (requestHistory.filter(r => r.type === 'success')
                                .length /
                                requestHistory.length) *
                                100,
                            )
                          : 0
                      }
                      suffix="%"
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Recent Activity" size="small">
                <List
                  size="small"
                  dataSource={requestHistory.slice(0, 5)}
                  renderItem={(item, index) => (
                    <List.Item key={index}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Text>{getStatusIcon(item.type)}</Text>
                          <Text strong>{item.method}</Text>
                          <Text>{item.status}</Text>
                          <Text type="secondary">{item.timestamp}</Text>
                        </Space>
                        <Text ellipsis style={{ maxWidth: 300 }}>
                          {item.url}
                        </Text>
                        {item.error && (
                          <Text type="danger" style={{ fontSize: '12px' }}>
                            {item.error}
                          </Text>
                        )}
                      </Space>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No activity yet' }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Space>
  );
};

const meta: Meta<typeof ComprehensiveFetcherDemo> = {
  title: 'React/Hooks/useFetcher',
  component: ComprehensiveFetcherDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A powerful React hook for managing asynchronous fetch operations with comprehensive state handling, race condition protection, and advanced features like request history and performance monitoring.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ComprehensiveDemo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Complete interactive demonstration showcasing all useFetcher capabilities including request building, error handling, and performance monitoring.',
      },
    },
  },
};
