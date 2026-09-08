---
prev: false
title: 'Openai reference'
description: 'Openai reference — Fetcher 5.0.0'
---

# Openai reference

Chat Completions client with JSON and SSE results built on Fetcher and decorators. No other provider product API is exposed by this package.

## Install

```bash
pnpm add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-decorator
```

The command includes OpenAI → Decorator/EventStream → Fetcher. Prebuilt clients do not require decorator syntax in your application; custom decorated classes do. Streaming additionally needs the [EventStream runtime APIs](../eventstream/index.md).

Version **5.0.0** declares Node **>=18.20.8** for consumers. Repository development requires Node **>=20.20.2** and pnpm **10.34.5**.

## Minimal example

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

## Choose an entry point

Use `OpenAI` when the SDK should create a Bearer-authenticated Fetcher; use `ChatClient({ fetcher })` to reuse an application proxy or an existing transport policy. Use `stream: false` (or omit it) for one JSON response and literal `stream: true` for SSE events. Use the underlying Fetcher plus `CompletionStreamResultExtractor` when per-call cancellation is required.

## Topics

- [Client and chat completions](client-and-completions)
- [Streaming chat completions](streaming)

[Complete public symbol index](./symbols.md)

Supply a server-side credential and a compatible base URL ending at the API prefix (for example `/v1`). The request targets `/v1/chat/completions`; caller code handles rejection. A complete streaming flow is in the [Chat guide](../../guides/streaming/chat.md).
