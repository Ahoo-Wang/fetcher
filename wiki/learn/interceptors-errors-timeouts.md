---
title: Handle errors, timeouts, and cancellation
description: Handle errors, timeouts, and cancellation — Fetcher
---

# Handle errors, timeouts, and cancellation

First determine whether failure belongs to transport, HTTP policy, or result extraction. A retry cannot fix every category.

## Keep the exchange context

```ts
import { ExchangeError, Fetcher, FetchTimeoutError } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'https://api.example.com' });
try {
  await api.get('/reports', { timeout: 1_000 });
} catch (error) {
  if (error instanceof ExchangeError) {
    if (error.cause instanceof FetchTimeoutError) {
      console.error('Timeout', error.cause.request.timeout);
    } else {
      console.error(error.exchange.response?.status, error.cause);
    }
  } else {
    throw error;
  }
}
```

The default status policy accepts 200–299. A rejected status becomes an exchange failure; native network failures can have no response. JSON parsing and custom result extraction run after the interceptor pipeline, so their failures are not necessarily ExchangeError.

## Give cancellation an owner

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'https://api.example.com' });
const abortController = new AbortController();
const request = api.get('/reports', { abortController, timeout: 5_000 });
abortController.abort();
await request.catch(error => console.error(error));
```

Use `abortController` when caller cancellation must compose with the Fetcher timeout. Supplying a native `signal` takes the direct fetch path and bypasses the library timeout. An omitted timeout or zero disables its timer. Request timeout overrides client timeout.

## Change policy deliberately

Client `validateStatus` configures the default interceptor manager. A custom manager owns its own response policy. Error interceptors can recover by clearing `exchange.error`; they do not automatically repeat response validation. Do not treat recovery as a built-in retry loop.

Read [Errors and cancellation](../reference/fetcher/errors-and-cancellation.md) for exact classes and [Interceptors](../reference/fetcher/interceptors.md) for registration and ordering.
