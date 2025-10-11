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

import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { Fetcher } from '@ahoo-wang/fetcher';
// Note: EventStreamInterceptor is not exported, using direct prototype extension

// Demo component
const EventStreamDemo: React.FC = () => {
  const [result, setResult] = React.useState<string>(
    'Click a button to test event streaming',
  );
  const [loading, setLoading] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);

  const fetcher = new Fetcher({
    baseURL: 'https://jsonplaceholder.typicode.com',
  });

  // Note: In real usage, EventStreamInterceptor would be added here
  // fetcher.interceptors.response.use(new EventStreamInterceptor());

  const addLog = (message: string) => {
    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleGenericSSE = async () => {
    setLoading(true);
    setResult('Testing generic Server-Sent Events...');
    addLog('Starting generic SSE test');

    try {
      // This would normally connect to a real SSE endpoint
      // For demo purposes, we'll simulate the behavior
      const mockEvents = [
        { data: '{"message": "Event 1"}', event: 'update', id: '1' },
        { data: '{"message": "Event 2"}', event: 'update', id: '2' },
        { data: '{"message": "Event 3"}', event: 'complete', id: '3' },
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
    setLoading(true);
    setResult('Testing JSON Server-Sent Events...');
    addLog('Starting JSON SSE test');

    try {
      // Simulate JSON SSE events (like from LLM APIs)
      const mockEvents = [
        { choices: [{ delta: { content: 'Hello' } }] },
        { choices: [{ delta: { content: ' world' } }] },
        { choices: [{ delta: { content: '!' } }] },
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
    setLoading(true);
    setResult('Testing text line streaming...');
    addLog('Starting text streaming test');

    try {
      // Simulate text line processing
      const mockLines = [
        'Line 1: This is the first line',
        'Line 2: This is the second line',
        'Line 3: This is the third line',
      ];

      let lineCount = 0;
      for (const line of mockLines) {
        await new Promise(resolve => setTimeout(resolve, 800));
        lineCount++;
        addLog(`Processed line ${lineCount}: ${line}`);
        setResult(`Processed ${lineCount} lines`);
      }

      setResult('Text streaming test completed');
      addLog('Text streaming test completed');
    } catch (error) {
      setResult(`Error: ${error}`);
      addLog(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setResult('Logs cleared');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Event Stream Demo</h2>
      <p>
        This demo shows how to use Fetcher's event streaming capabilities for
        real-time data and LLM responses.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <h3>Streaming Tests</h3>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '10px',
          }}
        >
          <button
            onClick={handleGenericSSE}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Test Generic SSE
          </button>
          <button
            onClick={handleJSONSSE}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Test JSON SSE (LLM)
          </button>
          <button
            onClick={handleTextStreaming}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Test Text Streaming
          </button>
          <button
            onClick={clearLogs}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Clear Logs
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Result</h3>
        <div
          style={{
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            minHeight: '40px',
            fontSize: '14px',
          }}
        >
          {loading ? 'Processing...' : result}
        </div>
      </div>

      <div>
        <h3>Event Logs</h3>
        <div
          style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ padding: '10px', color: '#6c757d' }}>
              No events yet
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  padding: '8px 10px',
                  borderBottom:
                    index < logs.length - 1 ? '1px solid #dee2e6' : 'none',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>
          <strong>Note:</strong> This demo simulates event streaming behavior.
          In a real application, you would connect to actual Server-Sent Events
          endpoints.
        </p>
        <p>
          <strong>LLM Integration:</strong> The JSON SSE test demonstrates how
          to handle streaming responses from Large Language Models like OpenAI
          GPT, Claude, etc.
        </p>
      </div>
    </div>
  );
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'EventStream/EventStream',
  component: EventStreamDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'EventStream provides powerful Server-Sent Events support with native LLM streaming API integration.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EventStreamDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const BasicUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates basic usage of EventStream for handling Server-Sent Events and LLM streaming responses.',
      },
    },
  },
};
