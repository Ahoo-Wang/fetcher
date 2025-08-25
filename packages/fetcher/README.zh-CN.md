# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

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
const userData = await response.json<User>();

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
const data = await response.json<User>();
```

## 🔗 拦截器系统

### Interceptor

拦截器接口，定义了拦截器的基本结构。

**属性：**

- `name: string` - 拦截器的名称，用于标识拦截器，不可重复
- `order: number` - 拦截器的执行顺序，数值越小优先级越高

**方法：**

- `intercept(exchange: FetchExchange): FetchExchange | Promise<FetchExchange>` - 拦截并处理数据

### InterceptorManager

用于管理同一类型多个拦截器的拦截器管理器。

**方法：**

- `use(interceptor: Interceptor): boolean` - 添加拦截器，返回是否添加成功
- `eject(name: string): boolean` - 按名称移除拦截器，返回是否移除成功
- `clear(): void` - 清除所有拦截器
- `intercept(exchange: FetchExchange): Promise<FetchExchange>` - 顺序执行所有拦截器

### FetcherInterceptors

Fetcher 拦截器集合，包括请求、响应和错误拦截器管理器。

**属性：**

- `request: InterceptorManager` - 请求拦截器管理器
- `response: InterceptorManager` - 响应拦截器管理器
- `error: InterceptorManager` - 错误拦截器管理器

### 使用拦截器

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// 添加请求拦截器（例如用于认证）
const success = fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 100,
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

// 添加响应拦截器（例如用于日志记录）
fetcher.interceptors.response.use({
  name: 'logging-interceptor',
  order: 10,
  intercept(exchange) {
    console.log('收到响应:', exchange.response?.status);
    return exchange;
  },
});

// 添加错误拦截器（例如用于统一错误处理）
fetcher.interceptors.error.use({
  name: 'error-interceptor',
  order: 50,
  intercept(exchange) {
    if (exchange.error?.name === 'FetchTimeoutError') {
      console.error('请求超时:', exchange.error.message);
    } else {
      console.error('网络错误:', exchange.error?.message);
    }
    return exchange;
  },
});

// 按名称移除拦截器
fetcher.interceptors.request.eject('auth-interceptor');
```

### 有序执行

`OrderedCapable` 系统允许您控制拦截器和其他组件的执行顺序。

#### 排序概念

```typescript
import { OrderedCapable } from '@ahoo-wang/fetcher';

// 数值越小优先级越高
const highPriority: OrderedCapable = { order: 1 }; // 首先执行
const mediumPriority: OrderedCapable = { order: 10 }; // 其次执行
const lowPriority: OrderedCapable = { order: 100 }; // 最后执行
```

#### 拦截器排序

```typescript
// 添加具有不同顺序的拦截器
fetcher.interceptors.request.use({
  name: 'timing-interceptor',
  order: 5, // 很早执行
  intercept(exchange) {
    console.log('很早的计时');
    return exchange;
  },
});

fetcher.interceptors.request.use({
  name: 'logging-interceptor',
  order: 10, // 较早执行
  intercept(exchange) {
    console.log('较早的日志');
    return exchange;
  },
});

fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 50, // 较晚执行
  intercept(exchange) {
    // 添加认证头部
    return exchange;
  },
});

// 执行顺序将是：
// 1. timing-interceptor (order: 5)
// 2. logging-interceptor (order: 10)
// 3. auth-interceptor (order: 50)
```

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
