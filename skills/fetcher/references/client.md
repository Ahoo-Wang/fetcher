# Core client — `@ahoo-wang/fetcher`

## Calls and what they return

`fetcher.get/post/put/patch/delete/head/options/trace/fetch(url, request?, options?)`
resolve to a **`Response`**; `fetcher.request(request, options?)` resolves to a
`FetchExchange`. Typed data needs the third argument:
`{ resultExtractor: ResultExtractors.Json }`. Per-call `resultExtractor` and
`attributes` go in that third argument (`RequestOptions`), never in the request.

The request (second argument) is a `RequestInit` plus `urlParams: { path, query }`,
`timeout`, `abortController`. `body` may be a plain object; it is serialized.
There is no Axios-style `params` or `data`.

## Interceptors

An interceptor is `{ name, order, intercept(exchange) }`. `intercept` **mutates**
the exchange (`exchange.request`, `exchange.response`, `exchange.error`) and
returns nothing; a returned value is ignored. `use()` returns `false` and does
nothing when the name is already registered in that phase.

Phases: `request` → `response` → `error` (on any throw). Built-in order, low first:

| Constant                            | Value                      | Effect on yours                                                                                                      |
| ----------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `REQUEST_BODY_INTERCEPTOR_ORDER`    | `MIN_SAFE_INTEGER + 10000` | Serializes the body. An object body your interceptor (order ≥ it) assigns is sent raw: `JSON.stringify` it yourself. |
| `URL_RESOLVE_INTERCEPTOR_ORDER`     | `MAX_SAFE_INTEGER - 20000` | Before it, `request.url` is the relative template and `urlParams` are editable.                                      |
| `FETCH_INTERCEPTOR_ORDER`           | `MAX_SAFE_INTEGER - 10000` | Sends the request. The absolute URL is visible only between the two.                                                 |
| `VALIDATE_STATUS_INTERCEPTOR_ORDER` | `MAX_SAFE_INTEGER - 10000` | Response phase: rejects non-2xx.                                                                                     |

- Write headers with `setHeader(exchange.ensureRequestHeaders(), name, value)`;
  `request.headers` is optional and header names merge case-insensitively.
- An error interceptor recovers by clearing `exchange.error` (and setting
  `exchange.response`). The response phase is **not** re-run, so a replayed
  response is not status-validated. An error interceptor that throws stops the
  later ones and becomes the `cause` of the rejection.
- A response interceptor that reads `exchange.response.json()` consumes the
  body for everyone after it; read a `clone()`.
- `validateStatus` and `fetch` client options configure the default
  interceptors; they are ignored when you pass your own `interceptors` manager
  (build it with `new InterceptorManager(validateStatus, fetch)`).

## Errors

| Failure                                                          | Rejects with                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Non-2xx                                                          | `HttpStatusValidationError` itself (`error.exchange.response?.status`)        |
| Timeout                                                          | `ExchangeError`, `cause` is `FetchTimeoutError`                               |
| Network, caller abort, interceptor throw, missing path parameter | `ExchangeError`, `cause` is the original                                      |
| Result extraction (`Json` on 204/empty/HTML)                     | the raw error (`SyntaxError`), not an `ExchangeError`, unseen by interceptors |

`HttpStatusValidationError` extends `ExchangeError`: test it **first**. Inside
an error interceptor `exchange.error` is the unwrapped error.

To treat a status as data: per call
`{ attributes: { [IGNORE_VALIDATE_STATUS]: true } }` (a `Map` works too) in the
third argument, or per client `validateStatus: status => status < 500`.

## URLs

- `{id}` placeholders by default; `:id` needs
  `urlTemplateStyle: UrlTemplateStyle.Express`. Path values are
  `encodeURIComponent`-ed, so `/` becomes `%2F`.
- A placeholder without a value (`undefined`, `null`, no `path` at all) throws
  `Missing required path parameter` inside the exchange.
- Query: `undefined`/`null` dropped, arrays repeat the key (`ids=1&ids=2`),
  `Date` → ISO 8601, encoded the `URLSearchParams` way (space → `+`). A
  `URLSearchParams` is taken as is.
- An absolute URL bypasses `baseURL`; a `{x}` inside `baseURL` is a placeholder.

## Headers and body

No default `Content-Type`. It follows the body: a plain object is stringified
and sent as `application/json` unless you set a type; a string also gets
`application/json` (fetch would say `text/plain`); `FormData`, `Blob`, `File`
and `URLSearchParams` always lose a set type so fetch can set its own (with the
multipart boundary); `ArrayBuffer`, typed arrays and `ReadableStream` get none
(`ReadableStream` is sent with `duplex: 'half'`). A `Content-Type` in the
client `headers` goes out on every request, `GET` included, and makes every
cross-origin request preflight. A per-request `{ Authorization: undefined }`
removes a client default header.

## Timeout and cancellation

- No timeout by default; `0` or negative means none, and a per-request
  `timeout: 0` turns off the client's.
- The timeout runs alongside the caller's `signal`/`abortController`; whichever
  fires first aborts. It covers only the wait for response headers: bound
  `response.json()` or a stream with your own signal.

## Registry

- `new NamedFetcher('api', options)` registers itself in `fetcherRegistrar`; a
  reused name silently replaces the earlier entry. Look it up with
  `fetcherRegistrar.requiredGet('api')`.
- Importing the package registers a `'default'` fetcher with `baseURL: ''`.
  Anything that resolves a fetcher without a name (decorators, hooks) silently
  uses it, so relative URLs hit the page origin.
- The registry lives on `globalThis`, shared by duplicate copies of the package.
- `fetch` option: inject the `fetch` implementation (tests, Tauri,
  instrumentation); defaults to the global at call time.

## Example

```ts
import {
  ExchangeError,
  FetchTimeoutError,
  HttpStatusValidationError,
  IGNORE_VALIDATE_STATUS,
  NamedFetcher,
  ResultExtractors,
  setHeader,
} from '@ahoo-wang/fetcher';

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

export async function findUser(id: number): Promise<User | null> {
  try {
    return await api.get<User>(
      '/users/{id}',
      { urlParams: { path: { id }, query: { include: 'profile' } } },
      { resultExtractor: ResultExtractors.Json },
    );
  } catch (error) {
    if (error instanceof HttpStatusValidationError) {
      if (error.exchange.response?.status === 404) return null;
      throw error;
    }
    if (
      error instanceof ExchangeError &&
      error.cause instanceof FetchTimeoutError
    )
      throw new Error('timed out', { cause: error });
    throw error;
  }
}

// A 404 as data instead of an exception, for one call:
const response = await api.get(
  '/orders',
  {},
  {
    attributes: { [IGNORE_VALIDATE_STATUS]: true },
  },
);
const orders: Order[] = response.status === 404 ? [] : await response.json();
```
