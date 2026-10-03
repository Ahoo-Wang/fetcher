---
title: 'Fetcher 请求 Hook'
description: 'Fetcher 请求 Hook — @ahoo-wang/fetcher-react 6.0.0'
---

# Fetcher 请求 Hook

`useFetcher` 将 Fetcher exchange 管线接入 React 状态，不会在挂载时执行。`useFetcherQuery` 增加受控查询和 POST 执行，适合 JSON 查询端点，不是 URL 查询字符串构造器。

## 输入和返回值

| API                               | 输入与默认值                                                                                   | 返回                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `useFetcher<R,E>(options?)`       | `RequestOptions`、执行器回调及 `fetcher` 实例/名称，默认 `fetcherRegistrar.default`            | `loading`、`status`、`result`、`error`、`exchange`、`execute(request)`、`abort`、`reset` |
| `execute(request)`                | 完整 `FetchRequest`；Hook 发送带有自己 `abortController` 的副本，不修改你的对象                | 提取完成后的 `Promise<PromiseState<R,E>>`；从不拒绝                                      |
| `exchange`                        | 由状态派生：`result` 背后的 exchange，或 `error` 为 `ExchangeError` 时其背后的 exchange        | `FetchExchange \| undefined`；idle 或非 exchange 失败时为 undefined                      |
| `useFetcherQuery<Q,R,E>(options)` | 必填 `url`、受控 `query`、`autoExecute`（默认 true）；默认 `JsonResultExtractor`，调用者可覆盖 | 执行状态加 `exchange`；`execute()` 将当前查询作为 POST body 发送                         |

Fetcher 注册在发送请求时解析，缺失的命名注册会进入错误状态。`useFetcher` 本身不会独立于选定的 Fetcher/options 默认使用 JSON；需要 JSON 时显式选提取器。HTTP 状态、超时和提取失败遵循该 Fetcher 的拦截器管线。

`exchange` 不单独存储，而是跟随 `result` 和 `error`。HTTP 404 之后，`error` 是 `ExchangeError`，`exchange.response?.status` 为 `404`；`abort()` 或 `reset()` 之后两者都被清除。`useFetcherQuery` 遵循[受控查询契约](./promise-and-query-state#controlled-queries)：查询保存在你的状态中，`undefined` 表示未就绪，深相等的查询不会重新发送。`url` 或其他选项变化只更新下次执行读取的值，本身不会发送新请求。卸载与重叠请求见 [Promise 状态](./promise-and-query-state)。

## HTTP 取消与超时 {#http-cancellation}

取消由 Hook 负责：它发送 `{ ...request, abortController }`，因此请求上的 `abortController` 会被替换，而 `request.signal` 仍然生效。通过 `abort()`/`reset()`、新的 `execute`、卸载或你自己的 `signal` 取消。使用普通 Fetcher 传输时，Hook 的 controller、显式请求 `signal` 与库超时同时生效：先触发者中止请求。无论实际 I/O 是否取消，已取消的执行都不会覆盖 Hook 当前状态。

选择结果泛型前先选提取器：`JsonResultExtractor` 解析 JSON，普通 Fetcher 默认值可能返回 exchange 或 Response。`R` 是提取后的值类型，`E` 是错误状态类型；两者不验证运行时载荷。[请求生命周期](../../architecture/request-lifecycle)解释 JSON 解析为何可能在 exchange 拦截结束后失败。

::: info 6.0 变更
`execute(request)` 解析为最终状态而不是 `void`，且不再写入 `request.abortController`。失败时 `exchange` 是失败请求的 exchange（来自 `ExchangeError`），而不是 `undefined`；`useFetcherQuery` 现在也返回 `exchange`。`useFetcherQuery` 移除了 `initialQuery`、`setQuery` 和 `getQuery`；请从自己的状态传入 `query`。
:::

## 完整示例

```tsx
import { ExchangeError, JsonResultExtractor } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';

export function Profile() {
  const request = useFetcher<{ name: string }>({
    resultExtractor: JsonResultExtractor,
  });
  const notFound = request.exchange?.response?.status === 404;
  return (
    <section>
      <button
        disabled={request.loading}
        onClick={async () => {
          const { status, error } = await request.execute({
            url: '/api/profile',
            method: 'GET',
          });
          if (status === 'error' && !(error instanceof ExchangeError)) {
            console.error(error);
          }
        }}
      >
        Load
      </button>
      {notFound && <p role="alert">No profile yet</p>}
      {request.error && !notFound && (
        <p role="alert">{request.error.message}</p>
      )}
      <p>{request.result?.name}</p>
    </section>
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

### useFetcher {#api-useFetcher}

```ts
export function useFetcher<R, E = FetcherError>(
  options?: UseFetcherOptions<R, E>,
): UseFetcherReturn<R, E>;
```

[packages/react/src/fetcher/useFetcher.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L67)

### UseFetcherOptions {#api-UseFetcherOptions}

```ts
export interface UseFetcherOptions<R, E = FetcherError>
  extends RequestOptions, FetcherCapable, UseExecutePromiseOptions<R, E> {}
```

[packages/react/src/fetcher/useFetcher.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L34)

### UseFetcherReturn {#api-UseFetcherReturn}

```ts
export interface UseFetcherReturn<R, E = FetcherError> extends Omit<
  UseExecutePromiseReturn<R, E>,
  'execute'
> {
  exchange: FetchExchange | undefined;
  execute: (request: FetchRequest) => Promise<PromiseState<R, E>>;
}
```

[packages/react/src/fetcher/useFetcher.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L37)

### useFetcherQuery {#api-useFetcherQuery}

```ts
export function useFetcherQuery<Q, R, E = FetcherError>(
  options: UseFetcherQueryOptions<Q, R, E>,
): UseFetcherQueryReturn<R, E>;
```

[packages/react/src/fetcher/useFetcherQuery.ts:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L45)

### UseFetcherQueryOptions {#api-UseFetcherQueryOptions}

```ts
export interface UseFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherOptions<R, E>, QueryOptions<Q> {
  /** @default true */
  autoExecute?: boolean;
  url: string;
}
```

`autoExecute` 声明在内部基础接口上，这里内联展示。

[packages/react/src/fetcher/useFetcherQuery.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L26)

### UseFetcherQueryReturn {#api-UseFetcherQueryReturn}

```ts
export interface UseFetcherQueryReturn<R, E = FetcherError> extends Omit<
  UseFetcherReturn<R, E>,
  'execute'
> {
  execute: () => Promise<PromiseState<R, E>>;
}
```

[packages/react/src/fetcher/useFetcherQuery.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L32)

## 相关专题

[Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [最新值与稳定值](./utilities)
