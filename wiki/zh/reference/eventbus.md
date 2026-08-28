---
title: 事件总线参考
description: 选择类型化的进程内或跨标签页事件传递，并管理其生命周期。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-eventbus`

本包用于类型化的进程内 Fan-out。它不提供请求/响应语义、持久化投递、重试或全局单例。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus
```

`@ahoo-wang/fetcher` 是 Peer Dependency。跨标签页投递还要求浏览器支持
`BroadcastChannel` 或 `storage` 事件。

## 选择入口

| 需求 | 入口 | 投递与所有权 |
| --- | --- | --- |
| 单一载荷类型 | `SerialTypedEventBus<E>` | 按 `order` 升序逐个等待 Handler。 |
| 相互独立的 Handler | `ParallelTypedEventBus<E>` | 同时启动 Handler，等待全部完成。 |
| 命名载荷映射 | `EventBus<Events>` | 每个名称惰性拥有一个 Typed Bus。 |
| 其他浏览器标签页/窗口 | `BroadcastTypedEventBus<E>` | 先本地投递，再通过 Messenger 发送。 |
| 选择浏览器传输 | `createCrossTabMessenger(name)` | 优先 `BroadcastChannel`，其次 `storage` 事件。 |

`SerialTypedEventBus` 按 `order` 升序排序（默认 `0`；相同值保持注册顺序）。
`ParallelTypedEventBus` 不排序，且不保证完成顺序。

## 类型化与命名事件

`TypedEventBus<E>` 包含 `type`、复制后的 `handlers` 数组，以及 `on`、`off`、
`emit`、`destroy`。`EventHandler<E>` 包含唯一的 `name`、
`handle(event): void | Promise<void>` 和可选的 `once` / `order`。

```ts
import {
  EventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

type AppEvents = {
  signedIn: { userId: string };
  signedOut: undefined;
};

const events = new EventBus<AppEvents>(
  type => new SerialTypedEventBus(type),
);

events.on('signedIn', {
  name: 'audit-sign-in',
  once: true,
  handle: ({ userId }) => console.log(userId),
});

await events.emit('signedIn', { userId: 'u-42' });
events.off('signedIn', 'audit-sign-in');
events.destroy();
```

名称已存在时，`on()` 返回 `false` 且不会替换旧 Handler。目标 Bus 或 Handler 不存在时，
`off()` 返回 `false`。尚未创建该命名 Bus 时，`EventBus.emit()` 返回 `undefined`；仅调用
`on()` 才会创建子 Bus。

## 投递与失败契约

| Bus | Handler 启动/顺序 | `emit()` 解析时机 | `once` | Handler throw/reject |
| --- | --- | --- | --- | --- |
| `SerialTypedEventBus` | 逐个执行，按 `order` 升序（相同值保持注册顺序） | 所有 Handler settle 后 | 尝试执行后移除 | 捕获后发往 `console.warn`；后续 Handler 继续。 |
| `ParallelTypedEventBus` | 并发执行；没有完成顺序 | 包装后 Handler 的 `Promise.all` 完成后 | 全部尝试结束后移除 | 捕获后发往 `console.warn`；其他 Handler 继续。 |
| `BroadcastTypedEventBus` | 本地遵循 Delegate；入站消息使用 Delegate | 本地 Delegate 完成且 `postMessage()` 返回后 | 遵循 Delegate | Delegate 错误遵循其实现；Messenger 错误从 `postMessage()` 传播。 |

Handler 的返回值会被丢弃。调用者需要结果时应直接调用函数。`once` Handler 即使自身抛错也会
在包装调用结束后移除。

## 跨标签页 Bus 与 Messenger 选择

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const cartEvents = new BroadcastTypedEventBus({
  delegate: new SerialTypedEventBus<{ itemCount: number }>('cart-changed'),
});

cartEvents.on({
  name: 'render-badge',
  handle: ({ itemCount }) => console.log(itemCount),
});

await cartEvents.emit({ itemCount: 3 });
cartEvents.destroy();
```

未提供 `messenger` 时，构造使用通道 `_broadcast_:{delegate.type}`；两种浏览器传输都
不可用时会抛出 `Error('Messenger setup failed')`。首选 `BroadcastChannelMessenger`。
回退的 `StorageMessenger` 需要 `window` 与 `localStorage`，使用 JSON 写消息，默认 `ttl`
为 1,000 ms、`cleanupInterval` 为 60,000 ms。不要发送函数、DOM Node 或其他不能
Structured Clone / JSON 化的值。

`BroadcastTypedEventBus.destroy()` 只关闭 Messenger。它保留可用的 Delegate 和其
Handler；该 Delegate 由当前所有者创建时，应单独销毁。入站消息只会本地投递，不会再次广播。

## 生命周期与故障定位

| 现象 | 检查项 |
| --- | --- |
| Handler 没有运行 | 确认 `name` 未重复注册（`on()` 返回 `true`），并且对应的命名 Bus 已创建。 |
| 顺序不符合预期 | Serial 按 `order` 升序（默认 `0`，相同值稳定）；Parallel 没有完成顺序。 |
| Handler 出错但 `emit()` 没有 reject | 查看 `console.warn`；Handler 错误被有意隔离。 |
| 广播构造失败 | 检查 `isBroadcastChannelSupported()` / `isStorageEventSupported()`，或传入 `CrossTabMessenger`。 |
| 广播清理后本地 Listener 仍存在 | 对 Delegate 调用 `destroy()`；广播清理只关闭 Messenger。 |
| Storage 回退消息消失 | localStorage 传输设计为临时消息；检查 TTL 与另一标签页是否收到 `storage` 事件。 |

每个自有 Bus 都应配对 `destroy()`，临时注册应配对 `off()`。`EventBus.destroy()` 会销毁其
创建的全部子 Bus；Typed Bus 的 `destroy()` 会清空自身 Handler。

## 源码参考

- [公共导出：index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/index.ts#L14)
- [EventHandler 与 EventType：types.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/types.ts#L17)
- [Typed Bus 契约：typedEventBus.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/typedEventBus.ts#L21)
- [Serial 投递：serialTypedEventBus.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/serialTypedEventBus.ts#L34)
- [Parallel 投递：parallelTypedEventBus.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/parallelTypedEventBus.ts#L33)
- [命名 Bus：eventBus.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts#L35)
- [Broadcast Bus：broadcastTypedEventBus.ts:111](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L111)
- [Messenger Factory：crossTabMessenger.ts:46](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L46)
