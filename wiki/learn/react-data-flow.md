---
title: React data flow
description: Connect execution, results, and cancellation to component lifetime.
---

# React data flow

A page needs to know whether work started, whether it is loading, what it returned, what failed, and who cancels it. Fetcher React expresses those responsibilities as component state.

## Start with explicit execution

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

## Connect request and component lifetimes

States are idle, loading, success, and error. A new execution aborts the previous controller; request IDs prevent old results from replacing current state. Unmount performs cleanup. Cancellation reaches the actual network request only when you pass controller.signal to it.

By default, rejection updates error/status without rethrowing. With propagateError enabled, the caller must also handle the rejected Promise. Callback failures do not replace the operation state. See [Promise and query state](../reference/react/promise-and-query-state.md).

## Choose from the page input

| Page requirement                   | Entry                       |
| ---------------------------------- | --------------------------- |
| Execute async work after a click   | useExecutePromise           |
| Send a Fetcher request             | useFetcher                  |
| Execute from changing query inputs | useQuery / useFetcherQuery  |
| Debounce input                     | Corresponding debounce Hook |
| Consume Wow query results          | Wow query Hooks             |

See [Fetcher Hooks](../reference/react/fetcher-hooks.md), [Debounce](../reference/react/debounce.md), and [Wow integration](../reference/react/wow.md). Avoid rebuilding stale-result protection in each page.

## Set the shared-state boundary

These Hooks do not provide a global server-state cache, invalidation, or cross-component deduplication. Compose those policies explicitly when the application needs them; component-local results are not a cache consistency guarantee.
