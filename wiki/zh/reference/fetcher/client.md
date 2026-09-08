---
title: '客户端与注册'
description: '客户端与注册 — @ahoo-wang/fetcher 5.0.0'
---

# 客户端与注册

创建 `Fetcher` 以共享 URL、请求头、超时和拦截器策略。请求仍调用运行时全局 `fetch`；客户端不管理连接池，也不需要 `destroy()`。

## 构造与默认值 {#construction}

`new Fetcher(options?: FetcherOptions)` 接受下列选项。传入选项对象时必须包含 `baseURL`；省略整个对象时使用 `DEFAULT_OPTIONS`。

| 选项                       | 默认值                                 | 契约                                                                   |
| -------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `baseURL: string`          | `''`                                   | 由可修改的 `urlBuilder` 使用；相对 URL 仍要求运行时支持。              |
| `headers?: RequestHeaders` | `{'Content-Type': 'application/json'}` | 自定义对象替换构造默认头；每个请求防御性复制并按大小写不敏感规则合并。 |
| `timeout?: number`         | `undefined`                            | 单位毫秒；未配置不启用定时器。请求级 `0` 禁用继承的超时。              |
| `urlTemplateStyle?`        | `UrlTemplateStyle.UriTemplate`         | 默认 `{id}`；`Express` 使用 `:id`。                                    |
| `interceptors?`            | 新建 `InterceptorManager`              | 传入管理器时直接使用，也可在客户端间共享。                             |
| `validateStatus?`          | `200 <= status < 300`                  | 仅在创建默认管理器时使用。                                             |

可修改 `urlBuilder`、`headers`、`timeout`，影响后续请求。`interceptors` 属性只读，但其中的注册表可修改。默认头对象为共享引用；应替换 `client.headers` 或使用请求级头，避免修改导出的 `DEFAULT_OPTIONS.headers` 影响全局。

## 选择调用入口 {#methods}

| 方法                                               | 输入                                   | 不指定提取器时的结果                                      |
| -------------------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| `resolveExchange(request, options?)`               | `FetchRequest`、`RequestOptions`       | 同步返回 `FetchExchange`，不执行 HTTP I/O。               |
| `exchange(request, options?)`                      | 同上                                   | 拦截器管线结束后的 `Promise<FetchExchange>`，不提取正文。 |
| `request<R = FetchExchange>(request, options?)`    | 同上                                   | 经提取器得到 `Promise<R>`，默认返回 exchange。            |
| `fetch<R = Response>(url, request = {}, options?)` | `FetchRequestInit`                     | `Promise<R>`，默认原生 `Response`。                       |
| `get`、`head`、`options`、`trace`                  | URL、不含 `method`/`body` 的请求、选项 | `Promise<R = Response>`，辅助方法固定 HTTP 方法。         |
| `post`、`put`、`patch`、`delete`                   | URL、不含 `method` 的请求、选项        | 同上，可传 body。                                         |

`DEFAULT_REQUEST_OPTIONS` 选择 `ResultExtractors.Exchange`；`DEFAULT_FETCH_OPTIONS` 选择 `ResultExtractors.Response`。只写 `get<User>()` 不会解析 JSON，必须选择提取器或调用 `response.json<User>()`。原生 Fetch 可能拒绝 TRACE 等方法。参阅[结果提取](./results.md)和[错误处理](./errors-and-cancellation.md)。

## 命名客户端 {#registration}

`new NamedFetcher(name, options?)` 继承 `Fetcher`，并立即注册到单例 `fetcherRegistrar`。导出的 `fetcher` 是默认命名实例，`DEFAULT_FETCHER_NAME = 'default'`。同名注册替换原有客户端。

`FetcherRegistrar.register(name, client): void`、`unregister(name): boolean`、`get(name): Fetcher | undefined` 管理条目。缺失时 `requiredGet(name)` 与 `default` getter 抛出 `Error`。设置 `default` 会注册到 `'default'`；`fetchers` 返回新的 `Map`，值仍是相同客户端。注销不会中止正在进行的请求。

`getFetcher(fetcher?, defaultFetcher?)` 接受实例、注册名或空值。实例直接返回；名称必须已注册；假值优先选择传入的后备客户端，再选择全局默认实例。`FetcherCapable` 声明此可选字段，`NamedCapable` 声明 `name`，`FetcherConfigurer.applyTo(fetcher): void` 是扩展配置器使用的结构契约。

## 完整示例 {#example}

```ts
import {
  Fetcher,
  NamedFetcher,
  fetcherRegistrar,
  getFetcher,
} from '@ahoo-wang/fetcher';

const local = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 3000,
});
const named = new NamedFetcher('reports', {
  baseURL: 'https://reports.example.com',
});
console.assert(getFetcher('reports') === named);
const exchange = local.resolveExchange({ url: '/users/1' });
console.assert(exchange.request.timeout === 3000);
fetcherRegistrar.unregister('reports');
```

## 公开符号与源码 {#symbols}

| 符号                                                          | 实现                                                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| <a id="fetcheroptions"></a>`FetcherOptions`                   | [fetcher.ts:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L52)                     |
| <a id="default_options"></a>`DEFAULT_OPTIONS`                 | [fetcher.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L87)                     |
| <a id="requestoptions"></a>`RequestOptions`                   | [fetcher.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L95)                     |
| <a id="default_request_options"></a>`DEFAULT_REQUEST_OPTIONS` | [fetcher.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L98)                     |
| <a id="default_fetch_options"></a>`DEFAULT_FETCH_OPTIONS`     | [fetcher.ts:101](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L101)                   |
| <a id="fetcher"></a>`Fetcher`                                 | [fetcher.ts:124](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L124)                   |
| <a id="fetchercapable"></a>`FetcherCapable`                   | [fetcherCapable.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherCapable.ts#L22)       |
| <a id="getfetcher"></a>`getFetcher`                           | [fetcherCapable.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherCapable.ts#L37)       |
| <a id="default_fetcher_name"></a>`DEFAULT_FETCHER_NAME`       | [fetcherRegistrar.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L19)   |
| <a id="fetcherregistrar"></a>`FetcherRegistrar`               | [fetcherRegistrar.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L41)   |
| <a id="fetcherregistrar-instance"></a>`fetcherRegistrar`      | [fetcherRegistrar.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L166) |
| <a id="namedfetcher"></a>`NamedFetcher`                       | [namedFetcher.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/namedFetcher.ts#L38)           |
| <a id="fetcher-instance"></a>`fetcher`                        | [namedFetcher.ts:89](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/namedFetcher.ts#L89)           |
| <a id="namedcapable"></a>`NamedCapable`                       | [types.ts:141](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L141)                       |
| <a id="fetcherconfigurer"></a>`FetcherConfigurer`             | [types.ts:248](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L248)                       |

[包索引](./index.md)
