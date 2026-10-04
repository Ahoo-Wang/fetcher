---
name: fetcher
description: >
  Write or debug code that uses Fetcher 6 (`@ahoo-wang/fetcher*`): the HTTP client and interceptors, request errors, decorator service classes, SSE/LLM streams and OpenAI chat completions, event buses, persisted `KeyStorage`, CoSec JWT auth and refresh, and OpenAPI document types. Use whenever a project imports these packages outside React components. Not for axios, ky or plain fetch.
---

# Fetcher

Fetcher wraps the native Fetch API with interceptors, typed results and a named
client registry. It resembles Axios but differs where it matters: most bugs
come from assuming Axios or `fetch` behavior. Read the reference for the
package you touch before writing code; each one lists what that package does
differently.

| Task                                                       | Package                                                       | Read                      |
| ---------------------------------------------------------- | ------------------------------------------------------------- | ------------------------- |
| HTTP client, interceptors, errors, URLs, timeouts          | `@ahoo-wang/fetcher`                                          | `references/client.md`    |
| Endpoints declared as a class (`@api`, `@get`, `@path`, …) | `@ahoo-wang/fetcher-decorator`                                | `references/decorator.md` |
| SSE, LLM token streams, OpenAI-compatible chat             | `@ahoo-wang/fetcher-eventstream`, `@ahoo-wang/fetcher-openai` | `references/streaming.md` |
| Login tokens, bearer header, refresh, 401/403, tenant path | `@ahoo-wang/fetcher-cosec`                                    | `references/auth.md`      |
| Events between modules or tabs; persisted values           | `@ahoo-wang/fetcher-eventbus`, `@ahoo-wang/fetcher-storage`   | `references/state.md`     |
| Typing or walking an OpenAPI 3.0/3.1 document              | `@ahoo-wang/fetcher-openapi`                                  | `references/openapi.md`   |

React components use $fetcher-react. Upgrading from 5.x uses $fetcher-v6-migration.
Generating a client from OpenAPI, and Wow CQRS clients, belong to Wow's
`wow-generator` and `wow-client`, not to these packages.

## Rules that apply everywhere

1. **`fetcher.get()` resolves to a `Response`**, not data. Pass
   `{ resultExtractor: ResultExtractors.Json }` as the **third** argument for
   parsed JSON. Decorated methods are the opposite: JSON by default, so a 204
   needs `ResultExtractors.Response`.
2. **Path and query go in `urlParams`**: `{ urlParams: { path: { id }, query: { page } } }`
   with a `/users/{id}` template. There is no `params` option.
3. **Interceptors mutate the exchange and return nothing**:
   `{ name, order, intercept(exchange) { … } }`. Write headers with
   `setHeader(exchange.ensureRequestHeaders(), name, value)`. `use()` returns
   `false` and ignores a name already registered.
4. **Non-2xx rejects with `HttpStatusValidationError` itself.** It extends
   `ExchangeError`, so test it first. Timeouts, network errors and aborts reject
   with an `ExchangeError` whose `cause` is the original (`FetchTimeoutError` for
   a timeout). To read a status as data, pass
   `{ attributes: { [IGNORE_VALIDATE_STATUS]: true } }` in the third argument.
5. **Name your client and refer to it by name.** `new NamedFetcher('api', …)`
   registers it; decorators and hooks resolve it by name and otherwise fall back
   to the built-in `'default'` fetcher, whose `baseURL` is empty.
6. **No default `Content-Type`.** Object and string bodies get
   `application/json`; do not put a `Content-Type` in the client's `headers`.
7. **`timeout` stops at response headers.** Bound body reads and streams with a
   `signal`.
8. **`@ahoo-wang/fetcher-eventstream` patches `Response.prototype` on import**,
   and every JSON stream ending in `data: [DONE]` needs a terminate detector.
9. **CoSec sends no bearer token without a `tokenRefresher`**, and sends it to
   every origin unless `isTrusted: sameOriginTrust` is set.

## Minimal client

```ts
import { NamedFetcher, ResultExtractors, setHeader } from '@ahoo-wang/fetcher';

export const api = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

api.interceptors.request.use({
  name: 'AuthInterceptor',
  order: 100,
  intercept(exchange) {
    const token = localStorage.getItem('token');
    if (token)
      setHeader(
        exchange.ensureRequestHeaders(),
        'Authorization',
        `Bearer ${token}`,
      );
  },
});

const user = await api.get<User>(
  '/users/{id}',
  { urlParams: { path: { id: 123 }, query: { include: 'profile' } } },
  { resultExtractor: ResultExtractors.Json },
);
```

## Verify

Type-check, and exercise the failure paths you touched: a non-2xx, a timeout or
abort, and for streams an early end. The installed `.d.ts` files under
`node_modules/@ahoo-wang/*/dist` are the authority for exact signatures.
