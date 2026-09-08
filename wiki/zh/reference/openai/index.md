---
prev: false
title: 'Openai 参考'
description: 'Openai 参考 — Fetcher 5.0.0'
---

# Openai 参考

基于 Fetcher 和装饰器的 Chat Completions 客户端，支持 JSON 和 SSE 结果。本包不暴露供应商的其他产品 API。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-decorator
```

命令包含 OpenAI → Decorator/EventStream → Fetcher。使用预构建客户端无需在应用中编写装饰器；自定义装饰器类才需要对应编译配置。流式调用还需要 [EventStream 运行时 API](../eventstream/index.md)。

版本 **5.0.0** 对消费者声明 Node **>=18.20.8**；仓库开发另需 Node **>=20.20.2** 和 pnpm **10.34.5**。

## 最小示例

```ts
import { OpenAI, type OpenAIOptions } from '@ahoo-wang/fetcher-openai';

export async function answer(options: OpenAIOptions, model: string) {
  const client = new OpenAI(options);
  const result = await client.chat.completions({
    model,
    messages: [{ role: 'user', content: 'Say hello.' }],
    stream: false,
  });
  return result.choices[0]?.message?.content ?? '';
}
```

## 选择入口

需要 SDK 创建 Bearer 认证 Fetcher 时用 `OpenAI`；复用应用代理或既有传输策略时用 `ChatClient({ fetcher })`。`stream: false`（或省略）返回一个 JSON 响应，字面量 `stream: true` 返回 SSE 事件。需要逐次调用取消时，使用底层 Fetcher 配合 `CompletionStreamResultExtractor`。

## 专题

- [客户端与聊天补全](client-and-completions)
- [流式聊天补全](streaming)

[完整公开符号索引](./symbols.md)

传入服务端凭证及包含 API 前缀的兼容 base URL（例如 `/v1`）。请求目标为 `/v1/chat/completions`；调用方处理拒绝。完整流式流程见 [Chat 指南](../../guides/streaming/chat.md)。
