---
name: fetcher-react-hooks
description: Use React hooks for data fetching with Fetcher. Use when users want React hooks, mention useFetcher, useQuery, usePromise, or React integration with Fetcher.
---

# fetcher-react-hooks Skill

## Trigger Conditions

- User wants React hooks for data fetching
- User mentions `useFetcher`, `useQuery`, `usePromise`
- User asks about React integration with Fetcher
- User wants to build data-driven React components with HTTP requests
- User asks about promise state management in React
- User wants Wow CQRS query hooks for React

## Capabilities

This skill provides guidance on using the `@ahoo-wang/fetcher-react` package, which offers React hooks for data fetching, promise state management, storage, events, and authentication with CoSec integration.

---

## Core Hooks

### useFetcher and useFetcherQuery

`useFetcher` provides complete HTTP fetching capabilities with automatic state management, race condition protection, and AbortController support.

```tsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

function UserProfile({ userId }: { userId: string }) {
  const { loading, result, error, execute, abort } = useFetcher({
    onAbort: () => console.log('Fetch was aborted'),
  });

  const fetchUser = () => {
    execute({ url: `/api/users/${userId}`, method: 'GET' });
  };

  // Multiple calls automatically cancel previous requests
}
```

`useFetcherQuery` provides query-based fetching with `setQuery`/`getQuery` for parameter management:

```tsx
const { loading, result, execute, setQuery, getQuery } = useFetcherQuery({
  url: '/api/search',
  initialQuery: { keyword: '', limit: 10 },
  autoExecute: true,
});
```

**Key features:**
- Automatic AbortController for request cancellation
- Race condition protection
- Loading, error, and result states
- `autoExecute` option for mount-time execution

---

## Promise Management

### useExecutePromise

Manages async operations with automatic state handling and race condition protection.

```tsx
const { loading, result, error, execute, reset, abort } = useExecutePromise<string>({
  onAbort: () => console.log('Operation aborted'),
});

// Using a promise supplier
execute(async (abortController) => {
  const response = await fetch('/api/data', { signal: abortController.signal });
  return response.json();
});

// Using a direct promise
execute(fetch('/api/data').then(res => res.json()));
```

### usePromiseState

Provides state management for promises without execution logic.

```tsx
const { status, loading, result, error, setSuccess, setError, setIdle } = usePromiseState<string>();

// Manual state transitions
setSuccess('Data loaded');
setError(new Error('Failed'));
setIdle();
```

---

## Storage Hooks

### useKeyStorage

Reactive state management for `KeyStorage` instances with automatic subscription to storage changes.

```tsx
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useKeyStorage } from '@ahoo-wang/fetcher-react';

const themeStorage = new KeyStorage<string>({ key: 'theme' });

// Without default value
const [theme, setTheme, clearTheme] = useKeyStorage(themeStorage);

// With default value (guaranteed non-null)
const [theme, setTheme, clearTheme] = useKeyStorage(themeStorage, 'light');
```

### useImmerKeyStorage

Immer-powered immutable state updates for complex objects.

```tsx
const prefsStorage = new KeyStorage<{
  theme: string;
  volume: number;
  notifications: boolean;
}>({ key: 'prefs' });

const [prefs, updatePrefs, resetPrefs] = useImmerKeyStorage(prefsStorage, {
  theme: 'light',
  volume: 50,
  notifications: true,
});

// Intuitive "mutable" updates
updatePrefs(draft => {
  draft.volume = Math.min(100, draft.volume + 10);
  draft.theme = 'dark';
});
```

---

## Event Hooks

### useEventSubscription

React interface for subscribing to typed event buses with automatic lifecycle management.

```tsx
import { useEventSubscription } from '@ahoo-wang/fetcher-react';
import { eventBus } from './eventBus';

function MyComponent() {
  const { subscribe, unsubscribe } = useEventSubscription({
    bus: eventBus,
    handler: {
      name: 'myEvent',
      handle: (event) => console.log('Received:', event),
    },
  });

  // Automatically subscribes on mount, unsubscribes on unmount
}
```

---

## Wow Query Hooks

For use with `@ahoo-wang/fetcher-wow` package for CQRS patterns.

### useListQuery

List queries with conditions, projections, sorting, and limits.

```tsx
const { result, loading, error, execute, setCondition } = useListQuery({
  initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
  execute: async (listQuery) => fetchListData(listQuery),
  autoExecute: true,
});
```

### usePagedQuery

Paged queries with pagination metadata.

```tsx
const { result, loading, execute, setPagination } = usePagedQuery({
  initialQuery: {
    condition: {},
    pagination: { index: 1, size: 10 },
    projection: {},
    sort: [],
  },
  execute: async (pagedQuery) => fetchPagedData(pagedQuery),
});
```

### useSingleQuery

Fetch a single item by condition.

```tsx
const { result, loading, execute, setCondition } = useSingleQuery({
  initialQuery: { condition: {}, projection: {}, sort: [] },
  execute: async (query) => fetchSingleData(query),
});
```

### useCountQuery

Count records matching a condition.

```tsx
const { result, loading, execute, setCondition } = useCountQuery({
  initialQuery: {},
  execute: async (condition) => fetchCount(condition),
});
```

### useListStreamQuery

List queries returning a `ReadableStream` for server-sent events.

```tsx
const { result, loading, execute } = useListStreamQuery({
  initialQuery: { condition: {}, projection: {}, sort: [], limit: 100 },
  execute: async (listQuery) => fetchStream(listQuery),
});

// Read the stream
useEffect(() => {
  if (result) {
    const reader = result.getReader();
    // process stream events...
  }
}, [result]);
```

### Fetcher Query Hooks

Specialized hooks that integrate Fetcher with Wow queries:

- `useFetcherListQuery` - List queries via Fetcher HTTP
- `useFetcherPagedQuery` - Paged queries via Fetcher HTTP
- `useFetcherSingleQuery` - Single item queries via Fetcher HTTP
- `useFetcherCountQuery` - Count queries via Fetcher HTTP
- `useFetcherListStreamQuery` - Stream queries via Fetcher HTTP

---

## API Hooks Generation

### createExecuteApiHooks

Generate type-safe hooks from API objects with automatic method discovery.

```tsx
import { createExecuteApiHooks } from '@ahoo-wang/fetcher-react';

@api('/users')
class UserApi {
  @get('/{id}')
  getUser(@path('id') id: string): Promise<User> {
    throw autoGeneratedError(id);
  }

  @post('')
  createUser(@body() data: { name: string }): Promise<User> {
    throw autoGeneratedError(data);
  }
}

const apiHooks = createExecuteApiHooks({ api: new UserApi() });

// Generated hooks: useGetUser, useCreateUser
function UserComponent() {
  const { loading, result, execute } = apiHooks.useGetUser();
  execute('123'); // Fully typed
}
```

### createQueryApiHooks

Generate query hooks with automatic query state management.

```tsx
const apiHooks = createQueryApiHooks({ api: new UserApi() });

function UserList() {
  const { loading, result, execute, setQuery, getQuery } = apiHooks.useGetUsers({
    initialQuery: { page: 1, limit: 10 },
    autoExecute: true,
  });
}
```

---

## Security (CoSec)

### SecurityProvider

Wrap your app to provide authentication context.

```tsx
import { SecurityProvider } from '@ahoo-wang/fetcher-react';

function App() {
  return (
    <SecurityProvider
      tokenStorage={tokenStorage}
      onSignIn={() => navigate('/dashboard')}
      onSignOut={() => navigate('/login')}
    >
      <MyApp />
    </SecurityProvider>
  );
}
```

### useSecurityContext

Access auth state from any component within `SecurityProvider`.

```tsx
import { useSecurityContext } from '@ahoo-wang/fetcher-react';

function UserProfile() {
  const { currentUser, authenticated, signOut } = useSecurityContext();
  // ...
}
```

### useSecurity

Hook for managing authentication with CoSec tokens.

```tsx
const { currentUser, authenticated, signIn, signOut } = useSecurity(tokenStorage, {
  onSignIn: () => navigate('/dashboard'),
  onSignOut: () => navigate('/login'),
});

// Direct token
signIn(compositeToken);

// Or async function
signIn(async () => {
  const response = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  return response.json();
});
```

### RouteGuard

Conditionally render content based on authentication status.

```tsx
import { RouteGuard } from '@ahoo-wang/fetcher-react';

function ProtectedPage() {
  return (
    <RouteGuard
      fallback={<div>Please log in</div>}
      onUnauthorized={() => navigate('/login')}
    >
      <div>Protected content</div>
    </RouteGuard>
  );
}
```

---

## Notifications

### NotificationCenter

Publish notifications to registered channels.

```tsx
import { notificationCenter } from '@ahoo-wang/fetcher-react';

await notificationCenter.publish('browser', {
  title: 'New Message',
  payload: { body: 'Hello!' },
});
```

### Browser Notification Channel

The `browser` channel uses the Web Notification API.

```tsx
import { notificationCenter, browserNotificationChannel } from '@ahoo-wang/fetcher-react';
import { channelRegistry } from '@ahoo-wang/fetcher-react/notification/channel';

// Register the browser channel
channelRegistry.register('browser', browserNotificationChannel);

// Request permission and send
if (Notification.permission === 'granted') {
  await notificationCenter.publish('browser', {
    title: 'Alert',
    payload: { body: 'Something happened' },
  });
}
```

---

## Debounced Hooks

For rate-limiting operations:

- `useDebouncedCallback` - Debounce any callback
- `useDebouncedExecutePromise` - Debounce promise execution
- `useDebouncedQuery` - Debounce query execution
- `useDebouncedFetcher` - Debounce HTTP fetches
- `useDebouncedFetcherQuery` - Debounce fetcher queries with params

```tsx
const { loading, result, run, cancel, isPending } = useDebouncedFetcherQuery({
  url: '/api/search',
  initialQuery: { keyword: '' },
  debounce: { delay: 300 },
  autoExecute: false,
});

setQuery({ keyword: 'search term' }); // Triggers debounced execution
run(); // Manual execution
cancel(); // Cancel pending
isPending(); // Check if debounce timer is active
```

---

## Key Imports

```tsx
import {
  // Core
  useFetcher,
  useFetcherQuery,
  useExecutePromise,
  usePromiseState,
  useQuery,
  useQueryState,
  // Storage
  useKeyStorage,
  useImmerKeyStorage,
  // Events
  useEventSubscription,
  // Wow Queries
  useListQuery,
  usePagedQuery,
  useSingleQuery,
  useCountQuery,
  useListStreamQuery,
  // Fetcher Queries
  useFetcherListQuery,
  useFetcherPagedQuery,
  useFetcherSingleQuery,
  useFetcherCountQuery,
  useFetcherListStreamQuery,
  // API Generation
  createExecuteApiHooks,
  createQueryApiHooks,
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