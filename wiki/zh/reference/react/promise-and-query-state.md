---
title: 'Promise 与查询状态'
description: 'Promise 与查询状态 — @ahoo-wang/fetcher-react 5.0.0'
---

# Promise 与查询状态

其他系统负责执行时使用 `usePromiseState`；用户触发异步操作时使用 `useExecutePromise`；查询对象驱动操作时使用 `useQuery`。每个已挂载 Hook 只维护最新的一份结果，不提供共享缓存或自动重试。

## 状态与执行

| API / 选项                               | 契约                                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `usePromiseState<R,E>(options?)`         | 初始状态为 `initialStatus ?? PromiseStatus.IDLE`，结果和错误均为 undefined；返回状态和设置函数。                 |
| `setLoading()`                           | 清除错误，保留上次结果。                                                                                         |
| `setSuccess(result)` / `setError(error)` | 设置成功结果，或设置错误并清空结果；随后等待对应回调。回调失败仅记录日志，不替换状态。                           |
| `setIdle()` / 执行器 `reset()`           | 清除结果和错误；单独 `reset()` 不会取消或作废在途执行。                                                          |
| `execute(supplier)`                      | 调用 `supplier(AbortController)`，返回 `Promise<void>`；通过 `result` 读取数据。新执行取消旧控制器并作废旧结果。 |
| `propagateError`                         | 默认 false，操作失败进入错误状态；true 时 execute promise 也拒绝。`AbortError` 被吞掉并恢复 idle。               |
| `abort()`                                | 作废请求、清空状态、发出取消信号并调用 `onAbort`；回调失败仅记录日志。                                           |

supplier 必须把 signal 传给 I/O 才能停止实际工作；即使忽略取消，Hook 仍可丢弃过期结果。卸载清理会取消当前执行。不要在卸载后调用保留的执行器：实现阻止状态提交，但并不保证 supplier 不会运行。

## 查询所有权

`useQuery<Q,R,E>` 增加 `initialQuery`、`query`、`attributes`、`autoExecute`、`getQuery()`、`setQuery(Q)`；执行器接收 `(query, attributes, abortController)`。`autoExecute` 默认为 true。没有已定义查询就不请求；`isValidateQuery` 只检查 `query !== undefined`，不进行 schema 校验。`query` 覆盖初始化；内容深相等而仅引用变化不会重新查询，执行配置变化则可能触发。`initialQuery` 只用于初始化，不是响应式替换参数。

`setQuery` 更新 ref，启用自动执行时立即执行；它本身不是 React 状态通知，也不会去重显式 setter 调用。`autoExecute: false` 时可先 `setQuery` 再 `execute()`。自动执行不会等待调用者 catch，因此无人等待的请求应通过错误状态/onError 处理，而不要设 `propagateError: true`。`useQueryState` 只提供查询 ref 行为，不负责取消；应保持其 `execute` 回调稳定。

## 完整示例

```tsx
import { useQuery } from '@ahoo-wang/fetcher-react';
export function Search() {
  const query = useQuery<{ term: string }, string, Error>({
    initialQuery: { term: '' },
    execute: async ({ term }, _attributes, controller) => {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(term)}`,
        {
          signal: controller?.signal,
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    },
  });
  return (
    <section>
      <input
        aria-label="Search"
        onChange={e => query.setQuery({ term: e.target.value })}
      />
      <button onClick={query.abort}>Cancel</button>
      <p role="status">{query.loading ? 'Loading' : query.result}</p>
      {query.error && <p role="alert">{query.error.message}</p>}
    </section>
  );
}
```

示例中的服务 URL 需要应用实现；类型检查不代表已经访问外部服务。

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./index#public-symbols) 定位。运行时默认值和失败行为以本页上文为准。

### useQueryState {#api-useQueryState}

```ts
export function useQueryState<Q>(
  options: UseQueryStateOptions<Q>,
): UseQueryStateReturn<Q>;
```

[packages/react/src/core/useQueryState.ts:113](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L113)

### isValidateQuery {#api-isValidateQuery}

```ts
export function isValidateQuery<Q>(query: Q | undefined): query is Q;
```

[packages/react/src/core/useQueryState.ts:195](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L195)

### QueryOptions {#api-QueryOptions}

```ts
export interface QueryOptions<Q> {
  initialQuery?: Q;
  query?: Q;
}
```

[packages/react/src/core/useQueryState.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L18)

### UseQueryStateOptions {#api-UseQueryStateOptions}

```ts
export interface UseQueryStateOptions<Q>
  extends QueryOptions<Q>, AutoExecuteCapable {
  execute: (query: Q) => Promise<void>;
}
```

[packages/react/src/core/useQueryState.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L29)

### UseQueryStateReturn {#api-UseQueryStateReturn}

```ts
export interface UseQueryStateReturn<Q> {
  getQuery: () => Q | undefined;
  setQuery: (query: Q) => void;
}
```

[packages/react/src/core/useQueryState.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L39)

### useExecutePromise {#api-useExecutePromise}

```ts
export function useExecutePromise<R = unknown, E = FetcherError>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E>;
```

[packages/react/src/core/useExecutePromise.ts:210](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L210)

### UseExecutePromiseOptions {#api-UseExecutePromiseOptions}

```ts
export interface UseExecutePromiseOptions<
  R,
  E = FetcherError,
> extends UsePromiseStateOptions<R, E> {
  propagateError?: boolean;
  onAbort?: () => void | Promise<void>;
}
```

[packages/react/src/core/useExecutePromise.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L27)

### PromiseSupplier {#api-PromiseSupplier}

```ts
export type PromiseSupplier<R> = (
  abortController: AbortController,
) => Promise<R>;
```

[packages/react/src/core/useExecutePromise.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L51)

### UseExecutePromiseReturn {#api-UseExecutePromiseReturn}

```ts
export interface UseExecutePromiseReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  execute: (input: PromiseSupplier<R>) => Promise<void>;
  reset: () => void;
  abort: () => void;
}
```

[packages/react/src/core/useExecutePromise.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L61)

### usePromiseState {#api-usePromiseState}

```ts
export function usePromiseState<R = unknown, E = FetcherError>(
  options?: UsePromiseStateOptions<R, E>,
): UsePromiseStateReturn<R, E>;
```

[packages/react/src/core/usePromiseState.ts:119](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L119)

### PromiseStatus {#api-PromiseStatus}

```ts
export enum PromiseStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
```

[packages/react/src/core/usePromiseState.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L22)

### PromiseState {#api-PromiseState}

```ts
export interface PromiseState<R, E = unknown> {
  status: PromiseStatus;
  loading: boolean;
  result: R | undefined;
  error: E | undefined;
}
```

[packages/react/src/core/usePromiseState.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L29)

### PromiseStateCallbacks {#api-PromiseStateCallbacks}

```ts
export interface PromiseStateCallbacks<R, E = unknown> {
  onSuccess?: (result: R) => void | Promise<void>;
  onError?: (error: E) => void | Promise<void>;
}
```

[packages/react/src/core/usePromiseState.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L40)

### UsePromiseStateOptions {#api-UsePromiseStateOptions}

```ts
export interface UsePromiseStateOptions<
  R,
  E = FetcherError,
> extends PromiseStateCallbacks<R, E> {
  initialStatus?: PromiseStatus;
}
```

[packages/react/src/core/usePromiseState.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L63)

### UsePromiseStateReturn {#api-UsePromiseStateReturn}

```ts
export interface UsePromiseStateReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  setLoading: () => void;
  setSuccess: (result: R) => Promise<void>;
  setError: (error: E) => Promise<void>;
  setIdle: () => void;
}
```

[packages/react/src/core/usePromiseState.ts:75](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L75)

### useQuery {#api-useQuery}

```ts
export function useQuery<Q, R, E = FetcherError>(
  options: UseQueryOptions<Q, R, E>,
): UseQueryReturn<Q, R, E>;
```

[packages/react/src/core/useQuery.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L105)

### UseQueryOptions {#api-UseQueryOptions}

```ts
export interface UseQueryOptions<Q, R, E = FetcherError>
  extends
    UseExecutePromiseOptions<R, E>,
    QueryOptions<Q>,
    AttributesCapable,
    AutoExecuteCapable {
  execute: (
    query: Q,
    attributes?: Record<string, any>,
    abortController?: AbortController,
  ) => Promise<R>;
}
```

[packages/react/src/core/useQuery.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L33)

### UseQueryReturn {#api-UseQueryReturn}

```ts
export interface UseQueryReturn<Q, R, E = FetcherError>
  extends UseExecutePromiseReturn<R, E>, UseQueryStateReturn<Q> {
  execute: () => Promise<void>;
}
```

[packages/react/src/core/useQuery.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L53)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [Wow 查询 Hook](./wow) · [监控、ref 与全屏](./monitoring-and-utilities)
