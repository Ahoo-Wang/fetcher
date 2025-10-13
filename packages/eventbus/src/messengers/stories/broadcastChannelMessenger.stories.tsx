import React, { useState, useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Input, List, Card, Typography } from 'antd';
import { BroadcastChannelMessenger } from '../broadcastChannelMessenger';

const { Title, Text } = Typography;

const meta: Meta = {
  title: 'Eventbus/Messengers/BroadcastChannelMessenger',
  parameters: {
    docs: {
      description: {
        component:
          'Interactive demo of BroadcastChannelMessenger for cross-tab communication.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<{ channelName: string }>;

const BroadcastChannelDemo: React.FC<{ channelName: string }> = ({
  channelName,
}) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messengerRef = useRef<BroadcastChannelMessenger | null>(null);

  useEffect(() => {
    const messenger = new BroadcastChannelMessenger(channelName);
    messenger.onmessage = message => {
      setMessages(prev => [...prev, `Received: ${JSON.stringify(message)}`]);
    };
    messengerRef.current = messenger;

    return () => {
      messenger.close();
    };
  }, [channelName]);

  const sendMessage = () => {
    if (messengerRef.current && inputValue.trim()) {
      messengerRef.current.postMessage(inputValue.trim());
      setMessages(prev => [...prev, `Sent: ${inputValue.trim()}`]);
      setInputValue('');
    }
  };

  return (
    <Card title="BroadcastChannelMessenger Demo" style={{ maxWidth: 600 }}>
      <Text>
        Channel: <strong>{channelName}</strong>
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
        Open this story in multiple tabs to test cross-tab communication.
      </Text>
    </Card>
  );
};

export const InteractiveDemo: Story = {
  render: args => <BroadcastChannelDemo {...args} />,
  args: {
    channelName: 'demo-channel',
  },
  argTypes: {
    channelName: {
      control: 'text',
      description: 'The name of the broadcast channel',
    },
  },
};
