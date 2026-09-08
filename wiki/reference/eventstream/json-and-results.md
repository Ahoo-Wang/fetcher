---
title: 'JSON events, Response helpers, and extractors'
description: 'JSON events, Response helpers, and extractors — @ahoo-wang/fetcher-eventstream 5.0.0'
---

# JSON events, Response helpers, and extractors

Importing the root package installs Response helpers when Response exists, and installs a ReadableStream async-iterator fallback only if needed. Existing own properties/methods are not overwritten. Loading the package in a runtime without those globals does not install a later polyfill automatically.

## JSON conversion {#json}

`toJsonServerSentEventStream<DATA>(stream: ServerSentEventStream, terminateDetector?): JsonServerSentEventStream<DATA>` pipes SSE objects through `JsonServerSentEventTransformStream<DATA>`. That class wraps `JsonServerSentEventTransform<DATA>`, a `SafeTransformer`. Both constructors accept optional `TerminateDetector = (event: ServerSentEvent) => boolean`.

The detector runs before JSON.parse. True terminates without emitting that frame; otherwise data is parsed and event/id/retry are preserved in `JsonServerSentEvent<DATA>`. The generic does not validate JSON shape. With no detector, `[DONE]` is invalid JSON, not a built-in terminator. Invalid JSON or a throwing detector errors the stream, so the consumer's `read`/iteration rejects. Termination closes the readable side and cancels/errors upstream through Web Streams propagation; it is not a reconnect operation.

## Response extensions {#response}

| Member                                     | Result and failure                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `contentType`                              | Header string or null.                                                                                   |
| `isEventStream`                            | Case-insensitive, trimmed media type equals `text/event-stream`; parameters such as charset are allowed. |
| `eventStream()`                            | SSE stream or null on non-SSE content type; null body still throws.                                      |
| `requiredEventStream()`                    | SSE stream; wrong type or null body throws `EventStreamConvertError`.                                    |
| `jsonEventStream<DATA>(detector?)`         | JSON event stream or null on wrong type.                                                                 |
| `requiredJsonEventStream<DATA>(detector?)` | JSON event stream or conversion error.                                                                   |

These methods do not check HTTP status, clone responses, or cache conversions. Consume the body only once. `EventStreamConvertError` extends FetcherError and stores the original `response`; its constructor also accepts optional message and cause. Later parsing errors are stream failures, not necessarily this error type.

## Fetcher integration {#extractors}

`EventStreamResultExtractor` returns `exchange.requiredResponse.requiredEventStream()`. `JsonEventStreamResultExtractor` returns `requiredJsonEventStream()` with **no termination detector** and any data type. For `[DONE]` or typed application protocols, supply a custom `ResultExtractor` calling `requiredJsonEventStream<DATA>(detector)`.

Fetcher status validation finishes before extraction; malformed body/content errors at extraction or iteration must be caught by the caller. Request completion returning a stream does not mean the stream has finished.

## Complete example {#example}

```ts
import '@ahoo-wang/fetcher-eventstream';
import type { ResultExtractor } from '@ahoo-wang/fetcher';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

type Delta = { text: string };
const extractor: ResultExtractor<JsonServerSentEventStream<Delta>> = exchange =>
  exchange.requiredResponse.requiredJsonEventStream<Delta>(
    event => event.data === '[DONE]',
  );
void extractor;
const response = new Response('data: {"text":"hello"}\n\ndata: [DONE]\n\n', {
  headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
});
const chunks: string[] = [];
for await (const event of response.requiredJsonEventStream<Delta>(
  event => event.data === '[DONE]',
)) {
  chunks.push(event.data.text);
}
console.assert(chunks.join('') === 'hello');
```

## Public symbols and source {#symbols}

| Symbol                                                                              | Implementation                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="eventstreamconverterror"></a>`EventStreamConvertError`                       | [eventStreamConverter.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L54)                               |
| <a id="eventstreamresultextractor"></a>`EventStreamResultExtractor`                 | [eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)                   |
| <a id="jsoneventstreamresultextractor"></a>`JsonEventStreamResultExtractor`         | [eventStreamResultExtractor.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L65)                   |
| <a id="terminatedetector"></a>`TerminateDetector`                                   | [jsonServerSentEventTransformStream.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L24)   |
| <a id="jsonserversentevent"></a>`JsonServerSentEvent`                               | [jsonServerSentEventTransformStream.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L31)   |
| <a id="jsonserversenteventtransform"></a>`JsonServerSentEventTransform`             | [jsonServerSentEventTransformStream.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L47)   |
| <a id="jsonserversenteventtransformstream"></a>`JsonServerSentEventTransformStream` | [jsonServerSentEventTransformStream.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L81)   |
| <a id="jsonserversenteventstream"></a>`JsonServerSentEventStream`                   | [jsonServerSentEventTransformStream.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L95)   |
| <a id="tojsonserversenteventstream"></a>`toJsonServerSentEventStream`               | [jsonServerSentEventTransformStream.ts:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L107) |

[Package index](./index.md)
