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

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card,
  Typography,
  Space,
  Button,
  Input,
  Row,
  Col,
  Tag,
  Alert,
  List,
  Descriptions,
  Tabs,
} from 'antd';
import { Fetcher } from '../fetcher';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const FetcherDemo: React.FC = () => {
  const [response, setResponse] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleBasicRequest = async () => {
    try {
      setLoading(true);
      addLog('Making basic GET request...');
      const fetcher = new Fetcher({
        baseURL: 'https://jsonplaceholder.typicode.com',
      });

      const response = await fetcher.get('/posts/1');
      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
      addLog('Basic request completed successfully');
    } catch (error) {
      addLog(`Request failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlParamsRequest = async () => {
    try {
      setLoading(true);
      addLog('Making request with URL parameters...');
      const fetcher = new Fetcher({
        baseURL: 'https://jsonplaceholder.typicode.com',
      });

      const response = await fetcher.get('/posts/{id}', {
        urlParams: {
          path: { id: 2 },
          query: { userId: 1 },
        },
      });
      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
      addLog('URL parameters request completed');
    } catch (error) {
      addLog(`Request failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePostRequest = async () => {
    try {
      setLoading(true);
      addLog('Making POST request...');
      const fetcher = new Fetcher({
        baseURL: 'https://jsonplaceholder.typicode.com',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await fetcher.post('/posts', {
        body: {
          title: 'New Post',
          body: 'This is a test post',
          userId: 1,
        },
      });
      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
      addLog('POST request completed');
    } catch (error) {
      addLog(`Request failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeoutRequest = async () => {
    try {
      setLoading(true);
      addLog('Making request with timeout...');
      const fetcher = new Fetcher({
        baseURL: 'https://httpbin.org',
        timeout: 1000, // 1 second timeout
      });

      const response = await fetcher.get('/delay/2'); // 2 second delay
      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
      addLog('Timeout test completed');
    } catch (error) {
      setResponse(`Timeout Error: ${error}`);
      addLog(`Request timed out as expected: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3}>🌐 Fetcher HTTP Client</Title>
        <Paragraph>
          Lightweight HTTP client built on the native Fetch API with interceptor
          support, URL parameter interpolation, timeout handling, and extensible
          architecture.
        </Paragraph>
      </Card>

      <Alert
        message="🚀 Key Features"
        description="URL templating, interceptor chain, timeout control, header management, and result extraction."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card title="📡 Basic Request" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Simple GET request with base URL</Text>
              <Button
                onClick={handleBasicRequest}
                type="primary"
                block
                loading={loading}
              >
                Basic GET
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title="🔗 URL Parameters" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Path and query parameter interpolation</Text>
              <Button
                onClick={handleUrlParamsRequest}
                type="primary"
                block
                loading={loading}
              >
                URL Params
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title="📝 POST Request" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>POST with JSON body and headers</Text>
              <Button
                onClick={handlePostRequest}
                type="primary"
                block
                loading={loading}
              >
                POST Data
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title="⏱️ Timeout" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Request timeout handling</Text>
              <Button
                onClick={handleTimeoutRequest}
                type="primary"
                block
                loading={loading}
              >
                Test Timeout
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="📋 Code Examples" size="small">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Basic Usage" key="1">
            <pre
              style={{
                background: '#f6f8fa',
                border: '1px solid #d1d9e0',
                borderRadius: '6px',
                padding: '16px',
                overflow: 'auto',
                fontFamily:
                  'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                fontSize: '14px',
              }}
            >
              {`// Create fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000
});

// Make requests
const response = await fetcher.get('/users/{id}', {
  urlParams: { path: { id: 123 } }
});

const data = await response.json();`}
            </pre>
          </TabPane>

          <TabPane tab="URL Parameters" key="2">
            <pre
              style={{
                background: '#f6f8fa',
                border: '1px solid #d1d9e0',
                borderRadius: '6px',
                padding: '16px',
                overflow: 'auto',
                fontFamily:
                  'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                fontSize: '14px',
              }}
            >
              {`// Path parameters
await fetcher.get('/users/{id}/posts/{postId}', {
  urlParams: {
    path: { id: 123, postId: 456 }
  }
});

// Query parameters
await fetcher.get('/search', {
  urlParams: {
    query: { q: 'typescript', limit: 10 }
  }
});

// Mixed parameters
await fetcher.get('/users/{id}', {
  urlParams: {
    path: { id: 123 },
    query: { include: 'posts,comments' }
  }
});`}
            </pre>
          </TabPane>

          <TabPane tab="HTTP Methods" key="3">
            <List
              size="small"
              dataSource={[
                'GET - fetcher.get(url, options)',
                'POST - fetcher.post(url, options)',
                'PUT - fetcher.put(url, options)',
                'DELETE - fetcher.delete(url, options)',
                'PATCH - fetcher.patch(url, options)',
                'HEAD - fetcher.head(url, options)',
                'OPTIONS - fetcher.options(url, options)',
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Card title="📊 Response" size="small">
        <TextArea
          rows={8}
          value={response}
          readOnly
          placeholder="API responses will appear here..."
        />
      </Card>

      <Card title="Activity Log" size="small">
        <TextArea
          rows={6}
          value={logs.join('\n')}
          readOnly
          placeholder="Request logs will appear here..."
        />
      </Card>

      <Card>
        <Title level={4}>Key Features</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <div>
                <Tag color="blue">🔗 URL Templating</Tag>
                <Text> Path and query parameter interpolation</Text>
              </div>
              <div>
                <Tag color="green">🛡️ Interceptors</Tag>
                <Text> Request/response processing pipeline</Text>
              </div>
              <div>
                <Tag color="orange">⏱️ Timeout Control</Tag>
                <Text> Configurable request timeouts</Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <div>
                <Tag color="purple">📋 Header Management</Tag>
                <Text> Global and per-request headers</Text>
              </div>
              <div>
                <Tag color="red">🔄 Result Extraction</Tag>
                <Text> Flexible response processing</Text>
              </div>
              <div>
                <Tag color="cyan">🏗️ Extensible</Tag>
                <Text> Plugin architecture for customization</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>Architecture Overview</Title>
        <Descriptions
          bordered
          size="small"
          column={1}
          items={[
            {
              key: 'interceptors',
              label: 'Interceptors',
              children:
                'Middleware system for request/response processing. Supports request transformation, authentication, logging, and error handling.',
            },
            {
              key: 'urlBuilder',
              label: 'URL Builder',
              children:
                'Handles URL construction with base URLs, path parameters, and query string generation using configurable template styles.',
            },
            {
              key: 'exchange',
              label: 'Exchange',
              children:
                'Core request processing unit that encapsulates request, response, and metadata. Flows through the interceptor chain.',
            },
            {
              key: 'resultExtractor',
              label: 'Result Extractor',
              children:
                'Configurable component that determines what to return from requests - Response object, JSON data, or custom formats.',
            },
          ]}
        />
      </Card>
    </Space>
  );
};

const meta: Meta = {
  title: 'Fetcher/Core HTTP Client',
  parameters: {
    docs: {
      description: {
        component:
          'Modern, lightweight HTTP client built on the native Fetch API with TypeScript-first design. Features interceptor support, URL templating, timeout control, and extensible architecture.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <FetcherDemo />,
};
