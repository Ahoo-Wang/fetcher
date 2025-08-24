# Fetcher

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
- **事件流支持**：通过 `@ahoo-wang/fetcher-eventstream` 包内置支持服务器发送事件（SSE）。
- **自动请求体转换**：自动将普通对象转换为 JSON 并设置适当的 Content-Type 头部。
- **TypeScript 支持**：完整的 TypeScript 类型定义，提升开发体验。

## 包

- [`@ahoo-wang/fetcher`](packages/fetcher)：核心 HTTP 客户端库。
- [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream)：服务器发送事件（SSE）的事件流支持。
- [`@ahoo-wang/fetcher-cosec`](./packages/cosec)：Fetcher HTTP 客户端的 CoSec 认证支持。

## 示例

[examples](./examples) 目录包含了 `@ahoo-wang/fetcher` 包的各种使用示例：

1. **基本用法**：演示带路径参数和查询参数的基本 HTTP 请求。
2. **拦截器用法**：展示如何使用请求和响应拦截器。
3. **超时用法**：说明如何配置请求超时。
4. **错误处理**：演示如何处理网络和超时错误。
5. **HTTP 方法**：展示如何使用不同的 HTTP 方法（POST、PUT、DELETE 等）。
6. **自定义头部**：说明如何设置和使用自定义头部。
7. **高级拦截器用法**：展示高级拦截器模式，如令牌认证。
8. **超时错误处理**：演示特定的超时错误处理。

## 安装

### 核心包

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

### 事件流包

对于服务器发送事件支持：

```bash
pnpm add @ahoo-wang/fetcher-eventstream
```

## 快速开始

### 基本 HTTP 请求

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// 带路径和查询参数的 GET 请求
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

### 使用默认 Fetcher

Fetcher 库还提供了一个预配置的默认 fetcher 实例，可以直接使用：

```typescript
import { fetcher } from '@ahoo-wang/fetcher';

// 直接使用默认 fetcher
fetcher
  .get('/users')
  .then(response => response.json())
  .then(data => console.log(data));
```

### 服务器发送事件

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

fetcher.interceptors.response.use(new EventStreamInterceptor());

// 在响应中使用 eventStream 方法处理 text/event-stream 内容类型
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('收到事件:', event);
  }
}
```

## 开发

### 先决条件

- Node.js >= 16
- pnpm >= 8

### 构建项目

构建所有包：

```bash
pnpm build
```

### 运行测试

运行所有包的测试：

```bash
pnpm test
```

### 代码格式化

格式化代码库：

```bash
pnpm format
```

## 贡献

欢迎贡献！请查看 [贡献指南](./CONTRIBUTING.md) 了解更多详情。

## 许可证

本项目采用 [Apache-2.0 许可证](./LICENSE)。
