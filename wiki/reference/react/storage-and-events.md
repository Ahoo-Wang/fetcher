---
title: 'Storage and event subscriptions'
description: 'Storage and event subscriptions — @ahoo-wang/fetcher-react 5.0.0'
---

# Storage and event subscriptions

These hooks adapt shared external resources to a component. Keep `KeyStorage` and bus instances stable, and let their creator own destruction. Component unmount unsubscribes listeners; it does not destroy shared storage or the bus.

| API                                          | Input / return / default                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `useKeyStorage(storage)`                     | Returns `[T \| null, set(T), remove()]`; missing storage is null.                                                               |
| `useKeyStorage(storage, defaultValue)`       | Returns `[T, set(T), remove()]`; fallback is read when stored value is null and is not automatically persisted.                 |
| `useImmerKeyStorage(storage, defaultValue?)` | Same tuple, but setter accepts an Immer draft updater; returning null removes the key.                                          |
| `useEventSubscription({ bus, handler })`     | Automatically calls `bus.on(handler)`; returns boolean-valued subscribe/unsubscribe functions. Cleanup calls off(handler.name). |

Storage uses `useSyncExternalStore`, caches deep-equal snapshots, and resubscribes when the storage instance changes. SSR uses the same snapshot getter, so the storage you provide must be usable in that runtime. Serialization/storage exceptions propagate; these hooks do not convert them into a Promise error state. The Immer updater reads the current stored value when invoked, so successive updates do not rely on a render's stale snapshot. Retained callbacks continue to target the storage they captured.

Event handlers have names; use a distinct name per subscriber. Duplicate names can reject registration, which logs a warning, and cleanup still unsubscribes by that name. Stabilize handler identity to avoid unnecessary unsubscribe/resubscribe. The bus controls handler failure propagation and delivery order; this hook neither changes those policies nor awaits delivery on behalf of publishers.

## Complete example

```tsx
import { KeyStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';
import { useImmerKeyStorage } from '@ahoo-wang/fetcher-react';
const preferences = new KeyStorage<{ count: number }>({
  key: 'preferences',
  storage: new InMemoryStorage(),
});
export function Counter() {
  const [value, update, remove] = useImmerKeyStorage(preferences, { count: 0 });
  return (
    <section>
      <button
        onClick={() =>
          update(draft => {
            draft.count += 1;
          })
        }
      >
        {value.count}
      </button>
      <button onClick={remove}>Reset stored value</button>
    </section>
  );
}
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### useKeyStorage {#api-useKeyStorage}

```ts
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void, () => void];
```

[packages/react/src/storage/useKeyStorage.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useKeyStorage.ts#L19)

```ts
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (value: T) => void, () => void];
```

[packages/react/src/storage/useKeyStorage.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useKeyStorage.ts#L23)

### useImmerKeyStorage {#api-useImmerKeyStorage}

```ts
export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [
  T | null,
  (updater: (draft: T | null) => T | null | void) => void,
  () => void,
];
```

[packages/react/src/storage/useImmerKeyStorage.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useImmerKeyStorage.ts#L23)

```ts
export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (updater: (draft: T) => T | null | void) => void, () => void];
```

[packages/react/src/storage/useImmerKeyStorage.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useImmerKeyStorage.ts#L31)

### useEventSubscription {#api-useEventSubscription}

```ts
export function useEventSubscription<EVENT = unknown>(
  options: UseEventSubscriptionOptions<EVENT>,
): UseEventSubscriptionReturn;
```

[packages/react/src/eventbus/useEventSubscription.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L92)

### UseEventSubscriptionOptions {#api-UseEventSubscriptionOptions}

```ts
export interface UseEventSubscriptionOptions<EVENT> {
  bus: TypedEventBus<EVENT>;
  handler: EventHandler<EVENT>;
}
```

[packages/react/src/eventbus/useEventSubscription.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L21)

### UseEventSubscriptionReturn {#api-UseEventSubscriptionReturn}

```ts
export interface UseEventSubscriptionReturn {
  subscribe: () => boolean;
  unsubscribe: () => boolean;
}
```

[packages/react/src/eventbus/useEventSubscription.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L35)

## Related topics

[Fetcher hooks](./fetcher-hooks) · [Promise and query state](./promise-and-query-state) · [API hook factories](./api-hooks) · [Debounced execution](./debounce) · [Security hooks and route guards](./cosec) · [Wow query hooks](./wow) · [Monitoring, refs and fullscreen](./monitoring-and-utilities)
