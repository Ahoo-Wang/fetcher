---
title: 'Debounced execution'
description: 'Debounced execution — @ahoo-wang/fetcher-react 6.0.0'
---

# Debounced execution

Two kinds of debounce exist, and they expose different controls. Callback debounce (`useDebouncedCallback`, `useDebouncedExecutePromise`, `useDebouncedFetcher`) delays calls: `run(...args): void`, `cancel(): void`, `isPending(): boolean`. Value debounce (`useDebouncedValue`, `useDebouncedQuery`, `useDebouncedFetcherQuery`) delays a value: the hook follows the value once it has stopped changing and exposes `pending: boolean` and `flush(): void`. `run` is not an awaitable result; `isPending()` and `pending` describe the timer, not loading state.

| Option / hook                                        | Behavior                                                                                                                                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `debounce.delay`                                     | Required milliseconds; no default delay.                                                                                                                                                                                             |
| `leading` / `trailing`                               | Defaults false / true. Explicitly disabling both throws during hook execution.                                                                                                                                                       |
| `useDebouncedCallback(callback, options)`            | The latest callback and options are used; the returned functions are stable. A new run replaces a pending trailing timer and keeps the latest arguments.                                                                             |
| `useDebouncedExecutePromise` / `useDebouncedFetcher` | Replace `execute` with `run`/`cancel`/`isPending`; keep result/error/abort/reset (Fetcher also `exchange`).                                                                                                                          |
| `useDebouncedValue(value, options)`                  | Returns `{ value, pending, flush }`. The first render returns `value` itself; later changes (compared deeply) are applied after the delay.                                                                                           |
| `useDebouncedQuery` / `useDebouncedFetcherQuery`     | A [controlled query](./promise-and-query-state#controlled-queries) whose `query` is debounced: the first query executes at once, later changes after the delay. Adds `pending` and `flush()`; `execute()` re-runs the applied query. |

With leading and trailing enabled, the initial invocation runs immediately; a lone leading call does not also get a trailing invocation. Later calls inside the delay may schedule trailing execution. `cancel()` removes scheduled work but retains the last-leading timestamp. It does not abort an already running request. Conversely, request `abort()` does not clear a pending debounce timer; call both when cancelling the entire user action. Unmount clears timers and request hooks also abort active execution.

Query variants keep the query in your state like `useQuery`. `pending` is true while the query you pass differs from the applied one; `flush()` applies it now (for an Apply button or Enter). Reverting your query to the applied value drops the waiting change. Applying a new query cancels the request in flight when the new execution starts, not on each keystroke. A debounced `undefined` makes the query not ready; it does not cancel work already running. Callback exceptions and rejected promises in callback variants need their own handling; a timer does not expose a rejection to the caller of `run`. The executor's error state covers the request hooks.

## Timer and request controls {#cancellation-controls}

| Control                           | Pending timer / waiting query | Running operation             | Result state                    |
| --------------------------------- | ----------------------------- | ----------------------------- | ------------------------------- |
| `cancel()` on callback variants   | Removes it                    | Keeps running                 | Retained                        |
| `flush()` on value/query variants | Applies the waiting value now | Replaced by the new execution | Follows the new execution       |
| `abort()` on request variants     | Retained                      | Cancelled                     | Idle if something was in flight |
| `reset()` on request variants     | Retained                      | Cancelled                     | Idle, result and error cleared  |
| Unmount                           | Cleared                       | Request variants abort        | No further mounted-state commit |

There is no default `delay`. Set `debounce: { delay: 300 }` for a 300 ms quiet period. Debounced queries execute automatically like `useQuery` (`autoExecute` defaults to true). Neither `isPending()` nor `pending` proves a server-side write was cancelled; `loading` describes an already started supplier.

::: info Changed in 6.0
`useDebouncedQuery` and `useDebouncedFetcherQuery` no longer return `run`, `cancel`, `isPending`, `setQuery` or `getQuery`, and no longer accept `initialQuery`. Pass `query` from your own state; use `pending`, `flush()` and `execute()`. They now execute automatically by default. `useDebouncedValue` is new.
:::

## Complete example

```tsx
import { useState } from 'react';
import { useDebouncedQuery } from '@ahoo-wang/fetcher-react';

export function Preview() {
  const [text, setText] = useState('');
  const preview = useDebouncedQuery<string, string>({
    query: text,
    debounce: { delay: 300 },
    execute: async value => value.toUpperCase(),
  });
  return (
    <section>
      <input
        aria-label="Text"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button disabled={!preview.pending} onClick={preview.flush}>
        Apply now
      </button>
      <button onClick={preview.abort}>Cancel</button>
      <output>{preview.pending ? 'Waiting' : preview.result}</output>
    </section>
  );
}
```

`useDebouncedValue` debounces any value without a request, for example to derive a filter:

```tsx
import { useState } from 'react';
import { useDebouncedValue } from '@ahoo-wang/fetcher-react';

export function Filter({ items }: { items: string[] }) {
  const [keyword, setKeyword] = useState('');
  const { value: applied } = useDebouncedValue(keyword, { delay: 300 });
  return (
    <section>
      <input value={keyword} onChange={e => setKeyword(e.target.value)} />
      <ul>
        {items
          .filter(item => item.includes(applied))
          .map(item => (
            <li key={item}>{item}</li>
          ))}
      </ul>
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

[packages/react/src/core/debounced/useDebouncedCallback.ts:43](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L43)

### UseDebouncedCallbackOptions {#api-UseDebouncedCallbackOptions}

```ts
export interface UseDebouncedCallbackOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L17)

### UseDebouncedCallbackReturn {#api-UseDebouncedCallbackReturn}

```ts
export interface UseDebouncedCallbackReturn<T extends (...args: any[]) => any> {
  readonly run: (...args: Parameters<T>) => void;
  readonly cancel: () => void;
  readonly isPending: () => boolean;
}
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L26)

### useDebouncedValue {#api-useDebouncedValue}

```ts
export function useDebouncedValue<T>(
  value: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedValueReturn<T>;
```

[packages/react/src/core/debounced/useDebouncedValue.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedValue.ts#L38)

### UseDebouncedValueReturn {#api-UseDebouncedValueReturn}

```ts
export interface UseDebouncedValueReturn<T> {
  value: T;
  pending: boolean;
  flush: () => void;
}
```

[packages/react/src/core/debounced/useDebouncedValue.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedValue.ts#L21)

### useDebouncedExecutePromise {#api-useDebouncedExecutePromise}

```ts
export function useDebouncedExecutePromise<R = unknown, E = FetcherError>(
  options: UseDebouncedExecutePromiseOptions<R, E>,
): UseDebouncedExecutePromiseReturn<R, E>;
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L39)

### DebounceCapable {#api-DebounceCapable}

```ts
export interface DebounceCapable {
  debounce: UseDebouncedCallbackOptions;
}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L26)

### UseDebouncedExecutePromiseOptions {#api-UseDebouncedExecutePromiseOptions}

```ts
export interface UseDebouncedExecutePromiseOptions<R, E = FetcherError>
  extends UseExecutePromiseOptions<R, E>, DebounceCapable {}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L30)

### UseDebouncedExecutePromiseReturn {#api-UseDebouncedExecutePromiseReturn}

```ts
export interface UseDebouncedExecutePromiseReturn<R, E = FetcherError>
  extends
    Omit<UseExecutePromiseReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseExecutePromiseReturn<R, E>['execute']> {}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L33)

### useDebouncedQuery {#api-useDebouncedQuery}

```ts
export function useDebouncedQuery<Q, R, E = FetcherError>(
  options: UseDebouncedQueryOptions<Q, R, E>,
): UseDebouncedQueryReturn<R, E>;
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L37)

### UseDebouncedQueryOptions {#api-UseDebouncedQueryOptions}

```ts
export interface UseDebouncedQueryOptions<Q, R, E = FetcherError>
  extends UseQueryOptions<Q, R, E>, DebounceCapable {}
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L20)

### UseDebouncedQueryReturn {#api-UseDebouncedQueryReturn}

```ts
export interface UseDebouncedQueryReturn<
  R,
  E = FetcherError,
> extends UseQueryReturn<R, E> {
  pending: boolean;
  flush: () => void;
}
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L23)

### useDebouncedFetcher {#api-useDebouncedFetcher}

```ts
export function useDebouncedFetcher<R, E = FetcherError>(
  options: UseDebouncedFetcherOptions<R, E>,
): UseDebouncedFetcherReturn<R, E>;
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L32)

### UseDebouncedFetcherOptions {#api-UseDebouncedFetcherOptions}

```ts
export interface UseDebouncedFetcherOptions<R, E = FetcherError>
  extends UseFetcherOptions<R, E>, DebounceCapable {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L23)

### UseDebouncedFetcherReturn {#api-UseDebouncedFetcherReturn}

```ts
export interface UseDebouncedFetcherReturn<R, E = FetcherError>
  extends
    Omit<UseFetcherReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseFetcherReturn<R, E>['execute']> {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L26)

### useDebouncedFetcherQuery {#api-useDebouncedFetcherQuery}

```ts
export function useDebouncedFetcherQuery<Q, R, E = FetcherError>(
  options: UseDebouncedFetcherQueryOptions<Q, R, E>,
): UseDebouncedFetcherQueryReturn<R, E>;
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L40)

### UseDebouncedFetcherQueryOptions {#api-UseDebouncedFetcherQueryOptions}

```ts
export interface UseDebouncedFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherQueryOptions<Q, R, E>, DebounceCapable {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L23)

### UseDebouncedFetcherQueryReturn {#api-UseDebouncedFetcherQueryReturn}

```ts
export interface UseDebouncedFetcherQueryReturn<
  R,
  E = FetcherError,
> extends UseFetcherQueryReturn<R, E> {
  pending: boolean;
  flush: () => void;
}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L26)

## Related topics

[Fetcher hooks](./fetcher-hooks) · [Promise and query state](./promise-and-query-state) · [API hook factories](./api-hooks) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Latest and stable values](./utilities)
