---
title: 'Debounced execution'
description: 'Debounced execution — @ahoo-wang/fetcher-react 5.0.0'
---

# Debounced execution

Debounced hooks separate waiting for a timer from a request that has already started. All expose `run(...args): void`, `cancel(): void`, and `isPending(): boolean`. `run` is not an awaitable result; `isPending` reads timer ownership, not loading state.

| Option / hook                                        | Behavior                                                                                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `debounce.delay`                                     | Required milliseconds; no default delay.                                                                                                        |
| `leading` / `trailing`                               | Defaults false / true. Explicitly disabling both throws during hook execution.                                                                  |
| `useDebouncedCallback(callback, options)`            | Latest callback/options are read through refs; a new run replaces a pending trailing timer and keeps latest arguments.                          |
| `useDebouncedExecutePromise` / `useDebouncedFetcher` | Replace `execute` with `run`; preserve result/error/reset/abort (Fetcher also exchange).                                                        |
| `useDebouncedQuery` / `useDebouncedFetcherQuery`     | Preserve getQuery/setQuery; replace execute with run. Automatic scheduling requires explicit `autoExecute: true` in the current implementation. |

With leading and trailing enabled, the initial invocation runs immediately; a lone leading call does not also get a trailing invocation. Later calls inside the delay may schedule trailing execution. Public `cancel()` removes scheduled work but retains the last-leading timestamp. It does not abort an already running request. Conversely, request `abort()` does not clear a pending debounce timer; call both when cancelling the entire user action. `reset()` clears result state only. Unmount clears timers and request hooks also abort active execution.

Query variants deep-compare reactive queries. Turning autoExecute off or setting an explicit `query: undefined` cancels their automatic scheduled work. Manually requested work is separate. Replacing query input does not mean an existing network request is immediately cancelled: that happens when the next execution starts. Callback exceptions and rejected promises need their own handling; a timer does not expose a rejection to the caller of run. Prefer the executor's default error state for asynchronous actions.

## Timer and request controls {#cancellation-controls}

| Control                       | Pending timer | Running operation                        | Result state                                |
| ----------------------------- | ------------- | ---------------------------------------- | ------------------------------------------- |
| `cancel()`                    | Removes it    | Keeps running                            | Retained                                    |
| `abort()` on request variants | Retained      | Signals abort and invalidates its result | Idle                                        |
| `reset()` on request variants | Retained      | Keeps running                            | Cleared now; later completion may update it |
| Unmount                       | Cleared       | Request variants abort                   | No further mounted-state commit             |

There is no default `delay`. Set `debounce: { delay: 300 }` for a 300 ms quiet period. Ordinary `useQuery` defaults to automatic execution; the current debounced query implementation needs explicit `autoExecute: true`. `isPending()` describes the timer, while `loading` describes an already started supplier. Neither proves a server-side write was cancelled.

## Complete example

```tsx
import { useDebouncedQuery } from '@ahoo-wang/fetcher-react';
export function Preview() {
  const query = useDebouncedQuery<string, string>({
    initialQuery: '',
    autoExecute: true,
    debounce: { delay: 300 },
    execute: async value => value.toUpperCase(),
  });
  return (
    <section>
      <input aria-label="Text" onChange={e => query.setQuery(e.target.value)} />
      <button
        onClick={() => {
          query.cancel();
          query.abort();
        }}
      >
        Cancel
      </button>
      <output>{query.result}</output>
    </section>
  );
}
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### useDebouncedCallback {#api-useDebouncedCallback}

```ts
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedCallbackReturn<T>;
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L87)

### UseDebouncedCallbackOptions {#api-UseDebouncedCallbackOptions}

```ts
export interface UseDebouncedCallbackOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L19)

### UseDebouncedCallbackReturn {#api-UseDebouncedCallbackReturn}

```ts
export interface UseDebouncedCallbackReturn<T extends (...args: any[]) => any> {
  readonly run: (...args: Parameters<T>) => void;
  readonly cancel: () => void;
  readonly isPending: () => boolean;
}
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L32)

### useDebouncedExecutePromise {#api-useDebouncedExecutePromise}

```ts
export function useDebouncedExecutePromise<R = unknown, E = FetcherError>(
  options: UseDebouncedExecutePromiseOptions<R, E>,
): UseDebouncedExecutePromiseReturn<R, E>;
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:119](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L119)

### DebounceCapable {#api-DebounceCapable}

```ts
export interface DebounceCapable {
  debounce: UseDebouncedCallbackOptions;
}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L32)

### UseDebouncedExecutePromiseOptions {#api-UseDebouncedExecutePromiseOptions}

```ts
export interface UseDebouncedExecutePromiseOptions<R, E = unknown>
  extends UseExecutePromiseOptions<R, E>, DebounceCapable {}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L49)

### UseDebouncedExecutePromiseReturn {#api-UseDebouncedExecutePromiseReturn}

```ts
export interface UseDebouncedExecutePromiseReturn<R, E = unknown>
  extends
    Omit<UseExecutePromiseReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseExecutePromiseReturn<R, E>['execute']> {}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L60)

### useDebouncedQuery {#api-useDebouncedQuery}

```ts
export function useDebouncedQuery<Q, R, E = FetcherError>(
  options: UseDebouncedQueryOptions<Q, R, E>,
): UseDebouncedQueryReturn<Q, R, E>;
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:140](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L140)

### UseDebouncedQueryOptions {#api-UseDebouncedQueryOptions}

```ts
export interface UseDebouncedQueryOptions<Q, R, E = FetcherError>
  extends UseQueryOptions<Q, R, E>, DebounceCapable {}
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L28)

### UseDebouncedQueryReturn {#api-UseDebouncedQueryReturn}

```ts
export interface UseDebouncedQueryReturn<Q, R, E = FetcherError>
  extends
    Omit<UseQueryReturn<Q, R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseQueryReturn<Q, R, E>['execute']> {}
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L37)

### useDebouncedFetcher {#api-useDebouncedFetcher}

```ts
export function useDebouncedFetcher<R, E = FetcherError>(
  options: UseDebouncedFetcherOptions<R, E>,
): UseDebouncedFetcherReturn<R, E>;
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L112)

### UseDebouncedFetcherOptions {#api-UseDebouncedFetcherOptions}

```ts
export interface UseDebouncedFetcherOptions<R, E = FetcherError>
  extends UseFetcherOptions<R, E>, DebounceCapable {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L29)

### UseDebouncedFetcherReturn {#api-UseDebouncedFetcherReturn}

```ts
export interface UseDebouncedFetcherReturn<R, E = FetcherError>
  extends
    Omit<UseFetcherReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseFetcherReturn<R, E>['execute']> {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L40)

### useDebouncedFetcherQuery {#api-useDebouncedFetcherQuery}

```ts
export function useDebouncedFetcherQuery<Q, R, E = FetcherError>(
  options: UseDebouncedFetcherQueryOptions<Q, R, E>,
): UseDebouncedFetcherQueryReturn<Q, R, E>;
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:145](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L145)

### UseDebouncedFetcherQueryOptions {#api-UseDebouncedFetcherQueryOptions}

```ts
export interface UseDebouncedFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherQueryOptions<Q, R, E>, DebounceCapable {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L33)

### UseDebouncedFetcherQueryReturn {#api-UseDebouncedFetcherQueryReturn}

```ts
export interface UseDebouncedFetcherQueryReturn<Q, R, E = FetcherError>
  extends
    Omit<UseFetcherQueryReturn<Q, R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseFetcherQueryReturn<Q, R, E>['execute']> {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L47)

## Related topics

[Fetcher hooks](./fetcher-hooks) · [Promise and query state](./promise-and-query-state) · [API hook factories](./api-hooks) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Wow query hooks](./wow) · [Monitoring, refs and fullscreen](./monitoring-and-utilities)
