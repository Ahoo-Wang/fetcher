---
title: 'Exchange 与结果提取'
description: 'Exchange 与结果提取 — @ahoo-wang/fetcher 5.0.0'
---

# Exchange 与结果提取

结果提取器决定运行时返回值，与 `request<R>` 或 `get<R>` 的 TypeScript 泛型独立。在 `RequestOptions.resultExtractor` 中选择提取器。

## 选择提取器 {#extractors}

`ResultExtractor<R>` 为 `(exchange: FetchExchange) => R | Promise<R>`；`ResultExtractorCapable` 声明其可选字段。`ResultExtractors` 中的属性直接对应下列导出函数：

| 属性 / 导出函数                              | Promise 解析后的值          | 正文读取                             |
| -------------------------------------------- | --------------------------- | ------------------------------------ |
| `Exchange` / `ExchangeResultExtractor`       | 同一个 `FetchExchange`      | 不读取                               |
| `Response` / `ResponseResultExtractor`       | `exchange.requiredResponse` | 不读取                               |
| `Json` / `JsonResultExtractor`               | 已解析 JSON（`any`）        | `Response.json()`                    |
| `Text` / `TextResultExtractor`               | `string`                    | `Response.text()`                    |
| `Blob` / `BlobResultExtractor`               | `Blob`                      | `Response.blob()`                    |
| `ArrayBuffer` / `ArrayBufferResultExtractor` | `ArrayBuffer`               | `Response.arrayBuffer()`             |
| `Bytes` / `BytesResultExtractor`             | `Uint8Array<ArrayBuffer>`   | `Response.bytes()`，要求运行时支持。 |

JSON 类型仅为编译期约定，不提供运行时校验。包对 `Response.json<T = any>(): Promise<T>` 的扩展只影响类型。204 空响应仍会 JSON 解析失败；空正文应选择 Response 或自定义提取器。

## FetchExchange {#exchange}

`new FetchExchange(init: FetchExchangeInit)` 要求 `fetcher` 和 `request`，可选 `resultExtractor`、`response`、`error`、`attributes`。`AttributesCapable.attributes` 接受记录或 Map，构造时把条目复制到新 Map。提取器默认 Exchange；请求与响应均保留引用，不复制。

| 成员                             | 契约                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| `ensureRequestHeaders()`         | 返回已有头，或创建并返回 `{}`。                               |
| `ensureRequestUrlParams()`       | 确保 `.path`、`.query` 记录存在，返回 `Required<UrlParams>`。 |
| `hasError()`、`hasResponse()`    | 按真值判断。                                                  |
| `requiredResponse`               | 返回响应，缺失时抛 `ExchangeError`。                          |
| `extractResult<R>(): Promise<R>` | 计算一次并缓存值或 Promise，并发调用复用。                    |
| `response = value`               | 替换响应并清空结果缓存。                                      |

异步提取被拒绝时保留被拒绝的 Promise 缓存；若提取器尚未返回值/Promise 就同步抛错，则不填充缓存，下次调用可以重试。只修改 `resultExtractor` 不清除已有缓存。正文只能读取一次；缓存仅避免经 `extractResult` 重复解析，无法保护直接重复调用 `response.json()`。

提取发生在拦截器管理器结束之后，提取器解析错误不会重新进入错误拦截器。调用者应捕获请求或迭代的拒绝。自定义提取器返回的流由调用者负责读完或取消。

## 公开辅助类型 {#utility-types}

`PartialBy<T, K>` 将指定键变为可选；`RequiredBy<T, K>` 将指定键变为必填；`RemoveReadonlyFields<T>` 移除只读键，保留可写键。它们没有运行时行为，也不校验数据。

## 完整示例 {#example}

```ts
import { Fetcher, FetchExchange, ResultExtractors } from '@ahoo-wang/fetcher';

type User = { id: string; name: string };
const client = new Fetcher();
const exchange = new FetchExchange({
  fetcher: client,
  request: { url: '/users/1' },
  response: Response.json({ id: '1', name: 'Ada' }),
  resultExtractor: ResultExtractors.Json,
});
const first = await exchange.extractResult<User>();
const second = await exchange.extractResult<User>();
console.assert(first === second && first.name === 'Ada');
```

## 公开符号与源码 {#symbols}

| 符号                                                                | 实现                                                                                                                  |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| <a id="attributescapable"></a>`AttributesCapable`                   | [fetchExchange.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchExchange.ts#L23)       |
| <a id="fetchexchangeinit"></a>`FetchExchangeInit`                   | [fetchExchange.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchExchange.ts#L41)       |
| <a id="fetchexchange"></a>`FetchExchange`                           | [fetchExchange.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchExchange.ts#L105)     |
| <a id="resultextractor"></a>`ResultExtractor`                       | [resultExtractor.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L23)   |
| <a id="resultextractorcapable"></a>`ResultExtractorCapable`         | [resultExtractor.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L31)   |
| <a id="exchangeresultextractor"></a>`ExchangeResultExtractor`       | [resultExtractor.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L42)   |
| <a id="responseresultextractor"></a>`ResponseResultExtractor`       | [resultExtractor.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L55)   |
| <a id="jsonresultextractor"></a>`JsonResultExtractor`               | [resultExtractor.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L67)   |
| <a id="textresultextractor"></a>`TextResultExtractor`               | [resultExtractor.ts:79](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L79)   |
| <a id="blobresultextractor"></a>`BlobResultExtractor`               | [resultExtractor.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L92)   |
| <a id="arraybufferresultextractor"></a>`ArrayBufferResultExtractor` | [resultExtractor.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L106) |
| <a id="bytesresultextractor"></a>`BytesResultExtractor`             | [resultExtractor.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L120) |
| <a id="resultextractors"></a>`ResultExtractors`                     | [resultExtractor.ts:131](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L131) |
| <a id="partialby"></a>`PartialBy`                                   | [types.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L33)                       |
| <a id="requiredby"></a>`RequiredBy`                                 | [types.ts:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L52)                       |
| <a id="removereadonlyfields"></a>`RemoveReadonlyFields`             | [types.ts:85](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L85)                       |

[包索引](./index.md)
