---
title: 存储参考
description: 持久化单个类型化 Key，选择序列化器与运行时 Storage，并管理本地变更 Listener。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-storage`

`KeyStorage<T>` 以同步序列化、可空缓存和 Event Bus 通知封装**一个** `Storage` Key。它不是
多 Key 数据库、迁移层，也不会自动同步浏览器的 `storage` 事件。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-storage
```

`@ahoo-wang/fetcher-eventbus` 是 Peer Dependency。浏览器默认读取 `window.localStorage`；
非浏览器运行时会创建一个 `InMemoryStorage` 实例。

## 构造 `KeyStorage<T>`

```ts
import {
  InMemoryStorage,
  KeyStorage,
} from '@ahoo-wang/fetcher-storage';

interface Preferences {
  theme: 'light' | 'dark';
}

const preferences = new KeyStorage<Preferences>({
  key: 'preferences',
  defaultValue: { theme: 'light' },
  storage: new InMemoryStorage(),
});

const removeThemeListener = preferences.addListener({
  name: 'apply-theme',
  handle: ({ newValue }) => console.log(newValue?.theme),
});

preferences.set({ theme: 'dark' });
console.log(preferences.get());
preferences.remove();
removeThemeListener();
preferences.destroy();
```

| 选项 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `key` | `string`，必填 | 唯一的底层 `Storage` Key。 |
| `serializer` | `Serializer<string, T>` / `jsonSerializer` | 在 `T` 与 DOM `Storage` API 所要求的字符串间转换。 |
| `storage` | `Storage` / `getStorage()` | 显式提供浏览器、测试或自定义 Storage 实现。 |
| `eventBus` | `TypedEventBus<StorageEvent<T>>` / 新建 `SerialTypedEventBus` | 投递变更事件，并承载缓存失效 Handler。 |
| `defaultValue` | `T` / `null` | 底层 Key 缺失时由 `get()` 返回。 |

默认 Serializer 是 JSON，不是 Identity Serializer。`defaultValue` 经 `?? null` 归一化，
所以传入的 `null` 会被视为缺失。

## 方法与事件契约

| API | 返回值 | Storage、缓存与 Listener 行为 |
| --- | --- | --- |
| `get()` | `T \| null` | 返回非空缓存；否则读取并反序列化 Key，或返回 `defaultValue`。 |
| `set(value)` | `void` | 读取旧值，序列化并写入，缓存 `value`，然后发出 `{ oldValue, newValue: value }`。 |
| `remove()` | `void` | 读取旧值，删除 Key，清空缓存，然后发出 `{ oldValue, newValue: null }`。 |
| `addListener(handler)` | `() => void` | 注册 `EventHandler<StorageEvent<T>>`；返回函数调用 `off(handler.name)`。 |
| `destroy()` | `void` | 仅移除本实例内部的缓存失效 Handler。 |

`StorageEvent<T>` 有可选的 `oldValue?: T | null` 与 `newValue?: T | null`。当前 `set()` /
`remove()` 实现会填充两者。由于这些 `void` 方法不会 await `eventBus.emit()`，不能把 `set()` 或
`remove()` 当作异步 Listener 已完成的信号。

## Serializer 与 Storage 选择

| 需求 | 使用方式 | 边界 |
| --- | --- | --- |
| DOM Storage 的结构化数据 | `JsonSerializer` 或 `jsonSerializer` | `JSON.stringify` / `JSON.parse`；存量 JSON 无效时 `get()` 抛错。 |
| 已经是字符串的值 | `typedIdentitySerializer<string>()` | Identity 与 `KeyStorage` 兼容，因为 DOM `Storage` 的值是字符串。 |
| 隔离测试或 SSR 状态 | `new InMemoryStorage()` | 新的进程内 `Map<string, string>`；不持久化也不共享。 |
| 应用控制的持久化 | 传入 `Storage` | `KeyStorage` 直接委托 `getItem`、`setItem`、`removeItem`。 |

`Serializer<Serialized, Deserialized>` 暴露 `serialize(value)` 和 `deserialize(value)`。
`IdentitySerializer<T>` 是公共 API，但 `KeyStorage<T>` 需要序列化类型为 `string` 的 Serializer；
浏览器 Storage 中的对象值不要使用 Identity。

| 运行时 | `getStorage()` 结果 | 持久化 / 失败边界 |
| --- | --- | --- |
| 浏览器（存在 `window`） | `window.localStorage` | 同 Origin 持久化；受浏览器策略限制时访问可能抛错。 |
| SSR / 非浏览器 | `new InMemoryStorage()` | 每次调用 `getStorage()` 都是新的进程内 Storage。 |

`getStorage()` 不会捕获 `localStorage` 访问失败，也不会在浏览器中回退。需要该产品策略时，传入
`InMemoryStorage` 或其他显式实现。

## Listener 生命周期与跨上下文行为

默认 Serial Event Bus 仅属于该 `KeyStorage` 实例。在一个标签页调用 `set()` 不会让另一个实例
观察浏览器原生 `storage` 事件。若要分发值，应提供具备所需 Transport 的 Event Bus，并确保每个
消费者订阅这个共享 Bus；Payload 包含值，不包含 Storage Key。

`remove()` 是数据变更：它调用底层 `removeItem`、将缓存改为 `null` 并发布删除事件。
`destroy()` 是 Listener 清理：它不删除数据、不清除调用方 Listener，也不销毁调用方提供的
Event Bus。调用 `destroy()` 前，应调用每个 `addListener()` 返回的 Remover。

## 故障定位

| 现象 | 检查项 |
| --- | --- |
| `get()` 反复反序列化默认值或缺失值 | 只有非空值会进入缓存；若重复读取重要，在领域中使用显式 Sentinel。 |
| `get()` 抛错 | 校验持久化 JSON / 自定义 `deserialize`，并检查所传 Storage 是否抛错。 |
| `set()` 在 Listener 运行前抛错 | 检查 `serialize` 与 `storage.setItem`；同步错误会传播且阻止事件发布。 |
| Listener 晚于 `set()` 运行 | `set()` 忽略 Event Bus Promise；不要把它当作 Listener 完成屏障。 |
| 其他标签页没有观察到变化 | 默认通知是本地的；自行接入共享的跨上下文 Event Bus。 |
| 清理后数据消失 | 确认未调用 `remove()`；`destroy()` 从不删除底层 Key。 |
| 浏览器 Storage 访问失败 | 传入测试/内存/自定义 Storage；`getStorage()` 不捕获受限 `localStorage` 访问。 |

## 源码参考

- 公共导出：[index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/index.ts#L14)
- StorageEvent：[keyStorage.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L23)
- KeyStorage 选项：[keyStorage.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L47)
- KeyStorage 生命周期：[keyStorage.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L80)
- Serializer 契约：[serializer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L19)
- JsonSerializer：[serializer.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L38)
- IdentitySerializer：[serializer.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L62)
- 运行时 Storage 选择：[env.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L29)
- 内存实现：[inMemoryStorage.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/inMemoryStorage.ts#L14)
