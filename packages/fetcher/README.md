# `@ahoo-wang/fetcher`

The core Fetcher HTTP client: URL templates, headers, JSON bodies,
interceptors, timeouts, status validation, and result extraction on top of the
platform `fetch` API.

Use it alone for ordinary HTTP APIs. Add an integration package only when you
need decorators, streaming, React, authentication, Wow, or Viewer behavior.

## Install

```bash
pnpm add @ahoo-wang/fetcher
```

No peer or runtime dependencies.

## Example

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

interface User {
  id: string;
  name: string;
}

const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
});

const user = await api.get<User>(
  '/users/{id}',
  { urlParams: { path: { id: 'u-42' } } },
  { resultExtractor: ResultExtractors.Json },
);
```

## Core capabilities

- Native `Response` by default; JSON, text, blob, bytes, or custom extraction.
- URI-template and Express-style path parameters plus query parameters.
- Ordered request, response, and error interceptors.
- Client and request-level timeouts with abort support.
- Custom status validation and typed Fetcher errors.
- Named Fetcher registration for multiple backends.

## Documentation

- [First request](https://fetcher.ahoo.me/start/first-request)
- [Request lifecycle](https://fetcher.ahoo.me/learn/request-lifecycle)
- [Fetcher reference](https://fetcher.ahoo.me/reference/fetcher)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
