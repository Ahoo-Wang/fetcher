---
title: 'Fetcher hooks'
description: 'Fetcher hooks — @ahoo-wang/fetcher-react 5.0.0'
---

# Fetcher hooks

`useFetcher` exposes the Fetcher exchange pipeline as React state. It does not run on mount. `useFetcherQuery` adds a query object and POST execution; it is useful for JSON query endpoints rather than URL query-string construction.

## Inputs and returned values

| API                               | Inputs and defaults                                                                                       | Result                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `useFetcher<R,E>(options?)`       | `RequestOptions`, executor callbacks, and `fetcher` instance/name; defaults to `fetcherRegistrar.default` | `loading`, `status`, `result`, `error`, optional `exchange`, `execute(request)`, `reset`, `abort` |
| `execute(request)`                | Complete `FetchRequest`; the hook assigns its own `abortController` onto this object                      | `Promise<void>` after extraction; result lives in state                                           |
| `useFetcherQuery<Q,R,E>(options)` | Required `url`, query options; extractor defaults to `JsonResultExtractor`, caller override wins          | Query and executor state; `execute()` sends the current Q as POST body                            |

Create a new request object for each call; do not share a mutable request between hook instances. Fetcher registration is resolved during render, so a missing named registration fails there. `useFetcher` does not default to JSON independently of the selected Fetcher/options: select the extractor explicitly when you need typed JSON. HTTP status, timeout and extraction failures follow the selected Fetcher's interceptor pipeline.

`useFetcherQuery`'s declared return extends the exchange-capable type, but the current implementation does not include `exchange` in its returned object. Use `useFetcher` directly when inspecting exchanges. `reset()` clears exchange/state; it does not cancel pending work. `abort()` clears exchange, invalidates the local request ID and aborts the executor. Unmount and overlapping request behavior follows [Promise state](./promise-and-query-state). Changing `url` or other options updates what the next execution reads; it is not itself a promise that a new request is triggered.

## HTTP cancellation and timeout {#http-cancellation}

`useFetcher` assigns the executor's AbortController to the request. With the normal Fetcher transport and no explicit `signal`, that controller participates in the library timeout path. An explicit request `signal` takes precedence in Fetcher and bypasses its built-in timeout; it can also bypass the controller the hook would abort. Compose your own signal/timeout deliberately if supplying a signal. Regardless of physical cancellation, request IDs prevent older work from replacing the hook's current state.

Select an extractor before choosing the result generic: `JsonResultExtractor` parses JSON, while ordinary Fetcher defaults can return an exchange or Response. `R` is the extracted value type, `E` is the error-state type; neither validates runtime payloads. [Request lifecycle](../../architecture/request-lifecycle) explains why a JSON parse failure can occur after exchange interception has finished.

## Complete example

```tsx
import { JsonResultExtractor } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';
export function Profile() {
  const request = useFetcher<{ name: string }>({
    resultExtractor: JsonResultExtractor,
  });
  return (
    <section>
      <button
        disabled={request.loading}
        onClick={() => {
          void request.execute({ url: '/api/profile', method: 'GET' });
        }}
      >
        Load
      </button>
      {request.error && <p role="alert">{request.error.message}</p>}
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

[packages/react/src/fetcher/useFetcher.ts:162](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L162)

### UseFetcherOptions {#api-UseFetcherOptions}

```ts
export interface UseFetcherOptions<R, E = FetcherError>
  extends RequestOptions, FetcherCapable, UseExecutePromiseOptions<R, E> {}
```

[packages/react/src/fetcher/useFetcher.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L37)

### UseFetcherReturn {#api-UseFetcherReturn}

```ts
export interface UseFetcherReturn<R, E = FetcherError> extends Omit<
  UseExecutePromiseReturn<R, E>,
  'execute'
> {
  exchange?: FetchExchange;
  execute: (request: FetchRequest) => Promise<void>;
}
```

[packages/react/src/fetcher/useFetcher.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L47)

### useFetcherQuery {#api-useFetcherQuery}

```ts
export function useFetcherQuery<Q, R, E = FetcherError>(
  options: UseFetcherQueryOptions<Q, R, E>,
): UseFetcherQueryReturn<Q, R, E>;
```

[packages/react/src/fetcher/useFetcherQuery.ts:126](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L126)

### UseFetcherQueryOptions {#api-UseFetcherQueryOptions}

```ts
export interface UseFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherOptions<R, E>, QueryOptions<Q>, AutoExecuteCapable {
  url: string;
}
```

[packages/react/src/fetcher/useFetcherQuery.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L30)

### UseFetcherQueryReturn {#api-UseFetcherQueryReturn}

```ts
export interface UseFetcherQueryReturn<Q, R, E = FetcherError>
  extends UseFetcherReturn<R, E>, UseQueryStateReturn<Q> {
  execute: () => Promise<void>;
}
```

[packages/react/src/fetcher/useFetcherQuery.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L42)

## Related topics

[Promise and query state](./promise-and-query-state) · [API hook factories](./api-hooks) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Wow query hooks](./wow) · [Monitoring, refs and fullscreen](./monitoring-and-utilities)
