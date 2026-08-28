---
title: Fetcher reference
description: Configure Fetcher, send HTTP requests, extract results, and handle request failures.
pageClass: reference-page
---

# `@ahoo-wang/fetcher`

The core package wraps the platform `fetch` API with URL templates,
interceptors, timeouts, status validation, and typed result extraction.

## Install

```bash
pnpm add @ahoo-wang/fetcher
```

## Create a client

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

export const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});
```

### `FetcherOptions`

| Option             | Default               | Purpose                                       |
| ------------------ | --------------------- | --------------------------------------------- |
| `baseURL`          | `''`                  | Prefix for relative request URLs              |
| `headers`          | JSON content type     | Headers merged into every request             |
| `timeout`          | no timeout            | Default timeout in milliseconds               |
| `urlTemplateStyle` | `UriTemplate`         | URI-template or Express-style path parameters |
| `interceptors`     | new default manager   | Replace the complete interceptor pipeline     |
| `validateStatus`   | `200 <= status < 300` | Decide which responses are successful         |

`validateStatus` only configures the default interceptor manager. It has no
effect when you supply a custom `interceptors` instance.

## Send requests

```ts
import { ResultExtractors } from '@ahoo-wang/fetcher';
import { api } from './api';

interface User {
  id: string;
  name: string;
}

const user = await api.get<User>(
  '/users/{id}',
  {
    urlParams: {
      path: { id: 'u-42' },
      query: { expand: 'team' },
    },
  },
  { resultExtractor: ResultExtractors.Json },
);
```

`fetch`, `get`, `post`, `put`, `patch`, `delete`, `head`, `options`, and
`trace` return a `Response` by default. Use `request()` when you already have a
complete `FetchRequest`; it returns a `FetchExchange` by default.

Request headers and timeouts override client defaults. Plain object bodies are
JSON-serialized by the default request-body interceptor.

## Extract results

| Extractor                      | Result                   |
| ------------------------------ | ------------------------ |
| `ResultExtractors.Response`    | Native `Response`        |
| `ResultExtractors.Json`        | Parsed JSON              |
| `ResultExtractors.Text`        | Text body                |
| `ResultExtractors.Blob`        | `Blob`                   |
| `ResultExtractors.ArrayBuffer` | `ArrayBuffer`            |
| `ResultExtractors.Bytes`       | `Uint8Array`             |
| `ResultExtractors.Exchange`    | Complete `FetchExchange` |

A custom `ResultExtractor` receives the completed exchange and may return a
value or a promise.

## API map

| API                                         | Default result    | Use when                                                    |
| ------------------------------------------- | ----------------- | ----------------------------------------------------------- |
| `fetch(url, init?, options?)`               | `Response`        | You have a URL and optional request initialization          |
| `get` / `post` / `put` / `patch` / `delete` | `Response`        | The HTTP method is known at the call site                   |
| `exchange(request, options?)`               | `FetchExchange`   | Infrastructure needs the completed lifecycle container      |
| `request<R>(request, options?)`             | extracted `R`     | You already have a complete `FetchRequest`                  |
| `resolveExchange(request, options?)`        | `FetchExchange`   | An adapter needs to inspect the resolved request before I/O |
| `NamedFetcher(name, options?)`              | registered client | Services resolve a shared client by name                    |

`fetcher` is the default `NamedFetcher` registered as `default`.
`fetcherRegistrar.get(name)` resolves other registered clients. Prefer an
explicit exported client in application code; use the registry at integration
boundaries designed around named clients.

## Request contract

`FetchRequestInit` extends the platform `RequestInit` with `urlParams`,
`timeout`, typed headers, a plain-object body, and `abortController`.

### Resolution order

1. Request headers override client headers with a shallow merge.
2. Request timeout overrides the client timeout.
3. Path and query parameters are resolved into the final URL.
4. Plain-object bodies are serialized as JSON by the request-body interceptor.
5. Request, response, and error interceptors mutate the same `FetchExchange`.
6. The selected result extractor runs once and its result is cached.

`attributes` becomes a `Map<string, unknown>` on `FetchExchange`. Use
namespaced keys when interceptors share data, and never put request-global
mutable state on the `Fetcher` instance.

### URL parameters

```ts
await api.get('/teams/{teamId}/users/{userId}', {
  urlParams: {
    path: { teamId: 'platform', userId: 'u-42' },
    query: { include: ['roles', 'permissions'], active: true },
  },
});
```

The default style uses URI-template placeholders such as `{userId}`. Select
the Express style only when existing routes use `:userId`; do not mix styles
inside one client.

## Cancellation and timeout

Pass `abortController` when the caller owns cancellation. A configured timeout
uses the same cancellation path and throws `FetchTimeoutError`. A request-level
timeout wins over the client default. Omitting both means no Fetcher timeout.

## Interceptors and errors

`fetcher.interceptors` exposes request, response, and error registries. Handlers
have unique names and run by ascending `order`; `use()` registers a handler and
`eject()` removes it.

Catch these public error types when the distinction affects user behavior:

- `HttpStatusValidationError`: the response failed `validateStatus`.
- `FetchTimeoutError`: the configured timeout expired.
- `ExchangeError`: request processing failed and retains exchange context.
- `FetcherError`: base class for Fetcher-specific failures.

When an interceptor handles a failure, it must leave the exchange in a state
that later interceptors and the extractor can understand. Use
`IGNORE_VALIDATE_STATUS` only when a non-2xx response is an intentional result,
not to silence an unknown server failure.

## Source and agent reference

- Public exports: [`packages/fetcher/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/index.ts)
- Detailed agent API: [`skills/fetcher-integration/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-integration/references/api.md)
- Skill: [`$fetcher-integration`](../skills/http-and-services.md#fetcher-integration)

Continue with [Requests and results](../learn/requests-and-results.md) and
[Interceptors, errors, and timeouts](../learn/interceptors-errors-timeouts.md).
