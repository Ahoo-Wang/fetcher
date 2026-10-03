---
title: '防抖执行'
description: '防抖执行 — @ahoo-wang/fetcher-react 6.0.0'
---

# 防抖执行

防抖分两类，暴露的控制不同。回调防抖（`useDebouncedCallback`、`useDebouncedExecutePromise`、`useDebouncedFetcher`）延迟调用：`run(...args): void`、`cancel(): void`、`isPending(): boolean`。值防抖（`useDebouncedValue`、`useDebouncedQuery`、`useDebouncedFetcherQuery`）延迟一个值：值停止变化后 Hook 才跟上，并暴露 `pending: boolean` 和 `flush(): void`。`run` 不返回可等待的结果；`isPending()` 和 `pending` 描述定时器，不是请求 loading。

| 选项 / Hook                                          | 行为                                                                                                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `debounce.delay`                                     | 必填毫秒值，没有默认延迟。                                                                                                                                                          |
| `leading` / `trailing`                               | 默认 false / true；显式都关闭会在 Hook 执行时抛错。                                                                                                                                 |
| `useDebouncedCallback(callback, options)`            | 使用最新的回调和选项；返回的函数是稳定的。新 run 替换等待中的 trailing 定时器并保留最新参数。                                                                                       |
| `useDebouncedExecutePromise` / `useDebouncedFetcher` | 用 `run`/`cancel`/`isPending` 替换 `execute`；保留 result/error/abort/reset，Fetcher 还带 `exchange`。                                                                              |
| `useDebouncedValue(value, options)`                  | 返回 `{ value, pending, flush }`。首次渲染直接返回 `value`；之后的变化（按深比较）在延迟后应用。                                                                                    |
| `useDebouncedQuery` / `useDebouncedFetcherQuery`     | `query` 被防抖的[受控查询](./promise-and-query-state#controlled-queries)：首个查询立即执行，之后的变化在延迟后执行。增加 `pending` 和 `flush()`；`execute()` 重新执行已应用的查询。 |

同时开启 leading/trailing 时，首次立即调用；孤立的 leading 调用不会额外执行一次 trailing。延迟内的后续调用可以安排 trailing。`cancel()` 删除计划任务，但保留上次 leading 时间戳，不取消已运行请求；反之，请求 `abort()` 不清除等待中的定时器，要取消整个用户操作应两者都调用。卸载清除定时器，请求 Hook 还会取消当前执行。

查询变体与 `useQuery` 一样把查询保存在你的状态中。传入的查询与已应用的查询不同时 `pending` 为 true；`flush()` 立即应用它（用于“应用”按钮或回车）。把查询改回已应用的值会丢弃等待中的变化。应用新查询时，在途请求在新执行开始时被取消，而不是每次按键时。防抖后的 `undefined` 使查询未就绪，但不会取消已经运行的工作。回调变体中的回调异常和 rejected promise 需要自行处理；定时器不会把拒绝交给 `run` 调用者。请求 Hook 由执行器的错误状态覆盖。

## 定时器与请求控制 {#cancellation-controls}

| 控制                    | 待触发定时器 / 等待中的查询 | 正在运行的操作 | 结果状态             |
| ----------------------- | --------------------------- | -------------- | -------------------- |
| 回调变体的 `cancel()`   | 移除                        | 继续运行       | 保留                 |
| 值/查询变体的 `flush()` | 立即应用等待中的值          | 被新执行替换   | 跟随新执行           |
| 请求变体的 `abort()`    | 保留                        | 取消           | 有在途执行时为 idle  |
| 请求变体的 `reset()`    | 保留                        | 取消           | idle，清除结果和错误 |
| 卸载                    | 清除                        | 请求变体 abort | 不再提交挂载状态     |

`delay` 无默认值。设置 `debounce: { delay: 300 }` 表示 300 毫秒静默间隔。防抖查询与 `useQuery` 一样自动执行（`autoExecute` 默认 true）。`isPending()` 和 `pending` 都不证明服务端写入被撤销；`loading` 表示已启动的 supplier。

::: info 6.0 变更
`useDebouncedQuery` 和 `useDebouncedFetcherQuery` 不再返回 `run`、`cancel`、`isPending`、`setQuery` 或 `getQuery`，也不再接受 `initialQuery`。请从自己的状态传入 `query`，使用 `pending`、`flush()` 和 `execute()`。它们现在默认自动执行。`useDebouncedValue` 为新增。
:::

## 完整示例

```tsx
import { useState } from 'react';
import { useDebouncedQuery } from '@ahoo-wang/fetcher-react';

export function Preview() {
  const [text, setText] = useState('');
  const preview = useDebouncedQuery<string, string>({
    query: text,
    debounce: { delay: 300 },
    execute: async value => value.toUpperCase(),
  });
  return (
    <section>
      <input
        aria-label="Text"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button disabled={!preview.pending} onClick={preview.flush}>
        Apply now
      </button>
      <button onClick={preview.abort}>Cancel</button>
      <output>{preview.pending ? 'Waiting' : preview.result}</output>
    </section>
  );
}
```

`useDebouncedValue` 可以防抖任意值而不发请求，例如用于派生过滤条件：

```tsx
import { useState } from 'react';
import { useDebouncedValue } from '@ahoo-wang/fetcher-react';

export function Filter({ items }: { items: string[] }) {
  const [keyword, setKeyword] = useState('');
  const { value: applied } = useDebouncedValue(keyword, { delay: 300 });
  return (
    <section>
      <input value={keyword} onChange={e => setKeyword(e.target.value)} />
      <ul>
        {items
          .filter(item => item.includes(applied))
          .map(item => (
            <li key={item}>{item}</li>
          ))}
      </ul>
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

[packages/react/src/core/debounced/useDebouncedCallback.ts:43](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L43)

### UseDebouncedCallbackOptions {#api-UseDebouncedCallbackOptions}

```ts
export interface UseDebouncedCallbackOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L17)

### UseDebouncedCallbackReturn {#api-UseDebouncedCallbackReturn}

```ts
export interface UseDebouncedCallbackReturn<T extends (...args: any[]) => any> {
  readonly run: (...args: Parameters<T>) => void;
  readonly cancel: () => void;
  readonly isPending: () => boolean;
}
```

[packages/react/src/core/debounced/useDebouncedCallback.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L26)

### useDebouncedValue {#api-useDebouncedValue}

```ts
export function useDebouncedValue<T>(
  value: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedValueReturn<T>;
```

[packages/react/src/core/debounced/useDebouncedValue.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedValue.ts#L38)

### UseDebouncedValueReturn {#api-UseDebouncedValueReturn}

```ts
export interface UseDebouncedValueReturn<T> {
  value: T;
  pending: boolean;
  flush: () => void;
}
```

[packages/react/src/core/debounced/useDebouncedValue.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedValue.ts#L21)

### useDebouncedExecutePromise {#api-useDebouncedExecutePromise}

```ts
export function useDebouncedExecutePromise<R = unknown, E = FetcherError>(
  options: UseDebouncedExecutePromiseOptions<R, E>,
): UseDebouncedExecutePromiseReturn<R, E>;
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L39)

### DebounceCapable {#api-DebounceCapable}

```ts
export interface DebounceCapable {
  debounce: UseDebouncedCallbackOptions;
}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L26)

### UseDebouncedExecutePromiseOptions {#api-UseDebouncedExecutePromiseOptions}

```ts
export interface UseDebouncedExecutePromiseOptions<R, E = FetcherError>
  extends UseExecutePromiseOptions<R, E>, DebounceCapable {}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L30)

### UseDebouncedExecutePromiseReturn {#api-UseDebouncedExecutePromiseReturn}

```ts
export interface UseDebouncedExecutePromiseReturn<R, E = FetcherError>
  extends
    Omit<UseExecutePromiseReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseExecutePromiseReturn<R, E>['execute']> {}
```

[packages/react/src/core/debounced/useDebouncedExecutePromise.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedExecutePromise.ts#L33)

### useDebouncedQuery {#api-useDebouncedQuery}

```ts
export function useDebouncedQuery<Q, R, E = FetcherError>(
  options: UseDebouncedQueryOptions<Q, R, E>,
): UseDebouncedQueryReturn<R, E>;
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L37)

### UseDebouncedQueryOptions {#api-UseDebouncedQueryOptions}

```ts
export interface UseDebouncedQueryOptions<Q, R, E = FetcherError>
  extends UseQueryOptions<Q, R, E>, DebounceCapable {}
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L20)

### UseDebouncedQueryReturn {#api-UseDebouncedQueryReturn}

```ts
export interface UseDebouncedQueryReturn<
  R,
  E = FetcherError,
> extends UseQueryReturn<R, E> {
  pending: boolean;
  flush: () => void;
}
```

[packages/react/src/core/debounced/useDebouncedQuery.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L23)

### useDebouncedFetcher {#api-useDebouncedFetcher}

```ts
export function useDebouncedFetcher<R, E = FetcherError>(
  options: UseDebouncedFetcherOptions<R, E>,
): UseDebouncedFetcherReturn<R, E>;
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L32)

### UseDebouncedFetcherOptions {#api-UseDebouncedFetcherOptions}

```ts
export interface UseDebouncedFetcherOptions<R, E = FetcherError>
  extends UseFetcherOptions<R, E>, DebounceCapable {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L23)

### UseDebouncedFetcherReturn {#api-UseDebouncedFetcherReturn}

```ts
export interface UseDebouncedFetcherReturn<R, E = FetcherError>
  extends
    Omit<UseFetcherReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseFetcherReturn<R, E>['execute']> {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcher.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcher.ts#L26)

### useDebouncedFetcherQuery {#api-useDebouncedFetcherQuery}

```ts
export function useDebouncedFetcherQuery<Q, R, E = FetcherError>(
  options: UseDebouncedFetcherQueryOptions<Q, R, E>,
): UseDebouncedFetcherQueryReturn<R, E>;
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L40)

### UseDebouncedFetcherQueryOptions {#api-UseDebouncedFetcherQueryOptions}

```ts
export interface UseDebouncedFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherQueryOptions<Q, R, E>, DebounceCapable {}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L23)

### UseDebouncedFetcherQueryReturn {#api-UseDebouncedFetcherQueryReturn}

```ts
export interface UseDebouncedFetcherQueryReturn<
  R,
  E = FetcherError,
> extends UseFetcherQueryReturn<R, E> {
  pending: boolean;
  flush: () => void;
}
```

[packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts#L26)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [最新值与稳定值](./utilities)
