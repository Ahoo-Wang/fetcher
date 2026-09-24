---
name: fetcher-llm-streaming
description: >
  Consume Server-Sent Events and LLM token streams with `@ahoo-wang/fetcher-eventstream`: the `Response.prototype` helpers (`eventStream`, `jsonEventStream`), standalone converters, `TerminateDetector` for `[DONE]`, SSE result extractors and `for await` iteration. Use for any SSE endpoint or non-OpenAI streaming API. For OpenAI-style chat completions use fetcher-openai-client.
---

# fetcher-llm-streaming

## Decisions

- **Prototype helpers vs converters**: `import '@ahoo-wang/fetcher-eventstream'` patches `Response.prototype` (`contentType`, `isEventStream`, `eventStream()`, `requiredEventStream()`, `jsonEventStream()`, `requiredJsonEventStream()`, skipping members that already exist) and polyfills `ReadableStream` async iteration. When global mutation is unwanted, use `toServerSentEventStream(response)` and `toJsonServerSentEventStream(stream, detector)`.
- **Nullable vs required**: `eventStream()` / `jsonEventStream()` return `null` for a non-SSE Content-Type; the `required*` variants throw `EventStreamConvertError` (with `.response`).
- **OpenAI chat completions** already handle `[DONE]` and typing — use `$fetcher-openai-client` instead of rebuilding it here.

## Gotchas a capable model gets wrong

- There is **no default terminator**. Without a `TerminateDetector`, a `data: [DONE]` line reaches `JSON.parse` and the iteration throws `SyntaxError`. `DoneDetector` lives in `@ahoo-wang/fetcher-openai`, not here.
- `JsonEventStreamResultExtractor` passes no detector; for `[DONE]` endpoints write a `ResultExtractor` that calls `exchange.requiredResponse.requiredJsonEventStream(detector)`.
- The SSE extractors are standalone exports of this package, not members of `ResultExtractors` from `@ahoo-wang/fetcher`.
- Items are `JsonServerSentEvent<T>`: the payload is `event.data`; `id` is `''` when the server sent none and `event` defaults to `'message'`.
- Errors during iteration are `SyntaxError` or network/stream errors, not `EventStreamConvertError` — handle both around the `for await` loop.

## Minimal example

```ts
import '@ahoo-wang/fetcher-eventstream';
import type { TerminateDetector } from '@ahoo-wang/fetcher-eventstream';
import { fetcher } from './http';

const done: TerminateDetector = e => e.data === '[DONE]';
const response = await fetcher.post('/generate', { body: { prompt } });
let text = '';
for await (const event of response.requiredJsonEventStream<{ token: string }>(
  done,
)) {
  text += event.data.token;
}
```

## References

- `references/api.md`: prototype extensions, standalone converters, SSE field parsing rules, termination, result extractors and decorator usage. Load it for exact signatures or custom extractors.

## Related Skills

- $fetcher-openai-client: typed OpenAI chat completions with `[DONE]` handled.
- $fetcher-decorator-service: streaming endpoints declared with decorators.
- $fetcher-integration: the Fetcher that produces the `Response`.
