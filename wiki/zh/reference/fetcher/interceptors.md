---
title: '拦截器管线'
description: '拦截器管线 — @ahoo-wang/fetcher 5.0.0'
---

# 拦截器管线

拦截器修改共享 `FetchExchange`，返回 `void | Promise<void>`，不返回替代 exchange。`RequestInterceptor`、`ResponseInterceptor`、`ErrorInterceptor` 是 `Interceptor` 的结构化特例，必填 `name`、`order`、`intercept(exchange)`。

## 注册与排序 {#registry}

`new InterceptorRegistry(interceptors = [])` 按 order 升序排序。`use(interceptor): boolean` 拒绝重复名称；`eject(name): boolean` 表示是否删除；`clear(): void` 清空全部条目。构造器排序的是初始数组的副本，不修改传入数组，也不会去重初始条目。`interceptors` 返回数组副本。`intercept(exchange): Promise<void>` 依次等待，拒绝时停止。注册表本身实现 Interceptor，`name` 为构造器名称，order 为 `Number.MIN_SAFE_INTEGER`。

`OrderedCapable.order` 可选；`sortOrder(a, b)` 把缺失值视为零。`toSorted(array, filter?)` 返回排序副本，可选过滤。`DEFAULT_INTERCEPTOR_ORDER_STEP = 1000`、`BUILT_IN_INTERCEPTOR_ORDER_STEP = 10000` 提供排序间隔。

## 内置阶段 {#pipeline}

| 注册表 / 实现                         | 导出的顺序值                                                   | 效果                                           |
| ------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| request：`RequestBodyInterceptor`     | `REQUEST_BODY_INTERCEPTOR_ORDER = MIN_SAFE_INTEGER + 10000`    | 规范化正文与 Content-Type。                    |
| request：`UrlResolveInterceptor`      | `URL_RESOLVE_INTERCEPTOR_ORDER = MAX_SAFE_INTEGER - 20000`     | 解析基础路径、路径参数、查询，清空 urlParams。 |
| request：`FetchInterceptor`           | `FETCH_INTERCEPTOR_ORDER = MAX_SAFE_INTEGER - 10000`           | 等待 `timeoutFetch` 并赋值 response。          |
| response：`ValidateStatusInterceptor` | `VALIDATE_STATUS_INTERCEPTOR_ORDER = MAX_SAFE_INTEGER - 10000` | 除非绕过，否则拒绝不接受的状态。               |

对应 `*_INTERCEPTOR_NAME` 等于实现类名。order 为零的请求拦截器看到已规范化正文、尚未解析的 URL；order 为零的响应拦截器在默认状态校验之前运行。移除 FetchInterceptor 后不再执行内置 HTTP I/O；`clear()` 并非只移除自定义钩子。

## 失败与恢复 {#recovery}

`new InterceptorManager(validateStatus?)` 创建上述请求/响应注册表和空错误注册表。`exchange(exchange)` 先运行 request，再运行 response。拒绝时将抛出的值放到 `exchange.error`，运行 error 注册表；若 `hasError()` 仍为真，则抛 `ExchangeError`。

错误拦截器通过补齐所需响应/结果状态并清空 `exchange.error` 完成恢复。恢复后**不会重跑响应链**，因此恢复响应必须已满足应用策略。错误链自身抛错会直接传出，后续错误拦截器不再执行。错误拦截器不自动重试，提取器失败发生在此管理器之外。

共享客户端中的拦截器会一直保留直到移除。使用独立稳定名称，并在所有者结束时移除请求专属埋点；不要每次请求都追加新拦截器。

## 完整示例 {#example}

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

## 公开符号与源码 {#symbols}

| 符号                                                                          | 实现                                                                                                                              |
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

[包索引](./index.md)
