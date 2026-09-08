---
title: 'Fetcher 参考'
description: '使用显式结果提取、有序拦截器和原生 Fetch 取消的 HTTP 请求客户端。'
---

# Fetcher 参考

使用显式结果提取、有序拦截器和原生 Fetch 取消的 HTTP 请求客户端。

## 安装与运行时

```sh
pnpm add @ahoo-wang/fetcher
```

5.0.0 为消费者声明 Node >=18.20.8。仓库开发另要求 Node >=20.20.2 / pnpm 10.34.5。所用功能依赖的浏览器/运行时 API 也必须存在，engine 范围不代表每个 Web API（如 Response.bytes）均可用。

## 选择专题

| 专题                                                                 | 用途                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [客户端与注册](/zh/reference/fetcher/client.md)                      | 创建 `Fetcher` 以共享 URL、请求头、超时和拦截器策略。请求仍调用运行时全局 `fetch`；客户端不管理连接池，也不需要 `destroy()`。                                                                                                                                                                                     |
| [请求、请求头与正文](/zh/reference/fetcher/requests.md)              | `FetchRequest` 在 `FetchRequestInit` 上增加必填的 `url: string`。`FetchRequestInit<BODY>` 扩展原生 `RequestInit`，将头替换为 `RequestHeaders`、正文替换为 `RequestBodyType`，并增加 `timeout`、`urlParams`、`abortController`。原生 credentials、cache、mode、redirect、integrity 等受支持的 Fetch 选项继续透传。 |
| [URL 构建与模板](/zh/reference/fetcher/urls.md)                      | `UrlBuilder` 组合基础 URL、路径替换值和查询记录，不发起请求，也不实现通用 RFC URI-template 展开。                                                                                                                                                                                                                 |
| [Exchange 与结果提取](/zh/reference/fetcher/results.md)              | 结果提取器决定运行时返回值，与 `request<R>` 或 `get<R>` 的 TypeScript 泛型独立。在 `RequestOptions.resultExtractor` 中选择提取器。                                                                                                                                                                                |
| [拦截器管线](/zh/reference/fetcher/interceptors.md)                  | 拦截器修改共享 `FetchExchange`，返回 `void \| Promise<void>`，不返回替代 exchange。`RequestInterceptor`、`ResponseInterceptor`、`ErrorInterceptor`是`Interceptor`的结构化特例，必填`name`、`order`、`intercept(exchange)`。                                                                                       |
| [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md) | Fetcher 默认管线拒绝 200–299 之外的 HTTP 状态。原生 fetch 本身会正常返回这些响应，因此处理 Fetcher 请求失败时应检查 exchange。                                                                                                                                                                                    |

## 最小完整示例

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

## 公开导出索引 {#exports}

| 符号                                | 契约                                                                                                   | 源码                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `AttributesCapable`                 | [Exchange 与结果提取](/zh/reference/fetcher/results.md#attributescapable)                              | [fetchExchange.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchExchange.ts#L23)                           |
| `FetchExchangeInit`                 | [Exchange 与结果提取](/zh/reference/fetcher/results.md#fetchexchangeinit)                              | [fetchExchange.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchExchange.ts#L41)                           |
| `FetchExchange`                     | [Exchange 与结果提取](/zh/reference/fetcher/results.md#fetchexchange)                                  | [fetchExchange.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchExchange.ts#L105)                         |
| `FETCH_INTERCEPTOR_NAME`            | [拦截器管线](/zh/reference/fetcher/interceptors.md#fetch_interceptor_name)                             | [fetchInterceptor.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchInterceptor.ts#L24)                     |
| `FETCH_INTERCEPTOR_ORDER`           | [拦截器管线](/zh/reference/fetcher/interceptors.md#fetch_interceptor_order)                            | [fetchInterceptor.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchInterceptor.ts#L30)                     |
| `FetchInterceptor`                  | [拦截器管线](/zh/reference/fetcher/interceptors.md#fetchinterceptor)                                   | [fetchInterceptor.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchInterceptor.ts#L54)                     |
| `BaseURLCapable`                    | [请求、请求头与正文](/zh/reference/fetcher/requests.md#baseurlcapable)                                 | [fetchRequest.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L23)                             |
| `HttpMethod`                        | [请求、请求头与正文](/zh/reference/fetcher/requests.md#httpmethod)                                     | [fetchRequest.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L37)                             |
| `UrlParamsCapable`                  | [请求、请求头与正文](/zh/reference/fetcher/requests.md#urlparamscapable)                               | [fetchRequest.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L48)                             |
| `CONTENT_TYPE_HEADER`               | [请求、请求头与正文](/zh/reference/fetcher/requests.md#content_type_header)                            | [fetchRequest.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L55)                             |
| `ContentTypeValues`                 | [请求、请求头与正文](/zh/reference/fetcher/requests.md#contenttypevalues)                              | [fetchRequest.ts:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L57)                             |
| `RequestHeaders`                    | [请求、请求头与正文](/zh/reference/fetcher/requests.md#requestheaders)                                 | [fetchRequest.ts:68](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L68)                             |
| `RequestHeadersCapable`             | [请求、请求头与正文](/zh/reference/fetcher/requests.md#requestheaderscapable)                          | [fetchRequest.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L81)                             |
| `RequestBodyType`                   | [请求、请求头与正文](/zh/reference/fetcher/requests.md#requestbodytype)                                | [fetchRequest.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L88)                             |
| `FetchRequestInit`                  | [请求、请求头与正文](/zh/reference/fetcher/requests.md#fetchrequestinit)                               | [fetchRequest.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L112)                           |
| `FetchRequest`                      | [请求、请求头与正文](/zh/reference/fetcher/requests.md#fetchrequest)                                   | [fetchRequest.ts:176](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L176)                           |
| `FetcherOptions`                    | [客户端与注册](/zh/reference/fetcher/client.md#fetcheroptions)                                         | [fetcher.ts:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L52)                                       |
| `DEFAULT_OPTIONS`                   | [客户端与注册](/zh/reference/fetcher/client.md#default_options)                                        | [fetcher.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L87)                                       |
| `RequestOptions`                    | [客户端与注册](/zh/reference/fetcher/client.md#requestoptions)                                         | [fetcher.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L95)                                       |
| `DEFAULT_REQUEST_OPTIONS`           | [客户端与注册](/zh/reference/fetcher/client.md#default_request_options)                                | [fetcher.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L98)                                       |
| `DEFAULT_FETCH_OPTIONS`             | [客户端与注册](/zh/reference/fetcher/client.md#default_fetch_options)                                  | [fetcher.ts:101](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L101)                                     |
| `Fetcher`                           | [客户端与注册](/zh/reference/fetcher/client.md#fetcher)                                                | [fetcher.ts:124](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L124)                                     |
| `FetcherCapable`                    | [客户端与注册](/zh/reference/fetcher/client.md#fetchercapable)                                         | [fetcherCapable.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherCapable.ts#L22)                         |
| `getFetcher`                        | [客户端与注册](/zh/reference/fetcher/client.md#getfetcher)                                             | [fetcherCapable.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherCapable.ts#L37)                         |
| `FetcherError`                      | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#fetchererror)                      | [fetcherError.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L37)                             |
| `ExchangeError`                     | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#exchangeerror)                     | [fetcherError.ts:86](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L86)                             |
| `DEFAULT_FETCHER_NAME`              | [客户端与注册](/zh/reference/fetcher/client.md#default_fetcher_name)                                   | [fetcherRegistrar.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L19)                     |
| `FetcherRegistrar`                  | [客户端与注册](/zh/reference/fetcher/client.md#fetcherregistrar)                                       | [fetcherRegistrar.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L41)                     |
| `fetcherRegistrar`                  | [客户端与注册](/zh/reference/fetcher/client.md#fetcherregistrar-instance)                              | [fetcherRegistrar.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L166)                   |
| `DEFAULT_INTERCEPTOR_ORDER_STEP`    | [拦截器管线](/zh/reference/fetcher/interceptors.md#default_interceptor_order_step)                     | [interceptor.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L18)                               |
| `BUILT_IN_INTERCEPTOR_ORDER_STEP`   | [拦截器管线](/zh/reference/fetcher/interceptors.md#built_in_interceptor_order_step)                    | [interceptor.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L20)                               |
| `Interceptor`                       | [拦截器管线](/zh/reference/fetcher/interceptors.md#interceptor)                                        | [interceptor.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L44)                               |
| `RequestInterceptor`                | [拦截器管线](/zh/reference/fetcher/interceptors.md#requestinterceptor)                                 | [interceptor.ts:111](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L111)                             |
| `ResponseInterceptor`               | [拦截器管线](/zh/reference/fetcher/interceptors.md#responseinterceptor)                                | [interceptor.ts:135](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L135)                             |
| `ErrorInterceptor`                  | [拦截器管线](/zh/reference/fetcher/interceptors.md#errorinterceptor)                                   | [interceptor.ts:164](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L164)                             |
| `InterceptorRegistry`               | [拦截器管线](/zh/reference/fetcher/interceptors.md#interceptorregistry)                                | [interceptor.ts:189](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L189)                             |
| `InterceptorManager`                | [拦截器管线](/zh/reference/fetcher/interceptors.md#interceptormanager)                                 | [interceptorManager.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptorManager.ts#L48)                 |
| `mergeRequest`                      | [请求、请求头与正文](/zh/reference/fetcher/requests.md#mergerequest)                                   | [mergeRequest.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/mergeRequest.ts#L65)                             |
| `mergeRequestOptions`               | [请求、请求头与正文](/zh/reference/fetcher/requests.md#mergerequestoptions)                            | [mergeRequest.ts:118](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/mergeRequest.ts#L118)                           |
| `NamedFetcher`                      | [客户端与注册](/zh/reference/fetcher/client.md#namedfetcher)                                           | [namedFetcher.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/namedFetcher.ts#L38)                             |
| `fetcher`                           | [客户端与注册](/zh/reference/fetcher/client.md#fetcher-instance)                                       | [namedFetcher.ts:89](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/namedFetcher.ts#L89)                             |
| `OrderedCapable`                    | [拦截器管线](/zh/reference/fetcher/interceptors.md#orderedcapable)                                     | [orderedCapable.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/orderedCapable.ts#L29)                         |
| `sortOrder`                         | [拦截器管线](/zh/reference/fetcher/interceptors.md#sortorder)                                          | [orderedCapable.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/orderedCapable.ts#L53)                         |
| `toSorted`                          | [拦截器管线](/zh/reference/fetcher/interceptors.md#tosorted)                                           | [orderedCapable.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/orderedCapable.ts#L87)                         |
| `REQUEST_BODY_INTERCEPTOR_NAME`     | [拦截器管线](/zh/reference/fetcher/interceptors.md#request_body_interceptor_name)                      | [requestBodyInterceptor.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestBodyInterceptor.ts#L25)         |
| `REQUEST_BODY_INTERCEPTOR_ORDER`    | [拦截器管线](/zh/reference/fetcher/interceptors.md#request_body_interceptor_order)                     | [requestBodyInterceptor.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestBodyInterceptor.ts#L30)         |
| `RequestBodyInterceptor`            | [拦截器管线](/zh/reference/fetcher/interceptors.md#requestbodyinterceptor)                             | [requestBodyInterceptor.ts:50](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestBodyInterceptor.ts#L50)         |
| `getHeader`                         | [请求、请求头与正文](/zh/reference/fetcher/requests.md#getheader)                                      | [requestHeaders.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestHeaders.ts#L17)                         |
| `deleteHeader`                      | [请求、请求头与正文](/zh/reference/fetcher/requests.md#deleteheader)                                   | [requestHeaders.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestHeaders.ts#L29)                         |
| `setHeader`                         | [请求、请求头与正文](/zh/reference/fetcher/requests.md#setheader)                                      | [requestHeaders.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestHeaders.ts#L39)                         |
| `mergeHeaders`                      | [请求、请求头与正文](/zh/reference/fetcher/requests.md#mergeheaders)                                   | [requestHeaders.ts:56](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestHeaders.ts#L56)                         |
| `ResultExtractor`                   | [Exchange 与结果提取](/zh/reference/fetcher/results.md#resultextractor)                                | [resultExtractor.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L23)                       |
| `ResultExtractorCapable`            | [Exchange 与结果提取](/zh/reference/fetcher/results.md#resultextractorcapable)                         | [resultExtractor.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L31)                       |
| `ExchangeResultExtractor`           | [Exchange 与结果提取](/zh/reference/fetcher/results.md#exchangeresultextractor)                        | [resultExtractor.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L42)                       |
| `ResponseResultExtractor`           | [Exchange 与结果提取](/zh/reference/fetcher/results.md#responseresultextractor)                        | [resultExtractor.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L55)                       |
| `JsonResultExtractor`               | [Exchange 与结果提取](/zh/reference/fetcher/results.md#jsonresultextractor)                            | [resultExtractor.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L67)                       |
| `TextResultExtractor`               | [Exchange 与结果提取](/zh/reference/fetcher/results.md#textresultextractor)                            | [resultExtractor.ts:79](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L79)                       |
| `BlobResultExtractor`               | [Exchange 与结果提取](/zh/reference/fetcher/results.md#blobresultextractor)                            | [resultExtractor.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L92)                       |
| `ArrayBufferResultExtractor`        | [Exchange 与结果提取](/zh/reference/fetcher/results.md#arraybufferresultextractor)                     | [resultExtractor.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L106)                     |
| `BytesResultExtractor`              | [Exchange 与结果提取](/zh/reference/fetcher/results.md#bytesresultextractor)                           | [resultExtractor.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L120)                     |
| `ResultExtractors`                  | [Exchange 与结果提取](/zh/reference/fetcher/results.md#resultextractors)                               | [resultExtractor.ts:131](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L131)                     |
| `FetchTimeoutError`                 | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#fetchtimeouterror)                 | [timeout.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L33)                                       |
| `TimeoutCapable`                    | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#timeoutcapable)                    | [timeout.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L60)                                       |
| `resolveTimeout`                    | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#resolvetimeout)                    | [timeout.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L81)                                       |
| `timeoutFetch`                      | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#timeoutfetch)                      | [timeout.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L120)                                     |
| `PartialBy`                         | [Exchange 与结果提取](/zh/reference/fetcher/results.md#partialby)                                      | [types.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L33)                                           |
| `RequiredBy`                        | [Exchange 与结果提取](/zh/reference/fetcher/results.md#requiredby)                                     | [types.ts:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L52)                                           |
| `RemoveReadonlyFields`              | [Exchange 与结果提取](/zh/reference/fetcher/results.md#removereadonlyfields)                           | [types.ts:85](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L85)                                           |
| `NamedCapable`                      | [客户端与注册](/zh/reference/fetcher/client.md#namedcapable)                                           | [types.ts:141](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L141)                                         |
| `FetcherConfigurer`                 | [客户端与注册](/zh/reference/fetcher/client.md#fetcherconfigurer)                                      | [types.ts:248](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L248)                                         |
| `UrlParams`                         | [URL 构建与模板](/zh/reference/fetcher/urls.md#urlparams)                                              | [urlBuilder.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L27)                                 |
| `UrlBuilder`                        | [URL 构建与模板](/zh/reference/fetcher/urls.md#urlbuilder)                                             | [urlBuilder.ts:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L72)                                 |
| `UrlBuilderCapable`                 | [URL 构建与模板](/zh/reference/fetcher/urls.md#urlbuildercapable)                                      | [urlBuilder.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L166)                               |
| `URL_RESOLVE_INTERCEPTOR_NAME`      | [拦截器管线](/zh/reference/fetcher/interceptors.md#url_resolve_interceptor_name)                       | [urlResolveInterceptor.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlResolveInterceptor.ts#L24)           |
| `URL_RESOLVE_INTERCEPTOR_ORDER`     | [拦截器管线](/zh/reference/fetcher/interceptors.md#url_resolve_interceptor_order)                      | [urlResolveInterceptor.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlResolveInterceptor.ts#L29)           |
| `UrlResolveInterceptor`             | [拦截器管线](/zh/reference/fetcher/interceptors.md#urlresolveinterceptor)                              | [urlResolveInterceptor.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlResolveInterceptor.ts#L53)           |
| `UrlTemplateStyle`                  | [URL 构建与模板](/zh/reference/fetcher/urls.md#urltemplatestyle)                                       | [urlTemplateResolver.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L20)               |
| `getUrlTemplateResolver`            | [URL 构建与模板](/zh/reference/fetcher/urls.md#geturltemplateresolver)                                 | [urlTemplateResolver.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L63)               |
| `UrlTemplateResolver`               | [URL 构建与模板](/zh/reference/fetcher/urls.md#urltemplateresolver)                                    | [urlTemplateResolver.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L92)               |
| `urlTemplateRegexResolve`           | [URL 构建与模板](/zh/reference/fetcher/urls.md#urltemplateregexresolve)                                | [urlTemplateResolver.ts:151](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L151)             |
| `urlTemplateRegexExtract`           | [URL 构建与模板](/zh/reference/fetcher/urls.md#urltemplateregexextract)                                | [urlTemplateResolver.ts:174](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L174)             |
| `UriTemplateResolver`               | [URL 构建与模板](/zh/reference/fetcher/urls.md#uritemplateresolver)                                    | [urlTemplateResolver.ts:205](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L205)             |
| `uriTemplateResolver`               | [URL 构建与模板](/zh/reference/fetcher/urls.md#uritemplateresolver-instance)                           | [urlTemplateResolver.ts:297](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L297)             |
| `ExpressUrlTemplateResolver`        | [URL 构建与模板](/zh/reference/fetcher/urls.md#expressurltemplateresolver)                             | [urlTemplateResolver.ts:316](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L316)             |
| `expressUrlTemplateResolver`        | [URL 构建与模板](/zh/reference/fetcher/urls.md#expressurltemplateresolver-instance)                    | [urlTemplateResolver.ts:397](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L397)             |
| `isAbsoluteURL`                     | [URL 构建与模板](/zh/reference/fetcher/urls.md#isabsoluteurl)                                          | [urls.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urls.ts#L27)                                             |
| `combineURLs`                       | [URL 构建与模板](/zh/reference/fetcher/urls.md#combineurls)                                            | [urls.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urls.ts#L49)                                             |
| `mergeRecords`                      | [请求、请求头与正文](/zh/reference/fetcher/requests.md#mergerecords)                                   | [utils.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/utils.ts#L42)                                           |
| `mergeRecordToMap`                  | [请求、请求头与正文](/zh/reference/fetcher/requests.md#mergerecordtomap)                               | [utils.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/utils.ts#L71)                                           |
| `HttpStatusValidationError`         | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#httpstatusvalidationerror)         | [validateStatusInterceptor.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L27)   |
| `ValidateStatus`                    | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#validatestatus)                    | [validateStatusInterceptor.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L62)   |
| `VALIDATE_STATUS_INTERCEPTOR_NAME`  | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#validate_status_interceptor_name)  | [validateStatusInterceptor.ts:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L70)   |
| `VALIDATE_STATUS_INTERCEPTOR_ORDER` | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#validate_status_interceptor_order) | [validateStatusInterceptor.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L77)   |
| `IGNORE_VALIDATE_STATUS`            | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#ignore_validate_status)            | [validateStatusInterceptor.ts:97](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L97)   |
| `ValidateStatusInterceptor`         | [错误、超时与取消](/zh/reference/fetcher/errors-and-cancellation.md#validatestatusinterceptor)         | [validateStatusInterceptor.ts:126](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L126) |

## 旧章节链接

旧版参考链接仍可定位到下列专题。

| 旧章节                                                                          | 新专题                                                           |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| <span id="安装与入口选择"></span>安装与入口选择                                 | [阅读对应专题](/zh/reference/fetcher/index.md)                   |
| <span id="http-方法矩阵"></span>HTTP 方法矩阵                                   | [阅读对应专题](/zh/reference/fetcher/index.md)                   |
| <span id="client-配置"></span>Client 配置                                       | [阅读对应专题](/zh/reference/fetcher/client.md)                  |
| <span id="类型化请求与-fetchrequestinit"></span>类型化请求与 FetchRequestInit   | [阅读对应专题](/zh/reference/fetcher/requests.md)                |
| <span id="解析与-url-规则"></span>解析与 URL 规则                               | [阅读对应专题](/zh/reference/fetcher/urls.md)                    |
| <span id="result、interceptor-与错误契约"></span>Result、Interceptor 与错误契约 | [阅读对应专题](/zh/reference/fetcher/errors-and-cancellation.md) |
| <span id="超时与调用方取消"></span>超时与调用方取消                             | [阅读对应专题](/zh/reference/fetcher/errors-and-cancellation.md) |
| <span id="源码参考"></span>源码参考                                             | [阅读对应专题](/zh/reference/fetcher/index.md)                   |
