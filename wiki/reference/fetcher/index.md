---
prev: false
title: 'Fetcher reference'
description: 'HTTP requests with explicit result extraction, ordered interceptors, and native Fetch cancellation.'
---

# Fetcher reference

HTTP requests with explicit result extraction, ordered interceptors, and native Fetch cancellation.

## Installation and runtime

```sh
pnpm add @ahoo-wang/fetcher
```

Version 5.0.0 declares Node >=18.20.8 for consumers. Repository development has a separate Node >=20.20.2 / pnpm 10.34.5 requirement. Browser/runtime APIs used by a feature must also exist; the engine range is not a promise that every Web API (for example Response.bytes) is available.

## Choose an entry point

Use `get`/`post` for native `Response` results; select `ResultExtractors.Json` for parsed data. Use `request`/`exchange` when the exchange itself is the result, and `NamedFetcher` only when consumers need registry lookup. Follow the [HTTP guide](../../guides/http/shared-client.md) for an application setup.

## Choose a topic

| Topic                                                            | Use it for                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Client and registration](client.md)                             | Create a `Fetcher` for shared URL, headers, timeout, and interceptor policy. Requests still use the runtime's global `fetch`; a client does not own a connection pool or require `destroy()`.                                                                                                                                                                    |
| [Requests, headers, and bodies](requests.md)                     | `FetchRequest` is a `FetchRequestInit` plus required `url: string`. `FetchRequestInit<BODY>` extends native `RequestInit`, replacing headers with `RequestHeaders` and body with `RequestBodyType`; it adds `timeout`, `urlParams`, and `abortController`. Native credentials, cache, mode, redirect, integrity, and other supported Fetch options pass through. |
| [URL construction and templates](urls.md)                        | `UrlBuilder` combines a base URL, path substitutions, and a query record. It does not send a request and does not perform general RFC URI-template expansion.                                                                                                                                                                                                    |
| [Exchanges and result extraction](results.md)                    | A result extractor controls the runtime result, independently of the TypeScript generic on `request<R>` or `get<R>`. Choose it in `RequestOptions.resultExtractor`.                                                                                                                                                                                              |
| [Interceptor pipeline](interceptors.md)                          | Interceptors mutate a shared `FetchExchange`; they return `void \| Promise<void>`, not a replacement exchange. `RequestInterceptor`, `ResponseInterceptor`, and `ErrorInterceptor`are structural specializations of`Interceptor`, whose required fields are `name`, `order`, and `intercept(exchange)`.                                                          |
| [Errors, timeouts, and cancellation](errors-and-cancellation.md) | Fetcher's default pipeline rejects HTTP statuses outside 200–299. Native fetch alone would resolve those responses, so inspect the exchange when handling a failed Fetcher request.                                                                                                                                                                              |

## Minimal complete example

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

type User = { id: string; name: string };
const client = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 3000,
});
export async function loadUser(id: string): Promise<User> {
  return client.get<User>(
    '/users/{id}',
    { urlParams: { path: { id } } },
    { resultExtractor: ResultExtractors.Json },
  );
}
```

[Complete public symbol index](./symbols.md)

The endpoint must return a JSON user. `loadUser` rejects on transport, unaccepted HTTP status, or JSON parsing failure; catch it at the application boundary. The generic does not validate payload fields.
