---
title: Build a request and choose its result
description: Build a request and choose its result — Fetcher
---

# Build a request and choose its result

A request has three decisions: the address, the data sent to it, and the value returned to your caller. Keep them explicit so a service function has a predictable contract.

## Address a resource

```ts
import { Fetcher, JsonResultExtractor } from '@ahoo-wang/fetcher';

const api = new Fetcher({ baseURL: 'https://api.example.com', timeout: 5_000 });
interface User {
  id: string;
  name: string;
}
const user = await api.get<User>(
  '/users/{id}',
  {
    urlParams: { path: { id: '42' }, query: { include: 'profile' } },
  },
  { resultExtractor: JsonResultExtractor },
);
console.log(user.name);
```

`urlParams.path` fills the URI template; `urlParams.query` is encoded as URL query parameters. The example addresses `/users/42?include=profile`. Encode nested application values explicitly rather than relying on an object’s string representation. See [URL rules](../reference/fetcher/urls.md).

## Send data

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'https://api.example.com' });
await api.post('/users', { body: { name: 'Ada' } });
```

The body interceptor serializes plain objects. FormData, Blob and other native bodies follow their own transport rules. Headers merge with request values taking precedence; use the supported Headers forms rather than spreading a Headers instance into a plain object. See [Requests](../reference/fetcher/requests.md).

## Choose the return contract

| Entry                             | Default result  | When to use                                            |
| --------------------------------- | --------------- | ------------------------------------------------------ |
| `get`, `post`, other HTTP helpers | `Response`      | You need status, headers or a native body reader       |
| `request`                         | `FetchExchange` | You need the complete pipeline context                 |
| An explicit result extractor      | Extracted value | Your caller needs JSON, text or another selected shape |

Consume a response body once, or clone it before separate readers. A JSON generic supplies static expectations, not validation. A parsing failure occurs after transport and can throw even when the HTTP response was successful.

Next: [Errors and timeouts](./interceptors-errors-timeouts.md), then [the lifecycle](./request-lifecycle.md).
