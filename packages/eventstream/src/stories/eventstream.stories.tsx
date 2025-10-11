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
  List,
  Descriptions,
  Tabs,
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Note: EventStreamInterceptor is not exported, using direct prototype extension

const EventStreamDemo: React.FC = () => {
  const [result, setResult] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleGenericSSE = async () => {
    try {
      setLoading(true);
      setResult('Testing generic Server-Sent Events...');
      addLog('Starting generic SSE test');

      // Simulate generic SSE events
      const mockEvents = [
        {
          data: '{"message": "Event 1", "timestamp": "2024-01-01T10:00:00Z"}',
          event: 'update',
          id: '1',
        },
        {
          data: '{"message": "Event 2", "timestamp": "2024-01-01T10:00:01Z"}',
          event: 'update',
          id: '2',
        },
        {
          data: '{"message": "Event 3", "timestamp": "2024-01-01T10:00:02Z"}',
          event: 'complete',
          id: '3',
        },
      ];

      let eventCount = 0;
      for (const event of mockEvents) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog(`Received event: ${JSON.stringify(event)}`);
        eventCount++;
        setResult(`Processed ${eventCount} events`);
      }

      setResult('Generic SSE test completed');
      addLog('Generic SSE test completed');
    } catch (error) {
      setResult(`Error: ${error}`);
      addLog(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJSONSSE = async () => {
    try {
      setLoading(true);
      setResult('Testing JSON Server-Sent Events...');
      addLog('Starting JSON SSE test (LLM streaming)');

      // Simulate JSON SSE events (like from LLM APIs)
      const mockEvents = [
        {
          choices: [{ delta: { content: 'Hello' }, finish_reason: null }],
          created: Date.now(),
        },
        {
          choices: [{ delta: { content: ' world' }, finish_reason: null }],
          created: Date.now() + 100,
        },
        {
          choices: [{ delta: { content: '!' }, finish_reason: 'stop' }],
          created: Date.now() + 200,
        },
      ];

      let fullContent = '';
      for (const event of mockEvents) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const content = event.choices[0]?.delta?.content || '';
        fullContent += content;
        addLog(`Received content chunk: "${content}"`);
        setResult(`Streaming content: "${fullContent}"`);
      }

      setResult(`Final content: "${fullContent}"`);
      addLog('JSON SSE test completed');
    } catch (error) {
      setResult(`Error: ${error}`);
      addLog(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTextStreaming = async () => {
    try {
      setLoading(true);
      setResult('Testing text line streaming...');
      addLog('Starting text streaming test');

      // Simulate text line processing
      const mockLines = [
        'data: {"chunk": "This is"}',
        'data: {"chunk": " a streaming"}',
        'data: {"chunk": " text response"}',
        'data: {"chunk": "."}',
      ];

      let lineCount = 0;
      let fullText = '';
      for (const line of mockLines) {
        await new Promise(resolve => setTimeout(resolve, 800));
        lineCount++;
        const chunk = JSON.parse(line.replace('data: ', '')).chunk;
        fullText += chunk;
        addLog(`Processed line ${lineCount}: ${chunk}`);
        setResult(`Streaming text: "${fullText}"`);
      }

      setResult(`Final text: "${fullText}"`);
      addLog('Text streaming test completed');
    } catch (error) {
      setResult(`Error: ${error}`);
      addLog(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3}>📡 Server-Sent Events & Streaming</Title>
        <Paragraph>
          Powerful event streaming capabilities with native LLM API integration.
          Handle real-time data streams, Server-Sent Events, and streaming
          responses from AI models.
        </Paragraph>
      </Card>

      <Alert
        message="⚡ Real-time Streaming"
        description="Process Server-Sent Events, JSON streams, and text streams with automatic parsing and transformation."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="🌐 Generic SSE" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Standard Server-Sent Events with event types and IDs</Text>
              <Button
                onClick={handleGenericSSE}
                type="primary"
                block
                loading={loading}
              >
                Test Generic SSE
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="🤖 JSON SSE (LLM)" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>JSON streaming for AI models (OpenAI, Claude, etc.)</Text>
              <Button
                onClick={handleJSONSSE}
                type="primary"
                block
                loading={loading}
              >
                Test LLM Streaming
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="📄 Text Streaming" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Line-by-line text processing and streaming</Text>
              <Button
                onClick={handleTextStreaming}
                type="primary"
                block
                loading={loading}
              >
                Test Text Streaming
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="📋 Code Examples" size="small">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Server-Sent Events" key="1">
            <pre
              style={{
                background: '#f6f8fa',
                border: '1px solid #d1d9e0',
                borderRadius: '6px',
                padding: '16px',
                overflow: 'auto',
                fontFamily:
                  'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                fontSize: '14px',
              }}
            >
              {`// Server-Sent Events endpoint
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com'
});

// Get SSE stream
const response = await fetcher.get('/events', {
  headers: { Accept: 'text/event-stream' }
});

// Process events
for await (const event of response.body) {
  console.log('Event:', event);
}`}
            </pre>
          </TabPane>

          <TabPane tab="LLM Streaming" key="2">
            <pre
              style={{
                background: '#f6f8fa',
                border: '1px solid #d1d9e0',
                borderRadius: '6px',
                padding: '16px',
                overflow: 'auto',
                fontFamily:
                  'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                fontSize: '14px',
              }}
            >
              {`// OpenAI-style streaming
const fetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1'
});

const response = await fetcher.post('/chat/completions', {
  body: {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true
  },
  headers: { 'Content-Type': 'application/json' }
});

// Process streaming response
let fullContent = '';
for await (const chunk of response.body) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    fullContent += content;
    console.log('Token:', content);
  }
}`}
            </pre>
          </TabPane>

          <TabPane tab="Transform Streams" key="3">
            <List
              size="small"
              dataSource={[
                'ServerSentEventTransformStream - Parse SSE format',
                'JsonServerSentEventTransformStream - Parse JSON SSE',
                'TextLineTransformStream - Process text lines',
                'EventStreamConverter - Convert between formats',
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Card title="📊 Stream Result" size="small">
        <TextArea
          rows={4}
          value={result}
          readOnly
          placeholder="Streaming results will appear here..."
        />
      </Card>

      <Card title="Activity Log" size="small">
        <TextArea
          rows={8}
          value={logs.join('\n')}
          readOnly
          placeholder="Event logs will appear here..."
        />
      </Card>

      <Card>
        <Title level={4}>Key Features</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <div>
                <Tag color="blue">🌐 SSE Support</Tag>
                <Text> Native Server-Sent Events processing</Text>
              </div>
              <div>
                <Tag color="green">🤖 LLM Integration</Tag>
                <Text> Built-in support for AI streaming APIs</Text>
              </div>
              <div>
                <Tag color="orange">🔄 Transform Streams</Tag>
                <Text> Automatic parsing and data transformation</Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <div>
                <Tag color="purple">📄 Text Processing</Tag>
                <Text> Line-by-line text stream handling</Text>
              </div>
              <div>
                <Tag color="red">⚡ Real-time</Tag>
                <Text> Asynchronous iteration over streams</Text>
              </div>
              <div>
                <Tag color="cyan">🔧 Extensible</Tag>
                <Text> Custom transform streams supported</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>Architecture Overview</Title>
        <Descriptions
          bordered
          size="small"
          column={1}
          items={[
            {
              key: 'transform-streams',
              label: 'Transform Streams',
              children:
                'Web Streams API based processing pipelines that parse and transform streaming data in real-time.',
            },
            {
              key: 'event-parsing',
              label: 'Event Parsing',
              children:
                'Automatic parsing of Server-Sent Events format with support for event types, IDs, and data fields.',
            },
            {
              key: 'json-streaming',
              label: 'JSON Streaming',
              children:
                'Specialized handling for JSON-based streaming protocols used by LLM APIs and real-time applications.',
            },
            {
              key: 'async-iteration',
              label: 'Async Iteration',
              children:
                'Native async iteration support over ReadableStreams for seamless consumption of streaming data.',
            },
          ]}
        />
      </Card>
    </Space>
  );
};

const meta: Meta = {
  title: 'EventStream/Server-Sent Events',
  parameters: {
    docs: {
      description: {
        component:
          'Powerful Server-Sent Events support with native LLM streaming API integration. Handle real-time data streams, SSE events, and streaming responses from AI models.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <EventStreamDemo />,
};
