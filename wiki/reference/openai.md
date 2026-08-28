---
title: OpenAI reference
description: Call OpenAI-compatible Chat Completions through Fetcher, including typed SSE, cancellation, and protocol failures.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-openai`

Use this package for the OpenAI-compatible **Chat Completions** endpoint. It
does not implement the broader OpenAI API, proxy requests, or protect keys.
Choose the high-level `OpenAI` client for its built-in Bearer setup, or pass a
shared `Fetcher` to `ChatClient` when the application owns routing and
interceptors.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openai
```

`@ahoo-wang/fetcher-decorator` and `@ahoo-wang/fetcher-eventstream` are peer
dependencies. A runtime must provide the standard Fetch API and streaming
`ReadableStream` support.

## Choose an entry point

| Need | Public entry | What it configures |
| --- | --- | --- |
| Simple Chat Completions client | `new OpenAI({ baseURL, apiKey })` | A `Fetcher` with `Authorization: Bearer …` and `chat` |
| Reuse a proxy, timeout, or interceptors | `new ChatClient({ fetcher })` | The decorated `/chat/completions` endpoint on that Fetcher |
| Abort a stream or choose extraction explicitly | `fetcher.post(..., { abortController }, { resultExtractor })` | The underlying request and stream lifecycle |

`OpenAIOptions.baseURL` and `apiKey` are both required strings. The constructor
uses only `baseURL` and creates the Bearer header; it does not expose timeout,
custom headers, or interceptors as `OpenAIOptions` fields
([`openai.ts:24`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L24),
[`openai.ts:99`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L99)).

## Typed completion

`model` and `messages` are required by TypeScript. All request properties are
forwarded as JSON; these types are not runtime schema validation, and this
package does not validate provider-specific ranges or defaults.

| Request field | Type | Notes |
| --- | --- | --- |
| `model` | `string` | Required provider model identifier |
| `messages` | `Message[]` | Required; `Message` deliberately permits provider extensions |
| `stream` | `boolean` | Omitted or `false` selects JSON; literal `true` selects SSE |
| `tools` / `tool_choice` | `ChatTool[]` / `ChatToolChoice` | Function tools; choice is `'none'`, `'auto'`, or a function selector |
| `stop` | `string \| string[] \| null` | Provider request field |
| sampling fields | optional numbers | `temperature`, `top_p`, penalties, `seed`, and `max_tokens` |

```ts
import { OpenAI, type ChatResponse } from '@ahoo-wang/fetcher-openai';

const client = new OpenAI({
  baseURL: 'https://api.example.test/v1',
  apiKey: 'placeholder-api-key',
});

const completion: ChatResponse = await client.chat.completions({
  model: 'example-chat-model',
  messages: [{ role: 'user', content: 'Summarize this in one sentence.' }],
  tools: [
    {
      type: 'function',
      function: { name: 'lookup_status', parameters: { type: 'object' } },
    },
  ],
  tool_choice: 'auto',
});

const text = completion.choices[0]?.message?.content;
```

The JSON result is *typed* as `ChatResponse`: `id`, `object`, `created`,
`choices`, and `usage` are required by its TypeScript shape. A successful HTTP
response with a provider error shape or missing fields is not automatically
turned into a protocol exception. Streaming chunks reuse `ChatResponse`, but
normally carry `Choice.delta` instead of `Choice.message` and can omit declared
full-response fields such as `usage`. Check the provider payload defensively
before reading `choices`, `message`, `delta`, or `usage`
([`types.ts:14`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L14),
[`types.ts:143`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L143)).

## Shared Fetcher and ChatClient

`ChatClient` has the class path `chat` and its `completions()` method posts to
`/completions`, so its effective endpoint is `/chat/completions`
([`chatClient.ts:77`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L77),
[`chatClient.ts:255`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L255)).
Pass a `Fetcher` object through the public `ApiMetadata`; the decorated client
caches its executor after the first method call, so construct it with final
metadata ([`apiDecorator.ts:168`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L168)).

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { ChatClient, type ChatResponse } from '@ahoo-wang/fetcher-openai';

const api = new Fetcher({
  baseURL: 'https://api.example.test/v1',
  headers: { Authorization: 'Bearer placeholder-api-key' },
  timeout: 15_000,
});
const chat = new ChatClient({ fetcher: api });

const completion: ChatResponse = await chat.completions({
  model: 'example-chat-model',
  messages: [{ role: 'user', content: 'Hello.' }],
});
```

## Streaming, `[DONE]`, and cancellation

`completions<T>()` resolves to `JsonServerSentEventStream<ChatResponse>` only
when `T['stream']` extends literal `true`; otherwise it resolves to
`ChatResponse`. This conditional type is non-distributive: `stream: boolean`
therefore has the static result `ChatResponse`, even though `beforeExecute()`
will choose SSE at runtime when that boolean happens to be `true`. Do not call
this API with a runtime-boolean `stream`; branch first and construct literal
`true` / `false` requests in each branch.
([`chatClient.ts:146`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L146),
[`chatClient.ts:255`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L255)).
The extractor decodes JSON SSE events and stops before yielding an event whose
data is exactly `[DONE]` ([`completionStreamResultExtractor.ts:39`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L39)).

```ts
import {
  type ChatClient,
  type ChatResponse,
} from '@ahoo-wang/fetcher-openai';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

async function complete(
  chat: ChatClient,
  shouldStream: boolean,
): Promise<void> {
  if (shouldStream) {
    const stream: JsonServerSentEventStream<ChatResponse> =
      await chat.completions({
        model: 'example-chat-model',
        messages: [{ role: 'user', content: 'Stream this.' }],
        stream: true as const,
      });
    void stream;
  } else {
    const response: ChatResponse = await chat.completions({
      model: 'example-chat-model',
      messages: [{ role: 'user', content: 'Return this once.' }],
      stream: false as const,
    });
    void response;
  }
}
```

`ChatClient.completions()` accepts only the body argument, so it has no public
per-call `AbortController` parameter. Use the public Fetcher entry when the
caller must own cancellation:

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CompletionStreamResultExtractor,
  type ChatResponse,
} from '@ahoo-wang/fetcher-openai';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

const controller = new AbortController();
const api = new Fetcher({
  baseURL: 'https://api.example.test/v1',
  headers: { Authorization: 'Bearer placeholder-api-key' },
});

try {
  const stream: JsonServerSentEventStream<ChatResponse> = await api.post(
    '/chat/completions',
    {
      abortController: controller,
      body: {
        model: 'example-chat-model',
        messages: [{ role: 'user', content: 'Stream a short answer.' }],
        stream: true,
      },
    },
    { resultExtractor: CompletionStreamResultExtractor },
  );

  for await (const event of stream) {
    const delta = event.data.choices[0]?.delta?.content;
    if (delta) process.stdout.write(delta);
  }
} finally {
  controller.abort();
}
```

Stopping `for await` early is not a documented cancellation API for this
package. Abort the caller-owned controller when the consumer is discarded;
do not reuse an already-aborted controller for a new request.

## Failure boundary and troubleshooting

The initial promise can reject for Fetcher transport, timeout, or non-2xx
status validation. After it resolves, SSE content-type/frame/JSON conversion can
still fail while the stream is consumed. Put both `await` and `for await` in the
same error boundary. The extractor requires Fetcher's JSON event-stream response
helper and throws when that conversion cannot be performed
([`completionStreamResultExtractor.ts:88`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L88)).

| Symptom | Check |
| --- | --- |
| Static `ChatResponse` but runtime SSE | Do not use `stream: boolean`: it statically resolves to `ChatResponse`; branch and call with literal `true` or `false`. |
| Stream conversion fails | Confirm the provider returns SSE frames and a compatible event-stream content type, not JSON or an HTML proxy error. |
| HTTP succeeded but a field is absent | The package does not runtime-validate success payloads; check provider error/data shapes before dereferencing typed fields. |
| `401` or `403` | Check the trusted server's provider credential and the configured base URL; do not print the key to debug. |
| Request will not stop | Use the custom Fetcher example and abort its controller. |
| Custom Fetcher is ignored | Supply `fetcher` in `ChatClient` metadata before the first `completions()` call. |

## Security and source references

An API key in a browser bundle is readable by its users. Put provider calls and
real credentials behind a trusted backend; use only placeholder keys in tests
and documentation. This package sets a Bearer header but does not redact logs
or add retry policy ([`openai.ts:99`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L99)).

- [packages/openai/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/index.ts#L14)
- [packages/openai/src/openai.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L63)
- [packages/openai/src/chat/chatClient.ts:255](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L255)
- [packages/openai/src/chat/completionStreamResultExtractor.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L39)
