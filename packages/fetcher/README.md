# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

A modern, ultra-lightweight (2.3KiB) HTTP client with built-in path parameters, query parameters, and Axios-like API.
83%
smaller than Axios while providing the same powerful features.

## 🌟 Features

- **⚡ Ultra-Lightweight**: Only 2.3KiB min+gzip - 83% smaller than Axios
- **🧭 Path & Query Parameters**: Built-in support for path (`{id}`) and query parameters
- **🔗 Interceptor System**: Request, response, and error interceptors for middleware patterns
- **⏱️ Timeout Control**: Configurable request timeouts with proper error handling
- **🔄 Fetch API Compatible**: Fully compatible with the native Fetch API
- **🛡️ TypeScript Support**: Complete TypeScript definitions for type-safe development
- **🧩 Modular Architecture**: Lightweight core with optional extension packages
- **📦 Named Fetcher Support**: Automatic registration and retrieval of fetcher instances
- **⚙️ Default Fetcher**: Pre-configured default fetcher instance for quick start

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @ahoo-wang/fetcher

# Using pnpm
pnpm add @ahoo-wang/fetcher

# Using yarn
yarn add @ahoo-wang/fetcher
```

### Basic Usage

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

// Create a fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// GET request with path and query parameters
const response = await fetcher.get('/users/{id}', {
  urlParams: {
    path: { id: 123 },
    query: { include: 'profile' },
  },
});
const userData = await response.json<User>();

// POST request with automatic JSON conversion
const createUserResponse = await fetcher.post('/users', {
  body: { name: 'John Doe', email: 'john@example.com' },
});
```

### Named Fetcher Usage

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

// Retrieve a named fetcher from the registrar
const retrievedFetcher = fetcherRegistrar.get('api');
if (retrievedFetcher) {
  const response = await retrievedFetcher.get('/users/123');
}

// Use requiredGet to retrieve a fetcher (throws error if not found)
try {
  const authFetcher = fetcherRegistrar.requiredGet('auth');
  await authFetcher.post('/login', {
    body: { username: 'user', password: 'pass' },
  });
} catch (error) {
  console.error('Fetcher not found:', error.message);
}
```

### Default Fetcher Usage

```typescript
import { fetcher } from '@ahoo-wang/fetcher';

// Use the default fetcher directly
const response = await fetcher.get('/users');
const data = await response.json<User>();
```

## 🔗 Interceptor System

### Core Concepts

The interceptor system in Fetcher follows the middleware pattern, allowing you to intercept and modify requests,
responses, and errors at different stages of the HTTP request lifecycle.

#### Interceptor Types

1. **Request Interceptors**: Process requests before they are sent
2. **Response Interceptors**: Process responses after they are received
3. **Error Interceptors**: Handle errors that occur during the request process

#### Built-in Interceptors

Fetcher comes with several built-in interceptors that are automatically registered:

1. **UrlResolveInterceptor**: Resolves URLs with path and query parameters (order: Number.MIN_SAFE_INTEGER + 100)
2. **RequestBodyInterceptor**: Converts object bodies to JSON strings (order: Number.MIN_SAFE_INTEGER + 200)
3. **FetchInterceptor**: Executes the actual HTTP request (order: Number.MAX_SAFE_INTEGER - 100)

### Using Interceptors

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Add request interceptor (e.g., for authentication)
const success = fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 100,
  intercept(exchange) {
    exchange.request = {
      ...exchange.request,
      headers: {
        ...exchange.request.headers,
        Authorization: 'Bearer ' + getAuthToken(),
      },
    };
  },
});

// Add response interceptor (e.g., for logging)
fetcher.interceptors.response.use({
  name: 'logging-interceptor',
  order: 10,
  intercept(exchange) {
    console.log('Response received:', exchange.response?.status);
  },
});

// Add error interceptor (e.g., for unified error handling)
fetcher.interceptors.error.use({
  name: 'error-interceptor',
  order: 50,
  intercept(exchange) {
    if (exchange.error?.name === 'FetchTimeoutError') {
      console.error('Request timeout:', exchange.error.message);
    } else {
      console.error('Network error:', exchange.error?.message);
    }
  },
});

// Remove interceptor by name
fetcher.interceptors.request.eject('auth-interceptor');
```

### Ordered Execution

The `OrderedCapable` system allows you to control the execution order of interceptors and other components.

#### Ordering Concept

```typescript
import { OrderedCapable } from '@ahoo-wang/fetcher';

// Lower order values have higher priority
const highPriority: OrderedCapable = { order: 1 }; // Executes first
const mediumPriority: OrderedCapable = { order: 10 }; // Executes second
const lowPriority: OrderedCapable = { order: 100 }; // Executes last
```

#### Interceptor Ordering

```typescript
// Add interceptors with different orders
fetcher.interceptors.request.use({
  name: 'timing-interceptor',
  order: 5, // Executes very early
  intercept(exchange) {
    console.log('Very early timing');
    return exchange;
  },
});

fetcher.interceptors.request.use({
  name: 'logging-interceptor',
  order: 10, // Executes early
  intercept(exchange) {
    console.log('Early logging');
    return exchange;
  },
});

fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 50, // Executes later
  intercept(exchange) {
    // Add auth headers
    return exchange;
  },
});

// Execution order will be:
// 1. timing-interceptor (order: 5)
// 2. logging-interceptor (order: 10)
// 3. auth-interceptor (order: 50)
```

## 📚 API Reference

### Fetcher Class

Core HTTP client class that provides various HTTP methods.

#### Constructor

```typescript
new Fetcher(options ? : FetcherOptions);
```

**Options:**

- `baseURL`: Base URL for all requests
- `timeout`: Request timeout in milliseconds
- `headers`: Default request headers
- `interceptors`: Interceptor collection for request, response, and error handling

#### Methods

- `fetch(url: string, request?: FetcherRequest): Promise<Response>` - Generic HTTP request method
- `get(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - GET request
- `post(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - POST request
- `put(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - PUT request
- `delete(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - DELETE request
- `patch(url: string, request?: Omit<FetcherRequest, 'method'>): Promise<Response>` - PATCH request
- `head(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - HEAD request
- `options(url: string, request?: Omit<FetcherRequest, 'method' | 'body'>): Promise<Response>` - OPTIONS request

#### Properties

- `urlBuilder`: URL builder instance for constructing URLs
- `headers`: Default request headers
- `timeout`: Default request timeout
- `interceptors`: Interceptor collection for request, response, and error handling

### FetcherRequest Interface

Configuration options for HTTP requests.

**Properties:**

- `method`: HTTP method (GET, POST, PUT, DELETE, etc.)
- `headers`: Request headers
- `body`: Request body (can be object, string, Blob, etc.)
- `path`: Path parameters for URL templating
- `query`: Query parameters for URL query string
- `timeout`: Request timeout in milliseconds

### Response Extension

To provide better TypeScript support, we extend the native Response interface with a type-safe json() method:

```typescript
// Now you can use it with type safety
const response = await fetcher.get('/users/123');
const userData = await response.json<User>(); // Type is Promise<User>
```

### NamedFetcher Class

An extension of the Fetcher class that automatically registers itself with the global fetcherRegistrar.

#### Constructor

```typescript
new NamedFetcher(name
:
string, options ? : FetcherOptions
)
;
```

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

### Interceptor System

#### Interceptor Interface

Interceptor interface that defines the basic structure of interceptors.

**Properties:**

- `name: string` - The name of the interceptor, used to identify it, must be unique
- `order: number` - The execution order of the interceptor, smaller values have higher priority

**Methods:**

- `intercept(exchange: FetchExchange): void | Promise<void>` - Intercept and process data

#### InterceptorManager Class

Interceptor manager for managing multiple interceptors of the same type.

**Methods:**

- `use(interceptor: Interceptor): boolean` - Add interceptor, returns whether the addition was successful
- `eject(name: string): boolean` - Remove interceptor by name, returns whether the removal was successful
- `clear(): void` - Clear all interceptors
- `intercept(exchange: FetchExchange): Promise<void>` - Execute all interceptors in sequence

#### FetcherInterceptors Class

Fetcher interceptor collection, including request, response, and error interceptor managers.

**Properties:**

- `request: InterceptorManager` - Request interceptor manager
- `response: InterceptorManager` - Response interceptor manager
- `error: InterceptorManager` - Error interceptor manager

## 🤝 Contributing

Contributions are welcome! Please see
the [contributing guide](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the [Apache-2.0 License](https://opensource.org/licenses/Apache-2.0).

---

<p align="center">
  Part of the <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> ecosystem
</p>
