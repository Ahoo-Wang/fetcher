---
title: Event stream reference
description: Parse Server-Sent Events, consume typed JSON streams, and handle invalid stream responses.
---

# `@ahoo-wang/fetcher-eventstream`

This package converts `text/event-stream` responses into Web Streams that can
be consumed with `for await`. Importing it also adds event-stream helpers to
the platform `Response` type and prototype.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream
```

## Consume JSON events

```ts
import '@ahoo-wang/fetcher-eventstream';
import { Fetcher } from '@ahoo-wang/fetcher';

interface Progress {
  percent: number;
}

const response = await new Fetcher().get('/jobs/42/events');
const events = response.requiredJsonEventStream<Progress>();

for await (const event of events) {
  renderProgress(event.data.percent);
}
```

The server must return `Content-Type: text/event-stream`. JSON helpers parse
each SSE `data` field and reject malformed JSON.

## `Response` helpers

| API                                              | Result                                                |
| ------------------------------------------------ | ----------------------------------------------------- |
| `response.contentType`                           | `Content-Type` header or `null`                       |
| `response.isEventStream`                         | Whether the content type contains `text/event-stream` |
| `response.eventStream()`                         | Parsed SSE stream or `null`                           |
| `response.requiredEventStream()`                 | Parsed SSE stream or throws                           |
| `response.jsonEventStream<T>(detector?)`         | Typed JSON SSE stream or `null`                       |
| `response.requiredJsonEventStream<T>(detector?)` | Typed JSON SSE stream or throws                       |

A `TerminateDetector` can stop a JSON stream when a protocol-specific terminal
event arrives, such as an OpenAI `[DONE]` marker.

## Conversion APIs

- `toServerSentEventStream(response)` converts a native `Response`.
- `toJsonServerSentEventStream(stream, detector?)` parses SSE data as JSON.
- `TextLineTransformStream`, `ServerSentEventTransformStream`, and
  `JsonServerSentEventTransformStream` expose the pipeline stages.
- `ReadableStreamAsyncIterable` adapts streams in runtimes without native async
  iteration support.

`EventStreamResultExtractor` and `JsonEventStreamResultExtractor` integrate the
same conversions directly with Fetcher result extraction.

## Errors

`EventStreamConvertError` retains the source `Response`. Required helpers throw
it when the response is not an event stream or has no readable body. Stream
parsing errors surface while the stream is being consumed, so keep the
`for await` loop inside your error boundary.

Continue with [Streaming](../learn/streaming.md) and
[OpenAI streaming](../recipes/openai-streaming.md).
