---
title: Construct URLs, headers, and bodies
description: Send explicit path/query parameters and choose a body format appropriate to your server.
---

# Construct URLs, headers, and bodies

## Prerequisites

Run the local server and use the ESM TypeScript setup from [your first request](../../start/first-request.md). Replace its client call with the following complete request; the fixture accepts exactly `/users/1`, without query parameters.

## Address a resource

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const user = await api.get<{ id: number; name: string }>(
  '/users/{id}',
  {
    urlParams: { path: { id: 1 } },
    headers: { Accept: 'application/json' },
  },
  { resultExtractor: ResultExtractors.Json },
);
console.log(user.name);
```

The resulting path is `/users/1` and the output is `Ada`. Path values fill URI-template placeholders. For an application endpoint that supports profile expansion, add `query: { include: 'profile' }` beside `path` in `urlParams`; the result becomes `/users/1?include=profile`. Query values become encoded URL parameters. That variant requires your service: the exact-match tutorial fixture returns 404 for it. Serialize nested application objects explicitly if the server expects JSON within a query parameter.

## Send a body

For an application server implementing `POST /users` and returning a newly created user as JSON, call:

```ts
const created = await api.post<{ id: number; name: string }>(
  '/users',
  { body: { name: 'Lin' } },
  { resultExtractor: ResultExtractors.Json },
);
console.log(created.id);
```

This POST is an integration step: the local tutorial server has no create route. Implement that route or use your real API. Object bodies are JSON serialized by the body interceptor. For `FormData`, `Blob`, or `URLSearchParams`, pass the native value as `body`; the interceptor removes an explicit Content-Type so the native transport can supply the correct format or boundary. Strings and binary bodies are not converted to JSON objects.

## Inspect results and handle failures

In browser developer tools or a server test, inspect the final URL, method, headers and serialized body. Header merging is case-insensitive with request values taking precedence; use a supported header input, not object spread on a `Headers` instance. Catch serialization errors, transport failures, rejected statuses, and JSON parsing failures at the caller. A successful POST is a write: do not retry an uncertain outcome without the server's idempotency contract.

No listener is allocated by these JSON calls. Stop the local fixture after testing; cancel abandoned in-flight work as described in [cancellation](./cancellation.md).

See [request inputs](../../reference/fetcher/requests.md), [URL rules](../../reference/fetcher/urls.md), and [request lifecycle](../../architecture/request-lifecycle.md).
