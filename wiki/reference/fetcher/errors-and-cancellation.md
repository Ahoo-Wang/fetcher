---
title: 'Errors, timeouts, and cancellation'
description: 'Errors, timeouts, and cancellation — @ahoo-wang/fetcher 5.0.0'
---

# Errors, timeouts, and cancellation

Fetcher's default pipeline rejects HTTP statuses outside 200–299. Native fetch alone would resolve those responses, so inspect the exchange when handling a failed Fetcher request.

Choose `validateStatus` for a reusable HTTP acceptance policy, a request attribute only for an intentional one-call bypass, and an AbortSignal for caller-owned cancellation. None of these schedules retries. A JSON parse failure after a successful response needs a caller catch even when error interceptors are installed.

## Error types and status policy {#errors}

| API                                             | Contract                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FetcherError(message?, cause?)`                | Message falls back to an Error cause's message, then a generic message; stores cause. Keeps its own stack (where the failure surfaced); the original failure and its stack stay on `cause`. Subclasses pass `instanceof` without `Object.setPrototypeOf`.   |
| `ExchangeError(exchange, message?)`             | Stores the exchange, with cause taken from `exchange.error`; message falls back to its error, response statusText, then request URL.                                                                                                                        |
| `HttpStatusValidationError(exchange, problem?)` | Created by status validation; includes status and URL. The exchange rejects with it as is (not wrapped), and `.exchange.error` is the same error. `problem` holds the response's [problem details](#problem-details) when it is `application/problem+json`. |
| `FetchTimeoutError(request)`                    | Stores the timed-out request and a message including timeout, method (GET fallback), and URL.                                                                                                                                                               |
| `ValidateStatus`                                | `(status: number) => boolean`; constructor option or `new ValidateStatusInterceptor(predicate, options?)`.                                                                                                                                                  |
| `ValidateStatusOptions`                         | `{ problemDetails?: boolean }`, `true` by default: whether a rejected problem response has its details read onto the error.                                                                                                                                 |     |
| `IGNORE_VALIDATE_STATUS`                        | Attribute key `'__ignoreValidateStatus__'`; only literal `true` bypasses validation.                                                                                                                                                                        |

Validation skips exchanges with no response. An outer pipeline failure is normally `ExchangeError`: a status failure is the `HttpStatusValidationError` itself, any other error (timeout, network, abort reason, a request/response/error interceptor's throw) is wrapped with the original as `cause`. Only a later extractor failure can escape without that wrapper. Do not assume every failure has a response or every rejection is an Error object.

## Problem details {#problem-details}

A rejected response labelled `application/problem+json` (RFC 9457, in any case, with any parameters) has its problem details read onto `HttpStatusValidationError.problem` as a `ProblemDetails`. They are read from a copy of the body, so `error.exchange.response` stays unread, and the error's message stays as above. No other response is read, and such a rejection still throws synchronously from `ValidateStatusInterceptor.intercept`. A problem body that is not a JSON object leaves `problem` undefined rather than replacing the status failure. Turn it off with `problemDetails: false` on the client (it configures the default manager, like `validateStatus`) or on a `ValidateStatusInterceptor`.

`ProblemDetails` has `type` (defaulting to `ABOUT_BLANK_PROBLEM_TYPE`, `'about:blank'`), optional `title`, `status`, `detail` and `instance`, and the extension members as sent. A standard member of the wrong type is left out, as the RFC says to ignore it. `status` is advisory: the response's own status is the one that counts. The same reading is available on its own: `isProblemDetailsResponse(response)` checks the media type, `readProblemDetails(response)` reads a copy (resolving `undefined` instead of rejecting), and `toProblemDetails(body)` checks an already parsed body.

```ts
import { Fetcher, HttpStatusValidationError } from '@ahoo-wang/fetcher';

const client = new Fetcher({ baseURL: 'https://api.example.com' });
try {
  await client.post('/orders', { body: { item: 'book', quantity: 1 } });
} catch (error) {
  if (error instanceof HttpStatusValidationError && error.problem) {
    console.error(error.problem.detail ?? error.problem.title);
  }
}
```

## Timeout precedence {#timeout}

`TimeoutCapable.timeout?: number` uses milliseconds. `resolveTimeout(requestTimeout?, optionsTimeout?)` returns the request value whenever it is not undefined, including zero; otherwise the client value. `timeoutFetch(request, fetchImplementation?): Promise<Response>` sends with `fetchImplementation`, a `FetchImplementation` (`(input: string, init?: RequestInit) => Promise<Response>`; the global `fetch`, read at call time, by default). It passes the URL as the first argument and a clean `RequestInit`: `url`, `timeout`, `urlParams`, and `abortController` are left out, and cancellation arrives as the merged `signal`. It behaves as follows:

| Inputs                                          | Behavior                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timeout not positive (`0`, negative, undefined) | No timer; native fetch is aborted by `request.signal` or `abortController.signal`, whichever fires first.                                                                                                                                                                                           |
| Positive timeout                                | Race native fetch with a timer combined with the caller's `signal` and `abortController`; whichever fires first aborts. The timer rejects with `FetchTimeoutError` (before it aborts the signal, so a fetch that rejects at once on abort cannot replace it), a caller abort with its abort reason. |

Supply a finite positive duration to enable the timer. The timer stops when fetch resolves its Response, **not when response-body consumption finishes**. Streaming idle/total deadlines require caller-managed cancellation. The caller's `signal` and `abortController` still cancel the body after the headers, with or without `AbortSignal.any`; without it, they keep a small listener for each sent request until one of them aborts.

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
| <a id="fetchimplementation"></a>`FetchImplementation`                             | [timeout.ts:138](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L138)                                     |
| <a id="timeoutfetch"></a>`timeoutFetch`                                           | [timeout.ts:192](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L192)                                     |
| <a id="httpstatusvalidationerror"></a>`HttpStatusValidationError`                 | [validateStatusInterceptor.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L35)   |
| <a id="validatestatus"></a>`ValidateStatus`                                       | [validateStatusInterceptor.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L87)   |
| <a id="validate_status_interceptor_name"></a>`VALIDATE_STATUS_INTERCEPTOR_NAME`   | [validateStatusInterceptor.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L95)   |
| <a id="validate_status_interceptor_order"></a>`VALIDATE_STATUS_INTERCEPTOR_ORDER` | [validateStatusInterceptor.ts:102](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L102) |
| <a id="ignore_validate_status"></a>`IGNORE_VALIDATE_STATUS`                       | [validateStatusInterceptor.ts:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L122) |
| <a id="validatestatusinterceptor"></a>`ValidateStatusInterceptor`                 | [validateStatusInterceptor.ts:151](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L151) |
| <a id="validatestatusoptions"></a>`ValidateStatusOptions`                         | [validateStatusInterceptor.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L53)   |
| <a id="problemdetails"></a>`ProblemDetails`                                       | [problemDetails.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L37)                         |
| <a id="about_blank_problem_type"></a>`ABOUT_BLANK_PROBLEM_TYPE`                   | [problemDetails.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L59)                         |
| <a id="isproblemdetailsresponse"></a>`isProblemDetailsResponse`                   | [problemDetails.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L67)                         |
| <a id="readproblemdetails"></a>`readProblemDetails`                               | [problemDetails.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L88)                         |
| <a id="toproblemdetails"></a>`toProblemDetails`                                   | [problemDetails.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L106)                       |

[Package index](./index.md)
