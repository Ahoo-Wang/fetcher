---
title: Stream an OpenAI Response
description: Configure ChatClient for typed non-streaming and streaming Chat Completions responses.
---

# Stream an OpenAI Response

`ChatClient` targets the Chat Completions endpoint and selects JSON or SSE result extraction from the request's `stream` flag.

## Keep credentials on a trusted server

Do not embed an API key in a browser bundle or Storybook. The following Node.js example reads it from the process environment; browser applications should call a trusted backend or gateway.

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { ChatClient } from '@ahoo-wang/fetcher-openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY is required');

const openaiFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: { Authorization: `Bearer ${apiKey}` },
  timeout: 60_000,
});

const chat = new ChatClient({ fetcher: openaiFetcher });
```

`ChatClient` contributes the `chat/completions` path; the Fetcher supplies the service base URL and authentication header.

## Non-streaming response

```ts
const response = await chat.completions({
  model: 'your-model-id',
  messages: [{ role: 'user', content: 'Explain typed HTTP clients.' }],
});

console.log(response.choices[0]?.message?.content);
```

The return type is `ChatResponse` when `stream` is omitted or `false`.

## Streaming response

```ts
const stream = await chat.completions({
  model: 'your-model-id',
  messages: [{ role: 'user', content: 'Write one short paragraph.' }],
  stream: true,
});

for await (const event of stream) {
  const token = event.data.choices[0]?.delta?.content;
  if (token) process.stdout.write(token);
}
```

The return type is `JsonServerSentEventStream<ChatResponse>`. `CompletionStreamResultExtractor` parses each SSE data field and closes when the raw event data is `[DONE]`.

## Abort a request

`ChatClient` accepts request lifecycle metadata through Fetcher decorators, but its public `completions` method does not expose an AbortController parameter. For caller-owned cancellation, use a dedicated Fetcher request with `CompletionStreamResultExtractor`, or terminate the upstream request in your trusted gateway.

## Handle failures

Catch `ExchangeError` and inspect `exchange.response?.status` for API errors. Treat `401` as credential/configuration failure and `429` as server throttling; retry only according to server guidance. Streaming JSON/protocol failures surface as event-stream conversion errors.

## Expected boundaries

This package models the fields present in its `ChatRequest` and `ChatResponse` types. It does not automatically track newer OpenAI endpoints or guarantee that every model accepts every request property.
