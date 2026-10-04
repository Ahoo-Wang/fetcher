---
name: fetcher-eventbus
description: >
  Publish and subscribe typed events with `@ahoo-wang/fetcher-eventbus`: `SerialTypedEventBus` (ordered), `ParallelTypedEventBus`, `BroadcastTypedEventBus` across browser tabs, the multi-type `EventBus`, `once` handlers and cross-tab messengers. Use to notify components or other tabs that something happened when nothing needs to be stored. To persist a value (localStorage) and sync it across tabs use fetcher-storage.
---

# fetcher-eventbus

## Decisions

- **Serial vs parallel**: `SerialTypedEventBus` awaits handlers one by one, sorted by `order` (lower first, default 0). `ParallelTypedEventBus` runs them concurrently and **ignores `order`**; switch to serial when order matters.
- **Across tabs**: wrap a local bus — `new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus('cart') })` (an options object, not the bus positionally). `emit` runs local handlers first, then posts; a tab never receives its own message and received messages are not re-broadcast. Payloads cross tabs by structured clone (`BroadcastChannel`) or JSON (`StorageMessenger` fallback): send plain data.
- **Several event types**: `EventBus<Events>(type => new SerialTypedEventBus(type))` routes by type, creating each type's bus on first `on` or `emit`.
- **Need the value later, not just the notification?** That is `$fetcher-storage` (`KeyStorage`), which uses these buses underneath.

## Gotchas a capable model gets wrong

- `on(handler)` returns a `boolean`, not an unsubscribe function; a duplicate `name` returns `false` and keeps the existing handler. Unsubscribe with `off(name)` — names are the identity, so give each handler a distinct one (`nameGenerator.generate('cart')` makes one).
- A handler is an object `{ name, order?, once?, handle(event) }`, not a bare function.
- Handler errors are caught and logged with `console.warn`; `emit()` never rejects because of a handler and the remaining handlers still run.
- `once: true` handlers are removed before dispatch, so they run at most once even with overlapping emits.
- `createCrossTabMessenger()` tries `BroadcastChannelMessenger`, then `StorageMessenger`, then returns `undefined`; with no messenger the `BroadcastTypedEventBus` constructor throws `Error('Messenger setup failed')` (SSR, old runtimes) — create it only in the browser or pass `messenger`.
- `BroadcastTypedEventBus.destroy()` stops cross-tab traffic only: later `emit()`s still run local handlers but post nothing, and the delegate keeps its handlers (call `destroy()` on the delegate to drop them). It closes only a messenger it created; a messenger passed in `options.messenger` is detached and left open.

## Minimal example

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

interface CartUpdated {
  cartId: string;
  count: number;
}

const cartUpdated = new BroadcastTypedEventBus<CartUpdated>({
  delegate: new SerialTypedEventBus<CartUpdated>('cart-updated'),
});
cartUpdated.on({
  name: 'audit',
  order: -1,
  handle: e => console.log('audit', e),
});
cartUpdated.on({
  name: 'badge',
  order: 0,
  handle: e => console.log('badge', e.count),
});
cartUpdated.on({
  name: 'first',
  once: true,
  handle: () => console.log('first only'),
});

await cartUpdated.emit({ cartId: 'c1', count: 3 }); // audit, badge, first; then other tabs
cartUpdated.off('badge');
cartUpdated.destroy();
```

## References

- `references/api.md`: `TypedEventBus` and `EventHandler` contracts, the multi-type `EventBus`, `messageTransformer`, messenger APIs and fallback chain. Load it for exact signatures.

## Related Skills

- $fetcher-storage: persisted, typed values whose changes flow over these buses.
- $fetcher-react-hooks: `useEventSubscription` subscribes a component to a bus.
- $fetcher-cosec-auth: token and device-id storages that broadcast across tabs.
