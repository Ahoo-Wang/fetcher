---
title: 'Interceptor pipeline'
description: 'Interceptor pipeline — @ahoo-wang/fetcher 5.0.0'
---

# Interceptor pipeline

Interceptors mutate a shared `FetchExchange`; they return `void | Promise<void>`, not a replacement exchange. `RequestInterceptor`, `ResponseInterceptor`, and `ErrorInterceptor` are structural specializations of `Interceptor`, whose required fields are `name`, `order`, and `intercept(exchange)`.

## Registration and ordering {#registry}

`new InterceptorRegistry(interceptors = [])` sorts ascending by `order`. `use(interceptor): boolean` rejects a duplicate name; `eject(name): boolean` reports whether removal happened; `clear(): void` removes everything. The constructor sorts a copy of the provided array and leaves the input array unchanged; it does not de-duplicate its initial entries. `interceptors` returns an array copy. `intercept(exchange): Promise<void>` awaits handlers sequentially and stops on rejection. The registry itself implements Interceptor, with constructor-name `name` and order `Number.MIN_SAFE_INTEGER`.

`OrderedCapable.order` is optional; `sortOrder(a, b)` treats missing values as zero. `toSorted(array, filter?)` returns a sorted copy, optionally filtered. `DEFAULT_INTERCEPTOR_ORDER_STEP = 1000` and `BUILT_IN_INTERCEPTOR_ORDER_STEP = 10000` provide spacing.

## Built-in phases {#pipeline}

| Registry / implementation             | Exported order                                                 | Effect                                    |
| ------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| request: `RequestBodyInterceptor`     | `REQUEST_BODY_INTERCEPTOR_ORDER = MIN_SAFE_INTEGER + 10000`    | Normalize body and Content-Type.          |
| request: `UrlResolveInterceptor`      | `URL_RESOLVE_INTERCEPTOR_ORDER = MAX_SAFE_INTEGER - 20000`     | Resolve base/path/query, clear urlParams. |
| request: `FetchInterceptor`           | `FETCH_INTERCEPTOR_ORDER = MAX_SAFE_INTEGER - 10000`           | Await `timeoutFetch`, assign response.    |
| response: `ValidateStatusInterceptor` | `VALIDATE_STATUS_INTERCEPTOR_ORDER = MAX_SAFE_INTEGER - 10000` | Reject unaccepted status unless bypassed. |

Each corresponding `*_INTERCEPTOR_NAME` equals the implementation's class name. A request interceptor with order zero sees a normalized body but an unresolved URL. A response interceptor with order zero runs before default status validation. Removing FetchInterceptor means no built-in HTTP I/O; `clear()` is not merely removing custom hooks.

## Failure and recovery {#recovery}

`new InterceptorManager(validateStatus?)` constructs these request/response registries and an empty error registry. `exchange(exchange)` runs request then response. On rejection it stores the thrown value in `exchange.error`, runs the error registry, then throws an `ExchangeError` if `hasError()` remains true.

An error interceptor recovers by supplying any needed response/result state and clearing `exchange.error`. The response chain is **not rerun** after recovery, so recovered responses must already meet the application's policy. A throw from the error chain escapes directly and prevents later error interceptors. Error interceptors are not automatic retries, and extractor failures occur outside this manager.

Interceptors added to a shared client remain until ejected. Use distinct stable names and remove request-specific instrumentation when its owner ends; do not accumulate a new interceptor per request.

## Complete example {#example}

```ts
import { Fetcher, setHeader } from '@ahoo-wang/fetcher';

const client = new Fetcher({ baseURL: 'https://api.example.com' });
client.interceptors.request.use({
  name: 'trace',
  order: 0,
  intercept(exchange) {
    setHeader(exchange.ensureRequestHeaders(), 'X-Trace-Id', 'demo-trace');
  },
});
console.assert(client.interceptors.request.eject('trace'));
```

## Public symbols and source {#symbols}

| Symbol                                                                        | Implementation                                                                                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| <a id="fetch_interceptor_name"></a>`FETCH_INTERCEPTOR_NAME`                   | [fetchInterceptor.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchInterceptor.ts#L24)             |
| <a id="fetch_interceptor_order"></a>`FETCH_INTERCEPTOR_ORDER`                 | [fetchInterceptor.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchInterceptor.ts#L30)             |
| <a id="fetchinterceptor"></a>`FetchInterceptor`                               | [fetchInterceptor.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchInterceptor.ts#L54)             |
| <a id="default_interceptor_order_step"></a>`DEFAULT_INTERCEPTOR_ORDER_STEP`   | [interceptor.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L18)                       |
| <a id="built_in_interceptor_order_step"></a>`BUILT_IN_INTERCEPTOR_ORDER_STEP` | [interceptor.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L20)                       |
| <a id="interceptor"></a>`Interceptor`                                         | [interceptor.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L44)                       |
| <a id="requestinterceptor"></a>`RequestInterceptor`                           | [interceptor.ts:111](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L111)                     |
| <a id="responseinterceptor"></a>`ResponseInterceptor`                         | [interceptor.ts:135](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L135)                     |
| <a id="errorinterceptor"></a>`ErrorInterceptor`                               | [interceptor.ts:164](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L164)                     |
| <a id="interceptorregistry"></a>`InterceptorRegistry`                         | [interceptor.ts:189](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L189)                     |
| <a id="interceptormanager"></a>`InterceptorManager`                           | [interceptorManager.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptorManager.ts#L48)         |
| <a id="orderedcapable"></a>`OrderedCapable`                                   | [orderedCapable.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/orderedCapable.ts#L29)                 |
| <a id="sortorder"></a>`sortOrder`                                             | [orderedCapable.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/orderedCapable.ts#L53)                 |
| <a id="tosorted"></a>`toSorted`                                               | [orderedCapable.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/orderedCapable.ts#L87)                 |
| <a id="request_body_interceptor_name"></a>`REQUEST_BODY_INTERCEPTOR_NAME`     | [requestBodyInterceptor.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestBodyInterceptor.ts#L25) |
| <a id="request_body_interceptor_order"></a>`REQUEST_BODY_INTERCEPTOR_ORDER`   | [requestBodyInterceptor.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestBodyInterceptor.ts#L30) |
| <a id="requestbodyinterceptor"></a>`RequestBodyInterceptor`                   | [requestBodyInterceptor.ts:50](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestBodyInterceptor.ts#L50) |
| <a id="url_resolve_interceptor_name"></a>`URL_RESOLVE_INTERCEPTOR_NAME`       | [urlResolveInterceptor.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlResolveInterceptor.ts#L24)   |
| <a id="url_resolve_interceptor_order"></a>`URL_RESOLVE_INTERCEPTOR_ORDER`     | [urlResolveInterceptor.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlResolveInterceptor.ts#L29)   |
| <a id="urlresolveinterceptor"></a>`UrlResolveInterceptor`                     | [urlResolveInterceptor.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlResolveInterceptor.ts#L53)   |

[Package index](./index.md)
