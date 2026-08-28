---
title: 事件流参考
description: 解析 Server-Sent Events、消费类型化 JSON 流并处理无效流式响应。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-eventstream`

该包把 `text/event-stream` 响应转换为可通过 `for await` 消费的 Web Streams。
导入它还会给平台 `Response` 类型和原型添加事件流辅助 API。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream
```

## 消费 JSON 事件

```ts
import '@ahoo-wang/fetcher-eventstream';
import { Fetcher } from '@ahoo-wang/fetcher';

interface Progress {
  percent: number;
}

const response = await new Fetcher().get('/jobs/42/events');
const events = response.requiredJsonEventStream<Progress>();

for await (const event of events) {
  renderProgress(event.data.percent);
}
```

服务端必须返回 `Content-Type: text/event-stream`。JSON 辅助 API 会解析每个 SSE
的 `data` 字段，并拒绝格式错误的 JSON。

## `Response` 辅助 API

| API                                              | 结果                                 |
| ------------------------------------------------ | ------------------------------------ |
| `response.contentType`                           | `Content-Type` 请求头或 `null`       |
| `response.isEventStream`                         | 内容类型是否包含 `text/event-stream` |
| `response.eventStream()`                         | 解析后的 SSE 流或 `null`             |
| `response.requiredEventStream()`                 | 解析后的 SSE 流，失败时抛错          |
| `response.jsonEventStream<T>(detector?)`         | 类型化 JSON SSE 流或 `null`          |
| `response.requiredJsonEventStream<T>(detector?)` | 类型化 JSON SSE 流，失败时抛错       |

`TerminateDetector` 可在协议专用的结束事件到达时停止 JSON 流，例如 OpenAI 的
`[DONE]` 标记。

## 转换 API

- `toServerSentEventStream(response)` 转换原生 `Response`。
- `toJsonServerSentEventStream(stream, detector?)` 把 SSE data 解析为 JSON。
- `TextLineTransformStream`、`ServerSentEventTransformStream` 和
  `JsonServerSentEventTransformStream` 暴露各流水线阶段。
- `ReadableStreamAsyncIterable` 为不支持原生异步迭代的运行时提供适配。

`EventStreamResultExtractor` 和 `JsonEventStreamResultExtractor` 可把相同转换直接
接入 Fetcher 结果提取。

## 事件形状与流水线

`ServerSentEvent` 暴露 SSE Frame 产生的 `data`、`event`、`id`，以及存在时的
Retry 元数据。一个事件中的多行 `data:` 会在 JSON 转换前合并。

```text
Response.body
  → TextLineTransformStream
  → ServerSentEventTransformStream
  → JsonServerSentEventTransformStream<T>
  → for await...of
```

`event`、`id` 或非 JSON `data` 有意义时使用原始事件流；只有所有非终止 Data 都是
有效 JSON 时才使用 JSON Stream。

## 终止与取消

`TerminateDetector` 在 JSON 转换前看到每个已解析 SSE Event，因此 `[DONE]` 等协议
终止符可以结束 Stream，而不会变成 JSON 错误。取消会沿 Web Stream 传播；HTTP 调用方
拥有 `AbortController` 时也应 Abort，让网络工作停止。

不要假设服务端会在逻辑结束事件后立即关闭连接。协议存在显式终止符时声明 Detector。

## 错误

`EventStreamConvertError` 保留源 `Response`。响应不是事件流或没有可读正文时，
required 辅助 API 会抛出该错误。流解析错误在消费过程中抛出，因此应把 `for await`
循环放在错误边界中。

## 源码与 Agent 参考

- 公共导出：[`packages/eventstream/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/index.ts)
- Agent 精确 API：[`skills/fetcher-llm-streaming/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-llm-streaming/references/api.md)
- Skill：[`$fetcher-llm-streaming`](../skills/streaming-and-openai.md#fetcher-llm-streaming)

继续阅读[流式响应](../learn/streaming.md)和 [OpenAI 流式请求](../recipes/openai-streaming.md)。
