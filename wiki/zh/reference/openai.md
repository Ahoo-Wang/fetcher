---
title: OpenAI 参考
description: 通过 Fetcher 调用 OpenAI-compatible Chat Completions，覆盖类型化 SSE、取消和协议失败。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-openai`

此包用于 OpenAI-compatible 的 **Chat Completions** Endpoint。它不实现更广泛的
OpenAI API，不代理请求，也不保护密钥。简单场景选择内置 Bearer 配置的高层 `OpenAI`
Client；应用已拥有路由和 Interceptor 时，将共享 `Fetcher` 交给 `ChatClient`。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openai
```

`@ahoo-wang/fetcher-decorator` 与 `@ahoo-wang/fetcher-eventstream` 是 Peer
Dependency。运行时需要标准 Fetch API 和支持流式 `ReadableStream`。

## 选择入口

| 目标 | 公共入口 | 配置内容 |
| --- | --- | --- |
| 简单 Chat Completions Client | `new OpenAI({ baseURL, apiKey })` | 带 `Authorization: Bearer …` 的 `Fetcher` 与 `chat` |
| 复用代理、Timeout 或 Interceptor | `new ChatClient({ fetcher })` | 该 Fetcher 上装饰器驱动的 `/chat/completions` Endpoint |
| 中止 Stream 或显式选择提取器 | `fetcher.post(..., { abortController }, { resultExtractor })` | 底层请求和 Stream 生命周期 |

`OpenAIOptions.baseURL` 与 `apiKey` 都是必填 String。构造函数只使用 `baseURL` 并创建
Bearer Header；`OpenAIOptions` 不提供 Timeout、自定义 Header 或 Interceptor 字段
([`openai.ts:24`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L24)，
[`openai.ts:99`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L99))。

## 类型化 Completion

TypeScript 中 `model` 与 `messages` 必填。其余请求字段会作为 JSON 转发；这些类型不是
Runtime Schema Validation，此包也不校验 provider 特有的取值范围或默认值。

| 请求字段 | 类型 | 说明 |
| --- | --- | --- |
| `model` | `string` | 必填的 provider 模型标识 |
| `messages` | `Message[]` | 必填；`Message` 有意允许 provider 扩展字段 |
| `stream` | `boolean` | 省略或 `false` 选择 JSON；字面量 `true` 选择 SSE |
| `tools` / `tool_choice` | `ChatTool[]` / `ChatToolChoice` | Function Tool；choice 为 `'none'`、`'auto'` 或函数选择器 |
| `stop` | `string \| string[] \| null` | Provider 请求字段 |
| Sampling 字段 | 可选 Number | `temperature`、`top_p`、penalty、`seed` 和 `max_tokens` |

```ts
import { OpenAI, type ChatResponse } from '@ahoo-wang/fetcher-openai';

const client = new OpenAI({
  baseURL: 'https://api.example.test/v1',
  apiKey: 'placeholder-api-key',
});

const completion: ChatResponse = await client.chat.completions({
  model: 'example-chat-model',
  messages: [{ role: 'user', content: '请用一句话总结。' }],
  tools: [
    {
      type: 'function',
      function: { name: 'lookup_status', parameters: { type: 'object' } },
    },
  ],
  tool_choice: 'auto',
});

const text = completion.choices[0]?.message?.content;
```

JSON 结果被*声明为* `ChatResponse`：它的 TypeScript 形状要求 `id`、`object`、`created`、
`choices` 和 `usage`。成功 HTTP Response 即使携带 provider error shape 或缺少字段，也不会被
自动转换为协议异常。流式 Chunk 复用 `ChatResponse`，但通常使用 `Choice.delta` 而非
`Choice.message`，并可能缺少 `usage` 等完整 Response 声明为必填的字段。读取 `choices`、
`message`、`delta` 或 `usage` 前都应防御性检查 provider Payload
([`types.ts:14`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L14)，
[`types.ts:143`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L143))。

## 共享 Fetcher 与 ChatClient

`ChatClient` 的 Class Path 是 `chat`，其 `completions()` Method POST 到 `/completions`，
所以最终 Endpoint 是 `/chat/completions`
([`chatClient.ts:77`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L77)，
[`chatClient.ts:255`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L255))。
通过公开的 `ApiMetadata` 传入 `Fetcher` 对象；装饰器 Client 会在首次调用后缓存 Executor，
因此应使用最终 Metadata 创建它
([`apiDecorator.ts:168`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L168))。

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { ChatClient, type ChatResponse } from '@ahoo-wang/fetcher-openai';

const api = new Fetcher({
  baseURL: 'https://api.example.test/v1',
  headers: { Authorization: 'Bearer placeholder-api-key' },
  timeout: 15_000,
});
const chat = new ChatClient({ fetcher: api });

const completion: ChatResponse = await chat.completions({
  model: 'example-chat-model',
  messages: [{ role: 'user', content: '你好。' }],
});
```

## Streaming、`[DONE]` 与取消

仅当 `T['stream']` extends 字面量 `true` 时，`completions<T>()` 才解析为
`JsonServerSentEventStream<ChatResponse>`；否则解析为 `ChatResponse`。该 Conditional Type
不是 distributive：`stream: boolean` 的静态结果因此是 `ChatResponse`，即使运行时 Boolean
恰为 `true` 时 `beforeExecute()` 仍会选择 SSE。不要以运行时 Boolean 调用此 API；应先分支，
并在两条分支中构造字面量 `true` / `false` 请求。
([`chatClient.ts:146`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L146)，
[`chatClient.ts:255`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L255))。
提取器解码 JSON SSE Event，并在 `data` 恰为 `[DONE]` 时停止，且不产出该 Event
([`completionStreamResultExtractor.ts:39`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L39))。

```ts
if (shouldStream) {
  const stream = await chat.completions({
    model: 'example-chat-model',
    messages: [{ role: 'user', content: '请流式输出。' }],
    stream: true as const,
  });
  // stream 是 JsonServerSentEventStream<ChatResponse>
} else {
  const response = await chat.completions({
    model: 'example-chat-model',
    messages: [{ role: 'user', content: '请一次返回。' }],
    stream: false as const,
  });
  // response 是 ChatResponse
}
```

`ChatClient.completions()` 只接收 Body 参数，因此没有公开的单次调用
`AbortController` 参数。需要由调用者拥有取消权时，使用公开 Fetcher 入口：

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CompletionStreamResultExtractor,
  type ChatResponse,
} from '@ahoo-wang/fetcher-openai';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

const controller = new AbortController();
const api = new Fetcher({
  baseURL: 'https://api.example.test/v1',
  headers: { Authorization: 'Bearer placeholder-api-key' },
});

try {
  const stream: JsonServerSentEventStream<ChatResponse> = await api.post(
    '/chat/completions',
    {
      abortController: controller,
      body: {
        model: 'example-chat-model',
        messages: [{ role: 'user', content: '请流式输出简短回答。' }],
        stream: true,
      },
    },
    { resultExtractor: CompletionStreamResultExtractor },
  );

  for await (const event of stream) {
    const delta = event.data.choices[0]?.delta?.content;
    if (delta) process.stdout.write(delta);
  }
} finally {
  controller.abort();
}
```

提前停止 `for await` 不是此包文档化的取消 API。Consumer 被丢弃时应 Abort 它拥有的
Controller；不要将已 Abort 的 Controller 复用于新请求。

## 失败边界与排障

初始 Promise 可能因 Fetcher 传输、Timeout 或非 2xx Status Validation 而 Reject。它 Resolve
之后，消费 Stream 时仍可能发生 SSE Content-Type、Frame 或 JSON 转换失败。`await` 与
`for await` 都应位于同一个 Error Boundary。提取器依赖 Fetcher 的 JSON Event Stream Response
Helper，不能转换时会抛错
([`completionStreamResultExtractor.ts:88`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L88))。

| 现象 | 检查项 |
| --- | --- |
| 静态 `ChatResponse` 但运行时得到 SSE | 不要使用 `stream: boolean`：它静态解析为 `ChatResponse`；先分支并以字面量 `true` 或 `false` 调用。 |
| Stream 转换失败 | 确认 provider 返回 SSE Frame 和兼容的 Event Stream Content-Type，而不是 JSON 或 HTML Proxy Error。 |
| HTTP 成功但字段缺失 | 此包不 Runtime Validate Success Payload；解引用类型字段前检查 provider error/data shape。 |
| `401` 或 `403` | 检查可信服务端的 provider credential 和 Base URL；排障时不要输出 Key。 |
| 请求无法停止 | 使用自定义 Fetcher 示例并 Abort 它的 Controller。 |
| 自定义 Fetcher 没有生效 | 首次 `completions()` 调用前就在 `ChatClient` Metadata 中提供 `fetcher`。 |

## 安全与源码参考

浏览器 Bundle 中的 API Key 对其用户可读。Provider 调用与真实凭据应置于可信后端；测试和文档
只能使用占位 Key。此包设置 Bearer Header，但不脱敏日志，也不添加 Retry Policy
([`openai.ts:99`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L99))。

- [packages/openai/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/index.ts#L14)
- [packages/openai/src/openai.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L63)
- [packages/openai/src/chat/chatClient.ts:255](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L255)
- [packages/openai/src/chat/completionStreamResultExtractor.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L39)
