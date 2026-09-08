---
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

## 选择专题

| 专题                                                | 用途                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md)          | 单一负载类型选择类型化总线，多种具名事件选择 `EventBus<Events>`。这些实现不持久化事件、不重试投递，也不会把处理器失败转换成业务事务失败。  |
| [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md) | `BroadcastTypedEventBus<EVENT>` 在本地 `TypedEventBus<EVENT>` 上增加跨上下文投递。传输仅提供通知，没有确认、远端完成等待、重放或送达保证。 |

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

## 公开导出索引 {#exports}

| 符号                            | 契约                                                                              | 源码                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AbstractTypedEventBus`         | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#abstracttypedeventbus)                  | [abstractTypedEventBus.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/abstractTypedEventBus.ts#L17)                    |
| `BroadcastTypedEventBusOptions` | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#broadcasttypedeventbusoptions) | [broadcastTypedEventBus.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L24)                  |
| `BroadcastTypedEventBus`        | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#broadcasttypedeventbus)        | [broadcastTypedEventBus.ts:121](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L121)                |
| `TypeEventBusSupplier`          | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#typeeventbussupplier)                   | [eventBus.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L20)                                              |
| `EventBus`                      | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#eventbus)                               | [eventBus.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L35)                                              |
| `BroadcastChannelMessenger`     | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#broadcastchannelmessenger)     | [broadcastChannelMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/broadcastChannelMessenger.ts#L19) |
| `CrossTabMessageHandler`        | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#crosstabmessagehandler)        | [crossTabMessenger.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L17)                 |
| `CrossTabMessenger`             | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#crosstabmessenger)             | [crossTabMessenger.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L25)                 |
| `isBroadcastChannelSupported`   | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#isbroadcastchannelsupported)   | [crossTabMessenger.ts:46](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L46)                 |
| `isStorageEventSupported`       | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#isstorageeventsupported)       | [crossTabMessenger.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L53)                 |
| `createCrossTabMessenger`       | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#createcrosstabmessenger)       | [crossTabMessenger.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L63)                 |
| `StorageMessengerOptions`       | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#storagemessengeroptions)       | [storageMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L19)                   |
| `StorageMessage`                | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#storagemessage)                | [storageMessenger.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L27)                   |
| `StorageMessenger`              | [广播总线与消息传输](/zh/reference/eventbus/broadcast-and-messengers.md#storagemessenger)              | [storageMessenger.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L35)                   |
| `NameGenerator`                 | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#namegenerator)                          | [nameGenerator.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L17)                                    |
| `DefaultNameGenerator`          | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#defaultnamegenerator)                   | [nameGenerator.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L24)                                    |
| `nameGenerator`                 | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#namegenerator-instance)                 | [nameGenerator.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L41)                                    |
| `ParallelTypedEventBus`         | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#paralleltypedeventbus)                  | [parallelTypedEventBus.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/parallelTypedEventBus.ts#L33)                    |
| `SerialTypedEventBus`           | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#serialtypedeventbus)                    | [serialTypedEventBus.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/serialTypedEventBus.ts#L34)                        |
| `TypedEventBus`                 | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#typedeventbus)                          | [typedEventBus.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/typedEventBus.ts#L21)                                    |
| `EventType`                     | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#eventtype)                              | [types.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L17)                                                    |
| `EventHandler`                  | [事件与本地投递](/zh/reference/eventbus/events-and-delivery.md#eventhandler)                           | [types.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L19)                                                    |

## 旧章节链接

旧版参考链接仍可定位到下列专题。

| 旧章节 | 新专题 |
| --- | --- |
| <span id="安装"></span>安装 | [阅读对应专题](/zh/reference/eventbus/index.md) |
| <span id="选择入口"></span>选择入口 | [阅读对应专题](/zh/reference/eventbus/index.md) |
| <span id="类型化与命名事件"></span>类型化与命名事件 | [阅读对应专题](/zh/reference/eventbus/events-and-delivery.md) |
| <span id="投递与失败契约"></span>投递与失败契约 | [阅读对应专题](/zh/reference/eventbus/events-and-delivery.md) |
| <span id="跨标签页-bus-与-messenger-选择"></span>跨标签页 Bus 与 Messenger 选择 | [阅读对应专题](/zh/reference/eventbus/broadcast-and-messengers.md) |
| <span id="生命周期与故障定位"></span>生命周期与故障定位 | [阅读对应专题](/zh/reference/eventbus/index.md) |
| <span id="源码参考"></span>源码参考 | [阅读对应专题](/zh/reference/eventbus/index.md) |
