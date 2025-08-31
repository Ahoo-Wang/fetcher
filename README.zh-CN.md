<div align="center">

# 🚀 Fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

**超轻量级 • 模块化 • TypeScript 优先 • 拦截器驱动 • LLM 流式 API 支持**

</div>

## 🌟 为什么选择 Fetcher?

Fetcher 不仅仅是一个 HTTP 客户端——它是一个为现代 Web 开发设计的完整生态系统，原生支持 LLM 流式 API。基于原生 Fetch API
构建，Fetcher 提供了类似 Axios 的体验，同时保持极小的体积。

## 🚀 核心特性

### 🎯 [`@ahoo-wang/fetcher`](./packages/fetcher) - 基础核心

轻量级核心，驱动整个生态系统：

- **⚡ 超轻量级**: 仅 2.7KiB min+gzip - 比大多数替代品更小
- **🧭 路径和查询参数**: 内置支持路径 (`{id}`) 和查询参数
- **🔗 拦截器系统**: 请求、响应和错误拦截器，支持有序执行的灵活中间件模式
- **⏱️ 超时控制**: 可配置的请求超时和适当的错误处理
- **🔄 Fetch API 兼容**: 完全兼容原生 Fetch API
- **🛡️ TypeScript 支持**: 完整的 TypeScript 定义，实现类型安全开发
- **🧩 模块化架构**: 轻量级核心和可选扩展包
- **📦 命名 Fetcher 支持**: 自动注册和检索 fetcher 实例
- **⚙️ 默认 Fetcher**: 预配置的默认 fetcher 实例，快速上手

### 🎨 [`@ahoo-wang/fetcher-decorator`](./packages/decorator) - 声明式 API

使用简洁的声明式服务定义转换您的 API 交互：

- **🎨 清晰的 API 定义**: 使用直观的装饰器定义 HTTP 服务
- **🧭 自动参数绑定**: 路径、查询、头部和正文参数自动绑定
- **⏱️ 可配置超时**: 每方法和每类的超时设置
- **🔗 Fetcher 集成**: 与 Fetcher 的命名 fetcher 系统无缝集成
- **⚡ 自动实现**: 方法自动实现 HTTP 调用
- **📦 元数据系统**: 丰富的元数据支持，用于高级自定义

### 📡 [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) - 实时流和 LLM 支持

为您的实时应用提供 Server-Sent Events 支持，专为大型语言模型流式 API 设计：

- **📡 事件流转换**：将 `text/event-stream` 响应转换为 `ServerSentEvent` 对象的异步生成器
- **🔌 自动扩展**：模块导入时自动扩展 `Response` 原型，添加事件流方法
- **📋 SSE 解析**：根据规范解析服务器发送事件，包括数据、事件、ID 和重试字段
- **🔄 流支持**：正确处理分块数据和多行事件
- **💬 注释处理**：正确忽略注释行（以 `:` 开头的行）
- **🛡️ TypeScript 支持**：完整的 TypeScript 类型定义
- **⚡ 性能优化**：高效的解析和流处理，适用于高性能应用
- **🤖 LLM 流准备就绪**: 原生支持来自流行 LLM API（如 OpenAI GPT、Claude 等）的流式响应

#### LLM 集成示例

[LlmClient](./integration-test/src/eventstream/llmClient.ts) 演示了如何创建具有流支持的 LLM API 专用客户端：

```typescript
import { createLlmFetcher, LlmClient } from './llmClient';

// 使用您的 API 配置初始化 LLM 客户端
const llmFetcher = createLlmFetcher({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
  model: 'gpt-3.5-turbo',
});

const llmClient = new LlmClient();

// 流式聊天完成，逐个令牌输出
async function streamChatExample() {
  const stream = await llmClient.streamChat({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain quantum computing in simple terms.' },
    ],
    stream: true,
  });

  for await (const event of stream) {
    if (event.data) {
      const chunk = event.data;
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content); // 实时输出
    }
  }
}
```

### 🧩 [`@ahoo-wang/fetcher-wow`](./packages/wow) - CQRS/DDD 框架支持

与 [Wow](https://github.com/Ahoo-Wang/Wow) CQRS/DDD 框架的一流集成：

- **🚀 命令客户端**: 用于向 Wow 服务发送命令的高级客户端，支持同步和流式响应
- **🔍 查询客户端**: 专门用于查询快照和事件流数据的客户端，支持全面的查询操作
- **📡 实时事件流**: 内置对服务器发送事件的支持，用于接收实时命令结果和数据更新
- **📦 完整的 TypeScript 支持**: 为所有 Wow 框架实体提供完整的类型定义，包括命令、事件和查询
- **🧱 DDD 基础构件**: 基本的领域驱动设计构建块，包括聚合、事件和值对象
- **🔄 CQRS 模式实现**: 对命令查询责任分离架构模式的一流支持

### 🔐 [`@ahoo-wang/fetcher-cosec`](./packages/cosec) - 企业安全

使用集成认证保护您的应用：

- **🔐 自动认证**: 自动 CoSec 认证头部
- **📱 设备管理**: 使用 localStorage 持久化的设备 ID 管理
- **🔄 令牌刷新**: 基于响应代码 (401) 的自动令牌刷新
- **🌈 请求跟踪**: 用于跟踪的唯一请求 ID 生成
- **💾 令牌存储**: 安全的令牌存储管理

## 📦 包生态系统

<div align="center">

| 包                                                          | 描述                                                               | 版本                                                                                                                                      | 大小                                                                                                                                                     |
|------------------------------------------------------------|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`@ahoo-wang/fetcher`](./packages/fetcher)                 | **核心 HTTP 客户端**<br/>具有 Axios 类似 API 的超轻量级基础                      | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         |
| [`@ahoo-wang/fetcher-decorator`](./packages/decorator)     | **装饰器支持**<br/>声明式 API 服务定义                                       | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-decorator)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     |
| [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) | **实时流和 LLM 支持**<br/>Server-Sent Events (SSE) 支持，原生 LLM 流式 API 集成 | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventstream)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) |
| [`@ahoo-wang/fetcher-wow`](./packages/wow)                 | **CQRS/DDD 框架支持**<br/>与 Wow CQRS/DDD 框架的一流集成                     | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-wow.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-wow)                 | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-wow)](https://www.npmjs.com/package/@ahoo-wang/fetcher-wow)                 |
| [`@ahoo-wang/fetcher-cosec`](./packages/cosec)             | **企业安全**<br/>CoSec 认证集成                                          | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             |

</div>

## 🚀 快速开始

### 📦 安装

```shell
# 安装核心包
npm install @ahoo-wang/fetcher

# 或安装所有扩展，包括 LLM 流支持
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

// 自动 JSON 转换的 POST 请求
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
    throw new Error('Auto-generated');
  }

  @post('/')
  createUser(@body() user: User): Promise<User> {
    throw new Error('Auto-generated');
  }

  @get('/{id}')
  getUser(@path('id') id: number): Promise<User> {
    throw new Error('Auto-generated');
  }
}

// 使用服务
const userService = new UserService();
const users = await userService.getUsers(10);
```

#### 强大的拦截器

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
    console.log('Response:', exchange.response.status);
  },
});
```

#### 实时流和 LLM 支持

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
fetcher.interceptors.response.use(new EventStreamInterceptor());

// 流式实时事件 (通用 SSE)
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('Real-time event:', event);
  }
}

// 流式 LLM 响应，逐个令牌输出
const llmResponse = await fetcher.post('/chat/completions', {
  body: {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
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

## 🎯 集成测试示例

在我们的 [integration-test](./integration-test) 目录中探索全面、可用于生产的实现：

### 🌐 HTTP 操作

- **Typicode API 集成** - 与 JSONPlaceholder API 的完整集成，演示实际使用
- **参数处理** - 高级路径、查询和正文参数管理
- **错误处理** - 全面的错误处理模式

### 🔧 高级模式

- **COSEC 认证** - 具有令牌管理的企业级安全集成
- **拦截器链** - 具有有序执行的复杂中间件模式
- **超时策略** - 自适应超时配置

### 📡 实时特性

- **LLM 流式 API** - 原生支持从大型语言模型流式响应
- **Server-Sent Events** - 实时通知和更新
- **流数据** - 具有自动重新连接的连续数据流

### 🎨 装饰器模式

- **声明式服务** - 使用 TypeScript 装饰器的清晰、可维护的 API 服务层
- **元数据扩展** - 用于高级用例的自定义元数据
- **类型安全 API** - 完整的 TypeScript 集成和自动类型推断

## 🏗️ 开发和贡献

### 🛠️ 先决条件

- Node.js >= 16
- pnpm >= 8

### 🚀 开发命令

```shell
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行单元测试和覆盖率
pnpm test:unit

# 格式化代码
pnpm format

# 清理构建产物
pnpm clean

# 运行集成测试
#pnpm test:it
```

### 📦 版本管理

同时更新所有包：

```shell
pnpm update-version <new-version>
```

这会更新单体仓库中所有 `package.json` 文件的版本字段。

### 🤝 贡献

欢迎贡献！请查看我们的 [贡献指南](./CONTRIBUTING.md) 获取详情：

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开拉取请求

### 🧪 质量保证

- **代码覆盖率**: 所有包保持在 95% 以上
- **TypeScript**: 启用严格类型检查
- **代码检查**: 使用 Prettier 的 ESLint 保证一致的代码风格
- **测试**: 全面的单元和集成测试

## 📄 许可证

本项目采用 [Apache-2.0 许可证](./LICENSE)。
