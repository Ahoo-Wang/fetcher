---
title: 'Storage reference'
description: 'Typed values backed by browser Storage or memory, with explicit notification ownership.'
---

# Storage reference

Typed values backed by browser Storage or memory, with explicit notification ownership.

## Installation and runtime

```sh
pnpm add @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-eventbus
```

Version 5.0.0 declares Node >=18.20.8 for consumers. Repository development has a separate Node >=20.20.2 / pnpm 10.34.5 requirement. Browser/runtime APIs used by a feature must also exist; the engine range is not a promise that every Web API (for example Response.bytes) is available.

## Choose a topic

| Topic                                                               | Use it for                                                                                                                                                                                                            |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [KeyStorage and change listeners](/reference/storage/key-storage.md)                 | `KeyStorage<T>` binds one typed value to one string key. Operations are synchronous; notifications are dispatched asynchronously through an event bus. It does not automatically watch native browser storage events. |
| [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md) | Use a string serializer with `KeyStorage`; use a native `Storage` backend or the exported in-memory implementation. Runtime detection selects a backend, not a durability or availability guarantee.                  |

## Minimal complete example

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

## Public export index {#exports}

| Symbol                    | Contract                                                                                        | Source                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `isBrowser`               | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#isbrowser)                   | [env.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L20)                         |
| `getStorage`              | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#getstorage)                  | [env.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L29)                         |
| `InMemoryStorage`         | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#inmemorystorage)             | [inMemoryStorage.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/inMemoryStorage.ts#L14) |
| `StorageEvent`            | [KeyStorage and change listeners](/reference/storage/key-storage.md#storageevent)                                | [keyStorage.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L27)           |
| `RemoveStorageListener`   | [KeyStorage and change listeners](/reference/storage/key-storage.md#removestoragelistener)                       | [keyStorage.ts:163](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L163)         |
| `StorageListenable`       | [KeyStorage and change listeners](/reference/storage/key-storage.md#storagelistenable)                           | [keyStorage.ts:165](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L165)         |
| `KeyStorageOptions`       | [KeyStorage and change listeners](/reference/storage/key-storage.md#keystorageoptions)                           | [keyStorage.ts:179](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L179)         |
| `KeyStorage`              | [KeyStorage and change listeners](/reference/storage/key-storage.md#keystorage)                                  | [keyStorage.ts:215](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L215)         |
| `Serializer`              | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#serializer)                  | [serializer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L19)           |
| `JsonSerializer`          | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#jsonserializer)              | [serializer.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L41)           |
| `IdentitySerializer`      | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#identityserializer)          | [serializer.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L65)           |
| `jsonSerializer`          | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#jsonserializer-instance)     | [serializer.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L88)           |
| `identitySerializer`      | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#identityserializer-instance) | [serializer.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L92)           |
| `typedIdentitySerializer` | [Serialization and runtime storage](/reference/storage/serialization-and-runtime.md#typedidentityserializer)     | [serializer.ts:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L94)           |

## Earlier section links

Earlier reference links still lead to the corresponding topics below.

| Earlier section | Current topic |
| --- | --- |
| <span id="install"></span>Install | [Read this topic](/reference/storage/index.md) |
| <span id="construct-keystorage-t"></span>Construct `KeyStorage<T>` | [Read this topic](/reference/storage/key-storage.md) |
| <span id="method-and-event-contract"></span>Method and event contract | [Read this topic](/reference/storage/key-storage.md) |
| <span id="serializer-and-storage-selection"></span>Serializer and storage selection | [Read this topic](/reference/storage/serialization-and-runtime.md) |
| <span id="listener-lifecycle-and-cross-context-behavior"></span>Listener lifecycle and cross-context behavior | [Read this topic](/reference/storage/key-storage.md) |
| <span id="diagnosis"></span>Diagnosis | [Read this topic](/reference/storage/index.md) |
| <span id="source-reference"></span>Source reference | [Read this topic](/reference/storage/index.md) |
