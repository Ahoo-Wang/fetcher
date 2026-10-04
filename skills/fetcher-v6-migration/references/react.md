# `@ahoo-wang/fetcher-react` 5.x → 6.0

## The model that changed

A request is identified by its `AbortController`. Only the current execution
may write state; a newer execution, `abort()`, `reset()` and unmounting all
abort it. State is one value, `{ status, loading, result, error }`.
`execute` **never rejects**: it resolves to the state the execution ended in
(`status: 'idle'` when it was cancelled). Queries are **controlled**: the
query lives in your state and is passed as `query`; the hook executes when its
content (compared deeply) changes, and `query: undefined` means "not ready".

## Removed or changed

| 5.x                                                                                                                            | 6.0                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `initialQuery` option; `setQuery`/`getQuery` returned by `useQuery`, `useFetcherQuery`, query API hooks, debounced query hooks | `const [query, setQuery] = useState(…)` and pass `query`                                 |
| `useQuery`'s `execute: (query, attributes, abortController)`                                                                   | `(query, abortController)`; generated query hooks still take `{ query, attributes }`     |
| `propagateError: true` + `try/catch`                                                                                           | `const { status, result, error } = await execute(…)` and branch on `status`              |
| `run`, `cancel`, `isPending`, `setQuery` on `useDebouncedQuery` / `useDebouncedFetcherQuery`                                   | `pending`, `flush()` (apply the waiting query now), `execute()` (re-run the applied one) |
| `onBeforeExecute`, `OnBeforeExecuteCallback` on generated API hooks                                                            | Prepare the arguments before calling `execute`                                           |
| `UseApiMethodExecuteOptions<TArgs, TData, E>`                                                                                  | `UseApiMethodExecuteOptions<TData, E>`                                                   |
| `UseDebouncedQueryReturn<Q, R, E>`, `UseDebouncedFetcherQueryReturn<Q, R, E>`                                                  | `<R, E>`                                                                                 |
| `usePromiseState`'s `onSuccess`/`onError`, `PromiseStateCallbacks`                                                             | Setters are synchronous and call nothing; use `useExecutePromise`'s callbacks            |
| `useQueryState`, `useCancellableQueryState`, `isValidateQuery`                                                                 | A controlled `query`; `undefined` while not ready                                        |
| `useFullscreen` and its provider/utilities, `useRefs`, `useForceUpdate`, `useMounted`, `useRequestId`                          | No replacement; write your own or use a library such as ahooks                           |
| `DepsCapable`                                                                                                                  | Remove the reference                                                                     |
| API factories turning getter-provided functions into hooks                                                                     | Expose the method as a method or own property; getters are never run                     |

Added: `appendAbortController: true` on `createExecuteApiHooks`, which calls
`method(...params, abortController)` so replacing or unmounting an execution
cancels the request of a decorated method instead of only discarding its result.

## Diffs

```diff
-const { result, setQuery } = useQuery({
-  initialQuery: { keyword: '' },
-  execute: (query, attributes, abortController) => api.search(query, abortController),
-});
+const [query, setQuery] = useState({ keyword: '' });
+const { result } = useQuery({
+  query,
+  execute: (query, abortController) => api.search(query, abortController),
+});
```

```diff
-try {
-  await execute(supplier); // propagateError: true
-  navigate('/done');
-} catch (error) {
-  toast(error.message);
-}
+const { status, error } = await execute(supplier);
+if (status === 'success') navigate('/done');
+else if (status === 'error') toast(error.message);
```

```diff
-const { setQuery, run } = useDebouncedQuery({ initialQuery, execute, debounce: { delay: 300 } });
+const [query, setQuery] = useState(initialQuery);
+const { result, pending, flush } = useDebouncedQuery({ query, execute, debounce: { delay: 300 } });
```

```diff
-const { execute } = useUpdateUser({
-  onBeforeExecute: (abortController, params) => { params[0] = normalize(params[0]); },
-});
-execute(form);
+const { execute } = useUpdateUser();
+execute(normalize(form));
```

The same pattern applies to `useFetcherQuery`, `useDebouncedFetcherQuery` and
the hooks of `createQueryApiHooks`. A debounced query that relied on not
auto-executing needs `autoExecute: false`, or `query: undefined` until ready.

## Changed without a compile error

- `reset()` cancels the execution in flight first; it used to only set `idle`
  and let the request write its result later.
- `onAbort` is called synchronously and no longer delays the next execution.
- `useFetcher` no longer writes `request.abortController`; the caller's request
  object is not modified. Cancel with `abort()`/`reset()`, or pass
  `request.signal`.
- On failure, `useFetcher`'s `exchange` is the failed request's exchange
  (`exchange.response.status` of a 404 is readable), not `undefined`.
- A query that executes on mount renders `loading` on its first render (it was
  `idle`) unless `initialStatus` is given. Update tests that asserted `idle`.
- `useEventSubscription` subscribes once per `bus` and handler `name`, `order`
  and `once`, and calls the latest `handle`.
- `RouteGuard` calls `onUnauthorized` in an effect after commit, once per
  transition to unauthenticated (it ran during render, twice under StrictMode).
- `useKeyStorage`, and so `useSecurity`/`SecurityProvider`, renders the default
  value on the server and during hydration, then the stored value.
- `useSecurity` re-renders when the refresh token expires, so `authenticated`
  turns `false` on an idle page.

## Entry points

| Entry                              | Holds                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-react`         | Everything below plus CoSec (`SecurityProvider`, `RouteGuard`, `useSecurity`), storage, event and API-hook factories |
| `@ahoo-wang/fetcher-react/core`    | Promise state, `useExecutePromise`, `useQuery`, debounce hooks, `useLatest`, `useStableValue`                        |
| `@ahoo-wang/fetcher-react/fetcher` | `useFetcher`, `useFetcherQuery` and their debounced variants                                                         |

The subpaths load no security, storage or event-bus code. Moving to them is
optional; the root entry still exports everything that remained.
