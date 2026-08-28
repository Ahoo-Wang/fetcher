---
title: Event bus reference
description: Select typed in-process or cross-tab event delivery and own its lifecycle.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-eventbus`

Use this package for typed, in-process fan-out. It does not provide request/reply
semantics, durable delivery, retries, or a global singleton.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus
```

`@ahoo-wang/fetcher` is a peer dependency. Cross-tab delivery additionally
needs a browser that supports `BroadcastChannel` or `storage` events.

## Choose an entry point

| Need | Entry point | Delivery and ownership |
| --- | --- | --- |
| One payload type | `SerialTypedEventBus<E>` | Awaits handlers sequentially by ascending `order`. |
| Independent handlers | `ParallelTypedEventBus<E>` | Starts handlers together and waits for all of them. |
| Named payload map | `EventBus<Events>` | Lazily owns one typed bus per name. |
| Other browser tabs/windows | `BroadcastTypedEventBus<E>` | Delivers locally, then sends through a messenger. |
| Browser transport choice | `createCrossTabMessenger(name)` | Prefers `BroadcastChannel`, then `storage` events. |

`SerialTypedEventBus` sorts by ascending `order` (default `0`; equal values
keep registration order). `ParallelTypedEventBus` does not sort and has no
completion order.

## Typed and named events

`TypedEventBus<E>` has `type`, a copied `handlers` array, and `on`, `off`,
`emit`, and `destroy`. An `EventHandler<E>` has a unique `name`,
`handle(event): void | Promise<void>`, and optional `once` / `order`.

```ts
import {
  EventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

type AppEvents = {
  signedIn: { userId: string };
  signedOut: undefined;
};

const events = new EventBus<AppEvents>(
  type => new SerialTypedEventBus(type),
);

events.on('signedIn', {
  name: 'audit-sign-in',
  once: true,
  handle: ({ userId }) => console.log(userId),
});

await events.emit('signedIn', { userId: 'u-42' });
events.off('signedIn', 'audit-sign-in');
events.destroy();
```

`on()` returns `false` for an existing handler name and does not replace it.
`off()` returns `false` when its name has no bus or no matching handler.
`EventBus.emit()` returns `undefined` when that named bus has not been created;
registration creates a child bus, emission alone does not.

## Delivery and failure contract

| Bus | Handler start/order | `emit()` resolves | `once` | Handler throw/reject |
| --- | --- | --- | --- | --- |
| `SerialTypedEventBus` | One after another, ascending `order` (ties preserve registration order) | After every handler settles | Removed after its attempt | Caught and sent to `console.warn`; later handlers continue. |
| `ParallelTypedEventBus` | Concurrent; no completion order | After `Promise.all` of wrapped handlers | Removed after all attempts | Caught and sent to `console.warn`; peers continue. |
| `BroadcastTypedEventBus` | Delegate semantics locally; incoming messages use the delegate | After local delegate completes and `postMessage()` returns | Delegate semantics | Delegate failures follow its implementation; messenger errors propagate from `postMessage()`. |

Handler return values are deliberately discarded. Use a direct function call when
the caller needs a result. `once` handlers are removed even if their own handler
throws, because removal happens after the wrapped attempt completes.

## Cross-tab bus and messenger selection

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const cartEvents = new BroadcastTypedEventBus({
  delegate: new SerialTypedEventBus<{ itemCount: number }>('cart-changed'),
});

cartEvents.on({
  name: 'render-badge',
  handle: ({ itemCount }) => console.log(itemCount),
});

await cartEvents.emit({ itemCount: 3 });
cartEvents.destroy();
```

Without a supplied `messenger`, construction uses channel
`_broadcast_:{delegate.type}` and throws `Error('Messenger setup failed')` if
neither browser transport is available. `BroadcastChannelMessenger` is the
first choice. The fallback `StorageMessenger` requires `window` and
`localStorage`, writes JSON messages, defaults `ttl` to 1,000 ms and
`cleanupInterval` to 60,000 ms. Do not send functions, DOM nodes, or other
non-cloneable/non-JSON values.

`BroadcastTypedEventBus.destroy()` only closes its messenger. It leaves the
delegate and its handlers usable; destroy that delegate separately if this
owner created it. Incoming messages are delivered locally but not re-broadcast.

## Lifecycle and diagnosis

| Symptom | Check |
| --- | --- |
| A handler never runs | Confirm the exact `name` was not already registered (`on()` returned `true`) and that the matching named bus was created. |
| Ordering is surprising | Serial uses ascending `order` (default `0`; stable ties); parallel has no completion order. |
| `emit()` does not reject for a handler error | Inspect `console.warn`; handler errors are intentionally isolated. |
| Broadcast construction fails | Check `isBroadcastChannelSupported()` / `isStorageEventSupported()`, or provide a `CrossTabMessenger`. |
| A local listener remains after broadcast cleanup | Call `destroy()` on the delegate; broadcast cleanup only closes the messenger. |
| Storage fallback messages disappear | Its localStorage transport is transient by design; verify the TTL and that another tab receives `storage` events. |

Pair every owned bus with `destroy()` and every temporary registration with
`off()`. `EventBus.destroy()` destroys all child buses it has created, while a
typed bus's `destroy()` clears its handlers.

## Source reference

- [Public exports: index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/index.ts#L14)
- [EventHandler and EventType: types.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L17)
- [Typed bus contract: typedEventBus.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/typedEventBus.ts#L21)
- [Serial delivery: serialTypedEventBus.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/serialTypedEventBus.ts#L34)
- [Parallel delivery: parallelTypedEventBus.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/parallelTypedEventBus.ts#L33)
- [Named bus: eventBus.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L35)
- [Broadcast bus: broadcastTypedEventBus.ts:111](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L111)
- [Messenger factory: crossTabMessenger.ts:46](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L46)
