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
import { useExecutePromise } from '../useExecutePromise';
import { Button, Card, Typography, Space, Alert } from 'antd';

const { Text } = Typography;

// Component that demonstrates useExecutePromise
interface ExecutePromiseDemoProps {
  propagateError?: boolean;
}

function ExecutePromiseDemo({
                              propagateError = false,
                            }: ExecutePromiseDemoProps) {
  const { loading, result, error, execute, reset, status } =
    useExecutePromise<string>({
      propagateError,
    });

  const handleSuccess = () => {
    execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return 'Operation completed successfully!';
    });
  };

  const handleError = () => {
    execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new Error('Something went wrong!');
    });
  };

  const handleReset = () => {
    reset();
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

  return (
    <Card title="useExecutePromise Demo" style={{ width: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Current Status: </Text>
          <span style={{ color: getStatusColor(status) }}>
            {status.toUpperCase()}
          </span>
        </div>

        <Space>
          <Button onClick={handleSuccess} type="primary" loading={loading}>
            Execute Success
          </Button>
          <Button onClick={handleError} danger loading={loading}>
            Execute Error
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </Space>

        {result && (
          <Alert
            message="Success Result"
            description={result}
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
          This demonstrates the useExecutePromise hook for managing asynchronous
          operations.
          {propagateError && ' Errors are propagated (check console).'}
        </Text>
      </Space>
    </Card>
  );
}

const meta: Meta<typeof ExecutePromiseDemo> = {
  title: 'React/Hooks/useExecutePromise',
  component: ExecutePromiseDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook for managing asynchronous operations with proper state handling and error propagation control.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    propagateError: {
      control: 'boolean',
      description: 'Whether to propagate errors thrown by the promise',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    propagateError: false,
  },
};

export const PropagateError: Story = {
  args: {
    propagateError: true,
  },
};
