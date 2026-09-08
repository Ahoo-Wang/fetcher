---
title: Choose and validate a result
description: Select Response, exchange, or parsed JSON and verify what the caller actually receives.
---

# Choose and validate a result

## Prerequisites

Use the [HTTP example](../../examples/http.md), whose `/users/1` response is JSON with numeric `id` and string `name`. Keep that server running for the calls below.

## Select the return value

| Call                                  | Default         | Choose it when                                    |
| ------------------------------------- | --------------- | ------------------------------------------------- |
| `get`, `post`, and other HTTP helpers | `Response`      | You need headers, status, or a native body reader |
| `request`                             | `FetchExchange` | You need the request/response/error context       |
| Explicit `ResultExtractors.Json`      | Parsed JSON     | Your service function should return data          |

The [complete client source](../../examples/http.md) explicitly selects JSON and checks `id === 1` and `name === 'Ada'`. Run it first. To retain response metadata instead, replace the client body with:

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const response = await api.get('/users/1');
console.log(response.status);
const value: unknown = await response.json();
if (
  typeof value !== 'object' ||
  value === null ||
  !('name' in value) ||
  typeof value.name !== 'string'
)
  throw new Error('Expected a user name');
console.log(value.name);
```

The result is status `200` followed by `Ada`. This small boundary check validates the field the caller uses; a production schema may need more checks. Adding a TypeScript generic alone does not validate the wire data.

## Match extraction to content

Choose Text for plain text, Blob or ArrayBuffer for binary data, and a stream extractor for SSE. A 204 response has no JSON document: use Response when the endpoint intentionally returns no body. Read a body only once; if separate readers are required, clone the response before consumption.

The extraction cache belongs to one exchange only. It is not a response cache across requests, and a cached rejected extraction promise will not recover by reading the same body again.

## Failures and cleanup

JSON decoding occurs after the request/response interceptor pipeline. Invalid JSON can therefore reject directly even after HTTP 200; handle it at the await boundary, not only in an error interceptor. A custom extractor can also throw. Fully consuming JSON/text finishes that body; if you instead keep a streaming reader, cancel and release it when its owner ends. Stop the fixture after the check.

Continue with [failure handling](./failures.md), [result reference](../../reference/fetcher/results.md), and [failure model](../../architecture/failure-model.md).
