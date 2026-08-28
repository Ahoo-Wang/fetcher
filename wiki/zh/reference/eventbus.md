---
title: 事件总线参考
description: 选择串行、并行或跨标签页的类型化事件传递，并管理处理器生命周期。
---

# `@ahoo-wang/fetcher-eventbus`

事件总线包提供类型安全的事件传递，不引入全局单例或框架运行时。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-eventbus
```

## 选择传递语义

| 类型                        | 传递方式                      |
| --------------------------- | ----------------------------- |
| `SerialTypedEventBus<E>`    | 按 `order` 升序逐个等待处理器 |
| `ParallelTypedEventBus<E>`  | 并发运行处理器                |
| `BroadcastTypedEventBus<E>` | 组合本地传递与跨标签页消息    |
| `EventBus<Events>`          | 按事件名惰性创建类型化总线    |

顺序有意义时使用串行传递；仅在处理器彼此独立时使用并行传递；只有可序列化事件需要跨
浏览器标签页时才使用广播传递。

## 类型化总线

```ts
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface CartChanged {
  itemCount: number;
}

const cartEvents = new SerialTypedEventBus<CartChanged>('cart-changed');

cartEvents.on({
  name: 'update-badge',
  order: 10,
  handle: ({ itemCount }) => updateBadge(itemCount),
});

await cartEvents.emit({ itemCount: 3 });
cartEvents.off('update-badge');
cartEvents.destroy();
```

`EventHandler<E>` 包含 `name`、`handle`，以及可选的 `order`、`once`。同一类型化
总线中的处理器名称必须唯一。某个处理器失败时会记录错误，但不会阻止其余处理器运行。

## 命名事件

```ts
import { EventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

type Events = {
  signedIn: { userId: string };
  signedOut: undefined;
};

const events = new EventBus<Events>(type => new SerialTypedEventBus(type));

events.on('signedIn', {
  name: 'load-profile',
  handle: ({ userId }) => loadProfile(userId),
});

await events.emit('signedIn', { userId: 'u-42' });
```

遇到重复名称时 `on()` 返回 `false`；`off()` 返回是否移除了处理器。所有者销毁时始终
调用 `destroy()`。

## 跨标签页传递

`BroadcastChannelMessenger`、`StorageMessenger` 和
`createCrossTabMessenger()` 为 `BroadcastTypedEventBus` 提供浏览器传输。除非必须
指定某个平台传输，否则优先使用内置工厂。

参阅[状态与事件](../recipes/state-and-events.md)，了解所有权和清理模式。
