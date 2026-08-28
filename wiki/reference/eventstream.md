---
title: Event stream reference
description: Convert SSE responses into typed Web Streams and own parsing and cancellation boundaries.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-eventstream`

Use this package to parse `text/event-stream` into Web Streams. It parses SSE
frames; it does not open HTTP connections, validate application protocol
semantics, or reconnect after a network failure.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream
```

`@ahoo-wang/fetcher` is a peer dependency. The runtime needs Web Streams,
`Response`, and `TextDecoderStream`; importing this package installs the
`Response` helpers and an async-iterator fallback for `ReadableStream`.

## Choose an entry point

| Need | API | Result |
| --- | --- | --- |
| Convert a `Response` yourself | `toServerSentEventStream(response)` | `ReadableStream<ServerSentEvent>`; throws for a missing body. |
| Parse JSON `data` | `toJsonServerSentEventStream<T>(stream, detector?)` | `ReadableStream<JsonServerSentEvent<T>>`. |
| Optional `Response` conversion | `response.eventStream()` / `jsonEventStream<T>()` | A stream; `null` for a non-SSE content type; `EventStreamConvertError` for SSE with no body. |
| Required `Response` conversion | `response.requiredEventStream()` / `requiredJsonEventStream<T>()` | A stream or `EventStreamConvertError`. |
| Fetcher result extraction | `EventStreamResultExtractor` / `JsonEventStreamResultExtractor` | Required raw / JSON stream from a `FetchExchange`. |
| Build a custom stage | `TextLineTransformStream`, `ServerSentEventTransformStream`, `JsonServerSentEventTransformStream<T>` | The individual `TransformStream` stages. |

Import `@ahoo-wang/fetcher-eventstream` before calling the `Response` prototype
helpers. `isEventStream` uses `Content-Type.includes('text/event-stream')`.

## Consume typed JSON events

```ts
import '@ahoo-wang/fetcher-eventstream';
import { Fetcher } from '@ahoo-wang/fetcher';

interface Progress {
  percent: number;
}

const controller = new AbortController();
const response = await new Fetcher().get('/jobs/42/events', {
  signal: controller.signal,
});

try {
  for await (const event of response.requiredJsonEventStream<Progress>()) {
    console.log(event.data.percent);
  }
} finally {
  controller.abort();
}
```

`JsonServerSentEvent<T>` keeps `event`, `id`, and `retry`, while replacing
`data: string` with `data: T`. A `TerminateDetector` sees the raw parsed frame
before `JSON.parse`; return `true` for a sentinel such as `[DONE]`.

## SSE frame and conversion pipeline

`ServerSentEvent` is `{ event, data, id?, retry? }`. The parser defaults an
unspecified event type to `message`, ignores comment lines, joins repeated
`data:` fields with `\n`, ignores `id` values containing NUL, and accepts
`retry` only when it contains ASCII digits. It emits a frame at a blank line or
when the input stream flushes only if at least one `data:` field was received;
event-, `id`-, or `retry`-only frames are dropped.

```text
Response.body (ReadableStream<Uint8Array>)
  -> TextDecoderStream('utf-8')
  -> TextLineTransformStream
  -> ServerSentEventTransformStream
  -> JsonServerSentEventTransformStream<T> (optional)
  -> ReadableStream<...> / for await...of
```

`toServerSentEventStream(response)` is exactly the first three conversions.
Use the raw stream when `data` is not JSON or frame metadata matters; append
the JSON transform only when every non-terminal `data` field is valid JSON.

## Response helpers and Fetcher extractors

| API | Return / failure boundary |
| --- | --- |
| `response.contentType` | `string | null` from the `Content-Type` header. |
| `response.isEventStream` | `true` only when that header includes `text/event-stream`. |
| `response.eventStream()` | Raw stream or `null`; it does not throw for a non-SSE content type. |
| `response.requiredEventStream()` | Raw stream; otherwise `EventStreamConvertError` retaining `response`. |
| `response.jsonEventStream<T>(detector?)` | JSON stream or `null`. |
| `response.requiredJsonEventStream<T>(detector?)` | JSON stream or `EventStreamConvertError`. |
| `EventStreamResultExtractor` | Calls `exchange.requiredResponse.requiredEventStream()`. |
| `JsonEventStreamResultExtractor` | Calls `exchange.requiredResponse.requiredJsonEventStream()`; its exported result type is `JsonServerSentEventStream<any>`. |

The optional helpers return `null` without consuming a non-SSE response. For
an SSE response with a `null` body, their underlying conversion throws
`EventStreamConvertError`. The required helpers also throw for a non-SSE
content type; inspect `error.response` when catching that error.

## Termination, cancellation, and errors

```ts
import {
  toJsonServerSentEventStream,
  toServerSentEventStream,
} from '@ahoo-wang/fetcher-eventstream';

const response = await fetch('/chat');
const events = toJsonServerSentEventStream<{ token: string }>(
  toServerSentEventStream(response),
  event => event.data === '[DONE]',
);

for await (const event of events) {
  console.log(event.data.token);
}
```

`TerminateDetector` terminates the JSON transform without enqueueing the
sentinel. `break` from the async loop cancels the stream reader (the package
fallback does so explicitly). If the request was created with an
`AbortController`, also call `abort()` to stop the network request.

An invalid JSON payload throws while the JSON stream is consumed. Each
`SafeTransformer` forwards transformation errors to its controller and then
drops later chunks; already-closed controller `TypeError`s are suppressed. Put
stream creation and the whole consuming loop inside the same error boundary.

## Diagnosis

| Symptom | Check |
| --- | --- |
| `requiredEventStream()` throws immediately | Confirm `Content-Type` includes `text/event-stream` and the `Response` has a body. |
| `response.eventStream` is missing | Import `@ahoo-wang/fetcher-eventstream` for its prototype side effect. |
| JSON processing fails after some events | Identify the malformed `data` payload; use the raw stream for mixed text/JSON protocols or a detector for sentinels. |
| A `[DONE]` frame becomes a parse error | Pass `event => event.data === '[DONE]'` as the `TerminateDetector`. |
| Leaving the UI does not stop the connection | Cancel/break the reader and abort the owner `AbortController`. |
| A final SSE event is absent | Ensure the server sends a blank line or closes the body so the parser flushes its buffered frame. |

## Source reference

- Public exports: [index.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/index.ts#L63)
- EventStreamConvertError: [eventStreamConverter.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L54)
- Response helper implementation: [responses.ts:154](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/responses.ts#L154)
- Fetcher extractors: [eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)
- SSE frame parser: [serverSentEventTransformStream.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L88)
- JSON transform: [jsonServerSentEventTransformStream.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L47)
- Async iterable cancellation: [readableStreamAsyncIterable.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreamAsyncIterable.ts#L125)
