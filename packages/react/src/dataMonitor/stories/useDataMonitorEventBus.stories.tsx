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
import React, { useState, useCallback } from 'react';
import { useDataMonitorEventBus, dataMonitorEventBus, DataChangedEvent } from '../useDataMonitorEventBus';
import { Card, Button, Space, Typography, List, Tag, Badge, Descriptions, Input, Form } from 'antd';

const { Text } = Typography;

interface EventBusSubscriberProps {
  handlerName: string;
}

function EventBusSubscriber({ handlerName }: EventBusSubscriberProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [events, setEvents] = useState<DataChangedEvent[]>([]);
  const { subscribe, unsubscribe } = useDataMonitorEventBus();

  const handle = useCallback((event: DataChangedEvent) => {
    setEvents(prev => [event, ...prev]);
  }, []);

  const handleSubscribe = () => {
    subscribe({
      name: handlerName,
      handle,
    });
    setIsSubscribed(true);
  };

  const handleUnsubscribe = () => {
    unsubscribe(handlerName);
    setIsSubscribed(false);
  };

  return (
    <Card
      title="Event Bus Subscriber"
      style={{ width: 500 }}
      extra={<Badge status={isSubscribed ? 'success' : 'default'} text={isSubscribed ? 'Subscribed' : 'Not Subscribed'} />}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Handler Name: </Text>
          <Tag>{handlerName}</Tag>
        </div>

        <Space>
          <Button type="primary" onClick={handleSubscribe} disabled={isSubscribed}>
            Subscribe
          </Button>
          <Button onClick={handleUnsubscribe} disabled={!isSubscribed}>
            Unsubscribe
          </Button>
        </Space>

        <div>
          <Text strong>Received Events ({events.length}):</Text>
          <List
            size="small"
            bordered
            dataSource={events.slice(0, 5)}
            style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}
            renderItem={(event) => (
              <List.Item key={`${event.viewId}-${event.currentTotal}`}>
                <Space direction="vertical" size="small">
                  <Space>
                    <Tag color="blue">{event.type}</Tag>
                    <Text>View: {event.viewName}</Text>
                  </Space>
                  <Text type="secondary">
                    {event.previousTotal} → {event.currentTotal}
                  </Text>
                </Space>
              </List.Item>
            )}
            locale={{ emptyText: 'No events received yet' }}
          />
        </div>
      </Space>
    </Card>
  );
}

interface EventEmitterProps {
  defaultViewId?: string;
  defaultViewName?: string;
}

function EventEmitter({ defaultViewId = 'storybook-view', defaultViewName = 'Storybook View' }: EventEmitterProps) {
  const [form] = Form.useForm();
  const [isEmitting, setIsEmitting] = useState(false);
  const [lastEmitted, setLastEmitted] = useState<DataChangedEvent | null>(null);

  const handleEmit = async (values: { previousTotal: number; currentTotal: number }) => {
    setIsEmitting(true);
    const event: DataChangedEvent = {
      type: 'DATA_CHANGED',
      viewId: form.getFieldValue('viewId') || defaultViewId,
      viewName: form.getFieldValue('viewName') || defaultViewName,
      previousTotal: values.previousTotal,
      currentTotal: values.currentTotal,
    };

    await dataMonitorEventBus.emit(event);
    setLastEmitted(event);
    setIsEmitting(false);
  };

  return (
    <Card title="Event Emitter (Test Tool)" style={{ width: 400 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          viewId: defaultViewId,
          viewName: defaultViewName,
          previousTotal: 10,
          currentTotal: 20,
        }}
        onFinish={handleEmit}
      >
        <Form.Item label="View ID" name="viewId">
          <Input />
        </Form.Item>
        <Form.Item label="View Name" name="viewName">
          <Input />
        </Form.Item>
        <Form.Item label="Previous Total" name="previousTotal">
          <Input type="number" />
        </Form.Item>
        <Form.Item label="Current Total" name="currentTotal">
          <Input type="number" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={isEmitting} block>
          Emit Event
        </Button>
      </Form>

      {lastEmitted && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Last emitted:</Text>
          <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
            <Descriptions.Item label="View ID">{lastEmitted.viewId}</Descriptions.Item>
            <Descriptions.Item label="View Name">{lastEmitted.viewName}</Descriptions.Item>
            <Descriptions.Item label="Change">
              {lastEmitted.previousTotal} → {lastEmitted.currentTotal}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Card>
  );
}

function SubscriberWithEmitter() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [events, setEvents] = useState<DataChangedEvent[]>([]);
  const { subscribe, unsubscribe } = useDataMonitorEventBus();
  const handlerName = 'storybook-handler';

  const handle = useCallback((event: DataChangedEvent) => {
    setEvents(prev => [event, ...prev]);
  }, []);

  const handleSubscribe = () => {
    subscribe({
      name: handlerName,
      handle,
    });
    setIsSubscribed(true);
  };

  const handleUnsubscribe = () => {
    unsubscribe(handlerName);
    setIsSubscribed(false);
  };

  const handleEmit = async (values: { previousTotal: number; currentTotal: number }) => {
    const event: DataChangedEvent = {
      type: 'DATA_CHANGED',
      viewId: 'storybook-view',
      viewName: 'Storybook View',
      previousTotal: values.previousTotal,
      currentTotal: values.currentTotal,
    };
    await dataMonitorEventBus.emit(event);
  };

  return (
    <Space size="large">
      <Card
        title="Event Bus Subscriber"
        style={{ width: 450 }}
        extra={<Badge status={isSubscribed ? 'success' : 'default'} text={isSubscribed ? 'Subscribed' : 'Not Subscribed'} />}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button type="primary" onClick={handleSubscribe} disabled={isSubscribed}>
              Subscribe
            </Button>
            <Button onClick={handleUnsubscribe} disabled={!isSubscribed}>
              Unsubscribe
            </Button>
          </Space>

          <div>
            <Text strong>Received Events ({events.length}):</Text>
            <List
              size="small"
              bordered
              dataSource={events.slice(0, 5)}
              style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}
              renderItem={(event) => (
                <List.Item key={`${event.viewId}-${event.currentTotal}`}>
                  <Space direction="vertical" size="small">
                    <Space>
                      <Tag color="blue">{event.type}</Tag>
                      <Text>View: {event.viewName}</Text>
                    </Space>
                    <Text type="secondary">
                      {event.previousTotal} → {event.currentTotal}
                    </Text>
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: 'No events received yet' }}
            />
          </div>
        </Space>
      </Card>

      <EventEmitter defaultViewId="storybook-view" defaultViewName="Storybook View" />
    </Space>
  );
}

const meta: Meta<typeof EventBusSubscriber> = {
  title: 'React/Hooks/useDataMonitorEventBus',
  component: EventBusSubscriber,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook for subscribing to data change events from the DataMonitor event bus.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    handlerName: 'basic-handler',
  },
};

export const EventDisplay: Story = {
  args: {
    handlerName: 'event-display-handler',
  },
  render: () => <SubscriberWithEmitter />,
};
