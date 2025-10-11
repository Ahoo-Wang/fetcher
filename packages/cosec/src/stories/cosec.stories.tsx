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
  Tabs,
  Alert,
  Progress,
  Statistic,
  Timeline,
  Descriptions,
  Badge,
  Select,
  Divider,
} from 'antd';
import { AuthorizationRequestInterceptor } from '../authorizationRequestInterceptor';
import { AuthorizationResponseInterceptor } from '../authorizationResponseInterceptor';
import { TokenStorage } from '../tokenStorage';
import { DeviceIdStorage } from '../deviceIdStorage';
import { JwtTokenManager } from '../jwtTokenManager';
import { JwtCompositeToken } from '../jwtToken';
import { CompositeToken, TokenRefresher } from '../tokenRefresher';
import { Fetcher } from '@ahoo-wang/fetcher';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const meta: Meta = {
  title: 'CoSec/Authentication',
  parameters: {
    docs: {
      description: {
        component:
          'Enterprise-grade CoSec authentication system with automatic token management, device tracking, and comprehensive security features.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Mock JWT tokens for demonstration
const createMockJwt = (expiresIn: number = 3600) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'user123',
      exp: Math.floor(Date.now() / 1000) + expiresIn,
      iat: Math.floor(Date.now() / 1000),
      iss: 'cosec-demo',
    }),
  );
  const signature = 'mock-signature';
  return `${header}.${payload}.${signature}`;
};

const createExpiredJwt = () => createMockJwt(-3600); // Expired 1 hour ago

const ComprehensiveCoSecDemo: React.FC = () => {
  // Token Management State
  const [accessToken, setAccessToken] = useState(createMockJwt());
  const [refreshToken, setRefreshToken] = useState(createMockJwt(86400)); // 24 hours
  const [deviceId, setDeviceId] = useState('');
  const [appId, setAppId] = useState('demo-app-001');

  // JWT Lifecycle State
  const [jwtStatus, setJwtStatus] = useState<'valid' | 'expiring' | 'expired'>(
    'valid',
  );
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Interceptor Demo State
  const [interceptorLogs, setInterceptorLogs] = useState<string[]>([]);
  const [mockApiCalls, setMockApiCalls] = useState<any[]>([]);
  const [isIntercepting, setIsIntercepting] = useState(false);

  // Security & Error State
  const [errorScenarios, setErrorScenarios] = useState<string[]>([]);
  const [securityViolations, setSecurityViolations] = useState<string[]>([]);

  // Multi-tenant State
  const [tenants, setTenants] = useState([
    { id: 'tenant-a', appId: 'app-a', deviceId: 'device-a-123' },
    { id: 'tenant-b', appId: 'app-b', deviceId: 'device-b-456' },
  ]);
  const [activeTenant, setActiveTenant] = useState('tenant-a');

  // Performance State
  const [performanceMetrics, setPerformanceMetrics] = useState({
    tokenRefreshTime: 0,
    interceptorOverhead: 0,
    storageOperations: 0,
    totalRequests: 0,
  });

  const addLog = (
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info',
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setInterceptorLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  // Token Management Handlers
  const handleStoreToken = () => {
    const startTime = performance.now();
    const tokenStorage = new TokenStorage();
    const compositeToken: CompositeToken = { accessToken, refreshToken };
    const jwtToken = new JwtCompositeToken(compositeToken);
    tokenStorage.set(jwtToken);

    const endTime = performance.now();
    setPerformanceMetrics(prev => ({
      ...prev,
      storageOperations: prev.storageOperations + (endTime - startTime),
    }));

    addLog('Token stored successfully', 'success');
  };

  const handleRetrieveToken = () => {
    const tokenStorage = new TokenStorage();
    const storedToken = tokenStorage.get();
    if (storedToken) {
      const expTime = storedToken.access.payload?.exp;
      const expiresAt = expTime
        ? new Date(expTime * 1000).toLocaleString()
        : 'Unknown';
      addLog(`Token retrieved: Access token expires at ${expiresAt}`, 'info');
    } else {
      addLog('No token found in storage', 'warning');
    }
  };

  const handleClearTokens = () => {
    const tokenStorage = new TokenStorage();
    tokenStorage.remove();
    addLog('All tokens cleared', 'warning');
  };

  // Device ID Handlers
  const handleGenerateDeviceId = async () => {
    const deviceStorage = new DeviceIdStorage();
    const generatedId = await deviceStorage.getOrCreate();
    setDeviceId(generatedId);
    addLog(`Device ID generated: ${generatedId}`, 'success');
  };

  const handleSetCustomDeviceId = () => {
    const deviceStorage = new DeviceIdStorage();
    deviceStorage.set(deviceId);
    addLog(`Custom device ID set: ${deviceId}`, 'success');
  };

  // JWT Lifecycle Handlers
  const handleSimulateTokenExpiration = () => {
    const expiredToken = createExpiredJwt();
    setAccessToken(expiredToken);
    setJwtStatus('expired');
    addLog(
      'Token expiration simulated - access token is now expired',
      'warning',
    );
  };

  const handleTriggerTokenRefresh = async () => {
    const startTime = performance.now();
    const tokenStorage = new TokenStorage();
    const tokenRefresher: TokenRefresher = {
       
      refresh: async (_: CompositeToken) => {
        addLog('Token refresh initiated...', 'info');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const newAccessToken = createMockJwt();
        const newRefreshToken = createMockJwt(86400);
        setRefreshCount(prev => prev + 1);
        setLastRefreshTime(new Date());
        setJwtStatus('valid');

        addLog('Token refresh completed successfully', 'success');
        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        };
      },
    };

    const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

    try {
      await tokenManager.refresh();
      const endTime = performance.now();
      setPerformanceMetrics(prev => ({
        ...prev,
        tokenRefreshTime: endTime - startTime,
      }));
    } catch (error) {
      addLog(`Token refresh failed: ${error}`, 'error');
    }
  };

  // Interceptor Demo Handlers
  const handleSimulateApiCall = async () => {
    setIsIntercepting(true);
    const startTime = performance.now();

    try {
      // Create a real Fetcher instance with CoSec interceptors
      const fetcher = new Fetcher({
        baseURL: 'https://jsonplaceholder.typicode.com',
      });

      const tokenStorage = new TokenStorage();
      const tokenRefresher: TokenRefresher = {
         
        refresh: async (_: CompositeToken) => {
          addLog('🔄 Automatic token refresh triggered by interceptor', 'info');
          await new Promise(resolve => setTimeout(resolve, 300));
          return {
            accessToken: createMockJwt(),
            refreshToken: createMockJwt(86400),
          };
        },
      };

      const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

      // Add CoSec request interceptor
      const requestInterceptor = new AuthorizationRequestInterceptor({
        tokenManager,
      });
      fetcher.interceptors.request.use(requestInterceptor);

      // Add CoSec response interceptor for handling 401 responses
      const responseInterceptor = new AuthorizationResponseInterceptor({
        tokenManager,
      });
      fetcher.interceptors.response.use(responseInterceptor);

      addLog('🚀 API call initiated with CoSec interceptors', 'info');
      addLog('🔍 AuthorizationRequestInterceptor processing request', 'info');

      // Make a real API call to JSONPlaceholder (public API)
      const exchange = await fetcher.get('/posts/1');

      addLog(
        `📨 Request sent to: https://jsonplaceholder.typicode.com/posts/1`,
        'info',
      );
      addLog(
        `📨 Headers automatically added by interceptor: Authorization, CoSec-Device-Id, CoSec-App-Id, CoSec-Request-Id`,
        'success',
      );

      // Parse response JSON
      const responseData = await exchange.json();
      addLog(
        `✅ API call completed successfully - Status: ${exchange.status}`,
        'success',
      );
      addLog(
        `📄 Response: Post title "${responseData?.title?.substring(0, 50)}..."`,
        'info',
      );

      setMockApiCalls(prev => [
        {
          id: Date.now(),
          request: {
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'CoSec-Device-Id': deviceId || 'demo-device-123',
              'CoSec-App-Id': appId,
              'CoSec-Request-Id': `req-${Date.now()}`,
            },
          },
          response: {
            status: exchange.status,
            data: responseData,
          },
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]); // Keep last 10 calls
    } catch (error) {
      addLog(`❌ API call failed: ${error}`, 'error');
    } finally {
      setIsIntercepting(false);
      const endTime = performance.now();
      setPerformanceMetrics(prev => ({
        ...prev,
        interceptorOverhead: endTime - startTime,
        totalRequests: prev.totalRequests + 1,
      }));
    }
  };

  // Security & Error Handlers
  const handleSimulateSecurityViolation = (scenario: string) => {
    const violations = {
      'invalid-token': 'Attempted to use malformed JWT token',
      'expired-refresh':
        'Refresh token has expired, requiring re-authentication',
      'device-mismatch': 'Device ID does not match stored value',
      'rate-limit': 'Too many authentication attempts detected',
    };

    setSecurityViolations(prev => [
      ...prev,
      violations[scenario as keyof typeof violations],
    ]);
    addLog(
      `🚨 Security violation: ${violations[scenario as keyof typeof violations]}`,
      'error',
    );
  };

  const handleSimulateErrorScenario = (scenario: string) => {
    const errors = {
      'network-failure': 'Network connection lost during token refresh',
      'server-error': 'Authentication server returned 500 error',
      'invalid-grant': 'Refresh token rejected by server',
      'cors-error': 'CORS policy blocked authentication request',
    };

    setErrorScenarios(prev => [
      ...prev,
      errors[scenario as keyof typeof errors],
    ]);
    addLog(
      `💥 Error scenario: ${errors[scenario as keyof typeof errors]}`,
      'error',
    );
  };

  // Multi-tenant Handlers
  const handleSwitchTenant = (tenantId: string) => {
    setActiveTenant(tenantId);
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setAppId(tenant.appId);
      setDeviceId(tenant.deviceId);
      addLog(`🏢 Switched to tenant: ${tenantId}`, 'info');
    }
  };

  const handleAddTenant = () => {
    const newTenant = {
      id: `tenant-${Date.now()}`,
      appId: `app-${Date.now()}`,
      deviceId: `device-${Date.now()}`,
    };
    setTenants(prev => [...prev, newTenant]);
    addLog(`➕ New tenant added: ${newTenant.id}`, 'success');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={2}>🔐 Comprehensive CoSec Authentication Demo</Title>
        <Paragraph>
          Enterprise-grade authentication system with automatic token
          management, device tracking, security monitoring, and multi-tenant
          support. Explore all features through the interactive tabs below.
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="token-management" size="large">
        <TabPane tab="🔑 Token Management" key="token-management">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Token Storage" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder="Access Token (JWT)"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                  />
                  <Input
                    placeholder="Refresh Token (JWT)"
                    value={refreshToken}
                    onChange={e => setRefreshToken(e.target.value)}
                  />
                  <Space>
                    <Button onClick={handleStoreToken} type="primary">
                      Store Tokens
                    </Button>
                    <Button onClick={handleRetrieveToken}>
                      Retrieve Token
                    </Button>
                    <Button onClick={handleClearTokens} danger>
                      Clear All
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Device ID Management" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder="Device ID"
                    value={deviceId}
                    onChange={e => setDeviceId(e.target.value)}
                  />
                  <Space>
                    <Button onClick={handleGenerateDeviceId} type="primary">
                      Generate Device ID
                    </Button>
                    <Button onClick={handleSetCustomDeviceId}>
                      Set Custom ID
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card title="Application Configuration" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Application ID"
                value={appId}
                onChange={e => setAppId(e.target.value)}
                style={{ maxWidth: 300 }}
              />
              <Text type="secondary">
                This ID will be sent in the CoSec-App-Id header for all requests
              </Text>
            </Space>
          </Card>
        </TabPane>

        <TabPane tab="⏰ JWT Token Lifecycle" key="jwt-lifecycle">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card title="Token Status" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Badge
                    status={
                      jwtStatus === 'valid'
                        ? 'success'
                        : jwtStatus === 'expiring'
                          ? 'warning'
                          : 'error'
                    }
                    text={`Status: ${jwtStatus.toUpperCase()}`}
                  />
                  <Statistic title="Refresh Count" value={refreshCount} />
                  {lastRefreshTime && (
                    <Text type="secondary">
                      Last refresh: {lastRefreshTime.toLocaleTimeString()}
                    </Text>
                  )}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={16}>
              <Card title="Lifecycle Controls" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Button onClick={handleSimulateTokenExpiration} danger>
                      Simulate Token Expiration
                    </Button>
                    <Button onClick={handleTriggerTokenRefresh} type="primary">
                      Trigger Token Refresh
                    </Button>
                  </Space>
                  <Alert
                    message="Token Lifecycle Demo"
                    description="Click 'Simulate Token Expiration' to make the current token invalid, then 'Trigger Token Refresh' to see automatic renewal."
                    type="info"
                    showIcon
                  />
                </Space>
              </Card>
            </Col>
          </Row>

          <Card title="Token Timeline" size="small">
            <Timeline
              items={[
                {
                  children: 'Access token created',
                  color: 'green',
                },
                {
                  children: 'Token stored in secure storage',
                  color: 'blue',
                },
                ...(refreshCount > 0
                  ? [
                      {
                        children: `Token refreshed ${refreshCount} time(s)`,
                        color: 'orange',
                      },
                    ]
                  : []),
                {
                  children: 'Token ready for API requests',
                  color: 'green',
                },
              ]}
            />
          </Card>
        </TabPane>

        <TabPane tab="🔗 Request Interceptors" key="interceptors">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Interceptor Demo" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    onClick={handleSimulateApiCall}
                    type="primary"
                    loading={isIntercepting}
                    block
                  >
                    {isIntercepting
                      ? 'Processing Request...'
                      : 'Simulate API Call'}
                  </Button>
                  <Text type="secondary">
                    This will demonstrate how the
                    AuthorizationRequestInterceptor automatically adds
                    authentication headers to outgoing requests.
                  </Text>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Recent API Calls" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {mockApiCalls.slice(0, 3).map(call => (
                    <Card
                      key={call.id}
                      size="small"
                      style={{ backgroundColor: '#f6ffed' }}
                    >
                      <Text strong>
                        {call.request.method} {call.request.url}
                      </Text>
                      <br />
                      <Text type="secondary">
                        Status: {call.response.status}
                      </Text>
                      <br />
                      <Text type="secondary">
                        {call.timestamp.toLocaleTimeString()}
                      </Text>
                    </Card>
                  ))}
                  {mockApiCalls.length === 0 && (
                    <Text type="secondary">No API calls made yet</Text>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>

          <Card title="Activity Log" size="small">
            <TextArea
              rows={10}
              value={interceptorLogs.join('\n')}
              readOnly
              placeholder="Interceptor activity will appear here..."
            />
          </Card>
        </TabPane>

        <TabPane tab="🛡️ Security & Errors" key="security">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Security Violations" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space wrap>
                    <Button
                      onClick={() =>
                        handleSimulateSecurityViolation('invalid-token')
                      }
                      danger
                    >
                      Invalid Token
                    </Button>
                    <Button
                      onClick={() =>
                        handleSimulateSecurityViolation('expired-refresh')
                      }
                      danger
                    >
                      Expired Refresh Token
                    </Button>
                    <Button
                      onClick={() =>
                        handleSimulateSecurityViolation('device-mismatch')
                      }
                      danger
                    >
                      Device Mismatch
                    </Button>
                    <Button
                      onClick={() =>
                        handleSimulateSecurityViolation('rate-limit')
                      }
                      danger
                    >
                      Rate Limit
                    </Button>
                  </Space>
                  <div>
                    <Text strong>Detected Violations:</Text>
                    {securityViolations.map((violation, index) => (
                      <div key={index}>
                        <Tag color="red">{violation}</Tag>
                      </div>
                    ))}
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Error Scenarios" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space wrap>
                    <Button
                      onClick={() =>
                        handleSimulateErrorScenario('network-failure')
                      }
                      danger
                    >
                      Network Failure
                    </Button>
                    <Button
                      onClick={() =>
                        handleSimulateErrorScenario('server-error')
                      }
                      danger
                    >
                      Server Error
                    </Button>
                    <Button
                      onClick={() =>
                        handleSimulateErrorScenario('invalid-grant')
                      }
                      danger
                    >
                      Invalid Grant
                    </Button>
                    <Button
                      onClick={() => handleSimulateErrorScenario('cors-error')}
                      danger
                    >
                      CORS Error
                    </Button>
                  </Space>
                  <div>
                    <Text strong>Simulated Errors:</Text>
                    {errorScenarios.map((error, index) => (
                      <div key={index}>
                        <Tag color="orange">{error}</Tag>
                      </div>
                    ))}
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card title="Security Best Practices" size="small">
            <Space direction="vertical">
              <div>
                <Tag color="green">🔐</Tag>
                <Text strong>Token Security:</Text>
                <ul>
                  <li>Always validate JWT tokens before use</li>
                  <li>
                    Implement automatic token refresh with proper expiration
                    checks
                  </li>
                  <li>Store tokens securely using encrypted storage</li>
                  <li>Never log or expose tokens in client-side code</li>
                </ul>
              </div>
              <div>
                <Tag color="blue">🛡️</Tag>
                <Text strong>Request Security:</Text>
                <ul>
                  <li>Use HTTPS for all authentication requests</li>
                  <li>Implement proper CORS policies</li>
                  <li>Add request IDs for tracking and debugging</li>
                  <li>Validate all input parameters</li>
                </ul>
              </div>
              <div>
                <Tag color="orange">📱</Tag>
                <Text strong>Device Security:</Text>
                <ul>
                  <li>Generate unique device IDs for tracking</li>
                  <li>Implement device-based rate limiting</li>
                  <li>Monitor for suspicious device activity</li>
                  <li>Support device de-authorization</li>
                </ul>
              </div>
              <div>
                <Tag color="purple">🚨</Tag>
                <Text strong>Error Handling:</Text>
                <ul>
                  <li>Handle authentication errors gracefully</li>
                  <li>Implement exponential backoff for retries</li>
                  <li>Provide clear error messages to users</li>
                  <li>Log security events for monitoring</li>
                </ul>
              </div>
            </Space>
          </Card>

          <Card title="Error Recovery Patterns" size="small">
            <Space direction="vertical">
              <div>
                <Text strong>🔄 Token Refresh Flow:</Text>
                <Timeline>
                  <Timeline.Item color="red">
                    Request fails with 401
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    Check if refresh token is valid
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    Attempt token refresh
                  </Timeline.Item>
                  <Timeline.Item color="green">
                    Retry original request with new token
                  </Timeline.Item>
                  <Timeline.Item color="purple">
                    Redirect to login if refresh fails
                  </Timeline.Item>
                </Timeline>
              </div>
              <Divider />
              <div>
                <Text strong>🌐 Network Error Recovery:</Text>
                <ul>
                  <li>Implement retry logic with exponential backoff</li>
                  <li>Cache authentication state during offline periods</li>
                  <li>Queue requests for retry when connection is restored</li>
                  <li>Show appropriate user feedback during network issues</li>
                </ul>
              </div>
            </Space>
          </Card>
        </TabPane>

        <TabPane tab="🏢 Multi-Tenant Authentication" key="multi-tenant">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Tenant Management" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Select
                    value={activeTenant}
                    onChange={handleSwitchTenant}
                    style={{ width: '100%' }}
                  >
                    {tenants.map(tenant => (
                      <Option key={tenant.id} value={tenant.id}>
                        {tenant.id} ({tenant.appId})
                      </Option>
                    ))}
                  </Select>
                  <Button onClick={handleAddTenant} type="primary">
                    Add New Tenant
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Active Tenant Details" size="small">
                {(() => {
                  const tenant = tenants.find(t => t.id === activeTenant);
                  return tenant ? (
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="Tenant ID">
                        {tenant.id}
                      </Descriptions.Item>
                      <Descriptions.Item label="Application ID">
                        {tenant.appId}
                      </Descriptions.Item>
                      <Descriptions.Item label="Device ID">
                        {tenant.deviceId}
                      </Descriptions.Item>
                    </Descriptions>
                  ) : null;
                })()}
              </Card>
            </Col>
          </Row>

          <Card title="All Tenants" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {tenants.map(tenant => (
                <Card
                  key={tenant.id}
                  size="small"
                  style={{
                    backgroundColor:
                      tenant.id === activeTenant ? '#e6f7ff' : undefined,
                  }}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text strong>{tenant.id}</Text>
                      <br />
                      <Text type="secondary">
                        App: {tenant.appId} | Device: {tenant.deviceId}
                      </Text>
                    </Col>
                    <Col>
                      {tenant.id === activeTenant && (
                        <Tag color="blue">Active</Tag>
                      )}
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>

          <Card title="Multi-Tenant Patterns" size="small">
            <Space direction="vertical">
              <div>
                <Text strong>🏗️ Architecture Patterns:</Text>
                <ul>
                  <li>
                    <strong>Isolated Storage:</strong> Each tenant has separate
                    token/device storage
                  </li>
                  <li>
                    <strong>Scoped Configuration:</strong> Tenant-specific app
                    IDs and endpoints
                  </li>
                  <li>
                    <strong>Independent Sessions:</strong> Tenants maintain
                    separate authentication states
                  </li>
                  <li>
                    <strong>Shared Infrastructure:</strong> Common
                    authentication logic with tenant context
                  </li>
                </ul>
              </div>
              <Divider />
              <div>
                <Text strong>🔧 Implementation Strategies:</Text>
                <ul>
                  <li>Use tenant ID as storage key prefix for isolation</li>
                  <li>Implement tenant-aware token refreshers</li>
                  <li>Configure different base URLs per tenant</li>
                  <li>Handle tenant-specific error scenarios</li>
                </ul>
              </div>
              <Divider />
              <div>
                <Text strong>🚀 Use Cases:</Text>
                <ul>
                  <li>
                    <strong>SaaS Applications:</strong> Multiple customers
                    sharing infrastructure
                  </li>
                  <li>
                    <strong>Multi-Brand Products:</strong> Different
                    authentication for brand variants
                  </li>
                  <li>
                    <strong>Development Environments:</strong> Separate
                    staging/production tenants
                  </li>
                  <li>
                    <strong>White-Label Solutions:</strong> Customized auth
                    flows per client
                  </li>
                </ul>
              </div>
            </Space>
          </Card>
        </TabPane>

        <TabPane tab="📊 Performance Monitoring" key="performance">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Card size="small">
                <Statistic
                  title="Token Refresh Time"
                  value={performanceMetrics.tokenRefreshTime}
                  suffix="ms"
                  precision={2}
                />
              </Card>
            </Col>

            <Col xs={24} md={6}>
              <Card size="small">
                <Statistic
                  title="Interceptor Overhead"
                  value={performanceMetrics.interceptorOverhead}
                  suffix="ms"
                  precision={2}
                />
              </Card>
            </Col>

            <Col xs={24} md={6}>
              <Card size="small">
                <Statistic
                  title="Storage Operations"
                  value={performanceMetrics.storageOperations}
                  suffix="ms"
                  precision={2}
                />
              </Card>
            </Col>

            <Col xs={24} md={6}>
              <Card size="small">
                <Statistic
                  title="Total Requests"
                  value={performanceMetrics.totalRequests}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Performance Insights" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div>
                    <Text strong>Token Refresh Performance</Text>
                    <Progress
                      percent={Math.min(
                        (performanceMetrics.tokenRefreshTime / 1000) * 100,
                        100,
                      )}
                      status={
                        performanceMetrics.tokenRefreshTime < 500
                          ? 'success'
                          : performanceMetrics.tokenRefreshTime < 1000
                            ? 'normal'
                            : 'exception'
                      }
                      format={() =>
                        `${performanceMetrics.tokenRefreshTime.toFixed(2)}ms`
                      }
                    />
                    <Text type="secondary">
                      {performanceMetrics.tokenRefreshTime < 500
                        ? 'Excellent (< 500ms)'
                        : performanceMetrics.tokenRefreshTime < 1000
                          ? 'Good (500-1000ms)'
                          : 'Needs optimization (> 1000ms)'}
                    </Text>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div>
                    <Text strong>Request Success Rate</Text>
                    <Progress
                      percent={performanceMetrics.totalRequests > 0 ? 100 : 0}
                      status="success"
                      format={() =>
                        `${performanceMetrics.totalRequests} requests`
                      }
                    />
                    <Text type="secondary">
                      All requests completed successfully
                    </Text>
                  </div>
                </Col>
              </Row>

              <Divider />

              <Text strong>🚀 Performance Optimization Strategies:</Text>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <ul>
                    <li>
                      <strong>Connection Pooling:</strong> Reuse connections for
                      token refresh
                    </li>
                    <li>
                      <strong>Token Caching:</strong> Reduce refresh frequency
                      with smart caching
                    </li>
                    <li>
                      <strong>Batch Headers:</strong> Add auth headers
                      efficiently
                    </li>
                    <li>
                      <strong>Async Storage:</strong> Non-blocking token storage
                      operations
                    </li>
                  </ul>
                </Col>
                <Col xs={24} md={12}>
                  <ul>
                    <li>
                      <strong>Request Deduplication:</strong> Avoid duplicate
                      auth requests
                    </li>
                    <li>
                      <strong>Early Expiration:</strong> Refresh tokens before
                      they expire
                    </li>
                    <li>
                      <strong>Memory Management:</strong> Clean up unused token
                      data
                    </li>
                    <li>
                      <strong>Monitoring:</strong> Track auth performance in
                      production
                    </li>
                  </ul>
                </Col>
              </Row>

              <Divider />

              <Text strong>📈 Key Performance Indicators (KPIs):</Text>
              <ul>
                <li>
                  <strong>Token Refresh Latency:</strong> &lt; 500ms for optimal
                  UX
                </li>
                <li>
                  <strong>Authentication Success Rate:</strong> &gt; 99.9%
                  target
                </li>
                <li>
                  <strong>Storage Operation Time:</strong> &lt; 10ms for local
                  storage
                </li>
                <li>
                  <strong>Interceptor Overhead:</strong> &lt; 5ms per request
                </li>
              </ul>
            </Space>
          </Card>
        </TabPane>
      </Tabs>

      <Card>
        <Title level={4}>🚀 Key Features Demonstrated</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Space direction="vertical">
              <div>
                <Tag color="blue">🔄 Auto Token Refresh</Tag>
                <Text> Handles expiration automatically</Text>
              </div>
              <div>
                <Tag color="green">📱 Device Tracking</Tag>
                <Text> Unique device identification</Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space direction="vertical">
              <div>
                <Tag color="orange">🔗 Request Interception</Tag>
                <Text> Automatic header injection</Text>
              </div>
              <div>
                <Tag color="purple">🛡️ Security Monitoring</Tag>
                <Text> Violation detection</Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space direction="vertical">
              <div>
                <Tag color="cyan">🏢 Multi-Tenant</Tag>
                <Text> Isolated authentication</Text>
              </div>
              <div>
                <Tag color="magenta">📊 Performance</Tag>
                <Text> Monitoring & metrics</Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space direction="vertical">
              <div>
                <Tag color="geekblue">🔐 Secure Storage</Tag>
                <Text> Encrypted token storage</Text>
              </div>
              <div>
                <Tag color="gold">⚡ Error Handling</Tag>
                <Text> Graceful failure recovery</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    </Space>
  );
};

export const Default: Story = {
  render: () => <ComprehensiveCoSecDemo />,
};
