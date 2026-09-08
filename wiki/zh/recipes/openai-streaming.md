---
title: 流式读取聊天补全
description: 通过应用网关消费 Chat Completions SSE，处理取消和 reader 清理。
---

# 流式读取聊天补全

使用本包的 Chat Completions 契约创建可取消的文本流。本流程描述已安装客户端的行为，不选择供应商模型，也不扩展其他 OpenAI 端点。

## 1. 准备网关

安装 `@ahoo-wang/fetcher`、`@ahoo-wang/fetcher-openai` 和 `@ahoo-wang/fetcher-eventstream`。应用网关须接收 `POST /chat/completions`，转发获授权的模型请求，并返回 `text/event-stream`，包含 JSON data 事件和结尾 `[DONE]`。传入网关 base URL 及网关已启用的模型 ID。供应商凭证保存在可信服务端，浏览器认证由应用负责。

## 2. 消费并释放流

```ts
import { Fetcher, ExchangeError } from '@ahoo-wang/fetcher';
import {
  CompletionStreamResultExtractor,
  type ChatResponse,
} from '@ahoo-wang/fetcher-openai';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

export async function streamAnswer(
  baseURL: string,
  model: string,
  signal: AbortSignal,
  onText: (text: string) => void,
) {
  const api = new Fetcher({ baseURL });
  try {
    const stream = await api.post<JsonServerSentEventStream<ChatResponse>>(
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
    let finished = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          finished = true;
          break;
        }
        const text = value.data.choices[0]?.delta?.content;
        if (text) onText(text);
      }
    } finally {
      try {
        if (!finished) await reader.cancel();
      } finally {
        reader.releaseLock();
      }
    }
  } catch (error) {
    if (signal.aborted) return;
    if (error instanceof ExchangeError) {
      console.error('HTTP status:', error.exchange.response?.status);
    }
    throw error;
  }
}
```

提取器先识别 `[DONE]` 并停止，再尝试 JSON 解析。文本位于 `event.data.choices`，不直接位于 SSE 事件上。部分 chunk 只有角色或终止信息，因此循环跳过不存在的文本。

## 3. 接入启动和停止操作

在拥有该任务的 UI 或服务入口创建 `AbortController`，调用 `streamAnswer(gatewayOrigin, modelId, controller.signal, appendText)`，并捕获其拒绝来显示可恢复错误。将停止按钮和所有者清理连接到 `controller.abort()`。每次尝试创建新控制器。`appendText` 是应用的渲染回调；上面的函数将显式取消信号视为正常取消。

成功和失败后都会释放 reader 锁。消费者在正常完成前失败时，会先取消 reader。响应提取后的 HTTP 超时不代表整个流的截止时间；如需该限制，使用自己的取消计时器，并在清理时清除它。

## 4. 本地验证协议

模拟 fetch 返回 content type 为 `text/event-stream` 的 `Response`，正文为 `data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n`，断言 `onText` 接收到 Hello。同时测试非法 JSON 和取消的请求。隔离测试结束后恢复 fetch。这样无需消耗供应商额度即可检查客户端。

网络或状态错误会拒绝初始请求；非法 SSE/JSON 或传输中断可能拒绝后续读取，两者都需要处理。避免自动重放已显示部分内容的回答，重试会开始一次新的补全。

## 不需要调用方控制取消时

上层 `ChatClient` 根据 stream 选择 JSON 或 SSE。以下完整的非流式函数使用相同网关：

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { ChatClient } from '@ahoo-wang/fetcher-openai';

export async function complete(baseURL: string, model: string) {
  const chat = new ChatClient({ fetcher: new Fetcher({ baseURL }) });
  const result = await chat.completions({
    model,
    messages: [{ role: 'user', content: 'Say hello.' }],
  });
  return result.choices[0]?.message?.content ?? '';
}
```

传入 `stream: true` 将返回 `JsonServerSentEventStream<ChatResponse>`。公开的 completions 方法没有单次调用 signal 参数，因此可取消方案直接使用 Fetcher。

参见[流式契约](../reference/openai/streaming)、[ChatClient 和请求类型](../reference/openai/client-and-completions)及[流消费](../reference/eventstream/consumption-and-cancellation)。

[completionStreamResultExtractor.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L88) 将响应提取连接到终止探测器。
