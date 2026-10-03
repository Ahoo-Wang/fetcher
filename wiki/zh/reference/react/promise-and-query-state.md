---
title: 'Promise 与查询状态'
description: 'Promise 与查询状态 — @ahoo-wang/fetcher-react 6.0.0'
---

# Promise 与查询状态

其他系统负责执行时使用 `usePromiseState`；用户触发异步操作时使用 `useExecutePromise`；查询值驱动操作时使用 `useQuery`。每个已挂载 Hook 只维护一份状态值，不提供共享缓存或自动重试。

每次执行以其 `AbortController` 标识。只有当前执行可以写入状态；发起更新的执行、`abort()`、`reset()` 和卸载都会中止它。状态是一个值 `{ status, loading, result, error }`，`execute` 从不拒绝：它解析为本次执行结束时的状态。

## 状态与执行

| API / 选项                               | 契约                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `usePromiseState<R,E>(options?)`         | 初始状态为 `initialStatus ?? 'idle'`，结果和错误均为 undefined；返回状态和稳定的同步设置函数，不调用任何回调。               |
| `setLoading()`                           | 清除错误，保留上次结果。                                                                                                     |
| `setSuccess(result)` / `setError(error)` | 成功时清除错误；失败时清除结果。                                                                                             |
| `setIdle()`                              | 清除结果和错误。                                                                                                             |
| `execute(supplier)`                      | 取消在途执行，调用 `supplier(abortController)`，解析为 `PromiseState`：`success`、`error`，执行被取消时为 `idle`。从不拒绝。 |
| `onSuccess` / `onError`                  | 只对当前执行调用，`execute` 解析前会等待它们。回调抛出的错误通过 `console.error` 报告，状态不变。                            |
| `onAbort`                                | 在途执行被取消（更新的执行、`abort()`、`reset()`、卸载）时同步调用，不被等待。                                               |
| `abort()`                                | 取消在途执行并回到 idle。没有在途执行时不做任何改变：已完成的结果保留。                                                      |
| `reset()`                                | 取消在途执行（如有）并回到 idle，同时清除结果和错误。                                                                        |
| supplier 抛出的 `AbortError`             | 名为 `AbortError` 的错误（例如来自调用方自己的 signal）使执行回到 idle 而非 error，且不调用 `onError`。                      |

supplier 必须把 signal 传给 I/O 才能停止实际工作；即使 supplier 忽略取消，Hook 也会忽略已取消执行的结果。卸载会取消当前执行；卸载后 `execute` 直接解析为 idle，不运行 supplier。

根据解析出的状态分支，而不是捕获异常：

```ts
const { status, error } = await execute(supplier);
if (status === 'success') navigate('/done');
else if (status === 'error') toast(error!.message);
```

## 受控查询 {#controlled-queries}

`useQuery<Q,R,E>` 是受控的：把查询保存在自己的状态中（`useState`、URL、父组件属性），通过 `query` 传入。执行器接收 `(query, abortController)`。

| 输入                  | 行为                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `query` 内容变化      | 重新执行。内容按深比较，因此与上次相等的内联对象不会重新执行。                                               |
| `query === undefined` | 未就绪：不执行，`execute()` 解析为 idle。用它等待必需的输入。                                                |
| `autoExecute`         | 默认 true。为 false 时只有 `execute()` 执行当前查询；切换为 true 会执行当前查询。                            |
| `execute` 选项变化    | 下次执行使用最新函数；仅函数变化不会重新执行。                                                               |
| 首次渲染              | 挂载时将执行（query 已定义且 `autoExecute` 开启）则为 `loading`，除非指定了 `initialStatus`；否则为 `idle`。 |
| `execute()` 返回值    | 立即执行当前查询并解析为最终状态，与 `useExecutePromise` 的 `execute` 相同。改变查询会取消在途查询。         |

暂停自动执行可设置 `autoExecute: false` 或传入 `query: undefined`；两者都不会取消已经运行的操作。调用 `abort()` 取消它，或调用 `reset()` 同时清除已显示的结果。

## 选择状态、执行与查询所有权 {#ownership}

| 决策                 | 纯状态 Hook                    | 执行器                    | 查询 Hook                             |
| -------------------- | ------------------------------ | ------------------------- | ------------------------------------- |
| 谁启动工作？         | `usePromiseState` 外的应用代码 | 调用 `execute(supplier)`  | 默认挂载/查询变化，或显式 `execute()` |
| 谁保存输入？         | 应用代码                       | 当前 supplier/调用        | 应用状态，通过 `query` 传入           |
| 谁取消并拒绝旧结果？ | 应用代码                       | `useExecutePromise`       | 底层执行器                            |
| reset 做什么？       | `setIdle()` 清空 result/error  | 取消在途工作，然后置 idle | 相同；查询仍保存在应用状态中          |

对于搜索框，输入框立即按查询状态渲染；结果在请求完成后跟上。`undefined` 是唯一的“未就绪”值；传入查询前请自行校验业务字段。

添加定时器前参见[防抖取消](./debounce#cancellation-controls)；[HTTP 示例](./index)展示向 Fetcher 传递取消的完整操作。

::: info 6.0 变更
移除了 `useQueryState`、`isValidateQuery`、`initialQuery`、`setQuery`/`getQuery` 以及 `propagateError` 选项；请把查询保存在自己的状态中，并读取 `execute` 解析出的状态。`useQuery` 的 `execute` 选项接收 `(query, abortController)`，不再是 `(query, attributes, abortController)`。`usePromiseState` 的设置函数是同步的，不再接受回调。`reset()` 现在会取消在途执行，`onAbort` 同步调用，自动执行的查询首次渲染为 `loading`。
:::

## 完整示例

```tsx
import { useState } from 'react';
import { useQuery } from '@ahoo-wang/fetcher-react';

export function Search() {
  const [query, setQuery] = useState({ term: '' });
  const search = useQuery<{ term: string }, string, Error>({
    query,
    execute: async ({ term }, abortController) => {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(term)}`,
        { signal: abortController.signal },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    },
  });
  return (
    <section>
      <input
        aria-label="Search"
        value={query.term}
        onChange={e => setQuery({ term: e.target.value })}
      />
      <button onClick={search.abort}>Cancel</button>
      <p role="status">{search.loading ? 'Loading' : search.result}</p>
      {search.error && <p role="alert">{search.error.message}</p>}
    </section>
  );
}
```

示例中的服务 URL 需要应用自行提供端点；类型检查通过并不表示已连接外部服务。

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

## 不拥有执行的状态 {#state-contracts}

### usePromiseState {#api-usePromiseState}

```ts
export function usePromiseState<R = unknown, E = FetcherError>(
  options?: UsePromiseStateOptions,
): UsePromiseStateReturn<R, E>;
```

[packages/react/src/core/usePromiseState.ts:119](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L119)

### PromiseStatus {#api-PromiseStatus}

```ts
export const PromiseStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type PromiseStatus = (typeof PromiseStatus)[keyof typeof PromiseStatus];
```

既可作为值使用（`PromiseStatus.SUCCESS`），也可作为字面量类型 `'idle' | 'loading' | 'success' | 'error'` 使用。

[packages/react/src/core/usePromiseState.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L21)

### PromiseState {#api-PromiseState}

```ts
export interface PromiseState<R, E = unknown> {
  status: PromiseStatus;
  loading: boolean;
  result: R | undefined;
  error: E | undefined;
}
```

[packages/react/src/core/usePromiseState.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L30)

### UsePromiseStateOptions {#api-UsePromiseStateOptions}

```ts
export interface UsePromiseStateOptions {
  initialStatus?: PromiseStatus;
}
```

[packages/react/src/core/usePromiseState.ts:96](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L96)

### UsePromiseStateReturn {#api-UsePromiseStateReturn}

```ts
export interface UsePromiseStateReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  setLoading: () => void;
  setSuccess: (result: R) => void;
  setError: (error: E) => void;
  setIdle: () => void;
}
```

[packages/react/src/core/usePromiseState.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L105)

## 显式执行 {#execution-contracts}

### useExecutePromise {#api-useExecutePromise}

```ts
export function useExecutePromise<R = unknown, E = FetcherError>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E>;
```

[packages/react/src/core/useExecutePromise.ts:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L107)

### UseExecutePromiseOptions {#api-UseExecutePromiseOptions}

```ts
export interface UseExecutePromiseOptions<
  R,
  E = FetcherError,
> extends UsePromiseStateOptions {
  onSuccess?: (result: R) => void | Promise<void>;
  onError?: (error: E) => void | Promise<void>;
  onAbort?: () => void;
}
```

[packages/react/src/core/useExecutePromise.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L28)

### PromiseSupplier {#api-PromiseSupplier}

```ts
export type PromiseSupplier<R> = (
  abortController: AbortController,
) => Promise<R>;
```

[packages/react/src/core/useExecutePromise.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L44)

### UseExecutePromiseReturn {#api-UseExecutePromiseReturn}

```ts
export interface UseExecutePromiseReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  execute: (supplier: PromiseSupplier<R>) => Promise<PromiseState<R, E>>;
  abort: () => void;
  reset: () => void;
}
```

[packages/react/src/core/useExecutePromise.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L48)

## 查询驱动执行 {#query-contracts}

### useQuery {#api-useQuery}

```ts
export function useQuery<Q, R, E = FetcherError>(
  options: UseQueryOptions<Q, R, E>,
): UseQueryReturn<R, E>;
```

[packages/react/src/core/useQuery.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L58)

### QueryOptions {#api-QueryOptions}

```ts
export interface QueryOptions<Q> {
  query?: Q;
}
```

[packages/react/src/core/useQuery.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L25)

### UseQueryOptions {#api-UseQueryOptions}

```ts
export interface UseQueryOptions<Q, R, E = FetcherError>
  extends UseExecutePromiseOptions<R, E>, QueryOptions<Q> {
  /** @default true */
  autoExecute?: boolean;
  execute: (query: Q, abortController: AbortController) => Promise<R>;
}
```

`autoExecute` 声明在内部基础接口上，这里内联展示。

[packages/react/src/core/useQuery.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L33)

### UseQueryReturn {#api-UseQueryReturn}

```ts
export interface UseQueryReturn<R, E = FetcherError> extends Omit<
  UseExecutePromiseReturn<R, E>,
  'execute'
> {
  execute: () => Promise<PromiseState<R, E>>;
}
```

[packages/react/src/core/useQuery.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L39)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [最新值与稳定值](./utilities)
