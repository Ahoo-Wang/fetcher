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
import { Button, Card, Typography, Space, Input, Alert } from 'antd';

const { Text } = Typography;

// Simple storage simulation for demonstration
interface SimpleStorage<T> {
  get(): T | null;

  set(value: T): void;

  addListener(callback: () => void): () => void;
}

// Mock storage implementation
class MockStorage<T> implements SimpleStorage<T> {
  private value: T | null = null;
  private listeners: (() => void)[] = [];

  get(): T | null {
    return this.value;
  }

  set(value: T): void {
    this.value = value;
    this.listeners.forEach(listener => listener());
  }

  addListener(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Simplified storage hook for demo
function useSimpleStorage<T>(
  storage: SimpleStorage<T>,
): [T | null, (value: T) => void] {
  const [value, setValue] = React.useState<T | null>(() => storage.get());

  React.useEffect(() => {
    const unsubscribe = storage.addListener(() => {
      setValue(storage.get());
    });
    return unsubscribe;
  }, [storage]);

  const setStoredValue = React.useCallback(
    (value: T) => {
      storage.set(value);
    },
    [storage],
  );

  return [value, setStoredValue];
}

// Component that demonstrates storage hook
interface StorageDemoProps {
  initialValue?: string;
}

function StorageDemo({ initialValue = '' }: StorageDemoProps) {
  const storage = React.useMemo(() => new MockStorage<string>(), []);
  const [storedValue, setStoredValue] = useSimpleStorage(storage);
  const [inputValue, setInputValue] = React.useState(initialValue);

  React.useEffect(() => {
    if (initialValue && !storedValue) {
      setStoredValue(initialValue);
    }
  }, [initialValue, storedValue, setStoredValue]);

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
          This demonstrates a storage hook similar to useKeyStorage for managing
          key-based storage with automatic state synchronization.
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
          'A React hook that provides state management for storage, automatically synchronizing with storage changes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    initialValue: {
      control: 'text',
      description: 'Initial value to set in storage',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialValue: 'Hello World',
  },
};

export const Empty: Story = {
  args: {
    initialValue: '',
  },
};
