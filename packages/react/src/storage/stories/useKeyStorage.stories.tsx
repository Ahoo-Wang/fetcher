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
import { useState } from 'react';
import { Button, Card, Typography, Space, Input, Alert } from 'antd';
import { useKeyStorage } from '../useKeyStorage';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const { Text } = Typography;

export interface StorageDemoProps {
  keyStorage: KeyStorage<string>;
}

function StorageDemo({
                       keyStorage = new KeyStorage<string>({
                         key: 'useKeyStorageDemo',
                       }),
                     }: StorageDemoProps) {
  const [storedValue, setStoredValue] = useKeyStorage(keyStorage);
  const [inputValue, setInputValue] = useState(storedValue ?? '');

  const handleSetValue = () => {
    setStoredValue(inputValue);
  };

  const handleClearValue = () => {
    setStoredValue('');
    setInputValue('');
  };

  return (
    <Card title="useKeyStorage Demo" style={{ width: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Current Stored Value: </Text>
          <Text code>{storedValue || 'null'}</Text>
        </div>

        <Space>
          <Input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Enter value to store"
            style={{ width: 200 }}
          />
          <Button onClick={handleSetValue} type="primary">
            Set Value
          </Button>
          <Button onClick={handleClearValue}>Clear</Button>
        </Space>

        <Alert
          message="Storage State"
          description={`The stored value is: ${storedValue || 'empty'}. Changes are reflected immediately across components.`}
          type="info"
          showIcon
        />

        <Text type="secondary">
          This hook automatically synchronizes state with localStorage changes,
          including cross-tab updates when using broadcast event bus.
        </Text>
      </Space>
    </Card>
  );
}

const meta: Meta<typeof StorageDemo> = {
  title: 'React/Hooks/useKeyStorage',
  component: StorageDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook that provides state management for key-based storage, automatically synchronizing with storage changes across components and tabs.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    keyStorage: {
      description: 'The KeyStorage instance to manage',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    keyStorage: new KeyStorage<string>({
      key: 'useKeyStorageDemo',
    }),
  },
};

export const Broadcast: Story = {
  args: {
    keyStorage: new KeyStorage<string>({
      key: 'useKeyStorageBroadcastDemo',
      eventBus: new BroadcastTypedEventBus(
        { delegate: new SerialTypedEventBus('Broadcast') },
      ),
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates cross-tab synchronization using BroadcastTypedEventBus. Changes made in one tab will be reflected in other tabs automatically.',
      },
    },
  },
};
