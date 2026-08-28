---
title: Fetcher reference
description: Configure Fetcher, send typed HTTP requests, and diagnose lifecycle failures.
pageClass: reference-page
---

# `@ahoo-wang/fetcher`

`Fetcher` is the core HTTP client: it adds request resolution, interceptors,
timeouts, status validation, and result extraction around platform `fetch`. Use
it for application HTTP clients; it is not a server router or a retry policy.

## Install and choose an entry point

```bash
pnpm add @ahoo-wang/fetcher
```

| Goal | Entry point | Default result |
| --- | --- | --- |
| Send a URL and request init | `fetch(url, init?, options?)` | `Response` |
| Use a known verb | `get`, `post`, `put`, `patch`, `delete`, `head`, `options`, `trace` | `Response` |
| Start from a complete request | `request(request, options?)` | `FetchExchange` |
| Inspect the completed pipeline | `exchange(request, options?)` | `FetchExchange` |
| Share a named client | `NamedFetcher` / `fetcherRegistrar` | `Fetcher` |

### HTTP method matrix

| Methods | Request body | Default result | Explicit result |
| --- | --- | --- | --- |
| `get`, `head`, `options`, `trace` | Not accepted: their request type omits `body`. | `Response` | Pass `options.resultExtractor` to return its `R`. |
| `post`, `put`, `patch`, `delete` | Accepted: their request type omits only `method`. | `Response` | Pass `options.resultExtractor` to return its `R`. |

Every shortcut supplies its own HTTP method and returns `Promise<R>`. The
default `R` is `Response`; a generic argument alone does not parse the body, so
pair it with an explicit extractor such as `ResultExtractors.Json`.

## Client configuration

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

export const api = new Fetcher({
  baseURL: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' },
  timeout: 10_000,
});
```

| `FetcherOptions` member | Default | Contract |
| --- | --- | --- |
| `baseURL` | `''` | Prefixes relative URLs; absolute URLs are preserved by `combineURLs`. |
| `headers` | `{ 'Content-Type': 'application/json' }` | Shallow-merged with request headers; request values win. |
| `timeout` | `undefined` | Milliseconds. Request timeout, including `0`, wins. |
| `urlTemplateStyle` | `UrlTemplateStyle.UriTemplate` | Resolves `{id}`; use `Express` only for `:id` routes. |
| `validateStatus` | `status >= 200 && status < 300` | Used only while Fetcher creates its default `InterceptorManager`. |
| `interceptors` | new `InterceptorManager` | Replaces the whole default manager, so `validateStatus` is then ignored. |

## Typed request and `FetchRequestInit`

All verb methods are `Promise<R>` and accept `(url, request?, options?)`.
`get`, `head`, `options`, and `trace` exclude `body`; the other verb methods
exclude only `method`. Supply `resultExtractor` when `R` is not `Response`.

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

interface User {
  id: string;
  name: string;
}

const api = new Fetcher({ baseURL: 'https://api.example.com' });
const user: User = await api.get<User>(
  '/teams/{teamId}/users/{userId}',
  {
    urlParams: {
      path: { teamId: 'platform', userId: 'u-42' },
      query: { expand: 'team' },
    },
  },
  { resultExtractor: ResultExtractors.Json },
);
```

`FetchRequestInit` is platform `RequestInit`, except for its typed `headers`
and `body`, plus `urlParams`, `timeout`, and `abortController`. Plain object
bodies are JSON-serialized by the standard request interceptor; `FormData`,
`Blob`, streams, and other supported `BodyInit` values are not serialized.

### Resolution and URL rules

1. `resolveExchange()` shallow-merges client headers then request headers.
2. Request `timeout` takes precedence over the client timeout.
3. `UrlBuilder` combines the base URL, resolves path placeholders, then appends
   `new URLSearchParams(query)`.
4. The pipeline consumes `urlParams`; re-running URL resolution does not append
   a second query string.
5. A result extractor runs through `FetchExchange.extractResult()` and caches
   its promise, so do not select two body-reading extractors for one exchange.

`URLSearchParams` defines query coercion. Give repeated query keys explicitly
as the shape supported by that platform API; do not expect an array to mean
multiple keys.

## Result, interceptor, and error contracts

| Extractor | Result |
| --- | --- |
| `ResultExtractors.Exchange` | `FetchExchange` |
| `ResultExtractors.Response` | native `Response` |
| `ResultExtractors.Json` / `Text` | parsed JSON / text body |
| `Blob` / `ArrayBuffer` / `Bytes` | matching binary body value |

The default pipeline runs request interceptors in ascending `order`, then
response interceptors in ascending `order`; a failure runs error interceptors.
Its built-ins are `RequestBodyInterceptor`, `UrlResolveInterceptor`,
`FetchInterceptor`, then `ValidateStatusInterceptor`. An error interceptor may
recover by clearing `exchange.error`; response interceptors are not rerun.

| Failure | What to inspect |
| --- | --- |
| Non-2xx rejects | Top-level `ExchangeError`; inspect `error.exchange.error` or `error.cause` for `HttpStatusValidationError`. Use `validateStatus` or `IGNORE_VALIDATE_STATUS` only for an expected status. |
| Timeout rejects | Top-level `ExchangeError`; inspect `error.exchange.error` or `error.cause` for `FetchTimeoutError` and its `request.timeout`. |
| Network/interceptor failure | Top-level `ExchangeError.exchange.error` and `ExchangeError.cause` retain the original error. |
| JSON parse failure | The selected extractor reads the response body; inspect `Content-Type` and server payload. |
| URL still contains `{id}` | Check `urlParams.path` and the configured template style. |

The public hierarchy is `FetcherError` → `ExchangeError` →
`HttpStatusValidationError`; `FetchTimeoutError` extends `FetcherError`
directly. `InterceptorManager.exchange()` wraps an unhandled pipeline error in
the top-level `ExchangeError`, so catch that first and narrow
`error.exchange.error` or `error.cause` for the original status or timeout
type.

## Timeout and caller cancellation

Pass a controller when the caller owns cancellation. If a request already has a
platform `signal`, Fetcher delegates to platform `fetch` and does not install
its own timeout race; otherwise timeout uses the supplied controller when it is
still usable.

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

const api = new Fetcher({ baseURL: 'https://api.example.test' });
const controller = new AbortController();
const pending = api.get('/jobs/{id}', {
  urlParams: { path: { id: 'job-1' } },
  abortController: controller,
});
controller.abort();
await pending;
```

## Source reference

- [packages/fetcher/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/index.ts#L14)
- [packages/fetcher/src/fetcher.ts:86](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L86)
- [packages/fetcher/src/fetchRequest.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetchRequest.ts#L112)
- [packages/fetcher/src/fetcherError.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L37)
- [packages/fetcher/src/interceptorManager.ts:191](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptorManager.ts#L191)
- [packages/fetcher/src/timeout.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L120)
