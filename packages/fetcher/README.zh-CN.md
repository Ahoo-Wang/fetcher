# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

一个现代、超轻量级（1.9kB）的 HTTP 客户端，内置路径参数、查询参数和类似 Axios 的 API。比 Axios 小 86%，同时提供相同的强大功能。

## 🌟 特性

- **⚡ 超轻量级**：仅 1.9kB min+gzip - 比 Axios 小 86%
- **🧭 路径和查询参数**：内置支持路径（`{id}`）和查询参数
- **🔗 拦截器系统**：请求、响应和错误拦截器的中间件模式
- **⏱️ 超时控制**：可配置的请求超时和适当的错误处理
- **🔄 Fetch API 兼容**：与原生 Fetch API 完全兼容
- **🛡️ TypeScript 支持**：完整的 TypeScript 类型定义，提升开发体验
- **🧩 模块化架构**：轻量级核心和可选的扩展包
- **📦 命名 Fetcher 支持**：自动注册和检索 fetcher 实例
- **⚙️ 默认 Fetcher**：预配置的默认 fetcher 实例，快速开始

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @ahoo-wang/fetcher

# 使用 pnpm
pnpm add @ahoo-wang/fetcher

# 使用 yarn
yarn add @ahoo-wang/fetcher
```

### 基本用法

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

// 创建 fetcher 实例
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// 带路径和查询参数的 GET 请求
const response = await fetcher.get('/users/{id}', {
  path: { id: 123 },
  query: { include: 'profile' },
});
const userData = await response.json();

// 带自动 JSON 转换的 POST 请求
const createUserResponse = await fetcher.post('/users', {
  body: { name: 'John Doe', email: 'john@example.com' },
});
```

### 命名 Fetcher 用法

```typescript
import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';

// 创建一个自动注册自己的命名 fetcher
const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer token',
  },
});

// 从注册器中检索命名 fetcher
const retrievedFetcher = fetcherRegistrar.get('api');
if (retrievedFetcher) {
  const response = await retrievedFetcher.get('/users/123');
}

// 使用 requiredGet 检索 fetcher（如果未找到则抛出错误）
try {
  const authFetcher = fetcherRegistrar.requiredGet('auth');
  await authFetcher.post('/login', {
    body: { username: 'user', password: 'pass' },
  });
} catch (error) {
  console.error('未找到 Fetcher:', error.message);
}
```

### 默认 Fetcher 用法

```typescript
import { fetcher } from '@ahoo-wang/fetcher';

// 直接使用默认 fetcher
const response = await fetcher.get('/users');
const data = await response.json();
```

## 🔗 拦截器系统

### 请求拦截器

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// 添加请求拦截器（例如用于认证）
const interceptorId = fetcher.interceptors.request.use({
  intercept(exchange) {
    return {
      ...exchange,
      request: {
        ...exchange.request,
        headers: {
          ...exchange.request.headers,
          Authorization: 'Bearer ' + getAuthToken(),
        },
      },
    };
  },
});

// 移除拦截器
fetcher.interceptors.request.eject(interceptorId);
```

### 响应拦截器

```typescript
// 添加响应拦截器（例如用于日志记录）
fetcher.interceptors.response.use({
  intercept(exchange) {
    console.log('收到响应:', exchange.response.status);
    return exchange;
  },
});
```

### 错误拦截器

```typescript
// 添加错误拦截器（例如用于统一错误处理）
fetcher.interceptors.error.use({
  intercept(exchange) {
    if (exchange.error?.name === 'FetchTimeoutError') {
      console.error('请求超时:', exchange.error.message);
    } else {
      console.error('网络错误:', exchange.error?.message);
    }
    return exchange;
  },
});
```

## 📚 API 参考

### Fetcher 类

提供各种 HTTP 方法的核心 HTTP 客户端类。

#### 构造函数

```typescript
new Fetcher(options ? : FetcherOptions);
```

**选项：**

- `baseURL`：基础 URL
- `timeout`：以毫秒为单位的请求超时
- `headers`：默认请求头部

#### 方法

- `fetch(url: string, request?: FetcherRequest): Promise<Response>` - 通用 HTTP 请求方法
- `get(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - GET 请求
- `post(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - POST 请求
- `put(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - PUT 请求
- `delete(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - DELETE 请求
- `patch(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - PATCH 请求
- `head(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - HEAD 请求
- `options(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - OPTIONS 请求

### NamedFetcher 类

Fetcher 类的扩展，它会自动使用提供的名称在全局 fetcherRegistrar 中注册自己。

#### 构造函数

```typescript
new NamedFetcher(name
:
string, options ? : FetcherOptions
)
;
```

### FetcherRegistrar

用于按名称管理多个 Fetcher 实例的全局实例。

#### 属性

- `default`：获取或设置默认 fetcher 实例

#### 方法

- `register(name: string, fetcher: Fetcher): void` - 使用名称注册 fetcher
- `unregister(name: string): boolean` - 按名称注销 fetcher
- `get(name: string): Fetcher | undefined` - 按名称获取 fetcher
- `requiredGet(name: string): Fetcher` - 按名称获取 fetcher，如果未找到则抛出错误
- `fetchers: Map<string, Fetcher>` - 获取所有已注册的 fetcher

### 拦截器系统

#### InterceptorManager

用于管理同一类型多个拦截器的拦截器管理器。

**方法：**

- `use(interceptor: Interceptor): number` - 添加拦截器，返回拦截器 ID
- `eject(index: number): void` - 按 ID 移除拦截器
- `clear(): void` - 清除所有拦截器
- `intercept(exchange: FetchExchange): Promise<FetchExchange>` - 顺序执行所有拦截器

#### FetcherInterceptors

Fetcher 拦截器集合，包括请求、响应和错误拦截器管理器。

**属性：**

- `request: InterceptorManager` - 请求拦截器管理器
- `response: InterceptorManager` - 响应拦截器管理器
- `error: InterceptorManager` - 错误拦截器管理器

## 🛠️ 开发

### 测试

```bash
# 运行测试
pnpm test

# 运行带覆盖率的测试
pnpm test --coverage
```

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 了解更多详情。

## 📄 许可证

本项目采用 [Apache-2.0 许可证](https://opensource.org/licenses/Apache-2.0)。

---

<p align="center">
  Fetcher 生态系统的一部分
</p>
