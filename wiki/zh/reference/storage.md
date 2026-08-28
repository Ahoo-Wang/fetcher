---
title: 存储参考
description: 存储单个类型化值、观察变化，并选择浏览器或内存持久化。
---

# `@ahoo-wang/fetcher-storage`

存储包以序列化、缓存和类型化变更事件封装单个 `Storage` 键。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-storage
```

## 存储类型化值

```ts
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

interface Preferences {
  theme: 'light' | 'dark';
}

const preferences = new KeyStorage<Preferences>({
  key: 'preferences',
  defaultValue: { theme: 'light' },
});

const removeListener = preferences.addListener({
  name: 'apply-theme',
  handle: ({ newValue }) => applyTheme(newValue?.theme ?? 'light'),
});

preferences.set({ theme: 'dark' });
preferences.get();
preferences.remove();

removeListener();
preferences.destroy();
```

## `KeyStorageOptions<T>`

| 选项           | 默认值           | 用途                             |
| -------------- | ---------------- | -------------------------------- |
| `key`          | 必填             | 底层存储键                       |
| `serializer`   | `jsonSerializer` | 在字符串与 `T` 之间转换          |
| `storage`      | `getStorage()`   | 浏览器 `localStorage` 或内存回退 |
| `eventBus`     | 串行类型化总线   | 传递本地变更事件                 |
| `defaultValue` | `null`           | 键不存在时返回的值               |

`get()` 返回 `T | null` 并缓存反序列化结果。`set()` 与 `remove()` 会更新存储和
缓存，并发出 `{ oldValue, newValue }`。

## 存储与序列化器

`getStorage()` 在可用时返回 `localStorage`，否则返回 `InMemoryStorage`。如果持久化
范围属于应用契约，应显式传入 storage。

结构化值使用 `JsonSerializer` / `jsonSerializer`。仅当存储实现的值类型已经与 `T`
一致时，才使用 `IdentitySerializer` 或 `typedIdentitySerializer<T>()`。

## 生命周期

`addListener()` 返回移除函数。组件或服务销毁时，应同时调用监听移除函数和
`destroy()`。默认事件总线只在当前进程内传递；多个浏览器标签页需要相互观察时，使用
事件总线的跨标签页 messenger。

参阅[状态与事件](../recipes/state-and-events.md)，了解完整所有权示例。
