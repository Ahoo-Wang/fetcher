---
title: Event bus reference
description: Choose serial, parallel, or cross-tab typed event delivery and manage handler lifecycles.
---

# `@ahoo-wang/fetcher-eventbus`

The event bus package provides typed event delivery without introducing a
global singleton or framework runtime.

## Install

```bash
pnpm add @ahoo-wang/fetcher-eventbus
```

## Choose delivery semantics

| Type                        | Delivery                                           |
| --------------------------- | -------------------------------------------------- |
| `SerialTypedEventBus<E>`    | Awaits handlers one at a time in ascending `order` |
| `ParallelTypedEventBus<E>`  | Runs handlers concurrently                         |
| `BroadcastTypedEventBus<E>` | Combines local delivery with cross-tab messaging   |
| `EventBus<Events>`          | Lazily creates one typed bus per event name        |

Use serial delivery when order matters. Use parallel delivery only when
handlers are independent. Use broadcast delivery only for serializable events
that must cross browser tabs.

## Typed bus

```ts
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface CartChanged {
  itemCount: number;
}

const cartEvents = new SerialTypedEventBus<CartChanged>('cart-changed');

cartEvents.on({
  name: 'update-badge',
  order: 10,
  handle: ({ itemCount }) => updateBadge(itemCount),
});

await cartEvents.emit({ itemCount: 3 });
cartEvents.off('update-badge');
cartEvents.destroy();
```

An `EventHandler<E>` has `name`, `handle`, optional `order`, and optional
`once`. Handler names must be unique within a typed bus. A failing handler is
logged without preventing the remaining handlers from running.

## Named events

```ts
import { EventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

type Events = {
  signedIn: { userId: string };
  signedOut: undefined;
};

const events = new EventBus<Events>(type => new SerialTypedEventBus(type));

events.on('signedIn', {
  name: 'load-profile',
  handle: ({ userId }) => loadProfile(userId),
});

await events.emit('signedIn', { userId: 'u-42' });
```

`on()` returns `false` for a duplicate name; `off()` reports whether it removed
a handler. Always call `destroy()` when the owner is disposed.

## Cross-tab delivery

`BroadcastChannelMessenger`, `StorageMessenger`, and
`createCrossTabMessenger()` provide browser transports for
`BroadcastTypedEventBus`. Choose the built-in factory unless you need to force
a specific platform transport.

See [State and events](../recipes/state-and-events.md) for ownership and cleanup
patterns.
