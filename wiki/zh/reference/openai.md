---
title: OpenAI 参考
description: 通过 Fetcher 调用 Chat Completions，并获得由请求决定的类型化流式结果。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-openai`

OpenAI 包提供类型化 Chat Completions 客户端，并根据请求的 `stream` 标志选择 JSON
或 Server-Sent Event 结果提取。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openai
```

## 高层客户端

```ts
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const response = await openai.chat.completions({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: '请简要解释事件溯源。' }],
});

console.log(response.choices[0]?.message.content);
```

API Key 必须保留在可信服务端。即使它来自构建时环境变量，浏览器产物也无法保护密钥。

## 流式响应

```ts
const chunks = await openai.chat.completions({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: '写一段发布说明。' }],
  stream: true,
});

for await (const event of chunks) {
  const text = event.data.choices[0]?.delta?.content;
  if (text) process.stdout.write(text);
}
```

当 `stream: true` 是字面量时，返回类型为
`JsonServerSentEventStream<ChatResponse>`；否则为 `ChatResponse`。
`CompletionStreamResultExtractor` 会在协议的 `[DONE]` 标记处停止。

## 使用已有 Fetcher

```ts
import { ChatClient } from '@ahoo-wang/fetcher-openai';
import { api } from './api';

const chat = new ChatClient({ fetcher: api, basePath: 'chat' });
```

认证、代理路由、日志或重试已经位于共享 Fetcher 时，使用 `ChatClient`。`ChatRequest`、
`ChatResponse`、消息、choice、usage 和流式 delta 类型均为公开导出。

## 请求与结果契约

| 范围   | 主要类型                                                   | 说明                                     |
| ------ | ---------------------------------------------------------- | ---------------------------------------- |
| 输入   | `ChatRequest`、`Message`、`ChatTool`、`ChatToolChoice`     | `model` 与 `messages` 构成最小请求       |
| 非流式 | `ChatResponse`、`Choice`、`Usage`                          | `stream` 省略或为 `false` 时返回         |
| 流式   | `JsonServerSentEventStream<ChatResponse>`                  | 每个 `Choice` 可携带部分 `delta` Message |
| 提取   | `ResultExtractors.Json`、`CompletionStreamResultExtractor` | 选择 JSON 或 SSE，并处理 `[DONE]`        |

调用方需要窄化返回类型时，让 `stream` 保持字面量。运行时 Boolean 会产生需要调用方
自行窄化的联合类型。

## 错误与取消边界

HTTP Status、Timeout 和传输失败继续使用 Fetcher 错误。SSE 转换失败可能发生在请求
Promise 已经完成之后，也就是消费 Stream 时。初始调用与 `for await` 循环都应位于错误
边界中，并传入由调用方拥有的 `AbortController`。

该包描述 OpenAI-compatible Chat Completions，不代理也不保护凭据。浏览器应用应调用
自己的可信后端。

## 源码与 Agent 参考

- 公共导出：[`packages/openai/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/index.ts)
- Agent 精确 API：[`skills/fetcher-openai-client/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openai-client/references/api.md)
- Skill：[`$fetcher-openai-client`](../skills/streaming-and-openai.md#fetcher-openai-client)

参阅 [OpenAI 流式请求](../recipes/openai-streaming.md)，了解取消和 UI 内容组装。
