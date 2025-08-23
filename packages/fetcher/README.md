# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/Fetcher/graph/badge.svg?token=CUPgk8DmH5)](https://codecov.io/gh/Ahoo-Wang/Fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

A modern HTTP client library based on the Fetch API, designed to simplify and optimize interactions with backend RESTful APIs. It provides an Axios-like API with support for path parameters, query parameters, timeout settings, and request/response interceptors.

## Features

- **Fetch API Compatible**: Fetcher's API is fully compatible with the native Fetch API, making it easy to get started.
- **Path and Query Parameters**: Supports path parameters and query parameters in requests, with path parameters wrapped in `{}`.
- **Timeout Settings**: Request timeout can be configured.
- **Request Interceptors**: Supports modifying requests before they are sent.
- **Response Interceptors**: Supports processing responses after they are returned.
- **Error Interceptors**: Supports handling errors during the request lifecycle.
- **Modular Design**: Clear code structure for easy maintenance and extension.
- **Automatic Request Body Conversion**: Automatically converts plain objects to JSON and sets appropriate Content-Type headers.
- **TypeScript Support**: Complete TypeScript type definitions.

## Installation

Using pnpm:

```bash
pnpm add @ahoo-wang/fetcher
```

Using npm:

```bash
npm install @ahoo-wang/fetcher
```

Using yarn:

```bash
yarn add @ahoo-wang/fetcher
```

## Usage

### Basic Usage

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// GET request with path parameters and query parameters
fetcher
  .get('/users/{id}', {
    pathParams: { id: 123 },
    queryParams: { include: 'profile' },
  })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });

// POST request with JSON body (automatically converted to JSON string)
fetcher
  .post('/users', {
    body: { name: 'John Doe', email: 'john@example.com' },
  })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
```

### Interceptor Usage

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Add request interceptor
const requestInterceptorId = fetcher.interceptors.request.use({
  intercept(request) {
    // Modify request configuration, e.g., add auth header
    return {
      ...request,
      headers: {
        ...request.headers,
        Authorization: 'Bearer token',
      },
    };
  },
});

// Add response interceptor
const responseInterceptorId = fetcher.interceptors.response.use({
  intercept(response) {
    // Process response data, e.g., parse JSON
    return response;
  },
});

// Add error interceptor
const errorInterceptorId = fetcher.interceptors.error.use({
  intercept(error) {
    // Handle errors, e.g., log them
    console.error('Request failed:', error);
    return error;
  },
});
```

## API Reference

### Fetcher Class

Core HTTP client class that provides various HTTP methods.

#### Constructor

```typescript
new Fetcher(options: FetcherOptions = defaultOptions)
```

**Parameters:**

- `options.baseURL`: Base URL
- `options.timeout`: Request timeout in milliseconds
- `options.headers`: Default request headers

#### Methods

- `fetch(url: string, request?: FetcherRequest): Promise<Response>` - Generic HTTP request method
- `get(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - GET request
- `post(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - POST request
- `put(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - PUT request
- `delete(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - DELETE request
- `patch(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - PATCH request
- `head(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - HEAD request
- `options(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - OPTIONS request

### UrlBuilder Class

URL builder for constructing complete URLs with parameters.

#### Methods

- `build(path: string, pathParams?: Record<string, any>, queryParams?: Record<string, any>): string` - Build complete URL

### InterceptorManager Class

Interceptor manager for managing multiple interceptors of the same type.

#### Methods

- `use(interceptor: T): number` - Add interceptor, returns interceptor ID
- `eject(index: number): void` - Remove interceptor by ID
- `clear(): void` - Clear all interceptors
- `intercept(data: R): Promise<R>` - Execute all interceptors sequentially

### FetcherInterceptors Class

Fetcher interceptor collection, including request, response, and error interceptor managers.

#### Properties

- `request: RequestInterceptorManager` - Request interceptor manager
- `response: ResponseInterceptorManager` - Response interceptor manager
- `error: ErrorInterceptorManager` - Error interceptor manager

## Complete Example

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

// Create fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor - Add auth header
fetcher.interceptors.request.use({
  intercept(request) {
    return {
      ...request,
      headers: {
        ...request.headers,
        Authorization: 'Bearer ' + getAuthToken(),
      },
    };
  },
});

// Add response interceptor - Auto-parse JSON
fetcher.interceptors.response.use({
  intercept(response) {
    if (response.headers.get('content-type')?.includes('application/json')) {
      return response.json().then(data => {
        return new Response(JSON.stringify(data), response);
      });
    }
    return response;
  },
});

// Add error interceptor - Unified error handling
fetcher.interceptors.error.use({
  intercept(error) {
    if (error.name === 'FetchTimeoutError') {
      console.error('Request timeout:', error.message);
    } else {
      console.error('Network error:', error.message);
    }
    return error;
  },
});

// Use fetcher to make requests
fetcher
  .get('/users/{id}', {
    pathParams: { id: 123 },
    queryParams: { include: 'profile,posts' },
  })
  .then(response => response.json())
  .then(data => {
    console.log('User data:', data);
  })
  .catch(error => {
    console.error('Failed to fetch user:', error);
  });
```

## Testing

Run tests:

```bash
pnpm test
```

## Contributing

Contributions of any kind are welcome! Please see the [contributing guide](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) for more details.

## License

This project is licensed under the [Apache-2.0 License](https://opensource.org/licenses/Apache-2.0).
