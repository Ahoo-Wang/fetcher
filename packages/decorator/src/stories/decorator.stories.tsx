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
import React from 'react';
import { Typography, Card, Row, Col, Space } from 'antd';

// Demo component showing decorator usage examples
const DecoratorDemo: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Typography.Title level={2}>
            Decorator API Documentation
          </Typography.Title>
          <Typography.Paragraph>
            The Fetcher decorator package provides a clean, declarative way to
            define HTTP services with automatic parameter binding and type
            safety.
          </Typography.Paragraph>
        </div>

        <Card>
          <Typography.Title level={3}>Key Features</Typography.Title>
          <ul style={{ paddingLeft: '20px' }}>
            <li>
              <strong>Class-based service definitions</strong> - Define APIs as
              TypeScript classes
            </li>
            <li>
              <strong>Automatic parameter binding</strong> - Path, query,
              header, and body parameters are automatically bound
            </li>
            <li>
              <strong>Type-safe method implementations</strong> - Full
              TypeScript support with inferred types
            </li>
            <li>
              <strong>Decorator-driven configuration</strong> - Use decorators
              to configure HTTP methods and endpoints
            </li>
          </ul>
        </Card>

        <Card>
          <Typography.Title level={3}>Example Usage</Typography.Title>
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
              lineHeight: '1.4',
            }}
          >{`import { NamedFetcher } from '@ahoo-wang/fetcher';
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

  @put('/{id}')
  updateUser(@path('id') id: number, @body() user: Partial<User>): Promise<User> {
    throw new Error('Auto-generated method');
  }

  @del('/{id}')
  deleteUser(@path('id') id: number): Promise<void> {
    throw new Error('Auto-generated method');
  }
}

// Use the service
const userService = new UserService();
const users = await userService.getUsers(10);
const user = await userService.getUser(1);`}</pre>
        </Card>

        <Card>
          <Typography.Title level={3}>Available Decorators</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" hoverable>
                <Typography.Text strong>
                  @api(basePath, options)
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Class decorator to define the base API path and configuration
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" hoverable>
                <Typography.Text strong>@get(path)</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Method decorator for GET requests
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" hoverable>
                <Typography.Text strong>@post(path)</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Method decorator for POST requests
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" hoverable>
                <Typography.Text strong>@put(path)</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Method decorator for PUT requests
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" hoverable>
                <Typography.Text strong>@del(path)</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Method decorator for DELETE requests
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" hoverable>
                <Typography.Text strong>@path(param)</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Parameter decorator for URL path variables
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" hoverable>
                <Typography.Text strong>@query(param)</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Parameter decorator for query parameters
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" hoverable>
                <Typography.Text strong>@body()</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Parameter decorator for request body
                </Typography.Text>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card>
          <Typography.Text type="secondary">
            <strong>Note:</strong> Decorators are a TypeScript experimental
            feature. Make sure your tsconfig.json includes
            "experimentalDecorators": true and "emitDecoratorMetadata": true.
          </Typography.Text>
        </Card>
      </Space>
    </div>
  );
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Decorator/Decorator',
  component: DecoratorDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Fetcher decorators provide a clean, declarative way to define HTTP services with automatic parameter binding and type safety.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DecoratorDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const BasicUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates basic usage of Fetcher decorators for creating type-safe API services.',
      },
    },
  },
};
