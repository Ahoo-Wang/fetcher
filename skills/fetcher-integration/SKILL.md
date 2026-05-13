---
name: fetcher-integration
description: >
  Integrate the Fetcher HTTP client library into your projects. Covers Fetcher, NamedFetcher, FetcherRegistrar, all HTTP methods, path/query parameters, interceptors (RequestInterceptor/ResponseInterceptor/ErrorInterceptor), timeout, ResultExtractors (JSON, Text, Blob, etc.), FetchExchange lifecycle, error handling (FetchTimeoutError, ExchangeError, HttpStatusValidationError), UrlBuilder templates, validateStatus, and the named fetcher registry pattern.
  Use for: fetcher setup, HTTP client, interceptors, fetch request, url builder, error handling, timeout, base URL, named fetcher.
trigger:
  - 'integrate fetcher'
  - 'fetcher http client'
  - 'path parameters'
  - 'query parameters'
  - 'interceptors'
  - 'timeout'
  - 'named fetcher'
  - 'fetch request'
  - 'url builder'
  - 'error handling'
  - 'base URL'
---

# Fetcher Integration Skill

The Fetcher HTTP client provides an ultra-lightweight (3KB), Axios-like API built on the native Fetch API with interceptors, timeout control, and path/query parameter handling.

## Installation

```bash
pnpm add @ahoo-wang/fetcher
```

## 1. Setting Up NamedFetcher

### Basic Setup

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';

export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});
```

### Adding Interceptors

IMPORTANT: `intercept()` returns `void | Promise<void>`. Modify `exchange` directly -- do NOT return it.

```typescript
// Request interceptor
apiFetcher.interceptors.request.use({
  name: 'auth-request-interceptor',
  order: 100,
  intercept(exchange) {
    exchange.request.headers.Authorization = 'Bearer ' + getAuthToken();
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
  fetcher: Fetcher;                // The Fetcher instance
  request: FetchRequest;           // Current request (mutable)
  response?: Response;             // Response after fetch (mutable)
  error?: Error | any;             // Error if occurred (mutable)
  attributes: Map<string, any>;    // Shared data between interceptors
}
```

Key FetchExchange methods:
- `ensureRequestHeaders(): RequestHeaders` / `ensureRequestUrlParams(): Required<UrlParams>`
- `hasError(): boolean` / `hasResponse(): boolean`
- `requiredResponse: Response` -- getter, throws ExchangeError if no response

### InterceptorManager.exchange() Three-Phase Flow

1. **Request phase** -- request interceptors (URL resolve, body serialize, fetch)
2. **Response phase** -- response interceptors (validate status), only if request phase succeeded
3. **Error phase** -- error interceptors run if any phase threw. Clearing `exchange.error` resolves successfully.

```typescript
// InterceptorRegistry methods
registry.use(interceptor): boolean;       // add, false if name exists
registry.eject(name: string): boolean;    // remove by name
registry.clear(): void;                   // remove all
```

## 3. Basic HTTP Requests

All HTTP methods return `Promise<R>` defaulting to `Promise<Response>`.

```typescript
import { fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

const getResponse = await fetcher.get('/users');
const postResponse = await fetcher.post('/users', { body: { name: 'John' } });
const putResponse = await fetcher.put('/users/123', { body: { name: 'Jane' } });
const deleteResponse = await fetcher.delete('/users/123');
const patchResponse = await fetcher.patch('/users/123', { body: { name: 'Updated' } });
const headResponse = await fetcher.head('/users');
const optionsResponse = await fetcher.options('/users');
const traceResponse = await fetcher.trace('/users');

// Extract JSON with type safety
const userData = await getResponse.json<User>();

// Use ResultExtractors to get typed results directly
const user = await fetcher.get<User>('/users/123', {}, {
  resultExtractor: ResultExtractors.Json,
});
```

### ResultExtractors

| Extractor | Returns | Description |
|-----------|---------|-------------|
| `Exchange` | `FetchExchange` | Full exchange (default for `request()`) |
| `Response` | `Response` | Native Response (default for `get()`/`post()`/etc.) |
| `Json` | `Promise<any>` | Parsed JSON body |
| `Text` | `Promise<string>` | Response text |
| `Blob` | `Promise<Blob>` | Response as Blob |
| `ArrayBuffer` | `Promise<ArrayBuffer>` | Response as ArrayBuffer |
| `Bytes` | `Promise<Uint8Array>` | Response as byte array |

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
  path?: Record<string, any>;   // Path parameters {id} or :id (values encoded with encodeURIComponent)
  query?: Record<string, any>;  // Query string params (values encoded via URLSearchParams)
}
```

## 5. Timeout Configuration

Default timeout is `undefined` (no timeout). Per-request timeout overrides the instance default.

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
import { FetcherError, ExchangeError, HttpStatusValidationError, FetchTimeoutError } from '@ahoo-wang/fetcher';

try {
  await fetcher.get('/users');
} catch (error) {
  if (error instanceof FetchTimeoutError) {
    console.error('Timeout after', error.request.timeout, 'ms');
  } else if (error instanceof HttpStatusValidationError) {
    console.error('Status:', error.exchange.response?.status);
  } else if (error instanceof ExchangeError) {
    console.error('Exchange failed:', error.exchange.request.url);
  }
}
```

## 7. validateStatus and IGNORE_VALIDATE_STATUS

```typescript
import { Fetcher, IGNORE_VALIDATE_STATUS } from '@ahoo-wang/fetcher';

// Custom status validation (default: status >= 200 && status < 300)
const fetcher = new Fetcher({
  validateStatus: (status) => status < 500, // accept 4xx as valid
});

// Skip validation for a specific request
const response = await fetcher.get('/users', {}, {
  attributes: { [IGNORE_VALIDATE_STATUS]: true },
});
```

## 8. Request/Response Interceptor Examples

### Token Refresh on 401

```typescript
import { timeoutFetch } from '@ahoo-wang/fetcher';

fetcher.interceptors.response.use({
  name: 'token-refresh-interceptor',
  order: 100,
  async intercept(exchange) {
    if (exchange.response?.status === 401) {
      const newToken = await refreshToken();
      exchange.request.headers.Authorization = `Bearer ${newToken}`;
      exchange.response = await timeoutFetch(exchange.request);
    }
  },
});
```

### Retry Logic (Error Interceptor)

```typescript
fetcher.interceptors.error.use({
  name: 'retry-interceptor',
  order: 50,
  async intercept(exchange) {
    const retryCount = exchange.attributes.get('retryCount') ?? 0;
    if (retryCount < 3) {
      exchange.attributes.set('retryCount', retryCount + 1);
      exchange.response = await timeoutFetch(exchange.request);
      exchange.error = undefined; // clear error to indicate recovery
    }
  },
});
```

### Interceptor Order Reference

| Order Value | Interceptor | Phase |
|-------------|------------|-------|
| `MIN_SAFE_INTEGER + 10000` | RequestBodyInterceptor | Request |
| `MAX_SAFE_INTEGER - 20000` | UrlResolveInterceptor | Request |
| `MAX_SAFE_INTEGER - 10000` | FetchInterceptor | Request |
| `MAX_SAFE_INTEGER - 10000` | ValidateStatusInterceptor | Response |

Custom interceptors: `1-10` (high priority), `50-100` (medium), `1000+` (low).

## 9. Named Fetcher Registry Pattern

```typescript
import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';

// NamedFetcher auto-registers with fetcherRegistrar on construction
new NamedFetcher('users', { baseURL: 'https://api.example.com/users', timeout: 5000 });
new NamedFetcher('orders', { baseURL: 'https://api.example.com/orders', timeout: 10000 });

// Retrieve
const usersFetcher = fetcherRegistrar.get('users');           // Fetcher | undefined
const ordersFetcher = fetcherRegistrar.requiredGet('orders');  // Fetcher (throws if not found)

// Default fetcher getter/setter
fetcherRegistrar.default;                  // gets the 'default' named fetcher
fetcherRegistrar.default = myFetcher;      // sets the 'default' named fetcher
fetcherRegistrar.fetchers;                 // Map<string, Fetcher> (copy of all)

// Unregister
fetcherRegistrar.unregister('users');      // boolean

// Use the pre-configured default fetcher
import { fetcher } from '@ahoo-wang/fetcher';
const response = await fetcher.get('/users');
```

## Complete Example: API Service Setup

```typescript
// src/services/api.ts
import { NamedFetcher, FetchTimeoutError } from '@ahoo-wang/fetcher';

export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiFetcher.interceptors.request.use({
  name: 'auth',
  order: 100,
  intercept(exchange) {
    const token = getAccessToken();
    if (token) {
      exchange.request.headers.Authorization = `Bearer ${token}`;
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
    return await fetcher.get<User>('/users/{id}', {
      urlParams: { path: { id } },
    }, { resultExtractor: ResultExtractors.Json });
  },

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    return await fetcher.post<User>('/users', {
      body: data,
    }, { resultExtractor: ResultExtractors.Json });
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    return await fetcher.patch<User>('/users/{id}', {
      urlParams: { path: { id } },
      body: data,
    }, { resultExtractor: ResultExtractors.Json });
  },

  async deleteUser(id: number): Promise<void> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    await fetcher.delete('/users/{id}', { urlParams: { path: { id } } });
  },

  async listUsers(params?: { page?: number; limit?: number }): Promise<User[]> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    return await fetcher.get<User[]>('/users', {
      urlParams: { query: params },
    }, { resultExtractor: ResultExtractors.Json });
  },
};
```

## API Quick Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | `''` | Base URL for all requests |
| `timeout` | `number` | `undefined` | Timeout in ms (undefined = no timeout) |
| `headers` | `Record<string, string>` | `{Content-Type: application/json}` | Default headers |
| `urlTemplateStyle` | `UrlTemplateStyle` | `UriTemplate` | Path param style |
| `validateStatus` | `(status: number) => boolean` | `status >= 200 && status < 300` | Status validation |
| `interceptors` | `InterceptorManager` | new InterceptorManager() | Custom interceptor manager |

### HTTP Methods

All methods: `fetcher.get<R>(url, requestInit?, requestOptions?): Promise<R>`

| Method | Description |
|--------|-------------|
| `get` / `head` / `options` / `trace` | No body in requestInit |
| `post` / `put` / `patch` / `delete` | Body allowed in requestInit |
