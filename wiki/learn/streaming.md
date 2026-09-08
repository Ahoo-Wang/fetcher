---
title: Read and close an event stream
description: Read and close an event stream — Fetcher
---

# Read and close an event stream

An SSE response remains open while events arrive. Treat HTTP acquisition, frame parsing, JSON conversion, and consumer cleanup as separate responsibilities.

## Consume one response once

```ts
import '@ahoo-wang/fetcher-eventstream';
import { toJsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';
interface Token {
  value: string;
}
const controller = new AbortController();
try {
  const response = await fetch('/events', { signal: controller.signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const raw = response.eventStream();
  if (!raw) throw new Error('Missing response body');
  const events = toJsonServerSentEventStream<Token>(
    raw,
    event => event.data === '[DONE]',
  );
  for await (const event of events) console.log(event.data.value);
} finally {
  controller.abort();
}
```

The import registers Response helpers. The example expects your server to emit SSE data containing JSON `{ "value": "..." }`, with `[DONE]` as a final raw-data marker. It is an integration template, not a standalone public endpoint.

## Understand the boundaries

| Stage          | Responsibility                                          |
| -------------- | ------------------------------------------------------- |
| HTTP           | Validate status and own AbortController                 |
| SSE parser     | Decode lines, join data fields and emit complete events |
| JSON transform | Test the raw terminator before parsing data             |
| Consumer       | Process typed events and release resources on exit      |

A terminating event is not parsed as JSON. Invalid JSON produces a conversion failure; handle it around stream consumption, not only around the initial fetch. Static Token types do not validate event payloads.

A stalled response may contain incomplete frames: verify the server sends a blank line after each event. Do not call eventStream twice on the same consumed body. The finally block cancels the network owner even when processing throws.

See [SSE pipeline](../reference/eventstream/sse-pipeline.md), [JSON results](../reference/eventstream/json-and-results.md), and [Cancellation](../reference/eventstream/consumption-and-cancellation.md).
