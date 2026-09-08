---
prev: false
title: 'Eventstream reference'
description: 'Web Streams transforms for UTF-8 text, SSE frames, JSON data, and cancellable consumption.'
---

# Eventstream reference

Web Streams transforms for UTF-8 text, SSE frames, JSON data, and cancellable consumption.

## Installation and runtime

```sh
pnpm add @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher
```

The selected runtime needs `Response`, `ReadableStream`, `TransformStream` and `TextDecoderStream` before importing this package. Root import installs the documented Response helpers; it does not supply these Web APIs.

Version 5.0.0 declares Node >=18.20.8 for consumers. Repository development has a separate Node >=20.20.2 / pnpm 10.34.5 requirement. Browser/runtime APIs used by a feature must also exist; the engine range is not a promise that every Web API (for example Response.bytes) is available.

## Choose an entry point

Use Response `requiredEventStream()` for an SSE-only endpoint, `eventStream()` when non-SSE is an expected alternative, and `toServerSentEventStream(response)` only when the caller already chose the protocol. Add JSON conversion with an explicit terminal detector for protocols such as `[DONE]`. Reading and early cancellation remain owned by the consumer.

## Choose a topic

| Topic                                                                             | Use it for                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [The SSE parsing pipeline](sse-pipeline.md)                                       | Convert a streamed HTTP response into `ReadableStream<ServerSentEvent>`. This package parses an existing fetch response; it is not EventSource and does not reconnect or resend Last-Event-ID automatically.                                                                                                  |
| [JSON events, Response helpers, and extractors](json-and-results.md)              | Importing the root package installs Response helpers when Response exists, and installs a ReadableStream async-iterator fallback only if needed. Existing own properties/methods are not overwritten. Loading the package in a runtime without those globals does not install a later polyfill automatically. |
| [Consumption, cancellation, and safe transforms](consumption-and-cancellation.md) | A ReadableStream has one active reader. Decide which layer owns reading and cancellation before handing a stream to a UI or another transform.                                                                                                                                                                |

## Minimal complete example

```ts
import { toServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

const encoder = new TextEncoder();
const response = new Response(
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of [
        'id: 1\r',
        '\ndata: hel',
        'lo\r\n\r\n',
        'data: tail',
      ]) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  }),
);
const events = [];
for await (const event of toServerSentEventStream(response)) events.push(event);
console.assert(events.length === 2 && events[0].data === 'hello');
console.assert(events[1].data === 'tail' && events[1].id === '1');
```

[Complete public symbol index](./symbols.md)
