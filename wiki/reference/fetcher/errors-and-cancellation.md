---
title: 'Errors, timeouts, and cancellation'
description: 'Errors, timeouts, and cancellation — @ahoo-wang/fetcher 5.0.0'
---

# Errors, timeouts, and cancellation

Fetcher's default pipeline rejects HTTP statuses outside 200–299. Native fetch alone would resolve those responses, so inspect the exchange when handling a failed Fetcher request.

Choose `validateStatus` for a reusable HTTP acceptance policy, a request attribute only for an intentional one-call bypass, and an AbortSignal for caller-owned cancellation. None of these schedules retries. A JSON parse failure after a successful response needs a caller catch even when error interceptors are installed.

## Error types and status policy {#errors}

| API                                   | Contract                                                                                                                                                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FetcherError(message?, cause?)`      | Message falls back to an Error cause's message, then a generic message; stores cause. Keeps its own stack (where the failure surfaced); the original failure and its stack stay on `cause`. Subclasses pass `instanceof` without `Object.setPrototypeOf`. |
| `ExchangeError(exchange, message?)`   | Stores the exchange, with cause taken from `exchange.error`; message falls back to its error, response statusText, then request URL.                                                                                                                      |
| `HttpStatusValidationError(exchange)` | Created by status validation; includes status and URL. The exchange rejects with it as is (not wrapped), and `.exchange.error` is the same error.                                                                                                         |
| `FetchTimeoutError(request)`          | Stores the timed-out request and a message including timeout, method (GET fallback), and URL.                                                                                                                                                             |
| `ValidateStatus`                      | `(status: number) => boolean`; constructor option or `new ValidateStatusInterceptor(predicate)`.                                                                                                                                                          |
| `IGNORE_VALIDATE_STATUS`              | Attribute key `'__ignoreValidateStatus__'`; only literal `true` bypasses validation.                                                                                                                                                                      |

Validation skips exchanges with no response. An outer pipeline failure is normally `ExchangeError`: a status failure is the `HttpStatusValidationError` itself, any other error (timeout, network, abort reason, a request/response/error interceptor's throw) is wrapped with the original as `cause`. Only a later extractor failure can escape without that wrapper. Do not assume every failure has a response or every rejection is an Error object.

## Timeout precedence {#timeout}

`TimeoutCapable.timeout?: number` uses milliseconds. `resolveTimeout(requestTimeout?, optionsTimeout?)` returns the request value whenever it is not undefined, including zero; otherwise the client value. `timeoutFetch(request, fetchImplementation?): Promise<Response>` sends with `fetchImplementation`, a `FetchImplementation` (`(input: string, init?: RequestInit) => Promise<Response>`; the global `fetch`, read at call time, by default). It passes the URL as the first argument and a clean `RequestInit`: `url`, `timeout`, `urlParams`, and `abortController` are left out, and cancellation arrives as the merged `signal`. It behaves as follows:

| Inputs                                          | Behavior                                                                                                                                                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timeout not positive (`0`, negative, undefined) | No timer; native fetch is aborted by `request.signal` or `abortController.signal`, whichever fires first.                                                                                                 |
| Positive timeout                                | Race native fetch with a timer combined with the caller's `signal` and `abortController`; whichever fires first aborts. The timer rejects with `FetchTimeoutError`, a caller abort with its abort reason. |

Supply a finite positive duration to enable the timer. The timer stops when fetch resolves its Response, **not when response-body consumption finishes**. Streaming idle/total deadlines require caller-managed cancellation.

## Ownership and cleanup {#cancellation}

Timers are cleared on success and failure. `timeoutFetch` never writes to the request object and the timer never aborts a supplied controller, so the same request can be sent again. A supplied controller remains owned by the caller, including an already-aborted one. It cannot be reset for a retry. Pass a fresh controller for a new operation.

For external cancellation, pass `signal` or `abortController`; the abort reason is preserved by the failing exchange. Both apply together with Fetcher's timeout: whichever fires first aborts the request.

## Complete example {#example}

```ts
import { Fetcher, ExchangeError, FetchTimeoutError } from '@ahoo-wang/fetcher';

const client = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 3000,
});
const controller = new AbortController();
try {
  const response = await client.get('/users/1', {
    abortController: controller,
  });
  console.log(await response.json());
} catch (error) {
  if (error instanceof ExchangeError) {
    if (error.cause instanceof FetchTimeoutError) console.error('Timed out');
    else console.error(error.exchange.response?.status, error.cause);
  } else {
    console.error(error);
  }
}
```

## Public symbols and source {#symbols}

| Symbol                                                                            | Implementation                                                                                                                            |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="fetchererror"></a>`FetcherError`                                           | [fetcherError.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L40)                             |
| <a id="exchangeerror"></a>`ExchangeError`                                         | [fetcherError.ts:83](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L83)                             |
| <a id="fetchtimeouterror"></a>`FetchTimeoutError`                                 | [timeout.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L35)                                       |
| <a id="timeoutcapable"></a>`TimeoutCapable`                                       | [timeout.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L60)                                       |
| <a id="resolvetimeout"></a>`resolveTimeout`                                       | [timeout.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L81)                                       |
| <a id="fetchimplementation"></a>`FetchImplementation`                             | [timeout.ts:132](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L132)                                     |
| <a id="timeoutfetch"></a>`timeoutFetch`                                           | [timeout.ts:184](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L184)                                     |
| <a id="httpstatusvalidationerror"></a>`HttpStatusValidationError`                 | [validateStatusInterceptor.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L27)   |
| <a id="validatestatus"></a>`ValidateStatus`                                       | [validateStatusInterceptor.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L61)   |
| <a id="validate_status_interceptor_name"></a>`VALIDATE_STATUS_INTERCEPTOR_NAME`   | [validateStatusInterceptor.ts:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L69)   |
| <a id="validate_status_interceptor_order"></a>`VALIDATE_STATUS_INTERCEPTOR_ORDER` | [validateStatusInterceptor.ts:76](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L76)   |
| <a id="ignore_validate_status"></a>`IGNORE_VALIDATE_STATUS`                       | [validateStatusInterceptor.ts:96](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L96)   |
| <a id="validatestatusinterceptor"></a>`ValidateStatusInterceptor`                 | [validateStatusInterceptor.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L125) |

[Package index](./index.md)
