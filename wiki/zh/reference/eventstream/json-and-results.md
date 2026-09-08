---
title: 'JSON 事件、Response 辅助方法与提取器'
description: 'JSON 事件、Response 辅助方法与提取器 — @ahoo-wang/fetcher-eventstream 5.0.0'
---

# JSON 事件、Response 辅助方法与提取器

导入包根入口时，若 Response 存在则安装辅助方法；仅在缺少 ReadableStream 异步迭代器时补充它。已有自有属性/方法不会被覆盖。在没有这些全局对象的运行时导入，不会在稍后自动补装方法。

## JSON 转换 {#json}

`toJsonServerSentEventStream<DATA>(stream: ServerSentEventStream, terminateDetector?): JsonServerSentEventStream<DATA>` 使用 `JsonServerSentEventTransformStream<DATA>` 转换 SSE 对象。它包装继承 `SafeTransformer` 的 `JsonServerSentEventTransform<DATA>`，两者构造参数都是可选 `TerminateDetector = (event: ServerSentEvent) => boolean`。

检测器在 JSON.parse 前执行，返回 true 时终止且不输出该帧；否则解析 data，并把 event/id/retry 保留在 `JsonServerSentEvent<DATA>` 中。泛型不校验 JSON 结构。不提供检测器时，`[DONE]` 是无效 JSON，不是内置结束标记。JSON 无效或检测器抛错会使流失败，消费者 read/迭代拒绝。终止关闭可读侧，并通过 Web Streams 传播取消/错误到上游，不会重连。

## Response 扩展 {#response}

| 成员                                       | 返回值与失败                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `contentType`                              | 请求头字符串或 null。                                                         |
| `isEventStream`                            | 忽略大小写、去除空格后媒体类型等于 `text/event-stream`；允许 charset 等参数。 |
| `eventStream()`                            | SSE 流，非 SSE 类型返回 null；正文为 null 仍抛错。                            |
| `requiredEventStream()`                    | SSE 流；类型错误或正文 null 时抛 `EventStreamConvertError`。                  |
| `jsonEventStream<DATA>(detector?)`         | JSON 事件流，类型错误返回 null。                                              |
| `requiredJsonEventStream<DATA>(detector?)` | JSON 事件流或转换错误。                                                       |

这些方法不检查 HTTP 状态，不复制响应，也不缓存转换。正文只能消费一次。`EventStreamConvertError` 继承 FetcherError，保存原 `response`，构造器还接受可选消息和 cause。后续解析错误属于流失败，不一定使用此错误类型。

## 集成 Fetcher {#extractors}

`EventStreamResultExtractor` 返回 `exchange.requiredResponse.requiredEventStream()`。`JsonEventStreamResultExtractor` 返回 `requiredJsonEventStream()`，**不带结束检测器**，data 类型为 any。对于 `[DONE]` 或类型化协议，提供自定义 `ResultExtractor`，调用 `requiredJsonEventStream<DATA>(detector)`。

Fetcher 状态校验在提取前完成，提取或迭代时正文/媒体类型错误必须由调用者捕获。请求返回流不代表流已结束。

## 完整示例 {#example}

```ts
import '@ahoo-wang/fetcher-eventstream';
import type { ResultExtractor } from '@ahoo-wang/fetcher';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

type Delta = { text: string };
const extractor: ResultExtractor<JsonServerSentEventStream<Delta>> = exchange =>
  exchange.requiredResponse.requiredJsonEventStream<Delta>(
    event => event.data === '[DONE]',
  );
void extractor;
const response = new Response('data: {"text":"hello"}\n\ndata: [DONE]\n\n', {
  headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
});
const chunks: string[] = [];
for await (const event of response.requiredJsonEventStream<Delta>(
  event => event.data === '[DONE]',
)) {
  chunks.push(event.data.text);
}
console.assert(chunks.join('') === 'hello');
```

## 公开符号与源码 {#symbols}

| 符号                                                                                | 实现                                                                                                                                                            |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="eventstreamconverterror"></a>`EventStreamConvertError`                       | [eventStreamConverter.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L54)                               |
| <a id="eventstreamresultextractor"></a>`EventStreamResultExtractor`                 | [eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)                   |
| <a id="jsoneventstreamresultextractor"></a>`JsonEventStreamResultExtractor`         | [eventStreamResultExtractor.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L65)                   |
| <a id="terminatedetector"></a>`TerminateDetector`                                   | [jsonServerSentEventTransformStream.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L24)   |
| <a id="jsonserversentevent"></a>`JsonServerSentEvent`                               | [jsonServerSentEventTransformStream.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L31)   |
| <a id="jsonserversenteventtransform"></a>`JsonServerSentEventTransform`             | [jsonServerSentEventTransformStream.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L47)   |
| <a id="jsonserversenteventtransformstream"></a>`JsonServerSentEventTransformStream` | [jsonServerSentEventTransformStream.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L81)   |
| <a id="jsonserversenteventstream"></a>`JsonServerSentEventStream`                   | [jsonServerSentEventTransformStream.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L95)   |
| <a id="tojsonserversenteventstream"></a>`toJsonServerSentEventStream`               | [jsonServerSentEventTransformStream.ts:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L107) |

[包索引](./index.md)
