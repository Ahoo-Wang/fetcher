---
title: Fetcher reference
description: Configure Fetcher, send HTTP requests, extract results, and handle request failures.
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

## Interceptors and errors

`fetcher.interceptors` exposes request, response, and error registries. Handlers
have unique names and run by ascending `order`; `use()` registers a handler and
`eject()` removes it.

Catch these public error types when the distinction affects user behavior:

- `HttpStatusValidationError`: the response failed `validateStatus`.
- `FetchTimeoutError`: the configured timeout expired.
- `ExchangeError`: request processing failed and retains exchange context.
- `FetcherError`: base class for Fetcher-specific failures.

Continue with [Requests and results](../learn/requests-and-results.md) and
[Interceptors, errors, and timeouts](../learn/interceptors-errors-timeouts.md).
