---
next: false
title: 'storage 公开符号索引'
description: '完整根入口导出、行为契约及源码位置索引。'
---

# storage 公开符号索引

已知符号名时从下表定位。安装与入口选择请先看[包概览](./index.md)。

## 公开导出索引 {#exports}

| 符号                      | 契约                                                                           | 源码                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `isBrowser`               | [序列化与运行时存储](serialization-and-runtime.md#isbrowser)                   | [env.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L20)                         |
| `getStorage`              | [序列化与运行时存储](serialization-and-runtime.md#getstorage)                  | [env.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L29)                         |
| `InMemoryStorage`         | [序列化与运行时存储](serialization-and-runtime.md#inmemorystorage)             | [inMemoryStorage.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/inMemoryStorage.ts#L14) |
| `StorageEvent`            | [KeyStorage 与变更监听](key-storage.md#storageevent)                           | [keyStorage.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L27)           |
| `RemoveStorageListener`   | [KeyStorage 与变更监听](key-storage.md#removestoragelistener)                  | [keyStorage.ts:163](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L163)         |
| `StorageListenable`       | [KeyStorage 与变更监听](key-storage.md#storagelistenable)                      | [keyStorage.ts:165](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L165)         |
| `KeyStorageOptions`       | [KeyStorage 与变更监听](key-storage.md#keystorageoptions)                      | [keyStorage.ts:179](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L179)         |
| `KeyStorage`              | [KeyStorage 与变更监听](key-storage.md#keystorage)                             | [keyStorage.ts:215](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L215)         |
| `Serializer`              | [序列化与运行时存储](serialization-and-runtime.md#serializer)                  | [serializer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L19)           |
| `JsonSerializer`          | [序列化与运行时存储](serialization-and-runtime.md#jsonserializer)              | [serializer.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L41)           |
| `IdentitySerializer`      | [序列化与运行时存储](serialization-and-runtime.md#identityserializer)          | [serializer.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L65)           |
| `jsonSerializer`          | [序列化与运行时存储](serialization-and-runtime.md#jsonserializer-instance)     | [serializer.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L88)           |
| `identitySerializer`      | [序列化与运行时存储](serialization-and-runtime.md#identityserializer-instance) | [serializer.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L92)           |
| `typedIdentitySerializer` | [序列化与运行时存储](serialization-and-runtime.md#typedidentityserializer)     | [serializer.ts:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L94)           |
