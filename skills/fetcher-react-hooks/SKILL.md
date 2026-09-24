---
name: fetcher-react-hooks
description: >
  Drive React component state from requests with `@ahoo-wang/fetcher-react`: `useFetcher`, `useFetcherQuery`, `useQuery`, `useExecutePromise`, debounced variants, `useKeyStorage`, `useEventSubscription`, CoSec `SecurityProvider`/`RouteGuard`, and hooks generated from decorator services. Use for React components in a Fetcher app: loading/error state, abort on unmount, stale-result races, debounced search boxes. Not when a hook is no longer exported after the Fetcher 6 upgrade — load fetcher-v6-migration instead.
---

# fetcher-react-hooks

## Decisions

- **Pick the lowest layer that fits**: `usePromiseState` (raw state) → `useExecutePromise` (execute/abort, unmount-safe) → `useFetcher` (one Fetcher request) / `useQuery` (your own query function) → `useFetcherQuery` (POST a query object). Debounced variants wrap each.
- **Entry points**: the root entry has everything; `@ahoo-wang/fetcher-react/core` (state, query, debounce, utility hooks) and `@ahoo-wang/fetcher-react/fetcher` (`useFetcher`, `useFetcherQuery` and their debounced forms) are ESM-only subpaths without CoSec, storage or event-bus code.
- **From a decorator service**: `createQueryApiHooks({ api: service })` or `createExecuteApiHooks({ api: service })` generate `use<Method>` hooks instead of hand-written wrappers.

## Gotchas a capable model gets wrong

- `useFetcher`'s `result` is the whole `FetchExchange` unless you pass `resultExtractor: ResultExtractors.Json`; `useFetcherQuery` defaults to JSON and sends `POST` with the query as the body.
- `useQuery`, `useFetcherQuery` and `useQueryState` default `autoExecute` to `true` (run on mount); the debounced query hooks run automatically only with an explicit `autoExecute: true`.
- `execute` takes a `PromiseSupplier` — `(abortController) => promise` — never a promise, and resolves to `void`: read data from `result` or `onSuccess`. Errors are kept in `error`, not thrown, unless `propagateError: true`.
- Query hooks: change input with `setQuery` (it re-runs while `autoExecute` is on); `execute()` takes no arguments.
- Debounced hooks expose `run`, `cancel` and `isPending()` (a function); `debounce: { delay }` is required.
- `createExecuteApiHooks` hooks do not pass the AbortController to the service method, so `abort()` only drops the state update.
- `useEventSubscription` re-subscribes when the `handler` object identity changes — memoize it.

## Minimal example

```tsx
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

export function Search() {
  const { loading, result, error, setQuery } = useFetcherQuery<
    { keyword: string },
    { items: string[] }
  >({ url: '/api/search', initialQuery: { keyword: '' } });
  if (error) return <p>{String(error)}</p>;
  return (
    <>
      <input onChange={e => setQuery({ keyword: e.target.value })} />
      {loading ? '…' : result?.items.join(', ')}
    </>
  );
}
```

## References

- `references/api.md`: hook signatures and return fields, `PromiseStatus` transitions, debounced options, storage and event hooks, API hook generation and CoSec components. Load it for exact options.

## Related Skills

- $fetcher-integration: the Fetcher, interceptors and result extractors underneath.
- $fetcher-decorator-service: services that `createExecuteApiHooks` / `createQueryApiHooks` wrap.
- $fetcher-storage: `KeyStorage` behind `useKeyStorage`.
- $fetcher-eventbus: buses behind `useEventSubscription`.
- $fetcher-cosec-auth: tokens behind `SecurityProvider`.
- $fetcher-v6-migration: hooks removed in 6.0.
