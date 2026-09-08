---
title: 'Eventstream 参考'
description: '使用 Web Streams 转换 UTF-8 文本、SSE 帧、JSON 数据，并支持可取消消费。'
---

# Eventstream 参考

使用 Web Streams 转换 UTF-8 文本、SSE 帧、JSON 数据，并支持可取消消费。

## 安装与运行时

```sh
pnpm add @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher
```

5.0.0 为消费者声明 Node >=18.20.8。仓库开发另要求 Node >=20.20.2 / pnpm 10.34.5。所用功能依赖的浏览器/运行时 API 也必须存在，engine 范围不代表每个 Web API（如 Response.bytes）均可用。

## 选择专题

| 专题                                                          | 用途                                                                                                                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md)                             | 把流式 HTTP 响应转换为 `ReadableStream<ServerSentEvent>`。此包解析已有 fetch 响应，不是 EventSource，不会自动重连或重新发送 Last-Event-ID。                                       |
| [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md) | 导入包根入口时，若 Response 存在则安装辅助方法；仅在缺少 ReadableStream 异步迭代器时补充它。已有自有属性/方法不会被覆盖。在没有这些全局对象的运行时导入，不会在稍后自动补装方法。 |
| [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md)   | ReadableStream 同时只能有一个活动 reader。将流交给 UI 或其他转换器之前，应确定由哪一层拥有读取和取消责任。                                                                        |

## 最小完整示例

```ts
import { toServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

const encoder = new TextEncoder();
const response = new Response(
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of [
        'id: 1\r',
        '\ndata: hel',
        'lo\r\n\r\n',
        'data: tail',
      ]) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  }),
);
const events = [];
for await (const event of toServerSentEventStream(response)) events.push(event);
console.assert(events.length === 2 && events[0].data === 'hello');
console.assert(events[1].data === 'tail' && events[1].id === '1');
```

## 公开导出索引 {#exports}

| 符号                                     | 契约                                                                                               | 源码                                                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ServerSentEventStream`                  | [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md#serversenteventstream)                                            | [eventStreamConverter.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L31)                               |
| `EventStreamConvertError`                | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#eventstreamconverterror)              | [eventStreamConverter.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L54)                               |
| `toServerSentEventStream`                | [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md#toserversenteventstream)                                          | [eventStreamConverter.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L127)                             |
| `EventStreamResultExtractor`             | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#eventstreamresultextractor)           | [eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)                   |
| `JsonEventStreamResultExtractor`         | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#jsoneventstreamresultextractor)       | [eventStreamResultExtractor.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L65)                   |
| `TerminateDetector`                      | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#terminatedetector)                    | [jsonServerSentEventTransformStream.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L24)   |
| `JsonServerSentEvent`                    | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#jsonserversentevent)                  | [jsonServerSentEventTransformStream.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L31)   |
| `JsonServerSentEventTransform`           | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#jsonserversenteventtransform)         | [jsonServerSentEventTransformStream.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L47)   |
| `JsonServerSentEventTransformStream`     | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#jsonserversenteventtransformstream)   | [jsonServerSentEventTransformStream.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L81)   |
| `JsonServerSentEventStream`              | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#jsonserversenteventstream)            | [jsonServerSentEventTransformStream.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L95)   |
| `toJsonServerSentEventStream`            | [JSON 事件、Response 辅助方法与提取器](/zh/reference/eventstream/json-and-results.md#tojsonserversenteventstream)          | [jsonServerSentEventTransformStream.ts:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L107) |
| `ReadableStreamAsyncIterable`            | [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md#readablestreamasynciterable)            | [readableStreamAsyncIterable.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreamAsyncIterable.ts#L54)                 |
| `isReadableStreamAsyncIterableSupported` | [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md#isreadablestreamasynciterablesupported) | [readableStreams.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreams.ts#L37)                                         |
| `TransformerPhase`                       | [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md#transformerphase)                       | [safeTransformer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L19)                                         |
| `SafeTransformer`                        | [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md#safetransformer)                        | [safeTransformer.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L44)                                         |
| `ServerSentEvent`                        | [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md#serversentevent)                                                  | [serverSentEventTransformStream.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L21)           |
| `ServerSentEventFields`                  | [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md#serversenteventfields)                                            | [serverSentEventTransformStream.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L35)           |
| `ServerSentEventTransformer`             | [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md#serversenteventtransformer)                                       | [serverSentEventTransformStream.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L88)           |
| `ServerSentEventTransformStream`         | [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md#serversenteventtransformstream)                                   | [serverSentEventTransformStream.ts:178](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L178)         |
| `StreamController`                       | [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md#streamcontroller)                       | [streamController.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L24)                                       |
| `safeTerminate`                          | [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md#safeterminate)                          | [streamController.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L87)                                       |
| `safeEnqueue`                            | [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md#safeenqueue)                            | [streamController.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L105)                                     |
| `safeError`                              | [消费、取消与安全转换器](/zh/reference/eventstream/consumption-and-cancellation.md#safeerror)                              | [streamController.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L125)                                     |
| `TextLineTransformer`                    | [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md#textlinetransformer)                                              | [textLineTransformStream.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/textLineTransformStream.ts#L23)                         |
| `TextLineTransformStream`                | [SSE 解析管线](/zh/reference/eventstream/sse-pipeline.md#textlinetransformstream)                                          | [textLineTransformStream.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/textLineTransformStream.ts#L71)                         |

Response 原型成员和 ReadableStream 迭代器是全局扩展，不是具名导出，见 [Response 辅助方法](/zh/reference/eventstream/json-and-results.md#response)及[迭代](/zh/reference/eventstream/consumption-and-cancellation.md#iteration)。

## 旧章节链接

旧版参考链接仍可定位到下列专题。

| 旧章节 | 新专题 |
| --- | --- |
| <span id="安装"></span>安装 | [阅读对应专题](/zh/reference/eventstream/index.md) |
| <span id="选择入口"></span>选择入口 | [阅读对应专题](/zh/reference/eventstream/index.md) |
| <span id="消费类型化-json-事件"></span>消费类型化 JSON 事件 | [阅读对应专题](/zh/reference/eventstream/json-and-results.md) |
| <span id="sse-frame-与转换流水线"></span>SSE Frame 与转换流水线 | [阅读对应专题](/zh/reference/eventstream/sse-pipeline.md) |
| <span id="response-辅助-api-与-fetcher-extractor"></span>Response 辅助 API 与 Fetcher Extractor | [阅读对应专题](/zh/reference/eventstream/json-and-results.md) |
| <span id="终止、取消与错误"></span>终止、取消与错误 | [阅读对应专题](/zh/reference/eventstream/consumption-and-cancellation.md) |
| <span id="故障定位"></span>故障定位 | [阅读对应专题](/zh/reference/eventstream/index.md) |
| <span id="源码参考"></span>源码参考 | [阅读对应专题](/zh/reference/eventstream/index.md) |
