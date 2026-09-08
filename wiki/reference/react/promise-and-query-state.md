---
title: 'Promise and query state'
description: 'Promise and query state — @ahoo-wang/fetcher-react 5.0.0'
---

# Promise and query state

Use `usePromiseState` when another system owns execution. Use `useExecutePromise` for a user-triggered asynchronous action, and `useQuery` when a query object drives that action. These hooks manage one latest result per mounted instance; they provide no shared cache or automatic retries.

## State and execution

| API / option                             | Contract                                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usePromiseState<R,E>(options?)`         | Starts at `initialStatus ?? PromiseStatus.IDLE`, with undefined result and error. Returns state plus setters.                                                   |
| `setLoading()`                           | Clears error and retains the previous result.                                                                                                                   |
| `setSuccess(result)` / `setError(error)` | Set success/result or error/undefined result, then await the matching callback. Callback failure is logged and does not replace state.                          |
| `setIdle()` / executor `reset()`         | Clear result and error. `reset()` alone does not cancel or invalidate an in-flight execution.                                                                   |
| `execute(supplier)`                      | Calls `supplier(AbortController)`, returns `Promise<void>`; read data from `result`. A new execution aborts the previous controller and invalidates its result. |
| `propagateError`                         | Default false: operational failures become error state. True also rejects the execute promise. `AbortError` is swallowed and returns to idle.                   |
| `abort()`                                | Invalidates the request, clears state, signals cancellation, invokes `onAbort`; callback failures are logged.                                                   |

The supplier must pass the signal to its I/O to stop the actual work. The hook can discard a stale result even when the supplier ignores cancellation. Cleanup on unmount aborts the current execution. Do not call retained executors after unmount: the implementation prevents state commits but does not promise to prevent the supplier from running.

## Query ownership

`useQuery<Q,R,E>` adds `initialQuery`, `query`, `attributes`, `autoExecute`, `getQuery()` and `setQuery(Q)`. The executor receives `(query, attributes, abortController)`. `autoExecute` defaults to true. If both `query` and `initialQuery` are undefined at initialization, there is no request; `isValidateQuery` checks only `query !== undefined`, not a schema. `query` overrides initialization; deep-equal changes to its object identity alone do not refetch. Changing execution configuration can trigger another execution. `initialQuery` is initialization, not a reactive replacement prop.

Changing a previously defined `query` prop to `undefined` does not clear the stored query and can automatically execute that previous value again. To pause automatic execution, set `autoExecute: false`; this does not cancel work already running. Call `abort()` separately to invalidate and cancel the current execution.

`setQuery` updates a ref and executes immediately when automatic execution is enabled; it is not an independent React state notification and does not deduplicate explicit setter calls. With `autoExecute: false`, call `setQuery` then `execute()` to run the latest value. Automatic execution does not await a consumer's catch handler, so use error state/onError instead of `propagateError: true` for unattended requests. `useQueryState` exposes the query-ref behavior without cancellation ownership; keep its `execute` callback stable.

## Choosing state, execution and query ownership {#ownership}

| Decision                             | State-only hook                     | Executor                                       | Query hook                                             |
| ------------------------------------ | ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| Who starts work?                     | Your code outside `usePromiseState` | You call `execute(supplier)`                   | Mount/query change by default, or explicit `execute()` |
| Who stores the input?                | Your code                           | The current supplier/call                      | Query ref, read with `getQuery()`                      |
| Who cancels and rejects old results? | Your code                           | `useExecutePromise`                            | Its underlying executor                                |
| What does reset do?                  | Set idle and clear result/error     | Same; a running supplier can later set success | Same; query is retained                                |

For a search box, keep the editable text in React state when it must render independently of request state: `setQuery` alone is a ref update. `initialQuery` seeds the ref; a defined reactive `query` takes precedence. Query validation only excludes undefined. Do not use it as a form/schema validator. The query ref and the asynchronous result are separate values; changing one does not immediately produce the other.

See [debounce cancellation](./debounce#cancellation-controls) before adding a timer, and [the HTTP example](./index) for an operation that forwards cancellation to Fetcher.

## Complete example

```tsx
import { useQuery } from '@ahoo-wang/fetcher-react';
export function Search() {
  const query = useQuery<{ term: string }, string, Error>({
    initialQuery: { term: '' },
    execute: async ({ term }, _attributes, controller) => {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(term)}`,
        {
          signal: controller?.signal,
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    },
  });
  return (
    <section>
      <input
        aria-label="Search"
        onChange={e => query.setQuery({ term: e.target.value })}
      />
      <button onClick={query.abort}>Cancel</button>
      <p role="status">{query.loading ? 'Loading' : query.result}</p>
      {query.error && <p role="alert">{query.error.message}</p>}
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
  options?: UsePromiseStateOptions<R, E>,
): UsePromiseStateReturn<R, E>;
```

[packages/react/src/core/usePromiseState.ts:119](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L119)

### PromiseStatus {#api-PromiseStatus}

```ts
export enum PromiseStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
```

[packages/react/src/core/usePromiseState.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L22)

### PromiseState {#api-PromiseState}

```ts
export interface PromiseState<R, E = unknown> {
  status: PromiseStatus;
  loading: boolean;
  result: R | undefined;
  error: E | undefined;
}
```

[packages/react/src/core/usePromiseState.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L29)

### PromiseStateCallbacks {#api-PromiseStateCallbacks}

```ts
export interface PromiseStateCallbacks<R, E = unknown> {
  onSuccess?: (result: R) => void | Promise<void>;
  onError?: (error: E) => void | Promise<void>;
}
```

[packages/react/src/core/usePromiseState.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L40)

### UsePromiseStateOptions {#api-UsePromiseStateOptions}

```ts
export interface UsePromiseStateOptions<
  R,
  E = FetcherError,
> extends PromiseStateCallbacks<R, E> {
  initialStatus?: PromiseStatus;
}
```

[packages/react/src/core/usePromiseState.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L63)

### UsePromiseStateReturn {#api-UsePromiseStateReturn}

```ts
export interface UsePromiseStateReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  setLoading: () => void;
  setSuccess: (result: R) => Promise<void>;
  setError: (error: E) => Promise<void>;
  setIdle: () => void;
}
```

[packages/react/src/core/usePromiseState.ts:75](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L75)

## Explicit execution {#execution-contracts}

### useExecutePromise {#api-useExecutePromise}

```ts
export function useExecutePromise<R = unknown, E = FetcherError>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E>;
```

[packages/react/src/core/useExecutePromise.ts:210](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L210)

### UseExecutePromiseOptions {#api-UseExecutePromiseOptions}

```ts
export interface UseExecutePromiseOptions<
  R,
  E = FetcherError,
> extends UsePromiseStateOptions<R, E> {
  propagateError?: boolean;
  onAbort?: () => void | Promise<void>;
}
```

[packages/react/src/core/useExecutePromise.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L27)

### PromiseSupplier {#api-PromiseSupplier}

```ts
export type PromiseSupplier<R> = (
  abortController: AbortController,
) => Promise<R>;
```

[packages/react/src/core/useExecutePromise.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L51)

### UseExecutePromiseReturn {#api-UseExecutePromiseReturn}

```ts
export interface UseExecutePromiseReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  execute: (input: PromiseSupplier<R>) => Promise<void>;
  reset: () => void;
  abort: () => void;
}
```

[packages/react/src/core/useExecutePromise.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L61)

## Query-driven execution {#query-contracts}

### useQuery {#api-useQuery}

```ts
export function useQuery<Q, R, E = FetcherError>(
  options: UseQueryOptions<Q, R, E>,
): UseQueryReturn<Q, R, E>;
```

[packages/react/src/core/useQuery.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L105)

### QueryOptions {#api-QueryOptions}

```ts
export interface QueryOptions<Q> {
  initialQuery?: Q;
  query?: Q;
}
```

[packages/react/src/core/useQueryState.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L18)

### UseQueryOptions {#api-UseQueryOptions}

```ts
export interface UseQueryOptions<Q, R, E = FetcherError>
  extends
    UseExecutePromiseOptions<R, E>,
    QueryOptions<Q>,
    AttributesCapable,
    AutoExecuteCapable {
  execute: (
    query: Q,
    attributes?: Record<string, any>,
    abortController?: AbortController,
  ) => Promise<R>;
}
```

[packages/react/src/core/useQuery.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L33)

### UseQueryReturn {#api-UseQueryReturn}

```ts
export interface UseQueryReturn<Q, R, E = FetcherError>
  extends UseExecutePromiseReturn<R, E>, UseQueryStateReturn<Q> {
  execute: () => Promise<void>;
}
```

[packages/react/src/core/useQuery.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L53)

## Query ref without cancellation ownership {#query-ref-contracts}

### useQueryState {#api-useQueryState}

```ts
export function useQueryState<Q>(
  options: UseQueryStateOptions<Q>,
): UseQueryStateReturn<Q>;
```

[packages/react/src/core/useQueryState.ts:113](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L113)

### isValidateQuery {#api-isValidateQuery}

```ts
export function isValidateQuery<Q>(query: Q | undefined): query is Q;
```

[packages/react/src/core/useQueryState.ts:195](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L195)

### UseQueryStateOptions {#api-UseQueryStateOptions}

```ts
export interface UseQueryStateOptions<Q>
  extends QueryOptions<Q>, AutoExecuteCapable {
  execute: (query: Q) => Promise<void>;
}
```

[packages/react/src/core/useQueryState.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L29)

### UseQueryStateReturn {#api-UseQueryStateReturn}

```ts
export interface UseQueryStateReturn<Q> {
  getQuery: () => Q | undefined;
  setQuery: (query: Q) => void;
}
```

[packages/react/src/core/useQueryState.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L39)

## Related topics

[Fetcher hooks](./fetcher-hooks) · [API hook factories](./api-hooks) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Wow query hooks](./wow) · [Monitoring, refs and fullscreen](./monitoring-and-utilities)
