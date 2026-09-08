---
title: '事件与本地投递'
description: '事件与本地投递 — @ahoo-wang/fetcher-eventbus 5.0.0'
---

# 事件与本地投递

单一负载类型选择类型化总线，多种具名事件选择 `EventBus<Events>`。这些实现不持久化事件、不重试投递，也不会把处理器失败转换成业务事务失败。

## 事件与订阅契约 {#subscriptions}

`EventType = string`。`EventHandler<EVENT>` 必填 `name: string`、`handle(event): void | Promise<void>`；串行排序中可选 `order` 默认零，可选 `once` 默认 false。`TypedEventBus<EVENT>` 提供 `type`、`handlers`、`on`、`off`、`emit`、`destroy`。

| 方法          | 返回值                  | 契约                                             |
| ------------- | ----------------------- | ------------------------------------------------ |
| `on(handler)` | `boolean`               | 已有同名处理器时返回 false。                     |
| `off(name)`   | `boolean`               | 缺失返回 false，移除影响后续 emit。              |
| `handlers`    | `EventHandler<EVENT>[]` | 数组副本，仍包含原处理器对象。                   |
| `emit(event)` | `Promise<void>`         | 按选定策略等待处理器结束。                       |
| `destroy()`   | `void`                  | 本地总线清空处理器，没有禁止再次使用的终止状态。 |

每次 emit 快照处理器数组，并在调用任何处理器前移除所有 `once` 注册，因此并发/重入 emit 不会重复投递同一个 once 注册。投递期间增删订阅不会改变当前投递的快照。

## 串行与并行 {#delivery}

`new SerialTypedEventBus<EVENT>(type)` 按 order 升序排列，在**单次 emit 内**依次等待处理器。并发 emit 不会全局排队，不同事件的处理器可以重叠。`new ParallelTypedEventBus<EVENT>(type)` 使用 `Promise.all` 启动处理器，不按 order 排序，也不保证完成顺序。

两者继承 `AbstractTypedEventBus<EVENT>`。它的 protected `handleEvent` 捕获同步抛错和异步拒绝，输出 `console.warn` 后继续。因此内置本地 `emit` 即使有处理器失败也会完成。子类提供 `type`、`on`、`off`、`emit`，可复用此错误边界。总线不聚合处理器结果，也不隐式取消其他处理器。

## 多事件路由 {#routing}

`new EventBus<Events>(typeEventBusSupplier: TypeEventBusSupplier)` 仅在 `on(type, handler)` 时延迟创建对应总线。`TypeEventBusSupplier` 为 `(type: EventType) => TypedEventBus<unknown>`。总线不存在时 `off(type, name)` 返回 false；`emit(type, event): void | Promise<void>` 返回 undefined，不缓存事件。`destroy()` 销毁所有已创建总线并清空 Map。键使用字符串泛型，应使用固定事件映射与正确名称，不要将类型视为运行时校验。

`NameGenerator.generate(prefix): string` 由 `DefaultNameGenerator` 实现；实例级计数器生成 `prefix_1`、`prefix_2` 等。`nameGenerator` 是共享实例。名称用于本地注册标识，并非全局唯一 ID。

## 完整示例 {#example}

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

## 公开符号与源码 {#symbols}

| 符号                                                      | 实现                                                                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| <a id="abstracttypedeventbus"></a>`AbstractTypedEventBus` | [abstractTypedEventBus.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/abstractTypedEventBus.ts#L17) |
| <a id="typeeventbussupplier"></a>`TypeEventBusSupplier`   | [eventBus.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L20)                           |
| <a id="eventbus"></a>`EventBus`                           | [eventBus.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L35)                           |
| <a id="namegenerator"></a>`NameGenerator`                 | [nameGenerator.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L17)                 |
| <a id="defaultnamegenerator"></a>`DefaultNameGenerator`   | [nameGenerator.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L24)                 |
| <a id="namegenerator-instance"></a>`nameGenerator`        | [nameGenerator.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/nameGenerator.ts#L41)                 |
| <a id="paralleltypedeventbus"></a>`ParallelTypedEventBus` | [parallelTypedEventBus.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/parallelTypedEventBus.ts#L33) |
| <a id="serialtypedeventbus"></a>`SerialTypedEventBus`     | [serialTypedEventBus.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/serialTypedEventBus.ts#L34)     |
| <a id="typedeventbus"></a>`TypedEventBus`                 | [typedEventBus.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/typedEventBus.ts#L21)                 |
| <a id="eventtype"></a>`EventType`                         | [types.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L17)                                 |
| <a id="eventhandler"></a>`EventHandler`                   | [types.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L19)                                 |

[包索引](./index.md)
