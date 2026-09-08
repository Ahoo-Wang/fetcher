---
title: 'Requests, headers, and bodies'
description: 'Requests, headers, and bodies — @ahoo-wang/fetcher 5.0.0'
---

# Requests, headers, and bodies

`FetchRequest` is a `FetchRequestInit` plus required `url: string`. `FetchRequestInit<BODY>` extends native `RequestInit`, replacing headers with `RequestHeaders` and body with `RequestBodyType`; it adds `timeout`, `urlParams`, and `abortController`. Native credentials, cache, mode, redirect, integrity, and other supported Fetch options pass through.

## Request fields {#fields}

| Field/type                                 | Contract                                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `RequestHeaders` / `RequestHeadersCapable` | Plain string-keyed record of `string                                                                                          | undefined`; not a native `Headers` instance. |
| `RequestBodyType`                          | `BodyInit                                                                                                                     | Record<string, any>                          | string | null`; a missing body remains missing. |
| `BaseURLCapable`                           | Required `baseURL: string`; `UrlParamsCapable` supplies optional `urlParams`.                                                 |
| `HttpMethod`                               | String enum GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, TRACE; platform restrictions still apply.                           |
| `CONTENT_TYPE_HEADER`                      | `'Content-Type'`; `ContentTypeValues.APPLICATION_JSON` is `'application/json'`, `TEXT_EVENT_STREAM` is `'text/event-stream'`. |

## Merge rules {#merge}

`mergeRequest(first, second): FetchRequestInit` merges path and query records one level deep, and merges headers case-insensitively. The second request wins. For `method`, `body`, `timeout`, `signal`, and `abortController`, a nullish second value falls back to the first; `body: null` therefore does not clear an existing body in this helper. Other native fields follow object spread semantics. Empty-input shortcuts may return an original object when there are no headers; this is not a deep clone.

`mergeRequestOptions(first?, second?)` chooses the second non-nullish `resultExtractor` and `attributes`, then the first; its extractor fallback is Exchange. Attributes are replaced as a whole, not merged. `mergeRecords(first?, second?)` does a shallow second-wins merge and can return an existing record when only one exists. `mergeRecordToMap(record?, map?)` writes a record or map into the supplied map (or a new map) and returns that same map.

## Header helpers {#headers}

| Function                          | Result and mutation                                                              |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `getHeader(headers, name)`        | Last case-insensitive matching value, or `undefined`; no mutation.               |
| `deleteHeader(headers, name)`     | Removes all case variants; returns `void`.                                       |
| `setHeader(headers, name, value)` | Removes all variants, then sets the supplied spelling; `undefined` means delete. |
| `mergeHeaders(...records)`        | New record, later values win; later `undefined` removes an inherited header.     |

## Body conversion {#body}

`RequestBodyInterceptor` runs before normal order-zero request interceptors. Strings and nullish bodies pass through. Blob, File, FormData, and URLSearchParams pass through after removing **all** Content-Type spellings so Fetch chooses the type/boundary. ArrayBuffer, typed-array/DataView views, and ReadableStream pass through without header adjustment. Other objects (including arrays) use `JSON.stringify`; JSON Content-Type is added only if absent. An explicit non-JSON Content-Type does not prevent JSON serialization. Circular data or BigInt may fail serialization and enter the error pipeline.

Streaming upload support and additional runtime-specific request fields remain the caller's responsibility. See [pipeline ordering](./interceptors.md) before inserting a body transformer.

## Complete example {#example}

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

## Public symbols and source {#symbols}

| Symbol                                                    | Implementation                                                                                                    |
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

[Package index](./index.md)
