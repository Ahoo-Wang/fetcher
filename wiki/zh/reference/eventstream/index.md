---
prev: false
title: 'Eventstream 参考'
description: '使用 Web Streams 转换 UTF-8 文本、SSE 帧、JSON 数据，并支持可取消消费。'
---

# Eventstream 参考

使用 Web Streams 转换 UTF-8 文本、SSE 帧、JSON 数据，并支持可取消消费。

## 安装与运行时

```sh
pnpm add @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher
```

所选运行时必须在导入本包前提供 `Response`、`ReadableStream`、`TransformStream`、`TextDecoderStream`。根导入安装文档中的 Response 辅助方法，不提供这些 Web API。

5.0.0 为消费者声明 Node >=18.20.8。仓库开发另要求 Node >=20.20.2 / pnpm 10.34.5。所用功能依赖的浏览器/运行时 API 也必须存在，engine 范围不代表每个 Web API（如 Response.bytes）均可用。

## 选择入口

确定只返回 SSE 的端点用 Response `requiredEventStream()`；非 SSE 是预期分支时用 `eventStream()`；调用方已经选定协议时才直接用 `toServerSentEventStream(response)`。`[DONE]` 等协议需要在 JSON 转换时显式提供终止检测器。读取与提前取消由消费者负责。

## 选择专题

| 专题                                                        | 用途                                                                                                                                                                              |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SSE 解析管线](sse-pipeline.md)                             | 把流式 HTTP 响应转换为 `ReadableStream<ServerSentEvent>`。此包解析已有 fetch 响应，不是 EventSource，不会自动重连或重新发送 Last-Event-ID。                                       |
| [JSON 事件、Response 辅助方法与提取器](json-and-results.md) | 导入包根入口时，若 Response 存在则安装辅助方法；仅在缺少 ReadableStream 异步迭代器时补充它。已有自有属性/方法不会被覆盖。在没有这些全局对象的运行时导入，不会在稍后自动补装方法。 |
| [消费、取消与安全转换器](consumption-and-cancellation.md)   | ReadableStream 同时只能有一个活动 reader。将流交给 UI 或其他转换器之前，应确定由哪一层拥有读取和取消责任。                                                                        |

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

[完整公开符号索引](./symbols.md)
