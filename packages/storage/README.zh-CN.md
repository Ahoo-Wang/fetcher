# `@ahoo-wang/fetcher-storage`

使用序列化、缓存和变更通知存储一个类型化值。它适合符合浏览器 `Storage` 模型的小型应用
偏好或令牌；可查询或事务性数据应使用数据库。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-storage
```

Peer 依赖为 `@ahoo-wang/fetcher-eventbus`。

## 示例

```ts
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';

interface Preferences {
  theme: 'light' | 'dark';
}

const preferences = new KeyStorage<Preferences>({
  key: 'preferences',
  storage: new InMemoryStorage(),
  defaultValue: { theme: 'light' },
});

const removeListener = preferences.addListener({
  name: 'apply-theme',
  handle: ({ newValue }) => console.log(newValue?.theme),
});

preferences.set({ theme: 'dark' });

removeListener();
preferences.destroy();
```

## 核心能力

- 浏览器 `localStorage` 与内存回退。
- 每个 `KeyStorage` 实例缓存一个类型化值。
- 默认 JSON 序列化，并支持按需自定义序列化器。
- 类型化 `{ oldValue, newValue }` 通知。
- 显式移除监听并清理所有者生命周期。

## 文档

- [状态与事件实战](https://fetcher.ahoo.me/zh/recipes/state-and-events)
- [Storage 参考](https://fetcher.ahoo.me/zh/reference/storage)

[English](./README.md) · [许可证](../../LICENSE)
