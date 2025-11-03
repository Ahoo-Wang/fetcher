# @ahoo-wang/fetcher-openai

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openai.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-openai.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-openai)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)
[![Node Version](https://img.shields.io/node/v/@ahoo-wang/fetcher-openai.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-交互式文档-FF4785)](https://fetcher.ahoo.me/?path=/docs/openai-introduction--docs)

> 🚀 **现代化 • 类型安全 • 流式就绪** - 基于 Fetcher 生态构建的完整 OpenAI 客户端

基于 Fetcher 生态构建的现代化、类型安全的 OpenAI 客户端库。提供与 OpenAI Chat Completions API 的无缝集成，支持流式和非流式响应，并具有完整的 TypeScript 支持和自动请求处理。

## ✨ 特性

- 🚀 **完整 TypeScript 支持**: 严格类型检查和 IntelliSense 支持
- 📡 **原生流式支持**: 内置服务器发送事件流支持，自动终止检测
- 🎯 **声明式 API**: 使用装饰器模式实现简洁、可读的代码
- 🔧 **Fetcher 生态集成**: 基于强大的 Fetcher HTTP 客户端构建，支持高级功能
- 📦 **优化包体积**: 完整的树摇支持，最小化包体积
- 🧪 **全面测试**: 使用 Vitest 进行 100% 测试覆盖
- 🔄 **条件类型**: 基于流式配置的智能返回类型
- 🛡️ **错误处理**: 强大的错误处理和详细的错误消息
- ⚡ **高性能**: 为开发和生产环境优化
- 🔌 **可扩展**: 易于集成自定义拦截器和中间件

## 📦 安装

### 先决条件

- **Node.js**: >= 16.0.0
- **TypeScript**: >= 5.0 (推荐)

### 使用 npm 安装

```bash
npm install @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

### 使用 yarn 安装

```bash
yarn add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

### 使用 pnpm 安装

```bash
pnpm add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

### 对等依赖

此包需要以下对等依赖项：

- `@ahoo-wang/fetcher`: 核心 HTTP 客户端功能
- `@ahoo-wang/fetcher-decorator`: 声明式 API 装饰器
- `@ahoo-wang/fetcher-eventstream`: 服务器发送事件支持

使用上述命令时会自动安装这些依赖。

## 🚀 快速开始

### 基础设置

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

// 使用您的 API 密钥初始化客户端
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!, // 您的 OpenAI API 密钥
});

// 创建简单的聊天补全
const response = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: '你是一个有帮助的助手。' },
    { role: 'user', content: '你好，你怎么样？' },
  ],
  temperature: 0.7,
  max_tokens: 150,
});

console.log(response.choices[0].message.content);
// 输出: "你好！我是AI助手，很高兴为您服务。请问有什么可以帮助您的吗？"
```

### 环境变量设置

在项目根目录创建 `.env` 文件：

```bash
# .env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
```

在代码中使用：

```typescript
import { config } from 'dotenv';
config(); // 加载环境变量

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY!,
});
```

## 📡 流式示例

### 基础流式处理

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 创建流式聊天补全
const stream = await openai.chat.completions({
  model: 'gpt-4', // 使用 GPT-4 获得更好的质量
  messages: [
    { role: 'system', content: '你是一个创意讲故事的人。' },
    { role: 'user', content: '给我讲一个机器人学习画画的故事' },
  ],
  stream: true,
  temperature: 0.8, // 更高的创造性
  max_tokens: 1000,
});

// 实时处理流式响应
let fullResponse = '';
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  if (content) {
    process.stdout.write(content); // 实时输出
    fullResponse += content;
  }
}

console.log('\n\n--- 流式完成 ---');
console.log('总字符数:', fullResponse.length);
```

### 高级流式处理与进度跟踪

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: '写一首关于编程的俳句' }],
  stream: true,
  max_tokens: 1000, // 限制令牌以获得更快的响应
});

// 跟踪流式进度
let chunksReceived = 0;
let totalContent = '';

for await (const chunk of stream) {
  chunksReceived++;
  const content = chunk.choices[0]?.delta?.content || '';

  if (content) {
    totalContent += content;
    // 每 5 个块显示一次进度
    if (chunksReceived % 5 === 0) {
      console.log(
        `已接收 ${chunksReceived} 个块，${totalContent.length} 个字符`,
      );
    }
  }

  // 检查完成
  if (chunk.choices[0]?.finish_reason) {
    console.log(`流式完成: ${chunk.choices[0].finish_reason}`);
    break;
  }
}

console.log('最终内容:', totalContent);
```

## 📚 API 参考

### OpenAI 类

提供访问所有 OpenAI API 功能的主要客户端类。

#### 构造函数

```typescript
new OpenAI(options: OpenAIOptions)
```

使用指定的配置创建新的 OpenAI 客户端实例。

**参数:**

| 参数              | 类型     | 必需 | 描述                                                        |
| ----------------- | -------- | ---- | ----------------------------------------------------------- |
| `options.baseURL` | `string` | ✅   | OpenAI API 的基础 URL（例如 `'https://api.openai.com/v1'`） |
| `options.apiKey`  | `string` | ✅   | 用于身份验证的 OpenAI API 密钥                              |

**示例:**

```typescript
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: 'sk-your-api-key-here',
});
```

**抛出:**

- `TypeError`: 如果未提供 `apiKey` 或 `baseURL`，或它们不是字符串

#### 属性

| 属性      | 类型         | 描述                                 |
| --------- | ------------ | ------------------------------------ |
| `fetcher` | `Fetcher`    | 配置了身份验证的底层 HTTP 客户端实例 |
| `chat`    | `ChatClient` | 用于与聊天模型交互的聊天补全客户端   |

### ChatClient

专门用于 OpenAI Chat Completions API 的客户端，支持流式和非流式响应。

#### 方法

##### `completions<T extends ChatRequest>(chatRequest: T)`

基于流式配置创建具有条件返回类型的聊天补全。

**类型参数:**

- `T`: 扩展 `ChatRequest` - 确定返回类型的请求类型

**参数:**

- `chatRequest: T` - 聊天补全请求配置

**返回:**

- 当 `T['stream']` 为 `false` 时返回 `Promise<ChatResponse>`
- 当 `T['stream']` 为 `true` 时返回 `Promise<JsonServerSentEventStream<ChatResponse>>`

**抛出:**

- `Error`: 网络错误、身份验证失败或 API 错误
- `EventStreamConvertError`: 无法处理流式响应时

### 核心接口

#### ChatRequest

聊天补全请求的配置对象。

```typescript
interface ChatRequest {
  // 核心参数
  model?: string; // 模型 ID（例如 'gpt-3.5-turbo', 'gpt-4'）
  messages: Message[]; // 会话消息
  stream?: boolean; // 启用流式响应

  // 生成参数
  temperature?: number; // 采样温度（0.0 - 2.0）
  max_tokens?: number; // 生成的最大令牌数
  top_p?: number; // 核采样参数（0.0 - 1.0）

  // 惩罚参数
  frequency_penalty?: number; // 重复惩罚（-2.0 - 2.0）
  presence_penalty?: number; // 主题多样性惩罚（-2.0 - 2.0）

  // 高级参数
  n?: number; // 生成的补全选择数量
  stop?: string | string[]; // 停止序列
  logit_bias?: Record<string, number>; // 令牌偏差调整
  user?: string; // 最终用户标识符

  // 响应格式
  response_format?: object; // 响应格式规范

  // 函数调用（测试版）
  tools?: any[]; // 可用工具/函数
  tool_choice?: any; // 工具选择策略

  // 其他 OpenAI 参数
  [key: string]: any;
}
```

#### Message

会话中的单个消息表示。

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string; // 函数消息的名称
  function_call?: any; // 函数调用结果
}
```

#### ChatResponse

非流式聊天补全的响应对象。

```typescript
interface ChatResponse {
  id: string; // 唯一响应标识符
  object: string; // 对象类型（通常为 'chat.completion'）
  created: number; // 创建的 Unix 时间戳
  model: string; // 使用的模型
  choices: Choice[]; // 补全选择数组
  usage: Usage; // 令牌使用统计
}
```

#### Choice

单个补全选择的表示。

```typescript
interface Choice {
  index: number; // 选择索引（从 0 开始）
  message: Message; // 补全消息
  finish_reason: string; // 补全停止的原因
}
```

#### Usage

请求的令牌使用统计。

```typescript
interface Usage {
  prompt_tokens: number; // 提示中的令牌数
  completion_tokens: number; // 补全中的令牌数
  total_tokens: number; // 使用的总令牌数
}
```

## ⚙️ 配置

### 环境变量

设置环境变量以便轻松配置：

```bash
# .env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
```

在应用程序中加载它们：

```typescript
import { config } from 'dotenv';
config();

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY!,
});
```

### 自定义基础 URL

与 OpenAI 兼容的 API、代理或自定义部署一起使用：

```typescript
// 使用 Azure OpenAI
const openai = new OpenAI({
  baseURL:
    'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
  apiKey: 'your-azure-api-key',
});

// 使用代理服务
const openai = new OpenAI({
  baseURL: 'https://your-proxy-service.com/api/openai',
  apiKey: 'your-proxy-api-key',
});

// 使用本地 OpenAI 兼容服务器
const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'not-needed-for-local',
});
```

### 高级配置

#### 自定义 HTTP 客户端配置

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const customFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Custom-Header': 'value',
    'X-Custom-Client': 'my-app/1.0.0',
  },
  timeout: 30000, // 30 秒超时
  retry: {
    attempts: 3, // 重试失败的请求
    delay: 1000, // 重试间隔的初始延迟
    backoff: 'exponential', // 指数退避策略
  },
  interceptors: [
    {
      request: config => {
        console.log(`Making ${config.method} request to ${config.url}`);
        return config;
      },
      response: response => {
        console.log(`Response: ${response.status}`);
        return response;
      },
    },
  ],
});

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 替换默认的 fetcher
openai.fetcher = customFetcher;
```

#### 请求拦截器

```typescript
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 添加日志记录拦截器
openai.fetcher.interceptors.request.use(config => {
  console.log('Request:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    body: config.body,
  });
  return config;
});

openai.fetcher.interceptors.response.use(response => {
  console.log('Response:', {
    status: response.status,
    headers: response.headers,
    data: response.data,
  });
  return response;
});
```

## 🛡️ 错误处理

库提供全面的错误处理，具有详细的错误消息和正确的错误类型。

### 基础错误处理

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

try {
  const response = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好，世界！' }],
  });

  console.log('成功:', response.choices[0].message.content);
} catch (error) {
  console.error('OpenAI API 错误:', error.message);
  console.error('错误详情:', error);
}
```

### 高级错误处理与状态码

```typescript
try {
  const response = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好！' }],
  });
} catch (error: any) {
  // 处理不同错误类型
  if (error.response) {
    // API 返回了错误响应
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        console.error('身份验证失败 - 检查您的 API 密钥');
        break;
      case 429:
        console.error('速率限制超过 - 实施退避策略');
        console.log('重试间隔:', data.retry_after, '秒');
        break;
      case 400:
        console.error('请求错误 - 检查您的参数');
        console.log('错误详情:', data.error);
        break;
      case 500:
      case 502:
      case 503:
        console.error('OpenAI 服务器错误 - 使用指数退避重试');
        break;
      default:
        console.error(`意外错误 (${status}):`, data.error?.message);
    }
  } else if (error.request) {
    // 网络错误
    console.error('网络错误 - 检查您的互联网连接');
    console.error('请求详情:', error.request);
  } else {
    // 其他错误
    console.error('意外错误:', error.message);
  }
}
```

### 流式错误处理

```typescript
try {
  const stream = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '给我讲个故事' }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      process.stdout.write(content);
    }
  }
} catch (error) {
  if (error.name === 'EventStreamConvertError') {
    console.error('流式错误 - 响应可能不是有效的服务器发送事件流');
  } else {
    console.error('流式失败:', error.message);
  }
}
```

### 重试逻辑实现

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

class ResilientOpenAI {
  private client: OpenAI;
  private maxRetries: number;
  private baseDelay: number;

  constructor(apiKey: string, maxRetries = 3, baseDelay = 1000) {
    this.client = new OpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey,
    });
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async completions(request: any, attempt = 1): Promise<any> {
    try {
      return await this.client.chat.completions(request);
    } catch (error: any) {
      const isRetryable =
        error.response?.status >= 500 ||
        error.response?.status === 429 ||
        !error.response; // 网络错误

      if (isRetryable && attempt <= this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, attempt - 1); // 指数退避
        console.log(`尝试 ${attempt} 失败，${delay}ms 后重试...`);
        await this.delay(delay);
        return this.completions(request, attempt + 1);
      }

      throw error;
    }
  }
}

// 使用
const resilientClient = new ResilientOpenAI(process.env.OPENAI_API_KEY!);

try {
  const response = await resilientClient.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好！' }],
  });
  console.log(response.choices[0].message.content);
} catch (error) {
  console.error('所有重试尝试都失败:', error.message);
}
```

## 🔧 高级用法

### 自定义 Fetcher 配置

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const customFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Custom-Header': 'value',
    'X-Custom-Client': 'my-app/1.0.0',
  },
  timeout: 30000, // 30 秒超时
  retry: {
    attempts: 3, // 重试失败的请求
    delay: 1000, // 重试间隔的初始延迟
    backoff: 'exponential', // 指数退避策略
  },
  interceptors: [
    {
      request: config => {
        console.log(`Making ${config.method} request to ${config.url}`);
        return config;
      },
      response: response => {
        console.log(`Response: ${response.status}`);
        return response;
      },
    },
  ],
});

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 替换默认的 fetcher
openai.fetcher = customFetcher;
```

### 函数调用（测试版）

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 定义可用函数
const functions = [
  {
    name: 'get_weather',
    description: '获取某个位置的当前天气',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: '城市和州，例如：旧金山，加利福尼亚',
        },
      },
      required: ['location'],
    },
  },
];

// 使用函数调用进行请求
const response = await openai.chat.completions({
  model: 'gpt-4',
  messages: [{ role: 'user', content: '旧金山的天气怎么样？' }],
  functions: functions,
  function_call: 'auto', // 让模型决定何时调用函数
});

// 处理函数调用
if (response.choices[0].message.function_call) {
  const functionCall = response.choices[0].message.function_call;
  console.log('调用的函数:', functionCall.name);
  console.log('参数:', JSON.parse(functionCall.arguments));
}
```

### 会话管理

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

class ChatConversation {
  private client: OpenAI;
  private messages: Array<{ role: string; content: string }> = [];

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey,
    });
  }

  async addMessage(role: 'system' | 'user' | 'assistant', content: string) {
    this.messages.push({ role, content });
  }

  async sendMessage(content: string, options: Partial<ChatRequest> = {}) {
    await this.addMessage('user', content);

    const response = await this.client.chat.completions({
      model: 'gpt-3.5-turbo',
      messages: this.messages,
      ...options,
    });

    const assistantMessage = response.choices[0].message;
    await this.addMessage('assistant', assistantMessage.content);

    return assistantMessage;
  }

  getHistory() {
    return [...this.messages];
  }

  clearHistory() {
    this.messages = [];
  }
}

// 使用
const conversation = new ChatConversation(process.env.OPENAI_API_KEY!);

// 设置系统提示
await conversation.addMessage('system', '你是一个有帮助的编程助手。');

// 进行对话
const response1 = await conversation.sendMessage('如何使用 TypeScript？');
console.log('助手:', response1.content);

const response2 = await conversation.sendMessage('能给我举个例子吗？');
console.log('助手:', response2.content);
```

### 批量处理

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

async function processBatch(prompts: string[], batchSize = 5) {
  const results = [];

  // 分批处理以避免速率限制
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);

    const batchPromises = batch.map(prompt =>
      openai.chat.completions({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    );

    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 在批次之间添加延迟以遵守速率限制
      if (i + batchSize < prompts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 失败:`, error);
      // 继续下一个批次或实施重试逻辑
    }
  }

  return results;
}

// 使用
const prompts = [
  '解释量子计算',
  '什么是机器学习？',
  '区块链如何工作？',
  '描述云计算',
];

const results = await processBatch(prompts);
results.forEach((result, index) => {
  console.log(`提示 ${index + 1}:`, result.choices[0].message.content);
});
```

### 与其他 Fetcher 功能集成

由于此库基于 Fetcher 生态构建，您可以利用所有 Fetcher 功能：

#### 请求/响应拦截器

```typescript
// 添加请求日志记录
openai.fetcher.interceptors.request.use(config => {
  console.log(`[${new Date().toISOString()}] ${config.method} ${config.url}`);
  return config;
});

openai.fetcher.interceptors.response.use(response => {
  console.log(`[${new Date().toISOString()}] Response: ${response.status}`);
  return response;
});
```

#### 自定义结果提取器

```typescript
import { ResultExtractor } from '@ahoo-wang/fetcher';

// 创建添加元数据的自定义提取器
const metadataExtractor: ResultExtractor = exchange => {
  const response = exchange.response;
  return {
    ...response,
    _metadata: {
      requestId: response.headers.get('x-request-id'),
      processingTime: Date.now() - exchange.startTime,
      model: response.model,
    },
  };
};

// 与聊天补全一起使用
const response = await openai.chat.completions(
  {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好！' }],
  },
  {
    resultExtractor: metadataExtractor,
  },
);
```

#### 请求去重

```typescript
// 为相同的请求启用请求去重
openai.fetcher.defaults.deduplicate = true;

// 这将重用相同并发请求的响应
const [response1, response2] = await Promise.all([
  openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好！' }],
  }),
  openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好！' }],
  }),
]);
```

## 🔄 迁移指南

### 从 OpenAI SDK 迁移

如果您要从官方 OpenAI SDK 迁移：

```typescript
// 之前 (OpenAI SDK)
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: '你好!' }],
});

// 之后 (Fetcher OpenAI)
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const response = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: '你好!' }],
});
```

### 主要差异

| 功能           | OpenAI SDK            | Fetcher OpenAI            |
| -------------- | --------------------- | ------------------------- |
| **流式**       | `for await (...)`     | `for await (...)` (相同)  |
| **错误处理**   | 自定义错误类型        | 标准 JavaScript 错误      |
| **配置**       | `new OpenAI(options)` | `new OpenAI(options)`     |
| **TypeScript** | 完整支持              | 完整支持和条件类型        |
| **拦截器**     | 有限                  | 完整的 Fetcher 拦截器支持 |
| **包体积**     | 较大                  | 经过树摇优化的体积        |

## 🐛 故障排除

### 常见问题

#### 身份验证错误

**问题：** `401 Unauthorized` 错误

**解决方案：**

```typescript
// 1. 检查您的 API 密钥
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!, // 确保已设置
});

// 2. 验证 API 密钥格式
if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
  throw new Error('API 密钥格式无效');
}
```

#### 流式处理不工作

**问题：** 流式响应未按预期工作

**解决方案：**

```typescript
// 1. 确保 stream 参数设置为 true
const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: '你好!' }],
  stream: true, // 这是必需的
});

// 2. 正确处理流
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content); // 使用 process.stdout.write 进行实时输出
  }
}
```

#### 速率限制

**问题：** `429 Too Many Requests` 错误

**解决方案：**

```typescript
// 实施指数退避
async function completionsWithRetry(request: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await openai.chat.completions(request);
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 指数退避
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

#### 网络错误

**问题：** 连接超时或网络故障

**解决方案：**

```typescript
// 配置超时和重试
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 设置自定义超时
openai.fetcher.defaults.timeout = 60000; // 60 秒

// 添加重试逻辑
openai.fetcher.defaults.retry = {
  attempts: 3,
  delay: 1000,
  backoff: 'exponential',
};
```

### 调试模式

启用调试日志记录以排除问题：

```typescript
// 启用请求日志记录
openai.fetcher.interceptors.request.use(config => {
  console.log('Request:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    body: config.body,
  });
  return config;
});

openai.fetcher.interceptors.response.use(response => {
  console.log('Response:', {
    status: response.status,
    headers: response.headers,
    data: response.data,
  });
  return response;
});
```

## ⚡ 性能提示

### 优化包体积

```typescript
// 仅导入您需要的功能
import { OpenAI } from '@ahoo-wang/fetcher-openai';

// 避免导入未使用的功能
// ❌ 不要这样做，如果您只需要聊天补全
// import * as OpenAI from '@ahoo-wang/fetcher-openai';
```

### 连接池化

对于高吞吐量应用程序：

```typescript
// 使用 HTTP/2 兼容客户端以获得更好的性能
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// 为 Node.js 配置连接池化
process.env.NODE_OPTIONS = '--max-http-header-size=81920';
```

### 流式优化

```typescript
// 高效处理流式响应
const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: '这里是长响应...' }],
  stream: true,
  max_tokens: 1000, // 限制令牌以获得更快的响应
});

// 使用高效的流式处理
let buffer = '';
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  buffer += content;

  // 按块处理而不是逐字符
  if (buffer.length >= 100) {
    processChunk(buffer);
    buffer = '';
  }
}
```

### 缓存策略

```typescript
// 为相似请求实施响应缓存
class CachedOpenAI {
  private cache = new Map<string, any>();
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey,
    });
  }

  private getCacheKey(request: any): string {
    return JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
    });
  }

  async completions(request: any, useCache = true) {
    const cacheKey = this.getCacheKey(request);

    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await this.client.chat.completions(request);

    if (useCache) {
      this.cache.set(cacheKey, response);
    }

    return response;
  }
}
```

## 🤝 贡献

我们欢迎贡献！请查看我们的[贡献指南](../../CONTRIBUTING.md)了解详情。

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/Ahoo-Wang/fetcher.git
cd fetcher

# 安装依赖
pnpm install

# 为此包运行测试
pnpm --filter @ahoo-wang/fetcher-openai test

# 构建包
pnpm --filter @ahoo-wang/fetcher-openai build
```

### 代码风格

此项目使用 ESLint 和 Prettier 进行代码格式化。请确保您的代码遵循既定的模式：

```bash
# 代码检查
pnpm --filter @ahoo-wang/fetcher-openai lint

# 格式化代码
pnpm format
```

## 📄 许可证

根据 Apache License, Version 2.0 许可证授权。详见 [LICENSE](../../LICENSE)。

## 🔗 相关包

- [**@ahoo-wang/fetcher**](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher) - 具有高级功能的核心 HTTP 客户端
- [**@ahoo-wang/fetcher-decorator**](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher-decorator) - 用于类型安全请求的声明式 API 装饰器
- [**@ahoo-wang/fetcher-eventstream**](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher-eventstream) - 实时流式处理的服务器发送事件支持
- [**@ahoo-wang/fetcher-openapi**](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/openapi) - OpenAPI 规范客户端生成

---

<p align="center">
  <strong>使用 Fetcher 生态 ❤️ 构建</strong>
</p>

<p align="center">
  <a href="https://github.com/Ahoo-Wang/fetcher">GitHub</a> •
  <a href="https://www.npmjs.com/package/@ahoo-wang/fetcher-openai">NPM</a> •
  <a href="https://deepwiki.com/Ahoo-Wang/fetcher">文档</a>
</p>
