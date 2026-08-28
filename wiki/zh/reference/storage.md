---
title: 存储参考
description: 存储单个类型化值、观察变化，并选择浏览器或内存持久化。
pageClass: reference-page
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

## 方法契约

| 方法                   | 结果     | 副作用                           |
| ---------------------- | -------- | -------------------------------- |
| `get()`                | `T       | null`                            | 读取并缓存反序列化值 |
| `set(value)`           | `void`   | 序列化、写入、更新缓存并发布变化 |
| `remove()`             | `void`   | 删除 Key、清除缓存并发布变化     |
| `addListener(handler)` | 移除函数 | 订阅类型化本地变化               |
| `destroy()`            | `void`   | 释放监听器与自身拥有的事件资源   |

`StorageEvent<T>` 包含 Key、`oldValue` 和 `newValue`。把 `null` 视为缺失；如果删除
必须可区分，就不要让它同时表示一个领域值。

## 存储与序列化器

`getStorage()` 在可用时返回 `localStorage`，否则返回 `InMemoryStorage`。如果持久化
范围属于应用契约，应显式传入 storage。

结构化值使用 `JsonSerializer` / `jsonSerializer`。仅当存储实现的值类型已经与 `T`
一致时，才使用 `IdentitySerializer` 或 `typedIdentitySerializer<T>()`。

### 运行时选择

| 运行时                         | 默认 Storage      | 持久化范围          |
| ------------------------------ | ----------------- | ------------------- |
| 可访问 `localStorage` 的浏览器 | `localStorage`    | 同 Origin 跨 Reload |
| SSR、测试或受限浏览器          | `InMemoryStorage` | 仅当前进程          |

持久化是需求时显式传入 Storage。Fallback 只保证代码可以运行，不承诺数据持久。
Serializer 失败会从 `get()` 或 `set()` 抛出；如果 Schema 变化无法安全读取旧格式，
应给存储数据加版本。

## 生命周期

`addListener()` 返回移除函数。组件或服务销毁时，应同时调用监听移除函数和
`destroy()`。默认事件总线只在当前进程内传递；多个浏览器标签页需要相互观察时，使用
事件总线的跨标签页 messenger。

## 源码与 Agent 参考

- 公共导出：[`packages/storage/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/index.ts)
- Agent 精确 API：[`skills/fetcher-storage/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-storage/references/api.md)
- Skill：[`$fetcher-storage`](../skills/http-and-services.md#fetcher-storage)

参阅[状态与事件](../recipes/state-and-events.md)，了解完整所有权示例。
