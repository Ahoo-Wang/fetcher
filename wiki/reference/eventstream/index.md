---
title: 'Eventstream reference'
description: 'Web Streams transforms for UTF-8 text, SSE frames, JSON data, and cancellable consumption.'
---

# Eventstream reference

Web Streams transforms for UTF-8 text, SSE frames, JSON data, and cancellable consumption.

## Installation and runtime

```sh
pnpm add @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher
```

Version 5.0.0 declares Node >=18.20.8 for consumers. Repository development has a separate Node >=20.20.2 / pnpm 10.34.5 requirement. Browser/runtime APIs used by a feature must also exist; the engine range is not a promise that every Web API (for example Response.bytes) is available.

## Choose a topic

| Topic                                                                               | Use it for                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md)                                       | Convert a streamed HTTP response into `ReadableStream<ServerSentEvent>`. This package parses an existing fetch response; it is not EventSource and does not reconnect or resend Last-Event-ID automatically.                                                                                                  |
| [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md)              | Importing the root package installs Response helpers when Response exists, and installs a ReadableStream async-iterator fallback only if needed. Existing own properties/methods are not overwritten. Loading the package in a runtime without those globals does not install a later polyfill automatically. |
| [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md) | A ReadableStream has one active reader. Decide which layer owns reading and cancellation before handing a stream to a UI or another transform.                                                                                                                                                                |

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

## Public export index {#exports}

| Symbol                                   | Contract                                                                                                                   | Source                                                                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ServerSentEventStream`                  | [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md#serversenteventstream)                                                        | [eventStreamConverter.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L31)                               |
| `EventStreamConvertError`                | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#eventstreamconverterror)                             | [eventStreamConverter.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L54)                               |
| `toServerSentEventStream`                | [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md#toserversenteventstream)                                                      | [eventStreamConverter.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L127)                             |
| `EventStreamResultExtractor`             | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#eventstreamresultextractor)                          | [eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)                   |
| `JsonEventStreamResultExtractor`         | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#jsoneventstreamresultextractor)                      | [eventStreamResultExtractor.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L65)                   |
| `TerminateDetector`                      | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#terminatedetector)                                   | [jsonServerSentEventTransformStream.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L24)   |
| `JsonServerSentEvent`                    | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#jsonserversentevent)                                 | [jsonServerSentEventTransformStream.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L31)   |
| `JsonServerSentEventTransform`           | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#jsonserversenteventtransform)                        | [jsonServerSentEventTransformStream.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L47)   |
| `JsonServerSentEventTransformStream`     | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#jsonserversenteventtransformstream)                  | [jsonServerSentEventTransformStream.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L81)   |
| `JsonServerSentEventStream`              | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#jsonserversenteventstream)                           | [jsonServerSentEventTransformStream.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L95)   |
| `toJsonServerSentEventStream`            | [JSON events, Response helpers, and extractors](/reference/eventstream/json-and-results.md#tojsonserversenteventstream)                         | [jsonServerSentEventTransformStream.ts:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L107) |
| `ReadableStreamAsyncIterable`            | [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md#readablestreamasynciterable)            | [readableStreamAsyncIterable.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreamAsyncIterable.ts#L54)                 |
| `isReadableStreamAsyncIterableSupported` | [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md#isreadablestreamasynciterablesupported) | [readableStreams.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreams.ts#L37)                                         |
| `TransformerPhase`                       | [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md#transformerphase)                       | [safeTransformer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L19)                                         |
| `SafeTransformer`                        | [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md#safetransformer)                        | [safeTransformer.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L44)                                         |
| `ServerSentEvent`                        | [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md#serversentevent)                                                              | [serverSentEventTransformStream.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L21)           |
| `ServerSentEventFields`                  | [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md#serversenteventfields)                                                        | [serverSentEventTransformStream.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L35)           |
| `ServerSentEventTransformer`             | [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md#serversenteventtransformer)                                                   | [serverSentEventTransformStream.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L88)           |
| `ServerSentEventTransformStream`         | [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md#serversenteventtransformstream)                                               | [serverSentEventTransformStream.ts:178](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L178)         |
| `StreamController`                       | [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md#streamcontroller)                       | [streamController.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L24)                                       |
| `safeTerminate`                          | [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md#safeterminate)                          | [streamController.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L87)                                       |
| `safeEnqueue`                            | [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md#safeenqueue)                            | [streamController.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L105)                                     |
| `safeError`                              | [Consumption, cancellation, and safe transforms](/reference/eventstream/consumption-and-cancellation.md#safeerror)                              | [streamController.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L125)                                     |
| `TextLineTransformer`                    | [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md#textlinetransformer)                                                          | [textLineTransformStream.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/textLineTransformStream.ts#L23)                         |
| `TextLineTransformStream`                | [The SSE parsing pipeline](/reference/eventstream/sse-pipeline.md#textlinetransformstream)                                                      | [textLineTransformStream.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/textLineTransformStream.ts#L71)                         |

Response prototype members and the ReadableStream iterator augmentation are global additions rather than named exports; see [Response helpers](/reference/eventstream/json-and-results.md#response) and [iteration](/reference/eventstream/consumption-and-cancellation.md#iteration).
