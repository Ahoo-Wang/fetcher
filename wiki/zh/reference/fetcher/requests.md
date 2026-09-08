---
title: '请求、请求头与正文'
description: '请求、请求头与正文 — @ahoo-wang/fetcher 5.0.0'
---

# 请求、请求头与正文

`FetchRequest` 在 `FetchRequestInit` 上增加必填的 `url: string`。`FetchRequestInit<BODY>` 扩展原生 `RequestInit`，将头替换为 `RequestHeaders`、正文替换为 `RequestBodyType`，并增加 `timeout`、`urlParams`、`abortController`。原生 credentials、cache、mode、redirect、integrity 等受支持的 Fetch 选项继续透传。

普通调用直接把请求对象传给客户端方法；只有自行组合两份配置时才调用 `mergeRequest`。模板值放在 `urlParams.path`，查询串放在 `urlParams.query`。`body` 表示请求载荷；`resultExtractor` 应放在方法的第三个选项参数中，不属于请求对象。

## 请求字段 {#fields}

| 字段/类型                                  | 契约                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `RequestHeaders` / `RequestHeadersCapable` | 普通字符串键记录，值为 `string \| undefined`，不是原生 `Headers` 实例。                                                        |
| `RequestBodyType`                          | `BodyInit \| Record<string, any> \| string \| null`；省略正文时保持缺失。                                                      |
| `BaseURLCapable`                           | 必填 `baseURL: string`；`UrlParamsCapable` 提供可选 `urlParams`。                                                              |
| `HttpMethod`                               | GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS、TRACE 字符串枚举；仍受平台限制。                                                 |
| `CONTENT_TYPE_HEADER`                      | `'Content-Type'`；`ContentTypeValues.APPLICATION_JSON` 为 `'application/json'`，`TEXT_EVENT_STREAM` 为 `'text/event-stream'`。 |

## 合并规则 {#merge}

`mergeRequest(first, second): FetchRequestInit` 对 path/query 记录做一层合并，对请求头按大小写不敏感规则合并，第二个请求优先。`method`、`body`、`timeout`、`signal`、`abortController` 的第二个值为 nullish 时回退到第一个，因此此辅助函数中的 `body: null` 不能清空已有正文。其他原生字段遵循对象展开规则。空输入快捷路径在没有头时可能返回原对象，并非深复制。

`mergeRequestOptions(first?, second?)` 按第二个、第一个的顺序选择非 nullish 的 `resultExtractor` 和 `attributes`，提取器最终回退到 Exchange。attributes 整体替换，不做合并。`mergeRecords(first?, second?)` 浅合并且后者优先，仅一个记录存在时可能返回原记录。`mergeRecordToMap(record?, map?)` 将记录或 Map 写入给定 Map（未传则新建），并返回同一个 Map。

## 请求头辅助函数 {#headers}

| 函数                              | 返回值与修改行为                                           |
| --------------------------------- | ---------------------------------------------------------- |
| `getHeader(headers, name)`        | 返回最后一个大小写不敏感匹配值或 `undefined`，不修改输入。 |
| `deleteHeader(headers, name)`     | 删除所有大小写变体，返回 `void`。                          |
| `setHeader(headers, name, value)` | 先删除所有变体，再按给定拼写设置；`undefined` 表示删除。   |
| `mergeHeaders(...records)`        | 返回新记录；后值优先，后续 `undefined` 删除继承头。        |

## 正文转换 {#body}

`RequestBodyInterceptor` 在普通 order 为零的请求拦截器之前运行。字符串与 nullish 正文原样通过。Blob、File、FormData、URLSearchParams 保持原值，但移除所有 Content-Type 拼写，让 Fetch 决定类型与边界。ArrayBuffer、类型化数组/DataView、ReadableStream 原样通过，不调整请求头。其他对象（含数组）使用 `JSON.stringify`，仅在缺少 Content-Type 时补 JSON 类型。显式非 JSON Content-Type 不会阻止 JSON 序列化。循环对象或 BigInt 可能序列化失败并进入错误管线。

流式上传支持和额外的运行时特有请求字段仍由调用者负责。插入正文转换器前请阅读[管线顺序](./interceptors.md)。

## 完整示例 {#example}

```ts
import { Fetcher, mergeRequest, getHeader } from '@ahoo-wang/fetcher';

const client = new Fetcher({ baseURL: 'https://api.example.com' });
const request = mergeRequest(
  { headers: { Authorization: 'Bearer demo' }, timeout: 3000 },
  { headers: { authorization: undefined }, timeout: 0, body: { name: 'Ada' } },
);
const exchange = client.resolveExchange({
  ...request,
  url: '/users',
  method: 'POST',
});
console.assert(
  getHeader(exchange.request.headers, 'authorization') === undefined,
);
console.assert(exchange.request.timeout === 0);
```

## 公开符号与源码 {#symbols}

| 符号                                                      | 实现                                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| <a id="baseurlcapable"></a>`BaseURLCapable`               | [fetchRequest.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L23)     |
| <a id="httpmethod"></a>`HttpMethod`                       | [fetchRequest.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L37)     |
| <a id="urlparamscapable"></a>`UrlParamsCapable`           | [fetchRequest.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L48)     |
| <a id="content_type_header"></a>`CONTENT_TYPE_HEADER`     | [fetchRequest.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L55)     |
| <a id="contenttypevalues"></a>`ContentTypeValues`         | [fetchRequest.ts:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L57)     |
| <a id="requestheaders"></a>`RequestHeaders`               | [fetchRequest.ts:68](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L68)     |
| <a id="requestheaderscapable"></a>`RequestHeadersCapable` | [fetchRequest.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L81)     |
| <a id="requestbodytype"></a>`RequestBodyType`             | [fetchRequest.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L88)     |
| <a id="fetchrequestinit"></a>`FetchRequestInit`           | [fetchRequest.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L112)   |
| <a id="fetchrequest"></a>`FetchRequest`                   | [fetchRequest.ts:176](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L176)   |
| <a id="mergerequest"></a>`mergeRequest`                   | [mergeRequest.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/mergeRequest.ts#L65)     |
| <a id="mergerequestoptions"></a>`mergeRequestOptions`     | [mergeRequest.ts:118](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/mergeRequest.ts#L118)   |
| <a id="getheader"></a>`getHeader`                         | [requestHeaders.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestHeaders.ts#L17) |
| <a id="deleteheader"></a>`deleteHeader`                   | [requestHeaders.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestHeaders.ts#L29) |
| <a id="setheader"></a>`setHeader`                         | [requestHeaders.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestHeaders.ts#L39) |
| <a id="mergeheaders"></a>`mergeHeaders`                   | [requestHeaders.ts:56](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/requestHeaders.ts#L56) |
| <a id="mergerecords"></a>`mergeRecords`                   | [utils.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/utils.ts#L42)                   |
| <a id="mergerecordtomap"></a>`mergeRecordToMap`           | [utils.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/utils.ts#L71)                   |

[包索引](./index.md)
