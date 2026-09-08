---
title: 'Broadcast buses and messengers'
description: 'Broadcast buses and messengers — @ahoo-wang/fetcher-eventbus 5.0.0'
---

# Broadcast buses and messengers

`BroadcastTypedEventBus<EVENT>` decorates a local `TypedEventBus<EVENT>` with cross-context delivery. The transport is notification-only: there is no acknowledgment, remote completion wait, replay, or delivery guarantee.

## Broadcast options and flow {#broadcast}

`new BroadcastTypedEventBus(options: BroadcastTypedEventBusOptions<EVENT>)` requires `delegate`. Its `type` and `handlers` come from the delegate; `on`/`off` forward to it. Default messenger is `createCrossTabMessenger('_broadcast_:' + delegate.type)`; construction throws `Error('Messenger setup failed')` if none is available.

| Option/member                             | Default                    | Contract                                                                     |
| ----------------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `messenger?: CrossTabMessenger`           | Runtime-selected transport | Inject to control environment/channel ownership.                             |
| `messageTransformer.serialize(event)`     | No transformer             | Convert outbound event into wire data.                                       |
| `messageTransformer.deserialize(message)` | No transformer             | Decode incoming wire data into EVENT.                                        |
| `serializeBeforeDispatch?`                | false                      | True snapshots before local handlers; false serializes after local delivery. |
| `fallbackSerialize?(message, error)`      | None                       | On a postMessage throw, transform once and retry postMessage once.           |
| `destroy()`                               | —                          | Closes messenger only; does not destroy delegate or remove its handlers.     |

`emit` awaits the local delegate first, then posts the message (with optional pre-serialization). Outbound serialization/post failures reject emit; local delivery may already have happened. A pre-serialization throw prevents local delivery. Incoming messages deserialize and emit only on the delegate, so they are not rebroadcast; decode/delegate rejections are caught and warned. The mutable `messageTransformer` affects later operations.

## CrossTabMessenger {#messengers}

The contract is `postMessage(message: any): void`, a setter `onmessage: CrossTabMessageHandler`, and `close(): void`; handler type is `(message: any) => void`. Setting onmessage replaces the callback.

`isBroadcastChannelSupported()` checks the global and prototype postMessage. `isStorageEventSupported()` checks StorageEvent, window.addEventListener, and localStorage or sessionStorage availability. These are feature probes, not permission tests. `createCrossTabMessenger(channelName)` prefers `BroadcastChannelMessenger`, then `StorageMessenger`, otherwise returns undefined. Construction errors are not silently converted to fallback.

`new BroadcastChannelMessenger(channelName)` wraps native BroadcastChannel, forwards `MessageEvent.data`, and uses structured cloning; unsupported data can throw DataCloneError. `close()` closes its channel.

## StorageMessenger {#storage}

`new StorageMessenger(options: StorageMessengerOptions)` requires a browser with window and localStorage even when injecting a backend. Options are required `channelName`, optional `storage` (localStorage), `ttl` (1000 ms), and `cleanupInterval` (60000 ms).

Each post JSON-encodes `StorageMessage {data: any, timestamp: number}` under a unique channel-prefixed storage key, then schedules key deletion after ttl. Periodic cleanup removes expired/invalid messages matching that channel. Receiving filters by storageArea and key format; invalid JSON warns. TTL controls cleanup, not reliable replay or a receive-age filter. Native storage events do not notify their originating document.

`close()` removes the storage listener and clears interval/pending deletion timers; already-written keys are not all removed immediately. JSON stringify, quota, or access failures can throw on posting. A sessionStorage backend has that platform's restricted sharing scope. The sender's local delegate still handles local delivery independently.

## Complete example {#example}

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
  createCrossTabMessenger,
} from '@ahoo-wang/fetcher-eventbus';

const messenger = createCrossTabMessenger('settings-demo');
if (messenger) {
  const delegate = new SerialTypedEventBus<{ theme: string }>('settings');
  const bus = new BroadcastTypedEventBus({ delegate, messenger });
  bus.on({
    name: 'ui',
    handle: event => {
      console.log(event.theme);
    },
  });
  try {
    await bus.emit({ theme: 'dark' });
  } finally {
    bus.destroy();
    delegate.destroy();
  }
}
```

## Public symbols and source {#symbols}

| Symbol                                                                    | Implementation                                                                                                                                      |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="broadcasttypedeventbusoptions"></a>`BroadcastTypedEventBusOptions` | [broadcastTypedEventBus.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L24)                  |
| <a id="broadcasttypedeventbus"></a>`BroadcastTypedEventBus`               | [broadcastTypedEventBus.ts:121](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L121)                |
| <a id="broadcastchannelmessenger"></a>`BroadcastChannelMessenger`         | [broadcastChannelMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/broadcastChannelMessenger.ts#L19) |
| <a id="crosstabmessagehandler"></a>`CrossTabMessageHandler`               | [crossTabMessenger.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L17)                 |
| <a id="crosstabmessenger"></a>`CrossTabMessenger`                         | [crossTabMessenger.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L25)                 |
| <a id="isbroadcastchannelsupported"></a>`isBroadcastChannelSupported`     | [crossTabMessenger.ts:46](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L46)                 |
| <a id="isstorageeventsupported"></a>`isStorageEventSupported`             | [crossTabMessenger.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L53)                 |
| <a id="createcrosstabmessenger"></a>`createCrossTabMessenger`             | [crossTabMessenger.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L63)                 |
| <a id="storagemessengeroptions"></a>`StorageMessengerOptions`             | [storageMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L19)                   |
| <a id="storagemessage"></a>`StorageMessage`                               | [storageMessenger.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L27)                   |
| <a id="storagemessenger"></a>`StorageMessenger`                           | [storageMessenger.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L35)                   |

[Package index](./index.md)
