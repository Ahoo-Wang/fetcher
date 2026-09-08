---
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

## Choose a topic

| Topic                                                           | Use it for                                                                                                                                                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Events and local delivery](/reference/eventbus/events-and-delivery.md)           | Choose a typed bus for one payload type, or `EventBus<Events>` to route multiple named event types. Neither implementation persists events, retries delivery, or turns a handler failure into a failed business transaction. |
| [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md) | `BroadcastTypedEventBus<EVENT>` decorates a local `TypedEventBus<EVENT>` with cross-context delivery. The transport is notification-only: there is no acknowledgment, remote completion wait, replay, or delivery guarantee. |

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

## Public export index {#exports}

| Symbol                          | Contract                                                                                      | Source                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AbstractTypedEventBus`         | [Events and local delivery](/reference/eventbus/events-and-delivery.md#abstracttypedeventbus)                   | [abstractTypedEventBus.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/abstractTypedEventBus.ts#L17)                    |
| `BroadcastTypedEventBusOptions` | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#broadcasttypedeventbusoptions) | [broadcastTypedEventBus.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L24)                  |
| `BroadcastTypedEventBus`        | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#broadcasttypedeventbus)        | [broadcastTypedEventBus.ts:121](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L121)                |
| `TypeEventBusSupplier`          | [Events and local delivery](/reference/eventbus/events-and-delivery.md#typeeventbussupplier)                    | [eventBus.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L20)                                              |
| `EventBus`                      | [Events and local delivery](/reference/eventbus/events-and-delivery.md#eventbus)                                | [eventBus.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L35)                                              |
| `BroadcastChannelMessenger`     | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#broadcastchannelmessenger)     | [broadcastChannelMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/broadcastChannelMessenger.ts#L19) |
| `CrossTabMessageHandler`        | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#crosstabmessagehandler)        | [crossTabMessenger.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L17)                 |
| `CrossTabMessenger`             | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#crosstabmessenger)             | [crossTabMessenger.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L25)                 |
| `isBroadcastChannelSupported`   | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#isbroadcastchannelsupported)   | [crossTabMessenger.ts:46](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L46)                 |
| `isStorageEventSupported`       | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#isstorageeventsupported)       | [crossTabMessenger.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L53)                 |
| `createCrossTabMessenger`       | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#createcrosstabmessenger)       | [crossTabMessenger.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L63)                 |
| `StorageMessengerOptions`       | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#storagemessengeroptions)       | [storageMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L19)                   |
| `StorageMessage`                | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#storagemessage)                | [storageMessenger.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L27)                   |
| `StorageMessenger`              | [Broadcast buses and messengers](/reference/eventbus/broadcast-and-messengers.md#storagemessenger)              | [storageMessenger.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L35)                   |
| `NameGenerator`                 | [Events and local delivery](/reference/eventbus/events-and-delivery.md#namegenerator)                           | [nameGenerator.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L17)                                    |
| `DefaultNameGenerator`          | [Events and local delivery](/reference/eventbus/events-and-delivery.md#defaultnamegenerator)                    | [nameGenerator.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L24)                                    |
| `nameGenerator`                 | [Events and local delivery](/reference/eventbus/events-and-delivery.md#namegenerator-instance)                  | [nameGenerator.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L41)                                    |
| `ParallelTypedEventBus`         | [Events and local delivery](/reference/eventbus/events-and-delivery.md#paralleltypedeventbus)                   | [parallelTypedEventBus.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/parallelTypedEventBus.ts#L33)                    |
| `SerialTypedEventBus`           | [Events and local delivery](/reference/eventbus/events-and-delivery.md#serialtypedeventbus)                     | [serialTypedEventBus.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/serialTypedEventBus.ts#L34)                        |
| `TypedEventBus`                 | [Events and local delivery](/reference/eventbus/events-and-delivery.md#typedeventbus)                           | [typedEventBus.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/typedEventBus.ts#L21)                                    |
| `EventType`                     | [Events and local delivery](/reference/eventbus/events-and-delivery.md#eventtype)                               | [types.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L17)                                                    |
| `EventHandler`                  | [Events and local delivery](/reference/eventbus/events-and-delivery.md#eventhandler)                            | [types.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L19)                                                    |
