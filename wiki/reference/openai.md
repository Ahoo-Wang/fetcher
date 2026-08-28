---
title: OpenAI reference
description: Call Chat Completions through Fetcher with conditional typed streaming results.
pageClass: reference-page
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

## Request and result contract

| Area          | Main types                                                 | Notes                                             |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Input         | `ChatRequest`, `Message`, `ChatTool`, `ChatToolChoice`     | `model` and `messages` define the minimum request |
| Non-streaming | `ChatResponse`, `Choice`, `Usage`                          | Returned when `stream` is absent or `false`       |
| Streaming     | `JsonServerSentEventStream<ChatResponse>`                  | Each `Choice` can carry a partial `delta` message |
| Extraction    | `ResultExtractors.Json`, `CompletionStreamResultExtractor` | Selects JSON versus SSE and handles `[DONE]`      |

Keep `stream` as a literal when callers need a narrowed return type. A runtime
boolean produces a union that the caller must narrow.

## Error and cancellation boundary

HTTP status, timeout, and transport failures remain Fetcher errors. SSE
conversion failures can occur after the request promise resolves, while the
stream is consumed. Put both the initial call and `for await` loop inside the
error boundary and pass an `AbortController` owned by the caller.

The package models OpenAI-compatible Chat Completions; it does not proxy or
protect credentials. Browser applications should call their own trusted
backend.

## Source and agent reference

- Public exports: [`packages/openai/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/index.ts)
- Detailed agent API: [`skills/fetcher-openai-client/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openai-client/references/api.md)
- Skill: [`$fetcher-openai-client`](../skills/streaming-and-openai.md#fetcher-openai-client)

See [OpenAI streaming](../recipes/openai-streaming.md) for cancellation and UI
assembly.
