---
title: Event bus reference
description: Choose serial, parallel, or cross-tab typed event delivery and manage handler lifecycles.
pageClass: reference-page
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

## Handler contract

| Field           | Required | Meaning                                     |
| --------------- | -------- | ------------------------------------------- |
| `name`          | yes      | Stable identity used by `on()` and `off()`  |
| `handle(event)` | yes      | Sync or async event handler                 |
| `order`         | no       | Ascending delivery order for serial buses   |
| `once`          | no       | Remove the handler after its first delivery |

Registration is idempotent by name: a duplicate returns `false` instead of
replacing the existing handler. Remove the old handler explicitly when
ownership changes.

## Cross-tab delivery

`BroadcastChannelMessenger`, `StorageMessenger`, and
`createCrossTabMessenger()` provide browser transports for
`BroadcastTypedEventBus`. Choose the built-in factory unless you need to force
a specific platform transport.

### Transport selection

`createCrossTabMessenger()` prefers `BroadcastChannelMessenger`, falls back to
`StorageMessenger`, and can report an unavailable browser capability. Cross-tab
events must be structured-clone or JSON compatible according to the selected
transport; functions, DOM nodes, and live class instances are not portable
payloads.

## Failure and cleanup behavior

- A handler failure is logged and does not prevent remaining handlers from running.
- `ParallelTypedEventBus` does not provide deterministic completion order.
- `SerialTypedEventBus` and `ParallelTypedEventBus` clear their own handlers on `destroy()`.
- `EventBus.destroy()` destroys every lazily created child bus, then clears its registry.
- `BroadcastTypedEventBus.destroy()` closes only its messenger; destroy the delegate separately when you own it.
- Pair component-level registration and removal in the same lifecycle.

Use a return value or direct function call when one caller needs one result.
The event bus is for fan-out and decoupled ownership, not a replacement for
ordinary control flow.

## Source and agent reference

- Public exports: [`packages/eventbus/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/index.ts)
- Detailed agent API: [`skills/fetcher-eventbus/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-eventbus/references/api.md)
- Skill: [`$fetcher-eventbus`](../skills/http-and-services.md#fetcher-eventbus)

See [State and events](../recipes/state-and-events.md) for ownership and cleanup
patterns.
