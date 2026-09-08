---
title: 'KeyStorage 与变更监听'
description: 'KeyStorage 与变更监听 — @ahoo-wang/fetcher-storage 5.0.0'
---

# KeyStorage 与变更监听

`KeyStorage<T>` 把一个类型化值绑定到一个字符串键。读写同步执行，通知通过事件总线异步投递。它不会自动监听原生浏览器 storage 事件。

## 选项 {#options}

`new KeyStorage<T>(options: KeyStorageOptions<T>)`：

| 选项                                        | 默认值                                          | 含义                                        |
| ------------------------------------------- | ----------------------------------------------- | ------------------------------------------- |
| `key: string`                               | 必填                                            | 后端存储键。                                |
| `storage?: Storage`                         | `getStorage()`                                  | 浏览器 localStorage，非浏览器新建内存存储。 |
| `serializer?: Serializer<string, T>`        | `jsonSerializer`                                | 读写及自动广播快照使用的字符串编解码器。    |
| `eventBus?: TypedEventBus<StorageEvent<T>>` | 新建 `SerialTypedEventBus('KeyStorage:' + key)` | 仅名称相同不会共享实例。                    |
| `defaultValue?: T`                          | `null`                                          | 后端缺值时返回，不会自动持久化。            |

## 读写与生命周期 {#operations}

| 方法                   | 返回值                               | 行为                                                                             |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `get()`                | `T                                   | null`                                                                            | 返回非空缓存；否则读取并反序列化后端，缺失时返回默认值。 |
| `set(value: T)`        | `void`                               | 读取旧值、序列化/快照、写后端、更新缓存、投递 `{oldValue, newValue}`。           |
| `remove()`             | `void`                               | 读取旧值、删除后端键、清空缓存、投递 `newValue: null`；随后 get 可能返回默认值。 |
| `addListener(handler)` | `RemoveStorageListener = () => void` | 注册具名 `EventHandler<StorageEvent<T>>`；返回函数调用 `off(handler.name)`。     |
| `destroy()`            | `void`                               | 只移除此实例的内部缓存监听器，不删除键，不关闭/销毁总线。                        |

`StorageEvent<T>` 包含可选 `newValue`、`oldValue`，均允许 null。`StorageListenable<T>` 提供 `addListener`。请使用唯一处理器名称：底层总线拒绝同名注册，但返回的移除函数仍指向该名称。销毁拥有的总线前自行解绑外部监听器。

后端读写、JSON 解析、序列化失败同步传出；通知失败后不会回滚写入。emit 拒绝会被捕获并 `console.warn`，普通串行处理器失败则已由总线隔离。非空缓存不会因直接修改后端而刷新。`get()` 返回对象引用，修改引用不会自动持久化。

## 共享与广播 {#broadcast}

显式传入同一个本地总线以协调多个实例。跨上下文通知使用 [BroadcastTypedEventBus](../eventbus/broadcast-and-messengers.md)。若广播总线尚无 wire transformer，`KeyStorage` 会安装基于序列化器的转换器，在本地处理器修改对象前快照序列化新值，接收方恢复自定义类型，并在 DataCloneError 时回退到字符串快照。无效旧快照会被视为不可用，不丢弃有效新值。`deserializeLegacy` 可解码旧结构化消息。

共享广播总线在整个生命周期必须使用相同存储键；使用自动转换时还必须使用相同序列化器实例（默认 JSON 实例会统一）。违反约束会在构造时抛错。已有自定义转换器仍由调用者负责。接收到事件只更新内存缓存，不写入接收方后端。销毁 KeyStorage 保留共享总线所有权。

## 完整示例 {#example}

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

## 公开符号与源码 {#symbols}

| 符号                                                      | 实现                                                                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| <a id="storageevent"></a>`StorageEvent`                   | [keyStorage.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L27)   |
| <a id="removestoragelistener"></a>`RemoveStorageListener` | [keyStorage.ts:163](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L163) |
| <a id="storagelistenable"></a>`StorageListenable`         | [keyStorage.ts:165](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L165) |
| <a id="keystorageoptions"></a>`KeyStorageOptions`         | [keyStorage.ts:179](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L179) |
| <a id="keystorage"></a>`KeyStorage`                       | [keyStorage.ts:215](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L215) |

[包索引](./index.md)
