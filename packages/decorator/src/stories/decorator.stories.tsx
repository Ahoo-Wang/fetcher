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

// Demo component showing decorator usage examples
const DecoratorDemo: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Decorator API Documentation</h2>
      <p>
        The Fetcher decorator package provides a clean, declarative way to
        define HTTP services with automatic parameter binding and type safety.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <h3>Key Features</h3>
        <ul>
          <li>
            <strong>Class-based service definitions</strong> - Define APIs as
            TypeScript classes
          </li>
          <li>
            <strong>Automatic parameter binding</strong> - Path, query, header,
            and body parameters are automatically bound
          </li>
          <li>
            <strong>Type-safe method implementations</strong> - Full TypeScript
            support with inferred types
          </li>
          <li>
            <strong>Decorator-driven configuration</strong> - Use decorators to
            configure HTTP methods and endpoints
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Example Usage</h3>
        <pre
          style={{
            background: '#f6f8fa',
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
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
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Available Decorators</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
          }}
        >
          <div
            style={{
              padding: '10px',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
            }}
          >
            <strong>@api(basePath, options)</strong>
            <p>Class decorator to define the base API path and configuration</p>
          </div>
          <div
            style={{
              padding: '10px',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
            }}
          >
            <strong>@get(path)</strong>
            <p>Method decorator for GET requests</p>
          </div>
          <div
            style={{
              padding: '10px',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
            }}
          >
            <strong>@post(path)</strong>
            <p>Method decorator for POST requests</p>
          </div>
          <div
            style={{
              padding: '10px',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
            }}
          >
            <strong>@put(path)</strong>
            <p>Method decorator for PUT requests</p>
          </div>
          <div
            style={{
              padding: '10px',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
            }}
          >
            <strong>@del(path)</strong>
            <p>Method decorator for DELETE requests</p>
          </div>
          <div
            style={{
              padding: '10px',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
            }}
          >
            <strong>@path(param)</strong>
            <p>Parameter decorator for URL path variables</p>
          </div>
          <div
            style={{
              padding: '10px',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
            }}
          >
            <strong>@query(param)</strong>
            <p>Parameter decorator for query parameters</p>
          </div>
          <div
            style={{
              padding: '10px',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
            }}
          >
            <strong>@body()</strong>
            <p>Parameter decorator for request body</p>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '14px', color: '#666' }}>
        <p>
          <strong>Note:</strong> Decorators are a TypeScript experimental
          feature. Make sure your tsconfig.json includes
          "experimentalDecorators": true and "emitDecoratorMetadata": true.
        </p>
      </div>
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
