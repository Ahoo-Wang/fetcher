---
title: 'Latest and stable values'
description: 'Latest and stable values — @ahoo-wang/fetcher-react 6.0.0'
---

# Latest and stable values

Two small hooks underlie the request hooks and are exported for your own effects and callbacks. Neither triggers a render by itself.

| API                     | Return and lifecycle                                                                                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useLatest(value)`      | `RefObject` updated after each render commits (insertion effect), so a discarded concurrent render never leaves its value behind. Read it in callbacks and effects; read in render it holds the last committed value. |
| `useStableValue(value)` | Returns `value`, but keeps the previous reference while the content is deeply equal (`dequal`). An inline object can drive an effect's dependencies without re-running it on every render.                            |

`useStableValue` is how query hooks decide that a query changed: `{ page: 1 }` written inline in every render stays one value until its content differs. It compares content only; it does not clone, freeze or validate. For values that should follow input after a quiet period, use [`useDebouncedValue`](./debounce#api-useDebouncedValue); to debounce calls, use [`useDebouncedCallback`](./debounce#api-useDebouncedCallback).

## Removed in 6.0 {#removed-in-6-0}

| Removed                                             | Instead                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Fullscreen hooks, provider, context and DOM helpers | No replacement in this package; call the Fullscreen API directly or use a hook library.              |
| `useRefs`, `useForceUpdate`, `useMounted`           | No replacement; write the few lines you need or use a hook library.                                  |
| `useRequestId`                                      | Request identity is the `AbortController` owned by [`useExecutePromise`](./promise-and-query-state). |

## Complete example

```tsx
import { useEffect } from 'react';
import { useLatest, useStableValue } from '@ahoo-wang/fetcher-react';

export function Ticker({
  filter,
  onTick,
}: {
  filter: { tag: string };
  onTick: (tag: string, ticks: number) => void;
}) {
  const latestOnTick = useLatest(onTick);
  const stableFilter = useStableValue(filter);
  useEffect(() => {
    // Restarts when the filter's content changes, not on every new object,
    // and always calls the latest onTick without listing it as a dependency.
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
      latestOnTick.current(stableFilter.tag, ticks);
    }, 1000);
    return () => clearInterval(timer);
  }, [stableFilter, latestOnTick]);
  return <p>Watching {stableFilter.tag}</p>;
}
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### useLatest {#api-useLatest}

```ts
export function useLatest<T>(value: T): RefObject<T>;
```

[packages/react/src/core/useLatest.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useLatest.ts#L47)

### useStableValue {#api-useStableValue}

```ts
export function useStableValue<T>(value: T): T;
```

[packages/react/src/core/useStableValue.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useStableValue.ts#L22)

## Related topics

[Fetcher hooks](./fetcher-hooks) · [Promise and query state](./promise-and-query-state) · [API hook factories](./api-hooks) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec)
