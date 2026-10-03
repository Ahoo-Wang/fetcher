---
title: 'Fetcher hooks'
description: 'Fetcher hooks — @ahoo-wang/fetcher-react 6.0.0'
---

# Fetcher hooks

`useFetcher` exposes the Fetcher exchange pipeline as React state. It does not run on mount. `useFetcherQuery` adds a controlled query and POST execution; it is useful for JSON query endpoints rather than URL query-string construction.

## Inputs and returned values

| API                               | Inputs and defaults                                                                                                        | Result                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `useFetcher<R,E>(options?)`       | `RequestOptions`, executor callbacks, and `fetcher` instance/name; defaults to `fetcherRegistrar.default`                  | `loading`, `status`, `result`, `error`, `exchange`, `execute(request)`, `abort`, `reset` |
| `execute(request)`                | Complete `FetchRequest`; the hook sends a copy with its own `abortController` and leaves your object unchanged             | `Promise<PromiseState<R,E>>` after extraction; never rejects                             |
| `exchange`                        | Derived from state: the exchange behind `result`, or behind `error` when it is an `ExchangeError`                          | `FetchExchange \| undefined`; undefined while idle or after a non-exchange failure       |
| `useFetcherQuery<Q,R,E>(options)` | Required `url`, controlled `query`, `autoExecute` (default true); extractor defaults to `JsonResultExtractor`, caller wins | Executor state plus `exchange`; `execute()` sends the current query as POST body         |

Fetcher registration is resolved when a request is sent, so a missing named registration becomes error state. `useFetcher` does not default to JSON independently of the selected Fetcher/options: select the extractor explicitly when you need typed JSON. HTTP status, timeout and extraction failures follow the selected Fetcher's interceptor pipeline.

`exchange` is not stored separately: it follows `result` and `error`. After an HTTP 404, `error` is an `ExchangeError` and `exchange.response?.status` is `404`; after `abort()` or `reset()` both are cleared. `useFetcherQuery` follows the [controlled-query contract](./promise-and-query-state#controlled-queries): keep the query in your state, `undefined` means not ready, and a deep-equal query does not resend. Changing `url` or other options updates what the next execution reads; it does not by itself send a new request. Unmount and overlapping request behavior follows [Promise state](./promise-and-query-state).

## HTTP cancellation and timeout {#http-cancellation}

The hook owns cancellation: it sends `{ ...request, abortController }`, so an `abortController` on your request is replaced, while a `request.signal` still applies. Cancel through `abort()`/`reset()`, a newer `execute`, unmounting, or your own `signal`. With the normal Fetcher transport, the hook's controller, an explicit request `signal`, and the library timeout apply together: whichever fires first aborts the request. Regardless of physical cancellation, a cancelled execution never replaces the hook's current state.

Select an extractor before choosing the result generic: `JsonResultExtractor` parses JSON, while ordinary Fetcher defaults can return an exchange or Response. `R` is the extracted value type, `E` is the error-state type; neither validates runtime payloads. [Request lifecycle](../../architecture/request-lifecycle) explains why a JSON parse failure can occur after exchange interception has finished.

::: info Changed in 6.0
`execute(request)` resolves to the final state instead of `void` and no longer writes `request.abortController`. On failure `exchange` is the failed request's exchange (from `ExchangeError`) instead of `undefined`, and `useFetcherQuery` now returns `exchange`. `initialQuery`, `setQuery` and `getQuery` were removed from `useFetcherQuery`; pass `query` from your own state.
:::

## Complete example

```tsx
import { ExchangeError, JsonResultExtractor } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';

export function Profile() {
  const request = useFetcher<{ name: string }>({
    resultExtractor: JsonResultExtractor,
  });
  const notFound = request.exchange?.response?.status === 404;
  return (
    <section>
      <button
        disabled={request.loading}
        onClick={async () => {
          const { status, error } = await request.execute({
            url: '/api/profile',
            method: 'GET',
          });
          if (status === 'error' && !(error instanceof ExchangeError)) {
            console.error(error);
          }
        }}
      >
        Load
      </button>
      {notFound && <p role="alert">No profile yet</p>}
      {request.error && !notFound && (
        <p role="alert">{request.error.message}</p>
      )}
      <p>{request.result?.name}</p>
    </section>
  );
}
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### useFetcher {#api-useFetcher}

```ts
export function useFetcher<R, E = FetcherError>(
  options?: UseFetcherOptions<R, E>,
): UseFetcherReturn<R, E>;
```

[packages/react/src/fetcher/useFetcher.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L67)

### UseFetcherOptions {#api-UseFetcherOptions}

```ts
export interface UseFetcherOptions<R, E = FetcherError>
  extends RequestOptions, FetcherCapable, UseExecutePromiseOptions<R, E> {}
```

[packages/react/src/fetcher/useFetcher.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L34)

### UseFetcherReturn {#api-UseFetcherReturn}

```ts
export interface UseFetcherReturn<R, E = FetcherError> extends Omit<
  UseExecutePromiseReturn<R, E>,
  'execute'
> {
  exchange: FetchExchange | undefined;
  execute: (request: FetchRequest) => Promise<PromiseState<R, E>>;
}
```

[packages/react/src/fetcher/useFetcher.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L37)

### useFetcherQuery {#api-useFetcherQuery}

```ts
export function useFetcherQuery<Q, R, E = FetcherError>(
  options: UseFetcherQueryOptions<Q, R, E>,
): UseFetcherQueryReturn<R, E>;
```

[packages/react/src/fetcher/useFetcherQuery.ts:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L45)

### UseFetcherQueryOptions {#api-UseFetcherQueryOptions}

```ts
export interface UseFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherOptions<R, E>, QueryOptions<Q> {
  /** @default true */
  autoExecute?: boolean;
  url: string;
}
```

`autoExecute` is declared on an internal base interface; it is shown inline here.

[packages/react/src/fetcher/useFetcherQuery.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L26)

### UseFetcherQueryReturn {#api-UseFetcherQueryReturn}

```ts
export interface UseFetcherQueryReturn<R, E = FetcherError> extends Omit<
  UseFetcherReturn<R, E>,
  'execute'
> {
  execute: () => Promise<PromiseState<R, E>>;
}
```

[packages/react/src/fetcher/useFetcherQuery.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L32)

## Related topics

[Promise and query state](./promise-and-query-state) · [API hook factories](./api-hooks) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Latest and stable values](./utilities)
