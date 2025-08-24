# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

A modern, ultra-lightweight (1.9kB) HTTP client with built-in path parameters, query parameters, and Axios-like API. 86%
smaller than Axios while providing the same powerful features.

## 🌟 Features

- **⚡ Ultra-Lightweight**: Only 1.9kB min+gzip - 86% smaller than Axios
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
  path: { id: 123 },
  query: { include: 'profile' },
});
const userData = await response.json();

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
const data = await response.json();
```

## 🔗 Interceptor System

### Request Interceptors

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Add request interceptor (e.g., for authentication)
const interceptorId = fetcher.interceptors.request.use({
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

// Remove interceptor
fetcher.interceptors.request.eject(interceptorId);
```

### Response Interceptors

```typescript
// Add response interceptor (e.g., for logging)
fetcher.interceptors.response.use({
  intercept(exchange) {
    console.log('Response received:', exchange.response.status);
    return exchange;
  },
});
```

### Error Interceptors

```typescript
// Add error interceptor (e.g., for unified error handling)
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

#### InterceptorManager

Interceptor manager for managing multiple interceptors of the same type.

**Methods:**

- `use(interceptor: Interceptor): number` - Add interceptor, returns interceptor ID
- `eject(index: number): void` - Remove interceptor by ID
- `clear(): void` - Clear all interceptors
- `intercept(exchange: FetchExchange): Promise<FetchExchange>` - Execute all interceptors sequentially

#### FetcherInterceptors

Fetcher interceptor collection, including request, response, and error interceptor managers.

**Properties:**

- `request: InterceptorManager` - Request interceptor manager
- `response: InterceptorManager` - Response interceptor manager
- `error: InterceptorManager` - Error interceptor manager

## 🛠️ Development

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage
```

## 🤝 Contributing

Contributions are welcome! Please see
the [contributing guide](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the [Apache-2.0 License](https://opensource.org/licenses/Apache-2.0).

---

<p align="center">
  Part of the <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> ecosystem
</p>
