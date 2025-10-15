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
import { Button, Card, Typography, Space, Input, Alert, Divider } from 'antd';
import { useKeyStorage } from '../useKeyStorage';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const { Text, Title } = Typography;

export interface StorageDemoProps {
  keyStorage: KeyStorage<string>;
  defaultValue?: string;
  showDefaultValueDemo?: boolean;
}

function StorageDemo({
  keyStorage = new KeyStorage<string>({
    key: 'useKeyStorageDemo',
  }),
  defaultValue,
  showDefaultValueDemo = false,
}: StorageDemoProps) {
  // Demo without default value (can be null)
  const [storedValue, setStoredValue] = useKeyStorage(keyStorage);
  const [inputValue, setInputValue] = useState(storedValue ?? '');

  // Demo with default value (never null)
  const [defaultValueDemo, setDefaultValueDemo] = useKeyStorage(
    new KeyStorage<string>({ key: 'defaultValueDemo' }),
    defaultValue || 'Default Value',
  );
  const [defaultInputValue, setDefaultInputValue] = useState(defaultValueDemo);

  const handleSetValue = () => {
    setStoredValue(inputValue);
  };

  const handleClearValue = () => {
    setStoredValue('');
    setInputValue('');
  };

  const handleSetDefaultValue = () => {
    setDefaultValueDemo(defaultInputValue);
  };

  const handleClearDefaultValue = () => {
    setDefaultValueDemo(defaultValue || 'Default Value');
    setDefaultInputValue(defaultValue || 'Default Value');
  };

  return (
    <Card title="useKeyStorage Demo" style={{ width: 600 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Basic Usage Demo */}
        <div>
          <Title level={4}>Basic Usage (Nullable)</Title>
          <div>
            <Text strong>Current Stored Value: </Text>
            <Text code>{storedValue || 'null'}</Text>
          </div>

          <Space style={{ marginTop: 8 }}>
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
        </div>

        <Divider />

        {/* Default Value Demo */}
        {showDefaultValueDemo && (
          <div>
            <Title level={4}>With Default Value (Non-nullable)</Title>
            <div>
              <Text strong>Current Value (never null): </Text>
              <Text code>{defaultValueDemo}</Text>
            </div>

            <Space style={{ marginTop: 8 }}>
              <Input
                value={defaultInputValue}
                onChange={e => setDefaultInputValue(e.target.value)}
                placeholder="Enter value to store"
                style={{ width: 200 }}
              />
              <Button onClick={handleSetDefaultValue} type="primary">
                Set Value
              </Button>
              <Button onClick={handleClearDefaultValue}>
                Reset to Default
              </Button>
            </Space>

            <Alert
              message="Default Value Behavior"
              description={`When storage is empty, this hook returns the default value "${defaultValue || 'Default Value'}". The value is never null.`}
              type="success"
              showIcon
              style={{ marginTop: 8 }}
            />
          </div>
        )}

        <Divider />

        <Alert
          message="Storage State"
          description={`Basic demo value: ${storedValue || 'empty'}. ${showDefaultValueDemo ? `Default demo value: ${defaultValueDemo}. ` : ''}Changes are reflected immediately across components.`}
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
          'A React hook that provides state management for key-based storage, automatically synchronizing with storage changes across components and tabs. Supports both nullable and non-nullable usage patterns with optional default values.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    keyStorage: {
      description: 'The KeyStorage instance to manage',
      control: { type: 'object' },
    },
    defaultValue: {
      description:
        'Default value for the hook (makes the return value non-nullable)',
      control: { type: 'text' },
    },
    showDefaultValueDemo: {
      description: 'Whether to show the default value demo section',
      control: { type: 'boolean' },
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
    showDefaultValueDemo: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of useKeyStorage without a default value. The hook returns nullable state that directly reflects the storage state.',
      },
    },
  },
};

export const WithDefaultValue: Story = {
  args: {
    keyStorage: new KeyStorage<string>({
      key: 'useKeyStorageDefaultDemo',
    }),
    defaultValue: 'Hello World',
    showDefaultValueDemo: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates useKeyStorage with a default value. The hook guarantees non-nullable state, using the default value when storage is empty.',
      },
    },
  },
};

export const Broadcast: Story = {
  args: {
    keyStorage: new KeyStorage<string>({
      key: 'useKeyStorageBroadcastDemo',
      eventBus: new BroadcastTypedEventBus({
        delegate: new SerialTypedEventBus('Broadcast'),
      }),
    }),
    showDefaultValueDemo: false,
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

export const BroadcastWithDefault: Story = {
  args: {
    keyStorage: new KeyStorage<string>({
      key: 'useKeyStorageBroadcastDefaultDemo',
      eventBus: new BroadcastTypedEventBus({
        delegate: new SerialTypedEventBus('Broadcast'),
      }),
    }),
    defaultValue: 'Cross-tab default',
    showDefaultValueDemo: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Combines cross-tab synchronization with default values. Demonstrates how default values work seamlessly with broadcast event synchronization.',
      },
    },
  },
};
