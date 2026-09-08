---
title: '流式聊天补全'
description: '流式聊天补全 — Fetcher 5.0.0'
---

# 流式聊天补全

请求 `stream: true` 得到 `JsonServerSentEventStream<ChatResponse>`。每个值是 JSON SSE 事件：读取 `event.data.choices`，不是 `event.choices`。delta 是增量，不是已经拼接好的完整消息。

## 提取与终止

| 导出                                            | 契约                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| `DoneDetector(event: ServerSentEvent): boolean` | 原始 event.data 精确等于 `[DONE]` 才为 true，不 trim、不忽略大小写         |
| `CompletionStreamResultExtractor(exchange)`     | 要求 FetchResponse 和可读 body，返回 requiredJsonEventStream(DoneDetector) |

终止标记在 JSON 解析前识别，不作为 ChatResponse 发出。其他无效 JSON 会使流消费失败。请求 Promise 成功只表示拿到了流，读取时仍可能失败。提取器不拼接 choices、不执行工具调用、不估计 usage，也不重连。

## 完整流式函数

ChatClient 不接受单次调用 signal 参数。需要单次请求 signal 时，使用底层 Fetcher 请求 API 并指定 CompletionStreamResultExtractor。AbortController 可终止未完成的请求；提前结束时取消已获得的 reader，并始终释放锁。

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CompletionStreamResultExtractor,
  type ChatResponse,
} from '@ahoo-wang/fetcher-openai';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

export async function readAnswer(
  baseURL: string,
  model: string,
  signal: AbortSignal,
) {
  const fetcher = new Fetcher({ baseURL });
  const stream = await fetcher.post<JsonServerSentEventStream<ChatResponse>>(
    '/chat/completions',
    {
      signal,
      body: {
        model,
        messages: [{ role: 'user', content: 'Say hello.' }],
        stream: true,
      },
    },
    { resultExtractor: CompletionStreamResultExtractor },
  );
  const reader = stream.getReader();
  let answer = '';
  let finished = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        finished = true;
        break;
      }
      answer += value.data.choices[0]?.delta?.content ?? '';
    }
    return answer;
  } finally {
    try {
      if (!finished) await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
}
```

示例要求已鉴权的同应用代理或服务端配置的传输。文档检查不调用外部供应商。其他遍历方式见 [EventStream 取消](../eventstream/consumption-and-cancellation)。

<span id="donedetector"></span>

**`DoneDetector`** — [packages/openai/src/chat/completionStreamResultExtractor.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L39)

<span id="completionstreamresultextractor"></span>

**`CompletionStreamResultExtractor`** — [packages/openai/src/chat/completionStreamResultExtractor.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L88)
