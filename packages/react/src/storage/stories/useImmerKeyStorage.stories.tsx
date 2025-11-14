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
import { Button, Card, Typography, Space, Alert } from 'antd';
import { useImmerKeyStorage } from '../useImmerKeyStorage';
import { jsonSerializer, KeyStorage } from '@ahoo-wang/fetcher-storage';

const { Text, Title } = Typography;
const storage = new KeyStorage<{ count: number; name: string }>({
  key: 'immer-demo',
  serializer: jsonSerializer,
});
const defaultValue = {
  count: 0,
  name: 'Default Name',
};

function ImmerStorageDemo() {
  const [data, updateData, clearData] = useImmerKeyStorage(storage, defaultValue);

  const handleIncrement = () => {
    updateData(draft => {
      draft.count += 1;
    });
  };

  const handleUpdateName = () => {
    updateData(draft => {
      draft.name = 'Updated Name';
    });
  };

  const handleBatchUpdate = () => {
    updateData(draft => {
      draft.count = 10;
      draft.name = 'Batch Updated';
    });
  };

  return (
    <Card title="useImmerKeyStorage Demo" style={{ width: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Current Data</Title>
          <Text code>{data ? JSON.stringify(data) : 'null'}</Text>
        </div>

        <Space>
          <Button onClick={handleIncrement}>Increment Count</Button>
          <Button onClick={handleUpdateName}>Update Name</Button>
          <Button onClick={handleBatchUpdate} type="primary">
            Batch Update
          </Button>
          <Button onClick={clearData} danger>
            Clear
          </Button>
        </Space>

        <Alert
          message="Immer Integration"
          description="This hook uses Immer's produce function to allow mutable-style updates while maintaining immutability."
          type="info"
        />
      </Space>
    </Card>
  );
}

const meta: Meta<typeof ImmerStorageDemo> = {
  title: 'React/Hooks/useImmerKeyStorage',
  component: ImmerStorageDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook that provides Immer-based immutable state management for KeyStorage. It allows developers to perform "mutable" updates on stored values using Immer\'s draft mechanism.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of useImmerKeyStorage demonstrating Immer-based updates.',
      },
    },
  },
};
