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

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Alert,
  List,
  Descriptions,
  Tabs,
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const DecoratorDemo: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3}>🏷️ Declarative API Decorators</Title>
        <Paragraph>
          Clean, type-safe HTTP service definitions using TypeScript decorators.
          Automatic parameter binding for paths, queries, headers, and request
          bodies.
        </Paragraph>
      </Card>

      <Alert
        message="✨ Key Benefits"
        description="Type-safe APIs, automatic parameter binding, declarative configuration, and clean service definitions."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="📋 Code Examples" size="small">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Basic Service Definition" key="1">
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
              {`import { NamedFetcher } from '@ahoo-wang/fetcher';
import {
  api,
  get,
  post,
  put,
  del,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';

// Register a named fetcher
const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
});

// Define service with decorators
@api('/users', { fetcher: 'api' })
class UserService {
  @get('/')
  getUsers(@query('limit') limit?: number): Promise<User[]> {
    throw new Error('Auto-generated method');
  }

  @get('/{id}')
  getUser(@path('id') id: number): Promise<User> {
    throw new Error('Auto-generated method');
  }

  @post('/')
  createUser(@body() user: Omit<User, 'id'>): Promise<User> {
    throw new Error('Auto-generated method');
  }
}

// Use the service
const userService = new UserService();
const users = await userService.getUsers(10);
const user = await userService.getUser(1);`}
            </pre>
          </TabPane>

          <TabPane tab="Parameter Types" key="2">
            <List
              size="small"
              dataSource={[
                '@path("id") - URL path parameters: /users/{id}',
                '@query("limit") - Query parameters: ?limit=10',
                '@body() - Request body (JSON)',
                '@header("Authorization") - HTTP headers',
                '@attribute("custom") - Interceptor attributes',
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </TabPane>

          <TabPane tab="HTTP Methods" key="3">
            <List
              size="small"
              dataSource={[
                '@get("/path") - GET requests',
                '@post("/path") - POST requests',
                '@put("/path") - PUT requests',
                '@del("/path") - DELETE requests',
                '@patch("/path") - PATCH requests',
                '@head("/path") - HEAD requests',
                '@options("/path") - OPTIONS requests',
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Card title="🏗️ Available Decorators" size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" hoverable>
              <Text strong>@api(basePath, options)</Text>
              <br />
              <Text type="secondary">
                Class decorator to define the base API path and configuration
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" hoverable>
              <Text strong>@get(path)</Text>
              <br />
              <Text type="secondary">Method decorator for GET requests</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" hoverable>
              <Text strong>@post(path)</Text>
              <br />
              <Text type="secondary">Method decorator for POST requests</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" hoverable>
              <Text strong>@put(path)</Text>
              <br />
              <Text type="secondary">Method decorator for PUT requests</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" hoverable>
              <Text strong>@del(path)</Text>
              <br />
              <Text type="secondary">Method decorator for DELETE requests</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" hoverable>
              <Text strong>@path(param)</Text>
              <br />
              <Text type="secondary">
                Parameter decorator for URL path variables
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" hoverable>
              <Text strong>@query(param)</Text>
              <br />
              <Text type="secondary">
                Parameter decorator for query parameters
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" hoverable>
              <Text strong>@body()</Text>
              <br />
              <Text type="secondary">Parameter decorator for request body</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>Key Features</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <div>
                <Tag color="blue">🏗️ Class-based APIs</Tag>
                <Text> Define HTTP services as TypeScript classes</Text>
              </div>
              <div>
                <Tag color="green">🔗 Auto Parameter Binding</Tag>
                <Text> Automatic mapping of parameters to HTTP elements</Text>
              </div>
              <div>
                <Tag color="orange">📝 Type Safety</Tag>
                <Text> Full TypeScript support with inferred types</Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <div>
                <Tag color="purple">⚙️ Declarative Config</Tag>
                <Text> Configure APIs using intuitive decorators</Text>
              </div>
              <div>
                <Tag color="red">🔄 Interceptor Support</Tag>
                <Text> Works seamlessly with Fetcher interceptors</Text>
              </div>
              <div>
                <Tag color="cyan">📚 IDE Support</Tag>
                <Text> Excellent autocomplete and refactoring support</Text>
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
              key: 'metadata',
              label: 'Metadata Collection',
              children:
                'Decorators collect configuration metadata at class and method levels, stored using reflect-metadata.',
            },
            {
              key: 'parameter-binding',
              label: 'Parameter Binding',
              children:
                'Method parameters are automatically mapped to HTTP elements (paths, queries, headers, body) based on decorators.',
            },
            {
              key: 'request-execution',
              label: 'Request Execution',
              children:
                'The RequestExecutor processes decorated methods, builds HTTP requests, and executes them through Fetcher.',
            },
            {
              key: 'type-inference',
              label: 'Type Inference',
              children:
                'TypeScript compiler infers return types and parameter types from decorator metadata and interface definitions.',
            },
          ]}
        />
      </Card>

      <Alert
        message="⚠️ TypeScript Configuration Required"
        description='Decorators are an experimental TypeScript feature. Ensure your tsconfig.json includes: "experimentalDecorators": true and "emitDecoratorMetadata": true.'
        type="warning"
        showIcon
      />
    </Space>
  );
};

const meta: Meta = {
  title: 'Decorator/Declarative APIs',
  parameters: {
    docs: {
      description: {
        component:
          'Fetcher decorators provide a clean, declarative way to define HTTP services with automatic parameter binding and type safety.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <DecoratorDemo />,
};
