---
prev: false
title: 'Storage 参考'
description: '基于浏览器 Storage 或内存保存类型化值，并显式管理通知所有权。'
---

# Storage 参考

基于浏览器 Storage 或内存保存类型化值，并显式管理通知所有权。

## 安装与运行时

```sh
pnpm add @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher
```

命令包含递归 peer 链：Storage → EventBus → Fetcher。浏览器持久化要求 localStorage 可访问；非浏览器默认创建独立内存存储。

5.0.0 为消费者声明 Node >=18.20.8。仓库开发另要求 Node >=20.20.2 / pnpm 10.34.5。所用功能依赖的浏览器/运行时 API 也必须存在，engine 范围不代表每个 Web API（如 Response.bytes）均可用。

## 选择入口

类型化值与监听使用 `KeyStorage`；只需要字符串存储时直接使用原生 `Storage` 或 `InMemoryStorage`。默认本地串行总线不会同步标签页。实例间协作需要注入同一个总线，跨上下文通知则需显式管理广播总线。

## 选择专题

| 专题                                               | 用途                                                                                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [KeyStorage 与变更监听](key-storage.md)            | `KeyStorage<T>` 把一个类型化值绑定到一个字符串键。读写同步执行，通知通过事件总线异步投递。它不会自动监听原生浏览器 storage 事件。 |
| [序列化与运行时存储](serialization-and-runtime.md) | `KeyStorage` 使用字符串序列化器；后端可选择原生 `Storage` 或导出的内存实现。运行时检测只负责选后端，不保证持久性或可用性。        |

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

[完整公开符号索引](./symbols.md)
