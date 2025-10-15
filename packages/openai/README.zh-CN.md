# @ahoo-wang/fetcher-openai

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

基于 Fetcher 生态构建的现代化、类型安全的 OpenAI 客户端库。提供声明式 API 与 OpenAI Chat Completions API 的集成，支持流式和非流式响应。

## 特性

- 🚀 **类型安全**: 完整的 TypeScript 支持和严格类型检查
- 📡 **流式支持**: 原生支持服务器发送事件流
- 🎯 **声明式 API**: 使用装饰器实现简洁、可读的代码
- 🔧 **Fetcher 集成**: 基于健壮的 Fetcher HTTP 客户端构建
- 📦 **树摇优化**: 支持完整的树摇优化，优化包体积
- 🧪 **充分测试**: 使用 Vitest 进行全面测试覆盖

## 安装

```bash
npm install @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

或

```bash
yarn add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

或

```bash
pnpm add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

## 快速开始

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

// 初始化客户端
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 创建聊天补全
const response = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: '你好，你怎么样？' }],
  stream: false,
});

console.log(response.choices[0].message.content);
```

## 流式示例

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 流式聊天补全
const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: '给我讲个故事' }],
  stream: true,
});

// 处理流式响应
for await (const chunk of stream) {
  console.log(chunk.choices[0].delta?.content || '');
}
```

## API 参考

### OpenAI 类

与 OpenAI API 交互的主要客户端类。

#### 构造函数

```typescript
new OpenAI(options: OpenAIOptions)
```

**参数:**

- `options.baseURL`: OpenAI API 的基础 URL（例如 `'https://api.openai.com/v1'`）
- `options.apiKey`: 您的 OpenAI API 密钥

#### 属性

- `fetcher`: 底层的 Fetcher 实例
- `chat`: 用于聊天补全的 ChatClient 实例

### ChatClient

处理聊天补全请求。

#### 方法

##### `completions(chatRequest)`

创建聊天补全。

**参数:**

- `chatRequest`: 包含消息、模型和选项的 ChatRequest 对象

**返回:**

- 非流式请求返回 `Promise<ChatResponse>`
- 流式请求返回 `Promise<JsonServerSentEventStream<ChatResponse>>`

**ChatRequest 接口:**

```typescript
interface ChatRequest {
  model?: string;
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  // ... 其他 OpenAI 参数
}
```

## 配置

### 环境变量

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 自定义基础 URL

用于与 OpenAI 兼容的 API 或代理一起使用：

```typescript
const openai = new OpenAI({
  baseURL: 'https://your-custom-endpoint.com/v1',
  apiKey: 'your-api-key',
});
```

## 错误处理

库会抛出标准的 JavaScript 错误。请适当处理它们：

```typescript
try {
  const response = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好' }],
  });
} catch (error) {
  console.error('OpenAI API 错误:', error.message);
}
```

## 高级用法

### 自定义 Fetcher 配置

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const customFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Custom-Header': 'value',
  },
  timeout: 30000,
});

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey,
});
// 如需要手动设置 fetcher
openai.fetcher = customFetcher;
```

### 与其他 Fetcher 功能集成

由于此库基于 Fetcher 构建，您可以使用所有 Fetcher 功能：

- 请求/响应拦截器
- 自定义结果提取器
- 高级错误处理
- 请求去重

## 贡献

我们欢迎贡献！请查看我们的[贡献指南](../../CONTRIBUTING.md)了解详情。

## 许可证

根据 Apache License, Version 2.0 许可证授权。详见 [LICENSE](../../LICENSE)。

## 相关包

- [@ahoo-wang/fetcher](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher) - 核心 HTTP 客户端
- [@ahoo-wang/fetcher-decorator](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher-decorator) - 声明式 API 装饰器
- [@ahoo-wang/fetcher-eventstream](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher-eventstream) - 服务器发送事件支持
