# Fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

A modern, ultra-lightweight (1.9kB) HTTP client with built-in path parameters, query parameters, and Axios-like API. 86%
smaller than Axios while providing the same powerful features.

## 🌟 Features

#### [`@ahoo-wang/fetcher`](./packages/fetcher)

- **⚡ Ultra-Lightweight**: Only 1.9kB min+gzip - 86% smaller than Axios
- **🧭 Path & Query Parameters**: Built-in support for path (`{id}`) and query parameters
- **🔗 Interceptor System**: Request, response, and error interceptors for middleware patterns
- **⏱️ Timeout Control**: Configurable request timeouts with proper error handling
- **🔄 Fetch API Compatible**: Fully compatible with the native Fetch API
- **🛡️ TypeScript Support**: Complete TypeScript definitions for type-safe development
- **🧩 Modular Architecture**: Lightweight core with optional extension packages
- **📦 Named Fetcher Support**: Automatic registration and retrieval of fetcher instances
- **⚙️ Default Fetcher**: Pre-configured default fetcher instance for quick start

#### [`@ahoo-wang/fetcher-decorator`](./packages/decorator)

- **🎨 Clean API Definitions**: Define HTTP services using intuitive decorators
- **🧭 Automatic Parameter Binding**: Path, query, header, and body parameters automatically bound
- **⏱️ Configurable Timeouts**: Per-method and per-class timeout settings
- **🔗 Fetcher Integration**: Seamless integration with Fetcher's named fetcher system
- **⚡ Automatic Implementation**: Methods automatically implemented with HTTP calls
- **📦 Metadata System**: Rich metadata support for advanced customization

#### [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream)

- **📡 Event Stream Conversion**: Converts `text/event-stream` responses to async generators of `ServerSentEvent` objects
- **🔌 Interceptor Integration**: Automatically adds `eventStream()` method to responses with `text/event-stream` content
  type
- **📋 SSE Parsing**: Parses Server-Sent Events according to the specification, including data, event, id, and retry
  fields
- **🔄 Streaming Support**: Handles chunked data and multi-line events correctly
- **💬 Comment Handling**: Properly ignores comment lines (lines starting with `:`) as per SSE specification
- **⚡ Performance Optimized**: Efficient parsing and streaming for high-performance applications

#### [`@ahoo-wang/fetcher-cosec`](./packages/cosec)

- **🔐 Automatic Authentication**: Automatic CoSec authentication headers
- **📱 Device Management**: Device ID management with localStorage persistence
- **🔄 Token Refresh**: Automatic token refresh based on response codes (401)
- **🌈 Request Tracking**: Unique request ID generation for tracking
- **💾 Token Storage**: Secure token storage management

## 📦 Packages

| Package                                                    | Description                                               | Version                                                                                                                                 | Npm Bundle Size                                                                                                                                                   |
|------------------------------------------------------------|-----------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`@ahoo-wang/fetcher`](./packages/fetcher)                 | Ultra-lightweight (1.9kB) HTTP client with Axios-like API | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         |
| [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) | Server-Sent Events (SSE) support for Fetcher HTTP client  | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventstream)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) |
| [`@ahoo-wang/fetcher-cosec`](./packages/cosec)             | CoSec authentication integration for Fetcher HTTP client  | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             |
| [`@ahoo-wang/fetcher-decorator`](./packages/decorator)     | TypeScript decorators for Fetcher HTTP client             | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-decorator)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     |

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
  path: { id: 123 },
  query: { include: 'profile' },
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

### Version Management

To update the version of all packages in the workspace at once, use the following command:

```bash
pnpm update-version <new-version>
```

This will update the version field in all `package.json` files across the monorepo, including the root package and all
workspace packages.

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
