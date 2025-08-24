# Fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

一个基于 Fetch API 的现代、轻量级 HTTP 客户端库，旨在简化和优化与后端 RESTful API 的交互。它提供了类似 Axios 的
API，支持路径参数、查询参数、超时设置和请求/响应拦截器。

## 🌟 特性

- **🔄 Fetch API 兼容**：与原生 Fetch API 完全兼容，易于上手
- **🧭 路径和查询参数**：原生支持路径参数（`{id}`）和查询参数
- **⏱️ 超时控制**：可配置的请求超时和适当的错误处理
- **🔗 拦截器系统**：请求、响应和错误拦截器的中间件模式
- **📡 事件流支持**：通过 `@ahoo-wang/fetcher-eventstream` 内置支持服务器发送事件（SSE）
- **🎯 自动请求体转换**：自动将 JavaScript 对象转换为 JSON 并设置适当头部
- **🛡️ TypeScript 支持**：完整的 TypeScript 类型定义，提升开发体验
- **🧩 模块化架构**：轻量级核心和可选的扩展包
- **📱 认证支持**：通过 `@ahoo-wang/fetcher-cosec` 支持 CoSec 认证
- **🎨 装饰器支持**：通过 `@ahoo-wang/fetcher-decorator` 支持 TypeScript 装饰器

## 📦 包

| 包                                                          | 描述               | 版本                                                                                                                                      |
|------------------------------------------------------------|------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| [`@ahoo-wang/fetcher`](./packages/fetcher)                 | 核心 HTTP 客户端库     | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         |
| [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) | 服务器发送事件（SSE）支持   | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) |
| [`@ahoo-wang/fetcher-cosec`](./packages/cosec)             | CoSec 认证集成       | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             |
| [`@ahoo-wang/fetcher-decorator`](./packages/decorator)     | TypeScript 装饰器支持 | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     |

## 🚀 快速开始

### 安装

```bash
# 核心包
npm install @ahoo-wang/fetcher

# 或使用 pnpm
pnpm add @ahoo-wang/fetcher

# 或使用 yarn
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

### 基于装饰器的服务

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';
import {
  api,
  get,
  post,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';

// 注册命名 fetcher
const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
});

// 使用装饰器定义服务
@api('/users', { fetcher: 'api' })
class UserService {
  @get('/')
  getUsers(@query('limit') limit?: number): Promise<Response> {
    throw new Error('实现将自动生成');
  }

  @post('/')
  createUser(@body() user: User): Promise<Response> {
    throw new Error('实现将自动生成');
  }

  @get('/{id}')
  getUser(@path('id') id: number): Promise<Response> {
    throw new Error('实现将自动生成');
  }
}

// 使用服务
const userService = new UserService();
const response = await userService.getUsers(10);
```

### 使用拦截器

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// 添加请求拦截器（例如用于认证）
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

// 添加响应拦截器（例如用于日志记录）
fetcher.interceptors.response.use({
  intercept(exchange) {
    console.log('收到响应:', exchange.response.status);
    return exchange;
  },
});
```

### 服务器发送事件

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
fetcher.interceptors.response.use(new EventStreamInterceptor());

// 流式传输实时事件
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('收到事件:', event);
  }
}
```

## 📚 示例

在 [examples](./examples) 目录中探索全面的示例：

1. **基本 HTTP 操作** - GET、POST、PUT、DELETE 请求
2. **参数处理** - 路径参数、查询参数、请求体
3. **拦截器模式** - 认证、日志记录、错误处理
4. **超时管理** - 请求超时配置和处理
5. **事件流** - 实时服务器发送事件
6. **装饰器用法** - 使用 TypeScript 装饰器的简洁 API 服务定义

## 🛠️ 开发

### 先决条件

- Node.js >= 16
- pnpm >= 8

### 命令

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行测试
pnpm test

# 格式化代码
pnpm format

# 清理构建产物
pnpm clean
```

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](./CONTRIBUTING.md) 了解更多详情。

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建拉取请求

## 📄 许可证

本项目采用 [Apache-2.0 许可证](./LICENSE)。

---

<p align="center">
  由 <a href="https://github.com/Ahoo-Wang">Ahoo-Wang</a> 用 ❤️ 构建
</p>
