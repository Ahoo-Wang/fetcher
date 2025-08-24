# Fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

一个现代、超轻量级（1.9kB）的 HTTP 客户端，内置路径参数、查询参数和类似 Axios 的 API。比 Axios 小 86%，同时提供相同的强大功能。

## 🌟 特性

#### [`@ahoo-wang/fetcher`](./packages/fetcher)

- **⚡ 超轻量级**：仅 1.9kB min+gzip - 比 Axios 小 86%
- **🧭 路径和查询参数**：内置支持路径（`{id}`）和查询参数
- **🔗 拦截器系统**：请求、响应和错误拦截器的中间件模式
- **⏱️ 超时控制**：可配置的请求超时和适当的错误处理
- **🔄 Fetch API 兼容**：与原生 Fetch API 完全兼容
- **🛡️ TypeScript 支持**：完整的 TypeScript 类型定义，提升开发体验
- **🧩 模块化架构**：轻量级核心和可选的扩展包
- **📦 命名 Fetcher 支持**：自动注册和检索 fetcher 实例
- **⚙️ 默认 Fetcher**：预配置的默认 fetcher 实例，快速开始

#### [`@ahoo-wang/fetcher-decorator`](./packages/decorator)

- **🎨 清晰的 API 定义**：使用直观的装饰器定义 HTTP 服务
- **🧭 自动参数绑定**：路径、查询、头部和请求体参数自动绑定
- **⏱️ 可配置超时**：支持方法级和类级超时设置
- **🔗 Fetcher 集成**：与 Fetcher 的命名 fetcher 系统无缝集成
- **⚡ 自动实现**：方法自动实现为 HTTP 调用
- **📦 元数据系统**：丰富的元数据支持，用于高级自定义

#### [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream)

- **📡 事件流转换**：将 `text/event-stream` 响应转换为 `ServerSentEvent` 对象的异步生成器
- **🔌 拦截器集成**：自动为具有 `text/event-stream` 内容类型的响应添加 `eventStream()` 方法
- **📋 SSE 解析**：根据规范解析服务器发送事件，包括数据、事件、ID 和重试字段
- **🔄 流式支持**：正确处理分块数据和多行事件
- **💬 注释处理**：根据 SSE 规范正确忽略注释行（以 `:` 开头的行）
- **⚡ 性能优化**：高效的解析和流式处理，适用于高性能应用

#### [`@ahoo-wang/fetcher-cosec`](./packages/cosec)

- **🔐 自动认证**：自动生成 CoSec 认证头部
- **📱 设备管理**：使用 localStorage 持久化的设备 ID 管理
- **🔄 令牌刷新**：基于响应代码（401）自动刷新令牌
- **追踪 请求跟踪**：生成唯一请求 ID 用于跟踪
- **💾 令牌存储**：安全的令牌存储管理

## 📦 包

| 包                                                          | 描述                                 | 版本                                                                                                                                      | 包大小                                                                                                                                                               |
|------------------------------------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`@ahoo-wang/fetcher`](./packages/fetcher)                 | 超轻量级（1.9kB）HTTP 客户端，类似 Axios 的 API | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         |
| [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) | Fetcher HTTP 客户端的服务器发送事件（SSE）支持    | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventstream)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) |
| [`@ahoo-wang/fetcher-cosec`](./packages/cosec)             | Fetcher HTTP 客户端的 CoSec 认证集成       | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             |
| [`@ahoo-wang/fetcher-decorator`](./packages/decorator)     | Fetcher HTTP 客户端的 TypeScript 装饰器   | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-decorator)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     |

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
