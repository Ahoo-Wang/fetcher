import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card,
  Typography,
  Space,
  Button,
  Input,
  Row,
  Col,
  Tag,
  Alert,
  Tabs,
  Descriptions,
  Switch,
  Divider,
} from 'antd';
import { OpenAI } from '../openai';
import type { ChatResponse } from '../chat';
import { useKeyStorage } from '@ahoo-wang/fetcher-react';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import {
  BroadcastTypedEventBus,
  ParallelTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const meta: Meta = {
  title: 'OpenAI/Client',
  parameters: {
    docs: {
      description: {
        component:
          'OpenAI API client for chat completions with streaming support.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const baseUrlKeyStorage = new KeyStorage<string>({
  key: 'fetcher_story_openai_baseUrl',
  eventBus: new BroadcastTypedEventBus({
    delegate: new ParallelTypedEventBus('fetcher_story_openai_baseUrl'),
  }),
});

const apiKeyStorage = new KeyStorage<string>({
  key: 'fetcher_story_openai_apiKey',
  eventBus: new BroadcastTypedEventBus({
    delegate: new SerialTypedEventBus('fetcher_story_openai_apiKey'),
  }),
});

const modelStorage = new KeyStorage<string>({
  key: 'fetcher_story_openai_model',
  eventBus: new BroadcastTypedEventBus({
    delegate: new SerialTypedEventBus('fetcher_story_openai_model'),
  }),
});

const OpenAIDemo: React.FC = () => {
  const [baseURL, setBaseURL] = useKeyStorage(
    baseUrlKeyStorage,
    'https://api.openai.com/v1',
  );
  const [apiKey, setApiKey] = useKeyStorage(
    apiKeyStorage,
    'sk-your-api-key-here',
  );
  const [client, setClient] = useState<OpenAI | null>(null);
  const [error, setError] = useState<string>('');

  // Chat interface state
  const [message, setMessage] = useState('Hello! Tell me a short joke.');
  const [model, setModel] = useKeyStorage(modelStorage, 'gpt-3.5-turbo');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [chatError, setChatError] = useState<string>('');

  const handleCreateClient = () => {
    try {
      const openai = new OpenAI({
        baseURL,
        apiKey,
      });
      setClient(openai);
      setError('');
    } catch (err) {
      setError((err as Error).message);
      setClient(null);
    }
  };

  const handleSendMessage = async () => {
    if (!client || !message.trim()) return;

    setIsLoading(true);
    setChatError('');
    setResponse('');

    try {
      if (isStreaming) {
        const stream = await client.chat.completions({
          model,
          messages: [{ role: 'user', content: message }],
          stream: true,
        });
        let fullResponse = '';

        for await (const chunk of stream) {
          const content = chunk.data.choices[0]?.delta?.content || '';
          fullResponse += content;
          setResponse(fullResponse);
        }
      } else {
        const result = (await client.chat.completions({
          model,
          messages: [{ role: 'user', content: message }],
          stream: false,
        })) as ChatResponse;
        setResponse(result.choices[0]?.message?.content || 'No response');
      }
    } catch (err) {
      setChatError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3}>🤖 OpenAI Client</Title>
        <Paragraph>
          Type-safe OpenAI API client with streaming support for chat
          completions. Built on the Fetcher ecosystem with decorator-based API
          calls.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Client Configuration" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Base URL:</Text>
                <Input
                  value={baseURL}
                  onChange={e => setBaseURL(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text strong>API Key:</Text>
                <Input.Password
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-your-api-key-here"
                  style={{ marginTop: 4 }}
                />
              </div>
              <Button
                type="primary"
                onClick={handleCreateClient}
                style={{ marginTop: 8 }}
                block
              >
                Create Client
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {error && (
              <Alert
                message="Configuration Error"
                description={error}
                type="error"
                showIcon
              />
            )}

            {client && (
              <Card title="Client Status" size="small">
                <Space direction="vertical">
                  <div>
                    <Tag color="green">✓ Client Created</Tag>
                  </div>
                  <div>
                    <Text strong>Base URL:</Text>{' '}
                    {client.fetcher.urlBuilder.baseURL}
                  </div>
                  <div>
                    <Text strong>Chat Client:</Text> Available
                  </div>
                </Space>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      <Card title="💬 Interactive Chat" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          {!client && (
            <Alert
              message="Client Not Configured"
              description="Please configure and create an OpenAI client above to enable chat functionality."
              type="info"
              showIcon
            />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div>
                <Text strong>Model:</Text>
                <Input
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="gpt-3.5-turbo"
                  style={{ marginTop: 4 }}
                  disabled={!client}
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <Text strong>Streaming:</Text>
                <div style={{ marginTop: 4 }}>
                  <Switch
                    checked={isStreaming}
                    onChange={setIsStreaming}
                    disabled={!client}
                  />
                  <Text style={{ marginLeft: 8 }}>
                    {isStreaming ? 'Enabled' : 'Disabled'}
                  </Text>
                </div>
              </div>
            </Col>
          </Row>

          <div>
            <Text strong>Message:</Text>
            <Input.TextArea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows={3}
              style={{ marginTop: 4 }}
              disabled={!client}
            />
          </div>

          <Button
            type="primary"
            onClick={handleSendMessage}
            loading={isLoading}
            disabled={!client || !message.trim()}
            block
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </Button>

          {chatError && (
            <Alert
              message="Chat Error"
              description={chatError}
              type="error"
              showIcon
            />
          )}

          {response && (
            <div>
              <Text strong>Response:</Text>
              <Card
                size="small"
                style={{ marginTop: 8, backgroundColor: '#f9f9f9' }}
              >
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {response}
                </pre>
              </Card>
            </div>
          )}
        </Space>
      </Card>

      <Divider />

      {client && (
        <Card title="Usage Examples" size="small">
          <Tabs defaultActiveKey="1">
            <TabPane tab="Non-Streaming Chat" key="1">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Code Example:</Text>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                  }}
                >
                  {`const response = await client.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: false,
});

console.log(response.choices[0].message.content);`}
                </pre>
              </Space>
            </TabPane>

            <TabPane tab="Streaming Chat" key="2">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Code Example:</Text>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                  }}
                >
                  {`const stream = await client.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});

for await (const chunk of stream) {
  console.log(chunk.choices[0].delta?.content || '');
}`}
                </pre>
              </Space>
            </TabPane>

            <TabPane tab="Advanced Configuration" key="3">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Custom Parameters:</Text>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                  }}
                >
                  {`const response = await client.chat.completions({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing' }
  ],
  temperature: 0.7,
  max_tokens: 1000,
  stream: false,
});`}
                </pre>

                <Descriptions title="Common Parameters" size="small" column={2}>
                  <Descriptions.Item label="model">
                    gpt-3.5-turbo, gpt-4, etc.
                  </Descriptions.Item>
                  <Descriptions.Item label="temperature">
                    0.0 - 2.0 (creativity)
                  </Descriptions.Item>
                  <Descriptions.Item label="max_tokens">
                    Maximum response length
                  </Descriptions.Item>
                  <Descriptions.Item label="stream">
                    Enable streaming responses
                  </Descriptions.Item>
                  <Descriptions.Item label="messages">
                    Array of conversation messages
                  </Descriptions.Item>
                  <Descriptions.Item label="system">
                    System prompt for behavior
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            </TabPane>
          </Tabs>
        </Card>
      )}

      <Card>
        <Title level={4}>Key Features</Title>
        <Space direction="vertical">
          <div>
            <Tag color="blue">Type-Safe</Tag>
            <Text>
              {' '}
              Full TypeScript support with strict typing for all API parameters
            </Text>
          </div>
          <div>
            <Tag color="green">Streaming Support</Tag>
            <Text>
              {' '}
              Native support for server-sent event streams with async iteration
            </Text>
          </div>
          <div>
            <Tag color="orange">Decorator-Based</Tag>
            <Text> Clean, declarative API using TypeScript decorators</Text>
          </div>
          <div>
            <Tag color="purple">Fetcher Integration</Tag>
            <Text>
              {' '}
              Built on robust Fetcher HTTP client with interceptors and
              middleware
            </Text>
          </div>
          <div>
            <Tag color="red">Tree Shaking</Tag>
            <Text> Optimized bundle size with full tree shaking support</Text>
          </div>
        </Space>
      </Card>

      <Alert
        message="Environment Setup"
        description="Set OPENAI_API_KEY environment variable for production use. Use test keys for development and testing."
        type="info"
        showIcon
      />
    </Space>
  );
};

export const Default: Story = {
  render: () => <OpenAIDemo />,
};
