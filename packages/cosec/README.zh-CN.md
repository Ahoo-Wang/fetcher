# @ahoo-wang/fetcher-cosec

Fetcher HTTP 客户端的 CoSec 认证支持。

[CoSec](https://github.com/Ahoo-Wang/CoSec) 是一个全面的身份认证和授权框架。

此包提供了 Fetcher HTTP 客户端与 CoSec 认证框架之间的集成。

## 功能特性

- 自动添加 CoSec 认证头
- 设备 ID 管理与 localStorage 持久化
- 基于响应码（401）的自动令牌刷新
- 请求 ID 生成用于跟踪
- 令牌存储管理

## 安装

```bash
npm install @ahoo-wang/fetcher-cosec
```

## 使用方法

### 基本设置

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecRequestInterceptor,
  CoSecResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  TokenRefresher,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// 创建存储实例
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// 创建令牌刷新器
const tokenRefresher: TokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    // 刷新令牌逻辑
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  },
};

// 创建 Fetcher 实例
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// 添加 CoSec 请求拦截器
fetcher.interceptors.request.use(
  new CoSecRequestInterceptor({
    appId: 'your-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);

// 添加 CoSec 响应拦截器
fetcher.interceptors.response.use(
  new CoSecResponseInterceptor({
    appId: 'your-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);
```

### 配置选项

```typescript
interface CoSecOptions {
  /**
   * 应用程序 ID，将在 CoSec-App-Id 头部中发送
   */
  appId: string;

  /**
   * 设备 ID 存储实例
   */
  deviceIdStorage: DeviceIdStorage;

  /**
   * 令牌存储实例
   */
  tokenStorage: TokenStorage;

  /**
   * 令牌刷新函数
   */
  tokenRefresher: TokenRefresher;
}
```

### 添加的头部

拦截器会自动向请求添加以下头部：

1. `CoSec-Device-Id`: 设备标识符（存储在 localStorage 中或生成）
2. `CoSec-App-Id`: 应用程序标识符
3. `Authorization`: Bearer 令牌
4. `CoSec-Request-Id`: 每个请求的唯一请求标识符

### 令牌刷新

响应拦截器会在服务器返回状态码 401 时自动处理令牌刷新。此时会调用 `tokenRefresher.refresh` 函数来获取新的访问和刷新令牌。

### 令牌存储

包中包含一个 `TokenStorage` 类，用于管理 localStorage 中的令牌：

```typescript
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenStorage = new TokenStorage();

// 存储令牌
tokenStorage.set({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
});

// 获取令牌
const token = tokenStorage.get();
if (token) {
  console.log('访问令牌:', token.accessToken);
  console.log('刷新令牌:', token.refreshToken);
}

// 清除令牌
tokenStorage.clear();
```

### 设备 ID 存储

包中包含一个 `DeviceIdStorage` 类，用于管理 localStorage 中的设备标识符：

```typescript
import { DeviceIdStorage } from '@ahoo-wang/fetcher-cosec';

const deviceIdStorage = new DeviceIdStorage();

// 获取或创建设备 ID
const deviceId = deviceIdStorage.getOrCreate();

// 存储特定的设备 ID
deviceIdStorage.set('specific-device-id');

// 获取当前设备 ID
const currentDeviceId = deviceIdStorage.get();

// 清除存储的设备 ID
deviceIdStorage.clear();

// 生成新的设备 ID（不存储）
const newDeviceId = deviceIdStorage.generateDeviceId();
```

## API

### 接口

- `AccessToken`: 包含访问令牌
- `RefreshToken`: 包含刷新令牌
- `CompositeToken`: 包含访问和刷新令牌
- `TokenRefresher`: 提供刷新令牌的方法

### 类

- `TokenStorage`: 管理 localStorage 中的令牌存储
- `DeviceIdStorage`: 管理 localStorage 中的设备 ID 存储
- `CoSecRequestInterceptor`: 向请求添加 CoSec 头部
- `CoSecResponseInterceptor`: 处理 401 响应的令牌刷新
- `InMemoryStorage`: 无 localStorage 环境的内存存储后备

## CoSec 框架

此包设计用于与 [CoSec 认证框架](https://github.com/Ahoo-Wang/CoSec) 配合使用。有关 CoSec
功能和特性的更多信息，请访问 [CoSec GitHub 仓库](https://github.com/Ahoo-Wang/CoSec)。

## 许可证

Apache-2.0
