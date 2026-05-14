---
name: fetcher-llm-streaming
description: >
  Implement LLM streaming with Server-Sent Events (SSE) using @ahoo-wang/fetcher-eventstream. Covers Response.prototype extensions (eventStream, jsonEventStream, isEventStream, contentType), SSE stream processing pipeline, JsonServerSentEventStream with TerminateDetector, EventStreamResultExtractor and JsonEventStreamResultExtractor, EventStreamConvertError, and async iterable streaming. Side-effect import patches Response.prototype.
  Use for: SSE, streaming, LLM, eventStream, jsonEventStream, Server-Sent Events, OpenAI streaming, real-time tokens, event stream, ReadableStream, TerminateDetector.
---

# fetcher-llm-streaming

Implement streaming features for LLM APIs using Fetcher's eventstream package.

## Trigger Conditions

This skill activates when the user:

- Wants SSE/streaming support
- Mentions LLM, OpenAI, streaming, eventStream, or jsonEventStream
- Asks about real-time data or token streaming

## Side-Effect Import Pattern

The eventstream package uses a side-effect import to extend `Response.prototype`. All patches are idempotent -- guarded by `hasOwnProperty` checks so repeated imports are safe.

```typescript
import '@ahoo-wang/fetcher-eventstream';
```

This also polyfills `ReadableStream.prototype[Symbol.asyncIterator]` when not natively supported, enabling `for await...of` on any ReadableStream.

## Response Prototype Extensions

After the side-effect import, Response objects gain these members:

| Member                               | Kind     | Returns                                        | Description                                     |
| ------------------------------------ | -------- | ---------------------------------------------- | ----------------------------------------------- |
| `contentType`                        | getter   | `string \| null`                               | Content-Type header value                       |
| `isEventStream`                      | getter   | `boolean`                                      | True if Content-Type is `text/event-stream`     |
| `eventStream()`                      | method   | `ServerSentEventStream \| null`                | Converts to SSE stream (null if wrong type)     |
| `requiredEventStream()`              | method   | `ServerSentEventStream`                        | Same, throws `EventStreamConvertError` on fail  |
| `jsonEventStream<DATA>(terminate?)`  | method   | `JsonServerSentEventStream<DATA> \| null`      | Typed JSON stream with optional termination     |
| `requiredJsonEventStream<DATA>(t?)`  | method   | `JsonServerSentEventStream<DATA>`              | Same, throws `EventStreamConvertError` on fail  |

## EventStreamConvertError

Thrown by `requiredEventStream()` and `requiredJsonEventStream()` when the response is not a valid event stream. Extends `FetcherError` and carries the original `Response` object.

```typescript
import { EventStreamConvertError } from '@ahoo-wang/fetcher-eventstream';

try {
  response.requiredEventStream();
} catch (error) {
  if (error instanceof EventStreamConvertError) {
    console.error('Status:', error.response.status);
  }
}
```

## SSE Stream Processing Pipeline

The internal pipeline transforms raw bytes into typed events:

```
Response.body (Uint8Array)
  -> TextDecoderStream          (bytes -> UTF-8 string)
  -> TextLineTransformStream    (string -> individual lines)
  -> ServerSentEventTransformStream  (lines -> ServerSentEvent)
  -> JsonServerSentEventTransformStream (ServerSentEvent -> JsonServerSentEvent<DATA>)
```

## ServerSentEvent Structure

```typescript
interface ServerSentEvent {
  data: string;    // Event data (required)
  event: string;   // Event type (default: 'message')
  id?: string;     // Event ID for tracking
  retry?: number;  // Reconnection timeout in ms
}
```

`JsonServerSentEvent<DATA>` has the same shape but with `data: DATA` (parsed JSON).

## Standalone Functions (No Prototype Needed)

```typescript
import {
  toServerSentEventStream,
  toJsonServerSentEventStream,
} from '@ahoo-wang/fetcher-eventstream';

// Direct conversion without Response.prototype methods
const sseStream = toServerSentEventStream(response);
const jsonStream = toJsonServerSentEventStream<ChatResponse>(sseStream, terminateOnDone);
```

## Termination Detection

```typescript
import { type TerminateDetector } from '@ahoo-wang/fetcher-eventstream';

// OpenAI-style: data is '[DONE]' literal
const terminateOnDone: TerminateDetector = event => event.data === '[DONE]';

// Event-based: event type signals end
const terminateOnEvent: TerminateDetector = event => event.event === 'done';
```

## OpenAI Client Streaming

The OpenAI `ChatClient.completions()` returns `JsonServerSentEventStream<ChatResponse>` when `stream: true`. Each iteration yields a `JsonServerSentEvent<ChatResponse>` -- access parsed data via `event.data`, **not** directly on the iterator variable.

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});

// event is JsonServerSentEvent<ChatResponse> -- use event.data for the payload
for await (const event of stream) {
  const content = event.data.choices[0]?.delta?.content || '';
  if (content) {
    process.stdout.write(content);
  }
}
```

## Token-by-Token UI Updates

```typescript
let fullResponse = '';

for await (const event of stream) {
  const content = event.data.choices[0]?.delta?.content || '';
  fullResponse += content;
  updateUI(fullResponse);
}
```

## Result Extractors (for Decorator Pattern)

Use the standalone extractors exported from `@ahoo-wang/fetcher-eventstream`. They are **not** on `ResultExtractors` from `@ahoo-wang/fetcher`.

```typescript
import {
  EventStreamResultExtractor,
  JsonEventStreamResultExtractor,
} from '@ahoo-wang/fetcher-eventstream';

@api('/chat', {
  fetcher: 'llm',
  resultExtractor: JsonEventStreamResultExtractor,
})
export class LlmClient {
  @post('/completions')
  streamChat(@body() body: ChatRequest): Promise<JsonServerSentEventStream<ChatResponse>> {
    throw autoGeneratedError(body);
  }
}
```

- `EventStreamResultExtractor` -- calls `requiredEventStream()`, yields `ServerSentEventStream`
- `JsonEventStreamResultExtractor` -- calls `requiredJsonEventStream()`, yields `JsonServerSentEventStream<any>`

## ReadableStreamAsyncIterable

Internal wrapper enabling `for await...of` on ReadableStream. Polyfilled automatically on import when the runtime lacks native `ReadableStream.prototype[Symbol.asyncIterator]`.

## Installation

```bash
pnpm add @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openai
```

## Related Packages

- `@ahoo-wang/fetcher-eventstream` -- SSE stream processing, Response prototype extensions
- `@ahoo-wang/fetcher-openai` -- Type-safe OpenAI client with streaming support
- `@ahoo-wang/fetcher-decorator` -- Declarative API decorators (use extractors above)
