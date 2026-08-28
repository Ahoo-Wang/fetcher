---
title: 事件流参考
description: 将 SSE 响应转换为类型化 Web Stream，并管理解析与取消边界。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-eventstream`

本包把 `text/event-stream` 解析为 Web Stream。它解析 SSE Frame；不负责建立 HTTP 连接、
校验应用协议语义，或在网络失败后重连。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream
```

`@ahoo-wang/fetcher` 是 Peer Dependency。运行时需要 Web Streams、`Response` 和
`TextDecoderStream`；导入本包会安装 `Response` 辅助 API 与 `ReadableStream` 的异步迭代回退。

## 选择入口

| 需求 | API | 结果 |
| --- | --- | --- |
| 自行转换 `Response` | `toServerSentEventStream(response)` | `ReadableStream<ServerSentEvent>`；Body 缺失时抛错。 |
| 解析 JSON `data` | `toJsonServerSentEventStream<T>(stream, detector?)` | `ReadableStream<JsonServerSentEvent<T>>`。 |
| 可选的 `Response` 转换 | `response.eventStream()` / `jsonEventStream<T>()` | 返回 Stream；非 SSE Content Type 时为 `null`；SSE 但无 Body 时抛出 `EventStreamConvertError`。 |
| 必需的 `Response` 转换 | `response.requiredEventStream()` / `requiredJsonEventStream<T>()` | 返回 Stream 或抛出 `EventStreamConvertError`。 |
| Fetcher 结果提取 | `EventStreamResultExtractor` / `JsonEventStreamResultExtractor` | 从 `FetchExchange` 提取必需的原始 / JSON Stream。 |
| 构建自定义阶段 | `TextLineTransformStream`、`ServerSentEventTransformStream`、`JsonServerSentEventTransformStream<T>` | 各个 `TransformStream` 阶段。 |

调用 `Response` 原型辅助 API 前必须导入 `@ahoo-wang/fetcher-eventstream`。
`isEventStream` 通过 `Content-Type.includes('text/event-stream')` 判断。

## 消费类型化 JSON 事件

```ts
import '@ahoo-wang/fetcher-eventstream';
import { Fetcher } from '@ahoo-wang/fetcher';

interface Progress {
  percent: number;
}

const controller = new AbortController();
const response = await new Fetcher().get('/jobs/42/events', {
  signal: controller.signal,
});

try {
  for await (const event of response.requiredJsonEventStream<Progress>()) {
    console.log(event.data.percent);
  }
} finally {
  controller.abort();
}
```

`JsonServerSentEvent<T>` 保留 `event`、`id` 与 `retry`，同时把 `data: string` 替换成
`data: T`。`TerminateDetector` 会在 `JSON.parse` 前看到解析后的原始 Frame；对 `[DONE]`
等 Sentinel 返回 `true`。

## SSE Frame 与转换流水线

`ServerSentEvent` 的结构为 `{ event, data, id?, retry? }`。Parser 会把缺失的 Event Type
设为 `message`，忽略注释行，用 `\n` 合并重复的 `data:` 字段，忽略包含 NUL 的 `id`，仅在
`retry` 全为 ASCII 数字时接受它。只有至少收到一个 `data:` 字段时，它才会在空行或输入 Stream
flush 时输出 Frame。仅含 Metadata 的 Group 不会在空行立即输出，且该空行不会重置 `event`、`id`
或 `retry`；这些值会应用到后续含 `data` 的 Event。EOF 时，只有 Metadata 的残余会由 flush 清理丢弃
（[`packages/eventstream/src/serverSentEventTransformStream.ts:116`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L116)、
[`packages/eventstream/src/serverSentEventTransformStream.ts:157`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L157)）。

```text
Response.body (ReadableStream<Uint8Array>)
  -> TextDecoderStream('utf-8')
  -> TextLineTransformStream
  -> ServerSentEventTransformStream
  -> JsonServerSentEventTransformStream<T> (可选)
  -> ReadableStream<...> / for await...of
```

`toServerSentEventStream(response)` 正是前三个转换。`data` 不是 JSON 或需要 Frame 元数据时
使用 Raw Stream；只有每个非终止 `data` 都是有效 JSON 时才追加 JSON Transform。

## Response 辅助 API 与 Fetcher Extractor

| API | 返回值 / 失败边界 |
| --- | --- |
| `response.contentType` | 从 `Content-Type` Header 取得的 `string | null`。 |
| `response.isEventStream` | 仅当 Header 包含 `text/event-stream` 时为 `true`。 |
| `response.eventStream()` | Raw Stream 或 `null`；非 SSE Content Type 时不抛错。 |
| `response.requiredEventStream()` | Raw Stream；否则抛出并保留 `response` 的 `EventStreamConvertError`。 |
| `response.jsonEventStream<T>(detector?)` | JSON Stream 或 `null`。 |
| `response.requiredJsonEventStream<T>(detector?)` | JSON Stream 或 `EventStreamConvertError`。 |
| `EventStreamResultExtractor` | 调用 `exchange.requiredResponse.requiredEventStream()`。 |
| `JsonEventStreamResultExtractor` | 调用 `exchange.requiredResponse.requiredJsonEventStream()`；其导出结果类型是 `JsonServerSentEventStream<any>`。 |

可选辅助 API 对非 SSE Response 返回 `null` 且不消费它。对 Body 为 `null` 的 SSE Response，其底层
转换会抛出 `EventStreamConvertError`。Required 辅助 API 还会在 Content Type 非 SSE 时抛错；捕获后
检查 `error.response`。

## 终止、取消与错误

```ts
import {
  toJsonServerSentEventStream,
  toServerSentEventStream,
} from '@ahoo-wang/fetcher-eventstream';

const response = await fetch('/chat');
const events = toJsonServerSentEventStream<{ token: string }>(
  toServerSentEventStream(response),
  event => event.data === '[DONE]',
);

for await (const event of events) {
  console.log(event.data.token);
}
```

`TerminateDetector` 会终止 JSON Transform，但不会输出 Sentinel。通过 `break` 退出异步循环会
取消 Stream Reader（本包回退会显式执行）；若请求由 `AbortController` 创建，还应调用 `abort()`
停止网络请求。

无效 JSON 在消费 JSON Stream 时抛出。每个 `SafeTransformer` 会把转换错误送入 Controller，
然后丢弃后续 Chunk；已关闭 Controller 的 `TypeError` 会被抑制。创建 Stream 与完整消费循环应
处于同一个错误边界内。

## 故障定位

| 现象 | 检查项 |
| --- | --- |
| `requiredEventStream()` 立即抛错 | 确认 `Content-Type` 包含 `text/event-stream`，并且 `Response` 有 Body。 |
| `response.eventStream` 不存在 | 导入 `@ahoo-wang/fetcher-eventstream` 以执行原型 Side Effect。 |
| 处理若干事件后 JSON 失败 | 定位无效的 `data`；混合文本/JSON 协议使用 Raw Stream，Sentinel 使用 Detector。 |
| `[DONE]` Frame 变成解析错误 | 传入 `event => event.data === '[DONE]'` 作为 `TerminateDetector`。 |
| 离开 UI 后连接仍未停止 | 取消/跳出 Reader，并 Abort 所有者的 `AbortController`。 |
| 最后一个 SSE Event 缺失 | 确保服务端发送空行或关闭 Body，以便 Parser flush 缓冲 Frame。 |

## 源码参考

- 公共导出：[index.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/index.ts#L63)
- EventStreamConvertError：[eventStreamConverter.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L54)
- Response 辅助 API 实现：[responses.ts:154](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/responses.ts#L154)
- Fetcher Extractor：[eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)
- SSE Frame Parser：[serverSentEventTransformStream.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L88)
- JSON Transform：[jsonServerSentEventTransformStream.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L47)
- 异步迭代取消：[readableStreamAsyncIterable.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreamAsyncIterable.ts#L125)
