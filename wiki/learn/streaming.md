---
title: Streaming
description: Parse Server-Sent Events, convert JSON events, stop on a terminator, and cancel safely.
---

# Streaming

`@ahoo-wang/fetcher-eventstream` turns a response body into typed stream stages. Importing the package also installs the documented `Response` helpers.

## Parse SSE

```ts
import '@ahoo-wang/fetcher-eventstream';

const response = await fetch('/events');
const stream = response.eventStream();

for await (const event of stream) {
  console.log(event.event, event.id, event.data);
}
```

The parser joins consecutive `data:` lines with a newline, exposes `event`, `id`, and `retry`, ignores comment lines, and emits on the blank line that terminates an SSE event.

## Convert JSON data

```ts
import { toJsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

interface Token {
  value: string;
}

const jsonStream = toJsonServerSentEventStream<Token>(
  response.eventStream(),
  event => event.data === '[DONE]',
);

for await (const event of jsonStream) {
  console.log(event.data.value);
}
```

The terminate detector sees the raw `ServerSentEvent`. A terminating event closes the JSON stream and is not parsed as JSON.

## Handle malformed data

Invalid JSON is reported through `EventStreamConvertError`. Keep protocol errors visible instead of silently dropping chunks:

```ts
try {
  for await (const event of jsonStream) {
    consume(event.data);
  }
} catch (error) {
  console.error('Invalid event stream', error);
}
```

## Cancel

Abort the HTTP request when the consumer no longer needs data. Breaking an async loop stops consumption, but the request owner should still abort the network operation when continued download is unwanted.

```ts
const abortController = new AbortController();
const response = await fetch('/events', { signal: abortController.signal });

for await (const event of response.eventStream()) {
  if (event.data === '[DONE]') break;
}

abortController.abort();
```

## Debug a stalled stream

Check the `Content-Type`, confirm the server sends a blank line after each event, verify UTF-8 chunk boundaries are decoded by the provided transforms, and ensure the terminator matches the raw data exactly.
