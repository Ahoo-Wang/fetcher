---
title: 'Promise and query state'
description: 'Promise and query state — @ahoo-wang/fetcher-react 6.0.0'
---

# Promise and query state

Use `usePromiseState` when another system owns execution. Use `useExecutePromise` for a user-triggered asynchronous action, and `useQuery` when a query value drives that action. These hooks manage one state value per mounted instance; they provide no shared cache or automatic retries.

Each execution is identified by its `AbortController`. Only the current execution may write state; starting a newer one, `abort()`, `reset()` and unmounting all abort it. State is one value `{ status, loading, result, error }`, and `execute` never rejects: it resolves to the state this execution ended in.

## State and execution

| API / option                             | Contract                                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `usePromiseState<R,E>(options?)`         | Starts at `initialStatus ?? 'idle'`, with undefined result and error. Returns state plus stable, synchronous setters; it runs no callbacks.                                          |
| `setLoading()`                           | Clears error and keeps the previous result.                                                                                                                                          |
| `setSuccess(result)` / `setError(error)` | Success clears error; error clears result.                                                                                                                                           |
| `setIdle()`                              | Clears result and error.                                                                                                                                                             |
| `execute(supplier)`                      | Cancels the execution in flight, calls `supplier(abortController)` and resolves to `PromiseState`: `success`, `error`, or `idle` when the execution was cancelled. It never rejects. |
| `onSuccess` / `onError`                  | Run only for the current execution and are awaited before `execute` resolves. A throwing callback is reported with `console.error`; state is unchanged.                              |
| `onAbort`                                | Called synchronously when an in-flight execution is cancelled (newer execution, `abort()`, `reset()`, unmount). Not awaited.                                                         |
| `abort()`                                | Cancels the execution in flight and returns to idle. With nothing in flight it changes nothing: a settled result stays.                                                              |
| `reset()`                                | Cancels the execution in flight, if any, and returns to idle, clearing result and error.                                                                                             |
| `AbortError` from the supplier           | An error named `AbortError` (for example from a signal of the caller's own) returns the execution to idle instead of error, without `onError`.                                       |

The supplier must pass the signal to its I/O to stop the actual work. The hook ignores a cancelled execution's outcome even when the supplier ignores cancellation. Unmounting cancels the current execution; after unmount `execute` resolves to idle without running the supplier.

Branch on the resolved state instead of catching:

```ts
const { status, error } = await execute(supplier);
if (status === 'success') navigate('/done');
else if (status === 'error') toast(error!.message);
```

## Controlled queries {#controlled-queries}

`useQuery<Q,R,E>` is controlled: keep the query in your own state (`useState`, a URL, a parent prop) and pass it as `query`. The executor receives `(query, abortController)`.

| Input                    | Behavior                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `query` content changes  | Re-executes. Content is compared deeply, so an inline object that is equal to the previous one does not re-run.                                 |
| `query === undefined`    | Not ready: nothing runs, and `execute()` resolves to idle. Use it to wait for a required input.                                                 |
| `autoExecute`            | Defaults to true. With false, only `execute()` runs the current query; turning it on executes the current query.                                |
| `execute` option changes | The latest function is used on the next execution; a new function alone does not re-run.                                                        |
| First render             | `loading` when the hook will execute on mount (query defined, `autoExecute` on), unless `initialStatus` is given; otherwise `idle`.             |
| `execute()` return       | Runs the current query now and resolves to its final state, like `useExecutePromise`'s `execute`. Changing the query cancels the one in flight. |

To pause automatic execution, set `autoExecute: false` or pass `query: undefined`; neither cancels work already running. Call `abort()` to cancel it, or `reset()` to also clear the shown result.

## Choosing state, execution and query ownership {#ownership}

| Decision                             | State-only hook                     | Executor                          | Query hook                                             |
| ------------------------------------ | ----------------------------------- | --------------------------------- | ------------------------------------------------------ |
| Who starts work?                     | Your code outside `usePromiseState` | You call `execute(supplier)`      | Mount/query change by default, or explicit `execute()` |
| Who stores the input?                | Your code                           | The current supplier/call         | Your state, passed as `query`                          |
| Who cancels and rejects old results? | Your code                           | `useExecutePromise`               | Its underlying executor                                |
| What does reset do?                  | `setIdle()` clears result/error     | Cancels in-flight work, then idle | Same; the query stays in your state                    |

For a search box, the input renders from your query state immediately; the result follows when the request settles. `undefined` is the only "not ready" value; validate business fields yourself before passing a query.

See [debounce cancellation](./debounce#cancellation-controls) before adding a timer, and [the HTTP example](./index) for an operation that forwards cancellation to Fetcher.

::: info Changed in 6.0
`useQueryState`, `isValidateQuery`, `initialQuery`, `setQuery`/`getQuery` and the `propagateError` option were removed; keep the query in your own state and read the state `execute` resolves to. The `execute` option of `useQuery` receives `(query, abortController)` instead of `(query, attributes, abortController)`. `usePromiseState` setters are synchronous and take no callbacks. `reset()` now cancels the execution in flight, `onAbort` is called synchronously, and an auto-executing query renders `loading` on its first render.
:::

## Complete example

```tsx
import { useState } from 'react';
import { useQuery } from '@ahoo-wang/fetcher-react';

export function Search() {
  const [query, setQuery] = useState({ term: '' });
  const search = useQuery<{ term: string }, string, Error>({
    query,
    execute: async ({ term }, abortController) => {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(term)}`,
        { signal: abortController.signal },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    },
  });
  return (
    <section>
      <input
        aria-label="Search"
        value={query.term}
        onChange={e => setQuery({ term: e.target.value })}
      />
      <button onClick={search.abort}>Cancel</button>
      <p role="status">{search.loading ? 'Loading' : search.result}</p>
      {search.error && <p role="alert">{search.error.message}</p>}
    </section>
  );
}
```

Service URLs in examples require application endpoints; type checking does not imply an external service was contacted.

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

## State without execution {#state-contracts}

### usePromiseState {#api-usePromiseState}

```ts
export function usePromiseState<R = unknown, E = FetcherError>(
  options?: UsePromiseStateOptions,
): UsePromiseStateReturn<R, E>;
```

[packages/react/src/core/usePromiseState.ts:119](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L119)

### PromiseStatus {#api-PromiseStatus}

```ts
export const PromiseStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type PromiseStatus = (typeof PromiseStatus)[keyof typeof PromiseStatus];
```

Usable both as values (`PromiseStatus.SUCCESS`) and as the literal type `'idle' | 'loading' | 'success' | 'error'`.

[packages/react/src/core/usePromiseState.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L21)

### PromiseState {#api-PromiseState}

```ts
export interface PromiseState<R, E = unknown> {
  status: PromiseStatus;
  loading: boolean;
  result: R | undefined;
  error: E | undefined;
}
```

[packages/react/src/core/usePromiseState.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L30)

### UsePromiseStateOptions {#api-UsePromiseStateOptions}

```ts
export interface UsePromiseStateOptions {
  initialStatus?: PromiseStatus;
}
```

[packages/react/src/core/usePromiseState.ts:96](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L96)

### UsePromiseStateReturn {#api-UsePromiseStateReturn}

```ts
export interface UsePromiseStateReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  setLoading: () => void;
  setSuccess: (result: R) => void;
  setError: (error: E) => void;
  setIdle: () => void;
}
```

[packages/react/src/core/usePromiseState.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L105)

## Explicit execution {#execution-contracts}

### useExecutePromise {#api-useExecutePromise}

```ts
export function useExecutePromise<R = unknown, E = FetcherError>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E>;
```

[packages/react/src/core/useExecutePromise.ts:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L107)

### UseExecutePromiseOptions {#api-UseExecutePromiseOptions}

```ts
export interface UseExecutePromiseOptions<
  R,
  E = FetcherError,
> extends UsePromiseStateOptions {
  onSuccess?: (result: R) => void | Promise<void>;
  onError?: (error: E) => void | Promise<void>;
  onAbort?: () => void;
}
```

[packages/react/src/core/useExecutePromise.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L28)

### PromiseSupplier {#api-PromiseSupplier}

```ts
export type PromiseSupplier<R> = (
  abortController: AbortController,
) => Promise<R>;
```

[packages/react/src/core/useExecutePromise.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L44)

### UseExecutePromiseReturn {#api-UseExecutePromiseReturn}

```ts
export interface UseExecutePromiseReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  execute: (supplier: PromiseSupplier<R>) => Promise<PromiseState<R, E>>;
  abort: () => void;
  reset: () => void;
}
```

[packages/react/src/core/useExecutePromise.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L48)

## Query-driven execution {#query-contracts}

### useQuery {#api-useQuery}

```ts
export function useQuery<Q, R, E = FetcherError>(
  options: UseQueryOptions<Q, R, E>,
): UseQueryReturn<R, E>;
```

[packages/react/src/core/useQuery.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L58)

### QueryOptions {#api-QueryOptions}

```ts
export interface QueryOptions<Q> {
  query?: Q;
}
```

[packages/react/src/core/useQuery.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L25)

### UseQueryOptions {#api-UseQueryOptions}

```ts
export interface UseQueryOptions<Q, R, E = FetcherError>
  extends UseExecutePromiseOptions<R, E>, QueryOptions<Q> {
  /** @default true */
  autoExecute?: boolean;
  execute: (query: Q, abortController: AbortController) => Promise<R>;
}
```

`autoExecute` is declared on an internal base interface; it is shown inline here.

[packages/react/src/core/useQuery.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L33)

### UseQueryReturn {#api-UseQueryReturn}

```ts
export interface UseQueryReturn<R, E = FetcherError> extends Omit<
  UseExecutePromiseReturn<R, E>,
  'execute'
> {
  execute: () => Promise<PromiseState<R, E>>;
}
```

[packages/react/src/core/useQuery.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L39)

## Related topics

[Fetcher hooks](./fetcher-hooks) · [API hook factories](./api-hooks) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Latest and stable values](./utilities)
