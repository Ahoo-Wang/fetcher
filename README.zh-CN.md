<div align="center">

# 🚀 Fetcher

**现代 JavaScript 应用的终极 HTTP 客户端生态系统**

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

**超轻量级 • 模块化 • TypeScript 优先 • 拦截器驱动 • LLM 流式 API 友好支持**

</div>

## 🌟 为什么选择 Fetcher？

Fetcher 不仅仅是一个 HTTP 客户端——它是一个为现代 Web 开发设计的完整生态系统，原生支持 LLM 流式 API。基于原生 Fetch API
构建，Fetcher 提供了类似 Axios 的体验，同时具备强大的功能并保持极小的体积。

### 🎯 核心优势

- **⚡ 超轻量级**：核心包仅 2.7KiB min+gzip
- **🤖 LLM 流式传输**：原生支持大型语言模型流式 API
- **🧩 模块化架构**：按需选择所需扩展
- **🛡️ 一流 TypeScript 支持**：完整的类型安全和智能推断
- **🔗 强大拦截器系统**：支持有序执行的中间件模式
- **🎨 清晰的 API 设计**：支持装饰器的声明式服务定义
- **📡 实时能力**：内置服务器发送事件支持
- **🔐 企业级安全**：集成认证框架支持

## 🚀 核心特性

### 🎯 [`@ahoo-wang/fetcher`](./packages/fetcher) - 基础核心

驱动整个生态系统的轻量级核心：

- **⚡ 超轻量级**：仅 2.7KiB min+gzip - 比大多数替代品更小
- **🧭 路径和查询参数**：内置支持路径（`{id}`）和查询参数
- **🔗 拦截器系统**：带有序执行的请求、响应和错误拦截器，支持灵活的中间件模式
- **⏱️ 超时控制**：可配置的请求超时和适当的错误处理
- **🔄 Fetch API 兼容**：与原生 Fetch API 完全兼容
- **🛡️ TypeScript 支持**：完整的 TypeScript 类型定义，提升开发体验
- **🧩 模块化架构**：轻量级核心和可选的扩展包
- **📦 命名 Fetcher 支持**：自动注册和检索 fetcher 实例
- **⚙️ 默认 Fetcher**：预配置的默认 fetcher 实例，快速开始

### 🎨 [`@ahoo-wang/fetcher-decorator`](./packages/decorator) - 声明式 API

通过清晰的声明式服务定义转换您的 API 交互：

- **🎨 清晰的 API 定义**：使用直观的装饰器定义 HTTP 服务
- **🧭 自动参数绑定**：路径、查询、头部和请求体参数自动绑定
- **⏱️ 可配置超时**：支持方法级和类级超时设置
- **🔗 Fetcher 集成**：与 Fetcher 的命名 fetcher 系统无缝集成
- **⚡ 自动实现**：方法自动实现为 HTTP 调用
- **📦 元数据系统**：丰富的元数据支持，用于高级自定义

### 📡 [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) - 实时流式传输与 LLM 支持

为您的实时应用提供服务器发送事件支持，特别为大型语言模型流式 API 设计：

- **📡 事件流转换**：将 `text/event-stream` 响应转换为 `ServerSentEvent` 对象的异步生成器
- **🔌 拦截器集成**：自动为具有 `text/event-stream` 内容类型的响应添加 `eventStream()` 方法
- **📋 SSE 解析**：根据规范解析服务器发送事件，包括数据、事件、ID 和重试字段
- **🔄 流式支持**：正确处理分块数据和多行事件
- **💬 注释处理**：根据 SSE 规范正确忽略注释行（以 `:` 开头的行）
- **⚡ 性能优化**：高效的解析和流式处理，适用于高性能应用
- **🤖 LLM 流式传输就绪**：原生支持来自 OpenAI GPT、Claude 等流行 LLM API 的流式响应

### 🔐 [`@ahoo-wang/fetcher-cosec`](./packages/cosec) - 企业级安全

通过集成认证保护您的应用：

- **🔐 自动认证**：自动生成 CoSec 认证头部
- **📱 设备管理**：使用 localStorage 持久化的设备 ID 管理
- **🔄 令牌刷新**：基于响应代码（401）自动刷新令牌
- **🌈 请求跟踪**：生成唯一请求 ID 用于跟踪
- **💾 令牌存储**：安全的令牌存储管理

## 📦 包生态系统

<div align="center">

| 包                                                          | 描述                                                    | 版本                                                                                                                                      | 大小                                                                                                                                                     |
|------------------------------------------------------------|-------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`@ahoo-wang/fetcher`](./packages/fetcher)                 | **核心 HTTP 客户端**<br/>超轻量级基础，类似 Axios 的 API             | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         |
| [`@ahoo-wang/fetcher-decorator`](./packages/decorator)     | **装饰器支持**<br/>声明式 API 服务定义                            | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-decorator)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     |
| [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) | **实时流式传输与 LLM 支持**<br/>服务器发送事件（SSE）支持，原生集成 LLM 流式 API | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventstream)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) |
| [`@ahoo-wang/fetcher-cosec`](./packages/cosec)             | **企业级安全**<br/>CoSec 认证集成                              | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             |

</div>

## 🚀 快速入门

### 📦 安装

```bash
# 安装核心包
npm install @ahoo-wang/fetcher

# 或安装所有扩展，包括 LLM 流式传输支持
npm install @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-cosec

# 使用 pnpm (推荐)
pnpm add @ahoo-wang/fetcher

# 使用 yarn
yarn add @ahoo-wang/fetcher
```

### ⚡ 快速示例

#### 基础 HTTP 客户端

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

#### 声明式 API 服务

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
  getUsers(@query('limit') limit?: number): Promise<User[]> {
    throw new Error('自动生成');
  }

  @post('/')
  createUser(@body() user: User): Promise<User> {
    throw new Error('自动生成');
  }

  @get('/{id}')
  getUser(@path('id') id: number): Promise<User> {
    throw new Error('自动生成');
  }
}

// 使用服务
const userService = new UserService();
const users = await userService.getUsers(10);
```

#### 强大拦截器

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// 添加带排序的请求拦截器
fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 100,
  intercept(exchange) {
    exchange.request.headers.Authorization = 'Bearer ' + getAuthToken();
  },
});

// 添加响应拦截器用于日志记录
fetcher.interceptors.response.use({
  name: 'logging-interceptor',
  order: 10,
  intercept(exchange) {
    console.log('响应:', exchange.response.status);
  },
});
```

#### 实时流式传输与 LLM 支持

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
fetcher.interceptors.response.use(new EventStreamInterceptor());

// 流式传输实时事件 (通用 SSE)
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('实时事件:', event);
  }
}

// 流式传输 LLM 响应，逐个令牌接收
const llmResponse = await fetcher.post('/chat/completions', {
  body: {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好！' }],
    stream: true,
  },
});

if (llmResponse.jsonEventStream) {
  // 专门用于 LLM API 的 JSON SSE 事件
  for await (const event of llmResponse.jsonEventStream<ChatCompletionChunk>()) {
    const content = event.data.choices[0]?.delta?.content || '';
    process.stdout.write(content); // 实时令牌输出
  }
}
```

### ⚡ 快速示例

#### 基础 HTTP 客户端

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

#### 声明式 API 服务

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
  getUsers(@query('limit') limit?: number): Promise<User[]> {
    throw new Error('自动生成');
  }

  @post('/')
  createUser(@body() user: User): Promise<User> {
    throw new Error('自动生成');
  }

  @get('/{id}')
  getUser(@path('id') id: number): Promise<User> {
    throw new Error('自动生成');
  }
}

// 使用服务
const userService = new UserService();
const users = await userService.getUsers(10);
```

#### 强大拦截器

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// 添加带排序的请求拦截器
fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 100,
  intercept(exchange) {
    exchange.request.headers.Authorization = 'Bearer ' + getAuthToken();
  },
});

// 添加响应拦截器用于日志记录
fetcher.interceptors.response.use({
  name: 'logging-interceptor',
  order: 10,
  intercept(exchange) {
    console.log('响应:', exchange.response.status);
  },
});
```

#### 实时流式传输

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
fetcher.interceptors.response.use(new EventStreamInterceptor());

// 流式传输实时事件
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('实时事件:', event);
  }
}
```

## 🎯 集成测试示例

在我们的 [integration-test](./integration-test) 目录中探索全面、生产就绪的实现：

### 🌐 HTTP 操作

- **Typicode API 集成** - 与 JSONPlaceholder API 的完整集成，展示实际使用场景
- **参数处理** - 高级路径、查询和请求体参数管理
- **错误处理** - 全面的错误处理模式

### 🔧 高级模式

- **COSEC 认证** - 企业级安全集成与令牌管理
- **拦截器链** - 复杂的中间件模式与有序执行
- **超时策略** - 自适应超时配置

### 📡 实时特性

- **LLM 流式 API** - 对大型语言模型流式响应的原生支持
- **服务器发送事件** - 实时通知和更新
- **流式数据** - 持续数据流与自动重连

### 🎨 装饰器模式

- **声明式服务** - 使用 TypeScript 装饰器的清晰、可维护的 API 服务层
- **元数据扩展** - 用于高级用例的自定义元数据
- **类型安全 API** - 完整的 TypeScript 集成与自动类型推断

## 🏗️ 开发与贡献

### 🛠️ 先决条件

- Node.js >= 16
- pnpm >= 8

### 🚀 开发命令

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行测试与覆盖率
pnpm test

# 格式化代码
pnpm format

# 清理构建产物
pnpm clean

# 运行集成测试
cd integration-test && pnpm test
```

### 📦 版本管理

同时更新所有包：

```bash
pnpm update-version <新版本号>
```

这将更新整个 monorepo 中所有 `package.json` 文件的版本字段。

### 🤝 贡献

欢迎贡献！请查看我们的 [贡献指南](./CONTRIBUTING.md) 了解详情：

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建拉取请求

### 🧪 质量保证

- **代码覆盖率**：所有包保持 95% 以上
- **TypeScript**：启用严格类型检查
- **代码规范**：ESLint 与 Prettier 保持一致风格
- **测试**：全面的单元与集成测试

## 📄 许可证

本项目采用 [Apache-2.0 许可证](./LICENSE)。

---

<div align="center">

**由 [Ahoo-Wang](https://github.com/Ahoo-Wang) 用 ❤️ 构建**

[![GitHub](https://img.shields.io/github/stars/Ahoo-Wang/fetcher?style=social)](https://github.com/Ahoo-Wang/fetcher)

</div>
