import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
  List,
  message,
} from 'antd';
import { KeyStorage, type StorageEvent } from '../keyStorage';
import { InMemoryStorage } from '../inMemoryStorage';
import { isBrowser } from '../env';
import type { EventHandler } from '@ahoo-wang/fetcher-eventbus';

const { Text } = Typography;

interface User {
  name: string;
  age: number;
  email: string;
}

const StorageDemo: React.FC = () => {
  const [userStorage] = useState(
    () => new KeyStorage<User>({ key: 'demo-user' }),
  );
  const [memoryStorage] = useState(() => new InMemoryStorage());
  const [user, setUser] = useState<User | null>(null);
  const [memoryValue, setMemoryValue] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [
      ...prev.slice(-4),
      `${new Date().toLocaleTimeString()}: ${msg}`,
    ]);
  };

  useEffect(() => {
    // Load initial data
    const initialUser = userStorage.get();
    setUser(initialUser);
    addLog('Loaded user data from storage');

    // Listen for changes
    const changeHandler: EventHandler<StorageEvent<User>> = {
      name: 'user-change-handler',
      handle: (event: StorageEvent<User>) => {
        addLog(`User data changed: ${JSON.stringify(event.newValue)}`);
        setUser(event.newValue || null);
      },
    };
    const removeListener = userStorage.addListener(changeHandler);

    return removeListener;
  }, [userStorage]);

  const handleSaveUser = (values: User) => {
    userStorage.set(values);
    message.success('User saved to storage');
  };

  const handleRemoveUser = () => {
    userStorage.remove();
    message.success('User removed from storage');
  };

  const handleMemorySet = () => {
    if (memoryValue) {
      memoryStorage.setItem('demo-key', memoryValue);
      addLog(`Set memory value: ${memoryValue}`);
      message.success('Value saved to memory storage');
    }
  };

  const handleMemoryGet = () => {
    const value = memoryStorage.getItem('demo-key');
    addLog(`Got memory value: ${value || 'null'}`);
    message.info(`Memory value: ${value || 'null'}`);
  };

  const handleMemoryClear = () => {
    memoryStorage.clear();
    addLog('Memory storage cleared');
    message.success('Memory storage cleared');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Environment Detection" size="small">
        <Space direction="vertical">
          <Text>
            Is Browser: <strong>{isBrowser() ? 'Yes' : 'No'}</strong>
          </Text>
          <Text>
            Default Storage:{' '}
            <strong>{isBrowser() ? 'localStorage' : 'InMemoryStorage'}</strong>
          </Text>
          <Button
            onClick={() => addLog(`Environment check: Browser=${isBrowser()}`)}
          >
            Check Environment
          </Button>
        </Space>
      </Card>

      <Card title="KeyStorage Demo" size="small">
        <Form
          layout="inline"
          onFinish={handleSaveUser}
          initialValues={user || { name: '', age: 25, email: '' }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item
            name="age"
            label="Age"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <Input type="number" placeholder="Enter age" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save User
              </Button>
              <Button danger onClick={handleRemoveUser}>
                Remove User
              </Button>
            </Space>
          </Form.Item>
        </Form>
        {user && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Current User:</Text>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </Card>

      <Card title="InMemoryStorage Demo" size="small">
        <Space direction="vertical">
          <Space>
            <Input
              placeholder="Enter value to store"
              value={memoryValue}
              onChange={e => setMemoryValue(e.target.value)}
              style={{ width: 200 }}
            />
            <Button onClick={handleMemorySet}>Set Value</Button>
          </Space>
          <Space>
            <Button onClick={handleMemoryGet}>Get Value</Button>
            <Button onClick={handleMemoryClear} danger>
              Clear Storage
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="Activity Log" size="small">
        <List
          size="small"
          dataSource={logs}
          renderItem={item => <List.Item>{item}</List.Item>}
          style={{ maxHeight: 200, overflow: 'auto' }}
        />
      </Card>
    </Space>
  );
};

const meta: Meta<typeof StorageDemo> = {
  title: 'Storage/Storage Demo',
  component: StorageDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Interactive demo of the @ahoo-wang/fetcher-storage package features including KeyStorage, InMemoryStorage, and environment detection.',
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
