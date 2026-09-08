---
prev: false
title: 'Eventbus reference'
description: 'Local serial/parallel delivery and optional cross-context broadcasting.'
---

# Eventbus reference

Local serial/parallel delivery and optional cross-context broadcasting.

## Installation and runtime

```sh
pnpm add @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher
```

Version 5.0.0 declares Node >=18.20.8 for consumers. Repository development has a separate Node >=20.20.2 / pnpm 10.34.5 requirement. Browser/runtime APIs used by a feature must also exist; the engine range is not a promise that every Web API (for example Response.bytes) is available.

## Choose an entry point

Use `SerialTypedEventBus` for ordered handlers within one emission, `ParallelTypedEventBus` for independent handlers, and `EventBus` for several named event families. Add `BroadcastTypedEventBus` only when another context needs notifications; its transport does not acknowledge remote processing.

## Choose a topic

| Topic                                                         | Use it for                                                                                                                                                                                                                   |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Events and local delivery](events-and-delivery.md)           | Choose a typed bus for one payload type, or `EventBus<Events>` to route multiple named event types. Neither implementation persists events, retries delivery, or turns a handler failure into a failed business transaction. |
| [Broadcast buses and messengers](broadcast-and-messengers.md) | `BroadcastTypedEventBus<EVENT>` decorates a local `TypedEventBus<EVENT>` with cross-context delivery. The transport is notification-only: there is no acknowledgment, remote completion wait, replay, or delivery guarantee. |

## Minimal complete example

```ts
import { EventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

type Events = { saved: { id: string }; signedOut: undefined };
const bus = new EventBus<Events>(
  type => new SerialTypedEventBus<unknown>(type),
);
const received: string[] = [];
bus.on('saved', {
  name: 'audit',
  order: 0,
  once: true,
  handle: event => {
    received.push(event.id);
  },
});
await bus.emit('saved', { id: '1' });
await bus.emit('saved', { id: '2' });
console.assert(received.join(',') === '1');
bus.destroy();
```

[Complete public symbol index](./symbols.md)
