---
title: Failure model
description: Handle transport, HTTP, extraction, Hook, and stream failures at the boundary where they occur.
---

# Failure model

Handle failures where the operation completes. Receiving an HTTP response, decoding JSON, and consuming an event stream are separate operations; a successful earlier stage does not guarantee the next one.

| Failure                         | Where it appears                                                                                                    | Application decision                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Network rejection               | Request interceptor pipeline, normally wrapped in `ExchangeError`                                                   | Inspect the underlying cause and decide whether replay is safe                              |
| Non-2xx HTTP status             | Default status validation rejects with `HttpStatusValidationError` itself, an `ExchangeError` carrying the exchange | Handle the service's error response and status; HTTP 2xx still needs business-result checks |
| JSON or custom extraction       | After the exchange pipeline; rejects directly to `request()` caller                                                 | Catch around result consumption and validate the fields you use                             |
| Error interceptor itself throws | Directly out of error handling                                                                                      | Do not assume every rejection is `ExchangeError`                                            |
| SSE read/transform failure      | During asynchronous stream iteration                                                                                | Handle partial output and dispose the reader                                                |

Default status validation: [packages/fetcher/src/validateStatusInterceptor.ts:170](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L170). Wrapping, rethrow and recovery: [packages/fetcher/src/interceptorManager.ts:194](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptorManager.ts#L194). Extraction: [packages/fetcher/src/fetcher.ts:240](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L240) and [packages/fetcher/src/resultExtractor.ts:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L69). A status failure matches `instanceof HttpStatusValidationError` directly. A timeout or network failure is wrapped, so an outer `instanceof FetchTimeoutError` check misses it; inspect the `ExchangeError` cause as shown in the [failure guide](../guides/http/failures.md) and [error reference](../reference/fetcher/errors-and-cancellation.md).

## Timeout and cancellation are different controls

| Request options                                         | Transport behavior                                                             | Deadline owner                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `signal` or `abortController` supplied, timeout enabled | Library combines them with its timer; whichever fires first aborts the Fetch   | Library clears its timer after Fetch settles; the timer never aborts the caller's controller |
| Neither supplied, timeout enabled                       | Library aborts the Fetch with its own timer                                    | Library clears its timer; nothing is written to the request                                  |
| Timeout disabled                                        | Native Fetch, aborted by the supplied `signal` or `abortController` if present | Caller                                                                                       |

The combination is implemented in [packages/fetcher/src/timeout.ts:165](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L165). The timer ends when the Fetch race settles, not when subsequent `response.json()` or the whole SSE stream finishes. A timeout rejects with `FetchTimeoutError`; a caller abort rejects with the caller's abort reason. For a whole-operation deadline, own the signal and the full consumption lifecycle. Follow [cancellation guidance](../guides/http/cancellation.md).

Cancellation does not roll back a write already received by the server. Before retrying after a timeout or lost response, use the endpoint's idempotency and result-reconciliation contract.

## Hooks change how errors reach components

`useExecutePromise` normally stores errors in state. `propagateError` rethrows general errors when enabled; an error recognized as `AbortError` returns to idle. `execute()` returns `Promise<void>`; read business data from `result`. New executions and unmount abort controllers, but a generic Promise must cooperate with that controller. See [packages/react/src/core/useExecutePromise.ts:265](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L265) and [React request guide](../guides/react/requests.md).

## Streams and authentication have specific recovery contracts

SSE JSON transformation calls `JSON.parse`; unhandled transformer errors become stream errors. Read failures surface during iteration. Early return or `break` cancels the reader and releases its lock; normal completion also releases the lock. The initial exchange succeeding says nothing about the remaining stream. There is no automatic reconnect, deduplication, or exactly-once delivery guarantee. See [packages/eventstream/src/jsonServerSentEventTransformStream.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L80), [packages/eventstream/src/safeTransformer.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L58), [packages/eventstream/src/readableStreamAsyncIterable.ts:102](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreamAsyncIterable.ts#L102), and [SSE consumption reference](../reference/eventstream/consumption-and-cancellation.md).

The core default pipeline does not provide a general retry policy. CoSec's bounded 401 refresh path checks its own authorization header and token session, refreshes, then replays the original exchange. That is an authentication protocol, not arbitrary-error retry. Request-body replayability, write idempotency, and server outcomes remain application concerns. See [packages/cosec/src/authorizationResponseInterceptor.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L80), [CoSec guide](../guides/integrations/cosec.md), and [token refresh reference](../reference/cosec/tokens-and-refresh.md).
