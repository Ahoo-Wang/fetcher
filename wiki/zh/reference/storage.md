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

| 方法                   | 结果                       | 副作用                               |
| ---------------------- | -------------------------- | ------------------------------------ |
| `get()`                | <code>T &#124; null</code> | 读取并缓存反序列化值                 |
| `set(value)`           | `void`                     | 序列化、写入、更新缓存并发布变化     |
| `remove()`             | `void`                     | 删除 Key、清除缓存并发布变化         |
| `addListener(handler)` | 移除函数                   | 订阅类型化本地变化                   |
| `destroy()`            | `void`                     | 只移除 KeyStorage 的内部缓存 Handler |

`StorageEvent<T>` 只包含 `oldValue` 和 `newValue`；Key 已由 `KeyStorage` 实例持有。
把 `null` 视为缺失；如果删除必须可区分，就不要让它同时表示一个领域值。

## 存储与序列化器

只要 `window` 存在，`getStorage()` 就返回 `window.localStorage`；仅在非浏览器环境返回
`InMemoryStorage`。如果持久化范围或受限浏览器行为属于应用契约，应显式传入 Storage。

结构化值使用 `JsonSerializer` / `jsonSerializer`。仅当存储实现的值类型已经与 `T`
一致时，才使用 `IdentitySerializer` 或 `typedIdentitySerializer<T>()`。

### 运行时选择

| 运行时             | 默认 Storage          | 持久化范围          |
| ------------------ | --------------------- | ------------------- |
| 浏览器             | `window.localStorage` | 同 Origin 跨 Reload |
| SSR 或非浏览器测试 | `InMemoryStorage`     | 仅当前进程          |

隐私限制或 Sandbox 中访问 `localStorage` 可能抛错；`getStorage()` 不捕获该错误，也不会
自动降级。需要该策略时显式传入 `InMemoryStorage`。Serializer 失败会从 `get()` 或
`set()` 抛出；如果 Schema 变化无法安全读取旧格式，应给存储数据加版本。

## 生命周期

`addListener()` 返回移除函数。先调用所有由调用方创建的 Remover，再调用 `destroy()`
移除 KeyStorage 的内部缓存 Handler。`destroy()` 不移除其他 Listener，也不销毁调用方
传入的 Event Bus。默认事件总线只在当前进程内传递；多个浏览器标签页需要相互观察时，
使用事件总线的跨标签页 Messenger。

## 源码与 Agent 参考

- 公共导出：[`packages/storage/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/index.ts)
- Agent 精确 API：[`skills/fetcher-storage/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-storage/references/api.md)
- Skill：[`$fetcher-storage`](../skills/http-and-services.md#fetcher-storage)

参阅[状态与事件](../recipes/state-and-events.md)，了解完整所有权示例。
