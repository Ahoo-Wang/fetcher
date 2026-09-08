---
prev: false
title: 'Eventbus 参考'
description: '本地串行/并行投递及可选跨上下文广播。'
---

# Eventbus 参考

本地串行/并行投递及可选跨上下文广播。

## 安装与运行时

```sh
pnpm add @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher
```

5.0.0 为消费者声明 Node >=18.20.8。仓库开发另要求 Node >=20.20.2 / pnpm 10.34.5。所用功能依赖的浏览器/运行时 API 也必须存在，engine 范围不代表每个 Web API（如 Response.bytes）均可用。

## 选择入口

一次派发内需要有序处理时用 `SerialTypedEventBus`，处理器彼此独立时用 `ParallelTypedEventBus`，多个具名事件家族用 `EventBus`。只有其他上下文需要通知时才增加 `BroadcastTypedEventBus`；传输不会确认远端处理完成。

## 选择专题

| 专题                                              | 用途                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [事件与本地投递](events-and-delivery.md)          | 单一负载类型选择类型化总线，多种具名事件选择 `EventBus<Events>`。这些实现不持久化事件、不重试投递，也不会把处理器失败转换成业务事务失败。  |
| [广播总线与消息传输](broadcast-and-messengers.md) | `BroadcastTypedEventBus<EVENT>` 在本地 `TypedEventBus<EVENT>` 上增加跨上下文投递。传输仅提供通知，没有确认、远端完成等待、重放或送达保证。 |

## 最小完整示例

```ts
import { EventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

type Events = { saved: { id: string }; signedOut: undefined };
const bus = new EventBus<Events>(
  type => new SerialTypedEventBus<unknown>(type),
);
const received: string[] = [];
bus.on('saved', {
  name: 'audit',
  order: 0,
  once: true,
  handle: event => {
    received.push(event.id);
  },
});
await bus.emit('saved', { id: '1' });
await bus.emit('saved', { id: '2' });
console.assert(received.join(',') === '1');
bus.destroy();
```

[完整公开符号索引](./symbols.md)
