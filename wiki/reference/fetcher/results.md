---
title: 'Exchanges and result extraction'
description: 'Exchanges and result extraction — @ahoo-wang/fetcher 5.0.0'
---

# Exchanges and result extraction

A result extractor controls the runtime result, independently of the TypeScript generic on `request<R>` or `get<R>`. Choose it in `RequestOptions.resultExtractor`.

## Extractor selection {#extractors}

`ResultExtractor<R>` is `(exchange: FetchExchange) => R | Promise<R>`; `ResultExtractorCapable` declares its optional field. `ResultExtractors` is a lookup object for these exact exports:

| Property / exported function                 | Resolved value              | Body use                                     |
| -------------------------------------------- | --------------------------- | -------------------------------------------- |
| `Exchange` / `ExchangeResultExtractor`       | The same `FetchExchange`    | None                                         |
| `Response` / `ResponseResultExtractor`       | `exchange.requiredResponse` | None                                         |
| `Json` / `JsonResultExtractor`               | Parsed JSON (`any`)         | `Response.json()`                            |
| `Text` / `TextResultExtractor`               | `string`                    | `Response.text()`                            |
| `Blob` / `BlobResultExtractor`               | `Blob`                      | `Response.blob()`                            |
| `ArrayBuffer` / `ArrayBufferResultExtractor` | `ArrayBuffer`               | `Response.arrayBuffer()`                     |
| `Bytes` / `BytesResultExtractor`             | `Uint8Array<ArrayBuffer>`   | `Response.bytes()`; runtime must support it. |

JSON types are compile-time promises, not runtime validation. The package augments `Response.json<T = any>(): Promise<T>` for typing only. An empty 204 response still fails JSON parsing; choose Response or a custom extractor for an empty body.

## FetchExchange {#exchange}

`new FetchExchange(init: FetchExchangeInit)` requires `fetcher` and `request`; it accepts optional `resultExtractor`, `response`, `error`, and `attributes`. `AttributesCapable.attributes` accepts a record or Map; the constructor copies entries into a new Map. The extractor defaults to Exchange. The request and response are references, not clones.

| Member                           | Contract                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `ensureRequestHeaders()`         | Returns existing headers or assigns/returns `{}`.                            |
| `ensureRequestUrlParams()`       | Ensures both `.path` and `.query` records and returns `Required<UrlParams>`. |
| `hasError()`, `hasResponse()`    | Boolean truthiness checks.                                                   |
| `requiredResponse`               | Returns response; throws `ExchangeError` if absent.                          |
| `extractResult<R>(): Promise<R>` | Computes once and caches the value or promise; concurrent calls reuse it.    |
| `response = value`               | Replaces response and invalidates the cached result.                         |

An asynchronous extraction rejection remains cached. A synchronous throw before a value/promise is returned leaves the cache unpopulated, so another call can retry. Changing only `resultExtractor` does not reset an already-populated cache. Body-reading operations consume the response once; the cache avoids repeated parsing through `extractResult`, not direct repeated `response.json()` calls.

Extraction occurs after the interceptor manager finishes; an extractor's parse error is not sent back through error interceptors. Catch the rejected request/iteration at the caller. Streams returned by custom extractors remain caller-owned; cancel or finish them.

## Public utility types {#utility-types}

`PartialBy<T, K>` makes selected keys optional; `RequiredBy<T, K>` makes selected keys required; `RemoveReadonlyFields<T>` removes readonly keys while preserving writable ones. These have no runtime behavior or data validation.

## Complete example {#example}

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

## Public symbols and source {#symbols}

| Symbol                                                              | Implementation                                                                                                        |
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

[Package index](./index.md)
