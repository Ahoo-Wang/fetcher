# @ahoo-wang/fetcher-cosec

Fetcher HTTP 客户端的 CoSec 认证支持。

[CoSec](https://github.com/Ahoo-Wang/CoSec) 是一个全面的身份认证和授权框架，提供：

- 细粒度访问控制
- 多因素认证
- 基于令牌的身份认证与自动刷新
- 设备识别与管理
- 审计日志和监控

此包提供了 Fetcher HTTP 客户端与 CoSec 认证框架之间的集成。

## 功能特性

- 自动添加 CoSec 认证头
- 设备 ID 管理与 localStorage 持久化
- 基于响应码（401, 403）的自动令牌刷新
- 请求 ID 生成用于跟踪
- 令牌存储管理

## 安装

```bash
npm install @ahoo-wang/fetcher-cosec
```

## 使用方法

### 基本设置

```typescript
import {Fetcher} from '@ahoo-wang/fetcher';
import {
    CoSecRequestInterceptor,
    CoSecResponseInterceptor,
    TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

// 创建令牌存储
const tokenStorage = new TokenStorage();

// 创建 Fetcher 实例
const fetcher = new Fetcher({
    baseURL: 'https://api.example.com',
});

// 添加 CoSec 请求拦截器
fetcher.interceptors.request.use(
    new CoSecRequestInterceptor({
        appId: 'your-app-id',
        getAccessToken: () => tokenStorage.getAccessToken(),
        getRefreshToken: () => tokenStorage.getRefreshToken(),
        storeTokens: (accessToken, refreshToken) => {
            tokenStorage.storeTokens(accessToken, refreshToken);
        },
        refreshTokenFn: async () => {
            // 刷新令牌逻辑
            const response = await fetch('/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: tokenStorage.getRefreshToken(),
                }),
            });

            const tokens = await response.json();
            return {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
            };
        },
    }),
);

// 添加 CoSec 响应拦截器
fetcher.interceptors.response.use(
    new CoSecResponseInterceptor({
        appId: 'your-app-id',
        getAccessToken: () => tokenStorage.getAccessToken(),
        getRefreshToken: () => tokenStorage.getRefreshToken(),
        storeTokens: (accessToken, refreshToken) => {
            tokenStorage.storeTokens(accessToken, refreshToken);
        },
        refreshTokenFn: async () => {
            // 刷新令牌逻辑
            const response = await fetch('/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: tokenStorage.getRefreshToken(),
                }),
            });

            const tokens = await response.json();
            return {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
            };
        },
    }),
);
```

### 配置选项

```typescript
interface CoSecOptions {
    /**
     * 应用 ID，将发送到 CoSec-App-Id 头部
     */
    appId: string;

    /**
     * 设备 ID，将发送到 CoSec-Device-Id 头部
     * 如果未提供，将生成新的 Nano ID 并存储在 localStorage 中
     */
    deviceId?: string;

    /**
     * localStorage 中设备 ID 的存储键
     * 默认为 'cosec-device-id'
     */
    deviceIdStorageKey?: string;

    /**
     * 获取当前访问令牌的函数
     */
    getAccessToken: () => string | null;

    /**
     * 获取当前刷新令牌的函数
     */
    getRefreshToken: () => string | null;

    /**
     * 存储令牌的函数
     */
    storeTokens: (accessToken: string, refreshToken: string) => void;

    /**
     * 刷新访问令牌的函数
     * 应返回解析为新令牌的 Promise
     */
    refreshTokenFn: () => Promise<CompositeToken>;
}
```

### 添加的头部

拦截器会自动向请求添加以下头部：

1. `CoSec-Device-Id`: 设备标识符（存储在 localStorage 中或生成）
2. `CoSec-App-Id`: 应用标识符
3. `Authorization`: Bearer 令牌
4. `CoSec-Request-Id`: 每个请求的唯一请求标识符

### 令牌刷新

当服务器返回状态码 401 或 403 时，响应拦截器会自动处理令牌刷新。此时会调用 `refreshTokenFn` 函数来获取新的访问和刷新令牌。

### 令牌存储

包中包含一个 `TokenStorage` 类用于管理 localStorage 中的令牌：

```typescript
import {TokenStorage} from '@ahoo-wang/fetcher-cosec';

const tokenStorage = new TokenStorage();

// 存储令牌
tokenStorage.storeTokens('access-token', 'refresh-token');

// 获取令牌
const accessToken = tokenStorage.getAccessToken();
const refreshToken = tokenStorage.getRefreshToken();

// 清除令牌
tokenStorage.clearTokens();
```

### 设备 ID 存储

包中包含一个 `DeviceIdStorage` 类用于管理 localStorage 中的设备标识符：

```typescript
import {DeviceIdStorage} from '@ahoo-wang/fetcher-cosec';

const deviceIdStorage = new DeviceIdStorage('my-device-id-key');

// 获取或创建设备 ID
const deviceId = deviceIdStorage.getOrCreateDeviceId();

// 存储特定的设备 ID
deviceIdStorage.storeDeviceId('specific-device-id');

// 获取当前设备 ID
const currentDeviceId = deviceIdStorage.getDeviceId();

// 清除存储的设备 ID
deviceIdStorage.clearDeviceId();

// 检查设备 ID 是否存在
const hasDeviceId = deviceIdStorage.hasDeviceId();

// 生成新的设备 ID（不存储）
const newDeviceId = deviceIdStorage.generateDeviceId();
```

## API

### 接口

- `AccessToken`: 包含访问令牌
- `RefreshToken`: 包含刷新令牌
- `CompositeToken`: 包含访问和刷新令牌

### 类

- `TokenStorage`: 管理 localStorage 中的令牌
- `DeviceIdStorage`: 管理 localStorage 中的设备 ID
- `CoSecRequestInterceptor`: 向请求添加 CoSec 头部
- `CoSecResponseInterceptor`: 处理 401/403 响应的令牌刷新

### 授权结果

包中包含授权结果常量：

```typescript
import {AuthorizeResults} from '@ahoo-wang/fetcher-cosec';

// 预定义结果
AuthorizeResults.ALLOW; // 已授权
AuthorizeResults.EXPLICIT_DENY; // 明确拒绝
AuthorizeResults.IMPLICIT_DENY; // 隐式拒绝
AuthorizeResults.TOKEN_EXPIRED; // 令牌过期
AuthorizeResults.TOO_MANY_REQUESTS; // 请求过多

// 自定义结果
AuthorizeResults.allow('自定义原因');
AuthorizeResults.deny('自定义原因');
```

## CoSec 框架

此包设计用于与 [CoSec 认证框架](https://github.com/Ahoo-Wang/CoSec)配合使用。有关 CoSec
功能和特性的更多信息，请访问 [CoSec GitHub 仓库](https://github.com/Ahoo-Wang/CoSec)。

## 许可证

Apache-2.0
