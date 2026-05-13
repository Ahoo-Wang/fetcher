---
name: fetcher-react-hooks
description: >
  React hooks for data fetching with Fetcher. Covers the layered hook architecture (usePromiseState -> useExecutePromise -> useFetcher/useQuery -> useFetcherQuery), PromiseStatus state machine, useFetcher, useQuery, useFetcherQuery, usePromise, useKeyStorage, useImmerKeyStorage, useEventSubscription, useMounted, useLatest, useForceUpdate, useFullscreen, useRefs, createQueryApiHooks, and data monitor hooks.
  Use for: React hooks, useFetcher, useQuery, usePromise, data fetching, loading state, promise state, AbortController, abort, race condition, reactive storage, event subscription.
---

# fetcher-react-hooks Skill

## Trigger Conditions

- User wants React hooks for data fetching or state management
- User mentions `useFetcher`, `useQuery`, `usePromise`, `useExecutePromise`
- User asks about React integration with Fetcher
- User mentions `useMounted`, `useLatest`, `useForceUpdate`, `useFullscreen`, `useRefs`
- User asks about `PromiseStatus`, promise state management, or AbortController in React
- User wants Wow CQRS query hooks or data monitor hooks for React
- User wants debounced hooks for rate-limiting operations

## Capabilities

This skill provides guidance on using `@ahoo-wang/fetcher-react`, which offers React hooks for data fetching, promise state management, storage, events, and authentication.

---

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
const { status, loading, result, error, setLoading, setSuccess, setError, setIdle } =
  usePromiseState<string>();

setLoading();           // status = LOADING, error cleared
setSuccess('data');     // status = SUCCESS, result set (async, calls onSuccess)
setError(new Error());  // status = ERROR, error set (async, calls onError)
setIdle();              // status = IDLE, all cleared
```

### useExecutePromise

Manages async operations with race condition protection, AbortController, and unmount safety. Accepts a `PromiseSupplier<R>`:

```typescript
type PromiseSupplier<R> = (abortController: AbortController) => Promise<R>;
```

```tsx
const { loading, result, error, execute, reset, abort } =
  useExecutePromise<string>({
    onAbort: () => console.log('Operation aborted'),
  });

// CORRECT: pass a PromiseSupplier (receives AbortController)
execute((abortController) =>
  fetch('/api/data', { signal: abortController.signal }).then(res => res.json())
);

// New calls auto-cancel previous requests; state updates skip if unmounted
abort();  // manual cancel
reset();  // reset to IDLE
```

**Key: `execute` only accepts `PromiseSupplier<R>`, NOT raw promises.**

---

## HTTP Fetch Hooks

### useFetcher

HTTP-specific hook wrapping Fetcher with `FetchExchange` support.

```tsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

function UserProfile({ userId }: { userId: string }) {
  const { loading, result, error, exchange, execute, abort } = useFetcher<User>({
    resultExtractor: ResultExtractors.Json,
  });

  const fetchUser = () => {
    execute({ url: `/api/users/${userId}`, method: 'GET' });
  };
  // exchange contains request/response details
}
```

### useFetcherQuery

POST-based query hook with `setQuery`/`getQuery` management. `execute()` takes no argument -- it uses the current query from `getQuery()`.

```tsx
const { loading, result, execute, setQuery, getQuery } = useFetcherQuery<SearchQuery, SearchResult>({
  url: '/api/search',
  initialQuery: { keyword: '', limit: 10 },
  autoExecute: true,
});

setQuery({ keyword: 'hello', limit: 10 }); // auto-executes if autoExecute
execute();  // manual re-execute with current query
```

**Key: `useFetcherQuery.execute()` has no parameters. Use `setQuery` to update, `execute` to re-run.**

---

## Generic Query Hooks

### useQuery

Generic query hook with custom `execute` function. Wraps `useExecutePromise` + `useQueryState`.

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

```tsx
const { getQuery, setQuery } = useQueryState<UserQuery>({
  initialQuery: { id: '1' },
  autoExecute: true,
  execute: async (query) => { /* ... */ },
});
```

---

## Wow Query Hooks

Wow-specific query hooks from `@ahoo-wang/fetcher-react`. These wrap `useQuery` with typed Wow query structures (ListQuery, PagedQuery, etc.) and require a custom `execute` function.

### useListQuery

```tsx
const { result, loading, execute, setQuery } = useListQuery<User, 'id' | 'name'>({
  initialQuery: { condition: all(), projection: {}, sort: [], limit: 10 },
  execute: async listQuery => fetchListData(listQuery),
  autoExecute: true,
});
```

### usePagedQuery / useSingleQuery / useCountQuery / useListStreamQuery

Same pattern, typed for paged results, single items, counts, and streams respectively.

### Fetcher-based Variants

These use `useFetcherQuery` internally (POST-based) and take a `url` option instead of a custom `execute`:

- `useFetcherListQuery` - POST list query via Fetcher
- `useFetcherPagedQuery` - POST paged query via Fetcher
- `useFetcherSingleQuery` - POST single query via Fetcher
- `useFetcherCountQuery` - POST count query via Fetcher
- `useFetcherListStreamQuery` - POST stream query via Fetcher

```tsx
const { result, loading, execute, setQuery } = useFetcherListQuery<User, keyof User>({
  url: '/api/users/list',
  initialQuery: listQuery({ condition: all(), sort: [desc('createdAt')], limit: 10 }),
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
const { fullscreen, toggle, enter, exit } = useFullscreen({ target: containerRef });
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

Immer-powered immutable updates for complex objects.

```tsx
const [prefs, updatePrefs, resetPrefs] = useImmerKeyStorage(prefsStorage, defaultPrefs);
updatePrefs(draft => { draft.volume = 80; });
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

```tsx
const { isEnabled, enable, disable, toggle } = useDataMonitor({
  viewId: 'orders',
  countUrl: '/api/orders/count',
  viewName: 'Orders',
  condition: { status: 'pending' },
  notification: { title: 'New Orders', body: 'You have new pending orders' },
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

Generate `useExecutePromise`-based hooks from decorator API classes.

```tsx
@api('/users')
class UserApi {
  @get('/{id}') getUser(@path('id') id: string): Promise<User> { throw autoGeneratedError(id); }
  @post('') createUser(@body() data: CreateUser): Promise<User> { throw autoGeneratedError(data); }
}

const apiHooks = createExecuteApiHooks({ api: new UserApi() });
// apiHooks.useGetUser() -> { loading, result, execute }
// execute('123') - fully typed
```

### createQueryApiHooks

Generate query hooks with `useFetcherQuery`-based state management.

```tsx
const apiHooks = createQueryApiHooks({ api: new UserApi() });
// apiHooks.useListUsers({ initialQuery: {...}, autoExecute: true })
```

---

## Security (CoSec)

### SecurityProvider / useSecurityContext / useSecurity / RouteGuard

Wrap app with `SecurityProvider` for auth context. Use `useSecurityContext` to access `currentUser`, `authenticated`, `signOut`. `RouteGuard` conditionally renders based on auth status.

```tsx
import { SecurityProvider, useSecurityContext, RouteGuard } from '@ahoo-wang/fetcher-react';
```

---

## Debounced Hooks

Rate-limiting variants of core hooks:

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
  // Notifications
  notificationCenter,
  browserNotificationChannel,
} from '@ahoo-wang/fetcher-react';
```
