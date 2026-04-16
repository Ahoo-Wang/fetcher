# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-交互式文档-FF4785)](https://fetcher.ahoo.me/?path=/docs/fetcher-introduction--docs)

一个现代、超轻量级的 HTTP 客户端，内置路径参数、查询参数和类似 Axios 的 API。

## 🌟 特性

- **⚡ 超轻量级**：仅 3KiB min+gzip
- **🧭 路径和查询参数**：内置支持路径（`{id}`/`:id`）和查询参数
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
  urlParams: {
    path: { id: 123 },
    query: { include: 'profile' },
  },
});
const userData = await response.json<User>();

// 带自动 JSON 转换的 POST 请求
const createUserResponse = await fetcher.post('/users', {
  body: { name: 'John Doe', email: 'john@example.com' },
});
```

### URL 模板样式

Fetcher 支持不同的 URL 模板样式来处理路径参数：

1. **URI 模板样式**（默认）：使用花括号，例如 `/users/{id}/posts/{postId}`
2. **Express 样式**：使用冒号，例如 `/users/:id/posts/:postId`

您可以在创建 Fetcher 实例时配置 URL 模板样式：

```typescript
import { Fetcher, UrlTemplateStyle } from '@ahoo-wang/fetcher';

// 默认 URI 模板样式
const fetcher1 = new Fetcher({
  baseURL: 'https://api.example.com',
});

// 显式指定 URI 模板样式
const fetcher2 = new Fetcher({
  baseURL: 'https://api.example.com',
  urlTemplateStyle: UrlTemplateStyle.UriTemplate,
});

// Express 样式
const fetcher3 = new Fetcher({
  baseURL: 'https://api.example.com',
  urlTemplateStyle: UrlTemplateStyle.Express,
});

// 使用 URI 模板样式
const response1 = await fetcher1.get('/users/{id}', {
  urlParams: {
    path: { id: 123 },
  },
});

// 使用 Express 样式
const response2 = await fetcher3.get('/users/:id', {
  urlParams: {
    path: { id: 123 },
  },
});
```

### 集成测试示例：Typicode API 集成

以下示例展示了如何与 JSONPlaceholder API 集成，类似于 Fetcher
项目中的集成测试。您可以在 [integration-test/src/fetcher/typicodeFetcher.ts](../../integration-test/src/fetcher/typicodeFetcher.ts)
中找到完整实现。

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';
import { cosecRequestInterceptor, cosecResponseInterceptor } from '../cosec';

export const typicodeFetcher = new NamedFetcher('typicode', {
  baseURL: 'https://jsonplaceholder.typicode.com',
});

typicodeFetcher.interceptors.request.use(cosecRequestInterceptor);
typicodeFetcher.interceptors.response.use(cosecResponseInterceptor);
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

## 🔗 拦截器系统

### 核心概念

Fetcher 中的拦截器系统遵循中间件模式，允许您在 HTTP 请求生命周期的不同阶段拦截和修改请求、响应和错误。

#### 拦截器类型

1. **请求拦截器**：在发送请求之前处理请求
2. **响应拦截器**：在收到响应之后处理响应
3. **错误拦截器**：处理请求过程中发生的错误

#### 内置拦截器

Fetcher 自带几个内置拦截器，它们会自动注册：

1. **UrlResolveInterceptor**：解析带路径和查询参数的 URL（顺序：`Number.MAX_SAFE_INTEGER - 11000`）
2. **RequestBodyInterceptor**：将对象体转换为 JSON 字符串（顺序：`Number.MIN_SAFE_INTEGER + 10000`）
3. **FetchInterceptor**：执行实际的 HTTP 请求（顺序：`Number.MAX_SAFE_INTEGER - 10000`）
4. **ValidateStatusInterceptor**：验证 HTTP 状态码并在状态码无效时抛出错误（响应拦截器，顺序：`Number.MAX_SAFE_INTEGER - 10000`）

### 使用拦截器

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// 添加请求拦截器（例如用于认证）
const success = fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 100,
  intercept(exchange) {
    exchange.request.headers.Authorization = 'Bearer ' + getAuthToken();
  },
});

// 添加响应拦截器（例如用于日志记录）
fetcher.interceptors.response.use({
  name: 'logging-interceptor',
  order: 10,
  intercept(exchange) {
    console.log('收到响应:', exchange.response?.status);
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

## 📚 API 参考

### Fetcher 类

核心 HTTP 客户端类，提供各种 HTTP 方法。

#### 构造函数

```typescript
new Fetcher(options ? : FetcherOptions);
```

**选项：**

- `baseURL`：所有请求的基础 URL
- `timeout`：请求超时时间（毫秒）
- `headers`：默认请求头部
- `interceptors`：用于请求、响应和错误处理的拦截器集合
- `urlTemplateStyle`：用于路径参数解析的 URL 模板样式（默认：UriTemplate）

#### 属性

- `urlBuilder`：用于构建 URL 的 URL 构建器实例
- `headers`：默认请求头部
- `timeout`：默认请求超时时间
- `interceptors`：用于请求、响应和错误处理的拦截器集合

#### 方法

- `fetch(url: string, request?: FetcherRequest): Promise<Response>` - 通用 HTTP 请求方法
- `get(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - GET 请求
- `post(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - POST 请求
- `put(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - PUT 请求
- `delete(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - DELETE 请求
- `patch(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - PATCH 请求
- `head(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - HEAD 请求
- `options(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - OPTIONS 请求
- `trace(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - TRACE 请求
- `request(request: FetchRequest): Promise<FetchExchange>` - 通过 Fetcher 的内部工作流处理 HTTP 请求

### FetcherRequest 接口

HTTP 请求的配置选项。

**属性：**

- `method`：HTTP 方法（GET、POST、PUT、DELETE 等）
- `headers`：请求头部
- `body`：请求体（可以是对象、字符串、Blob 等）
- `urlParams`：URL 参数，包括用于 URL 模板的路径参数和用于 URL 查询字符串的查询参数
- `timeout`：请求超时时间（毫秒）

### 响应扩展

为了提供更好的 TypeScript 支持，我们扩展了原生 Response 接口，添加了类型安全的 json() 方法：

```typescript
// 现在您可以安全地使用它
const response = await fetcher.get('/users/123');
const userData = await response.json<User>(); // 类型是 Promise<User>
```

### NamedFetcher 类

Fetcher 类的扩展，会自动将自己注册到全局 fetcherRegistrar。

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

- `register(name: string, fetcher: Fetcher): void` - 按名称注册 fetcher
- `unregister(name: string): boolean` - 按名称注销 fetcher
- `get(name: string): Fetcher | undefined` - 按名称获取 fetcher
- `requiredGet(name: string): Fetcher` - 按名称获取 fetcher，如果未找到则抛出错误
- `fetchers: Map<string, Fetcher>` - 获取所有已注册的 fetcher

### 拦截器系统

#### Interceptor 接口

拦截器接口，定义了拦截器的基本结构。

**属性：**

- `name: string` - 拦截器的名称，用于标识拦截器，不可重复
- `order: number` - 拦截器的执行顺序，数值越小优先级越高

**方法：**

- `intercept(exchange: FetchExchange): void | Promise<void>` - 拦截并处理数据

#### InterceptorRegistry 类

用于管理同一类型多个拦截器的拦截器注册表。

**属性：**

- `interceptors: Interceptor[]` - 获取注册表中的所有拦截器

**方法：**

- `use(interceptor: Interceptor): boolean` - 添加拦截器，返回是否添加成功
- `eject(name: string): boolean` - 按名称移除拦截器，返回是否移除成功
- `clear(): void` - 清除所有拦截器
- `intercept(exchange: FetchExchange): Promise<void>` - 顺序执行所有拦截器

#### InterceptorManager 类

Fetcher 拦截器集合，包括请求、响应和错误拦截器管理器。

**属性：**

- `request: InterceptorRegistry` - 请求拦截器管理器
- `response: InterceptorRegistry` - 响应拦截器管理器
- `error: InterceptorRegistry` - 错误拦截器管理器

**方法：**

- `exchange(fetchExchange: FetchExchange): Promise<FetchExchange>` - 通过拦截器管道处理 FetchExchange

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 了解更多详情。

## 📄 许可证

本项目采用 [Apache-2.0 许可证](https://opensource.org/licenses/Apache-2.0)。

---

<p align="center">
  Fetcher 生态系统的一部分
</p>
