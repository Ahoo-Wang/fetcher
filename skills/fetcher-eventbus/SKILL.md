---
name: fetcher-eventbus
description: >
  Publish and subscribe typed in-memory events with `@ahoo-wang/fetcher-eventbus`: `SerialTypedEventBus`, `ParallelTypedEventBus`, `BroadcastTypedEventBus` across browser tabs, the multi-type `EventBus`, handler order and `once`, and cross-tab messengers. Use for "notify other components/tabs" without persisted state. For a persisted value that syncs across tabs use fetcher-storage.
---

# fetcher-eventbus

## Decisions

- **Serial vs parallel**: `SerialTypedEventBus` awaits handlers one by one, sorted by `order` (lower first, default 0). `ParallelTypedEventBus` runs them concurrently and **ignores `order`** entirely.
- **Across tabs**: wrap a local bus — `new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus('cart') })`. `emit` runs local handlers first, then posts; a tab never receives its own message and received messages are not re-broadcast.
- **Several event types**: `EventBus` routes by type, creating each type's bus lazily on the first `on(type, …)`; emitting a type nobody subscribed to does nothing.
- **Need the value later, not just the notification?** That is `$fetcher-storage` (`KeyStorage`), which uses these buses underneath.

## Gotchas a capable model gets wrong

- `on(handler)` returns a `boolean`, not an unsubscribe function; a duplicate `name` returns `false` and keeps the existing handler. Unsubscribe with `off(name)` — names are identifiers.
- Handler errors are caught and logged with `console.warn`; `emit()` never rejects because of a handler.
- `once: true` handlers are removed before dispatch, so they run at most once even with overlapping emits.
- `createCrossTabMessenger()` tries `BroadcastChannelMessenger`, then `StorageMessenger`, then returns `undefined`; without any messenger the `BroadcastTypedEventBus` constructor throws. `StorageMessenger` payloads must survive `JSON.stringify`.
- `BroadcastTypedEventBus.destroy()` only closes the messenger; call `destroy()` on the delegate to drop its handlers.

## Minimal example

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const cart = new BroadcastTypedEventBus<{ id: string }>({
  delegate: new SerialTypedEventBus('cart'),
});
cart.on({ name: 'audit', order: 1, handle: e => console.log('cart', e.id) });
cart.on({ name: 'init', once: true, handle: () => console.log('first only') });
await cart.emit({ id: 'c1' }); // local handlers, then other tabs
cart.off('audit');
cart.destroy();
```

## References

- `references/api.md`: `TypedEventBus` and `EventHandler` contracts, the multi-type `EventBus`, messenger APIs and fallback chain, and examples. Load it for exact signatures.

## Related Skills

- $fetcher-storage: persisted, typed values whose changes flow over these buses.
- $fetcher-react-hooks: `useEventSubscription` subscribes a component to a bus.
- $fetcher-cosec-auth: token and device-id storages that broadcast across tabs.
