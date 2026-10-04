---
name: fetcher-react-hooks
description: >
  Drive React component state from requests with `@ahoo-wang/fetcher-react` 6: `useFetcher`, `useFetcherQuery`, `useQuery`, `useExecutePromise`, debounced variants, `useKeyStorage`, `useEventSubscription`, CoSec `SecurityProvider`/`RouteGuard`, and hooks generated from decorator services. Use for loading/error state, cancellation, debounced search, protected routes. Do not load when a hook or option stopped existing after upgrading from 5.x: that is fetcher-v6-migration. CoSec token setup: fetcher-cosec-auth.
---

# fetcher-react-hooks

## Decisions

- **Pick the lowest layer that fits**: `usePromiseState` (raw state) → `useExecutePromise` (execute/abort/reset, unmount-safe) → `useFetcher` (one Fetcher request) / `useQuery` (your own query function) → `useFetcherQuery` (POST a query object). Debounced variants wrap each.
- **Queries are controlled**: keep the query in your own React state and pass it as `query`; the hook executes whenever its content changes (deep-equal, so an inline object literal does not re-run). `query: undefined` means "not ready": nothing runs.
- **Entry points**: the root entry has everything; `@ahoo-wang/fetcher-react/core` (state, query, debounce hooks) and `@ahoo-wang/fetcher-react/fetcher` (`useFetcher`, `useFetcherQuery` and their debounced forms) are ESM-only subpaths without CoSec, storage or event-bus code.
- **From a decorator service**: `createQueryApiHooks({ api: service })` or `createExecuteApiHooks({ api: service })` generate `use<Method>` hooks instead of hand-written wrappers.

## Gotchas a capable model gets wrong

- `execute` takes a `PromiseSupplier` — `(abortController) => promise` — never a promise. It **never rejects**: it resolves to `{ status, result, error }`, the state this execution ended in (`status: 'idle'` when it was cancelled or the component unmounted). Branch on `status`; do not wrap it in `try/catch`.
- Only the latest execution writes state: a new `execute` aborts the previous one, as do `abort()`, `reset()` and unmounting. `abort()` cancels an in-flight request (a settled result stays); `reset()` cancels and clears back to `idle`.
- `useFetcher`'s `result` is the whole `FetchExchange` unless you pass `resultExtractor: ResultExtractors.Json`; `useFetcherQuery` defaults to JSON and sends `POST url` with the query as the body. `exchange` is the exchange behind `result`, or behind `error` when it is an `ExchangeError` — read `exchange?.response?.status` of a 404 there.
- `useFetcher` owns cancellation: it sends `{ ...request, abortController }`, so an `abortController` you put on the request is replaced; cancel with `abort()`, or pass `request.signal`.
- Query hooks' `execute()` takes no arguments and re-runs the current query. `useQuery`'s `execute` option is `(query, abortController) => Promise<R>`. An auto-executing query renders `loading` on its first render.
- `useDebouncedQuery` / `useDebouncedFetcherQuery` follow the controlled `query`: the first query runs at once, later changes after `debounce.delay`. They return `pending` (a boolean) and `flush()` (apply the waiting query now). `useDebouncedValue(value, { delay })` debounces any value. `useDebouncedCallback`, `useDebouncedExecutePromise` and `useDebouncedFetcher` instead return `run(...args)`, `cancel()` and `isPending()`.
- Generated query hooks take `{ query, attributes, autoExecute }` and call `method(query, attributes, abortController)`. That fits any one-input method, `getUser(@path('id') id)` included (a decorator method ignores the undecorated extra argument and finds the controller anywhere), so a read that follows an id passes `{ query: id }` to its query hook, not an id to an execute hook from an effect. Generated execute hooks pass the controller to the method only when the generated hook itself is called with `appendAbortController: true` (a hook option: the factories take only `{ api }`); otherwise `abort()` only drops the state update.
- `useEventSubscription` subscribes once per `bus` and handler `name`; it calls the latest `handle`, so an inline handler is fine.
- CoSec in React: wrap the app in `SecurityProvider` with the **same** `TokenStorage` instance the `CoSecConfigurer` uses (a second `new TokenStorage()` keeps its own cache and misses sign-ins until reload). Read `authenticated` / `currentUser` / `signIn` / `signOut` from `useSecurityContext()`. `RouteGuard`'s `onUnauthorized` runs in an effect after commit, so `navigate('/login')` there is safe; never navigate during render. `RefreshableRouteGuard` takes `configurer.tokenManager`.

## Minimal example

```tsx
import { useState } from 'react';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';

export function Search() {
  const [query, setQuery] = useState({ keyword: '' });
  const { loading, result, error, pending } = useDebouncedFetcherQuery<
    { keyword: string },
    { items: string[] }
  >({ url: '/api/search', query, debounce: { delay: 300 } });
  return (
    <>
      <input
        value={query.keyword}
        onChange={e => setQuery({ keyword: e.target.value })}
      />
      {error ? <p>{error.message}</p> : null}
      {loading || pending ? '…' : result?.items.join(', ')}
    </>
  );
}
```

```tsx
const { execute } = useExecutePromise<Order>();
const onSubmit = async () => {
  const { status, error } = await execute(ac => api.placeOrder(form, ac));
  if (status === 'success') navigate('/done');
  else if (status === 'error') toast(error?.message);
};
```

```tsx
import { useNavigate } from 'react-router';
import { RouteGuard, SecurityProvider } from '@ahoo-wang/fetcher-react';
import { tokenStorage } from './http'; // the TokenStorage given to CoSecConfigurer

export function App() {
  const navigate = useNavigate();
  return (
    <SecurityProvider tokenStorage={tokenStorage}>
      <RouteGuard onUnauthorized={() => navigate('/login')}>
        <Dashboard />
      </RouteGuard>
    </SecurityProvider>
  );
}
```

## References

- `references/api.md`: hook signatures and return fields, `PromiseStatus` transitions, cancellation rules, debounced hooks, storage and event hooks, API hook generation and CoSec components. Load it for exact options.

## Related Skills

- $fetcher-integration: the Fetcher, interceptors and result extractors underneath.
- $fetcher-decorator-service: services that `createExecuteApiHooks` / `createQueryApiHooks` wrap.
- $fetcher-storage: `KeyStorage` behind `useKeyStorage`.
- $fetcher-eventbus: buses behind `useEventSubscription`.
- $fetcher-cosec-auth: tokens behind `SecurityProvider`.
- $fetcher-v6-migration: upgrading 5.x hook code and hooks removed in 6.0.
