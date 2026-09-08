---
title: 'Errors, timeouts, and cancellation'
description: 'Errors, timeouts, and cancellation — @ahoo-wang/fetcher 5.0.0'
---

# Errors, timeouts, and cancellation

Fetcher's default pipeline rejects HTTP statuses outside 200–299. Native fetch alone would resolve those responses, so inspect the exchange when handling a failed Fetcher request.

Choose `validateStatus` for a reusable HTTP acceptance policy, a request attribute only for an intentional one-call bypass, and an AbortSignal for caller-owned cancellation. None of these schedules retries. A JSON parse failure after a successful response needs a caller catch even when error interceptors are installed.

## Error types and status policy {#errors}

| API                                   | Contract                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `FetcherError(message?, cause?)`      | Message falls back to an Error cause's message, then a generic message; stores cause and copies an Error cause's stack.                |
| `ExchangeError(exchange, message?)`   | Stores the exchange, with cause taken from `exchange.error`; message falls back to its error, response statusText, then request URL.   |
| `HttpStatusValidationError(exchange)` | Created by status validation; includes status and URL. Normally available through the outer `ExchangeError.cause` / `.exchange.error`. |
| `FetchTimeoutError(request)`          | Stores the timed-out request and a message including timeout, method (GET fallback), and URL.                                          |
| `ValidateStatus`                      | `(status: number) => boolean`; constructor option or `new ValidateStatusInterceptor(predicate)`.                                       |
| `IGNORE_VALIDATE_STATUS`              | Attribute key `'__ignoreValidateStatus__'`; only literal `true` bypasses validation.                                                   |

Validation skips exchanges with no response. An outer pipeline failure is normally `ExchangeError`, but an error interceptor's own throw or later extractor failure can escape without that wrapper. Do not assume every failure has a response or every rejection is an Error object.

## Timeout precedence {#timeout}

`TimeoutCapable.timeout?: number` uses milliseconds. `resolveTimeout(requestTimeout?, optionsTimeout?)` returns the request value whenever it is not undefined, including zero; otherwise the client value. `timeoutFetch(request): Promise<Response>` behaves as follows:

| Inputs                                         | Behavior                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `request.signal` exists                        | Delegate directly to native fetch; the library timeout is bypassed.                                         |
| No signal and timeout is falsy (`0`/undefined) | No timer; use `abortController.signal` if supplied.                                                         |
| Truthy timeout                                 | Race native fetch with a timer; use caller controller or create one; timer aborts with `FetchTimeoutError`. |

There is no positive-number validation: supply a finite positive duration or zero intentionally. The timer stops when fetch resolves its Response, **not when response-body consumption finishes**. Streaming idle/total deadlines require caller-managed cancellation.

## Ownership and cleanup {#cancellation}

Timers are cleared on success and failure. Signals temporarily written by the timed branch are removed; an internal controller is cleared so reusing that request can create a fresh one. A supplied controller remains owned by the caller, including an already-aborted one. It cannot be reset for a retry. Pass a fresh controller for a new operation.

For external cancellation, pass `signal` or `abortController`; the native abort reason is preserved by the failing exchange. A caller signal deliberately takes precedence over Fetcher's timeout. To combine both, let the caller manage the signal deadline or supply an abortController with timeout.

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
| <a id="fetchererror"></a>`FetcherError`                                           | [fetcherError.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L37)                             |
| <a id="exchangeerror"></a>`ExchangeError`                                         | [fetcherError.ts:86](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L86)                             |
| <a id="fetchtimeouterror"></a>`FetchTimeoutError`                                 | [timeout.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L33)                                       |
| <a id="timeoutcapable"></a>`TimeoutCapable`                                       | [timeout.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L60)                                       |
| <a id="resolvetimeout"></a>`resolveTimeout`                                       | [timeout.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L81)                                       |
| <a id="timeoutfetch"></a>`timeoutFetch`                                           | [timeout.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L120)                                     |
| <a id="httpstatusvalidationerror"></a>`HttpStatusValidationError`                 | [validateStatusInterceptor.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L27)   |
| <a id="validatestatus"></a>`ValidateStatus`                                       | [validateStatusInterceptor.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L62)   |
| <a id="validate_status_interceptor_name"></a>`VALIDATE_STATUS_INTERCEPTOR_NAME`   | [validateStatusInterceptor.ts:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L70)   |
| <a id="validate_status_interceptor_order"></a>`VALIDATE_STATUS_INTERCEPTOR_ORDER` | [validateStatusInterceptor.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L77)   |
| <a id="ignore_validate_status"></a>`IGNORE_VALIDATE_STATUS`                       | [validateStatusInterceptor.ts:97](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L97)   |
| <a id="validatestatusinterceptor"></a>`ValidateStatusInterceptor`                 | [validateStatusInterceptor.ts:126](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L126) |

[Package index](./index.md)
