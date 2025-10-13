import React, { useState, useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Input, List, Card, Typography } from 'antd';
import { StorageMessenger } from '../storageMessenger';

const { Title, Text } = Typography;

const meta: Meta = {
  title: 'Eventbus/Messengers/StorageMessenger',
  parameters: {
    docs: {
      description: {
        component:
          'Interactive demo of StorageMessenger for cross-tab communication using localStorage.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<{
  channelName: string;
  ttl: number;
  cleanupInterval: number;
}>;

const StorageMessengerDemo: React.FC<{
  channelName: string;
  ttl: number;
  cleanupInterval: number;
}> = ({ channelName, ttl, cleanupInterval }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messengerRef = useRef<StorageMessenger | null>(null);

  useEffect(() => {
    const messenger = new StorageMessenger({
      channelName,
      ttl,
      cleanupInterval,
    });
    messenger.onmessage = message => {
      setMessages(prev => [...prev, `Received: ${JSON.stringify(message)}`]);
    };
    messengerRef.current = messenger;

    return () => {
      messenger.close();
    };
  }, [channelName, ttl, cleanupInterval]);

  const sendMessage = () => {
    if (messengerRef.current && inputValue.trim()) {
      messengerRef.current.postMessage(inputValue.trim());
      setMessages(prev => [...prev, `Sent: ${inputValue.trim()}`]);
      setInputValue('');
    }
  };

  return (
    <Card title="StorageMessenger Demo" style={{ maxWidth: 600 }}>
      <Text>
        Channel: <strong>{channelName}</strong> | TTL: <strong>{ttl}ms</strong>{' '}
        | Cleanup: <strong>{cleanupInterval}ms</strong>
      </Text>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Enter message"
          style={{ width: 300, marginRight: 8 }}
        />
        <Button type="primary" onClick={sendMessage}>
          Send Message
        </Button>
      </div>
      <Title level={4}>Messages</Title>
      <List
        size="small"
        bordered
        dataSource={messages}
        renderItem={item => <List.Item>{item}</List.Item>}
        style={{ maxHeight: 200, overflow: 'auto' }}
      />
      <Text
        type="secondary"
        style={{ fontSize: 12, marginTop: 8, display: 'block' }}
      >
        Open this story in multiple tabs to test cross-tab communication via
        localStorage.
      </Text>
    </Card>
  );
};

export const InteractiveDemo: Story = {
  render: args => <StorageMessengerDemo {...args} />,
  args: {
    channelName: 'demo-storage-channel',
    ttl: 5000,
    cleanupInterval: 1000,
  },
  argTypes: {
    channelName: {
      control: 'text',
      description: 'The name of the storage channel',
    },
    ttl: {
      control: { type: 'number', min: 1000, max: 60000 },
      description: 'Time to live for messages in milliseconds',
    },
    cleanupInterval: {
      control: { type: 'number', min: 500, max: 10000 },
      description: 'Interval for periodic cleanup in milliseconds',
    },
  },
};
