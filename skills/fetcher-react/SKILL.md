---
name: fetcher-react
description: >
  Build React components on `@ahoo-wang/fetcher-react` 6: `useFetcher`, `useQuery`, `useFetcherQuery`, `useExecutePromise`, debounced search, cancellation and stale results, hooks generated from decorator services, `useKeyStorage`, `useEventSubscription`, and CoSec `SecurityProvider`/`RouteGuard`. Use for loading, error and abort state in a Fetcher React app. Not for 5.x code that stopped compiling after upgrading — that is fetcher-v6-migration.
---

# Fetcher in React

Every hook here follows one model; most mistakes come from assuming React
Query, SWR or the 5.x API instead.

- **A request is identified by its `AbortController`.** Only the latest
  execution writes state; a newer execution, `abort()`, `reset()` and
  unmounting abort the previous one. Do not add request-id or `isMounted`
  guards.
- **`execute` takes a supplier and never rejects.** It is
  `execute(abortController => promise)` and resolves to the state the execution
  ended in: `{ status: 'success' | 'error' | 'idle', result, error }` (`idle`
  when cancelled). Branch on `status`; `try/catch` catches nothing.
- **Queries are controlled.** Keep the query in your own React state and pass it
  as `query`; the hook runs on mount and whenever the query's content (compared
  deeply) changes. `query: undefined` means "not ready". Only the query content
  and `autoExecute` trigger a run: a new `execute` function, `url` or
  `attributes` does not, so put such inputs in the query or call `execute()`.

## Pick a hook

| Need                                           | Hook                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| Load data from inputs, re-run when they change | `useQuery({ query, execute: (query, abortController) => … })`         |
| POST a query object to a URL                   | `useFetcherQuery({ url, query })` (always `POST`, query as JSON body) |
| A request on demand (button, form)             | `useExecutePromise()` or `useFetcher()`                               |
| Search as the user types                       | `useDebouncedQuery` / `useDebouncedFetcherQuery`                      |
| A decorator service's methods as hooks         | `createQueryApiHooks` / `createExecuteApiHooks`, at module scope      |
| A persisted value                              | `useKeyStorage(keyStorage, defaultValue?)`                            |
| Subscribe to an event bus                      | `useEventSubscription({ bus, handler })`                              |
| Sign-in state, protected routes                | `SecurityProvider`, `useSecurityContext`, `RouteGuard`                |

## Gotchas

1. **`useFetcher` returns the `FetchExchange` as `result`** unless you pass
   `resultExtractor: ResultExtractors.Json`; `useFetcher<User>()` is then typed
   as the user but holds an exchange. `useFetcherQuery` and decorated methods default
   to JSON. Select a named client with `fetcher: 'api'`.
2. **Pass the controller on.** If the supplier ignores
   `abortController.signal`, cancelling only drops the state write and the
   request keeps running. `fetcher.get(url, { abortController })`; decorated
   methods take it as an extra argument.
3. **`useFetcherQuery` always POSTs.** For a GET endpoint use `useQuery` with
   `fetcher.get(…, { urlParams, abortController }, { resultExtractor: ResultExtractors.Json })`.
4. **Query hooks run themselves; `useFetcher` and `useExecutePromise` do
   not.** A query's first render is `loading`. Its `execute()` takes no
   arguments and re-runs the current query.
5. **`abort()` during a refetch clears the result shown before; `reset()`
   always clears.** An abort error ends in `idle`, not `error`.
6. **StrictMode in development sends the mount request twice** and aborts the
   first; callbacks fire once. Expected, not a bug to fix with refs.
7. **Debounced query hooks** return `pending` (boolean) and `flush()`. A query
   defined on the first render runs at once; later changes, and a query that
   goes from `undefined` to defined, wait `debounce.delay`. To wait for input,
   pass `query: keyword ? { keyword } : undefined`. The other debounced hooks
   return `run()` (returns nothing to await), `cancel()`, `isPending()`; `cancel()`
   does not abort a request in flight.
8. **Generated hooks**: create them once at module scope (inside a component
   they give an unstable `execute`). Execute hooks pass the controller to the
   method only with `appendAbortController: true`. Query hooks call
   `method(query, attributes, abortController)`.
9. **`useKeyStorage` takes a value, not an updater**; use `useImmerKeyStorage`
   to update from the current value. The `KeyStorage` must be a stable
   (module-level) instance. On the server and during hydration it renders the
   default value, then the stored one.
10. **`useEventSubscription` handler names are unique per bus**: two mounted
    instances with the same `handler.name` leave the second unsubscribed. Derive
    the name per instance (React's useId).
11. **`authenticated` means the access token is unexpired.** After it expires a
    re-render turns `authenticated` false even though the refresh token still
    works, and `RouteGuard` then shows `fallback` and calls `onUnauthorized`. For
    routes that should survive expiry use `RefreshableRouteGuard` with the
    `tokenManager`. Both guards need a `SecurityProvider` above them.

## Examples

```tsx
import { useState } from 'react';
import { ResultExtractors, fetcherRegistrar } from '@ahoo-wang/fetcher';
import { useDebouncedQuery, useExecutePromise } from '@ahoo-wang/fetcher-react';

const api = fetcherRegistrar.requiredGet('api');

export function UserSearch() {
  const [keyword, setKeyword] = useState('');
  const { loading, result, error, pending, flush } = useDebouncedQuery<
    { keyword: string },
    User[]
  >({
    query: keyword ? { keyword } : undefined,
    debounce: { delay: 300 },
    execute: (query, abortController) =>
      api.get<User[]>(
        '/users',
        { urlParams: { query }, abortController },
        { resultExtractor: ResultExtractors.Json },
      ),
  });
  return (
    <>
      <input
        value={keyword}
        onChange={event => setKeyword(event.target.value)}
        onKeyDown={event => event.key === 'Enter' && flush()}
      />
      {error ? <p>{error.message}</p> : null}
      {loading || pending ? (
        <p>…</p>
      ) : (
        result?.map(user => <p key={user.id}>{user.name}</p>)
      )}
    </>
  );
}

export function SaveButton({ form }: { form: UpdateUser }) {
  const { loading, execute, abort } = useExecutePromise<User>();
  const save = async () => {
    const { status, result, error } = await execute(abortController =>
      userService.updateUser(form, abortController),
    );
    if (status === 'success') toast(`Saved ${result?.name}`);
    else if (status === 'error') toast(error?.message);
  };
  return (
    <>
      <button disabled={loading} onClick={save}>
        Save
      </button>
      <button onClick={abort}>Cancel</button>
    </>
  );
}
```

`references/hooks.md` has the hook inventory with entry points, options and
return fields, API hook generation, storage, event and CoSec components.

For the client, interceptors, decorator services and CoSec setup underneath,
use $fetcher. For upgrading 5.x hook code, use $fetcher-v6-migration.
