# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
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

### Named Fetcher Usage

NamedFetcher is an extension of the Fetcher class that automatically registers itself with a global registrar. This is
useful when you need to manage multiple fetcher instances throughout your application.

```typescript
import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';

// Create a named fetcher that automatically registers itself
const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer token',
  },
});

// Create another named fetcher for a different service
const authFetcher = new NamedFetcher('auth', {
  baseURL: 'https://auth.example.com',
  timeout: 3000,
});

// Use the fetcher normally
apiFetcher
  .get('/users/123')
  .then(response => response.json())
  .then(data => console.log(data));

// Retrieve a named fetcher from the registrar
const retrievedFetcher = fetcherRegistrar.get('api');
if (retrievedFetcher) {
  retrievedFetcher.post('/users', {
    body: { name: 'Jane Doe' },
  });
}

// Use requiredGet to retrieve a fetcher (throws error if not found)
try {
  const authFetcher = fetcherRegistrar.requiredGet('auth');
  authFetcher.post('/login', {
    body: { username: 'user', password: 'pass' },
  });
} catch (error) {
  console.error('Fetcher not found:', error.message);
}
```

### Default Fetcher Usage

The library also exports a pre-configured default fetcher instance that can be used directly:

```typescript
import { fetcher } from '@ahoo-wang/fetcher';

// Use the default fetcher directly
fetcher
  .get('/users')
  .then(response => response.json())
  .then(data => console.log(data));

// The default fetcher is also available through the registrar
import { fetcherRegistrar } from '@ahoo-wang/fetcher';

const defaultFetcher = fetcherRegistrar.default;
// defaultFetcher is the same instance as fetcher
console.log(defaultFetcher === fetcher); // true
```

### Interceptor Usage

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Add request interceptor
const requestInterceptorId = fetcher.interceptors.request.use({
  intercept(exchange) {
    // Modify request configuration, e.g., add auth header
    return {
      ...exchange,
      request: {
        ...exchange.request,
        headers: {
          ...exchange.request.headers,
          Authorization: 'Bearer token',
        },
      },
    };
  },
});

// Add response interceptor
const responseInterceptorId = fetcher.interceptors.response.use({
  intercept(exchange) {
    // Process response data, e.g., parse JSON
    return exchange;
  },
});

// Add error interceptor
const errorInterceptorId = fetcher.interceptors.error.use({
  intercept(exchange) {
    // Handle errors, e.g., log them
    console.error('Request failed:', exchange.error);
    return exchange;
  },
});
```

## API Reference

### Fetcher Class

Core HTTP client class that provides various HTTP methods.

#### Constructor

```typescript
new Fetcher(defaultOptions)
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

### NamedFetcher Class

An extension of the Fetcher class that automatically registers itself with the global fetcherRegistrar using a provided
name.

#### Constructor

```typescript
new NamedFetcher(name, defaultOptions)
```

**Parameters:**

- `name`: The name to register this fetcher under
- `options`: Same as Fetcher constructor options

### FetcherRegistrar

Global instance for managing multiple Fetcher instances by name.

#### Properties

- `default`: Get or set the default fetcher instance

#### Methods

- `register(name: string, fetcher: Fetcher): void` - Register a fetcher with a name
- `unregister(name: string): boolean` - Unregister a fetcher by name
- `get(name: string): Fetcher | undefined` - Get a fetcher by name
- `requiredGet(name: string): Fetcher` - Get a fetcher by name, throws if not found
- `fetchers: Map<string, Fetcher>` - Get all registered fetchers

### UrlBuilder Class

URL builder for constructing complete URLs with parameters.

#### Methods

- `build(path: string, pathParams?: Record<string, any>, queryParams?: Record<string, any>): string` - Build complete URL

### InterceptorManager Class

Interceptor manager for managing multiple interceptors of the same type.

#### Methods

- `use(interceptor: Interceptor): number` - Add interceptor, returns interceptor ID
- `eject(index: number): void` - Remove interceptor by ID
- `clear(): void` - Clear all interceptors
- `intercept(exchange: FetchExchange): Promise<FetchExchange>` - Execute all interceptors sequentially

### FetcherInterceptors Class

Fetcher interceptor collection, including request, response, and error interceptor managers.

#### Properties

- `request: InterceptorManager` - Request interceptor manager
- `response: InterceptorManager` - Response interceptor manager
- `error: InterceptorManager` - Error interceptor manager

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
  intercept(exchange) {
    return {
      ...exchange,
      request: {
        ...exchange.request,
        headers: {
          ...exchange.request.headers,
          Authorization: 'Bearer ' + getAuthToken(),
        },
      },
    };
  },
});

// Add response interceptor - Process response
fetcher.interceptors.response.use({
  intercept(exchange) {
    // Note: Response processing would typically happen after the response is received
    return exchange;
  },
});

// Add error interceptor - Unified error handling
fetcher.interceptors.error.use({
  intercept(exchange) {
    if (exchange.error?.name === 'FetchTimeoutError') {
      console.error('Request timeout:', exchange.error.message);
    } else {
      console.error('Network error:', exchange.error?.message);
    }
    return exchange;
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
