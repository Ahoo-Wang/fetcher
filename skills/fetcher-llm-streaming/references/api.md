# Fetcher LLM Streaming API Reference

## Contents

- [Side-Effect Import Pattern](#side-effect-import-pattern)
- [Response Prototype Extensions](#response-prototype-extensions)
- [EventStreamConvertError](#eventstreamconverterror)
- [SSE Stream Processing Pipeline](#sse-stream-processing-pipeline)
- [ServerSentEvent Structure](#serversentevent-structure)
- [Standalone Functions (No Prototype Needed)](#standalone-functions-no-prototype-needed)
- [Termination Detection](#termination-detection)
- [OpenAI Client Streaming](#openai-client-streaming)
- [Result Extractors (for Decorator Pattern)](#result-extractors-for-decorator-pattern)
- [ReadableStreamAsyncIterable](#readablestreamasynciterable)
- [Other Exports](#other-exports)
- [Installation](#installation)
- [CommonJS](#commonjs)
- [Related Packages](#related-packages)

Implement streaming features for LLM APIs using Fetcher's eventstream package.

## Side-Effect Import Pattern

The eventstream package uses a side-effect import to extend `Response.prototype` (only when a global `Response` exists). All patches are idempotent -- guarded by `hasOwnProperty` checks, so repeated imports are safe and an existing member is never overwritten. The `declare global { interface Response { ... } }` augmentation that types these members comes from the same import.

```typescript
import '@ahoo-wang/fetcher-eventstream';
```

This also polyfills `ReadableStream.prototype[Symbol.asyncIterator]` when not natively supported, enabling `for await...of` on any ReadableStream.

## Response Prototype Extensions

After the side-effect import, Response objects gain these members:

| Member                              | Kind              | Returns                                   | Description                                    |
| ----------------------------------- | ----------------- | ----------------------------------------- | ---------------------------------------------- |
| `contentType`                       | readonly property | `string \| null`                          | Content-Type header value                      |
| `isEventStream`                     | readonly property | `boolean`                                 | True if media type is `text/event-stream`      |
| `eventStream()`                     | method            | `ServerSentEventStream \| null`           | Converts to SSE stream (null if not SSE)       |
| `requiredEventStream()`             | method            | `ServerSentEventStream`                   | Same, throws `EventStreamConvertError` on fail |
| `jsonEventStream<DATA>(terminate?)` | method            | `JsonServerSentEventStream<DATA> \| null` | Typed JSON stream with optional termination    |
| `requiredJsonEventStream<DATA>(t?)` | method            | `JsonServerSentEventStream<DATA>`         | Same, throws `EventStreamConvertError` on fail |

## EventStreamConvertError

Thrown by `requiredEventStream()` and `requiredJsonEventStream()` when the response is not an event stream, and by `toServerSentEventStream()` (so also by `eventStream()` / `jsonEventStream()` on an SSE response) when `response.body` is null. Extends `FetcherError` from `@ahoo-wang/fetcher`; the constructor is `(response: Response, errorMsg?: string, cause?)` and the original response is `error.response`.

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

Errors _during_ iteration are not `EventStreamConvertError`: a `data` payload that is not valid JSON (for example an undetected `[DONE]`) errors the JSON stream with the `SyntaxError` from `JSON.parse`, which `for await` rethrows. With a detector, a stream that ends without the terminating event (a lost connection or a server that stopped early) errors with `EventStreamIncompleteError` (also extends `FetcherError`, exported from this package), so a partial answer does not look complete; without a detector the stream ends normally.

SSE media types are matched case-insensitively after removing parameters, using the complete type (`text/event-stream`). Field names remain case-sensitive. CR, LF and CRLF delimit lines, including pairs split across chunks; only an empty line ends an event block. Lines starting with `:` are comments; multiple `data:` lines are joined with `\n`; a block without a `data` line dispatches nothing. Empty blocks reset the event type while retaining the last event ID; `retry` is reported only on the event whose block set it. A final block whose lines all arrived but whose trailing blank line did not is still emitted when the body ends (the WHATWG parser drops it); a final line cut off before its line terminator is dropped, not parsed.

## SSE Stream Processing Pipeline

`toServerSentEventStream(response)` and `toJsonServerSentEventStream(stream, detector?)` build this pipeline; every stage class is also exported:

```
Response.body (Uint8Array)
  -> TextDecoderStream('utf-8')                (bytes -> string)
  -> TextLineTransformStream(false)            (string -> lines; transformer TextLineTransformer; false drops an unterminated final line)
  -> ServerSentEventTransformStream            (lines -> ServerSentEvent; transformer ServerSentEventTransformer)
  -> JsonServerSentEventTransformStream(det?)  (ServerSentEvent -> JsonServerSentEvent<DATA>; transformer JsonServerSentEventTransform)
```

The transformers extend the exported abstract `SafeTransformer<I, O>`, which implements the platform `TransformStream<I, O>` transformer contract without needing the DOM-only `Transformer` global. Subclasses implement `onTransform(chunk, controller)`, optionally `onFlush(controller)` / `onError(error, phase)`, and use the protected `enqueue()` / `terminate()` helpers. A thrown error errors the stream and drops later chunks.

## ServerSentEvent Structure

```typescript
interface ServerSentEvent {
  id?: string; // emitted as '' when the server never sent an id
  event: string; // 'message' unless an `event:` field was sent
  data: string; // raw data; multiple data lines joined with '\n'
  retry?: number; // only on the event whose block had an all-digit `retry:` value
}
```

`JsonServerSentEvent<DATA>` is `Omit<ServerSentEvent, 'data'>` plus `data: DATA` (the `JSON.parse`d payload). `ServerSentEventStream` is `ReadableStream<ServerSentEvent>`; `JsonServerSentEventStream<DATA>` is `ReadableStream<JsonServerSentEvent<DATA>>`.

## Standalone Functions (No Prototype Needed)

```typescript
import {
  toServerSentEventStream,
  toJsonServerSentEventStream,
} from '@ahoo-wang/fetcher-eventstream';

// Does not check Content-Type; only throws if response.body is null
const sseStream = toServerSentEventStream(response);
const jsonStream = toJsonServerSentEventStream<ChatResponse>(
  sseStream,
  terminateOnDone,
);
```

Importing these named exports still runs the module's side effects (prototype patch and async-iterator polyfill).

## Termination Detection

`TerminateDetector` is `(event: ServerSentEvent) => boolean`. It runs on the raw event **before** `JSON.parse`; when it returns `true`, that event is dropped and the stream closes normally. If the input ends before any event matches, the stream errors with `EventStreamIncompleteError`. Without a detector, a non-JSON sentinel such as `data: [DONE]` errors the stream with a `SyntaxError`. This package exports no ready-made detector; `DoneDetector` (`event.data === '[DONE]'`) lives in `@ahoo-wang/fetcher-openai`.

```typescript
import { type TerminateDetector } from '@ahoo-wang/fetcher-eventstream';

// OpenAI-style: data is '[DONE]' literal
const terminateOnDone: TerminateDetector = event => event.data === '[DONE]';

// Event-based: event type signals end
const terminateOnEvent: TerminateDetector = event => event.event === 'done';
```

## OpenAI Client Streaming

For OpenAI Chat Completions use `@ahoo-wang/fetcher-openai` (skill `fetcher-openai-client`): `openai.chat.completions({ ..., stream: true })` resolves to a `JsonServerSentEventStream<ChatResponse>` already terminated by `DoneDetector`. Each item is a `JsonServerSentEvent<ChatResponse>`, so read `event.data.choices[0]?.delta?.content`, not `event.choices`.

## Result Extractors (for Decorator Pattern)

Use the standalone extractors exported from `@ahoo-wang/fetcher-eventstream`. They are **not** on `ResultExtractors` from `@ahoo-wang/fetcher`.

- `EventStreamResultExtractor` -- `exchange.requiredResponse.requiredEventStream()`, yields `ServerSentEventStream`
- `JsonEventStreamResultExtractor` -- `exchange.requiredResponse.requiredJsonEventStream()` with **no** terminate detector, yields `JsonServerSentEventStream<any>`

For a stream that ends with a non-JSON sentinel, write a one-line extractor that passes a detector. Set it on the endpoint (`@post(path, { resultExtractor })`) so other methods keep the decorator default `JsonResultExtractor`:

```typescript
import '@ahoo-wang/fetcher-eventstream';
import type { FetchExchange, ResultExtractor } from '@ahoo-wang/fetcher';
import {
  api,
  autoGeneratedError,
  body,
  post,
} from '@ahoo-wang/fetcher-decorator';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

const UntilDone: ResultExtractor<JsonServerSentEventStream<Chunk>> = (
  exchange: FetchExchange,
) =>
  exchange.requiredResponse.requiredJsonEventStream(e => e.data === '[DONE]');

@api('/chat', { fetcher: 'llm' })
export class LlmClient {
  @post('/completions', { resultExtractor: UntilDone })
  streamChat(
    @body() req: ChatRequest,
  ): Promise<JsonServerSentEventStream<Chunk>> {
    throw autoGeneratedError(req);
  }
}
```

## ReadableStreamAsyncIterable

Exported class (`new ReadableStreamAsyncIterable(stream)`) that locks the stream's reader and implements `next()` (done once released), `return()` (cancels the stream and releases, e.g. on `break`), `throw(error)` (cancels with `error` as the reason, releases, rethrows) and `releaseLock()`. Do not call `releaseLock()` before `break`: a released iterator can no longer cancel the connection. On import it is installed as `ReadableStream.prototype[Symbol.asyncIterator]` only when `isReadableStreamAsyncIterableSupported` is `false` and a global `ReadableStream` exists.

## Other Exports

- `ServerSentEventFields` -- static field-name constants `ID`, `RETRY`, `EVENT`, `DATA`
- `safeEnqueue(controller, chunk)`, `safeError(controller, reason)`, `safeTerminate(controller)` -- return `false` instead of throwing when the controller is already closed (only `TypeError` is swallowed); controller type `StreamController<T>`
- `TransformerPhase` -- `'transform' | 'flush'`, passed to `SafeTransformer.onError`

## Installation

```bash
pnpm add @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher
```

`@ahoo-wang/fetcher` is a peer dependency (`FetcherError`, `ResultExtractor`, Content-Type constants).

## CommonJS

`@ahoo-wang/fetcher-eventstream` supports ESM and CommonJS. `require()` uses
`dist/index.umd.cjs`, while ESM imports use `dist/index.es.js`. Requiring the
package also installs its Response prototype extensions. This `.cjs` example
uses runtime conversion functions and a local SSE response:

```javascript
const {
  toServerSentEventStream,
  toJsonServerSentEventStream,
} = require('@ahoo-wang/fetcher-eventstream');

async function main() {
  const response = new Response('data: {"text":"Hello"}\n\n', {
    headers: { 'Content-Type': 'text/event-stream' },
  });
  const events = toJsonServerSentEventStream(toServerSentEventStream(response));
  for await (const event of events) console.log(event.data.text); // Hello
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

Stream interfaces such as `ServerSentEvent` are TypeScript-only; they are not
values to destructure from `require()`.

## Related Packages

- `@ahoo-wang/fetcher-eventstream` -- SSE stream processing, Response prototype extensions
- `@ahoo-wang/fetcher-openai` -- Type-safe OpenAI client with streaming support (`DoneDetector`)
- `@ahoo-wang/fetcher-decorator` -- Declarative API decorators (use extractors above)
