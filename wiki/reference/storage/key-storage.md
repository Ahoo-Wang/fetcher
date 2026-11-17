---
title: 'KeyStorage and change listeners'
description: 'KeyStorage and change listeners — @ahoo-wang/fetcher-storage 5.0.0'
---

# KeyStorage and change listeners

`KeyStorage<T>` binds one typed value to one string key. Operations are synchronous; notifications are dispatched asynchronously through an event bus. It does not automatically watch native browser storage events.

Choose the backend and event bus independently: sharing a backend does not share the cached value or subscriptions. Two instances using the same key and backend but different default buses can retain different cached values until `reload()`. Share a bus as well when both instances must observe writes made through KeyStorage.

## Options {#options}

`new KeyStorage<T>(options: KeyStorageOptions<T>)`:

| Option                                      | Default                                        | Meaning                                                                                                    |
| ------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `key: string`                               | Required                                       | Backend storage key.                                                                                       |
| `storage?: Storage`                         | `getStorage()`                                 | Browser localStorage or a fresh memory store outside browsers.                                             |
| `serializer?: Serializer<string, T>`        | `jsonSerializer`                               | String codec for reads, writes, and automatic broadcast snapshots.                                         |
| `eventBus?: TypedEventBus<StorageEvent<T>>` | New `SerialTypedEventBus('KeyStorage:' + key)` | The same name alone does not share instances. A created bus is closed by `destroy()`; a passed bus is not. |
| `defaultValue?: T`                          | `null`                                         | Returned when backend value is absent; not automatically persisted.                                        |

## Reads, writes, and lifetime {#operations}

| Method                 | Return                               | Behavior                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get()`                | `T \| null`                          | Return non-null cache; otherwise read and deserialize backend or return default. An undeserializable value is removed with a warning and read as absent.                                                                                                                                                                                                          |
| `reload()`             | `T \| null`                          | Read the backend again, bypassing the cache (for a value another tab may have written before its event arrived). Keeps the cached object while the stored text still holds the same value (formatting, or an older format the serializer reads, does not replace it) and replaces a cached object the caller mutated; returns the default when the key is absent. |
| `set(value: T)`        | `void`                               | Read old value, serialize/snapshot, write backend, update cache, emit `{oldValue, newValue}`. `set(undefined)` is `remove()`.                                                                                                                                                                                                                                     |
| `remove()`             | `void`                               | Read old value, remove backend key, clear cache, emit `newValue: null`; later get may return the default.                                                                                                                                                                                                                                                         |
| `addListener(handler)` | `RemoveStorageListener = () => void` | Register named `EventHandler<StorageEvent<T>>`; the returned function removes only this registration: never another handler with the name, nor a later `addListener` of the same handler object.                                                                                                                                                                  |
| `destroy()`            | `void`                               | Remove this instance's internal cache listener and close the bus this instance created (the default bus, or one a subclass marks with `ownEventBus()`, public but `@internal`, for subclasses). Does not delete the key or close a bus passed in `eventBus`.                                                                                                      |

`StorageEvent<T>` has optional `newValue` and `oldValue`, each allowing null. `StorageListenable<T>` exposes `addListener`. Use unique handler names: a duplicate name is rejected by the underlying bus and its returned remover does nothing, so it never removes the listener that holds the name. Each change `set()`/`remove()` emits is stamped in order, and an instance's cache ignores a stamped change older than the one it holds, so neither a slow listener, a `ParallelTypedEventBus` (which ignores `order`) nor a reordered broadcast moves it back to an older value. Events emitted straight to the bus carry no stamp and are applied as they arrive. The internal cache listener takes a name no other handler on the bus holds, so two copies of the package (ES module and CommonJS builds) can share a bus, and `destroy()` removes only that listener. Unsubscribe external listeners yourself before destroying the owning bus.

Backend read/write, JSON parsing, and serialization failures propagate synchronously; writes are not rolled back after notification failures. Emit rejections are caught and logged with `console.warn`, while ordinary serial handler failures are already isolated by the bus. A cached non-null value is not refreshed after direct backend mutations; call `reload()` to re-read it. `get()` returns object references; mutating one does not automatically persist it.

## Sharing and broadcasting {#broadcast}

Pass the same local bus to coordinate instances explicitly. For cross-context notifications use [BroadcastTypedEventBus](../eventbus/broadcast-and-messengers.md). `KeyStorage` installs a serializer-backed wire transformer if a broadcast bus has none. It snapshots the serialized new value before local handlers mutate objects, preserves custom types on the receiver, and can fall back from DataCloneError to the string snapshot. Invalid old snapshots become unavailable without discarding a valid new value. The automatic transformer also carries the change's order stamp (a hybrid logical clock of the device time), so a receiver keeps the latest change even when the sender's slow listeners delay an older broadcast; a caller-configured transformer carries none. `deserializeLegacy` can decode old structured messages.

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
```

## Public symbols and source {#symbols}

| Symbol                                                    | Implementation                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| <a id="storageevent"></a>`StorageEvent`                   | [keyStorage.ts:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L45)   |
| <a id="removestoragelistener"></a>`RemoveStorageListener` | [keyStorage.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L53)   |
| <a id="storagelistenable"></a>`StorageListenable`         | [keyStorage.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L55)   |
| <a id="keystorageoptions"></a>`KeyStorageOptions`         | [keyStorage.ts:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L69)   |
| <a id="keystorage"></a>`KeyStorage`                       | [keyStorage.ts:113](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L113) |

[Package index](./index.md)
