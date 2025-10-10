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
import { usePromiseState, PromiseStatus } from '../usePromiseState';
import { Button, Card, Typography, Space, Alert, Tag } from 'antd';

const { Text } = Typography;

// Component that demonstrates usePromiseState
interface PromiseStateDemoProps {
  initialStatus?: PromiseStatus;
  showCallbacks?: boolean;
}

const PromiseStateDemo: React.FC<PromiseStateDemoProps> = ({
                                                             initialStatus = PromiseStatus.IDLE,
                                                             showCallbacks = false,
                                                           }) => {
  const {
    status,
    loading,
    result,
    error,
    setLoading,
    setSuccess,
    setError,
    setIdle,
  } = usePromiseState<string>({
    initialStatus,
    onSuccess: showCallbacks
      ? result => console.log('Success callback:', result)
      : undefined,
    onError: showCallbacks
      ? error => console.log('Error callback:', error)
      : undefined,
  });

  const handleSetSuccess = () => {
    setSuccess('Operation completed successfully!');
  };

  const handleSetError = () => {
    setError(new Error('Something went wrong!'));
  };

  const getStatusColor = (status: PromiseStatus) => {
    switch (status) {
      case PromiseStatus.IDLE:
        return 'default';
      case PromiseStatus.LOADING:
        return 'processing';
      case PromiseStatus.SUCCESS:
        return 'success';
      case PromiseStatus.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card title="usePromiseState Demo" style={{ width: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Current Status: </Text>
          <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
        </div>

        <div>
          <Text strong>Loading: </Text>
          <Tag color={loading ? 'processing' : 'default'}>
            {loading ? 'Yes' : 'No'}
          </Tag>
        </div>

        <Space>
          <Button onClick={setLoading} type="primary">
            Set Loading
          </Button>
          <Button onClick={handleSetSuccess} type="primary">
            Set Success
          </Button>
          <Button onClick={handleSetError} danger>
            Set Error
          </Button>
          <Button onClick={setIdle}>Set Idle</Button>
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
          This demonstrates the usePromiseState hook for managing promise states
          manually.
          {showCallbacks && ' Callbacks are logged to console.'}
        </Text>
      </Space>
    </Card>
  );
};

const meta: Meta<typeof PromiseStateDemo> = {
  title: 'React/Hooks/usePromiseState',
  component: PromiseStateDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook for managing promise state without execution logic. Provides manual control over loading, success, and error states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    initialStatus: {
      control: { type: 'select' },
      options: Object.values(PromiseStatus),
      description: 'Initial status of the promise state',
    },
    showCallbacks: {
      control: 'boolean',
      description: 'Whether to show callback demonstrations (logs to console)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialStatus: PromiseStatus.IDLE,
    showCallbacks: false,
  },
};

export const InitialLoading: Story = {
  args: {
    initialStatus: PromiseStatus.LOADING,
    showCallbacks: false,
  },
};

export const WithCallbacks: Story = {
  args: {
    initialStatus: PromiseStatus.IDLE,
    showCallbacks: true,
  },
};
