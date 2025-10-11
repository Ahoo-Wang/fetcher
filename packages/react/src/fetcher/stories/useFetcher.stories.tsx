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
  Spin,
  Form,
  Input,
  InputNumber,
  Select,
} from 'antd';
import { ResultExtractors } from '@ahoo-wang/fetcher';

// Demo component
const UseFetcherDemo: React.FC = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [form] = Form.useForm();

  const { loading, result, error, execute, exchange } = useFetcher<unknown>({
    resultExtractor: ResultExtractors.Json,
    onSuccess: () => {
      setLogs(prev => [
        ...prev,
        `${exchange?.request.method} request to ${exchange?.request.url} successful`,
      ]);
    },
    onError: (e) => {
      setResponse(`Error: ${error?.message || e}`);
      setLogs(prev => [
        ...prev,
        `${exchange?.request.method} request to ${exchange?.request.url}  failed: ${e?.message || e}`,
      ]);
    },
  });

  const handleRequest = async (values: any) => {
    const url = values.url || 'https://jsonplaceholder.typicode.com/posts/1';
    const request: any = {
      url,
      method: values.method || 'GET',
    };
    if (values.body && values.method !== 'GET') {
      request.body = JSON.parse(values.body);
    }
    if (values.headers) {
      request.headers = JSON.parse(values.headers);
    }
    if (values.urlParams) {
      request.urlParams = JSON.parse(values.urlParams);
    }
    if (values.timeout) {
      request.timeout = values.timeout;
    }
    setLogs(prev => [...prev, `Sending ${values.method} request to ${url}`]);
    await execute(request);
    setResponse(JSON.stringify(result, null, 2));
  };

  const clearLogs = () => {
    setLogs([]);
    setResponse(null);
  };

  return (
    <Card title="useFetcher Demo" style={{ minWidth: 600, maxWidth: 800 }}>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRequest}
          initialValues={{
            url: 'https://jsonplaceholder.typicode.com/posts/{id}',
            method: 'GET',
            body: '{"title": "foo", "body": "bar", "userId": 1}',
            headers: '{"Content-Type": "application/json"}',
            urlParams: '{"path":{"id":1}}',
            timeout: 5000,
          }}
        >
          <Form.Item label="URL" name="url">
            <Input placeholder="Enter URL" />
          </Form.Item>
          <Form.Item label="Method" name="method">
            <Select placeholder="Select method">
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="PUT">PUT</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Body (for POST/PUT)" name="body">
            <Input.TextArea placeholder="JSON body" rows={3} />
          </Form.Item>
          <Form.Item label="Headers" name="headers">
            <Input.TextArea placeholder="JSON headers" rows={2} />
          </Form.Item>
          <Form.Item label="URL Params" name="urlParams">
            <Input.TextArea placeholder="JSON urlParams" rows={2} />
          </Form.Item>
          <Form.Item label="Timeout (ms)" name="timeout">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Send Request
              </Button>
              <Button onClick={clearLogs}>Clear</Button>
            </Space>
          </Form.Item>
        </Form>
        <div>
          <Typography.Title level={5}>Response:</Typography.Title>
          {loading ? (
            <Spin />
          ) : (
            <pre
              style={{
                background: '#f5f5f5',
                padding: 10,
                borderRadius: 4,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {response || 'No response yet'}
            </pre>
          )}
        </div>
        <div>
          <Typography.Title level={5}>Logs:</Typography.Title>
          <List
            size="small"
            bordered
            dataSource={logs}
            renderItem={(item, index) => (
              <List.Item key={index}>
                <Typography.Text>{item}</Typography.Text>
              </List.Item>
            )}
            locale={{ emptyText: 'No logs yet' }}
            style={{ maxHeight: 200, overflow: 'auto' }}
          />
        </div>
      </Space>
    </Card>
  );
};

const meta: Meta<typeof UseFetcherDemo> = {
  title: 'React/Hooks/useFetcher',
  component: UseFetcherDemo,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates basic usage of useFetcher hook with form inputs for request parameters.',
      },
    },
  },
};
