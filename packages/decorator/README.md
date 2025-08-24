# @ahoo-wang/fetcher-decorator

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-decorator.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)

Decorator support for Fetcher HTTP client. Enables clean, declarative API service definitions using TypeScript
decorators.

## 🌟 Features

- **🎨 Clean API Definitions**: Define HTTP services using intuitive decorators
- **🧭 Automatic Parameter Binding**: Path, query, header, and body parameters automatically bound
- **⏱️ Configurable Timeouts**: Per-method and per-class timeout settings
- **🔗 Fetcher Integration**: Seamless integration with Fetcher's named fetcher system
- **🛡️ TypeScript Support**: Complete TypeScript type definitions
- **⚡ Automatic Implementation**: Methods automatically implemented with HTTP calls
- **📦 Metadata System**: Rich metadata support for advanced customization

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @ahoo-wang/fetcher-decorator

# Using pnpm
pnpm add @ahoo-wang/fetcher-decorator

# Using yarn
yarn add @ahoo-wang/fetcher-decorator
```

### Basic Usage

```typescript
import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';
import {
  api,
  get,
  post,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';

// Create and register a fetcher
const userFetcher = new NamedFetcher('user', {
  baseURL: 'https://api.user-service.com',
});

// Define your service class with decorators
@api('/users', { fetcher: 'user', timeout: 10000 })
class UserService {
  @post('/', { timeout: 5000 })
  createUser(@body() user: User): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }

  @get('/{id}')
  getUser(
    @path('id') id: number,
    @query('include') include: string,
  ): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }
}

// Use the service
const userService = new UserService();
const response = await userService.createUser({ name: 'John' });
```

## 📚 API Reference

### Class Decorators

#### `@api(basePath, metadata)`

Defines API metadata for a class.

**Parameters:**

- `basePath`: Base path for all endpoints in the class
- `metadata`: Additional metadata for the API
    - `headers`: Default headers for all requests in the class
    - `timeout`: Default timeout for all requests in the class
    - `fetcher`: Name of the fetcher instance to use (default: 'default')

**Example:**

```typescript
@api('/api/v1', {
  headers: { 'X-API-Version': '1.0' },
  timeout: 5000,
  fetcher: 'api',
})
class ApiService {
  // ...
}
```

### Method Decorators

#### `@get(path, metadata)`

Defines a GET endpoint.

#### `@post(path, metadata)`

Defines a POST endpoint.

#### `@put(path, metadata)`

Defines a PUT endpoint.

#### `@del(path, metadata)`

Defines a DELETE endpoint.

#### `@patch(path, metadata)`

Defines a PATCH endpoint.

#### `@head(path, metadata)`

Defines a HEAD endpoint.

#### `@options(path, metadata)`

Defines an OPTIONS endpoint.

**Common parameters:**

- `path`: Path for the endpoint (relative to class base path)
- `metadata`: Additional metadata for the endpoint
    - `headers`: Headers for the request
    - `timeout`: Timeout for the request
    - `fetcher`: Name of the fetcher instance to use

**Example:**

```typescript
class UserService {
  @get('/{id}', { timeout: 3000 })
  getUser(@path('id') id: number): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }

  @post('/', { headers: { 'Content-Type': 'application/json' } })
  createUser(@body() user: User): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }
}
```

### Parameter Decorators

#### `@path(name)`

Defines a path parameter.

**Parameters:**

- `name`: Name of the parameter (used in the path template)

#### `@query(name)`

Defines a query parameter.

**Parameters:**

- `name`: Name of the parameter (used in the query string)

#### `@body()`

Defines a request body.

#### `@header(name)`

Defines a header parameter.

**Parameters:**

- `name`: Name of the header

**Example:**

```typescript
class UserService {
  @get('/search')
  searchUsers(
    @query('q') query: string,
    @query('limit') limit: number,
    @header('Authorization') auth: string,
  ): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }

  @put('/{id}')
  updateUser(@path('id') id: number, @body() user: User): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }
}
```

## 🛠️ Advanced Usage

### Inheritance Support

```typescript
@api('/base')
class BaseService {
  @get('/status')
  getStatus(): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }
}

@api('/users')
class UserService extends BaseService {
  @get('/{id}')
  getUser(@path('id') id: number): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }
}
```

### Complex Parameter Handling

```typescript
@api('/api')
class ComplexService {
  @post('/batch')
  batchOperation(
    @body() items: Item[],
    @header('X-Request-ID') requestId: string,
    @query('dryRun') dryRun: boolean = false,
  ): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }
}
```

## 🧪 Testing

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

Apache-2.0

---

<p align="center">
  Part of the <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> ecosystem
</p>
