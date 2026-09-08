---
title: '防抖执行'
description: '防抖执行 — @ahoo-wang/fetcher-react 5.0.0'
---

# 防抖执行

防抖 Hook 区分等待定时器和已开始的请求。都暴露 `run(...args): void`、`cancel(): void`、`isPending(): boolean`。`run` 不返回可等待的结果；`isPending` 读取定时器状态，不是请求 loading。

| 选项 / Hook                                          | 行为                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `debounce.delay`                                     | 必填毫秒值，没有默认延迟。                                                                     |
| `leading` / `trailing`                               | 默认 false / true；显式都关闭会在 Hook 执行时抛错。                                            |
| `useDebouncedCallback(callback, options)`            | 通过 ref 读取最新回调和选项；新 run 替换等待中的 trailing 定时器并保留最新参数。               |
| `useDebouncedExecutePromise` / `useDebouncedFetcher` | 用 `run` 替换 `execute`；保留 result/error/reset/abort，Fetcher 还带 exchange。                |
| `useDebouncedQuery` / `useDebouncedFetcherQuery`     | 保留 getQuery/setQuery，用 run 替换 execute；当前实现必须显式 `autoExecute: true` 才自动调度。 |

同时开启 leading/trailing 时，首次立即调用；孤立的 leading 调用不会额外执行一次 trailing。延迟内的后续调用可以安排 trailing。公开 `cancel()` 删除计划任务，但保留上次 leading 时间戳，不取消已运行请求；反之，请求 `abort()` 不清除等待中的定时器，要取消整个用户操作应两者都调用。`reset()` 只清除结果状态。卸载清除定时器，请求 Hook 还会取消当前执行。

查询变体对响应式 query 做深比较。关闭 autoExecute 或显式设置 `query: undefined` 会取消自动调度的工作，手动 run 单独处理。替换查询输入不表示立即取消当前网络请求，取消发生在下一次执行开始时。回调异常和 rejected promise 需要对应处理；定时器不会把拒绝交给 run 调用者。异步操作优先使用执行器默认的错误状态处理。

## 定时器与请求控制 {#cancellation-controls}

| 控制                 | 待触发定时器 | 正在运行的操作            | 结果状态                     |
| -------------------- | ------------ | ------------------------- | ---------------------------- |
| `cancel()`           | 移除         | 继续运行                  | 保留                         |
| 请求变体的 `abort()` | 保留         | 发出 abort 并使旧结果失效 | Idle                         |
| 请求变体的 `reset()` | 保留         | 继续运行                  | 当前清空；后续完成仍可能更新 |
| 卸载                 | 清除         | 请求变体 abort            | 不再提交挂载状态             |

`delay` 无默认值。设置 `debounce: { delay: 300 }` 表示 300 毫秒静默间隔。普通 `useQuery` 默认自动执行；当前防抖查询实现需要显式 `autoExecute: true`。`isPending()` 表示定时器，`loading` 表示已启动的 supplier；两者均不证明服务端写入被撤销。

## 完整示例

```tsx
import { useDebouncedQuery } from '@ahoo-wang/fetcher-react';
export function Preview() {
  const query = useDebouncedQuery<string, string>({
    initialQuery: '',
    autoExecute: true,
    debounce: { delay: 300 },
    execute: async value => value.toUpperCase(),
  });
  return (
    <section>
      <input aria-label="Text" onChange={e => query.setQuery(e.target.value)} />
      <button
        onClick={() => {
          query.cancel();
          query.abort();
        }}
      >
        Cancel
      </button>
      <output>{query.result}</output>
    </section>
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

### useDebouncedCallback {#api-useDebouncedCallback}

```ts
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedCallbackReturn<T>;
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L87)

### UseDebouncedCallbackOptions {#api-UseDebouncedCallbackOptions}

```ts
export interface UseDebouncedCallbackOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L19)

### UseDebouncedCallbackReturn {#api-UseDebouncedCallbackReturn}

```ts
export interface UseDebouncedCallbackReturn<T extends (...args: any[]) => any> {
  readonly run: (...args: Parameters<T>) => void;
  readonly cancel: () => void;
  readonly isPending: () => boolean;
}
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L32)

### useDebouncedExecutePromise {#api-useDebouncedExecutePromise}

```ts
export function useDebouncedExecutePromise<R = unknown, E = FetcherError>(
  options: UseDebouncedExecutePromiseOptions<R, E>,
): UseDebouncedExecutePromiseReturn<R, E>;
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:119](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L119)

### DebounceCapable {#api-DebounceCapable}

```ts
export interface DebounceCapable {
  debounce: UseDebouncedCallbackOptions;
}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L32)

### UseDebouncedExecutePromiseOptions {#api-UseDebouncedExecutePromiseOptions}

```ts
export interface UseDebouncedExecutePromiseOptions<R, E = unknown>
  extends UseExecutePromiseOptions<R, E>, DebounceCapable {}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L49)

### UseDebouncedExecutePromiseReturn {#api-UseDebouncedExecutePromiseReturn}

```ts
export interface UseDebouncedExecutePromiseReturn<R, E = unknown>
  extends
    Omit<UseExecutePromiseReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseExecutePromiseReturn<R, E>['execute']> {}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L60)

### useDebouncedQuery {#api-useDebouncedQuery}

```ts
export function useDebouncedQuery<Q, R, E = FetcherError>(
  options: UseDebouncedQueryOptions<Q, R, E>,
): UseDebouncedQueryReturn<Q, R, E>;
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:140](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L140)

### UseDebouncedQueryOptions {#api-UseDebouncedQueryOptions}

```ts
export interface UseDebouncedQueryOptions<Q, R, E = FetcherError>
  extends UseQueryOptions<Q, R, E>, DebounceCapable {}
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L28)

### UseDebouncedQueryReturn {#api-UseDebouncedQueryReturn}

```ts
export interface UseDebouncedQueryReturn<Q, R, E = FetcherError>
  extends
    Omit<UseQueryReturn<Q, R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseQueryReturn<Q, R, E>['execute']> {}
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L37)

### useDebouncedFetcher {#api-useDebouncedFetcher}

```ts
export function useDebouncedFetcher<R, E = FetcherError>(
  options: UseDebouncedFetcherOptions<R, E>,
): UseDebouncedFetcherReturn<R, E>;
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L112)

### UseDebouncedFetcherOptions {#api-UseDebouncedFetcherOptions}

```ts
export interface UseDebouncedFetcherOptions<R, E = FetcherError>
  extends UseFetcherOptions<R, E>, DebounceCapable {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L29)

### UseDebouncedFetcherReturn {#api-UseDebouncedFetcherReturn}

```ts
export interface UseDebouncedFetcherReturn<R, E = FetcherError>
  extends
    Omit<UseFetcherReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseFetcherReturn<R, E>['execute']> {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L40)

### useDebouncedFetcherQuery {#api-useDebouncedFetcherQuery}

```ts
export function useDebouncedFetcherQuery<Q, R, E = FetcherError>(
  options: UseDebouncedFetcherQueryOptions<Q, R, E>,
): UseDebouncedFetcherQueryReturn<Q, R, E>;
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:145](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L145)

### UseDebouncedFetcherQueryOptions {#api-UseDebouncedFetcherQueryOptions}

```ts
export interface UseDebouncedFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherQueryOptions<Q, R, E>, DebounceCapable {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L33)

### UseDebouncedFetcherQueryReturn {#api-UseDebouncedFetcherQueryReturn}

```ts
export interface UseDebouncedFetcherQueryReturn<Q, R, E = FetcherError>
  extends
    Omit<UseFetcherQueryReturn<Q, R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseFetcherQueryReturn<Q, R, E>['execute']> {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L47)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [Wow 查询 Hook](./wow) · [监控、ref 与全屏](./monitoring-and-utilities)
