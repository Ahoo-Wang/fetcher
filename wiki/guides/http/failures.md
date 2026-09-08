---
title: Handle HTTP, transport, and parsing failures
description: Preserve exchange context and handle extraction failures at the application boundary.
---

# Handle HTTP, transport, and parsing failures

## Prerequisites

Start the local server in [the HTTP example](../../examples/http.md). Its `/missing` route returns HTTP 404. Use that deterministic failure before diagnosing an external service.

## Keep the cause and response

```ts
import {
  ExchangeError,
  Fetcher,
  HttpStatusValidationError,
} from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
try {
  await api.get('/missing');
} catch (error) {
  if (error instanceof ExchangeError) {
    if (error.cause instanceof HttpStatusValidationError) {
      console.error('HTTP', error.exchange.response?.status);
    } else {
      console.error('Transport or pipeline failure', error.cause);
    }
  } else {
    throw error;
  }
}
```

Save this in the first-request client's file and run the same compile/run commands. Expect `HTTP 404`. Default status validation accepts 200–299; native fetch resolving a response does not make every status successful in Fetcher.

## Diagnose the failed layer

| Observation                                 | Next action                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `ExchangeError` with an HTTP status cause   | Inspect status and the service contract; report 401/403/404 or server failure appropriately |
| `ExchangeError` without a response          | Check network access, DNS, TLS, CORS, or cancellation; inspect `cause`                      |
| `FetchTimeoutError` inside `cause`          | Check the request deadline and [timeout ownership](./cancellation.md)                       |
| Rejection while JSON/custom extraction runs | Check actual response content and extractor logic; it need not be an `ExchangeError`        |
| HTTP success with a business error payload  | Apply the application's business result rules                                               |

To reproduce a transport failure, stop the local server and repeat `/users/1`; expect a rejection without an HTTP response. For parsing, use a controlled server returning HTTP 200 with invalid JSON and select Json. The tutorial fixture does not provide that route. Catch around the extraction await; parsing is outside the error interceptor stage.

## Recover deliberately and clean up

Choose a user-visible error state and provide a manual retry for operations safe to repeat. Core Fetcher installs no general retry loop. An uncertain write may already have applied, so request IDs and idempotency must come from your service contract. An error interceptor can clear `exchange.error` to recover, but must provide a valid response: the response stage does not run again automatically. An error interceptor that itself throws can escape directly.

Do not log tokens or sensitive request bodies with the exchange. Cancel outstanding work when the page/task ends, and stop the local fixture after verification.

See [error classes](../../reference/fetcher/errors-and-cancellation.md), [interceptors](./interceptors.md), and [failure boundaries](../../architecture/failure-model.md).
