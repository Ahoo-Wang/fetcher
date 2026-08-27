---
title: React Data Flow
description: Model asynchronous work as explicit React loading, result, error, cancellation, and query state.
---

# React Data Flow

Fetcher React hooks keep asynchronous state explicit. They do not add a cache or global request policy.

## Promise state

`PromiseStatus` has four values: `idle`, `loading`, `success`, and `error`. `usePromiseState` owns the state transitions; `useExecutePromise` adds execution and cancellation.

```tsx
import { useExecutePromise } from '@ahoo-wang/fetcher-react';

function UserButton() {
  const { status, loading, result, error, execute, abort, reset } =
    useExecutePromise<string>();

  return (
    <section>
      <button
        disabled={loading}
        onClick={() =>
          execute(async controller => {
            const response = await fetch('/api/user', {
              signal: controller.signal,
            });
            return response.text();
          })
        }
      >
        Load user
      </button>
      <button onClick={abort}>Cancel</button>
      <button onClick={reset}>Reset</button>
      <output>{error ? String(error) : (result ?? status)}</output>
    </section>
  );
}
```

Starting a new execution aborts the previous controller. Request IDs prevent a stale result from replacing the newest state. Unmount cleanup prevents later state updates.

## Error behavior

By default, a rejected promise updates `error` and `status` without rethrowing. Set `propagateError: true` only when the event handler must also catch the rejection. `onSuccess`, `onError`, and `onAbort` callback failures are logged without replacing the operation state.

## Query state

`useQuery` adds `getQuery`, `setQuery`, optional validation, and `autoExecute`. `useFetcherQuery` binds that query to a Fetcher request. Use the Wow-specific hooks for Wow response and endpoint contracts rather than rebuilding those requests by hand.

## Debounce

`useDebouncedCallback` exposes `run`, `cancel`, and `isPending`. At least one of `leading` or `trailing` must be enabled. `useDebouncedExecutePromise` and `useDebouncedQuery` compose the same behavior with async state.

## When not to use these hooks

Use direct Fetcher calls in non-React modules. Use a dedicated server-state cache when you need normalized cache keys, background revalidation, mutation invalidation, or shared request deduplication; these hooks intentionally do not provide those policies.
