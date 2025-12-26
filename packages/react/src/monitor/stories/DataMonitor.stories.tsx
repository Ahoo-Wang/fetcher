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
import React, { useState } from 'react';
import { DataMonitor } from '../dataMonitor';
import { DataUpdatedEvent, MonitorConfig, NotifyContent } from '../types';
import {
  Button,
  Card,
  List,
  Space,
  Typography,
  Badge,
  Statistic,
  Row,
  Col,
  Tag,
  InputNumber,
} from 'antd';
import { useEventSubscription } from '../../eventbus';

const { Title, Text, Paragraph } = Typography;

// Mock API that returns changing data
const MOCK_API_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=weather_code,rain,precipitation,apparent_temperature,relative_humidity_2m,temperature_2m,cloud_cover';

interface Weather {
  latitude: number;
  longitude: string;
  generationtime_ms: number;
  elevation: number;
  current: CurrentWeather;
}

interface CurrentWeather {
  time: string;
  interval: number;
  weather_code: number;
  rain: number;
  precipitation: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  temperature_2m: number;
  cloud_cover: number;
}

const DataMonitorDemo: React.FC = () => {
  const [currentData, setCurrentData] = useState<Weather | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [notifications, setNotifications] = useState<NotifyContent[]>([]);
  const [interval, setInterval] = useState(5000); // 5 seconds for demo
  const [changeCount, setChangeCount] = useState(0);

  const monitor = new DataMonitor({
    key: 'demo-monitor',
    maxRetryCount: 2,
  });

  const clearNotification = () => {
    setNotifications([]);
  };

  const {} = useEventSubscription<DataUpdatedEvent>({
    bus: monitor.eventBus,
    handler: {
      name: 'demo-notification',
      order: 1,
      handle: (event: DataUpdatedEvent) => {
        setCurrentData(event.latestData);
        setChangeCount(prevCount => prevCount + 1);

        if (event.content) {
          setTimeout(() => {
            const newNotification = {
              title: event.content!.title,
              message: `${event.content!.message} - time: ${Date.now()}`,
            };
            setNotifications(prev => [...prev, newNotification]); // prev = 最新的list
          }, 500);
        }
      },
    },
  });

  const startMonitoring = async () => {
    const monitorConfig: MonitorConfig<Weather> = {
      id: 'posts-monitor',
      fetchRequest: {
        url: MOCK_API_URL,
        method: 'GET',
      },
      notifyContent: {
        title: 'Weather Updated',
        message: 'Weather data has been updated',
      },
      interval,
    };

    try {
      await monitor.registerMonitor(monitorConfig);
      setIsMonitoring(true);

      setCurrentData(monitor.getMonitor('posts-monitor').latestData);

      return () => monitor.unregisterMonitor(monitorConfig.id);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const stopMonitoring = () => {
    if (!monitor) return;

    monitor.unregisterMonitor('posts-monitor');
    setIsMonitoring(false);
  };

  return (
    <Space
      orientation="vertical"
      size="large"
      style={{ width: '100%', maxWidth: 1200 }}
    >
      <Card>
        <Title level={2}>📊 DataMonitor Demo</Title>
        <Paragraph>
          Demonstration of the DataMonitor class for monitoring data changes
          with periodic fetching, change detection, and notification handling.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Monitor Controls" size="small">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Monitoring Interval (ms): </Text>
                <InputNumber
                  value={interval}
                  onChange={value => setInterval(value || 5000)}
                  min={1000}
                  max={60000}
                  step={1000}
                  disabled={isMonitoring}
                  style={{ width: 120 }}
                />
              </div>

              <Space>
                <Button
                  type="primary"
                  onClick={startMonitoring}
                  disabled={isMonitoring || !monitor}
                >
                  Start Monitoring
                </Button>
                <Button
                  danger
                  onClick={stopMonitoring}
                  disabled={!isMonitoring}
                >
                  Stop Monitoring
                </Button>
              </Space>

              <div>
                <Text strong>Status: </Text>
                <Badge
                  status={isMonitoring ? 'processing' : 'default'}
                  text={isMonitoring ? 'Active' : 'Inactive'}
                />
              </div>
            </Space>
          </Card>

          <Card title="Statistics" size="small" style={{ marginTop: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Statistic title="Data Changes" value={changeCount} />
              </Col>
              <Col span={12}></Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Current Data" size="small">
            {currentData ? (
              <Space orientation="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Position: </Text>
                  <Text>
                    {currentData.latitude} | {currentData.longitude}
                  </Text>
                </div>
                <div>
                  <Text strong>Time: </Text>
                  <Text>{currentData.current.time}</Text>
                </div>
                <div>
                  <Text strong>Temperature: </Text>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    {currentData.current.temperature_2m}
                  </Text>
                </div>
                <div>
                  <Text strong>Apparent Temperature: </Text>
                  <Text>{currentData.current.apparent_temperature}</Text>
                </div>
                <div>
                  <Text strong>Generation Time(ms): </Text>
                  <Text>{currentData.generationtime_ms}</Text>
                </div>
              </Space>
            ) : (
              <Text type="secondary">No data loaded yet</Text>
            )}
          </Card>

          <Card
            title="Notifications"
            size="small"
            style={{ marginTop: 16 }}
            extra={
              <Button size="small" onClick={clearNotification}>
                Clear
              </Button>
            }
          >
            <List
              size="small"
              dataSource={notifications}
              renderItem={(item, index) => (
                <List.Item key={index}>
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Tag color="blue">🔔</Tag>
                      <Text strong>{item.title}</Text>
                    </Space>
                    <Text>{item.message}</Text>
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: 'No notifications yet' }}
              style={{ maxHeight: 200, overflow: 'auto' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="How it Works" size="small">
        <Space orientation="vertical">
          <Text>
            1. <strong>Configuration</strong>: Set up a monitor with a fetch
            request and interval
          </Text>
          <Text>
            2. <strong>Registration</strong>: Register the monitor to start
            periodic fetching
          </Text>
          <Text>
            3. <strong>Change Detection</strong>: DataMonitor performs deep
            equality checks on fetched data
          </Text>
          <Text>
            4. <strong>Notification</strong>: Triggers notifications when data
            changes are detected
          </Text>
          <Text>
            5. <strong>Persistence</strong>: Latest data is persisted using
            MonitorStorage
          </Text>
          <Text>
            6. <strong>Retry Logic</strong>: Implements exponential backoff for
            failed requests
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

const meta: Meta<typeof DataMonitorDemo> = {
  title: 'React/Monitor/DataMonitor',
  component: DataMonitorDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DataMonitor is a class for monitoring data changes through periodic HTTP requests. It provides change detection, notification handling, retry logic, and data persistence.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicDemo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Basic demonstration of DataMonitor functionality including starting/stopping monitoring, change detection, and notification handling.',
      },
    },
  },
};
