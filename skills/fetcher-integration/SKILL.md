---
name: fetcher-integration
description: Integrate the Fetcher HTTP client library into your projects. Covers NamedFetcher setup, all HTTP methods, path/query parameters, interceptors, timeout configuration, and the named fetcher registry pattern.
trigger:
  - "integrate fetcher"
  - "fetcher http client"
  - "path parameters"
  - "query parameters"
  - "interceptors"
  - "timeout"
  - "named fetcher"
---

# Fetcher Integration Skill

The Fetcher HTTP client provides an ultra-lightweight (3KB), Axios-like API built on the native Fetch API with powerful features including interceptors, timeout control, and path/query parameter handling.

## Installation

```bash
pnpm add @ahoo-wang/fetcher
# or
npm install @ahoo-wang/fetcher
# or
yarn add @ahoo-wang/fetcher
```

## 1. Setting Up NamedFetcher with baseURL and Interceptors

### Basic NamedFetcher Setup

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';

// Create a named fetcher that auto-registers itself
export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Adding Interceptors

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';

export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
});

// Request interceptor for authentication
apiFetcher.interceptors.request.use({
  name: 'auth-request-interceptor',
  order: 100,
  intercept(exchange) {
    exchange.request.headers.Authorization = 'Bearer ' + getAuthToken();
    return exchange;
  },
});

// Response interceptor for logging
apiFetcher.interceptors.response.use({
  name: 'logging-response-interceptor',
  order: 10,
  intercept(exchange) {
    console.log('Response status:', exchange.response?.status);
    return exchange;
  },
});

// Error interceptor for unified error handling
apiFetcher.interceptors.error.use({
  name: 'error-handler-interceptor',
  order: 50,
  intercept(exchange) {
    if (exchange.error?.name === 'FetchTimeoutError') {
      console.error('Request timeout:', exchange.error.message);
    }
    return exchange;
  },
});
```

### Real-World Example (from integration tests)

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';
import {
  authorizationRequestInterceptor,
  cosecRequestInterceptor,
  authorizationResponseInterceptor,
  cosecResourceAttributionInterceptor,
} from '../cosec';

export const typicodeFetcher = new NamedFetcher('typicode', {
  baseURL: 'https://jsonplaceholder.typicode.com',
});

typicodeFetcher.interceptors.request.use(cosecRequestInterceptor);
typicodeFetcher.interceptors.request.use(authorizationRequestInterceptor);
typicodeFetcher.interceptors.response.use(authorizationResponseInterceptor);
typicodeFetcher.interceptors.response.use(cosecResourceAttributionInterceptor);
```

## 2. Basic HTTP Requests

All HTTP methods return a Promise with the native Response object.

```typescript
import { fetcher } from '@ahoo-wang/fetcher';

// GET request
const getResponse = await fetcher.get('/users');

// POST request
const postResponse = await fetcher.post('/users', {
  body: { name: 'John', email: 'john@example.com' },
});

// PUT request
const putResponse = await fetcher.put('/users/123', {
  body: { name: 'Jane', email: 'jane@example.com' },
});

// DELETE request
const deleteResponse = await fetcher.delete('/users/123');

// PATCH request
const patchResponse = await fetcher.patch('/users/123', {
  body: { name: 'Updated Name' },
});

// HEAD request
const headResponse = await fetcher.head('/users');

// OPTIONS request
const optionsResponse = await fetcher.options('/users');

// TRACE request
const traceResponse = await fetcher.trace('/users');

// Extract JSON data with type safety
const userData = await getResponse.json<User>();
```

## 3. Path and Query Parameter Handling

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
  urlParams: {
    path: { id: 123 },
    query: { filter: 'active' },
  },
});
// Result: /users/123?filter=active
```

### Query Parameters Only

```typescript
const response = await fetcher.get('/users', {
  urlParams: {
    query: { page: 1, limit: 10, sort: 'name' },
  },
});
// Result: /users?page=1&limit=10&sort=name
```

## 4. Timeout Configuration

### Per-Request Timeout

```typescript
const response = await fetcher.get('/slow-endpoint', {
  timeout: 30000, // 30 seconds
});
```

### Default Timeout on Fetcher Instance

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';

const fetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000, // Default 5 second timeout
});
```

### Handling Timeout Errors

```typescript
fetcher.interceptors.error.use({
  name: 'timeout-handler',
  order: 100,
  intercept(exchange) {
    if (exchange.error?.name === 'FetchTimeoutError') {
      throw new Error(`Request timed out after ${exchange.request.timeout}ms`);
    }
    return exchange;
  },
});
```

## 5. Request/Response Interceptors

### Request Interceptor (Authentication)

```typescript
// Add auth token to all requests
fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 50,
  intercept(exchange) {
    const token = localStorage.getItem('authToken');
    if (token) {
      exchange.request.headers.Authorization = `Bearer ${token}`;
    }
    return exchange;
  },
});
```

### Request Interceptor (Request ID/Logging)

```typescript
// Add request ID for tracing
fetcher.interceptors.request.use({
  name: 'request-id-interceptor',
  order: 10,
  intercept(exchange) {
    exchange.request.headers['X-Request-ID'] = crypto.randomUUID();
    return exchange;
  },
});
```

### Response Interceptor (Token Refresh)

```typescript
fetcher.interceptors.response.use({
  name: 'token-refresh-interceptor',
  order: 100,
  intercept(exchange) {
    if (exchange.response?.status === 401) {
      // Trigger token refresh logic
      return refreshToken().then(newToken => {
        exchange.request.headers.Authorization = `Bearer ${newToken}`;
        return exchange.proceed();
      });
    }
    return exchange;
  },
});
```

### Response Interceptor (Global Error Handler)

```typescript
fetcher.interceptors.response.use({
  name: 'global-error-handler',
  order: Number.MAX_SAFE_INTEGER - 10000,
  intercept(exchange) {
    const status = exchange.response?.status;
    if (status && status >= 400) {
      throw new Error(`HTTP Error: ${status}`);
    }
    return exchange;
  },
});
```

### Interceptor Order Reference

Built-in interceptors use these order ranges:
- `Number.MAX_SAFE_INTEGER - 11000`: UrlResolveInterceptor (resolves URL params)
- `Number.MIN_SAFE_INTEGER + 10000`: RequestBodyInterceptor (converts body to JSON)
- `Number.MAX_SAFE_INTEGER - 10000`: ValidateStatusInterceptor (validates HTTP status)

Lower values execute first. Custom interceptors typically use orders like:
- `1-10`: High priority (request ID, timing)
- `50-100`: Medium priority (auth)
- `1000+`: Low priority (after built-in interceptors)

## 6. Named Fetcher Registry Pattern

### Creating Named Fetchers

```typescript
import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';

// Create multiple named fetchers for different services
new NamedFetcher('users', {
  baseURL: 'https://api.example.com/users',
  timeout: 5000,
});

new NamedFetcher('orders', {
  baseURL: 'https://api.example.com/orders',
  timeout: 10000,
});

new NamedFetcher('files', {
  baseURL: 'https://api.example.com/files',
  timeout: 30000,
});
```

### Retrieving Named Fetchers

```typescript
// Safe get - returns undefined if not found
const usersFetcher = fetcherRegistrar.get('users');
if (usersFetcher) {
  const response = await usersFetcher.get('/123');
}

// Required get - throws error if not found
const ordersFetcher = fetcherRegistrar.requiredGet('orders');
const response = await ordersFetcher.get('/456');
```

### Using Named Fetchers

```typescript
// Get a fetcher and use it
const fetcher = fetcherRegistrar.get('api');
if (fetcher) {
  // GET with path params
  const response = await fetcher.get('/users/{id}', {
    urlParams: { path: { id: 123 } },
  });
  const user = await response.json<User>();

  // POST with body
  const createResponse = await fetcher.post('/users', {
    body: { name: 'John', email: 'john@example.com' },
  });
}
```

### Default Fetcher

```typescript
import { fetcher } from '@ahoo-wang/fetcher';

// Use the pre-configured default fetcher
const response = await fetcher.get('/users');
const data = await response.json<User>();
```

## Complete Example: API Service Setup

```typescript
// src/services/api.ts
import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';

// Create API fetcher
export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiFetcher.interceptors.request.use({
  name: 'auth',
  order: 100,
  intercept(exchange) {
    const token = getAccessToken();
    if (token) {
      exchange.request.headers.Authorization = `Bearer ${token}`;
    }
    return exchange;
  },
});

// Add request logging
apiFetcher.interceptors.request.use({
  name: 'request-logger',
  order: 5,
  intercept(exchange) {
    console.log(`[${new Date().toISOString()}] ${exchange.request.method} ${exchange.request.url}`);
    return exchange;
  },
});

// Add response logging
apiFetcher.interceptors.response.use({
  name: 'response-logger',
  order: 5,
  intercept(exchange) {
    console.log(`[${new Date().toISOString()}] Response: ${exchange.response?.status}`);
    return exchange;
  },
});

// src/services/users.ts
import { fetcherRegistrar } from '@ahoo-wang/fetcher';

export interface User {
  id: number;
  name: string;
  email: string;
}

export const userService = {
  async getUser(id: number): Promise<User> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    const response = await fetcher.get(`/users/{id}`, {
      urlParams: { path: { id } },
    });
    return response.json<User>();
  },

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    const response = await fetcher.post('/users', { body: data });
    return response.json<User>();
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    const response = await fetcher.patch(`/users/{id}`, {
      urlParams: { path: { id } },
      body: data,
    });
    return response.json<User>();
  },

  async deleteUser(id: number): Promise<void> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    await fetcher.delete(`/users/{id}`, {
      urlParams: { path: { id } },
    });
  },

  async listUsers(params?: { page?: number; limit?: number }): Promise<User[]> {
    const fetcher = fetcherRegistrar.requiredGet('api');
    const response = await fetcher.get('/users', {
      urlParams: { query: params },
    });
    return response.json<User[]>();
  },
};
```

## API Quick Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | `''` | Base URL for all requests |
| `timeout` | `number` | `0` (no timeout) | Request timeout in milliseconds |
| `headers` | `Record<string, string>` | `{}` | Default request headers |
| `urlTemplateStyle` | `UrlTemplateStyle` | `UriTemplate` | Path param style (`UriTemplate` or `Express`) |

### HTTP Methods

All methods accept `url: string` and optional `FetcherRequest` config.

| Method | Body Type | Description |
|--------|-----------|-------------|
| `get` | none | GET request |
| `post` | `body` | POST request |
| `put` | `body` | PUT request |
| `delete` | none | DELETE request |
| `patch` | `body` | PATCH request |
| `head` | none | HEAD request |
| `options` | none | OPTIONS request |
| `trace` | none | TRACE request |

### UrlParams Structure

```typescript
{
  path?: Record<string, string | number>;  // Path parameters {id} or :id
  query?: Record<string, string | number | boolean>;  // Query string params
}
```
