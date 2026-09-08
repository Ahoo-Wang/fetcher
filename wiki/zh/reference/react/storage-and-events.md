---
title: '存储与事件订阅'
description: '存储与事件订阅 — @ahoo-wang/fetcher-react 5.0.0'
---

# 存储与事件订阅

这些 Hook 将共享外部资源接入组件。保持 `KeyStorage` 和事件总线实例稳定，由创建者负责销毁。组件卸载只退订监听，不销毁共享存储或总线。

| API                                          | 输入 / 返回 / 默认值                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `useKeyStorage(storage)`                     | 返回 `[T \| null, set(T), remove()]`；无存储值时为 null。                                           |
| `useKeyStorage(storage, defaultValue)`       | 返回 `[T, set(T), remove()]`；存储为 null 时读取回退值，不会自动持久化默认值。                      |
| `useImmerKeyStorage(storage, defaultValue?)` | 相同元组，但 setter 接受 Immer draft updater；返回 null 删除键。                                    |
| `useEventSubscription({ bus, handler })`     | 自动调用 `bus.on(handler)`；返回值为 boolean 的 subscribe/unsubscribe；清理调用 off(handler.name)。 |

存储使用 `useSyncExternalStore`，缓存内容深相等的快照，实例变化时重订阅。SSR 使用同一个 snapshot getter，因此调用者提供的存储必须适用于该运行环境。序列化/存储异常直接传播，不会转换成 Promise 错误状态。Immer updater 调用时读取当前存储，连续更新不依赖某次渲染的旧快照。保留的回调继续操作其捕获的存储。

事件处理器带名称，应为每个订阅者使用唯一名称。重复名称可能导致注册失败并记录警告，而清理仍按名称退订。保持 handler 身份稳定以避免无谓重订阅。处理器失败传播与投递顺序由总线决定，本 Hook 不改变这些策略，也不代发布者等待投递。

## 完整示例

```tsx
import { KeyStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';
import { useImmerKeyStorage } from '@ahoo-wang/fetcher-react';
const preferences = new KeyStorage<{ count: number }>({
  key: 'preferences',
  storage: new InMemoryStorage(),
});
export function Counter() {
  const [value, update, remove] = useImmerKeyStorage(preferences, { count: 0 });
  return (
    <section>
      <button
        onClick={() =>
          update(draft => {
            draft.count += 1;
          })
        }
      >
        {value.count}
      </button>
      <button onClick={remove}>Reset stored value</button>
    </section>
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./index#public-symbols) 定位。运行时默认值和失败行为以本页上文为准。

### useKeyStorage {#api-useKeyStorage}

```ts
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void, () => void];
```

[packages/react/src/storage/useKeyStorage.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useKeyStorage.ts#L19)

```ts
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (value: T) => void, () => void];
```

[packages/react/src/storage/useKeyStorage.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useKeyStorage.ts#L23)

### useImmerKeyStorage {#api-useImmerKeyStorage}

```ts
export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [
  T | null,
  (updater: (draft: T | null) => T | null | void) => void,
  () => void,
];
```

[packages/react/src/storage/useImmerKeyStorage.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useImmerKeyStorage.ts#L23)

```ts
export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (updater: (draft: T) => T | null | void) => void, () => void];
```

[packages/react/src/storage/useImmerKeyStorage.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useImmerKeyStorage.ts#L31)

### useEventSubscription {#api-useEventSubscription}

```ts
export function useEventSubscription<EVENT = unknown>(
  options: UseEventSubscriptionOptions<EVENT>,
): UseEventSubscriptionReturn;
```

[packages/react/src/eventbus/useEventSubscription.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L92)

### UseEventSubscriptionOptions {#api-UseEventSubscriptionOptions}

```ts
export interface UseEventSubscriptionOptions<EVENT> {
  bus: TypedEventBus<EVENT>;
  handler: EventHandler<EVENT>;
}
```

[packages/react/src/eventbus/useEventSubscription.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L21)

### UseEventSubscriptionReturn {#api-UseEventSubscriptionReturn}

```ts
export interface UseEventSubscriptionReturn {
  subscribe: () => boolean;
  unsubscribe: () => boolean;
}
```

[packages/react/src/eventbus/useEventSubscription.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L35)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [安全 Hook 与路由守卫](./cosec) · [Wow 查询 Hook](./wow) · [监控、ref 与全屏](./monitoring-and-utilities)
