---
name: fetcher-integration
description: >
  Call HTTP APIs with the core `@ahoo-wang/fetcher` client: `Fetcher`/`NamedFetcher`, baseURL, timeouts, `{id}` path and query params, request/response/error interceptors, status validation and error classes, result extractors, cancellation, the named registry. Use for direct `fetcher.get/post` calls, Axios-like setup, interceptors (including ones serving decorated services) or request-pipeline bugs. Declaring endpoints as an `@api`/`@get` class: fetcher-decorator-service; React state: fetcher-react-hooks.
---

# fetcher-integration

## Decisions

- **`NamedFetcher` vs `Fetcher`**: use `NamedFetcher('name', options)` whenever decorators, CoSec or hooks will look the client up by name; it registers itself in `fetcherRegistrar` (a reused name silently replaces the earlier one). `fetcherRegistrar.default` throws if nothing is named `'default'`.
- **What a call returns**: `get/post/put/patch/delete/fetch` default to `ResultExtractors.Response`; `request()` defaults to `ResultExtractors.Exchange`. Pass `{ resultExtractor: ResultExtractors.Json }` as the **third** argument for typed data.
- **Where cross-cutting logic goes**: an interceptor, not a wrapper function — auth, tracing, retries and error recovery all belong in `fetcher.interceptors.request/response/error`. This holds for decorated service classes too: they run through the same fetcher's interceptors.
- **Direct calls vs a service class**: call the fetcher directly when URLs or bodies are built at runtime or there are a few one-off calls; stable endpoints declared as a class are `$fetcher-decorator-service`.

## Gotchas a capable model gets wrong

- `intercept(exchange)` **mutates** the exchange and returns nothing; `use()` returns `false` and ignores an interceptor whose `name` is already registered.
- `FetchRequest.headers` is optional: write headers with `setHeader(exchange.ensureRequestHeaders(), 'Authorization', value)`, not `exchange.request.headers.X = …`.
- `name` and `order` are both required on an interceptor object. Built-in order: `REQUEST_BODY_INTERCEPTOR_ORDER` (body → JSON) runs near `Number.MIN_SAFE_INTEGER`, so an object body assigned by a user interceptor with an ordinary order (0, 100) is **not** serialized. `URL_RESOLVE_INTERCEPTOR_ORDER` and `FETCH_INTERCEPTOR_ORDER` come last; response-side `VALIDATE_STATUS_INTERCEPTOR_ORDER` runs near `Number.MAX_SAFE_INTEGER`.
- Non-2xx responses reject with the `HttpStatusValidationError` itself (a subclass of `ExchangeError`, not its `cause`: check `error instanceof HttpStatusValidationError` before `ExchangeError`); timeouts with `ExchangeError` whose `cause` is `FetchTimeoutError`. Inside an error interceptor `exchange.error` is the raw failure (`HttpStatusValidationError`, `FetchTimeoutError`, fetch's `TypeError`), not yet wrapped. An error interceptor that clears `exchange.error` recovers, but the response phase is not re-run; one that throws stops the error phase and the exchange rejects with an `ExchangeError` whose `cause` is the thrown value. Skip validation per call with `{ attributes: new Map([[IGNORE_VALIDATE_STATUS, true]]) }` in the third argument, or per client with `validateStatus`.
- `timeout` defaults to none (`0` also means none). It applies together with a caller `signal`/`abortController` (whichever fires first aborts) and covers only up to the response headers — bound body reads (`response.json()`, streams) with your own signal.
- `fetch` option (`FetchImplementation`): the `fetch` that sends requests (global `fetch`, read at call time, by default), for runtimes or frameworks that supply their own (Tauri, instrumentation) or tests; timeouts and signals still apply. Like `validateStatus`, it is ignored when you pass your own `interceptors` manager. An interceptor that re-sends with `timeoutFetch(exchange.request)` must pass it as the second argument, or it uses the global `fetch`.
- No default `Content-Type`: the body sets it — a plain object is serialized and sent as `application/json`, a string as `application/json` unless one is set, `FormData`/`Blob`/`URLSearchParams` always lose it so fetch sets its own, binary bodies get none. Bodyless requests carry none (no CORS preflight from it).
- `urlParams.path` fills `{id}` / `:id` templates; a placeholder without a value (`undefined`, `null`, or no `path` at all) throws. `urlParams.query` omits `undefined`/`null`, repeats arrays (`ids=1&ids=2`) and sends a `Date` as ISO 8601.

## Minimal example

```ts
import { NamedFetcher, ResultExtractors, setHeader } from '@ahoo-wang/fetcher';

export const api = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
});
api.interceptors.request.use({
  name: 'auth',
  order: 100,
  intercept(exchange) {
    setHeader(
      exchange.ensureRequestHeaders(),
      'Authorization',
      `Bearer ${token()}`,
    );
  },
});
const user = await api.get<User>(
  '/users/{id}',
  { urlParams: { path: { id: 1 }, query: { include: 'profile' } } },
  { resultExtractor: ResultExtractors.Json },
);
```

## References

- `references/api.md`: constructor options, every method signature, interceptor order constants, URL params, error classes and full examples. Load it for exact signatures or lifecycle details.

## Related Skills

- $fetcher-decorator-service: stable endpoints declared as a class on top of a named fetcher.
- $fetcher-cosec-auth: JWT, refresh and 401/403 handling as interceptors.
- $fetcher-llm-streaming: SSE and token streams from a Fetcher response.
- $fetcher-react-hooks: request state in React components.
