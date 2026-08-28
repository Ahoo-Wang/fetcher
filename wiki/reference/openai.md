---
title: OpenAI reference
description: Call Chat Completions through Fetcher with conditional typed streaming results.
---

# `@ahoo-wang/fetcher-openai`

The OpenAI package provides a typed Chat Completions client. It selects JSON or
Server-Sent Event result extraction from the request's `stream` flag.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openai
```

## High-level client

```ts
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const response = await openai.chat.completions({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: 'Explain event sourcing briefly.' }],
});

console.log(response.choices[0]?.message.content);
```

Keep API keys on a trusted server. A browser bundle cannot protect a secret,
even when it comes from an environment variable at build time.

## Streaming

```ts
const chunks = await openai.chat.completions({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: 'Write a release note.' }],
  stream: true,
});

for await (const event of chunks) {
  const text = event.data.choices[0]?.delta?.content;
  if (text) process.stdout.write(text);
}
```

When `stream: true` is a literal, the return type is
`JsonServerSentEventStream<ChatResponse>`; otherwise it is `ChatResponse`.
`CompletionStreamResultExtractor` stops at the protocol's `[DONE]` marker.

## Bring your own Fetcher

```ts
import { ChatClient } from '@ahoo-wang/fetcher-openai';
import { api } from './api';

const chat = new ChatClient({ fetcher: api, basePath: 'chat' });
```

Use `ChatClient` when authentication, proxy routing, logging, or retries already
live in a shared Fetcher. `ChatRequest`, `ChatResponse`, message, choice, usage,
and stream delta types are public exports.

See [OpenAI streaming](../recipes/openai-streaming.md) for cancellation and UI
assembly.
