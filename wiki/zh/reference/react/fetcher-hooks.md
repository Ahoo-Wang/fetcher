---
title: 'Fetcher 请求 Hook'
description: 'Fetcher 请求 Hook — @ahoo-wang/fetcher-react 5.0.0'
---

# Fetcher 请求 Hook

`useFetcher` 将 Fetcher exchange 管线接入 React 状态，不会在挂载时执行。`useFetcherQuery` 增加查询对象和 POST 执行，适合 JSON 查询端点，不是 URL 查询字符串构造器。

## 输入和返回值

| API                               | 输入与默认值                                                                        | 返回                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `useFetcher<R,E>(options?)`       | `RequestOptions`、执行器回调及 `fetcher` 实例/名称，默认 `fetcherRegistrar.default` | `loading`、`status`、`result`、`error`、可选 `exchange`、`execute(request)`、`reset`、`abort` |
| `execute(request)`                | 完整 `FetchRequest`；Hook 会在对象上赋值自己的 `abortController`                    | 提取完成后的 `Promise<void>`，结果位于状态中                                                  |
| `useFetcherQuery<Q,R,E>(options)` | 必填 `url`、查询选项；默认 `JsonResultExtractor`，调用者可覆盖                      | 查询与执行状态；`execute()` 将当前 Q 作为 POST body                                           |

每次调用创建新的 request，不要在多个 Hook 之间共享可变请求。Fetcher 注册在渲染时解析，缺失的命名注册在该阶段失败。`useFetcher` 本身不会独立于选定的 Fetcher/options 默认使用 JSON；需要 JSON 时显式选提取器。HTTP 状态、超时和提取失败遵循该 Fetcher 的拦截器管线。

`useFetcherQuery` 的返回类型继承了可带 exchange 的类型，但当前实现返回对象没有 `exchange`；需要检查 exchange 时直接用 `useFetcher`。`reset()` 清除 exchange/状态，不会取消在途工作；`abort()` 清除 exchange、作废本地请求 ID 并取消执行器。卸载与重叠请求见 [Promise 状态](./promise-and-query-state)。`url` 或其他选项变化只更新下次执行读取的值，本身不保证触发新请求。

## 完整示例

```tsx
import { JsonResultExtractor } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';
export function Profile() {
  const request = useFetcher<{ name: string }>({
    resultExtractor: JsonResultExtractor,
  });
  return (
    <section>
      <button
        disabled={request.loading}
        onClick={() => {
          void request.execute({ url: '/api/profile', method: 'GET' });
        }}
      >
        Load
      </button>
      {request.error && <p role="alert">{request.error.message}</p>}
      <p>{request.result?.name}</p>
    </section>
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./index#public-symbols) 定位。运行时默认值和失败行为以本页上文为准。

### useFetcher {#api-useFetcher}

```ts
export function useFetcher<R, E = FetcherError>(
  options?: UseFetcherOptions<R, E>,
): UseFetcherReturn<R, E>;
```

[packages/react/src/fetcher/useFetcher.ts:162](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L162)

### UseFetcherOptions {#api-UseFetcherOptions}

```ts
export interface UseFetcherOptions<R, E = FetcherError>
  extends RequestOptions, FetcherCapable, UseExecutePromiseOptions<R, E> {}
```

[packages/react/src/fetcher/useFetcher.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L37)

### UseFetcherReturn {#api-UseFetcherReturn}

```ts
export interface UseFetcherReturn<R, E = FetcherError> extends Omit<
  UseExecutePromiseReturn<R, E>,
  'execute'
> {
  exchange?: FetchExchange;
  execute: (request: FetchRequest) => Promise<void>;
}
```

[packages/react/src/fetcher/useFetcher.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L47)

### useFetcherQuery {#api-useFetcherQuery}

```ts
export function useFetcherQuery<Q, R, E = FetcherError>(
  options: UseFetcherQueryOptions<Q, R, E>,
): UseFetcherQueryReturn<Q, R, E>;
```

[packages/react/src/fetcher/useFetcherQuery.ts:126](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L126)

### UseFetcherQueryOptions {#api-UseFetcherQueryOptions}

```ts
export interface UseFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherOptions<R, E>, QueryOptions<Q>, AutoExecuteCapable {
  url: string;
}
```

[packages/react/src/fetcher/useFetcherQuery.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L30)

### UseFetcherQueryReturn {#api-UseFetcherQueryReturn}

```ts
export interface UseFetcherQueryReturn<Q, R, E = FetcherError>
  extends UseFetcherReturn<R, E>, UseQueryStateReturn<Q> {
  execute: () => Promise<void>;
}
```

[packages/react/src/fetcher/useFetcherQuery.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L42)

## 相关专题

[Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [Wow 查询 Hook](./wow) · [监控、ref 与全屏](./monitoring-and-utilities)
