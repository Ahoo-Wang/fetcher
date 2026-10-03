---
title: '广播总线与消息传输'
description: '广播总线与消息传输 — @ahoo-wang/fetcher-eventbus 5.0.0'
---

# 广播总线与消息传输

`BroadcastTypedEventBus<EVENT>` 在本地 `TypedEventBus<EVENT>` 上增加跨上下文投递。传输仅提供通知，没有确认、远端完成等待、重放或送达保证。

构造广播总线时保留 delegate，以便单独清理它的处理器。`destroy()` 只关闭总线自己创建的 messenger。通过 `options.messenger` 传入的 messenger 归调用方所有：`destroy()` 只将总线与其分离（把它的 `onmessage` 换成空操作）并保持打开，不再有使用者时由调用方自行关闭。由于 messenger 只有一个 `onmessage`，独立管理生命周期的广播总线仍应各自使用 messenger。

## 广播选项与流程 {#broadcast}

`new BroadcastTypedEventBus(options: BroadcastTypedEventBusOptions<EVENT>)` 必填 `delegate`。`type`、`handlers` 来自 delegate，`on`/`off` 直接转发。默认消息器为 `createCrossTabMessenger('_broadcast_:' + delegate.type)`；没有可用实现时构造抛 `Error('Messenger setup failed')`。

| 选项/成员                                 | 默认值       | 契约                                                                                                                                              |
| ----------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messenger?: CrossTabMessenger`           | 按运行时选择 | 注入以控制环境和通道所有权。                                                                                                                      |
| `messageTransformer.serialize(event)`     | 无转换器     | 把出站事件转为传输数据。                                                                                                                          |
| `messageTransformer.deserialize(message)` | 无转换器     | 将入站数据恢复为 EVENT。                                                                                                                          |
| `serializeBeforeDispatch?`                | false        | true 在本地处理前快照，false 在本地投递后序列化。                                                                                                 |
| `fallbackSerialize?(message, error)`      | 无           | postMessage 抛错后转换一次，并重试 postMessage 一次。                                                                                             |
| `destroy()`                               | —            | 关闭自己创建的消息器；传入的消息器只分离、保持打开，交由其所有者关闭。不销毁 delegate，不移除其处理器。之后的 emit 仍执行本地处理器，但不再发布。 |

`emit` 先等待本地 delegate，再发布消息（可选预序列化）。出站序列化/发布失败会拒绝 emit，此时本地可能已经投递。发布抛错（例如 BroadcastChannel 上不可克隆的事件抛 DataCloneError）会拒绝 emit，除非设置了 `fallbackSerialize` 且重试成功。`destroy()` 之后，emit 跳过序列化和发布，本地投递完成后即完成。预序列化抛错则阻止本地投递。入站消息解码后只交给 delegate，不再次广播；解码/delegate 拒绝被捕获并警告。可修改的 `messageTransformer` 影响后续操作。

## CrossTabMessenger {#messengers}

契约为 `postMessage(message: any): void`、setter `onmessage: CrossTabMessageHandler`、`close(): void`；处理器类型为 `(message: any) => void`。设置 onmessage 替换回调。消息器不会收到自己发布的消息，但同一标签页内同一通道的其他消息器因传输而异：`BroadcastChannelMessenger` 会投递给它们（BroadcastChannel 会送达同一文档在内的所有其他通道对象），`StorageMessenger` 不会，因为写入值的文档不会触发 `storage` 事件。使用存储回退时，同一标签页内的两个总线互相收不到消息。

`isBroadcastChannelSupported()` 检查全局及原型 postMessage；`isStorageEventSupported()` 检查 StorageEvent、window.addEventListener 和 localStorage 或 sessionStorage。这些只是功能探测，不验证访问权限。`createCrossTabMessenger(channelName)` 优先 BroadcastChannelMessenger，其次 StorageMessenger，否则返回 undefined。构造错误不会被静默转换为回退。

`new BroadcastChannelMessenger(channelName)` 包装原生 BroadcastChannel，转发 `MessageEvent.data`，使用结构化克隆；不支持的数据可能抛 DataCloneError。通道支持 `unref()`（Node）时会调用它，打开的消息器不会阻止进程退出。`close()` 关闭其通道。

## StorageMessenger {#storage}

`new StorageMessenger(options: StorageMessengerOptions)` 要求浏览器提供 window 和 localStorage，即使已注入后端。必填 `channelName`，可选 `storage`（localStorage）、`ttl`（1000 毫秒）、`cleanupInterval`（60000 毫秒）。

每次发布将 `StorageMessage {data: any, timestamp: number}` JSON 编码到带唯一通道前缀的存储键，并安排 ttl 后删除。定期清理仅删除匹配通道的过期/无效消息。接收时检查 storageArea 和键格式，无效 JSON 会警告。TTL 控制清理，不提供可靠重放，也不是接收时的年龄过滤。原生 storage 事件不通知写入来源文档。

`close()` 移除 storage 监听，清理周期与待删除定时器，并删除本消息器写入且仍待删除的消息键。发布时 JSON stringify、配额、访问失败可抛错。sessionStorage 后端遵循平台受限的共享范围。发送者的本地 delegate 独立负责本地投递。

## 完整示例 {#example}

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
  createCrossTabMessenger,
} from '@ahoo-wang/fetcher-eventbus';

const messenger = createCrossTabMessenger('settings-demo');
if (messenger) {
  const delegate = new SerialTypedEventBus<{ theme: string }>('settings');
  const bus = new BroadcastTypedEventBus({ delegate, messenger });
  bus.on({
    name: 'ui',
    handle: event => {
      console.log(event.theme);
    },
  });
  try {
    await bus.emit({ theme: 'dark' });
  } finally {
    bus.destroy();
    delegate.destroy();
    messenger.close();
  }
}
```

## 公开符号与源码 {#symbols}

| 符号                                                                      | 实现                                                                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="broadcasttypedeventbusoptions"></a>`BroadcastTypedEventBusOptions` | [broadcastTypedEventBus.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L30)                  |
| <a id="broadcasttypedeventbus"></a>`BroadcastTypedEventBus`               | [broadcastTypedEventBus.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L127)                |
| <a id="broadcastchannelmessenger"></a>`BroadcastChannelMessenger`         | [broadcastChannelMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/broadcastChannelMessenger.ts#L19) |
| <a id="crosstabmessagehandler"></a>`CrossTabMessageHandler`               | [crossTabMessenger.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L17)                 |
| <a id="crosstabmessenger"></a>`CrossTabMessenger`                         | [crossTabMessenger.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L32)                 |
| <a id="isbroadcastchannelsupported"></a>`isBroadcastChannelSupported`     | [crossTabMessenger.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L53)                 |
| <a id="isstorageeventsupported"></a>`isStorageEventSupported`             | [crossTabMessenger.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L60)                 |
| <a id="createcrosstabmessenger"></a>`createCrossTabMessenger`             | [crossTabMessenger.ts:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/crossTabMessenger.ts#L70)                 |
| <a id="storagemessengeroptions"></a>`StorageMessengerOptions`             | [storageMessenger.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L19)                   |
| <a id="storagemessage"></a>`StorageMessage`                               | [storageMessenger.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L27)                   |
| <a id="storagemessenger"></a>`StorageMessenger`                           | [storageMessenger.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/messengers/storageMessenger.ts#L35)                   |

[包索引](./index.md)
