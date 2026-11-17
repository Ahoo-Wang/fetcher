---
title: '存储与事件订阅'
description: '存储与事件订阅 — @ahoo-wang/fetcher-react 6.0.0'
---

# 存储与事件订阅

这些 Hook 将共享外部资源接入组件。保持 `KeyStorage` 和事件总线实例稳定，由创建者负责销毁。组件卸载只退订监听，不销毁共享存储或总线。

| API                                          | 输入 / 返回 / 默认值                                                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useKeyStorage(storage)`                     | 返回 `[T \| null, set(T), remove()]`；无存储值时为 null。                                                                                                                                                                                                          |
| `useKeyStorage(storage, defaultValue)`       | 返回 `[T, set(T), remove()]`；存储为 null 时读取回退值，不会自动持久化默认值。默认值可能为 `null` 或 `undefined` 时返回 `T \| null`，与运行时一致。                                                                                                                |
| `useImmerKeyStorage(storage, defaultValue?)` | 相同元组，但 setter 接受 Immer draft updater；返回 null 删除键。updater 接收 `Draft<T>`（没有非空默认值时为 `Draft<T> \| null`），因此 readonly 状态在其中可修改。                                                                                                 |
| `useEventSubscription({ bus, handler })`     | 以 `handler.name` 自动订阅；返回值为 boolean 的 subscribe/unsubscribe；清理（包括 `unsubscribe()`）只移除该 Hook 自己的订阅（也包括由 `subscribe()` 注册的订阅，例如在 layout effect 中调用），不会移除 `once` 处理器执行后或 `unsubscribe()` 后复用同名的新订阅。 |

存储使用 `useSyncExternalStore`，实例变化时重订阅。服务端快照为 `defaultValue ?? null`，因此服务端渲染不读取存储：在服务端和 hydration 期间 Hook 先渲染默认值（因此 `useSecurity` 与 `SecurityProvider` 以未认证开始），随后渲染存储值。纯客户端渲染从首次渲染起读取存储。存储值按 `KeyStorage.get()` 返回的引用作为快照，不做内容比较，因此自定义 serializer 恢复的值（含私有字段的类实例、循环结构）都会更新 Hook；只有默认回退值按深比较，内联默认对象在多次渲染间保持同一引用。序列化/存储异常直接传播，不会转换成 Promise 错误状态。Immer updater 调用时读取当前存储，连续更新不依赖某次渲染的旧快照。保留的回调继续操作其捕获的存储。

事件处理器带名称，应为每个订阅者使用唯一名称。重复名称可能导致注册失败并记录警告；此时清理不动该名称，另一订阅者的处理器保持注册。Hook 按 `bus` 及 handler 的 `name`/`order`/`once` 只订阅一次，每个事件调用最新的 `handle`，因此内联 handler 对象不会每次渲染都重新订阅；改变 bus、name、order 或 once 才会。处理器失败传播与投递顺序由总线决定，本 Hook 不改变这些策略，也不代发布者等待投递。

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

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

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
  defaultValue: NonNullable<T>,
): [T, (value: T) => void, () => void];
```

[packages/react/src/storage/useKeyStorage.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useKeyStorage.ts#L23)

```ts
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T | null | undefined,
): [T | null, (value: T) => void, () => void];
```

[packages/react/src/storage/useKeyStorage.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useKeyStorage.ts#L29)

### useImmerKeyStorage {#api-useImmerKeyStorage}

```ts
export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [
  T | null,
  (updater: (draft: Draft<T> | null) => T | null | void) => void,
  () => void,
];
```

[packages/react/src/storage/useImmerKeyStorage.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useImmerKeyStorage.ts#L24)

```ts
export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: NonNullable<T>,
): [T, (updater: (draft: Draft<T>) => T | null | void) => void, () => void];
```

[packages/react/src/storage/useImmerKeyStorage.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useImmerKeyStorage.ts#L32)

```ts
export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T | null | undefined,
): [
  T | null,
  (updater: (draft: Draft<T> | null) => T | null | void) => void,
  () => void,
];
```

[packages/react/src/storage/useImmerKeyStorage.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/storage/useImmerKeyStorage.ts#L38)

### useEventSubscription {#api-useEventSubscription}

```ts
export function useEventSubscription<EVENT = unknown>(
  options: UseEventSubscriptionOptions<EVENT>,
): UseEventSubscriptionReturn;
```

[packages/react/src/eventbus/useEventSubscription.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L98)

### UseEventSubscriptionOptions {#api-UseEventSubscriptionOptions}

```ts
export interface UseEventSubscriptionOptions<EVENT> {
  bus: TypedEventBus<EVENT>;
  handler: EventHandler<EVENT>;
}
```

[packages/react/src/eventbus/useEventSubscription.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L22)

### UseEventSubscriptionReturn {#api-UseEventSubscriptionReturn}

```ts
export interface UseEventSubscriptionReturn {
  subscribe: () => boolean;
  unsubscribe: () => boolean;
}
```

[packages/react/src/eventbus/useEventSubscription.ts:36](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L36)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [安全 Hook 与路由守卫](./cosec) · [最新值与稳定值](./utilities)
