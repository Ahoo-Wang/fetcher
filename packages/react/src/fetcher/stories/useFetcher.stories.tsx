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
import { useFetcher } from '../useFetcher';
import { Button, Card, Typography, Space, Alert } from 'antd';
import { ResultExtractors } from '@ahoo-wang/fetcher';

const { Title, Text } = Typography;

// Mock API response component
interface MockApiResponseProps {
  url: string;
  timeout?: number;
}

function MockApiResponse({ url, timeout = 5000 }: MockApiResponseProps) {
  const { loading, result, error, execute } = useFetcher<unknown>({ resultExtractor: ResultExtractors.Json });

  const handleFetch = () => {
    execute({
      url,
      method: 'GET',
      timeout,
    });
  };

  return (
    <Card title="useFetcher Demo" style={{ width: 400 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          type="primary"
          onClick={handleFetch}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Fetch Data'}
        </Button>

        {result !== undefined && (
          <Alert
            message="Success"
            description={<pre>{JSON.stringify(result, null, 2)}</pre>}
            type="success"
            showIcon
          />
        )}

        {error && (
          <Alert
            message="Error"
            description={error.message}
            type="error"
            showIcon
          />
        )}

        <Text type="secondary">
          This demonstrates the useFetcher hook with loading states, success,
          and error handling.
        </Text>
      </Space>
    </Card>
  );
}

const meta: Meta<typeof MockApiResponse> = {
  title: 'React/Hooks/useFetcher',
  component: MockApiResponse,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook for managing asynchronous fetch operations with proper state handling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    url: {
      control: 'text',
      description: 'The URL to fetch data from',
    },
    timeout: {
      control: { type: 'number', min: 0, max: 10000 },
      description: 'Timeout in milliseconds for the fetch request',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    timeout: 5000,
  },
};
export const TimeOut: Story = {
  args: {
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    timeout: 1,
  },
};

export const WithError: Story = {
  args: {
    url: 'https://jsonplaceholder.typicode.com/invalid-endpoint',
    timeout: 5000,
  },
};

export const SlowResponse: Story = {
  args: {
    url: 'https://jsonplaceholder.typicode.com/posts',
    timeout: 10000,
  },
};
