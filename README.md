# Fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

A modern, lightweight HTTP client library based on the Fetch API, designed to simplify and optimize interactions with
backend RESTful APIs. It provides an Axios-like API with support for path parameters, query parameters, timeout
settings, and request/response interceptors.

## 🌟 Features

- **🔄 Fetch API Compatible**: Fully compatible with the native Fetch API for easy adoption
- **🧭 Path & Query Parameters**: Native support for path parameters (`{id}`) and query parameters
- **⏱️ Timeout Control**: Configurable request timeouts with proper error handling
- **🔗 Interceptor System**: Request, response, and error interceptors for middleware patterns
- **📡 Event Stream Support**: Built-in Server-Sent Events (SSE) support via `@ahoo-wang/fetcher-eventstream`
- **🎯 Automatic Body Conversion**: Converts JavaScript objects to JSON with proper headers
- **🛡️ TypeScript Support**: Complete TypeScript definitions for type-safe development
- **🧩 Modular Architecture**: Lightweight core with optional extension packages
- **📱 Authentication Ready**: CoSec authentication support via `@ahoo-wang/fetcher-cosec`
- **🎨 Decorator Support**: TypeScript decorators for clean API service definitions via `@ahoo-wang/fetcher-decorator`

## 📦 Packages

| Package                                                    | Description                      | Version                                                                                                                                 |
|------------------------------------------------------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| [`@ahoo-wang/fetcher`](./packages/fetcher)                 | Core HTTP client library         | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         |
| [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) | Server-Sent Events (SSE) support | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) |
| [`@ahoo-wang/fetcher-cosec`](./packages/cosec)             | CoSec authentication integration | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             |
| [`@ahoo-wang/fetcher-decorator`](./packages/decorator)     | TypeScript decorator support     | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     |

## 🚀 Quick Start

### Installation

```bash
# Core package
npm install @ahoo-wang/fetcher

# Or with pnpm
pnpm add @ahoo-wang/fetcher

# Or with yarn
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
  pathParams: { id: 123 },
  queryParams: { include: 'profile' },
});
const userData = await response.json();

// POST request with automatic JSON conversion
const createUserResponse = await fetcher.post('/users', {
  body: { name: 'John Doe', email: 'john@example.com' },
});
```

### Decorator-Based Services

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';
import {
  api,
  get,
  post,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';

// Register a named fetcher
const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
});

// Define service with decorators
@api('/users', { fetcher: 'api' })
class UserService {
  @get('/')
  getUsers(@query('limit') limit?: number): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }

  @post('/')
  createUser(@body() user: User): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }

  @get('/{id}')
  getUser(@path('id') id: number): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }
}

// Use the service
const userService = new UserService();
const response = await userService.getUsers(10);
```

### Using Interceptors

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Add request interceptor (e.g., for authentication)
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

// Add response interceptor (e.g., for logging)
fetcher.interceptors.response.use({
  intercept(exchange) {
    console.log('Response received:', exchange.response.status);
    return exchange;
  },
});
```

### Server-Sent Events

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
fetcher.interceptors.response.use(new EventStreamInterceptor());

// Stream real-time events
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('Event received:', event);
  }
}
```

## 📚 Examples

Explore comprehensive examples in the [examples](./examples) directory:

1. **Basic HTTP Operations** - GET, POST, PUT, DELETE requests
2. **Parameter Handling** - Path parameters, query parameters, request bodies
3. **Interceptor Patterns** - Authentication, logging, error handling
4. **Timeout Management** - Request timeout configuration and handling
5. **Event Streaming** - Real-time Server-Sent Events
6. **Decorator Usage** - Clean API service definitions with TypeScript decorators

## 🛠️ Development

### Prerequisites

- Node.js >= 16
- pnpm >= 8

### Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Format code
pnpm format

# Clean build artifacts
pnpm clean
```

## 🤝 Contributing

Contributions are welcome! Please see the [contributing guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the [Apache-2.0 License](./LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Ahoo-Wang">Ahoo-Wang</a>
</p>
