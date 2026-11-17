---
title: 'JSON 事件、Response 辅助方法与提取器'
description: 'JSON 事件、Response 辅助方法与提取器 — @ahoo-wang/fetcher-eventstream 5.0.0'
---

# JSON 事件、Response 辅助方法与提取器

导入包根入口时，若 Response 存在则安装辅助方法；仅在缺少 ReadableStream 异步迭代器时补充它。已有自有属性/方法不会被覆盖。在没有这些全局对象的运行时导入，不会在稍后自动补装方法。

## JSON 转换 {#json}

`toJsonServerSentEventStream<DATA>(stream: ServerSentEventStream, terminateDetector?): JsonServerSentEventStream<DATA>` 使用 `JsonServerSentEventTransformStream<DATA>` 转换 SSE 对象。它包装继承 `SafeTransformer` 的 `JsonServerSentEventTransform<DATA>`，两者构造参数都是可选 `TerminateDetector = (event: ServerSentEvent) => boolean`。

检测器在 JSON.parse 前执行，返回 true 时终止且不输出该帧；否则解析 data，并把 event/id/retry 保留在 `JsonServerSentEvent<DATA>` 中。泛型不校验 JSON 结构。不提供检测器时，`[DONE]` 是无效 JSON，不是内置结束标记。JSON 无效或检测器抛错会使流失败，消费者 read/迭代拒绝。有检测器时，输入在结束事件之前结束（连接中断或服务端提前停止）会以继承 FetcherError 的 `EventStreamIncompleteError` 使流失败；没有检测器时流在 EOF 正常结束。终止关闭可读侧，并通过 Web Streams 传播取消/错误到上游，不会重连。

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

`EventStreamResultExtractor` 返回 `exchange.requiredResponse` 的 SSE 流，检查与错误同 `requiredEventStream()`。`JsonEventStreamResultExtractor` 返回其 JSON 事件流，同 `requiredJsonEventStream()`，**不带结束检测器**，data 类型为 any。对于 `[DONE]` 或类型化协议，使用 `jsonEventStreamResultExtractor<DATA>(detector)`：它构建与 `requiredJsonEventStream<DATA>(detector)` 相同的提取器，结束事件既不解析也不产出；流在结束事件之前结束时以 `EventStreamIncompleteError` 出错。

提取器只读取响应的标准 `headers` 与 `body`，不调用上面的 Response 扩展。因此自定义 `fetch` 可以返回其他 realm（iframe 的 `fetch`）或其他实现（单独安装的 `undici`、polyfill）的 Response，即使本包从未修改其原型。直接调用扩展方法仍需要全局构造器创建的 Response。

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
| <a id="eventstreamresultextractor"></a>`EventStreamResultExtractor`                 | [eventStreamResultExtractor.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L49)                   |
| <a id="jsoneventstreamresultextractor"></a>`JsonEventStreamResultExtractor`         | [eventStreamResultExtractor.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L77)                   |
| <a id="jsoneventstreamresultextractor-factory"></a>`jsonEventStreamResultExtractor` | [eventStreamResultExtractor.ts:99](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L99)                   |
| <a id="eventstreamincompleteerror"></a>`EventStreamIncompleteError`                 | [jsonServerSentEventTransformStream.ts:46](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L46)   |
| <a id="terminatedetector"></a>`TerminateDetector`                                   | [jsonServerSentEventTransformStream.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L25)   |
| <a id="jsonserversentevent"></a>`JsonServerSentEvent`                               | [jsonServerSentEventTransformStream.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L32)   |
| <a id="jsonserversenteventtransform"></a>`JsonServerSentEventTransform`             | [jsonServerSentEventTransformStream.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L61)   |
| <a id="jsonserversenteventtransformstream"></a>`JsonServerSentEventTransformStream` | [jsonServerSentEventTransformStream.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L106) |
| <a id="jsonserversenteventstream"></a>`JsonServerSentEventStream`                   | [jsonServerSentEventTransformStream.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L120) |
| <a id="tojsonserversenteventstream"></a>`toJsonServerSentEventStream`               | [jsonServerSentEventTransformStream.ts:132](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L132) |

[包索引](./index.md)
