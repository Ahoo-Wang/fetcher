---
title: 'Events and local delivery'
description: 'Events and local delivery — @ahoo-wang/fetcher-eventbus 5.0.0'
---

# Events and local delivery

Choose a typed bus for one payload type, or `EventBus<Events>` to route multiple named event types. Neither implementation persists events, retries delivery, or turns a handler failure into a failed business transaction.

Await `emit` when subsequent local work depends on listener completion. This is a completion boundary, not a success acknowledgment: built-in buses catch listener errors. If the publisher needs a successful result or failure from a particular operation, call that operation directly instead of using an event notification.

## Event and subscription contracts {#subscriptions}

`EventType = string`. `EventHandler<EVENT>` requires `name: string` and `handle(event): void | Promise<void>`; optional `order` defaults to zero in serial sorting, and optional `once` defaults to false. `TypedEventBus<EVENT>` exposes `type`, `handlers`, `on`, `off`, `emit`, and `destroy`.

| Method        | Result                  | Contract                                                            |
| ------------- | ----------------------- | ------------------------------------------------------------------- |
| `on(handler)` | `boolean`               | False if a handler with the same name already exists.               |
| `off(name)`   | `boolean`               | False if absent; removal affects subsequent emits.                  |
| `handlers`    | `EventHandler<EVENT>[]` | Array copy, containing the original handler objects.                |
| `emit(event)` | `Promise<void>`         | Await handler completion according to the selected strategy.        |
| `destroy()`   | `void`                  | Local buses clear handlers; no terminal-state guard prevents reuse. |

Each emit snapshots its handler array and removes all `once` handlers before calling any handler. Thus concurrent/reentrant emits do not deliver the same once registration twice. Adding/removing subscriptions during delivery does not change that delivery's snapshot.

## Serial versus parallel {#delivery}

`new SerialTypedEventBus<EVENT>(type)` sorts by ascending `order` and awaits handlers sequentially **within one emit**. Concurrent calls to emit are not globally queued; handlers from distinct events can overlap. `new ParallelTypedEventBus<EVENT>(type)` starts handlers using `Promise.all`; `order` does not sort them and completion order is not guaranteed.

Both extend `AbstractTypedEventBus<EVENT>`. Its protected `handleEvent` catches synchronous throws and asynchronous rejections, logs `console.warn`, and continues. Consequently built-in local `emit` resolves despite individual handler failures. Subclasses provide `type`, `on`, `off`, and `emit` and can reuse that error boundary. There is no result aggregation or implicit cancellation of other handlers.

## Multi-event routing {#routing}

`new EventBus<Events>(typeEventBusSupplier: TypeEventBusSupplier)` lazily creates a bus only on `on(type, handler)`. `TypeEventBusSupplier` is `(type: EventType) => TypedEventBus<unknown>`. `off(type, name)` returns false if no bus exists. `emit(type, event): void | Promise<void>` is a no-op/undefined if nobody has created that type's bus; it does not buffer events. `destroy()` invokes every created bus's destroy and clears the map. Keys are generic strings, so use a fixed event map and correct event names rather than treating the types as runtime validation.

`NameGenerator.generate(prefix): string` is implemented by `DefaultNameGenerator`: a per-instance counter produces `prefix_1`, `prefix_2`, etc. `nameGenerator` is a shared instance. Generated names identify local registrations; they are not globally unique IDs.

## Complete example {#example}

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

## Public symbols and source {#symbols}

| Symbol                                                    | Implementation                                                                                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| <a id="abstracttypedeventbus"></a>`AbstractTypedEventBus` | [abstractTypedEventBus.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/abstractTypedEventBus.ts#L17) |
| <a id="typeeventbussupplier"></a>`TypeEventBusSupplier`   | [eventBus.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L20)                           |
| <a id="eventbus"></a>`EventBus`                           | [eventBus.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L35)                           |
| <a id="namegenerator"></a>`NameGenerator`                 | [nameGenerator.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L17)                 |
| <a id="defaultnamegenerator"></a>`DefaultNameGenerator`   | [nameGenerator.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L24)                 |
| <a id="namegenerator-instance"></a>`nameGenerator`        | [nameGenerator.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L41)                 |
| <a id="paralleltypedeventbus"></a>`ParallelTypedEventBus` | [parallelTypedEventBus.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/parallelTypedEventBus.ts#L33) |
| <a id="serialtypedeventbus"></a>`SerialTypedEventBus`     | [serialTypedEventBus.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/serialTypedEventBus.ts#L34)     |
| <a id="typedeventbus"></a>`TypedEventBus`                 | [typedEventBus.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/typedEventBus.ts#L21)                 |
| <a id="eventtype"></a>`EventType`                         | [types.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L17)                                 |
| <a id="eventhandler"></a>`EventHandler`                   | [types.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L19)                                 |

[Package index](./index.md)
