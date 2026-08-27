---
title: Interceptors, Errors, and Timeouts
description: Extend the Fetcher pipeline and diagnose status, network, cancellation, and timeout failures.
---

# Interceptors, Errors, and Timeouts

## Add an interceptor at the right phase

```ts
import {
  FETCH_INTERCEPTOR_ORDER,
  type RequestInterceptor,
} from '@ahoo-wang/fetcher';

const requestIdInterceptor: RequestInterceptor = {
  name: 'RequestIdInterceptor',
  order: FETCH_INTERCEPTOR_ORDER - 100,
  intercept(exchange) {
    exchange.request.headers = {
      ...exchange.request.headers,
      'X-Request-Id': crypto.randomUUID(),
    };
  },
};

api.interceptors.request.use(requestIdInterceptor);
```

Use request interceptors for request mutation, response interceptors for response policy, and error interceptors for recovery. Do not read a response body in multiple interceptors unless each reader uses a clone.

Remove a registered interceptor by name with `eject(name)`. A duplicate name is rejected instead of replacing the existing interceptor.

## Status errors

The default validator accepts only 2xx responses. Customize it per client:

```ts
const api = new Fetcher({
  validateStatus: status => status >= 200 && status < 400,
});
```

Rejected responses become `HttpStatusValidationError`, then pass through error interceptors. The final unhandled error is an `ExchangeError` whose `exchange.response` still contains the status and headers.

## Network and interceptor errors

An exception thrown by native Fetch or any interceptor becomes `exchange.error`. If no error interceptor clears it, Fetcher throws `ExchangeError`. Check `error.cause` and `error.exchange.request.url` before treating it as an HTTP status failure.

## Timeout and cancellation

Request timeout overrides client timeout. `0` or an omitted timeout disables the timer.

```ts
import { FetchTimeoutError } from '@ahoo-wang/fetcher';

try {
  await api.get('/reports', { timeout: 1_000 });
} catch (error) {
  if (
    error instanceof ExchangeError &&
    error.cause instanceof FetchTimeoutError
  ) {
    console.error(error.cause.timeout, error.cause.request.url);
  }
}
```

Provide an `AbortController` when the caller also needs cancellation:

```ts
const abortController = new AbortController();
const request = api.get('/reports', { abortController });
abortController.abort();
await request;
```

Timeout uses the same controller and throws `FetchTimeoutError`. A manually aborted request retains the platform's abort error as the exchange cause.

## Minimal diagnosis order

1. Read `ExchangeError.message` and `cause`.
2. Inspect the resolved request URL, method, headers, and timeout.
3. If a response exists, inspect status and content type before reading the body.
4. Check custom interceptor order and whether an error interceptor cleared the original error.
5. Reproduce against a mocked network boundary before changing retry behavior.
