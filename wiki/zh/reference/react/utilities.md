---
title: '最新值与稳定值'
description: '最新值与稳定值 — @ahoo-wang/fetcher-react 6.0.0'
---

# 最新值与稳定值

请求 Hook 内部依赖两个小 Hook，它们也被导出，供你自己的 effect 和回调使用。两者本身都不会触发渲染。

| API                     | 返回与生命周期                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useLatest(value)`      | 每次 render 提交后（insertion effect）更新的 `RefObject`，被丢弃的并发 render 不会留下它的值。在回调和 effect 中读取；render 中读取得到上次提交的值。 |
| `useStableValue(value)` | 返回 `value`，但内容深相等（`dequal`）时保留之前的引用。内联对象可以作为 effect 依赖，而不会每次 render 都重新运行。                                  |

查询 Hook 正是用 `useStableValue` 判断查询是否变化：每次 render 内联写的 `{ page: 1 }` 在内容不同之前始终是同一个值。它只比较内容，不复制、不冻结、不校验。需要在静默期后才跟随输入的值，请使用 [`useDebouncedValue`](./debounce#api-useDebouncedValue)；需要防抖调用，请使用 [`useDebouncedCallback`](./debounce#api-useDebouncedCallback)。

## 6.0 中移除 {#removed-in-6-0}

| 已移除                                    | 替代                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| 全屏 Hook、provider、context 和 DOM 工具  | 本包不再提供；直接调用 Fullscreen API 或使用 Hook 库。                                   |
| `useRefs`、`useForceUpdate`、`useMounted` | 无替代；自己写几行代码或使用 Hook 库。                                                   |
| `useRequestId`                            | 请求标识就是 [`useExecutePromise`](./promise-and-query-state) 持有的 `AbortController`。 |

## 完整示例

```tsx
import { useEffect } from 'react';
import { useLatest, useStableValue } from '@ahoo-wang/fetcher-react';

export function Ticker({
  filter,
  onTick,
}: {
  filter: { tag: string };
  onTick: (tag: string, ticks: number) => void;
}) {
  const latestOnTick = useLatest(onTick);
  const stableFilter = useStableValue(filter);
  useEffect(() => {
    // 仅在 filter 内容变化时重启，而不是每次收到新对象时；
    // 始终调用最新的 onTick，且无需将其列为依赖。
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
      latestOnTick.current(stableFilter.tag, ticks);
    }, 1000);
    return () => clearInterval(timer);
  }, [stableFilter, latestOnTick]);
  return <p>Watching {stableFilter.tag}</p>;
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

### useLatest {#api-useLatest}

```ts
export function useLatest<T>(value: T): RefObject<T>;
```

[packages/react/src/core/useLatest.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useLatest.ts#L47)

### useStableValue {#api-useStableValue}

```ts
export function useStableValue<T>(value: T): T;
```

[packages/react/src/core/useStableValue.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useStableValue.ts#L22)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec)
