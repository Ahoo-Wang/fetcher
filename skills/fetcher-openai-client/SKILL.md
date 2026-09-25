---
name: fetcher-openai-client
description: >
  Call OpenAI-compatible chat completions through `@ahoo-wang/fetcher-openai`: `OpenAI`, `ChatClient`, streaming vs non-streaming results, `DoneDetector`, interceptors, HTTP errors. Use whenever a Fetcher app streams or requests a chat completion from GPT or any OpenAI-compatible gateway (`/chat/completions`), including printing tokens as they arrive. For other SSE or LLM APIs use fetcher-llm-streaming; for OpenAI platform features beyond chat, consult OpenAI's docs.
---

# fetcher-openai-client

## Decisions

- **Entry point**: `new OpenAI({ baseURL, apiKey })` builds its own `Fetcher` with `Authorization: Bearer <apiKey>`. Both fields are required and there is no default URL; requests go to `${baseURL}/chat/completions`, so the base URL must include `/v1`. Use `new ChatClient({ fetcher })` directly when you already have a configured (e.g. named) fetcher.
- **Streaming is chosen by the request**, not by an extractor: `chat.completions(req, signal?)` returns a `JsonServerSentEventStream<ChatResponse>` (already terminated by `DoneDetector`) when `stream: true`, otherwise a `ChatResponse`. A `stream` typed as plain `boolean` yields the union.
- **Non-chat endpoints** (embeddings, images, Azure `api-version`) are not covered; build them with `$fetcher-decorator-service` or `$fetcher-llm-streaming`.

## Gotchas a capable model gets wrong

- `completions` is a method: `openai.chat.completions({...})`, not `openai.chat.completions.create(...)`.
- Stream chunks: `event.data.choices[0]?.delta?.content`; non-streaming: `response.choices[0].message?.content`.
- `openai.fetcher` is `readonly`; customize it through `openai.fetcher.interceptors.request.use({ name, order, intercept })` — `order` is required.
- A non-2xx status rejects with `HttpStatusValidationError` (an `ExchangeError`; status at `error.exchange.response?.status`). Mid-stream failures surface from `for await` as `SyntaxError`, `EventStreamIncompleteError` (the stream ended before `[DONE]`) or network errors — rethrow what you don't handle.
- `ChatRequest` and `Message` are a loose subset of the OpenAI schema with an index signature; don't assume every OpenAI field is typed.

## Minimal example

```ts
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});
const stream = await openai.chat.completions({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hi' }],
  stream: true,
});
let text = '';
for await (const event of stream)
  text += event.data.choices[0]?.delta?.content ?? '';
```

## References

- `references/api.md`: `OpenAI`, `ChatClient`, request/response types, streaming and non-streaming examples, interceptors and error handling. Load it for exact types.

## Related Skills

- $fetcher-llm-streaming: SSE parsing and termination for any other stream.
- $fetcher-integration: interceptors and the request lifecycle of the underlying Fetcher.
- $fetcher-react-hooks: exposing completions through React state.
