---
title: 'KeyStorage and change listeners'
description: 'KeyStorage and change listeners — @ahoo-wang/fetcher-storage 5.0.0'
---

# KeyStorage and change listeners

`KeyStorage<T>` binds one typed value to one string key. Operations are synchronous; notifications are dispatched asynchronously through an event bus. It does not automatically watch native browser storage events.

Choose the backend and event bus independently: sharing a backend does not share the cached value or subscriptions. Two instances using the same key and backend but different default buses can retain different cached values. Share a bus as well when both instances must observe writes made through KeyStorage.

## Options {#options}

`new KeyStorage<T>(options: KeyStorageOptions<T>)`:

| Option                                      | Default                                        | Meaning                                                             |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| `key: string`                               | Required                                       | Backend storage key.                                                |
| `storage?: Storage`                         | `getStorage()`                                 | Browser localStorage or a fresh memory store outside browsers.      |
| `serializer?: Serializer<string, T>`        | `jsonSerializer`                               | String codec for reads, writes, and automatic broadcast snapshots.  |
| `eventBus?: TypedEventBus<StorageEvent<T>>` | New `SerialTypedEventBus('KeyStorage:' + key)` | The same name alone does not share instances.                       |
| `defaultValue?: T`                          | `null`                                         | Returned when backend value is absent; not automatically persisted. |

## Reads, writes, and lifetime {#operations}

| Method                 | Return                               | Behavior                                                                                                  |
| ---------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `get()`                | `T \| null`                          | Return non-null cache; otherwise read and deserialize backend or return default.                          |
| `set(value: T)`        | `void`                               | Read old value, serialize/snapshot, write backend, update cache, emit `{oldValue, newValue}`.             |
| `remove()`             | `void`                               | Read old value, remove backend key, clear cache, emit `newValue: null`; later get may return the default. |
| `addListener(handler)` | `RemoveStorageListener = () => void` | Register named `EventHandler<StorageEvent<T>>`; returned function calls `off(handler.name)`.              |
| `destroy()`            | `void`                               | Remove only this instance's internal cache listener. Does not delete the key or close/destroy the bus.    |

`StorageEvent<T>` has optional `newValue` and `oldValue`, each allowing null. `StorageListenable<T>` exposes `addListener`. Use unique handler names: duplicate names are rejected by the underlying bus, while the returned remover still targets that name. Unsubscribe external listeners yourself before destroying the owning bus.

Backend read/write, JSON parsing, and serialization failures propagate synchronously; writes are not rolled back after notification failures. Emit rejections are caught and logged with `console.warn`, while ordinary serial handler failures are already isolated by the bus. A cached non-null value is not refreshed after direct backend mutations. `get()` returns object references; mutating one does not automatically persist it.

## Sharing and broadcasting {#broadcast}

Pass the same local bus to coordinate instances explicitly. For cross-context notifications use [BroadcastTypedEventBus](../eventbus/broadcast-and-messengers.md). `KeyStorage` installs a serializer-backed wire transformer if a broadcast bus has none. It snapshots the serialized new value before local handlers mutate objects, preserves custom types on the receiver, and can fall back from DataCloneError to the string snapshot. Invalid old snapshots become unavailable without discarding a valid new value. `deserializeLegacy` can decode old structured messages.

A shared broadcast bus requires the same storage key for its lifetime. With automatic transformation it also requires the same serializer instance (default JSON instances are reconciled). Violations throw during construction. A preexisting custom transformer remains the caller's responsibility. Incoming events update the in-memory cache; they do not write the receiving backend. Destroying a KeyStorage leaves shared bus ownership intact.

## Complete example {#example}

```ts
import { KeyStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';

const settings = new KeyStorage<{ theme: string }>({
  key: 'settings',
  storage: new InMemoryStorage(),
  defaultValue: { theme: 'system' },
});
const removeListener = settings.addListener({
  name: 'settings-ui',
  handle: event => {
    console.log(event.newValue);
  },
});
settings.set({ theme: 'dark' });
console.assert(settings.get()?.theme === 'dark');
settings.remove();
console.assert(settings.get()?.theme === 'system');
removeListener();
settings.destroy();
settings.eventBus.destroy();
```

## Public symbols and source {#symbols}

| Symbol                                                    | Implementation                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| <a id="storageevent"></a>`StorageEvent`                   | [keyStorage.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L27)   |
| <a id="removestoragelistener"></a>`RemoveStorageListener` | [keyStorage.ts:163](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L163) |
| <a id="storagelistenable"></a>`StorageListenable`         | [keyStorage.ts:165](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L165) |
| <a id="keystorageoptions"></a>`KeyStorageOptions`         | [keyStorage.ts:179](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L179) |
| <a id="keystorage"></a>`KeyStorage`                       | [keyStorage.ts:215](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L215) |

[Package index](./index.md)
