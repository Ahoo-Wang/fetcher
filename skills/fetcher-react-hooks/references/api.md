# Fetcher React Hooks API Reference

## Contents

- [Hook Architecture (Layered Design)](#hook-architecture-layered-design)
- [PromiseStatus State Machine](#promisestatus-state-machine)
- [Core State Hooks](#core-state-hooks)
  - [usePromiseState](#usepromisestate)
  - [useExecutePromise](#useexecutepromise)
- [HTTP Fetch Hooks](#http-fetch-hooks)
  - [useFetcher](#usefetcher)
  - [useFetcherQuery](#usefetcherquery)
- [Generic Query Hooks](#generic-query-hooks)
  - [useQuery](#usequery)
  - [useQueryState](#usequerystate)
- [Wow Query Hooks](#wow-query-hooks)
  - [useListQuery](#uselistquery)
  - [usePagedQuery / useSingleQuery / useCountQuery / useListStreamQuery](#usepagedquery--usesinglequery--usecountquery--useliststreamquery)
  - [Fetcher-based Variants](#fetcher-based-variants)
- [Utility Hooks](#utility-hooks)
  - [useMounted](#usemounted)
  - [useLatest](#uselatest)
  - [useForceUpdate](#useforceupdate)
  - [useRefs](#userefs)
  - [useFullscreen](#usefullscreen)
- [Storage Hooks](#storage-hooks)
  - [useKeyStorage](#usekeystorage)
  - [useImmerKeyStorage](#useimmerkeystorage)
- [Event Hooks](#event-hooks)
  - [useEventSubscription](#useeventsubscription)
- [Data Monitor Hooks](#data-monitor-hooks)
  - [useDataMonitor](#usedatamonitor)
  - [useDataMonitorEventBus](#usedatamonitoreventbus)
- [API Hooks Generation](#api-hooks-generation)
  - [createExecuteApiHooks](#createexecuteapihooks)
  - [createQueryApiHooks](#createqueryapihooks)
- [Security (CoSec)](#security-cosec)
  - [SecurityProvider / useSecurityContext / useSecurity / RouteGuard](#securityprovider--usesecuritycontext--usesecurity--routeguard)
- [Debounced Hooks](#debounced-hooks)
- [Key Imports](#key-imports)

## Hook Architecture (Layered Design)

```
usePromiseState          (raw state machine: PromiseStatus transitions)
  └─> useExecutePromise  (adds execute/abort with AbortController, unmount safety)
        ├─> useFetcher         (HTTP-specific: wraps Fetcher with FetchExchange)
        │     └─> useFetcherQuery  (POST query with setQuery/getQuery)
        └─> useQuery           (generic query with custom execute function)
              ├─> useListQuery / usePagedQuery / useSingleQuery / useCountQuery / useListStreamQuery
              └─> useFetcherListQuery / useFetcherPagedQuery / ... (Fetcher-based variants)
```

---

## PromiseStatus State Machine

```typescript
enum PromiseStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
```

All promise hooks share this state: `status`, `loading` (boolean), `result`, `error`.

---

## Core State Hooks

### usePromiseState

Raw state management for promises without execution logic. Provides `setLoading`, `setSuccess`, `setError`, `setIdle` transitions with unmount-safe checks.

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

setLoading(); // status = LOADING, error cleared
setSuccess('data'); // status = SUCCESS, result set (async, calls onSuccess)
setError(new Error()); // status = ERROR, error set (async, calls onError)
setIdle(); // status = IDLE, all cleared
```

### useExecutePromise

Manages async operations with race condition protection, AbortController, and unmount safety. Race protection is built on `useRequestId` — each execution gets an id, and stale resolutions are discarded. Manual cancellation invalidates the id even when the supplier ignores its signal, so late results and errors cannot restore state. Accepts a `PromiseSupplier<R>`:

```typescript
type PromiseSupplier<R> = (abortController: AbortController) => Promise<R>;
```

After StrictMode cleanup cancels an operation, effect replay returns it to idle
unless another execution has started. Cleanup preserves the initial state when
no operation is running.

If the supplier's controller is aborted directly, a still-current execution returns
to idle when it settles, even when the supplier ignores the signal. Its late value
or error does not invoke `onSuccess` or `onError`. `AbortError` remains ignored;
other errors still reject `execute()` when `propagateError` is enabled. Directly
aborting the controller does not add an `onAbort` callback invocation.

```tsx
const { loading, result, error, execute, reset, abort } =
  useExecutePromise<string>({
    onAbort: () => console.log('Operation aborted'),
  });

// CORRECT: pass a PromiseSupplier (receives AbortController)
execute(abortController =>
  fetch('/api/data', { signal: abortController.signal }).then(res =>
    res.json(),
  ),
);

// New calls auto-cancel previous requests; state updates skip if unmounted
abort(); // manual cancel
reset(); // reset to IDLE
```

**Key: `execute` only accepts `PromiseSupplier<R>`, NOT raw promises.**

---

## HTTP Fetch Hooks

### useFetcher

HTTP-specific hook wrapping Fetcher with `FetchExchange` support. Exchange
snapshots follow the same cancellation and stale-request rules as result state.

```tsx
import { useFetcher } from '@ahoo-wang/fetcher-react';
import { ResultExtractors } from '@ahoo-wang/fetcher';

function UserProfile({ userId }: { userId: string }) {
  const { loading, result, error, exchange, execute, abort } = useFetcher<User>(
    {
      resultExtractor: ResultExtractors.Json,
    },
  );

  const fetchUser = () => {
    execute({ url: `/api/users/${userId}`, method: 'GET' });
  };
  // exchange contains request/response details
}
```

### useFetcherQuery

POST-based query hook with `setQuery`/`getQuery` management. `execute()` takes no argument -- it uses the current query from `getQuery()`.

```tsx
const { loading, result, execute, setQuery, getQuery } = useFetcherQuery<
  SearchQuery,
  SearchResult
>({
  url: '/api/search',
  initialQuery: { keyword: '', limit: 10 },
  autoExecute: true,
});

setQuery({ keyword: 'hello', limit: 10 }); // auto-executes if autoExecute
execute(); // manual re-execute with current query
```

**Key: `useFetcherQuery.execute()` has no parameters. Use `setQuery` to update, `execute` to re-run.**

---

## Generic Query Hooks

### useQuery

Generic query hook with a custom `execute` function and request cancellation.

```tsx
const { loading, result, execute, setQuery } = useQuery<UserQuery, User>({
  initialQuery: { id: '1' },
  execute: async (query, attributes, abortController) => {
    const res = await fetch(`/api/users/${query.id}`, {
      signal: abortController.signal,
    });
    return res.json();
  },
  autoExecute: true,
});
```

### useQueryState

Standalone query state management (getQuery/setQuery) with optional autoExecute.
When `query` is supplied, equal committed values stay deduplicated during
StrictMode replay; this hook does not cancel `execute`. `useQuery` and
`useFetcherQuery` restart their cancelled automatic requests during replay.
Late results from those cancelled requests remain ignored.

```tsx
const { getQuery, setQuery } = useQueryState<UserQuery>({
  initialQuery: { id: '1' },
  autoExecute: true,
  execute: async query => {
    /* ... */
  },
});
```

---

## Wow Query Hooks

Wow-specific query hooks from `@ahoo-wang/fetcher-react`. These wrap `useQuery`
with Wow request unions (`ListQueryRequest`, `PagedQueryRequest`, etc.), so both
`FilterExpression` queries and deprecated `Condition` queries are accepted. They
require a custom `execute` function.

The hooks preserve the concrete request subtype across `initialQuery`, `execute`,
`getQuery`, and `setQuery`. Existing generic option/return types default to the
legacy query subtype; passing a filter query selects the filter-specific overload.

### useListQuery

```tsx
const { result, loading, execute, setQuery } = useListQuery<
  User,
  'id' | 'name'
>({
  initialQuery: {
    filter: filter.matchAll(),
    projection: {},
    sort: [],
    limit: 10,
  },
  execute: async listQuery => fetchListData(listQuery),
  autoExecute: true,
});
```

### usePagedQuery / useSingleQuery / useCountQuery / useListStreamQuery

Same pattern, typed for paged results, single items, counts, and streams
respectively. Count hooks accept `FilterExpression | Condition`; the other hooks
use their corresponding `*QueryRequest` union.

### Fetcher-based Variants

These use `useFetcherQuery` internally (POST-based) and take a `url` option instead of a custom `execute`:

- `useFetcherListQuery` - POST list query via Fetcher
- `useFetcherPagedQuery` - POST paged query via Fetcher
- `useFetcherSingleQuery` - POST single query via Fetcher
- `useFetcherCountQuery` - POST count query via Fetcher
- `useFetcherListStreamQuery` - POST stream query via Fetcher

```tsx
const { result, loading, execute, setQuery } = useFetcherListQuery<
  User,
  keyof User
>({
  url: '/api/users/list',
  initialQuery: listQuery({
    filter: filter.matchAll(),
    sort: [desc('createdAt')],
    limit: 10,
  }),
  autoExecute: true,
});
```

---

## Utility Hooks

### useMounted

Returns a function that checks if the component is still mounted. Used internally by all promise hooks for safe state updates.

```tsx
const isMounted = useMounted();
useEffect(() => {
  someAsyncOp().then(() => {
    if (isMounted()) setState(result); // safe update
  });
}, []);
```

### useLatest

Returns a ref that always holds the latest value. Useful in async callbacks.

```tsx
const latestCount = useLatest(count);
// latestCount.current always reflects the latest count
```

### useForceUpdate

Force a component re-render.

```tsx
const forceUpdate = useForceUpdate();
```

### useRefs

Map-like interface for managing multiple refs by key.

```tsx
const refs = useRefs<HTMLDivElement>();
<div ref={refs.register('myDiv')} />;
const el = refs.get('myDiv');
```

### useFullscreen

Fullscreen toggle hook with `enter`, `exit`, `toggle`, and `fullscreen` state.

```tsx
const { fullscreen, toggle, enter, exit } = useFullscreen({
  target: containerRef,
});
```

---

## Storage Hooks

### useKeyStorage

Reactive state for `KeyStorage` with automatic subscription.

```tsx
const [theme, setTheme, clearTheme] = useKeyStorage(themeStorage);
const [theme, setTheme, clearTheme] = useKeyStorage(themeStorage, 'light'); // with default
```

### useImmerKeyStorage

Immer-powered immutable updates for complex objects. Each updater reads the
latest stored value, so consecutive updates in one render batch accumulate.
The updater stays stable while its `KeyStorage` instance is unchanged, including
with inline default objects, and reads the latest committed default when storage
is empty. After switching storage instances, a retained updater continues using
its original storage and that storage's last committed default.

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

Subscribe to typed event buses with automatic lifecycle management.

```tsx
useEventSubscription({
  bus: eventBus,
  handler: { name: 'myEvent', handle: event => console.log(event) },
});
// auto-subscribes on mount, unsubscribes on unmount
```

---

## Data Monitor Hooks

### useDataMonitor

Monitors data changes via periodic count queries with notification support.
Set `notification.title` and an optional `notification.navigationUrl`. Clicking
a browser notification focuses its receiving window and follows HTTP/HTTPS
navigation. Relative URLs resolve against the receiving page; invalid URLs and
other protocols are ignored. Notification failures do not prevent data-change
events.

```tsx
import { useDataMonitor } from '@ahoo-wang/fetcher-react';
import { eq } from '@ahoo-wang/fetcher-wow';

const { isEnabled, enable, disable, toggle } = useDataMonitor({
  viewId: 'orders',
  countUrl: '/api/orders/count',
  viewName: 'Orders',
  condition: eq('status', 'pending'),
  notification: { title: 'New Orders', navigationUrl: '/orders' },
  interval: 30000,
});
```

### useDataMonitorEventBus

Subscribe to `DataChangedEvent` across components.

```tsx
const { subscribe, unsubscribe } = useDataMonitorEventBus();
subscribe({ name: 'onDataChanged', handle: event => console.log(event) });
```

---

## API Hooks Generation

### createExecuteApiHooks

Generate `useExecutePromise`-based hooks from decorator API classes. Creating the
hook set does not evaluate accessors. Function-valued getters are resolved and
cached when their corresponding hook is first read or the hook set is enumerated,
with both the getter and its returned function bound to the API instance.
The `in` operator, `Object.hasOwn`, and property-descriptor inspection also
resolve the inspected getter. Non-function getters are removed from the hook
set; function-valued getters are cached and evaluated only once.
`Object.keys`, object spread, and `Object.assign` resolve accessors and include
only function-valued getter hooks alongside ordinary methods.
If multiple API names map to the same hook name (for example, `load` and `Load`),
the last function in own-property then prototype traversal order wins.
Non-function getters do not replace a function found earlier in that order.
Generated hooks remain replaceable by assignment before and after getter
resolution. Assigning a replacement before the first read does not evaluate
the API getter.
The shared `collectMethods<T>(api, onAccessor?)` utility still returns a
`Map<string, T>` of bound methods, including functions returned by getters when
called with one argument. Its optional callback has the signature
`onAccessor(name: string, get: () => unknown, methods: ReadonlyMap<string, T>): void`.
It receives each accessor name, a lazy reader, and the bound methods collected
before that accessor. Existing callbacks accepting only `name` and `get` remain
supported. Both ordinary properties and accessors preserve Proxy `get` traps.
Accessor values are read through the original API object, preserving its getter
receiver; these reads are deferred during hook creation.

```tsx
@api('/users')
class UserApi {
  @get('/{id}') getUser(@path('id') id: string): Promise<User> {
    throw autoGeneratedError(id);
  }
  @post('') createUser(@body() data: CreateUser): Promise<User> {
    throw autoGeneratedError(data);
  }
}

const apiHooks = createExecuteApiHooks({ api: new UserApi() });
// apiHooks.useGetUser() -> { loading, result, execute }
// execute('123') - fully typed
```

### createQueryApiHooks

Generate query hooks with `useQuery`-based state management (the generated hook wraps a typed `executeQuery` and calls `useQuery`).
Function-valued getters have the same lazy resolution and instance binding as
`createExecuteApiHooks`.

```tsx
const apiHooks = createQueryApiHooks({ api: new UserApi() });
// apiHooks.useListUsers({ initialQuery: {...}, autoExecute: true })
```

---

## Security (CoSec)

### SecurityProvider / useSecurityContext / useSecurity / RouteGuard

Wrap app with `SecurityProvider` for auth context. Use `useSecurityContext` to access `currentUser`, `authenticated`, `signOut`. `RouteGuard` conditionally renders based on auth status.

```tsx
import {
  SecurityProvider,
  useSecurityContext,
  RouteGuard,
} from '@ahoo-wang/fetcher-react';
```

---

## Debounced Hooks

Rate-limiting variants of core hooks. With `autoExecute: true`, controlled query
changes schedule execution; equal query values do not schedule duplicate work.
Changing a controlled query to `undefined` cancels pending automatic work instead
of rescheduling the last stored query.
If `query` is explicitly present but `undefined`, re-enabling automatic
execution does not schedule the previous stored query. `initialQuery` seeds query
storage only on initialization; a defined `query` takes precedence and updates
that storage. Omitting `query` uses the stored value without resetting it to
`initialQuery`, and manual `run()` remains available.
Switching from an omitted `query` to explicit `query: undefined` cancels pending
automatic work; switching back schedules the stored query again, even
though both property values are `undefined`.
Disabling automatic execution cancels pending automatic work. An explicit
`run()` replaces the current schedule with manual work, which survives later
disabling of automatic execution or clearing of the controlled query. `cancel()`
still cancels either kind of pending work. Scheduling also supports StrictMode
effect replay, including `{ leading: true, trailing: false }`.
When automatic execution is enabled, syncing the controlled `query` with the
value just passed to `setQuery` does not schedule it again, including with
`{ leading: true, trailing: true }`.

- `useDebouncedCallback` - Debounce any callback
- `useDebouncedExecutePromise` - Debounce promise execution
- `useDebouncedQuery` - Debounce query execution
- `useDebouncedFetcher` - Debounce HTTP fetches
- `useDebouncedFetcherQuery` - Debounce fetcher queries

```tsx
const { loading, result, run, cancel, isPending } = useDebouncedFetcherQuery({
  url: '/api/search',
  initialQuery: { keyword: '' },
  debounce: { delay: 300 },
});
```

---

## Key Imports

```tsx
import {
  // State machine
  PromiseStatus,
  usePromiseState,
  // Execution
  useExecutePromise,
  useRequestId,
  // HTTP fetch
  useFetcher,
  useFetcherQuery,
  // Generic query
  useQuery,
  useQueryState,
  // Utility
  useMounted,
  useLatest,
  useForceUpdate,
  useRefs,
  useFullscreen,
  // Storage
  useKeyStorage,
  useImmerKeyStorage,
  // Events
  useEventSubscription,
  // Wow queries (require custom execute function)
  useListQuery,
  usePagedQuery,
  useSingleQuery,
  useCountQuery,
  useListStreamQuery,
  // Wow fetcher queries (POST-based, take url option)
  useFetcherListQuery,
  useFetcherPagedQuery,
  useFetcherSingleQuery,
  useFetcherCountQuery,
  useFetcherListStreamQuery,
  // API generation
  createExecuteApiHooks,
  createQueryApiHooks,
  // Data monitor
  useDataMonitor,
  useDataMonitorEventBus,
  // Security
  SecurityProvider,
  useSecurity,
  useSecurityContext,
  RouteGuard,
} from '@ahoo-wang/fetcher-react';
```
