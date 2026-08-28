---
title: 流式处理
description: 解析 Server-Sent Events、转换 JSON 事件、识别终止标记并安全取消。
---

# 流式处理

`@ahoo-wang/fetcher-eventstream` 将响应体转换为类型化的流处理阶段。导入该包还会安装文档中列出的 `Response` 辅助方法。

## 解析 SSE

```ts
import '@ahoo-wang/fetcher-eventstream';

const response = await fetch('/events');
const stream = response.eventStream();

for await (const event of stream) {
  console.log(event.event, event.id, event.data);
}
```

解析器使用换行符拼接连续的 `data:` 行，公开 `event`、`id`、`retry`，忽略注释行，并在空行结束一个 SSE 事件时发出结果。

## 转换 JSON 数据

```ts
import { toJsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

interface Token {
  value: string;
}

const jsonStream = toJsonServerSentEventStream<Token>(
  response.eventStream(),
  event => event.data === '[DONE]',
);

for await (const event of jsonStream) {
  console.log(event.data.value);
}
```

终止检测器读取原始 `ServerSentEvent`。终止事件会关闭 JSON 流，不会再作为 JSON 解析。

## 处理无效数据

无效 JSON 会通过 `EventStreamConvertError` 报告。协议错误应该可见，而不是静默丢弃：

```ts
try {
  for await (const event of jsonStream) {
    consume(event.data);
  }
} catch (error) {
  console.error('Invalid event stream', error);
}
```

## 取消

消费者不再需要数据时，应取消 HTTP 请求。退出异步循环会停止消费，但如果不希望继续下载，请求所有者仍应取消网络操作。

```ts
const abortController = new AbortController();
const response = await fetch('/events', { signal: abortController.signal });

for await (const event of response.eventStream()) {
  if (event.data === '[DONE]') break;
}

abortController.abort();
```

## 定位停滞的流

检查 `Content-Type`，确认服务端在每个事件后发送空行，确认提供的 Transform 能处理 UTF-8 Chunk 边界，并确保终止标记与原始数据完全一致。
