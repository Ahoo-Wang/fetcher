---
title: URLs, Bodies, and Results
description: Build Fetcher URLs and request bodies, then choose the result shape your application needs.
---

# URLs, Bodies, and Results

## Resolve a URL

`baseURL` and the request URL are combined before path and query values are applied.

```ts
const api = new Fetcher({ baseURL: 'https://api.example.com/v1' });

await api.get('/users/{id}', {
  urlParams: {
    path: { id: 'a/b' },
    query: { active: true, page: 2 },
  },
});
```

The default URI-template resolver percent-encodes the path value. `UrlTemplateStyle.Express` supports `/users/:id` instead. Missing required path values throw before the network request.

Query values are passed to `URLSearchParams`. Prefer strings, numbers, and booleans whose string representation is part of your server contract; serialize nested values explicitly.

## Merge headers and timeout

Client defaults are copied and request values override matching keys:

```ts
const api = new Fetcher({
  headers: { Accept: 'application/json', 'X-App': 'console' },
  timeout: 5_000,
});

await api.get('/health', {
  headers: { 'X-App': 'worker' },
  timeout: 1_000,
});
```

The request uses `X-App: worker` and a one-second timeout.

## Send a body

Plain objects are encoded with `JSON.stringify`. Native body types such as `FormData`, `Blob`, `URLSearchParams`, typed arrays, and `ReadableStream` pass through.

```ts
await api.post('/users', {
  body: { name: 'Ada', role: 'admin' },
});
```

GET and HEAD helpers exclude `body` at the TypeScript boundary.

## Choose a result

HTTP helpers return `Response`:

```ts
const response = await api.get('/users/42');
const user = await response.json();
```

Use a result extractor when a shared client should return another shape:

```ts
import { JsonResultExtractor } from '@ahoo-wang/fetcher';

const user = await api.get<{ id: string; name: string }>(
  '/users/42',
  {},
  { resultExtractor: JsonResultExtractor },
);
```

Built-in extractors cover the exchange, response, JSON, text, blob, array buffer, and bytes. A response body can generally be consumed only once; clone it before multiple consumers read it.

## Validate server data

Generic result types describe compile-time expectations. They do not validate JSON. Validate untrusted response data before using it in security, money, or persistence paths.
