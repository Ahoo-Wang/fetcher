# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

一个基于 Fetch API 的现代 HTTP 客户端库，旨在简化和优化与后端 RESTful API 的交互。它提供了类似 Axios 的 API，支持路径参数、查询参数、超时设置和请求/响应拦截器。

## 特性

- **Fetch API 兼容**：Fetcher 的 API 与原生 Fetch API 完全兼容，易于上手。
- **路径和查询参数**：支持请求中的路径参数和查询参数，路径参数用 `{}` 包装。
- **超时设置**：可以配置请求超时。
- **请求拦截器**：支持在发送请求前修改请求。
- **响应拦截器**：支持在返回响应后处理响应。
- **错误拦截器**：支持在请求生命周期中处理错误。
- **模块化设计**：代码结构清晰，易于维护和扩展。
- **自动请求体转换**：自动将普通对象转换为 JSON 并设置适当的 Content-Type 头部。
- **TypeScript 支持**：完整的 TypeScript 类型定义。

## 安装

使用 pnpm：

```bash
pnpm add @ahoo-wang/fetcher
```

使用 npm：

```bash
npm install @ahoo-wang/fetcher
```

使用 yarn：

```bash
yarn add @ahoo-wang/fetcher
```

## 使用

### 基本用法

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// 带路径参数和查询参数的 GET 请求
fetcher
  .get('/users/{id}', {
    pathParams: { id: 123 },
    queryParams: { include: 'profile' },
  })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });

// 带 JSON 体的 POST 请求（自动转换为 JSON 字符串）
fetcher
  .post('/users', {
    body: { name: 'John Doe', email: 'john@example.com' },
  })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
```

### 命名 Fetcher 用法

NamedFetcher 是 Fetcher 类的扩展，它会自动使用提供的名称在全局注册器中注册自己。当您需要在应用程序中管理多个 fetcher
实例时，这很有用。

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

// 为不同的服务创建另一个命名 fetcher
const authFetcher = new NamedFetcher('auth', {
  baseURL: 'https://auth.example.com',
  timeout: 3000,
});

// 正常使用 fetcher
apiFetcher
  .get('/users/123')
  .then(response => response.json())
  .then(data => console.log(data));

// 从注册器中检索命名 fetcher
const retrievedFetcher = fetcherRegistrar.get('api');
if (retrievedFetcher) {
  retrievedFetcher.post('/users', {
    body: { name: 'Jane Doe' },
  });
}

// 使用 requiredGet 检索 fetcher（如果未找到则抛出错误）
try {
  const authFetcher = fetcherRegistrar.requiredGet('auth');
  authFetcher.post('/login', {
    body: { username: 'user', password: 'pass' },
  });
} catch (error) {
  console.error('未找到 Fetcher:', error.message);
}
```

### 拦截器用法

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// 添加请求拦截器
const requestInterceptorId = fetcher.interceptors.request.use({
  intercept(exchange) {
    // 修改请求配置，例如添加认证头部
    return {
      ...exchange,
      request: {
        ...exchange.request,
        headers: {
          ...exchange.request.headers,
          Authorization: 'Bearer token',
        },
      },
    };
  },
});

// 添加响应拦截器
const responseInterceptorId = fetcher.interceptors.response.use({
  intercept(exchange) {
    // 处理响应数据，例如解析 JSON
    return exchange;
  },
});

// 添加错误拦截器
const errorInterceptorId = fetcher.interceptors.error.use({
  intercept(exchange) {
    // 处理错误，例如记录日志
    console.error('请求失败:', exchange.error);
    return exchange;
  },
});
```

## API 参考

### Fetcher 类

提供各种 HTTP 方法的核心 HTTP 客户端类。

#### 构造函数

```typescript
new Fetcher(options?: FetcherOptions)
```

**参数：**

- `options.baseURL`：基础 URL
- `options.timeout`：以毫秒为单位的请求超时
- `options.headers`：默认请求头部

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
```

**参数：**

- `name`：注册此 fetcher 的名称
- `options`：与 Fetcher 构造函数相同的选项

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

### UrlBuilder 类

用于构建带参数的完整 URL 的 URL 构建器。

#### 方法

- `build(path: string, pathParams?: Record<string, any>, queryParams?: Record<string, any>): string` - 构建完整 URL

### InterceptorManager 类

用于管理同一类型多个拦截器的拦截器管理器。

#### 方法

- `use(interceptor: Interceptor): number` - 添加拦截器，返回拦截器 ID
- `eject(index: number): void` - 按 ID 移除拦截器
- `clear(): void` - 清除所有拦截器
- `intercept(exchange: FetchExchange): Promise<FetchExchange>` - 顺序执行所有拦截器

### FetcherInterceptors 类

Fetcher 拦截器集合，包括请求、响应和错误拦截器管理器。

#### 属性

- `request: InterceptorManager` - 请求拦截器管理器
- `response: InterceptorManager` - 响应拦截器管理器
- `error: InterceptorManager` - 错误拦截器管理器

## 完整示例

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

// 创建 fetcher 实例
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器 - 添加认证头部
fetcher.interceptors.request.use({
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

// 添加响应拦截器 - 处理响应
fetcher.interceptors.response.use({
  intercept(exchange) {
    // 注意：响应处理通常在收到响应后进行
    return exchange;
  },
});

// 添加错误拦截器 - 统一错误处理
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

// 使用 fetcher 发起请求
fetcher
  .get('/users/{id}', {
    pathParams: { id: 123 },
    queryParams: { include: 'profile,posts' },
  })
  .then(response => response.json())
  .then(data => {
    console.log('用户数据:', data);
  })
  .catch(error => {
    console.error('获取用户失败:', error);
  });
```

## 测试

运行测试：

```bash
pnpm test
```

## 贡献

欢迎任何形式的贡献！请查看 [贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 了解更多详情。

## 许可证

本项目采用 [Apache-2.0 许可证](https://opensource.org/licenses/Apache-2.0)。
