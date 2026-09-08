---
title: Read and close an event stream
description: Read and close an event stream — Fetcher
---

# Read and close an event stream

An SSE response remains open while events arrive. Treat HTTP acquisition, frame parsing, JSON conversion, and consumer cleanup as separate responsibilities.

## Prerequisites and endpoint

Install `@ahoo-wang/fetcher-eventstream@^5.0.0` and its `@ahoo-wang/fetcher@^5.0.0` peer in an existing browser TypeScript application. Its bundler must load `src/main.ts` from HTML; the runtime needs Fetch, Response bodies, and ReadableStream. The complete consumer function and browser entry follow. Importing the module does not start a long-lived stream: the entry explicitly calls the function and continues executing.

Your application must provide `GET /events` with HTTP 200 and `Content-Type: text/event-stream`, followed by these complete frames (including the empty lines):

```text
data: {"value":"Hello"}

data: [DONE]

```

The server should flush events as they become available. This route is not part of the local HTTP tutorial fixture. In Node, pass an absolute service URL to the function and compile with the ESM setup from [installation](../../start/installation.md); the DOM entry below is browser-only.

## Export the consumer function

Save this as `src/events.ts`. The caller supplies its signal and receives text through a callback; HTTP, JSON, and stream-read failures reject the returned promise.

```ts
import '@ahoo-wang/fetcher-eventstream';
import { toJsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

interface Token {
  value: string;
}

export async function consumeEvents(
  url: string,
  signal: AbortSignal,
  onToken: (value: string) => void,
): Promise<void> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const raw = response.eventStream();
  if (!raw) throw new Error('Missing response body');
  const events = toJsonServerSentEventStream<Token>(
    raw,
    event => event.data === '[DONE]',
  );
  for await (const event of events) onToken(event.data.value);
}
```

The import registers Response helpers. The terminator is checked before JSON parsing, so `[DONE]` is not sent to `onToken`. Completion and read failures release the iterator reader lock; exiting early because the callback throws also cancels the reader. The static `Token` type does not validate event payloads.

## Start, stop, and catch failures in the browser entry

Put these elements in your application's `index.html` body and use this as the example's module entry. Replace an existing entry script rather than loading it twice:

```html
<button id="stop" type="button">Stop</button>
<output id="events" aria-live="polite"></output>
<script type="module" src="/src/main.ts"></script>
```

Save this as `src/main.ts`. The entry wires Stop and page departure before starting one consumption without blocking. The entry owns the controller; it is not private to the consumer module.

```ts
import { consumeEvents } from './events';

const stop = document.querySelector<HTMLButtonElement>('#stop');
const output = document.querySelector<HTMLOutputElement>('#events');
if (!stop || !output) throw new Error('Missing Stop button or events output');

const controller = new AbortController();
stop.addEventListener('click', () => controller.abort(), {
  signal: controller.signal,
});
window.addEventListener('pagehide', () => controller.abort(), {
  once: true,
  signal: controller.signal,
});

void consumeEvents('/events', controller.signal, value => {
  output.textContent += value;
})
  .catch(error => {
    output.textContent = controller.signal.aborted
      ? 'Cancelled'
      : `Error: ${error instanceof Error ? error.message : String(error)}`;
  })
  .finally(() => {
    controller.abort();
    stop.disabled = true;
  });
```

Start the existing application's development server and open the page. The finite input above displays `Hello`, then disables Stop on normal completion. If the server keeps the stream open without sending another event, the entry can still continue executing and Stop should display `Cancelled`. Reloading the page creates a new controller and starts another attempt.

## Results, errors, and cleanup

The entry's catch handles both initial HTTP acquisition and later JSON/stream-read failures. For example, malformed JSON in a data frame should display Error. After success, failure, or cancellation, finally aborts this attempt's controller, removes the button/pagehide listeners registered with its signal, and disables the completed Stop button. Leaving the page also aborts. Do not await an entire long-lived stream at module scope: a static importer would wait for that module to finish evaluating.

If a stream stalls, check that the server sends a blank line after every event. Do not call eventStream again on a consumed body. An in-memory Response containing Hello/DONE checks parsing but does not prove network cancellation; a cancellation check must have the controlled transport observe the supplied signal and end a pending read. There is no automatic reconnection, deduplication, or general retry.

See [SSE pipeline](../../reference/eventstream/sse-pipeline.md), [JSON results](../../reference/eventstream/json-and-results.md), [cancellation](../../reference/eventstream/consumption-and-cancellation.md), and [integration boundaries](../../architecture/integration-decisions.md).
