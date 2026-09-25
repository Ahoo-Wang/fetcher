# Fetcher Integration API Reference

## Contents

- [Installation](#installation)
- [1. Setting Up NamedFetcher](#1-setting-up-namedfetcher)
  - [Basic Setup](#basic-setup)
  - [Adding Interceptors](#adding-interceptors)
- [2. FetchExchange and Request Lifecycle](#2-fetchexchange-and-request-lifecycle)
  - [InterceptorManager.exchange() Three-Phase Flow](#interceptormanagerexchange-three-phase-flow)
- [3. Basic HTTP Requests](#3-basic-http-requests)
  - [ResultExtractors](#resultextractors)
- [4. Path and Query Parameter Handling](#4-path-and-query-parameter-handling)
  - [URI Template Style (Default - `{id}`)](#uri-template-style-default---id)
  - [Express Style (`:id`)](#express-style-id)
  - [UrlParams Structure](#urlparams-structure)
- [5. Timeout Configuration](#5-timeout-configuration)
- [6. Error Hierarchy](#6-error-hierarchy)
- [7. validateStatus and IGNORE_VALIDATE_STATUS](#7-validatestatus-and-ignore_validate_status)
- [8. Request/Response Interceptor Examples](#8-requestresponse-interceptor-examples)
  - [Token Refresh on 401](#token-refresh-on-401)
  - [Retry Logic (Error Interceptor)](#retry-logic-error-interceptor)
  - [Interceptor Order Reference](#interceptor-order-reference)
- [9. Named Fetcher Registry Pattern](#9-named-fetcher-registry-pattern)
- [Complete Example: API Service Setup](#complete-example-api-service-setup)
- [API Quick Reference](#api-quick-reference)
  - [Constructor Options](#constructor-options)
  - [HTTP Methods](#http-methods)

The Fetcher HTTP client provides an Axios-like API built on the native Fetch API with interceptors, timeout control, and path/query parameter handling.

## Installation

```bash
pnpm add @ahoo-wang/fetcher
```

The core package supports ESM imports and CommonJS
`const { Fetcher } = require('@ahoo-wang/fetcher')` through its package entry.

## 1. Setting Up NamedFetcher

### Basic Setup

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';

export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { Accept: 'application/json' },
});
```

There is no default `Content-Type`; `RequestBodyInterceptor` sets it from the body, so don't put one in the fetcher's `headers`: it would go out on every request, bodyless `GET`s included, and make each cross-origin one need a CORS preflight.

### Adding Interceptors

IMPORTANT: `intercept()` returns `void | Promise<void>`. Modify `exchange` directly -- do NOT return it.
`name` and `order` are both required; `use()` returns `false` and silently ignores an interceptor whose `name` is already registered in that phase.

```typescript
import { FetchTimeoutError, setHeader } from '@ahoo-wang/fetcher';

// Request interceptor (`request.headers` is optional in the type; use ensureRequestHeaders())
apiFetcher.interceptors.request.use({
  name: 'auth-request-interceptor',
  order: 100,
  intercept(exchange) {
    setHeader(
      exchange.ensureRequestHeaders(),
      'Authorization',
      'Bearer ' + getAuthToken(),
    );
  },
});

// Response interceptor
apiFetcher.interceptors.response.use({
  name: 'logging-response-interceptor',
  order: 10,
  intercept(exchange) {
    console.log('Response status:', exchange.response?.status);
  },
});

// Error interceptor
apiFetcher.interceptors.error.use({
  name: 'error-handler-interceptor',
  order: 50,
  intercept(exchange) {
    if (exchange.error instanceof FetchTimeoutError) {
      console.error('Request timeout:', exchange.error.message);
    }
  },
});
```

## 2. FetchExchange and Request Lifecycle

Every request creates a `FetchExchange` that flows through the interceptor chain:

```typescript
interface FetchExchange {
  fetcher: Fetcher; // The Fetcher instance
  request: FetchRequest; // Current request (mutable)
  response?: Response; // Response after fetch (mutable)
  error?: Error | any; // Error if occurred (mutable)
  attributes: Map<string, any>; // Shared data between interceptors
  resultExtractor: ResultExtractor<any>; // Used at the end of the exchange
}
```

Key FetchExchange methods:

- `ensureRequestHeaders(): RequestHeaders` / `ensureRequestUrlParams(): Required<UrlParams>`
- `hasError(): boolean` / `hasResponse(): boolean`
- `requiredResponse: Response` -- getter, throws ExchangeError if no response

### InterceptorManager.exchange() Three-Phase Flow

1. **Request phase** -- request interceptors in ascending `order`. `RequestBodyInterceptor` (`Number.MIN_SAFE_INTEGER + 10000`) runs before any interceptor with an ordinary order, so a plain object you assign to `request.body` in your own request interceptor is **not** JSON-serialized. Your interceptor still sees the unresolved template URL and `urlParams` (use `ensureRequestUrlParams()` to add path/query values); `UrlResolveInterceptor` then builds the final URL and sets `urlParams` to `undefined`, and `FetchInterceptor` performs the fetch.
2. **Response phase** -- response interceptors (including `ValidateStatusInterceptor`), only if the request phase did not throw.
3. **Error phase** -- if either phase threw, the thrown value is stored in `exchange.error` and error interceptors run. If they clear `exchange.error`, the exchange is returned as recovered **without re-running the response phase**; otherwise the exchange rejects: an `ExchangeError` raised for this same exchange (`HttpStatusValidationError`) is rethrown as is, anything else is wrapped in `new ExchangeError(exchange)` with the original as `cause`. `hasError()` is true unless `exchange.error` is `undefined` or `null`.

```text
// InterceptorRegistry methods
registry.use(interceptor): boolean;       // add, false if name exists
registry.eject(name: string): boolean;    // remove by name
registry.clear(): void;                   // remove all
```

## 3. Basic HTTP Requests

All HTTP methods return `Promise<R>` defaulting to `Promise<Response>`.

`FetchRequestInit<BODY>` and `FetchRequest<BODY>` constrain `BODY` to
`RequestBodyType = Exclude<RequestInit['body'], undefined> | Record<string, any>`.
This uses the platform's native request body types (including `null`) plus
JSON object bodies, without requiring the DOM-only global `BodyInit` in Node.

```typescript
import { fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

const getResponse = await fetcher.get('/users');
const postResponse = await fetcher.post('/users', { body: { name: 'John' } });
const putResponse = await fetcher.put('/users/123', { body: { name: 'Jane' } });
const deleteResponse = await fetcher.delete('/users/123');
const patchResponse = await fetcher.patch('/users/123', {
  body: { name: 'Updated' },
});
const headResponse = await fetcher.head('/users');
const optionsResponse = await fetcher.options('/users');
const traceResponse = await fetcher.trace('/users');

// Extract JSON with type safety
const userData = await getResponse.json<User>();

// Use ResultExtractors to get typed results directly
const user = await fetcher.get<User>(
  '/users/123',
  {},
  {
    resultExtractor: ResultExtractors.Json,
  },
);
```

### ResultExtractors

| Extractor     | Returns                | Description                                         |
| ------------- | ---------------------- | --------------------------------------------------- |
| `Exchange`    | `FetchExchange`        | Full exchange (default for `request()`)             |
| `Response`    | `Response`             | Native Response (default for `get()`/`post()`/etc.) |
| `Json`        | `Promise<any>`         | Parsed JSON body                                    |
| `Text`        | `Promise<string>`      | Response text                                       |
| `Blob`        | `Promise<Blob>`        | Response as Blob                                    |
| `ArrayBuffer` | `Promise<ArrayBuffer>` | Response as ArrayBuffer                             |
| `Bytes`       | `Promise<Uint8Array>`  | Response as byte array                              |

## 4. Path and Query Parameter Handling

### URI Template Style (Default - `{id}`)

```typescript
const response = await fetcher.get('/users/{id}/posts/{postId}', {
  urlParams: {
    path: { id: 123, postId: 456 },
    query: { include: 'comments', page: 1 },
  },
});
// Result: /users/123/posts/456?include=comments&page=1
```

### Express Style (`:id`)

```typescript
import { Fetcher, UrlTemplateStyle } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  urlTemplateStyle: UrlTemplateStyle.Express,
});

const response = await fetcher.get('/users/:id', {
  urlParams: { path: { id: 123 }, query: { filter: 'active' } },
});
```

### UrlParams Structure

```typescript
interface UrlParams {
  path?: Record<string, any>; // Path parameters {id} or :id (values encoded with encodeURIComponent)
  query?: Record<string, any>; // Query string params (serialized by toSearchParams)
}
```

- A placeholder with no `path` value (`undefined`, `null`, or no `path` object at all) throws `Error('Missing required path parameter: <name>')` during the request phase (surfaces as `ExchangeError`). A `Date` path value becomes its ISO 8601 text. Express names are identifiers: `/files/:name.json` is the parameter `name`.
- `query` is serialized by `toSearchParams`: `undefined`/`null` values are omitted, arrays become one parameter per item (`ids=1&ids=2`, null/undefined items skipped), a `Date` becomes `toISOString()`, anything else `String(value)`. A `URLSearchParams` passed as `query` is used as is.

## 5. Timeout Configuration

Default timeout is `undefined` (no timeout); `0` also means no timeout. Per-request `timeout` overrides the instance default.
The timeout applies together with the request's `signal` and `abortController`: whichever fires first aborts. A timeout rejects with `FetchTimeoutError` (the `cause` of the Fetcher's `ExchangeError`); a caller abort rejects with the caller's abort reason. The timeout never aborts the caller's controller and covers only up to the response headers, not body consumption.

```typescript
// Instance-level timeout
const fetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// Per-request timeout
const response = await fetcher.get('/slow-endpoint', { timeout: 30000 });
```

## 6. Error Hierarchy

```
FetcherError (base)
  ├── FetchTimeoutError (has .request property)
  └── ExchangeError (has .exchange property)
        └── HttpStatusValidationError (status code validation failed)
```

```typescript
import {
  ExchangeError,
  HttpStatusValidationError,
  FetchTimeoutError,
} from '@ahoo-wang/fetcher';

try {
  await fetcher.get('/users');
} catch (error) {
  // HttpStatusValidationError is thrown as is (it extends ExchangeError),
  // so test it first; other failures are wrapped with the original as `cause`.
  if (error instanceof HttpStatusValidationError) {
    console.error('Status:', error.exchange.response?.status);
  } else if (!(error instanceof ExchangeError)) {
    throw error;
  } else if (error.cause instanceof FetchTimeoutError) {
    console.error('Timeout after', error.cause.request.timeout, 'ms');
  } else {
    console.error('Exchange failed:', error.exchange.request.url);
  }
}
```

## 7. validateStatus and IGNORE_VALIDATE_STATUS

```typescript
import { Fetcher, IGNORE_VALIDATE_STATUS } from '@ahoo-wang/fetcher';

// Custom status validation (default: status >= 200 && status < 300)
const fetcher = new Fetcher({
  baseURL: '',
  validateStatus: status => status < 500, // accept 4xx as valid
});

// Skip validation for a specific request
const response = await fetcher.get(
  '/users',
  {},
  {
    attributes: { [IGNORE_VALIDATE_STATUS]: true },
  },
);
```

## 8. Request/Response Interceptor Examples

### Token Refresh on 401

```typescript
import { setHeader, timeoutFetch } from '@ahoo-wang/fetcher';

fetcher.interceptors.response.use({
  name: 'token-refresh-interceptor',
  order: 100,
  async intercept(exchange) {
    if (exchange.response?.status === 401) {
      const newToken = await refreshToken();
      setHeader(
        exchange.ensureRequestHeaders(),
        'Authorization',
        `Bearer ${newToken}`,
      );
      // request.url is already resolved and body already serialized here
      exchange.response = await timeoutFetch(exchange.request);
    }
  },
});
```

### Retry Logic (Error Interceptor)

```typescript
import {
  HttpMethod,
  HttpStatusValidationError,
  timeoutFetch,
} from '@ahoo-wang/fetcher';

fetcher.interceptors.error.use({
  name: 'retry-interceptor',
  order: 50,
  async intercept(exchange) {
    if (
      exchange.request.method !== HttpMethod.GET ||
      exchange.request.signal?.aborted ||
      exchange.request.abortController?.signal.aborted
    ) {
      return;
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await timeoutFetch(exchange.request);
        exchange.response = response;
        if (response.ok) {
          exchange.error = undefined;
          return;
        }
        exchange.error = new HttpStatusValidationError(exchange);
      } catch (error) {
        exchange.error = error;
      }
    }
  },
});
```

This runs before `ValidateStatusInterceptor` (order `MAX_SAFE_INTEGER - 10000`), so the replayed response is still status-validated.

Recovered responses do not re-enter the response interceptor chain, so validate the retry result before clearing `exchange.error`. This example retries only GET requests and skips caller cancellation; replace `response.ok` with the same predicate as a custom `validateStatus` when needed.

### Interceptor Order Reference

| Order Value                | Exported constant                   | Interceptor               | Phase    |
| -------------------------- | ----------------------------------- | ------------------------- | -------- |
| `MIN_SAFE_INTEGER + 10000` | `REQUEST_BODY_INTERCEPTOR_ORDER`    | RequestBodyInterceptor    | Request  |
| `MAX_SAFE_INTEGER - 20000` | `URL_RESOLVE_INTERCEPTOR_ORDER`     | UrlResolveInterceptor     | Request  |
| `MAX_SAFE_INTEGER - 10000` | `FETCH_INTERCEPTOR_ORDER`           | FetchInterceptor          | Request  |
| `MAX_SAFE_INTEGER - 10000` | `VALIDATE_STATUS_INTERCEPTOR_ORDER` | ValidateStatusInterceptor | Response |

Lower values run first within each phase. To run after URL resolution but before the fetch, use an order between `URL_RESOLVE_INTERCEPTOR_ORDER` and `FETCH_INTERCEPTOR_ORDER`; to see a response before status validation, use any order below `VALIDATE_STATUS_INTERCEPTOR_ORDER`. The error registry has no built-in interceptors.

## 9. Named Fetcher Registry Pattern

```typescript
import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';

// NamedFetcher auto-registers with fetcherRegistrar on construction;
// a second NamedFetcher with the same name silently replaces the first.
// fetcherRegistrar lives on globalThis, so a second copy of the package
// (ESM + CJS builds, or two versions) shares it and its default fetcher.
new NamedFetcher('users', {
  baseURL: 'https://api.example.com/users',
  timeout: 5000,
});
new NamedFetcher('orders', {
  baseURL: 'https://api.example.com/orders',
  timeout: 10000,
});

// Retrieve
const usersFetcher = fetcherRegistrar.get('users'); // Fetcher | undefined
const ordersFetcher = fetcherRegistrar.requiredGet('orders'); // Fetcher (throws if not found)

// Default fetcher getter/setter
fetcherRegistrar.default; // gets the 'default' named fetcher (throws if unregistered)
fetcherRegistrar.default = myFetcher; // sets the 'default' named fetcher
fetcherRegistrar.fetchers; // Map<string, Fetcher> (copy of all)

// Unregister
fetcherRegistrar.unregister('users'); // boolean

// Use the pre-configured default fetcher
import { fetcher } from '@ahoo-wang/fetcher';
const response = await fetcher.get('/users');
```

## Complete Example: API Service Setup

```typescript
// src/services/api.ts
import { NamedFetcher, FetchTimeoutError, setHeader } from '@ahoo-wang/fetcher';

export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com/v1',
  timeout: 10000,
});

apiFetcher.interceptors.request.use({
  name: 'auth',
  order: 100,
  intercept(exchange) {
    const token = getAccessToken();
    if (token) {
      setHeader(
        exchange.ensureRequestHeaders(),
        'Authorization',
        `Bearer ${token}`,
      );
    }
  },
});

apiFetcher.interceptors.error.use({
  name: 'error-handler',
  order: 100,
  intercept(exchange) {
    if (exchange.error instanceof FetchTimeoutError) {
      console.error('Timeout:', exchange.error.message);
    }
  },
});

// src/services/users.ts
import { fetcherRegistrar, ResultExtractors } from '@ahoo-wang/fetcher';

export interface User {
  id: number;
  name: string;
  email: string;
}

export const userService = {
  async getUser(id: number): Promise<User> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    return await fetcher.get<User>(
      '/users/{id}',
      {
        urlParams: { path: { id } },
      },
      { resultExtractor: ResultExtractors.Json },
    );
  },

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    return await fetcher.post<User>(
      '/users',
      {
        body: data,
      },
      { resultExtractor: ResultExtractors.Json },
    );
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    return await fetcher.patch<User>(
      '/users/{id}',
      {
        urlParams: { path: { id } },
        body: data,
      },
      { resultExtractor: ResultExtractors.Json },
    );
  },

  async deleteUser(id: number): Promise<void> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    await fetcher.delete('/users/{id}', { urlParams: { path: { id } } });
  },

  async listUsers(params?: { page?: number; limit?: number }): Promise<User[]> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    return await fetcher.get<User[]>(
      '/users',
      {
        urlParams: { query: params },
      },
      { resultExtractor: ResultExtractors.Json },
    );
  },
};
```

## API Quick Reference

### Constructor Options

| Option             | Type                          | Default                         | Description                                                                                                                                                    |
| ------------------ | ----------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseURL`          | `string`                      | `''`                            | Base URL; **required** in the `FetcherOptions` type whenever you pass options                                                                                  |
| `timeout`          | `number`                      | `undefined`                     | Timeout in ms (undefined = no timeout)                                                                                                                         |
| `headers`          | `RequestHeaders`              | `{}`                            | Default headers, merged under request headers; no `Content-Type` by default (`RequestBodyInterceptor` sets it from the body); each instance keeps its own copy |
| `urlTemplateStyle` | `UrlTemplateStyle`            | `UriTemplate`                   | Path param style                                                                                                                                               |
| `validateStatus`   | `(status: number) => boolean` | `status >= 200 && status < 300` | Status validation¹                                                                                                                                             |
| `interceptors`     | `InterceptorManager`          | new InterceptorManager()        | Custom interceptor manager                                                                                                                                     |

¹ `validateStatus` has no effect when a custom `interceptors` manager is provided — the default `ValidateStatusInterceptor` is only installed by the default manager. Register it yourself in that case.

### Request Cancellation

Pass an `AbortController` per request via the `abortController` option (combined with any `signal` and the timeout; whichever fires first aborts):

```typescript
const abortController = new AbortController();
fetcher.get('/slow', { abortController });
abortController.abort(); // cancels the in-flight request
```

### Other Utilities

- `getFetcher(fetcher?: string | Fetcher, defaultFetcher?)` -- a string is resolved as a registered name; anything else is passed through as the fetcher (no `instanceof` check; used by decorator services)
- `mergeRequest(first, second)` -- merge two request configs (case-insensitive headers, nested `urlParams.path`/`query`)
- `mergeHeaders(...headers: (RequestHeaders | undefined)[]): RequestHeaders` -- case-insensitive replacement; the last layer and its spelling win, without mutating inputs
- `getHeader(headers: RequestHeaders | undefined, name: string): string | undefined` -- case-insensitive lookup (last matching key wins)
- `setHeader(headers: RequestHeaders, name: string, value: string | undefined): void` -- replaces all spellings, retaining `name`; `undefined` removes the header
- `deleteHeader(headers: RequestHeaders, name: string): void` -- removes all spellings; use these helpers when interceptors read or modify header records
- `HttpMethod` -- enum of HTTP methods for the generic `fetcher.request()` / `fetcher.fetch()` calls
- `combineURLs(base, relative)` / `isAbsoluteURL(url)` -- an already-absolute request URL bypasses `baseURL` entirely
- `Response.json<T>()` -- the package augments `Response` globally so `response.json<User>()` type-checks

### HTTP Methods

All verb methods: `fetcher.get<R = Response>(url, requestInit?, requestOptions?): Promise<R>` (default extractor `ResultExtractors.Response`).

- `fetch<R = Response>(url, requestInit?, options?)` -- method taken from `requestInit.method`
- `request<R = FetchExchange>(request: FetchRequest, options?)` -- default extractor `ResultExtractors.Exchange`
- `exchange(request, options?): Promise<FetchExchange>` -- runs the interceptors, never extracts
- `resolveExchange(request, options?): FetchExchange` -- merges instance headers/timeout and builds the exchange without running it

| Method                               | Description                 |
| ------------------------------------ | --------------------------- |
| `get` / `head` / `options` / `trace` | No body in requestInit      |
| `post` / `put` / `patch` / `delete`  | Body allowed in requestInit |
