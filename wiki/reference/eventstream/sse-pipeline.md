---
title: 'The SSE parsing pipeline'
description: 'The SSE parsing pipeline — @ahoo-wang/fetcher-eventstream 5.0.0'
---

# The SSE parsing pipeline

Convert a streamed HTTP response into `ReadableStream<ServerSentEvent>`. This package parses an existing fetch response; it is not EventSource and does not reconnect or resend Last-Event-ID automatically.

## Conversion stages {#pipeline}

`toServerSentEventStream(response: Response): ServerSentEventStream` requires a non-null body, otherwise throws `EventStreamConvertError(response, 'Response body is null')`. It connects `response.body → TextDecoderStream('utf-8') → TextLineTransformStream → ServerSentEventTransformStream`. This direct converter does not validate status or content type. The body becomes locked by the pipeline and cannot be independently read at the same time.

| API                              | Input → output                               | Configuration                                         |
| -------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| `TextLineTransformer`            | string chunks → strings without line endings | No constructor arguments; retains partial-line state. |
| `TextLineTransformStream`        | TransformStream wrapper of the above         | No arguments.                                         |
| `ServerSentEventTransformer`     | Lines → `ServerSentEvent`                    | No arguments; retains event state.                    |
| `ServerSentEventTransformStream` | TransformStream wrapper of the above         | No arguments.                                         |
| `ServerSentEventStream`          | Alias for `ReadableStream<ServerSentEvent>`  | A one-consumer stream, not an event bus.              |

Text lines support LF, CR, and CRLF, including CR/LF split across chunks. An unterminated final nonempty line is flushed. Network chunk boundaries need not match lines or events, and UTF-8 decoding handles split bytes before line parsing.

## Event fields and boundaries {#fields}

`ServerSentEvent` has required `event: string` and `data: string`, optional `id?: string` and `retry?: number`. `ServerSentEventFields` exposes static constants `ID = 'id'`, `EVENT = 'event'`, `DATA = 'data'`, and `RETRY = 'retry'`.

Blank lines dispatch only when at least one data field has been seen. Multiple data lines join with `\n`. A comment line beginning `:` and unknown fields are ignored. Field/value split occurs at the first colon, removing at most one leading space from its value; a colonless line has an empty value. Event name defaults to `'message'` on each event. Output id defaults to `''`; id and retry persist between events until updated. IDs containing NUL are ignored, and retry accepts ASCII digits only.

On normal EOF the parser emits a pending data event even without a final blank line. An id-only/retry-only frame updates state but emits no event. Retry is metadata only: the parser does not schedule reconnection. See [JSON decoding](./json-and-results.md) for typed data and protocol-specific terminal markers.

## Complete example {#example}

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

## Public symbols and source {#symbols}

| Symbol                                                                      | Implementation                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="serversenteventstream"></a>`ServerSentEventStream`                   | [eventStreamConverter.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L31)                       |
| <a id="toserversenteventstream"></a>`toServerSentEventStream`               | [eventStreamConverter.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamConverter.ts#L127)                     |
| <a id="serversentevent"></a>`ServerSentEvent`                               | [serverSentEventTransformStream.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L21)   |
| <a id="serversenteventfields"></a>`ServerSentEventFields`                   | [serverSentEventTransformStream.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L35)   |
| <a id="serversenteventtransformer"></a>`ServerSentEventTransformer`         | [serverSentEventTransformStream.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L88)   |
| <a id="serversenteventtransformstream"></a>`ServerSentEventTransformStream` | [serverSentEventTransformStream.ts:178](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/serverSentEventTransformStream.ts#L178) |
| <a id="textlinetransformer"></a>`TextLineTransformer`                       | [textLineTransformStream.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/textLineTransformStream.ts#L23)                 |
| <a id="textlinetransformstream"></a>`TextLineTransformStream`               | [textLineTransformStream.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/textLineTransformStream.ts#L71)                 |

[Package index](./index.md)
