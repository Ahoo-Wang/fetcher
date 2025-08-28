# @ahoo-wang/fetcher-cosec

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-cosec.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

Fetcher HTTP 客户端的 CoSec 认证支持。

[CoSec](https://github.com/Ahoo-Wang/CoSec) 是一个全面的身份认证和授权框架。

此包提供了 Fetcher HTTP 客户端与 CoSec 认证框架之间的集成。

## 🌟 功能特性

- **🔐 自动认证**：自动添加 CoSec 认证头
- **📱 设备管理**：设备 ID 管理与 localStorage 持久化
- **🔄 令牌刷新**：基于响应码（401）的自动令牌刷新
- **🌈 请求跟踪**：请求 ID 生成用于跟踪
- **💾 令牌存储**：安全的令牌存储管理
- **🛡️ TypeScript 支持**：完整的 TypeScript 类型定义

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @ahoo-wang/fetcher-cosec

# 使用 pnpm
pnpm add @ahoo-wang/fetcher-cosec

# 使用 yarn
yarn add @ahoo-wang/fetcher-cosec
```

### 集成测试示例：CoSec 集成

以下示例展示了如何设置 CoSec 认证，类似于 Fetcher
项目中的集成测试。您可以在 [integration-test/src/cosec/cosec.ts](../../integration-test/src/cosec/cosec.ts) 中找到完整实现。

```typescript
import {
  CompositeToken,
  CoSecOptions,
  CoSecRequestInterceptor,
  CoSecResponseInterceptor,
  DeviceIdStorage,
  TokenRefresher,
  TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

export class MockTokenRefresher implements TokenRefresher {
  refresh(_token: CompositeToken): Promise<CompositeToken> {
    return Promise.reject('令牌刷新失败');
  }
}

const cosecOptions: CoSecOptions = {
  appId: 'appId',
  deviceIdStorage: new DeviceIdStorage(),
  tokenStorage: new TokenStorage(),
  tokenRefresher: new MockTokenRefresher(),
};

export const cosecRequestInterceptor = new CoSecRequestInterceptor(
  cosecOptions,
);
export const cosecResponseInterceptor = new CoSecResponseInterceptor(
  cosecOptions,
);
```

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

// 创建 Fetcher 实例
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// 创建存储实例
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// 创建令牌刷新器
const tokenRefresher: TokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    // 刷新令牌逻辑
    const response = await fetcher.fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: token,
    });

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  },
};

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

## 🔧 配置

### CoSecOptions 接口

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

## 📚 API 参考

### 核心类

#### CoSecRequestInterceptor

向传出请求添加 CoSec 认证头部。

```typescript
new CoSecRequestInterceptor(options
:
CoSecOptions
)
```

#### CoSecResponseInterceptor

在服务器返回状态码 401 时处理令牌刷新。

```typescript
new CoSecResponseInterceptor(options
:
CoSecOptions
)
```

#### TokenStorage

管理 localStorage 中的令牌存储。

```typescript
const tokenStorage = new TokenStorage();

// 存储令牌
tokenStorage.set({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
});

// 获取令牌
const token = tokenStorage.get();

// 清除令牌
tokenStorage.clear();
```

#### DeviceIdStorage

管理 localStorage 中的设备 ID 存储。

```typescript
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

#### InMemoryStorage

无 localStorage 环境的内存存储后备。

```typescript
const inMemoryStorage = new InMemoryStorage();
```

### 接口

- `AccessToken`: 包含访问令牌
- `RefreshToken`: 包含刷新令牌
- `CompositeToken`: 包含访问和刷新令牌
- `TokenRefresher`: 提供刷新令牌的方法

## 🛠️ 示例

### 完整认证设置

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecRequestInterceptor,
  CoSecResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

// 创建存储实例
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// 创建令牌刷新器
const tokenRefresher = {
  async refresh(token) {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('令牌刷新失败');
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },
};

// 创建带 CoSec 拦截器的 fetcher
const secureFetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

secureFetcher.interceptors.request.use(
  new CoSecRequestInterceptor({
    appId: 'my-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);

secureFetcher.interceptors.response.use(
  new CoSecResponseInterceptor({
    appId: 'my-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);

// 使用 fetcher
const response = await secureFetcher.get('/api/user/profile');
```

## 🧪 测试

```bash
# 运行测试
pnpm test

# 运行带覆盖率的测试
pnpm test --coverage
```

## 🌐 CoSec 框架

此包设计用于与 [CoSec 认证框架](https://github.com/Ahoo-Wang/CoSec) 配合使用。有关 CoSec
功能和特性的更多信息，请访问 [CoSec GitHub 仓库](https://github.com/Ahoo-Wang/CoSec)。

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 了解更多详情。

## 📄 许可证

Apache-2.0

---

<p align="center">
  Fetcher 生态系统的一部分
</p>
