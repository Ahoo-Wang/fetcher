---
title: 读取并关闭事件流
description: 读取并关闭事件流 — Fetcher
---

# 读取并关闭事件流

SSE 响应在事件到达期间保持打开。HTTP 获取、帧解析、JSON 转换和消费者清理是不同职责。

## 一个响应只消费一次

```ts
import '@ahoo-wang/fetcher-eventstream';
import { toJsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';
interface Token {
  value: string;
}
const controller = new AbortController();
try {
  const response = await fetch('/events', { signal: controller.signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const raw = response.eventStream();
  if (!raw) throw new Error('Missing response body');
  const events = toJsonServerSentEventStream<Token>(
    raw,
    event => event.data === '[DONE]',
  );
  for await (const event of events) console.log(event.data.value);
} finally {
  controller.abort();
}
```

导入会注册 Response 助手。示例要求你的服务发送包含 JSON `{ "value": "..." }` 的 SSE data，并以原始数据 `[DONE]` 结束。这是集成模板，不是可直接调用的公开接口。

## 理解各层边界

| 阶段      | 职责                                     |
| --------- | ---------------------------------------- |
| HTTP      | 校验状态并持有 AbortController           |
| SSE 解析  | 解码文本行，合并 data 字段并发出完整事件 |
| JSON 转换 | 在解析前检查原始终止标记                 |
| 消费者    | 处理类型化事件，退出时释放资源           |

终止事件不参与 JSON 解析。无效 JSON 会产生转换失败，因此捕获范围应覆盖流消费，而不只是首次 fetch。Token 静态类型不验证事件数据。

流停滞可能是帧未结束：确认服务端在每个事件后发送空行。不要对同一个已消费 body 再次调用 eventStream。finally 保证处理逻辑抛错时也取消网络请求。

详见 [SSE 管线](../reference/eventstream/sse-pipeline.md)、[JSON 结果](../reference/eventstream/json-and-results.md)和[取消](../reference/eventstream/consumption-and-cancellation.md)。
