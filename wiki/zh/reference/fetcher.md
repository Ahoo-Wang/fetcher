---
title: Fetcher 参考
description: 配置 Fetcher、发送类型化 HTTP 请求并定位生命周期失败。
pageClass: reference-page
---

# `@ahoo-wang/fetcher`

`Fetcher` 是核心 HTTP Client：它在平台 `fetch` 之上增加请求解析、Interceptor、超时、状态校验和结果提取。它适合应用 HTTP Client；不是服务端 Router，也不提供重试策略。

## 安装与入口选择

```bash
pnpm add @ahoo-wang/fetcher
```

| 目标 | 入口 | 默认结果 |
| --- | --- | --- |
| 传入 URL 与请求初始化 | `fetch(url, init?, options?)` | `Response` |
| 调用处已知 HTTP 方法 | `get`、`post`、`put`、`patch`、`delete`、`head`、`options`、`trace` | `Response` |
| 已有完整请求 | `request(request, options?)` | `FetchExchange` |
| 检查已完成的 Pipeline | `exchange(request, options?)` | `FetchExchange` |
| 共享命名 Client | `NamedFetcher` / `fetcherRegistrar` | `Fetcher` |

### HTTP 方法矩阵

| 方法 | 请求 Body | 默认结果 | 显式结果 |
| --- | --- | --- | --- |
| `get`、`head`、`options`、`trace` | 不接受：请求类型省略 `body`。 | `Response` | 传入 `options.resultExtractor` 以返回其 `R`。 |
| `post`、`put`、`patch`、`delete` | 接受：请求类型只省略 `method`。 | `Response` | 传入 `options.resultExtractor` 以返回其 `R`。 |

每个快捷方法都会提供自己的 HTTP 方法并返回 `Promise<R>`。默认 `R` 为 `Response`；仅传入泛型参数不会解析 Body，须同时指定如 `ResultExtractors.Json` 的 Extractor。

## Client 配置

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

export const api = new Fetcher({
  baseURL: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' },
  timeout: 10_000,
});
```

| `FetcherOptions` 成员 | 默认值 | 契约 |
| --- | --- | --- |
| `baseURL` | `''` | 为相对 URL 添加前缀；绝对 URL 由 `combineURLs` 保留。 |
| `headers` | `{ 'Content-Type': 'application/json' }` | 与请求 Headers 浅合并；请求值优先。 |
| `timeout` | `undefined` | 毫秒。单次请求的 Timeout（包括 `0`）优先。 |
| `urlTemplateStyle` | `UrlTemplateStyle.UriTemplate` | 解析 `{id}`；只有 `:id` 路由才使用 `Express`。 |
| `validateStatus` | `status >= 200 && status < 300` | 仅在 Fetcher 创建默认 `InterceptorManager` 时使用。 |
| `interceptors` | 新建 `InterceptorManager` | 替换整套默认 Manager，因此会忽略 `validateStatus`。 |

## 类型化请求与 `FetchRequestInit`

所有方法的返回类型都是 `Promise<R>`，参数为 `(url, request?, options?)`。`get`、`head`、`options` 和 `trace` 排除 `body`；其余方法只排除 `method`。当 `R` 不是 `Response` 时，传入 `resultExtractor`。

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

interface User {
  id: string;
  name: string;
}

const api = new Fetcher({ baseURL: 'https://api.example.com' });
const user: User = await api.get<User>(
  '/teams/{teamId}/users/{userId}',
  {
    urlParams: {
      path: { teamId: 'platform', userId: 'u-42' },
      query: { expand: 'team' },
    },
  },
  { resultExtractor: ResultExtractors.Json },
);
```

`FetchRequestInit` 基于平台 `RequestInit`，但使用类型化 `headers`、`body`，并新增 `urlParams`、`timeout` 与 `abortController`。普通对象 Body 由标准请求 Interceptor JSON 序列化；`FormData`、`Blob`、Stream 和其他受支持 `BodyInit` 不会被序列化。

### 解析与 URL 规则

1. `resolveExchange()` 先浅合并 Client Headers，再合并请求 Headers。
2. 请求 `timeout` 优先于 Client Timeout。
3. `UrlBuilder` 合并 Base URL、解析 Path Placeholder，最后追加 `new URLSearchParams(query)`。
4. Pipeline 会消费 `urlParams`；再次解析 URL 不会重复追加 Query String。
5. 结果提取通过 `FetchExchange.extractResult()` 执行并缓存 Promise，因此同一 Exchange 不要选择两个读取 Body 的 Extractor。

Query 的强制转换由 `URLSearchParams` 定义。重复 Query Key 请使用该平台 API 支持的形状；不要把 Array 理解为多个同名 Key。

## Result、Interceptor 与错误契约

| Extractor | 结果 |
| --- | --- |
| `ResultExtractors.Exchange` | `FetchExchange` |
| `ResultExtractors.Response` | 原生 `Response` |
| `ResultExtractors.Json` / `Text` | 已解析 JSON / 文本 Body |
| `Blob` / `ArrayBuffer` / `Bytes` | 对应的二进制 Body 值 |

默认 Pipeline 按 `order` 升序运行请求 Interceptor，再按升序运行响应 Interceptor；失败时运行错误 Interceptor。内置顺序为 `RequestBodyInterceptor`、`UrlResolveInterceptor`、`FetchInterceptor`，最后是 `ValidateStatusInterceptor`。错误 Interceptor 可通过清除 `exchange.error` 恢复；不会重新运行响应 Interceptor。

| 失败 | 检查项 |
| --- | --- |
| 非 2xx 被拒绝 | 顶层为 `ExchangeError`；在 `error.exchange.error` 或 `error.cause` 中检查 `HttpStatusValidationError`。仅在状态确属预期时使用 `validateStatus` 或 `IGNORE_VALIDATE_STATUS`。 |
| 超时被拒绝 | 顶层为 `ExchangeError`；在 `error.exchange.error` 或 `error.cause` 中检查 `FetchTimeoutError` 及其 `request.timeout`。 |
| 网络/Interceptor 失败 | 顶层 `ExchangeError.exchange.error` 与 `ExchangeError.cause` 保留原始错误。 |
| JSON 解析失败 | 选择的 Extractor 会读取响应 Body；检查 `Content-Type` 与服务端 Payload。 |
| URL 仍含 `{id}` | 检查 `urlParams.path` 与模板风格配置。 |

公开继承关系为 `FetcherError` → `ExchangeError` →
`HttpStatusValidationError`；`FetchTimeoutError` 直接继承 `FetcherError`。
`InterceptorManager.exchange()` 会把未处理的 Pipeline 错误包装为顶层
`ExchangeError`，因此先捕获它，再在 `error.exchange.error` 或
`error.cause` 中缩小原始状态或超时类型。

## 超时与调用方取消

调用方拥有取消权时传入 Controller。请求已有平台 `signal` 时，Fetcher 直接委托给平台 `fetch`，不会自行安装超时竞争；否则超时会在 Controller 仍可用时复用它。

```ts
const controller = new AbortController();
const pending = api.get('/jobs/{id}', {
  urlParams: { path: { id: 'job-1' } },
  abortController: controller,
});
controller.abort();
await pending;
```

## 源码参考

- [packages/fetcher/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/index.ts#L14)
- [packages/fetcher/src/fetcher.ts:86](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L86)
- [packages/fetcher/src/fetchRequest.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L112)
- [packages/fetcher/src/fetcherError.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L37)
- [packages/fetcher/src/interceptorManager.ts:191](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptorManager.ts#L191)
- [packages/fetcher/src/timeout.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L120)
