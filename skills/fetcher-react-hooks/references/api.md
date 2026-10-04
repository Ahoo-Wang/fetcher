# Fetcher React Hooks API Reference (6.x)

## Contents

- [Model](#model)
- [Hook Layers](#hook-layers)
- [PromiseStatus and PromiseState](#promisestatus-and-promisestate)
- [Core State Hooks](#core-state-hooks)
  - [usePromiseState](#usepromisestate)
  - [useExecutePromise](#useexecutepromise)
- [Query Hooks](#query-hooks)
  - [useQuery](#usequery)
  - [useFetcherQuery](#usefetcherquery)
- [useFetcher](#usefetcher)
- [Debounced Hooks](#debounced-hooks)
- [Utility Hooks](#utility-hooks)
- [Storage Hooks](#storage-hooks)
- [Event Hooks](#event-hooks)
- [API Hooks Generation](#api-hooks-generation)
- [Security (CoSec)](#security-cosec)
- [Entry Points](#entry-points)
- [Key Imports](#key-imports)

## Model

A request is identified by its `AbortController`. Only the current execution
may write state; replacing it with a newer one, `abort()`, `reset()` and
unmounting all abort it. State is one value `{ status, loading, result, error }`.
`execute` never rejects: it resolves to the state this execution ended in
(`idle` when cancelled). Queries are controlled: the query lives in the
caller's state and is passed in; the hook executes when its content
(deep-equal) changes.

Removed in 6.0 (see `$fetcher-v6-migration`): the fullscreen hooks, the small
utility hooks for refs, mount checks, forced updates and request ids, the
standalone query-state hook, the `propagateError` option, `initialQuery` /
`setQuery` / `getQuery` on query hooks, and `onBeforeExecute` on generated
hooks. Never suggest them for 6.x code.

## Hook Layers

```
usePromiseState          (state: idle → loading → success | error)
  └─> useExecutePromise  (execute / abort / reset, one execution at a time)
        ├─> useFetcher         (sends a FetchRequest through a Fetcher)
        │     └─> useFetcherQuery  (controlled query sent as POST url, JSON)
        └─> useQuery           (controlled query, your own execute function)
```

---

## PromiseStatus and PromiseState

```typescript
const PromiseStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;
type PromiseStatus = 'idle' | 'loading' | 'success' | 'error';

interface PromiseState<R, E> {
  status: PromiseStatus;
  loading: boolean; // status === 'loading'
  result: R | undefined; // kept while a new execution is loading
  error: E | undefined;
}
```

`PromiseStatus` is a const object and a literal union, so both
`status === PromiseStatus.SUCCESS` and `status === 'success'` type-check.
`loading` keeps the previous `result` and clears `error`; `error` clears
`result`; `idle` clears both. The error type `E` defaults to `FetcherError`
(from `@ahoo-wang/fetcher`).

---

## Core State Hooks

### usePromiseState

Raw state with stable, synchronous setters. Option: `initialStatus` (default
`'idle'`). No callbacks.

```tsx
const {
  status,
  loading,
  result,
  error,
  setLoading,
  setSuccess,
  setError,
  setIdle,
} = usePromiseState<string>();
```

### useExecutePromise

```typescript
type PromiseSupplier<R> = (abortController: AbortController) => Promise<R>;

useExecutePromise<R, E = FetcherError>(options?: {
  initialStatus?: PromiseStatus;
  onSuccess?: (result: R) => void | Promise<void>;
  onError?: (error: E) => void | Promise<void>;
  onAbort?: () => void;
}): PromiseState<R, E> & {
  execute(supplier: PromiseSupplier<R>): Promise<PromiseState<R, E>>;
  abort(): void;
  reset(): void;
};
```

- `execute` cancels the execution in flight, then runs `supplier` with a new
  controller. It **never rejects**; it resolves to `success`, `error`, or
  `idle` when this execution was cancelled (or the component already
  unmounted — then the supplier does not run).
- `onSuccess` / `onError` run only for the current execution and are awaited
  by `execute`; a throwing callback is reported with `console.error`.
- `onAbort()` is called synchronously when an in-flight execution is
  cancelled (newer execution, `abort`, `reset`, unmount). It is not awaited.
- `abort()`: cancels the in-flight execution, which returns to `idle`. With
  nothing in flight it changes nothing — a settled result stays.
- `reset()`: cancels the in-flight execution and returns to `idle`, clearing
  `result` and `error`.
- An `AbortError` thrown from a signal of the caller's own ends in `idle`, not
  `error`.
- Pass the supplier's `abortController.signal` on, or cancellation only drops
  the state update.

```tsx
const { loading, result, error, execute, abort, reset } =
  useExecutePromise<Data>();

// CORRECT: a supplier, which receives the AbortController
const { status, result: data } = await execute(abortController =>
  fetch('/api/data', { signal: abortController.signal }).then(res =>
    res.json(),
  ),
);
if (status === 'success') use(data);

// WRONG: execute(fetch('/api/data')) — the request already started, and
// abort() cannot cancel it.
```

---

## Query Hooks

### useQuery

```typescript
useQuery<Q, R, E = FetcherError>(options: {
  query?: Q; // undefined = not ready, nothing runs
  execute: (query: Q, abortController: AbortController) => Promise<R>;
  autoExecute?: boolean; // default true
  // + initialStatus, onSuccess, onError, onAbort
}): PromiseState<R, E> & {
  execute(): Promise<PromiseState<R, E>>; // runs the current query
  abort(): void;
  reset(): void;
};
```

- Re-executes when the query content changes (compared with `dequal`) or
  `autoExecute` turns on. An inline object equal to the last one does not
  re-run; the latest `execute` option is used without re-running.
- First render is `loading` when it will execute on mount (unless
  `initialStatus` is given).
- `execute()` resolves to `idle` while `query` is `undefined`.

```tsx
const [query, setQuery] = useState<UserQuery>({ id: '1' });
const { loading, result, error, execute } = useQuery<UserQuery, User>({
  query,
  execute: (query, abortController) =>
    fetch(`/api/users/${query.id}`, { signal: abortController.signal }).then(
      res => res.json(),
    ),
});
// setQuery({ id: '2' }) → runs again; execute() → re-runs { id: '2' }
```

Wait for input: pass `query: ready ? query : undefined`, or
`autoExecute: false` and call `execute()` yourself.

### useFetcherQuery

`useFetcher` options plus `url` (required), `query?`, `autoExecute?`
(default `true`). Each run sends `POST url` with the query as the JSON body;
`resultExtractor` defaults to JSON here. Returns the `useQuery` shape plus
`exchange`.

```tsx
const [query, setQuery] = useState<SearchQuery>({ keyword: '', limit: 10 });
const { loading, result, error, exchange, execute } = useFetcherQuery<
  SearchQuery,
  SearchResult
>({ url: '/api/search', query });
```

---

## useFetcher

```typescript
useFetcher<R, E = FetcherError>(options?: {
  fetcher?: string | Fetcher; // default fetcherRegistrar.default
  resultExtractor?: ResultExtractor; // default: the Fetcher's (the exchange)
  attributes?: Record<string, any> | Map<string, any>;
  // + initialStatus, onSuccess, onError, onAbort
}): PromiseState<R, E> & {
  exchange: FetchExchange | undefined;
  execute(request: FetchRequest): Promise<PromiseState<R, E>>;
  abort(): void;
  reset(): void;
};
```

- **`result` is the whole `FetchExchange` unless you pass
  `resultExtractor: ResultExtractors.Json`** (or another extractor).
- `exchange` is the exchange behind `result`, or behind `error` when that is
  an `ExchangeError` (e.g. `HttpStatusValidationError` for a 404) — read
  `exchange?.response?.status` there.
- The caller's request is not modified: the hook sends
  `{ ...request, abortController }`. An `abortController` on the request is
  replaced; a `request.signal` still applies. Cancel with `abort()`/`reset()`.

```tsx
import { useFetcher } from '@ahoo-wang/fetcher-react';
import { ResultExtractors } from '@ahoo-wang/fetcher';

function UserProfile({ userId }: { userId: string }) {
  const { loading, result, error, exchange, execute } = useFetcher<User>({
    resultExtractor: ResultExtractors.Json,
  });
  useEffect(() => {
    execute({ url: `/api/users/${userId}` });
  }, [execute, userId]);
  if (exchange?.response?.status === 404) return <p>Not found</p>;
  // …
}
```

---

## Debounced Hooks

`debounce: { delay, leading?, trailing? }` is required (`leading` defaults to
`false`, `trailing` to `true`; both `false` throws).

Query hooks — follow the controlled query:

- `useDebouncedQuery({ ...useQuery options, debounce })`
- `useDebouncedFetcherQuery({ ...useFetcherQuery options, debounce })`

They return the query hook's fields plus `pending: boolean` (a query change is
waiting) and `flush()` (apply it now). The first query executes at once; later
changes after `debounce.delay`. `autoExecute` defaults to `true` as in the
plain query hooks. `execute()` re-runs the applied query.

```tsx
const [query, setQuery] = useState({ keyword: '' });
const { loading, result, error, pending, flush } = useDebouncedFetcherQuery<
  SearchQuery,
  SearchResult
>({ url: '/api/search', query, debounce: { delay: 300 } });
// <input onChange={e => setQuery({ keyword: e.target.value })} />
// Enter key: flush()
```

Value:

- `useDebouncedValue(value, { delay, leading?, trailing? })` →
  `{ value, pending, flush }`. The first render returns `value` itself;
  content is compared deeply.

Callbacks — debounce calls through `run`:

- `useDebouncedCallback(callback, { delay, … })` → `{ run, cancel, isPending }`
- `useDebouncedExecutePromise({ ...useExecutePromise options, debounce })` →
  state + `run(supplier)`, `cancel()`, `isPending()`, `abort()`, `reset()`
- `useDebouncedFetcher({ ...useFetcher options, debounce })` → state +
  `exchange` + `run(request)`, `cancel()`, `isPending()`

`isPending` is a function; `pending` (query hooks, `useDebouncedValue`) is a
boolean.

---

## Utility Hooks

- `useLatest(value)` → a ref holding the latest committed value, updated after
  each render commits. Effects and async callbacks see the new value; reading
  `.current` during render gives the last committed one.
- `useStableValue(value)` → `value`, keeping the previous reference while the
  content is deeply equal, so an inline object can drive an effect.

---

## Storage Hooks

### useKeyStorage

Reactive state for `KeyStorage` with automatic subscription. Returns
`[value, set, remove]`; `value` is `T | null` without a default. On the server
and during hydration it renders the default (`defaultValue ?? null`), then the
stored value, so SSR markup matches. `useSecurity` / `SecurityProvider` inherit
this.

```tsx
const [theme, setTheme, removeTheme] = useKeyStorage(themeStorage); // T | null
const [theme2, setTheme2] = useKeyStorage(themeStorage, 'light'); // T
```

### useImmerKeyStorage

Immer-powered updates for stored objects. Each updater reads the latest stored
value, so consecutive updates in one batch accumulate. An updater returning
`null` removes the key.

```tsx
const [prefs, updatePrefs, resetPrefs] = useImmerKeyStorage(
  prefsStorage,
  defaultPrefs,
);
updatePrefs(draft => {
  draft.volume = 80;
});
```

---

## Event Hooks

### useEventSubscription

`useEventSubscription({ bus, handler })` subscribes on mount and unsubscribes
(by `handler.name`) on unmount. It subscribes once per `bus` and handler
`name` / `order` / `once`, and always calls the latest `handle` — an inline
handler does not resubscribe each render. `bus.on` rejects a duplicate handler
`name` (a warning is logged), and unmount then leaves that other subscription
alone. Returns `{ subscribe, unsubscribe }` for manual control.

```tsx
useEventSubscription({
  bus: eventBus,
  handler: { name: 'myEvent', handle: (event: MyEvent) => setLast(event) },
});
```

---

## API Hooks Generation

Both factories collect the API object's methods with `collectMethods(api)`:
own and prototype-chain function properties, bound to the object, nearest
definition wins; `constructor` and accessors are skipped (getters never run, so
a function returned by a getter does not become a hook). `getUser` becomes
`useGetUser` (`methodNameToHookName`).

```tsx
@api('/users')
class UserApi {
  @get('/{id}') getUser(@path('id') id: string): Promise<User> {
    throw autoGeneratedError(id);
  }
  @post('') updateUser(@body() data: UpdateUser): Promise<User> {
    throw autoGeneratedError(data);
  }
  @post('/search') searchUsers(
    @body() query: UserQuery,
    @attribute() attributes?: Record<string, any>,
    abortController?: AbortController,
  ): Promise<User[]> {
    throw autoGeneratedError(query, attributes, abortController);
  }
}
const userApi = new UserApi();
```

### createExecuteApiHooks

```tsx
const { useGetUser, useUpdateUser } = createExecuteApiHooks({ api: userApi });

const { loading, result, error, execute, abort, reset } = useUpdateUser({
  appendAbortController: true,
  onSuccess: user => toast(`Saved ${user.name}`),
});
const { status } = await execute(form); // typed params; never rejects
```

Options (`UseApiMethodExecuteOptions<TData, E>`): `initialStatus`,
`onSuccess`, `onError`, `onAbort`, `appendAbortController` (default `false`).
`execute(...params)` resolves to the `PromiseState`. Without
`appendAbortController` it calls `method(...params)`, so `abort()` only drops
the state update; with it, `method(...params, abortController)` — decorator
methods detect a trailing `AbortController`, so cancelling cancels the HTTP
request. Keep it off for methods with optional trailing parameters (the
controller would fill that slot).

### createQueryApiHooks

```tsx
const { useSearchUsers } = createQueryApiHooks({ api: userApi });

const [query, setQuery] = useState<UserQuery>({ name: '' });
const { loading, result, execute } = useSearchUsers({
  query,
  attributes: { tenant },
});
```

Options (`UseApiMethodQueryOptions<Q, TData, E>`): the `useQuery` options
without `execute` — `query`, `autoExecute` (default `true`), callbacks,
`initialStatus` — plus `attributes`. Each run calls
`method(query, attributes, abortController)`; returns the `useQuery` shape.

---

## Security (CoSec)

The Fetcher side (`CoSecConfigurer`, `TokenStorage`, refresh) is
`$fetcher-cosec-auth`; these components only read and write the token storage.

Wrap the app with `<SecurityProvider tokenStorage={tokenStorage} onSignIn? onSignOut?>`,
passing the **same** `TokenStorage` instance given to `CoSecConfigurer` (a
second instance has its own cache and bus and does not see the other's writes
until `reload()`). `useSecurityContext()` (throws outside the provider) and
`useSecurity(tokenStorage, options?)` return:

- `currentUser`: the stored access token's payload, even once expired;
  `ANONYMOUS_USER` when no token is stored.
- `authenticated`: the access token is unexpired. Re-renders when the refresh
  token expires; an expired but refreshable access token does not re-render
  (the next request renews it).
- `signIn(token | () => Promise<token>)`: async, stores a `CompositeToken`
  (`{ accessToken, refreshToken }`), then calls `onSignIn`.
- `signOut()`: removes the token, then calls `onSignOut`.

On the server and during hydration they render the default (anonymous), then
the stored value.

`RouteGuard` (`children`, `fallback?`, `onUnauthorized?`) renders children only
when authenticated, otherwise `fallback`; it calls `onUnauthorized` in an
effect after commit, once each time the user becomes (or starts out)
unauthenticated, so `navigate('/login')` there is safe.

`RefreshableRouteGuard` (`tokenManager: JwtTokenManager` — e.g.
`configurer.tokenManager` — `fallback?`, `refreshing?`) refreshes on mount when
the access token is expired but refreshable, rendering `refreshing` (default
`<p>Refreshing...</p>`) meanwhile and `fallback` when nothing is refreshable.
If the refresh rejects, the error is logged and it renders `fallback` — also
after a `RefreshUnavailableError` (server unreachable), where the session is
kept, so a later request can still renew the token.

```tsx
import {
  SecurityProvider,
  useSecurityContext,
  RouteGuard,
  RefreshableRouteGuard,
} from '@ahoo-wang/fetcher-react';
```

---

## Entry Points

| Entry                              | Formats  | Holds                                                                                                                                                |
| ---------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-react`         | ESM, UMD | everything                                                                                                                                           |
| `@ahoo-wang/fetcher-react/core`    | ESM      | `PromiseStatus`, `usePromiseState`, `useExecutePromise`, `useQuery`, `useLatest`, `useStableValue`, the debounced callback/value/promise/query hooks |
| `@ahoo-wang/fetcher-react/fetcher` | ESM      | `useFetcher`, `useFetcherQuery`, `useDebouncedFetcher`, `useDebouncedFetcherQuery` and their types                                                   |

Neither subpath loads CoSec, storage or event-bus code. Peer: `react` `^19.0.0`.

## Key Imports

```tsx
import {
  // State and execution
  PromiseStatus,
  usePromiseState,
  useExecutePromise,
  // Queries
  useQuery,
  useFetcher,
  useFetcherQuery,
  // Debounce
  useDebouncedCallback,
  useDebouncedValue,
  useDebouncedExecutePromise,
  useDebouncedQuery,
  useDebouncedFetcher,
  useDebouncedFetcherQuery,
  // Utility
  useLatest,
  useStableValue,
  // Storage and events
  useKeyStorage,
  useImmerKeyStorage,
  useEventSubscription,
  // API generation
  createExecuteApiHooks,
  createQueryApiHooks,
  collectMethods,
  // Security
  SecurityProvider,
  useSecurity,
  useSecurityContext,
  RouteGuard,
  RefreshableRouteGuard,
} from '@ahoo-wang/fetcher-react';
import type {
  PromiseState,
  PromiseSupplier,
  UseExecutePromiseOptions,
  UseQueryOptions,
  UseFetcherOptions,
  UseFetcherQueryOptions,
  UseDebouncedQueryReturn,
  UseDebouncedValueReturn,
  UseApiMethodExecuteOptions,
  UseApiMethodQueryOptions,
} from '@ahoo-wang/fetcher-react';
```
