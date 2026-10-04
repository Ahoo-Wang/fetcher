---
name: fetcher-openai-client
description: >
  Call OpenAI-compatible chat completions with `@ahoo-wang/fetcher-openai`: `OpenAI`, `ChatClient`, `chat.completions` streaming and non-streaming, `DoneDetector`, gateway base URLs, headers and interceptors, HTTP and mid-stream errors. Use whenever a Fetcher app requests or streams a chat completion from GPT or any OpenAI-compatible `/chat/completions` endpoint. For other SSE or LLM streams use fetcher-llm-streaming.
---

# fetcher-openai-client

## Decisions

- **Entry point**: `new OpenAI({ baseURL, apiKey, ...fetcherOptions })` builds its own `Fetcher`. `baseURL` and `apiKey` are required and have no defaults; requests go to `${baseURL}/chat/completions`, so the base URL must include `/v1`. Every other `FetcherOptions` field (`headers`, `timeout`, `fetch`, `validateStatus`, `interceptors`) configures that Fetcher; `apiKey` becomes `Authorization: Bearer <apiKey>` and wins over an `Authorization` in `headers`.
- **Static vs per-request headers**: a fixed header goes in `headers`; a value computed per request (trace id, signed timestamp) goes in a request interceptor on `openai.fetcher.interceptors.request`.
- **Existing Fetcher**: `new ChatClient({ fetcher })` takes a `Fetcher` instance or registered name (you set the `Authorization` header yourself).
- **Streaming is chosen by the request**: `chat.completions(req, signal?)` resolves to a `JsonServerSentEventStream<ChatResponse>` (ended by `DoneDetector` at `data: [DONE]`) when `stream: true`, otherwise a `ChatResponse`. A `stream` typed as plain `boolean` yields the union.
- **Not chat**: embeddings, images, Azure `api-version` and other endpoints are not covered; declare them with `$fetcher-decorator-service` (SSE via `$fetcher-llm-streaming`).

## Gotchas a capable model gets wrong

- `completions` is a method: `openai.chat.completions({...})`, not `openai.chat.completions.create(...)`; this is not the official `openai` SDK (no `defaultHeaders`, no `client.chat.completions.create`).
- Stream items are `JsonServerSentEvent<ChatResponse>`: `event.data.choices[0]?.delta?.content`, not `chunk.choices`. Non-streaming: `response.choices[0].message?.content`.
- `openai.fetcher` is `readonly`; don't reassign it. `interceptors.request.use({ name, order, intercept })` — `name` and `order` are required. Passing your own `interceptors` manager replaces the default one, so `validateStatus` and `fetch` options are then ignored.
- A non-2xx status rejects the `completions()` promise with `HttpStatusValidationError` (an `ExchangeError`; status at `error.exchange.response?.status`, not `error.response.status` or `error.status`). Failures after the stream starts come from the `for await`: `SyntaxError`, `EventStreamIncompleteError` (ended before `[DONE]`) or network errors — none is an `ExchangeError`; rethrow what you don't handle.
- `ChatRequest`/`Message`/`ChatResponse` are a loose subset of OpenAI's schema with index signatures; don't assume every OpenAI field is typed.

## Minimal example

```ts
import { ExchangeError } from '@ahoo-wang/fetcher';
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
  timeout: 60_000,
});
openai.fetcher.interceptors.request.use({
  name: 'trace-id',
  order: 0,
  intercept(exchange) {
    exchange.ensureRequestHeaders()['X-Trace-Id'] = crypto.randomUUID();
  },
});

try {
  const stream = await openai.chat.completions({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hi' }],
    stream: true,
  });
  for await (const event of stream) {
    process.stdout.write(event.data.choices[0]?.delta?.content ?? '');
  }
} catch (error) {
  if (!(error instanceof ExchangeError)) throw error; // mid-stream errors
  console.error('HTTP', error.exchange.response?.status);
}
```

## References

- `references/api.md`: `OpenAI`/`OpenAIOptions`, `ChatClient`, request/response types, `CompletionStreamResultExtractor` with a plain Fetcher, interceptors and error handling. Load it for exact types.

## Related Skills

- $fetcher-llm-streaming: SSE parsing and termination for any other stream.
- $fetcher-integration: interceptors and the request lifecycle of the underlying Fetcher.
- $fetcher-react-hooks: exposing completions through React state.
