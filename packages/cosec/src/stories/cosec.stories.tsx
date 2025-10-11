import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Typography, Space, Button, Input, Row, Col, Tag } from 'antd';
import { AuthorizationRequestInterceptor } from '../authorizationRequestInterceptor';
import { TokenStorage } from '../tokenStorage';
import { DeviceIdStorage } from '../deviceIdStorage';
import { JwtTokenManager } from '../jwtTokenManager';
import { JwtCompositeToken } from '../jwtToken';
import { CompositeToken } from '../tokenRefresher';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const meta: Meta = {
  title: 'CoSec/Authentication',
  parameters: {
    docs: {
      description: {
        component:
          'CoSec authentication system for automatic token management and request authorization.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const AuthenticationDemo: React.FC = () => {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleSetToken = () => {
    if (!accessToken || !refreshToken) {
      addLog('Please provide both access and refresh tokens');
      return;
    }

    const tokenStorage = new TokenStorage();
    const compositeToken: CompositeToken = {
      accessToken,
      refreshToken,
    };
    const jwtToken = new JwtCompositeToken(compositeToken);
    tokenStorage.set(jwtToken);
    addLog('Token stored successfully');
  };

  const handleGetToken = async () => {
    const tokenStorage = new TokenStorage();
    const storedToken = tokenStorage.get();
    addLog(`Retrieved token: ${storedToken ? 'Present' : 'Not found'}`);
  };

  const handleSetDeviceId = () => {
    const deviceStorage = new DeviceIdStorage();
    deviceStorage.set(deviceId);
    addLog('Device ID stored successfully');
  };

  const handleGetDeviceId = async () => {
    const deviceStorage = new DeviceIdStorage();
    const storedId = await deviceStorage.get();
    addLog(`Retrieved device ID: ${storedId || 'Not found'}`);
  };

  const handleTestInterceptor = () => {
    const tokenStorage = new TokenStorage();
    const tokenManager = new JwtTokenManager(tokenStorage, {
      refresh: async (token: CompositeToken) => {
        addLog('Token refresh would happen here');
        return token; // Return the same token for demo
      },
    });
    const interceptor = new AuthorizationRequestInterceptor({ tokenManager });

    addLog(
      `AuthorizationRequestInterceptor created with order: ${interceptor.order}`,
    );
    addLog(
      'Interceptor would automatically add Authorization headers to requests',
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3}>🔐 CoSec Authentication Demo</Title>
        <Paragraph>
          Interactive demonstration of the CoSec authentication system including
          token storage, device ID management, and automatic request
          authorization.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Token Management" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Access Token"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
              />
              <Input
                placeholder="Refresh Token"
                value={refreshToken}
                onChange={e => setRefreshToken(e.target.value)}
              />
              <Space>
                <Button onClick={handleSetToken} type="primary">
                  Store Token
                </Button>
                <Button onClick={handleGetToken}>Get Token</Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Device ID Management" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Enter device ID"
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
              />
              <Space>
                <Button onClick={handleSetDeviceId} type="primary">
                  Store Device ID
                </Button>
                <Button onClick={handleGetDeviceId}>Get Device ID</Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Request Interceptor Demo" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            Test how the authorization interceptor automatically adds
            authentication headers to requests.
          </Text>
          <Button onClick={handleTestInterceptor} type="primary">
            Test Authorization Interceptor
          </Button>
        </Space>
      </Card>

      <Card title="Activity Log" size="small">
        <TextArea
          rows={8}
          value={logs.join('\n')}
          readOnly
          placeholder="Authentication activity will appear here..."
        />
      </Card>

      <Card>
        <Title level={4}>Key Features</Title>
        <Space direction="vertical">
          <div>
            <Tag color="blue">Automatic Token Refresh</Tag>
            <Text> Handles token expiration and automatic renewal</Text>
          </div>
          <div>
            <Tag color="green">Device Tracking</Tag>
            <Text> Unique device identification for security</Text>
          </div>
          <div>
            <Tag color="orange">Request Authorization</Tag>
            <Text> Automatic header injection for authenticated requests</Text>
          </div>
          <div>
            <Tag color="purple">Secure Storage</Tag>
            <Text> Encrypted token and device ID storage</Text>
          </div>
        </Space>
      </Card>
    </Space>
  );
};

export const Default: Story = {
  render: () => <AuthenticationDemo />,
};
