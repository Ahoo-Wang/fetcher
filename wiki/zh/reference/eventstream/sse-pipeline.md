---
title: 'SSE 解析管线'
description: 'SSE 解析管线 — @ahoo-wang/fetcher-eventstream 5.0.0'
---

# SSE 解析管线

把流式 HTTP 响应转换为 `ReadableStream<ServerSentEvent>`。此包解析已有 fetch 响应，不是 EventSource，不会自动重连或重新发送 Last-Event-ID。

调用方明确要将响应体按 SSE 解释（即使没有 SSE Content-Type）时使用直接转换器。需要检查响应协议时，优先使用 [Response 辅助方法](./json-and-results.md#response)中的 `requiredEventStream()`。这两条路径都不自行检查状态码；Fetcher 会在结果提取前执行状态校验。

## 转换阶段 {#pipeline}

`toServerSentEventStream(response: Response): ServerSentEventStream` 要求正文非 null，否则抛 `EventStreamConvertError(response, 'Response body is null')`。管线为 `response.body → TextDecoderStream('utf-8') → TextLineTransformStream → ServerSentEventTransformStream`。直接转换器不检查状态和 Content-Type；管线会锁定正文，不能同时独立读取。

| API                              | 输入 → 输出                            | 配置                           |
| -------------------------------- | -------------------------------------- | ------------------------------ |
| `TextLineTransformer`            | 字符串 chunk → 去除换行符的字符串      | 无构造参数，保存未完成行状态。 |
| `TextLineTransformStream`        | 上述转换器的 TransformStream 包装      | 无参数。                       |
| `ServerSentEventTransformer`     | 行 → `ServerSentEvent`                 | 无参数，保留事件状态。         |
| `ServerSentEventTransformStream` | 上述转换器的 TransformStream 包装      | 无参数。                       |
| `ServerSentEventStream`          | `ReadableStream<ServerSentEvent>` 别名 | 单消费者流，不是事件总线。     |

行解析支持 LF、CR、CRLF，包含 CR/LF 跨 chunk 的情况。结束时刷新非空未完成行。网络 chunk 不必与行/事件边界重合，UTF-8 解码先处理跨字节分块。

## 事件字段与边界 {#fields}

`ServerSentEvent` 必填 `event: string`、`data: string`，可选 `id?: string`、`retry?: number`。`ServerSentEventFields` 暴露静态常量 `ID = 'id'`、`EVENT = 'event'`、`DATA = 'data'`、`RETRY = 'retry'`。

空行只在至少出现一个 data 字段时投递事件，多条 data 以 `\n` 连接。冒号开头的注释和未知字段被忽略。只在首个冒号分隔字段/值，并最多移除值开头一个空格；无冒号行的值为空。每个事件名称默认 `'message'`，输出 id 默认 `''`；id/retry 跨事件保留直到更新。含 NUL 的 id 被忽略，retry 只接受 ASCII 数字。

正常 EOF 时，即使没有末尾空行，也会投递待完成的 data 事件。只有 id/retry 的帧只更新状态，不投递事件。retry 仅为元数据，解析器不会安排重连。类型化数据和协议结束标记见 [JSON 解码](./json-and-results.md)。

## 完整示例 {#example}

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

## 公开符号与源码 {#symbols}

| 符号                                                                        | 实现                                                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="serversenteventstream"></a>`ServerSentEventStream`                   | [eventStreamConverter.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L31)                       |
| <a id="toserversenteventstream"></a>`toServerSentEventStream`               | [eventStreamConverter.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L127)                     |
| <a id="serversentevent"></a>`ServerSentEvent`                               | [serverSentEventTransformStream.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L21)   |
| <a id="serversenteventfields"></a>`ServerSentEventFields`                   | [serverSentEventTransformStream.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L35)   |
| <a id="serversenteventtransformer"></a>`ServerSentEventTransformer`         | [serverSentEventTransformStream.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L88)   |
| <a id="serversenteventtransformstream"></a>`ServerSentEventTransformStream` | [serverSentEventTransformStream.ts:178](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L178) |
| <a id="textlinetransformer"></a>`TextLineTransformer`                       | [textLineTransformStream.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/textLineTransformStream.ts#L23)                 |
| <a id="textlinetransformstream"></a>`TextLineTransformStream`               | [textLineTransformStream.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/textLineTransformStream.ts#L71)                 |

[包索引](./index.md)
