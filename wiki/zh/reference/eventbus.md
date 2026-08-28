---
title: 事件总线参考
description: 选择串行、并行或跨标签页的类型化事件传递，并管理处理器生命周期。
pageClass: reference-page
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

## Handler 契约

| 字段            | 必填 | 含义                             |
| --------------- | ---- | -------------------------------- |
| `name`          | 是   | `on()` 与 `off()` 使用的稳定身份 |
| `handle(event)` | 是   | 同步或异步事件处理器             |
| `order`         | 否   | Serial Bus 的升序投递顺序        |
| `once`          | 否   | 第一次投递后移除处理器           |

注册按名称保证幂等：重复名称返回 `false`，不会替换现有 Handler。所有权变化时先显式
移除旧 Handler。

## 跨标签页传递

`BroadcastChannelMessenger`、`StorageMessenger` 和
`createCrossTabMessenger()` 为 `BroadcastTypedEventBus` 提供浏览器传输。除非必须
指定某个平台传输，否则优先使用内置工厂。

### 传输选择

`createCrossTabMessenger()` 优先使用 `BroadcastChannelMessenger`，再降级到
`StorageMessenger`，并能报告浏览器能力不可用。跨标签页事件必须满足所选传输的
Structured Clone 或 JSON 约束；函数、DOM Node 和存活的类实例都不是可移植载荷。

## 失败与清理

- 一个 Handler 失败时会记录错误，但不会阻止其余 Handler 运行。
- `ParallelTypedEventBus` 不提供确定的完成顺序。
- `SerialTypedEventBus` 与 `ParallelTypedEventBus` 在 `destroy()` 时清除自己的 Handler。
- `EventBus.destroy()` 销毁所有惰性创建的子 Bus，然后清空 Registry。
- `BroadcastTypedEventBus.destroy()` 只关闭 Messenger；调用方拥有 Delegate 时应另行销毁。
- 组件级订阅应在同一生命周期中配对注册和移除。

一个调用方需要一个结果时，使用返回值或直接函数调用。Event Bus 用于 Fan-out 和解耦
所有权，不替代普通控制流。

## 源码与 Agent 参考

- 公共导出：[`packages/eventbus/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/index.ts)
- Agent 精确 API：[`skills/fetcher-eventbus/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-eventbus/references/api.md)
- Skill：[`$fetcher-eventbus`](../skills/http-and-services.md#fetcher-eventbus)

参阅[状态与事件](../recipes/state-and-events.md)，了解所有权和清理模式。
