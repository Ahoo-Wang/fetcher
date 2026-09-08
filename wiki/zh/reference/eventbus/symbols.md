---
next: false
title: 'eventbus 公开符号索引'
description: '完整根入口导出、行为契约及源码位置索引。'
---

# eventbus 公开符号索引

已知符号名时从下表定位。安装与入口选择请先看[包概览](./index.md)。

## 公开导出索引 {#exports}

| 符号                            | 契约                                                                            | 源码                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AbstractTypedEventBus`         | [事件与本地投递](events-and-delivery.md#abstracttypedeventbus)                  | [abstractTypedEventBus.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/abstractTypedEventBus.ts#L17)                    |
| `BroadcastTypedEventBusOptions` | [广播总线与消息传输](broadcast-and-messengers.md#broadcasttypedeventbusoptions) | [broadcastTypedEventBus.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L24)                  |
| `BroadcastTypedEventBus`        | [广播总线与消息传输](broadcast-and-messengers.md#broadcasttypedeventbus)        | [broadcastTypedEventBus.ts:121](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L121)                |
| `TypeEventBusSupplier`          | [事件与本地投递](events-and-delivery.md#typeeventbussupplier)                   | [eventBus.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L20)                                              |
| `EventBus`                      | [事件与本地投递](events-and-delivery.md#eventbus)                               | [eventBus.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L35)                                              |
| `BroadcastChannelMessenger`     | [广播总线与消息传输](broadcast-and-messengers.md#broadcastchannelmessenger)     | [broadcastChannelMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/broadcastChannelMessenger.ts#L19) |
| `CrossTabMessageHandler`        | [广播总线与消息传输](broadcast-and-messengers.md#crosstabmessagehandler)        | [crossTabMessenger.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L17)                 |
| `CrossTabMessenger`             | [广播总线与消息传输](broadcast-and-messengers.md#crosstabmessenger)             | [crossTabMessenger.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L25)                 |
| `isBroadcastChannelSupported`   | [广播总线与消息传输](broadcast-and-messengers.md#isbroadcastchannelsupported)   | [crossTabMessenger.ts:46](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L46)                 |
| `isStorageEventSupported`       | [广播总线与消息传输](broadcast-and-messengers.md#isstorageeventsupported)       | [crossTabMessenger.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L53)                 |
| `createCrossTabMessenger`       | [广播总线与消息传输](broadcast-and-messengers.md#createcrosstabmessenger)       | [crossTabMessenger.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L63)                 |
| `StorageMessengerOptions`       | [广播总线与消息传输](broadcast-and-messengers.md#storagemessengeroptions)       | [storageMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L19)                   |
| `StorageMessage`                | [广播总线与消息传输](broadcast-and-messengers.md#storagemessage)                | [storageMessenger.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L27)                   |
| `StorageMessenger`              | [广播总线与消息传输](broadcast-and-messengers.md#storagemessenger)              | [storageMessenger.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L35)                   |
| `NameGenerator`                 | [事件与本地投递](events-and-delivery.md#namegenerator)                          | [nameGenerator.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L17)                                    |
| `DefaultNameGenerator`          | [事件与本地投递](events-and-delivery.md#defaultnamegenerator)                   | [nameGenerator.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L24)                                    |
| `nameGenerator`                 | [事件与本地投递](events-and-delivery.md#namegenerator-instance)                 | [nameGenerator.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L41)                                    |
| `ParallelTypedEventBus`         | [事件与本地投递](events-and-delivery.md#paralleltypedeventbus)                  | [parallelTypedEventBus.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/parallelTypedEventBus.ts#L33)                    |
| `SerialTypedEventBus`           | [事件与本地投递](events-and-delivery.md#serialtypedeventbus)                    | [serialTypedEventBus.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/serialTypedEventBus.ts#L34)                        |
| `TypedEventBus`                 | [事件与本地投递](events-and-delivery.md#typedeventbus)                          | [typedEventBus.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/typedEventBus.ts#L21)                                    |
| `EventType`                     | [事件与本地投递](events-and-delivery.md#eventtype)                              | [types.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L17)                                                    |
| `EventHandler`                  | [事件与本地投递](events-and-delivery.md#eventhandler)                           | [types.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L19)                                                    |
