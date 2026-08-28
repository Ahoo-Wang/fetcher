---
title: 流式读取 OpenAI 响应
description: 配置 ChatClient，获得类型安全的非流式与流式 Chat Completions 响应。
---

# 流式读取 OpenAI 响应

`ChatClient` 面向 Chat Completions 端点，并根据请求的 `stream` 标记选择 JSON 或 SSE 结果提取器。

## 将凭据保留在可信服务端

不要把 API Key 嵌入浏览器 Bundle 或 Storybook。下面的 Node.js 示例从进程环境读取；浏览器应用应该调用可信后端或网关。

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { ChatClient } from '@ahoo-wang/fetcher-openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY is required');

const openaiFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: { Authorization: `Bearer ${apiKey}` },
  timeout: 60_000,
});

const chat = new ChatClient({ fetcher: openaiFetcher });
```

`ChatClient` 提供 `chat/completions` 路径，Fetcher 提供服务 Base URL 与认证请求头。

## 非流式响应

```ts
const response = await chat.completions({
  model: 'your-model-id',
  messages: [{ role: 'user', content: 'Explain typed HTTP clients.' }],
});

console.log(response.choices[0]?.message?.content);
```

省略 `stream` 或设置为 `false` 时，返回类型是 `ChatResponse`。

## 流式响应

```ts
const stream = await chat.completions({
  model: 'your-model-id',
  messages: [{ role: 'user', content: 'Write one short paragraph.' }],
  stream: true,
});

for await (const event of stream) {
  const token = event.data.choices[0]?.delta?.content;
  if (token) process.stdout.write(token);
}
```

返回类型是 `JsonServerSentEventStream<ChatResponse>`。`CompletionStreamResultExtractor` 解析每个 SSE Data 字段，并在原始事件数据为 `[DONE]` 时关闭。

## 取消请求

`ChatClient` 通过 Fetcher 装饰器接收请求生命周期元数据，但其公开 `completions` 方法没有 AbortController 参数。调用方需要取消时，使用配置 `CompletionStreamResultExtractor` 的专用 Fetcher 请求，或在可信网关中终止上游请求。

## 处理失败

捕获 `ExchangeError`，通过 `exchange.response?.status` 判断 API 错误。`401` 表示凭据/配置故障，`429` 表示服务端限流；只按服务端指导重试。流式 JSON 或协议错误会作为事件流转换错误暴露。

## 能力边界

该包描述 `ChatRequest` 和 `ChatResponse` 类型中已有的字段。它不会自动跟随新的 OpenAI 端点，也不保证每个模型都接受所有请求属性。
