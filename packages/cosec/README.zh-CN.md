# @ahoo-wang/fetcher-cosec

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-cosec.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-交互式文档-FF4785)](https://fetcher.ahoo.me/?path=/docs/cosec-introduction--docs)

企业级 CoSec 认证集成，为 Fetcher HTTP 客户端提供全面的安全功能，包括自动令牌管理、设备跟踪和请求归属。

[CoSec](https://github.com/Ahoo-Wang/CoSec) 是专为企业应用设计的全面身份认证和授权框架。

此包为 Fetcher HTTP 客户端与 CoSec 认证框架提供了无缝集成，支持企业级安全功能的最小化配置。

## 🌟 功能特性

- **🔐 自动认证**：无缝 CoSec 认证与自动头部注入
- **📱 设备管理**：持久化设备 ID 管理，支持 localStorage 和后备存储
- **🔄 令牌刷新**：基于 401 响应的智能令牌刷新，包含重试逻辑
- **🌈 请求归属**：唯一请求 ID 生成，用于全面 API 跟踪
- **💾 安全令牌存储**：加密 JWT 令牌存储，支持可配置后端
- **🛡️ 企业级安全**：多租户支持、速率限制和安全监控
- **⚡ 性能优化**：最小开销，支持连接池和缓存
- **🛠️ TypeScript 优先**：完整类型定义，严格类型安全
- **🔌 可插拔架构**：模块化设计，易于集成和定制

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

### 基本设置

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  JwtTokenManager,
  CompositeToken,
  TokenRefresher,
} from '@ahoo-wang/fetcher-cosec';

// 创建 Fetcher 实例
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// 创建存储实例
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// 实现令牌刷新器
const tokenRefresher: TokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    // 实现您的令牌刷新逻辑
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

// 创建 JWT 令牌管理器
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

// 配置 CoSec 选项
const cosecOptions = {
  appId: 'your-app-id',
  tokenManager,
  deviceIdStorage,
};

// 添加 CoSec 请求拦截器
fetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor(cosecOptions),
);

// 添加 CoSec 响应拦截器
fetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor(cosecOptions),
);
```

## 🔧 配置

### CoSecOptions 接口

```typescript
interface CoSecOptions
  extends AppIdCapable,
    DeviceIdStorageCapable,
    JwtTokenManagerCapable {
  // 继承自能力接口
}
```

`CoSecOptions` 接口组合了以下能力接口：

```typescript
interface AppIdCapable {
  /**
   * 应用程序 ID，将在 CoSec-App-Id 头部中发送
   */
  appId: string;
}

interface DeviceIdStorageCapable {
  /**
   * 设备 ID 存储实例，用于管理设备标识
   */
  deviceIdStorage: DeviceIdStorage;
}

interface JwtTokenManagerCapable {
  /**
   * JWT 令牌管理器，用于处理令牌操作
   */
  tokenManager: JwtTokenManager;
}
```

### 添加的头部

拦截器会自动向请求添加以下头部：

1. `Authorization: Bearer <access-token>` - Bearer 令牌认证
2. `CoSec-App-Id: <app-id>` - 应用程序标识符
3. `CoSec-Device-Id: <device-id>` - 设备标识符
4. `CoSec-Request-Id: <unique-request-id>` - 唯一请求标识符

## 📚 API 参考

### 核心类

#### AuthorizationRequestInterceptor

自动向传出 HTTP 请求添加 CoSec 认证头部。

```typescript
const interceptor = new AuthorizationRequestInterceptor({
  appId: 'your-app-id',
  tokenManager: jwtTokenManager,
  deviceIdStorage: deviceIdStorage,
});
```

**添加的头部：**

- `Authorization: Bearer <access-token>`
- `CoSec-App-Id: <app-id>`
- `CoSec-Device-Id: <device-id>`
- `CoSec-Request-Id: <unique-request-id>`

#### AuthorizationResponseInterceptor

处理接收到 401 未授权响应时的自动令牌刷新。

```typescript
const interceptor = new AuthorizationResponseInterceptor({
  appId: 'your-app-id',
  tokenManager: jwtTokenManager,
  deviceIdStorage: deviceIdStorage,
});
```

**功能特性：**

- 自动重试带刷新令牌的请求
- 失败重试的指数退避
- 可配置的重试限制

#### JwtTokenManager

管理 JWT 令牌生命周期，包括验证、刷新和存储。

```typescript
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

// 检查令牌是否有效
const isValid = await tokenManager.isValid();

// 手动刷新令牌
await tokenManager.refresh();

// 获取当前令牌
const token = tokenManager.getToken();
```

#### TokenStorage

安全令牌存储，支持 localStorage 后端和后备存储。

```typescript
const tokenStorage = new TokenStorage('optional-prefix');

// 存储复合令牌
tokenStorage.set({
  accessToken: 'eyJ...',
  refreshToken: 'eyJ...',
});

// 检索令牌
const token = tokenStorage.get();

// 移除存储的令牌
tokenStorage.remove();

// 检查令牌是否存在
const exists = tokenStorage.exists();
```

#### DeviceIdStorage

管理 localStorage 中的持久化设备标识。

```typescript
const deviceStorage = new DeviceIdStorage('optional-prefix');

// 获取或创建设备 ID
const deviceId = await deviceStorage.getOrCreate();

// 设置特定设备 ID
deviceStorage.set('custom-device-id');

// 获取当前设备 ID
const currentId = deviceStorage.get();

// 清除存储的设备 ID
deviceStorage.clear();

// 生成新的设备 ID（不存储）
const newId = deviceStorage.generateDeviceId();
```

#### TokenRefresher

实现自定义令牌刷新逻辑的接口。

```typescript
interface TokenRefresher {
  refresh(token: CompositeToken): Promise<CompositeToken>;
}

class CustomTokenRefresher implements TokenRefresher {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('令牌刷新失败');
    }

    const newTokens = await response.json();
    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }
}
```

### 接口与类型

#### 令牌类型

```typescript
interface AccessToken {
  readonly value: string;
}

interface RefreshToken {
  readonly value: string;
}

interface CompositeToken {
  readonly accessToken: string;
  readonly refreshToken: string;
}
```

#### JWT 令牌类型

```typescript
interface JwtPayload {
  readonly sub?: string;
  readonly exp?: number;
  readonly iat?: number;
  readonly iss?: string;
  [key: string]: any;
}

interface JwtToken {
  readonly header: JwtHeader;
  readonly payload: JwtPayload;
  readonly signature: string;
  readonly raw: string;
}
```

#### 配置类型

```typescript
interface CoSecOptions
  extends AppIdCapable,
    DeviceIdStorageCapable,
    JwtTokenManagerCapable {}

interface AppIdCapable {
  readonly appId: string;
}

interface DeviceIdStorageCapable {
  readonly deviceIdStorage: DeviceIdStorage;
}

interface JwtTokenManagerCapable {
  readonly tokenManager: JwtTokenManager;
}
```

#### 响应类型

```typescript
interface AuthorizeResult {
  readonly authorized: boolean;
  readonly reason: string;
}

// 预定义的授权结果
const AuthorizeResults = {
  ALLOW: { authorized: true, reason: 'Allow' },
  EXPLICIT_DENY: { authorized: false, reason: 'Explicit Deny' },
  IMPLICIT_DENY: { authorized: false, reason: 'Implicit Deny' },
  TOKEN_EXPIRED: { authorized: false, reason: 'Token Expired' },
  TOO_MANY_REQUESTS: { authorized: false, reason: 'Too Many Requests' },
} as const;
```

## 🔗 内置拦截器

CoSec 包提供了多个专门的拦截器，用于不同的认证和授权场景：

### 请求拦截器

#### AuthorizationRequestInterceptor

**用途**：向传出请求添加 JWT Bearer 令牌认证头部。

**添加的头部**：

- `Authorization: Bearer <access-token>`

**使用场景**：API 请求的标准 JWT 认证。

```typescript
const interceptor = new AuthorizationRequestInterceptor({
  appId: 'your-app-id',
  tokenManager: jwtTokenManager,
  deviceIdStorage: deviceStorage,
});
```

#### CoSecRequestInterceptor

**用途**：向请求添加基本的 CoSec 标识头部。

**添加的头部**：

- `CoSec-App-Id: <app-id>`
- `CoSec-Device-Id: <device-id>`
- `CoSec-Request-Id: <unique-request-id>`

**使用场景**：设备跟踪和请求归属，无需完整的 JWT 认证。

```typescript
const interceptor = new CoSecRequestInterceptor({
  appId: 'your-app-id',
  deviceIdStorage: deviceStorage,
});
```

#### ResourceAttributionRequestInterceptor

**用途**：从 JWT 令牌声明中自动注入租户和所有者 ID 路径参数。

**功能**：从 JWT 载荷中提取 `tenantId` 和 `sub`（所有者 ID），并将其添加到 URL 路径参数中。

**使用场景**：具有租户范围资源的 SaaS 应用。

```typescript
const interceptor = new ResourceAttributionRequestInterceptor({
  tenantId: 'tenantId', // 租户 ID 的路径参数名称
  ownerId: 'ownerId', // 所有者 ID 的路径参数名称
  tokenStorage: tokenStorage,
});
```

### 响应拦截器

#### AuthorizationResponseInterceptor

**用途**：在收到 401 未授权响应时处理自动令牌刷新。

**功能**：

- 检测 401 响应
- 使用配置的 TokenRefresher 尝试令牌刷新
- 使用新令牌重试原始请求
- 刷新失败时的指数退避

**使用场景**：无缝令牌刷新，无需用户干预。

```typescript
const interceptor = new AuthorizationResponseInterceptor({
  appId: 'your-app-id',
  tokenManager: jwtTokenManager,
  deviceIdStorage: deviceStorage,
});
```

### 错误拦截器

#### UnauthorizedErrorInterceptor

**用途**：通过自定义回调逻辑提供认证失败的集中处理。

**功能**：

- 检测 401 响应和 RefreshTokenError 异常
- 调用自定义回调进行错误处理
- 允许应用实现登录重定向、令牌清理等

**使用场景**：自定义认证错误处理和用户体验流程。

```typescript
const interceptor = new UnauthorizedErrorInterceptor({
  onUnauthorized: exchange => {
    console.log('认证失败于:', exchange.request.url);
    // 重定向到登录页面或显示错误消息
    window.location.href = '/login';
  },
});
```

### 拦截器顺序与执行

拦截器按以下默认顺序执行：

1. **请求阶段**：
   - `AuthorizationRequestInterceptor`（添加 Bearer 令牌）
   - `CoSecRequestInterceptor`（添加 CoSec 头部）
   - `ResourceAttributionRequestInterceptor`（添加路径参数）

2. **响应阶段**：
   - `AuthorizationResponseInterceptor`（处理令牌刷新）

3. **错误阶段**：
   - `UnauthorizedErrorInterceptor`（处理认证错误）

**注意**：可以使用 `order` 属性自定义拦截器执行顺序。order 值越高，在链中执行越晚。

## 🛠️ 示例

### 完整认证设置

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  JwtTokenManager,
  TokenRefresher,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// 创建存储实例
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// 实现令牌刷新器
const tokenRefresher: TokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`令牌刷新失败: ${response.status}`);
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },
};

// 创建 JWT 令牌管理器
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

// 创建 fetcher 并添加 CoSec 拦截器
const secureFetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// 添加请求拦截器用于认证头部
secureFetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor({
    appId: 'my-app-id',
    tokenManager,
    deviceIdStorage,
  }),
);

// 添加响应拦截器用于令牌刷新
secureFetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor({
    appId: 'my-app-id',
    tokenManager,
    deviceIdStorage,
  }),
);

// 现在所有请求都会自动进行认证
const userProfile = await secureFetcher.get('/api/user/profile');
const userPosts = await secureFetcher.get('/api/user/posts');
```

### 高级令牌刷新与重试逻辑

```typescript
import {
  TokenRefresher,
  CompositeToken,
  JwtTokenManager,
  TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

class ResilientTokenRefresher implements TokenRefresher {
  private maxRetries = 3;
  private baseDelay = 1000; // 1 秒

  async refresh(token: CompositeToken): Promise<CompositeToken> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // 指数退避与抖动
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * this.baseDelay;
          const jitter = Math.random() * 0.1 * delay;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }

        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Retry-Attempt': attempt.toString(),
          },
          body: JSON.stringify({
            refreshToken: token.refreshToken,
            deviceId: await this.getDeviceId(),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newTokens = await response.json();

        // 验证令牌结构
        if (!newTokens.accessToken || !newTokens.refreshToken) {
          throw new Error('令牌响应结构无效');
        }

        return {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`令牌刷新尝试 ${attempt}/${this.maxRetries} 失败:`, error);

        // 不要对认证错误（401/403）重试
        if (error instanceof Response) {
          const status = error.status;
          if (status === 401 || status === 403) {
            throw error;
          }
        }

        // 最后一次尝试不要重试
        if (attempt === this.maxRetries) {
          break;
        }
      }
    }

    throw lastError!;
  }

  private async getDeviceId(): Promise<string> {
    // 实现获取当前设备 ID
    const deviceStorage = new DeviceIdStorage();
    return await deviceStorage.getOrCreate();
  }
}

// 使用
const tokenStorage = new TokenStorage();
const tokenRefresher = new ResilientTokenRefresher();
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);
```

### 多租户认证

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  JwtTokenManager,
  TokenRefresher,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// 租户配置接口
interface TenantConfig {
  id: string;
  name: string;
  appId: string;
  baseURL: string;
  refreshEndpoint: string;
  tokenStoragePrefix?: string;
}

// 租户注册表用于管理多个租户
class TenantRegistry {
  private tenants = new Map<string, TenantConfig>();
  private fetchers = new Map<string, Fetcher>();

  registerTenant(config: TenantConfig): void {
    // 为隔离使用租户 ID 作为存储前缀
    const storagePrefix = config.tokenStoragePrefix || `tenant-${config.id}`;
    config.tokenStoragePrefix = storagePrefix;
    this.tenants.set(config.id, config);
  }

  getFetcher(tenantId: string): Fetcher {
    if (this.fetchers.has(tenantId)) {
      return this.fetchers.get(tenantId)!;
    }

    const config = this.tenants.get(tenantId);
    if (!config) {
      throw new Error(`租户 '${tenantId}' 未注册`);
    }

    const fetcher = this.createTenantFetcher(config);
    this.fetchers.set(tenantId, fetcher);
    return fetcher;
  }

  private createTenantFetcher(config: TenantConfig): Fetcher {
    const fetcher = new Fetcher({
      baseURL: config.baseURL,
    });

    // 每个租户的隔离存储
    const tokenStorage = new TokenStorage(config.tokenStoragePrefix);
    const deviceStorage = new DeviceIdStorage(config.tokenStoragePrefix);

    // 租户特定的令牌刷新器
    const tokenRefresher: TokenRefresher = {
      async refresh(token: CompositeToken): Promise<CompositeToken> {
        const response = await fetch(
          `${config.baseURL}${config.refreshEndpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': config.id,
            },
            body: JSON.stringify({
              refreshToken: token.refreshToken,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`租户 ${config.id} 令牌刷新失败`);
        }

        const tokens = await response.json();
        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      },
    };

    const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

    // 添加带有租户上下文的 CoSec 拦截器
    fetcher.interceptors.request.use(
      new AuthorizationRequestInterceptor({
        appId: config.appId,
        tokenManager,
        deviceIdStorage: deviceStorage,
      }),
    );

    fetcher.interceptors.response.use(
      new AuthorizationResponseInterceptor({
        appId: config.appId,
        tokenManager,
        deviceIdStorage: deviceStorage,
      }),
    );

    return fetcher;
  }

  // 租户登出的清理方法
  async logoutTenant(tenantId: string): Promise<void> {
    const config = this.tenants.get(tenantId);
    if (config) {
      const tokenStorage = new TokenStorage(config.tokenStoragePrefix);
      tokenStorage.remove();

      const deviceStorage = new DeviceIdStorage(config.tokenStoragePrefix);
      deviceStorage.clear();

      this.fetchers.delete(tenantId);
    }
  }
}

// 使用示例
const tenantRegistry = new TenantRegistry();

// 注册多个租户
tenantRegistry.registerTenant({
  id: 'enterprise-a',
  name: '企业 A',
  appId: 'app-enterprise-a',
  baseURL: 'https://api.enterprise-a.com',
  refreshEndpoint: '/auth/refresh',
});

tenantRegistry.registerTenant({
  id: 'enterprise-b',
  name: '企业 B',
  appId: 'app-enterprise-b',
  baseURL: 'https://api.enterprise-b.com',
  refreshEndpoint: '/auth/refresh',
});

// 使用租户特定的 fetcher
const tenantAFetcher = tenantRegistry.getFetcher('enterprise-a');
const tenantBFetcher = tenantRegistry.getFetcher('enterprise-b');

// 每个租户维护完全隔离的认证状态
const profileA = await tenantAFetcher.get('/user/profile');
const profileB = await tenantBFetcher.get('/user/profile');

// 登出特定租户
await tenantRegistry.logoutTenant('enterprise-a');
```

## 🧪 测试

包包含所有组件的全面测试覆盖：

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test --coverage

# 开发期间以监视模式运行测试
pnpm test --watch

# 运行特定测试文件
pnpm test tokenStorage.test.ts

# 运行集成测试
pnpm test:it
```

### 测试覆盖

- **单元测试**：独立组件测试与模拟
- **集成测试**：端到端认证流程
- **安全测试**：令牌验证和安全场景
- **性能测试**：基准测试和内存泄漏检测

### 测试工具

```typescript
import {
  createMockJwtToken,
  createExpiredJwtToken,
  MockTokenStorage,
  MockDeviceStorage,
} from '@ahoo-wang/fetcher-cosec/test-utils';

// 创建测试令牌
const validToken = createMockJwtToken({ sub: 'user123' });
const expiredToken = createExpiredJwtToken();

// 用于隔离测试的模拟存储
const tokenStorage = new MockTokenStorage();
const deviceStorage = new MockDeviceStorage();
```

## 🌐 CoSec 框架集成

此包为 [CoSec 认证框架](https://github.com/Ahoo-Wang/CoSec) 提供无缝集成，支持企业级安全功能：

### 关键集成点

- **集中认证**：连接到 CoSec 的认证服务器
- **设备管理**：自动设备注册和跟踪
- **令牌生命周期**：完整的 JWT 令牌管理与刷新能力
- **安全策略**：强制执行 CoSec 安全策略和规则
- **审计日志**：全面的请求归属和日志记录

### 架构概览

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   应用程序      │────│  Fetcher CoSec   │────│     CoSec       │
│                 │    │   集成           │    │   框架          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └─ HTTP 请求            └─ 认证头部            └─ 令牌验证
         └─ 响应处理             └─ 令牌刷新            └─ 设备跟踪
         └─ 错误恢复             └─ 安全策略            └─ 审计日志
```

有关 CoSec 框架的详细信息和高级配置选项，请访问 [CoSec GitHub 仓库](https://github.com/Ahoo-Wang/CoSec)。

## 🤝 贡献

我们欢迎贡献！请查看我们的 [贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 了解：

- **开发设置**：开始使用代码库
- **代码标准**：TypeScript、linting 和测试指南
- **拉取请求流程**：如何提交更改
- **问题报告**：错误报告和功能请求

### 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行 linting 和类型检查
pnpm lint
pnpm typecheck

# 运行测试套件
pnpm test

# 构建包
pnpm build
```

## 📄 许可证

根据 Apache License, Version 2.0 授权。详见 [LICENSE](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)。

## 🙏 致谢

- [CoSec Framework](https://github.com/Ahoo-Wang/CoSec) - 企业认证框架
- [Fetcher HTTP Client](https://github.com/Ahoo-Wang/fetcher) - 现代 TypeScript HTTP 客户端
- [JWT.io](https://jwt.io) - JWT 令牌标准和工具

---

<p align="center">
  <strong>Fetcher 生态系统的一部分</strong>
  <br>
  <sub>现代 TypeScript 应用程序的 HTTP 客户端库</sub>
</p>
