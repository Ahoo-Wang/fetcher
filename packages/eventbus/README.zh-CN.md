# `@ahoo-wang/fetcher-eventbus`

提供不依赖框架运行时的类型化串行、并行与跨标签页事件。事件总线适合在所有者之间传递
瞬时通知，不应充当隐藏的持久化状态。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus
```

Peer 依赖为 `@ahoo-wang/fetcher`。

## 示例

```ts
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface UserSaved {
  id: string;
}

const events = new SerialTypedEventBus<UserSaved>('user-saved');

events.on({
  name: 'refresh-profile',
  order: 10,
  handle: ({ id }) => console.log(id),
});

await events.emit({ id: 'u-42' });
events.destroy();
```

## 核心能力

- 按 order 升序运行串行处理器。
- 为彼此独立的处理器提供并行传递。
- `once` 处理器和唯一处理器名称。
- 通过 `EventBus<Events>` 管理命名事件映射。
- 基于 BroadcastChannel 或 Storage 的跨标签页消息。
- 使用 `off()` 与 `destroy()` 显式清理生命周期。

## 文档

- [状态与事件实战](https://fetcher.ahoo.me/zh/recipes/state-and-events)
- [事件总线参考](https://fetcher.ahoo.me/zh/reference/eventbus)

[English](./README.md) · [许可证](../../LICENSE)
