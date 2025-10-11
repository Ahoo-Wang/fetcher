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
import React, { useState } from 'react';
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

import { Fetcher } from '../fetcher';

// Demo component
const FetcherDemo: React.FC = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [form] = Form.useForm();

  const fetcher = new Fetcher();

  const handleGetRequest = async (values: any) => {
    setLoading(true);
    const url = values.url || '/api/users';
    const request: any = {};
    if (values.headers) {
      request.headers = JSON.parse(values.headers);
    }
    if (values.urlParams) {
      request.urlParams = JSON.parse(values.urlParams);
    }
    if (values.timeout) {
      request.timeout = values.timeout;
    }
    setLogs(prev => [...prev, `Sending GET request to ${url}`]);
    try {
      const response = await fetcher.get(url, request);
      const result = await response.json();
      setResponse(JSON.stringify(result, null, 2));
      setLogs(prev => [...prev, 'GET request successful']);
    } catch (error) {
      setResponse(`Error: ${error}`);
      setLogs(prev => [...prev, `GET request failed: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostRequest = async (values: any) => {
    setLoading(true);
    const url = values.url || '/api/users';
    const request: any = {};
    if (values.body) {
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
    setLogs(prev => [...prev, `Sending POST request to ${url}`]);
    try {
      const response = await fetcher.get(url, request);
      const result = await response.json();
      setResponse(JSON.stringify(result, null, 2));
      setLogs(prev => [...prev, 'POST request successful']);
    } catch (error) {
      setResponse(`Error: ${error}`);
      setLogs(prev => [...prev, `POST request failed: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setResponse(null);
  };

  return (
    <Card title="Fetcher Demo" style={{ minWidth: 600, maxWidth: 800 }}>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={values => {
            if (values.method === 'GET') {
              handleGetRequest(values);
            } else {
              handlePostRequest(values);
            }
          }}
          initialValues={{
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            method: 'GET',
            body: '{"name": "John Doe", "email": "john@example.com"}',
            headers: '{"Content-Type": "application/json"}',
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
          <Form.Item label="Body (for POST)" name="body">
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

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Fetcher/Fetcher',
  component: FetcherDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Fetcher is a lightweight HTTP client built on the native Fetch API with interceptor support.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FetcherDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const BasicUsage: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates basic usage of Fetcher for GET and POST requests.',
      },
    },
  },
};
