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
import { useRequestId } from '../useRequestId';
import { Button, Card, Typography, Space, Alert, List } from 'antd';

const { Text } = Typography;

// Component that demonstrates useRequestId
function RequestIdDemo() {
  const requestId = useRequestId();
  const [requests, setRequests] = React.useState<
    Array<{ id: number; status: 'pending' | 'completed' | 'cancelled' }>
  >([]);

  const handleGenerate = () => {
    const id = requestId.generate();
    setRequests(prev => [...prev, { id, status: 'pending' }]);

    // Simulate async operation
    setTimeout(() => {
      setRequests(prev =>
        prev.map(req =>
          req.id === id && requestId.isLatest(id)
            ? { ...req, status: 'completed' }
            : req.id === id
              ? { ...req, status: 'cancelled' }
              : req,
        ),
      );
    }, 2000);
  };

  const handleInvalidate = () => {
    requestId.invalidate();
    setRequests(prev =>
      prev.map(req =>
        req.status === 'pending' ? { ...req, status: 'cancelled' } : req,
      ),
    );
  };

  const handleReset = () => {
    requestId.reset();
    setRequests([]);
  };

  const currentId = requestId.current();

  return (
    <Card title="useRequestId Demo" style={{ width: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Current Request ID: </Text>
          <span>{currentId}</span>
        </div>

        <Space>
          <Button onClick={handleGenerate} type="primary">
            Generate New Request
          </Button>
          <Button onClick={handleInvalidate} danger>
            Invalidate Current
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </Space>

        <List
          size="small"
          header={<Text strong>Request History</Text>}
          dataSource={requests}
          renderItem={item => (
            <List.Item>
              <Text>Request {item.id}: </Text>
              <Text
                type={
                  item.status === 'completed'
                    ? 'success'
                    : item.status === 'cancelled'
                      ? 'danger'
                      : 'warning'
                }
              >
                {item.status.toUpperCase()}
              </Text>
            </List.Item>
          )}
        />

        <Alert
          message="How it works"
          description="Each button click generates a new request ID. Only requests with the latest ID complete successfully. Use 'Invalidate Current' to cancel pending requests."
          type="info"
          showIcon
        />

        <Text type="secondary">
          This demonstrates the useRequestId hook for managing request IDs and
          preventing race conditions.
        </Text>
      </Space>
    </Card>
  );
}

const meta: Meta<typeof RequestIdDemo> = {
  title: 'React/Hooks/useRequestId',
  component: RequestIdDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook for managing request IDs and race condition protection in asynchronous operations.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
