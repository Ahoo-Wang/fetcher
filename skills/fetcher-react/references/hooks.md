# `@ahoo-wang/fetcher-react` 6 hooks

## Entry points

| Entry                              | Holds                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `@ahoo-wang/fetcher-react`         | Everything (ESM and UMD)                                                                                                 |
| `@ahoo-wang/fetcher-react/core`    | `PromiseStatus`, `usePromiseState`, `useExecutePromise`, `useQuery`, debounce hooks, `useLatest`, `useStableValue` (ESM) |
| `@ahoo-wang/fetcher-react/fetcher` | `useFetcher`, `useFetcherQuery`, `useDebouncedFetcher`, `useDebouncedFetcherQuery` and their types only (ESM)            |

API factories, storage, event and CoSec hooks are root-only. The subpaths load
no CoSec, storage or event-bus code, but all four `@ahoo-wang/*` peers are
still required peers. `react` `^19.0.0`.

## State and execution

`PromiseState<R, E>` is `{ status, loading, result, error }`; `status` is
`PromiseStatus` (`'idle' | 'loading' | 'success' | 'error'`). The hooks default
`E` to `FetcherError`; the bare `PromiseState<R>` type defaults it to `unknown`.

| Hook                         | Returns / notes                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usePromiseState`            | State with synchronous setters that call nothing                                                                                                               |
| `useExecutePromise(options)` | State + `execute(supplier)`, `abort()`, `reset()`. Options: `onSuccess`, `onError` (awaited, a throw is only logged), `onAbort` (synchronous), `initialStatus` |
| `useQuery(options)`          | State + `execute()`. Options: `query`, `execute(query, abortController)`, `autoExecute` (default `true`), plus the above                                       |
| `useFetcher(options)`        | State + `exchange` + `execute(request)`, `abort()`, `reset()`. Options: `resultExtractor`, `attributes`, `fetcher` (name or instance), plus the above          |
| `useFetcherQuery(options)`   | `useQuery` shape + `exchange`. Options: `url`, `query` (POSTed as JSON), defaults to the JSON extractor                                                        |

- During `loading` the previous `result` is kept. `abort()` while a request is in
  flight returns to `idle` and clears it; with nothing in flight it changes
  nothing. `reset()` cancels and clears.
- `useFetcher` sends `{ ...request, abortController }` with its own controller;
  cancel through `abort()`/`reset()`, or pass `request.signal`. On failure,
  `exchange` is the failed request's (read `exchange?.response?.status`).
- `execute` after the component unmounted resolves `idle` without calling the
  supplier.
- Read the outcome from what `execute` resolves to; the hook's own fields
  update on the next render.

## Debouncing

| Hook                                  | Returns                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `useDebouncedValue(value, { delay })` | `{ value, pending, flush }`                                                  |
| `useDebouncedCallback(fn, options)`   | `{ run, cancel, isPending }`                                                 |
| `useDebouncedExecutePromise`          | State + `run(supplier)`, `cancel`, `isPending`, `abort`, `reset`             |
| `useDebouncedFetcher`                 | State + `exchange` + `run(request)`, `cancel`, `isPending`, `abort`, `reset` |
| `useDebouncedQuery`                   | `useQuery` shape + `pending`, `flush()`                                      |
| `useDebouncedFetcherQuery`            | `useFetcherQuery` shape + `pending`, `flush()`                               |

`debounce: { delay, leading?, trailing? }`; `leading: false` with
`trailing: false` throws. `abort()`/`reset()` do not clear a pending timer;
call `cancel()` too.

## Hooks from a decorator service

```ts
import {
  createExecuteApiHooks,
  createQueryApiHooks,
} from '@ahoo-wang/fetcher-react';

// Module scope, once.
export const { useGetUser, useSearchUsers } = createQueryApiHooks({
  api: userService,
});
export const { useUpdateUser } = createExecuteApiHooks({ api: userService });

// In a component:
const { result } = useGetUser({ query: id });
const { execute, abort } = useUpdateUser({ appendAbortController: true });
await execute(form); // calls userService.updateUser(form, controller)
```

- Hook names are `use` + the capitalized method name; methods come from the
  prototype chain and own properties; getters are never run.
- Query hooks take `{ query, attributes, autoExecute, … }` and call
  `method(query, attributes, abortController)`.
- Execute hooks call `method(...params)`; with `appendAbortController: true`
  they append the controller, so a decorated method's request is cancelled
  (the decorator takes any `AbortController`/`AbortSignal` argument). A
  hand-written method must declare that trailing parameter.

## Storage and events

- `useKeyStorage(keyStorage, defaultValue?)` → `[value, set, remove]`. The
  setter takes a value. `useImmerKeyStorage(keyStorage, defaultValue?)` →
  `[value, update(draft => …), remove]`; an updater that returns `null` removes
  the key. Pass a module-level `KeyStorage`; an inline default object is fine.
- `useEventSubscription({ bus, handler })` → `{ subscribe, unsubscribe }`.
  Subscribes once per `bus` and handler `name`/`order`/`once`, and calls the
  latest `handle`. A `name` already taken on that bus is not subscribed (a
  warning is logged), and unmounting removes only its own subscription.

## CoSec

```tsx
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';
import {
  RouteGuard,
  SecurityProvider,
  useSecurityContext,
} from '@ahoo-wang/fetcher-react';

const tokenStorage = new TokenStorage(); // module scope

export const App = () => (
  <SecurityProvider
    tokenStorage={tokenStorage}
    onSignOut={() => navigate('/login')}
  >
    <RouteGuard fallback={<Login />} onUnauthorized={() => navigate('/login')}>
      <Dashboard />
    </RouteGuard>
  </SecurityProvider>
);

function Dashboard() {
  const { currentUser, signOut } = useSecurityContext();
  return <button onClick={signOut}>{currentUser.sub}</button>;
}
```

- `useSecurity(tokenStorage, { onSignIn, onSignOut })` →
  `{ currentUser, authenticated, signIn, signOut }`. `signIn` takes a
  composite token or `() => Promise<CompositeToken>`. `currentUser` is
  `ANONYMOUS_USER` when signed out.
- `authenticated` is "access token unexpired"; the hook re-renders when the
  refresh token expires. `RouteGuard` calls `onUnauthorized` in an effect, once
  per transition to unauthenticated.
- `RefreshableRouteGuard` (`tokenManager`, `fallback`, `refreshing`) refreshes
  an expired access token instead of rejecting; get the manager from
  `CoSecConfigurer`'s `tokenManager` (it exists when a `tokenRefresher` is set).
- `useSecurityContext` throws outside a `SecurityProvider`.
- On the server and during hydration the provider renders signed out for one
  pass. Render guards client-only if a redirect on that pass would hurt.
