---
title: 'Storage 参考'
description: '基于浏览器 Storage 或内存保存类型化值，并显式管理通知所有权。'
---

# Storage 参考

基于浏览器 Storage 或内存保存类型化值，并显式管理通知所有权。

## 安装与运行时

```sh
pnpm add @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-eventbus
```

5.0.0 为消费者声明 Node >=18.20.8。仓库开发另要求 Node >=20.20.2 / pnpm 10.34.5。所用功能依赖的浏览器/运行时 API 也必须存在，engine 范围不代表每个 Web API（如 Response.bytes）均可用。

## 选择专题

| 专题                                                 | 用途                                                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [KeyStorage 与变更监听](/zh/reference/storage/key-storage.md)            | `KeyStorage<T>` 把一个类型化值绑定到一个字符串键。读写同步执行，通知通过事件总线异步投递。它不会自动监听原生浏览器 storage 事件。 |
| [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md) | `KeyStorage` 使用字符串序列化器；后端可选择原生 `Storage` 或导出的内存实现。运行时检测只负责选后端，不保证持久性或可用性。        |

## 最小完整示例

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

## 公开导出索引 {#exports}

| 符号                      | 契约                                                                             | 源码                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `isBrowser`               | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#isbrowser)                   | [env.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L20)                         |
| `getStorage`              | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#getstorage)                  | [env.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L29)                         |
| `InMemoryStorage`         | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#inmemorystorage)             | [inMemoryStorage.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/inMemoryStorage.ts#L14) |
| `StorageEvent`            | [KeyStorage 与变更监听](/zh/reference/storage/key-storage.md#storageevent)                           | [keyStorage.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L27)           |
| `RemoveStorageListener`   | [KeyStorage 与变更监听](/zh/reference/storage/key-storage.md#removestoragelistener)                  | [keyStorage.ts:163](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L163)         |
| `StorageListenable`       | [KeyStorage 与变更监听](/zh/reference/storage/key-storage.md#storagelistenable)                      | [keyStorage.ts:165](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L165)         |
| `KeyStorageOptions`       | [KeyStorage 与变更监听](/zh/reference/storage/key-storage.md#keystorageoptions)                      | [keyStorage.ts:179](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L179)         |
| `KeyStorage`              | [KeyStorage 与变更监听](/zh/reference/storage/key-storage.md#keystorage)                             | [keyStorage.ts:215](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L215)         |
| `Serializer`              | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#serializer)                  | [serializer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L19)           |
| `JsonSerializer`          | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#jsonserializer)              | [serializer.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L41)           |
| `IdentitySerializer`      | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#identityserializer)          | [serializer.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L65)           |
| `jsonSerializer`          | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#jsonserializer-instance)     | [serializer.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L88)           |
| `identitySerializer`      | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#identityserializer-instance) | [serializer.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L92)           |
| `typedIdentitySerializer` | [序列化与运行时存储](/zh/reference/storage/serialization-and-runtime.md#typedidentityserializer)     | [serializer.ts:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L94)           |

## 旧章节链接

旧版参考链接仍可定位到下列专题。

| 旧章节 | 新专题 |
| --- | --- |
| <span id="安装"></span>安装 | [阅读对应专题](/zh/reference/storage/index.md) |
| <span id="构造-keystorage-t"></span>构造 `KeyStorage<T>` | [阅读对应专题](/zh/reference/storage/key-storage.md) |
| <span id="方法与事件契约"></span>方法与事件契约 | [阅读对应专题](/zh/reference/storage/key-storage.md) |
| <span id="serializer-与-storage-选择"></span>Serializer 与 Storage 选择 | [阅读对应专题](/zh/reference/storage/serialization-and-runtime.md) |
| <span id="listener-生命周期与跨上下文行为"></span>Listener 生命周期与跨上下文行为 | [阅读对应专题](/zh/reference/storage/key-storage.md) |
| <span id="故障定位"></span>故障定位 | [阅读对应专题](/zh/reference/storage/index.md) |
| <span id="源码参考"></span>源码参考 | [阅读对应专题](/zh/reference/storage/index.md) |
