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

import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card,
  Typography,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Alert,
  List,
  Descriptions,
  Tabs,
  Badge,
  Divider,
} from 'antd';
import { SerialTypedEventBus } from '../serialTypedEventBus';
import { ParallelTypedEventBus } from '../parallelTypedEventBus';
import { BroadcastTypedEventBus } from '../broadcastTypedEventBus';
import { EventBus } from '../eventBus';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Define event types for demonstration
interface UserEvent {
  userId: string;
  action: 'login' | 'logout' | 'update' | 'delete';
  timestamp: number;
}

interface OrderEvent {
  orderId: string;
  status: 'created' | 'paid' | 'shipped' | 'delivered';
  amount: number;
}

interface NotificationEvent {
  type: 'info' | 'warning' | 'error';
  message: string;
  priority: number;
}

type DemoEvents = {
  'user-event': UserEvent;
  'order-event': OrderEvent;
  notification: NotificationEvent;
};

const EventBusDemo: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('serial');

  // Serial Event Bus
  const [serialBus] = useState(
    () => new SerialTypedEventBus<UserEvent>('user-events'),
  );

  // Parallel Event Bus
  const [parallelBus] = useState(
    () => new ParallelTypedEventBus<OrderEvent>('order-events'),
  );

  // Broadcast Event Bus
  const [broadcastBus] = useState(() => {
    const delegate = new SerialTypedEventBus<NotificationEvent>(
      'notifications',
    );
    return new BroadcastTypedEventBus({ delegate });
  });

  // Generic Event Bus
  const [genericBus] = useState(() => {
    const supplier = (type: string) => {
      switch (type) {
        case 'user-event':
          return new SerialTypedEventBus<UserEvent>(type);
        case 'order-event':
          return new ParallelTypedEventBus<OrderEvent>(type);
        case 'notification':
          return new SerialTypedEventBus<NotificationEvent>(type);
        default:
          return new SerialTypedEventBus(type);
      }
    };
    return new EventBus<DemoEvents>(supplier);
  });

  const addLog = (message: string, busType: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${busType}: ${message}`]);
  };

  // Setup handlers for Serial Event Bus
  useEffect(() => {
    const handler1 = {
      name: 'user-logger',
      order: 1,
      handle: (event: UserEvent) => {
        addLog(`User ${event.userId} ${event.action} (Logger)`, 'Serial');
      },
    };

    const handler2 = {
      name: 'user-processor',
      order: 2,
      handle: async (event: UserEvent) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
        addLog(`User ${event.userId} ${event.action} (Processor)`, 'Serial');
      },
    };

    serialBus.on(handler1);
    serialBus.on(handler2);

    return () => {
      serialBus.destroy();
    };
  }, [serialBus]);

  // Setup handlers for Parallel Event Bus
  useEffect(() => {
    const handler1 = {
      name: 'order-validator',
      order: 1,
      handle: async (event: OrderEvent) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        addLog(
          `Order ${event.orderId} ${event.status} - $${event.amount} (Validator)`,
          'Parallel',
        );
      },
    };

    const handler2 = {
      name: 'order-notifier',
      order: 2,
      handle: async (event: OrderEvent) => {
        await new Promise(resolve => setTimeout(resolve, 80));
        addLog(
          `Order ${event.orderId} ${event.status} - $${event.amount} (Notifier)`,
          'Parallel',
        );
      },
    };

    parallelBus.on(handler1);
    parallelBus.on(handler2);

    return () => {
      parallelBus.destroy();
    };
  }, [parallelBus]);

  // Setup handlers for Broadcast Event Bus
  useEffect(() => {
    const handler = {
      name: 'broadcast-receiver',
      order: 1,
      handle: (event: NotificationEvent) => {
        addLog(
          `${event.type.toUpperCase()}: ${event.message} (Priority: ${event.priority})`,
          'Broadcast',
        );
      },
    };

    broadcastBus.on(handler);

    return () => {
      broadcastBus.destroy();
    };
  }, [broadcastBus]);

  // Setup handlers for Generic Event Bus
  useEffect(() => {
    const userHandler = {
      name: 'generic-user-handler',
      order: 1,
      handle: (event: UserEvent) => {
        addLog(`Generic User: ${event.userId} ${event.action}`, 'Generic');
      },
    };

    const orderHandler = {
      name: 'generic-order-handler',
      order: 1,
      handle: (event: OrderEvent) => {
        addLog(`Generic Order: ${event.orderId} ${event.status}`, 'Generic');
      },
    };

    const notificationHandler = {
      name: 'generic-notification-handler',
      order: 1,
      handle: (event: NotificationEvent) => {
        addLog(`Generic Notification: ${event.message}`, 'Generic');
      },
    };

    genericBus.on('user-event', userHandler);
    genericBus.on('order-event', orderHandler);
    genericBus.on('notification', notificationHandler);

    return () => {
      genericBus.destroy();
    };
  }, [genericBus]);

  const handleSerialEvent = (action: UserEvent['action']) => {
    serialBus.emit({
      userId: 'user-123',
      action,
      timestamp: Date.now(),
    });
  };

  const handleParallelEvent = (status: OrderEvent['status']) => {
    parallelBus.emit({
      orderId: `order-${Math.floor(Math.random() * 1000)}`,
      status,
      amount: Math.floor(Math.random() * 100) + 10,
    });
  };

  const handleBroadcastEvent = (type: NotificationEvent['type']) => {
    const messages = {
      info: 'System maintenance scheduled',
      warning: 'High memory usage detected',
      error: 'Database connection failed',
    };

    broadcastBus.emit({
      type,
      message: messages[type],
      priority: type === 'error' ? 1 : type === 'warning' ? 2 : 3,
    });
  };

  const handleGenericEvents = () => {
    // Emit user event
    genericBus.emit('user-event', {
      userId: 'generic-user',
      action: 'login',
      timestamp: Date.now(),
    });

    // Emit order event
    genericBus.emit('order-event', {
      orderId: 'generic-order-001',
      status: 'paid',
      amount: 99.99,
    });

    // Emit notification event
    genericBus.emit('notification', {
      type: 'info',
      message: 'Generic event demonstration',
      priority: 3,
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogBadge = (busType: string) => {
    const count = logs.filter(log => log.includes(busType)).length;
    return count > 0 ? <Badge count={count} /> : null;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3}>📡 EventBus Event System</Title>
        <Paragraph>
          Powerful TypeScript event bus library providing serial execution,
          parallel execution, and cross-tab broadcasting implementations.
          Supports type-safe event handling, priority ordering, and asynchronous
          operations.
        </Paragraph>
      </Card>

      <Alert
        message="🎯 Core Features"
        description="Type safety, flexible execution modes, cross-tab communication, async support, error handling, and priority management."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="🎮 Interactive Demo" size="small">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={<span>🔄 Serial Execution {getLogBadge('Serial')}</span>}
            key="serial"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Event handlers execute in order with priority support</Text>
              <Row gutter={[8, 8]}>
                <Col>
                  <Button
                    onClick={() => handleSerialEvent('login')}
                    type="primary"
                  >
                    User Login
                  </Button>
                </Col>
                <Col>
                  <Button
                    onClick={() => handleSerialEvent('logout')}
                    type="primary"
                  >
                    User Logout
                  </Button>
                </Col>
                <Col>
                  <Button
                    onClick={() => handleSerialEvent('update')}
                    type="primary"
                  >
                    User Update
                  </Button>
                </Col>
              </Row>
            </Space>
          </TabPane>

          <TabPane
            tab={<span>⚡ Parallel Execution {getLogBadge('Parallel')}</span>}
            key="parallel"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                Event handlers execute concurrently for better performance
              </Text>
              <Row gutter={[8, 8]}>
                <Col>
                  <Button
                    onClick={() => handleParallelEvent('created')}
                    type="primary"
                  >
                    Order Created
                  </Button>
                </Col>
                <Col>
                  <Button
                    onClick={() => handleParallelEvent('paid')}
                    type="primary"
                  >
                    Order Paid
                  </Button>
                </Col>
                <Col>
                  <Button
                    onClick={() => handleParallelEvent('shipped')}
                    type="primary"
                  >
                    Order Shipped
                  </Button>
                </Col>
                <Col>
                  <Button
                    onClick={() => handleParallelEvent('delivered')}
                    type="primary"
                  >
                    Order Delivered
                  </Button>
                </Col>
              </Row>
            </Space>
          </TabPane>

          <TabPane
            tab={<span>🌐 Cross-Tab Broadcast {getLogBadge('Broadcast')}</span>}
            key="broadcast"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                Broadcast events across browser tabs using BroadcastChannel API
              </Text>
              <Row gutter={[8, 8]}>
                <Col>
                  <Button
                    onClick={() => handleBroadcastEvent('info')}
                    type="primary"
                  >
                    Info Notification
                  </Button>
                </Col>
                <Col>
                  <Button
                    onClick={() => handleBroadcastEvent('warning')}
                    type="primary"
                  >
                    Warning Notification
                  </Button>
                </Col>
                <Col>
                  <Button
                    onClick={() => handleBroadcastEvent('error')}
                    type="primary"
                  >
                    Error Notification
                  </Button>
                </Col>
              </Row>
            </Space>
          </TabPane>

          <TabPane
            tab={<span>📦 Generic Event Bus {getLogBadge('Generic')}</span>}
            key="generic"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                Generic event bus managing multiple event types with lazy
                loading
              </Text>
              <Button onClick={handleGenericEvents} type="primary">
                Trigger All Event Types
              </Button>
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      <Card title="📋 Code Examples" size="small">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Serial Event Bus" key="1">
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
              {`import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const bus = new SerialTypedEventBus<UserEvent>('user-events');

// Register handlers (executed in order)
bus.on({
  name: 'logger',
  order: 1,
  handle: event => console.log('Log:', event),
});

bus.on({
  name: 'processor',
  order: 2,
  handle: async event => {
    // Async processing
    await processUserEvent(event);
  },
});

// Emit event
await bus.emit({ userId: '123', action: 'login' });`}
            </pre>
          </TabPane>

          <TabPane tab="Parallel Event Bus" key="2">
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
              {`import { ParallelTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const bus = new ParallelTypedEventBus<OrderEvent>('order-events');

// Register handlers (executed concurrently)
bus.on({
  name: 'validator',
  order: 1,
  handle: async event => await validateOrder(event),
});

bus.on({
  name: 'notifier',
  order: 2,
  handle: async event => await sendNotification(event),
});

// All handlers execute in parallel
await bus.emit({
  orderId: 'order-001',
  status: 'paid',
  amount: 99.99
});`}
            </pre>
          </TabPane>

          <TabPane tab="Cross-Tab Broadcast" key="3">
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
              {`import { BroadcastTypedEventBus, SerialTypedEventBus }
  from '@ahoo-wang/fetcher-eventbus';

// Create delegate bus
const delegate = new SerialTypedEventBus<Notification>('notifications');

// Create broadcast bus
const bus = new BroadcastTypedEventBus(delegate, 'my-channel');

// Register handler
bus.on({
  name: 'receiver',
  order: 1,
  handle: event => console.log('Received:', event),
});

// Broadcast to all tabs
await bus.emit({
  type: 'info',
  message: 'Cross-tab message',
  priority: 1
});`}
            </pre>
          </TabPane>

          <TabPane tab="Generic Event Bus" key="4">
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
              {`import { EventBus } from '@ahoo-wang/fetcher-eventbus';

// Define event type mapping
type AppEvents = {
  'user-login': string;
  'order-update': { orderId: string; status: string };
};

// Create supplier function
const supplier = (type: string) => new SerialTypedEventBus(type);

// Create generic event bus
const bus = new EventBus<AppEvents>(supplier);

// Register different event type handlers
bus.on('user-login', {
  name: 'welcome',
  order: 1,
  handle: username => console.log(\`Welcome \${username}!\`),
});

bus.on('order-update', {
  name: 'updater',
  order: 1,
  handle: event => console.log('Order updated:', event),
});

// Emit events
bus.emit('user-login', 'john-doe');
bus.emit('order-update', { orderId: '123', status: 'shipped' });`}
            </pre>
          </TabPane>
        </Tabs>
      </Card>

      <Card title="📊 Event Logs" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button onClick={clearLogs} size="small">
            Clear Logs
          </Button>
          <List
            size="small"
            bordered
            dataSource={logs.slice(-20)} // Show last 20 logs
            renderItem={(item, index) => {
              const isSerial = item.includes('Serial');
              const isParallel = item.includes('Parallel');
              const isBroadcast = item.includes('Broadcast');
              const isGeneric = item.includes('Generic');

              let color = 'default';
              if (isSerial) color = 'blue';
              else if (isParallel) color = 'green';
              else if (isBroadcast) color = 'orange';
              else if (isGeneric) color = 'purple';

              return (
                <List.Item key={index}>
                  <Tag color={color} style={{ marginRight: 8 }}>
                    {isSerial
                      ? 'Serial'
                      : isParallel
                        ? 'Parallel'
                        : isBroadcast
                          ? 'Broadcast'
                          : 'Generic'}
                  </Tag>
                  <Text>{item.replace(/^\[.*?\]\s*(.*?):/, '$1:')}</Text>
                </List.Item>
              );
            }}
            locale={{ emptyText: 'No event logs yet' }}
            style={{ maxHeight: '300px', overflow: 'auto' }}
          />
        </Space>
      </Card>

      <Card>
        <Title level={4}>Core Features</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <div>
                <Tag color="blue">🔄 Serial Execution</Tag>
                <Text>
                  {' '}
                  Event handlers execute in priority order sequentially
                </Text>
              </div>
              <div>
                <Tag color="green">⚡ Parallel Execution</Tag>
                <Text>
                  {' '}
                  Event handlers execute concurrently for better performance
                </Text>
              </div>
              <div>
                <Tag color="orange">🌐 Cross-Tab Broadcast</Tag>
                <Text>
                  {' '}
                  Broadcast events across browser tabs using BroadcastChannel
                  API
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <div>
                <Tag color="purple">📦 Generic Event Bus</Tag>
                <Text> Support for multiple event types with lazy loading</Text>
              </div>
              <div>
                <Tag color="red">🔒 Type Safety</Tag>
                <Text> Full TypeScript support with strict typing</Text>
              </div>
              <div>
                <Tag color="cyan">🧵 Async Support</Tag>
                <Text>
                  {' '}
                  Support for both synchronous and asynchronous handlers
                </Text>
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
              key: 'typed-event-bus',
              label: 'Typed Event Bus (TypedEventBus)',
              children:
                'Dedicated bus for handling single event types, supporting serial or parallel execution modes.',
            },
            {
              key: 'event-bus',
              label: 'Generic Event Bus (EventBus)',
              children:
                'Generic bus for managing multiple event types, supporting lazy loading and type mapping.',
            },
            {
              key: 'broadcast-event-bus',
              label: 'Broadcast Event Bus (BroadcastTypedEventBus)',
              children:
                'Cross-tab event broadcasting based on BroadcastChannel API, supporting local and remote event propagation.',
            },
            {
              key: 'event-handler',
              label: 'Event Handler (EventHandler)',
              children:
                'Interface for defining event processing logic, supporting priority ordering, one-time execution, and async processing.',
            },
          ]}
        />
      </Card>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small" title="🔄 SerialTypedEventBus">
            <Text>
              Execute event handlers serially, maintaining execution order and
              priority
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title="⚡ ParallelTypedEventBus">
            <Text>
              Execute event handlers in parallel for improved concurrent
              performance
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title="🌐 BroadcastTypedEventBus">
            <Text>
              Broadcast events across browser tabs for multi-tab communication
            </Text>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

const meta: Meta = {
  title: 'EventBus/Event Bus System',
  parameters: {
    docs: {
      description: {
        component:
          'Powerful TypeScript event bus library providing serial execution, parallel execution, and cross-tab broadcasting implementations. Supports type-safe event handling, priority ordering, and asynchronous operations.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <EventBusDemo />,
};
