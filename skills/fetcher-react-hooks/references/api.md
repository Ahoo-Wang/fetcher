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
- [Removed in 6.0 and Subpath Entries](#removed-in-60-and-subpath-entries)
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
The error type parameter `E` defaults to `FetcherError` (from `@ahoo-wang/fetcher`).

---

## Core State Hooks

### usePromiseState

Raw state management for promises without execution logic. Provides `setLoading`, `setSuccess`, `setError`, `setIdle` transitions with unmount-safe checks.
Options: `initialStatus` (default `PromiseStatus.IDLE`), `onSuccess`, `onError`.

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

setLoading(); // status = LOADING, error cleared, previous result kept
setSuccess('data'); // status = SUCCESS, result set (async, calls onSuccess)
setError(err); // status = ERROR, error set, result cleared (async, calls onError)
setIdle(); // status = IDLE, all cleared
```

### useExecutePromise

Manages async operations with race condition protection, AbortController, and unmount safety. Options: `propagateError` (default off: `execute()` resolves even on error), `onAbort`, plus `onSuccess`/`onError`/`initialStatus`. Returns `status`, `loading`, `result`, `error`, `execute`, `reset`, `abort`; unmount aborts the in-flight request. Race protection is built on `useRequestId` — each execution gets an id, and stale resolutions are discarded. Manual cancellation invalidates the id even when the supplier ignores its signal, so late results and errors cannot restore state. Accepts a `PromiseSupplier<R>`:

```typescript
type PromiseSupplier<R> = (abortController: AbortController) => Promise<R>;
```

After StrictMode cleanup cancels an operation, effect replay returns it to idle
unless another execution has started. Cleanup preserves the initial state when
no operation is running.

If the supplier's controller is aborted directly, a still-current execution returns
to idle when it settles, even when the supplier ignores the signal. Cancellation
before the supplier settles prevents `onSuccess` or `onError` from starting. If a
callback is already running, execution waits for it and rechecks cancellation
before settling. An older execution cannot clear a newer execution's state.
`AbortError` remains ignored; other errors still reject `execute()` when
`propagateError` is enabled. Directly aborting the controller does not add an
`onAbort` callback invocation.

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

HTTP-specific hook wrapping Fetcher with `FetchExchange` support. Options are
`RequestOptions` (`resultExtractor`, `attributes`) + `fetcher` (name or instance,
default `fetcherRegistrar.default`) + the `useExecutePromise` options.
`execute(request: FetchRequest)` sets `request.abortController` itself.
**The default `resultExtractor` is the Fetcher default (`ResultExtractors.Exchange`),
so `result` is the `FetchExchange` unless you pass `ResultExtractors.Json`.** Exchange
snapshots follow the same cancellation and stale-request rules as result state.
An exchange remains visible while its result is being extracted. When the current
execution settles after its controller was externally aborted, the exchange is
cleared together with result/error state, including cancellation during extraction
or an async callback. Completion of a superseded request preserves the newer
request's exchange.

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

POST-based query hook with `setQuery`/`getQuery` management. `url` is required; each run sends `POST url` with the query as the JSON body. `resultExtractor` defaults to `ResultExtractors.Json` here, and `autoExecute` defaults to `true` (runs on mount with `initialQuery`). A controlled `query` option is also accepted. `execute()` takes no argument -- it uses the current query from `getQuery()` and does nothing while the query is `undefined`.

```tsx
const { loading, result, execute, setQuery, getQuery } = useFetcherQuery<
  SearchQuery,
  SearchResult
>({
  url: '/api/search',
  initialQuery: { keyword: '', limit: 10 },
  autoExecute: true,
});

setQuery({ keyword: 'hello', limit: 10 }); // executes immediately while autoExecute is on
execute(); // manual re-execute with current query
```

**Key: `useFetcherQuery.execute()` has no parameters. Use `setQuery` to update, `execute` to re-run.**

---

## Generic Query Hooks

### useQuery

Generic query hook with a custom `execute(query, attributes?, abortController?)` function and request cancellation. `autoExecute` defaults to `true`; `attributes` is an option passed through as the second argument. The returned `execute()` takes no argument.

```tsx
const { loading, result, execute, setQuery } = useQuery<UserQuery, User>({
  initialQuery: { id: '1' },
  execute: async (query, attributes, abortController) => {
    const res = await fetch(`/api/users/${query.id}`, {
      signal: abortController?.signal,
    });
    return res.json();
  },
  autoExecute: true,
});
```

### useQueryState

Standalone query state management; returns only `{ getQuery, setQuery }`. `execute` is required (`(query) => Promise<void>`) and `autoExecute` defaults to `true`.
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

## Removed in 6.0 and Subpath Entries

The Wow query hooks and the data-monitor hooks are no longer exported in 6.0; see `$fetcher-v6-migration`.
Two ESM-only subpaths exist besides the root: `@ahoo-wang/fetcher-react/core` (promise/query state, `useRequestId`, utility, fullscreen and debounce hooks — no HTTP, security, storage or event integrations) and `@ahoo-wang/fetcher-react/fetcher` (`useFetcher`, `useFetcherQuery`, `useDebouncedFetcher`, `useDebouncedFetcherQuery`).

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

Fullscreen toggle hook returning `fullscreen`, `getTarget`, `enter(target?)`, `exit`, `toggle(target?)`; the target defaults to `document.documentElement`. `FullscreenProvider` / `useFullscreenContext` share one instance through context.

```tsx
const { fullscreen, toggle, enter, exit } = useFullscreen({
  target: containerRef,
});
```

---

## Storage Hooks

### useKeyStorage

Reactive state for `KeyStorage` with automatic subscription. Returns `[value, set, remove]`; `value` is `T | null` without a default.

```tsx
const [theme, setTheme, removeTheme] = useKeyStorage(themeStorage); // theme: T | null
const [theme2, setTheme2] = useKeyStorage(themeStorage, 'light'); // theme2: T
```

### useImmerKeyStorage

Immer-powered immutable updates for complex objects. Each updater reads the
latest stored value, so consecutive updates in one render batch accumulate.
The updater stays stable while its `KeyStorage` instance is unchanged, including
with inline default objects, and reads the latest committed default when storage
is empty. Defaults are available before descendant layout effects run; a render
that suspends without committing does not change the retained updater's default.
An updater returning `null` removes the key. Only a stored `null` selects the default; a serializer-produced `undefined` is passed to
the updater unchanged. After switching storage instances, a retained updater
continues using its original storage and that storage's last committed default.

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

Subscribe to a `TypedEventBus` with automatic lifecycle management. The effect
re-subscribes whenever `bus` or `handler` identity changes, so keep the handler
stable (module constant or `useMemo`). `bus.on` rejects a duplicate handler
`name` (returns `false`, logged as a warning). Returns `{ subscribe, unsubscribe }`
for manual control.

```tsx
const handler = useMemo(
  () => ({ name: 'myEvent', handle: (event: MyEvent) => console.log(event) }),
  [],
);
useEventSubscription({ bus: eventBus, handler });
// auto-subscribes on mount, unsubscribes (by handler.name) on unmount
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
// apiHooks.useGetUser(options?) -> { loading, result, error, status, execute, reset, abort }
// execute('123') - fully typed; returns Promise<void>
```

Every promise-returning method becomes a `use<Method>` hook. Hook options are the
`useExecutePromise` options plus `onBeforeExecute(abortController, params)`.
The generated `execute` calls `method(...params)` without the AbortController, so
`abort()` only discards the state update; to cancel the HTTP request, push the
controller into `params` in `onBeforeExecute` (decorator methods detect an
`AbortController` argument).

### createQueryApiHooks

Generate query hooks with `useQuery`-based state management. Each method is called as `method(query, attributes, abortController)`, so the first parameter is the query and decorator methods receive the controller. Hook options are the `useQuery` options minus `execute`, plus `onBeforeExecute(abortController, query)`.
Function-valued getters have the same lazy resolution and instance binding as
`createExecuteApiHooks`.

```tsx
const queryHooks = createQueryApiHooks({ api: new UserApi() });
// queryHooks.useGetUser({ initialQuery: '123' }) -> useQuery return; autoExecute defaults to true
```

---

## Security (CoSec)

### SecurityProvider / useSecurityContext / useSecurity / RouteGuard

Wrap the app with `<SecurityProvider tokenStorage={tokenStorage} onSignIn? onSignOut?>` (`TokenStorage` from `@ahoo-wang/fetcher-cosec`). `useSecurityContext()` (throws outside the provider) and `useSecurity(tokenStorage, options?)` return `currentUser` (`ANONYMOUS_USER` when signed out), `authenticated`, `signIn(compositeTokenOrAsyncProvider)`, `signOut()`. `RouteGuard` (`children`, `fallback?`, `onUnauthorized?`) renders children only when authenticated; `RefreshableRouteGuard` (`tokenManager: JwtTokenManager`, `fallback?`, `refreshing?`) tries a token refresh first.

```tsx
import {
  SecurityProvider,
  useSecurityContext,
  RouteGuard,
  RefreshableRouteGuard,
} from '@ahoo-wang/fetcher-react';
```

---

## Debounced Hooks

Rate-limiting variants of core hooks. All take a required
`debounce: { delay, leading?, trailing? }` (`leading` defaults to `false`,
`trailing` to `true`; both `false` throws). They return `run`, `cancel`, and
`isPending` (a function, call `isPending()`) instead of `execute`.
**`useDebouncedQuery` and `useDebouncedFetcherQuery` only auto-execute with an
explicit `autoExecute: true`** (unlike `useQuery`/`useFetcherQuery`, which default
to `true`); their `run()` takes no argument. With `autoExecute: true`, controlled query
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
still cancels either kind of pending work and preserves the existing leading-edge
cooldown. Automatic cancellation also resets that cooldown.
Public cancellation, controlled-query clearing, and automatic cancellation clear
their automatic scheduling marker, so restoring the same controlled value can
schedule it again. Scheduling also supports StrictMode
effect replay, including `{ leading: true, trailing: false }`.
When automatic execution is enabled, syncing the controlled `query` with the
value just passed to `setQuery` does not schedule it again, including with
`{ leading: true, trailing: true }`. Only an invoked callback or a pending timer
marks an automatic query as scheduled; a call suppressed by a leading-only
cooldown does not suppress a later controlled commit of that query. Restoring cancelled automatic work starts a fresh leading window.

- `useDebouncedCallback(callback, options)` - Debounce any callback
- `useDebouncedExecutePromise` - `run(supplier)` debounces promise execution
- `useDebouncedQuery` - Debounce `useQuery` execution
- `useDebouncedFetcher` - `run(request)` debounces HTTP fetches
- `useDebouncedFetcherQuery` - Debounce fetcher queries

```tsx
const { loading, result, setQuery, run, cancel, isPending } =
  useDebouncedFetcherQuery<SearchQuery, SearchResult>({
    url: '/api/search',
    initialQuery: { keyword: '' },
    autoExecute: true, // otherwise only run() executes
    debounce: { delay: 300 },
  });
setQuery({ keyword: 'hel' }); // scheduled after 300 ms of quiet
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
  // API generation
  createExecuteApiHooks,
  createQueryApiHooks,
  // Debounce
  useDebouncedCallback,
  useDebouncedExecutePromise,
  useDebouncedQuery,
  useDebouncedFetcher,
  useDebouncedFetcherQuery,
  // Security
  SecurityProvider,
  useSecurity,
  useSecurityContext,
  RouteGuard,
  RefreshableRouteGuard,
} from '@ahoo-wang/fetcher-react';
```

## Lightweight core import

`@ahoo-wang/fetcher-react/core` (runtime `dist/core.es.js`, types `dist/core/index.d.ts`) and `@ahoo-wang/fetcher-react/fetcher` (`dist/fetcher.es.js`) are ESM-only (no `require` condition). `/core` provides the generic hooks without initializing HTTP/security/storage/event integrations; prefer it for generic execution and debounce in UI libraries.

`useExecutePromise` assigns request order synchronously before awaiting onAbort. Manual abort invalidates useRequestId before releasing the controller, so even sources ignoring cancellation cannot publish stale results or callbacks. There is no return-type change: execute still returns Promise<void>; use state or onSuccess for results.

The root ESM entry, `/core` and `/fetcher` are generated together and share module identity, including FullscreenContext. UMD is built separately. `pnpm --filter @ahoo-wang/fetcher-react test:package` checks built export targets, cross-entry providers/consumers and the core dependency boundary; build runs it automatically. `useExecutePromise.abort` clears its old controller reference before abort notification so synchronous listeners can start a replacement request without losing its cancellation handle.
