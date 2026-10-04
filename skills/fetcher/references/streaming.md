# SSE, LLM token streams and OpenAI chat

`@ahoo-wang/fetcher-eventstream` turns a `Response` body into async-iterable
Server-Sent Events. `@ahoo-wang/fetcher-openai` is an OpenAI-compatible chat
client built on it. Neither reconnects: unlike `EventSource`, there is no
retry, no `Last-Event-ID`, no routing by event type.

## Reading a stream

| You have                                       | Use                                                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A `Response`, raw text events                  | `response.requiredEventStream()` → `ServerSentEvent { id, event, data: string, retry? }`       |
| A `Response`, one JSON object per event        | `response.requiredJsonEventStream<T>(detector?)` → `JsonServerSentEvent<T>` (`data: T`)        |
| A decorated endpoint                           | `resultExtractor: jsonEventStreamResultExtractor<T>(detector)` or `EventStreamResultExtractor` |
| A library that must not call prototype methods | `toJsonServerSentEventStream<T>(toServerSentEventStream(response), detector)`                  |
| An OpenAI-compatible `/chat/completions`       | `new OpenAI(…).chat.completions(request, signal?)`                                             |

The `required…` methods throw `EventStreamConvertError` when the response is
not `text/event-stream`; `eventStream()`/`jsonEventStream()` return `null`
instead. A body can be converted once: a second conversion, or one after an
interceptor read the body, throws `EventStreamConvertError`.

## Gotchas

- **Importing the package patches `Response.prototype`** (and polyfills
  `ReadableStream[Symbol.asyncIterator]`). There is no side-effect-free entry:
  calling the standalone converters does not avoid it, because the import
  itself patches. Only `import type` is erased. Importing
  `@ahoo-wang/fetcher-openai` patches too.
- **`[DONE]` needs a terminate detector.** Every event is passed to
  `JSON.parse`; a `data: [DONE]` with no detector errors the stream with a
  `SyntaxError`. There is no default detector.
- **The detector sees the raw event** (`data` is still a string): write
  `e => e.data === '[DONE]'` or `e => e.event === 'done'`. The terminating
  event is dropped, not yielded, and the stream then ends normally.
- **With a detector, ending early is an error**: a stream that closes before
  the terminating event rejects the `for await` with
  `EventStreamIncompleteError`. Do not present the partial text as complete.
  Without a detector a truncated stream ends silently.
- **Items are envelopes.** The payload is `event.data`; for OpenAI that is
  `event.data.choices[0]?.delta?.content`, not `event.choices`.
- **One malformed JSON event fails the whole stream.** For streams that mix
  pings or text error events with JSON, read `requiredEventStream()` and parse
  each event yourself. Server `event: error` messages are yielded like any
  other event; nothing throws for them.
- **Where errors surface**: a non-2xx rejects the awaited call with
  `HttpStatusValidationError` before any stream exists (status at
  `error.exchange.response?.status`); a network error or timeout rejects it with
  `ExchangeError` (`cause` is the original). A 200 with the wrong content type
  rejects with `EventStreamConvertError`, which is not an `ExchangeError` and
  never reaches error interceptors. Everything after the first byte (parse
  errors, `EventStreamIncompleteError`, aborts, dropped connections) rejects the
  `for await` loop instead, and no interceptor sees it.
- **`timeout` covers only the wait for response headers.** A stalled stream
  never times out; pass a `signal` (for example `AbortSignal.timeout(ms)`) for a
  total deadline.
- **Cancel** with `break` (it cancels the reader and closes the connection),
  `controller.abort()`, or `stream.cancel()`. Do not `releaseLock()` before
  `break`; that leaves the connection open.

## OpenAI client

- `new OpenAI({ baseURL, apiKey, ...fetcherOptions })`. There is no default
  base URL and no environment lookup, and **`baseURL` must include `/v1`** (the
  client posts to `chat/completions` under it). It accepts the other
  `FetcherOptions`: `timeout`, `headers`, `fetch`, `interceptors`. `apiKey`
  sets `Authorization` and wins over a header of that name.
- The method is `openai.chat.completions(request, signal?)`, not
  `chat.completions.create`. The signal is a second positional argument.
- **The return type depends on a literal `stream: true`** in the call: then it
  is a `JsonServerSentEventStream<ChatResponse>`, otherwise a `ChatResponse`. A
  request typed as `ChatRequest`, or with `stream: boolean`, returns the union;
  narrow it yourself.
- The stream ends at `data: [DONE]` (`DoneDetector`); a stream cut off before it
  rejects with `EventStreamIncompleteError`.
- `ChatRequest` has no index signature: extra provider fields fail on a
  variable annotated `ChatRequest` (inline literals still compile).
  `Message.content` is a `string`. `ChatResponse.usage` is optional (streamed
  chunks carry none; the final usage chunk has `choices: []`).
- Static headers go in `headers`. A per-request value (a trace ID) goes in a
  request interceptor on `openai.fetcher` (readonly: add interceptors to it,
  do not replace it).

## Examples

```ts
import '@ahoo-wang/fetcher-eventstream';
import { Fetcher } from '@ahoo-wang/fetcher';
import type { TerminateDetector } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const done: TerminateDetector = event => event.data === '[DONE]';

const response = await fetcher.post('/generate', { body: { prompt } });
let text = '';
for await (const event of response.requiredJsonEventStream<{ token: string }>(
  done,
))
  text += event.data.token;
```

```ts
import {
  api,
  autoGeneratedError,
  body,
  post,
} from '@ahoo-wang/fetcher-decorator';
import {
  jsonEventStreamResultExtractor,
  type JsonServerSentEventStream,
} from '@ahoo-wang/fetcher-eventstream';

@api('/ai', { fetcher: 'api' })
class GenerateApi {
  @post('/generate', {
    resultExtractor: jsonEventStreamResultExtractor<{ token: string }>(
      event => event.data === '[DONE]',
    ),
  })
  generate(
    @body() request: { prompt: string },
  ): Promise<JsonServerSentEventStream<{ token: string }>> {
    throw autoGeneratedError(request);
  }
}
```

```ts
import { ExchangeError, HttpStatusValidationError } from '@ahoo-wang/fetcher';
import { EventStreamIncompleteError } from '@ahoo-wang/fetcher-eventstream';
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});
const controller = new AbortController();

try {
  const stream = await openai.chat.completions(
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
    },
    controller.signal,
  );
  for await (const chunk of stream)
    process.stdout.write(chunk.data.choices[0]?.delta?.content ?? '');
} catch (error) {
  if (error instanceof HttpStatusValidationError)
    console.error('HTTP', error.exchange.response?.status);
  else if (error instanceof EventStreamIncompleteError)
    console.error('stream ended before [DONE]');
  else if (error instanceof ExchangeError)
    console.error('request failed', error.cause);
  else throw error;
}
```
