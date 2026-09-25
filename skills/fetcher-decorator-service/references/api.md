# Fetcher Decorator Service API Reference

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [CommonJS](#commonjs)
- [Core Concepts](#core-concepts)
  - [1. Service Definition with `@api()`](#1-service-definition-with-api)
  - [2. HTTP Method Decorators](#2-http-method-decorators)
  - [3. Parameter Decorators](#3-parameter-decorators)
  - [4. AbortSignal / AbortController Auto-Detection](#4-abortsignal--abortcontroller-auto-detection)
  - [5. EndpointReturnType](#5-endpointreturntype)
  - [6. Result Extractors](#6-result-extractors)
  - [7. Lifecycle Hooks](#7-lifecycle-hooks)
  - [8. Service Inheritance](#8-service-inheritance)
  - [9. Fetcher Resolution Priority](#9-fetcher-resolution-priority)
- [Auto-Generated Error Pattern](#auto-generated-error-pattern)
- [Complete Example: CRUD Service](#complete-example-crud-service)
- [Key Imports](#key-imports)
- [Further Reading](#further-reading)

Create clean, declarative API services using `@ahoo-wang/fetcher-decorator`.

## Prerequisites

`reflect-metadata` ships as a direct dependency of `@ahoo-wang/fetcher-decorator` and is imported by the package itself, so decorators work without extra setup. Import it explicitly at your entry point only if other libraries in your app rely on it:

```typescript
import 'reflect-metadata';
```

The decorators are legacy TypeScript decorators (parameter decorators do not exist in TC39 standard decorators): the consuming `tsconfig.json` needs `"experimentalDecorators": true`; `emitDecoratorMetadata` is not needed. Compiled as standard decorators, `@api` and the method decorators throw a TypeError that names `experimentalDecorators`. Babel builds need `@babel/plugin-proposal-decorators` in `legacy` mode.

## Installation

```bash
pnpm add @ahoo-wang/fetcher-decorator
```

## CommonJS

The package supports ESM and CommonJS. `require('@ahoo-wang/fetcher-decorator')`
uses `dist/index.umd.cjs`; ESM imports use `dist/index.es.js`. Save this example
as a `.cjs` file and run it with Node:

```javascript
const { api, EndpointReturnType } = require('@ahoo-wang/fetcher-decorator');

class UserService {}
api('/users', { returnType: EndpointReturnType.RESULT })(UserService);
console.log(new UserService() instanceof UserService); // true
```

`api` and `EndpointReturnType` are runtime exports. Interfaces such as
`ApiMetadata` remain TypeScript-only and use `import type`.

## Core Concepts

### 1. Service Definition with `@api()`

```typescript
import { api } from '@ahoo-wang/fetcher-decorator';
import { NamedFetcher } from '@ahoo-wang/fetcher';

const userFetcher = new NamedFetcher('user', {
  baseURL: 'https://api.example.com',
});

@api('/users', { fetcher: 'user' })
export class UserService {
  // Methods will be auto-implemented
}
```

**@api(basePath = '', options = {})** — `basePath` is the first positional argument; `options` is `Omit<ApiMetadata, 'basePath'>`:

- `fetcher` (string | Fetcher) - Name or instance of the fetcher to use
- `timeout` (number) - Default timeout for all requests (ms)
- `headers` (RequestHeaders) - Default headers for all requests
- `attributes` (Record<string, any>) - Default attributes (accessible by interceptors)
- `resultExtractor` - Default result extractor for all methods
- `returnType` (EndpointReturnType) - Default return type (RESULT or EXCHANGE)
- `urlParams` (UrlParams) - Default URL path and query parameters

### 2. HTTP Method Decorators

```text
@get(path, options)      // GET request
@post(path, options)     // POST request
@put(path, options)      // PUT request
@patch(path, options)    // PATCH request
@del(path, options)      // DELETE request
@head(path, options)     // HEAD request
@options(path, options)  // OPTIONS request
@endpoint(HttpMethod.TRACE, '/path', options) // Generic: any HTTP method (there is no @trace)
```

`path` defaults to `''`. The DELETE decorator is `del` (not `delete`). `HttpMethod` comes from `@ahoo-wang/fetcher`.

**Method decorator options** (`@get(path, options)` — `path` is the first positional argument, not an option field):

- `timeout` (number) - Per-method timeout override (ms)
- `headers` (RequestHeaders) - Method-specific headers; header names are matched case-insensitively across API, method and parameter layers (later values win).
- `fetcher` (string | Fetcher) - Override the fetcher for this method
- `basePath` (string) - Per-method base path override (falls back to the class-level `@api()` basePath); the final URL is `combineURLs(basePath, path)`, then joined to the fetcher's `baseURL`
- `resultExtractor` - Override result extractor for this method
- `returnType` (EndpointReturnType) - Override return type for this method
- `attributes` (Record<string, any>) - Method-specific attributes
- `urlParams` (UrlParams) - Method-specific URL parameters

### 3. Parameter Decorators

`@path`, `@query` and `@header` support **object expansion**: pass a plain object (an object literal or `Object.create(null)`) and its keys are expanded into individual parameters. An unnamed `@attribute()` merges a plain object or `Map` the same way; a named `@attribute('user')` stores the value under `user` whatever it is.

- Only plain objects are expanded. An array, a `Date`, a class instance or a primitive is bound to the parameter name (explicit, else inferred, else `param<index>`) and serialized by fetcher: `@query('ids') ids: number[]` sends `ids=1&ids=2`, a `Date` is sent as ISO 8601, and an array header is sent as a `, `-joined list.
- `undefined`/`null` arguments to `@path`/`@query`/`@header` are skipped, and so are `undefined`/`null` entries of an expanded `@path`/`@query` object; an `undefined`/`null` entry of a `@header` object removes that header.
- When the name is omitted (`@path()`), it is read from the compiled function source (`Function.prototype.toString`); commas inside defaults, strings and comments are handled, a destructured parameter has no name, and a rest parameter's name drops the `...`. Minifiers rename parameters, so pass explicit names in bundled code; a placeholder (in the fetcher's `urlTemplateStyle`) with no path parameter after every layer, `@request` included, is merged logs a `[fetcher-decorator]` warning, and URL resolution then fails with `Missing required path parameter` unless an interceptor supplies it.
- Only one body is sent: if several arguments carry `@body()`, the right-most one wins. `@request()` takes a `ParameterRequest` (`FetchRequestInit` plus `path`) that is merged over the decorator-built request with `mergeRequest`, so its `method`, `body`, `timeout`, headers and `urlParams` win; its `path` replaces the endpoint path.

```text
@get('/{userId}/posts')
getUserPosts(@path('userId') userId: string): Promise<Post[]> {
  throw autoGeneratedError();
}
// Auto-extract name if omitted:
@get('/{userId}')
getUser(@path() userId: string): Promise<User> { throw autoGeneratedError(); }
// Object expansion:
@get('/users/{id}/posts/{postId}')
getUserPost(@path() params: { id: string; postId: string }): Promise<Post> { throw autoGeneratedError(); }

@get('/posts')
filterPosts(@query('userId') userId?: string, @query('completed') completed?: boolean): Promise<Post[]> {
  throw autoGeneratedError();
}
// Object expansion:
@get('/posts')
searchPosts(@query() filters: { limit: number; offset: number }): Promise<Post[]> { throw autoGeneratedError(); }

@post('/users')
createUser(@body() user: User): Promise<User> { throw autoGeneratedError(); }

@post('/users')
createUser(@body() user: User, @header('X-Request-ID') requestId?: string): Promise<User> { throw autoGeneratedError(); }
// Object expansion:
@get('/data')
getData(@header() headers: { 'X-API-Key': string; 'X-Version': string }): Promise<Data> { throw autoGeneratedError(); }

@get('/users/{id}')
getUser(@path('id') id: string, @attribute('traceId') traceId: string): Promise<User> { throw autoGeneratedError(); }
// Object/Map expansion:
@get('/users/{id}')
getUser(@path('id') id: string, @attribute() attrs: Map<string, any>): Promise<User> { throw autoGeneratedError(); }

@post('/batch')
batchOperation(@request() request: ParameterRequest): Promise<Response> { throw autoGeneratedError(); }
```

### 4. AbortSignal / AbortController Auto-Detection

If a method argument is an `AbortSignal` or `AbortController`, it is automatically used for request cancellation -- no decorator needed. Either one applies together with the fetcher timeout: core `timeoutFetch` combines the caller's signal or controller with its timer, and whichever fires first aborts the call.

```text
@get('/{id}')
getUser(@path() id: string, signal: AbortSignal): Promise<User> {
  throw autoGeneratedError();
}

// Usage:
const controller = new AbortController();
const user = await userService.getUser('123', controller.signal);
// controller.abort() to cancel
```

### 5. EndpointReturnType

Controls what decorated methods return. Set via `@api()` or method decorator options. Enum values: `EndpointReturnType.RESULT = 'Result'` (default) and `EndpointReturnType.EXCHANGE = 'Exchange'`. With `EXCHANGE` the exchange is returned after the interceptors run, and the result extractor is not invoked.

```typescript
import { EndpointReturnType } from '@ahoo-wang/fetcher-decorator';

// RESULT (default): returns the extracted result (e.g., parsed JSON)
// EXCHANGE: returns the full FetchExchange object
@api('/users', { fetcher: myFetcher, returnType: EndpointReturnType.EXCHANGE })
export class UserService {
  @get('/{id}')
  getUser(@path() id: string): Promise<FetchExchange> {
    throw autoGeneratedError();
  }

  @get('/{id}', { returnType: EndpointReturnType.RESULT })
  getUserResult(@path() id: string): Promise<User> {
    throw autoGeneratedError();
  }
}
```

### 6. Result Extractors

Core extractors from `@ahoo-wang/fetcher`:

| Extractor                      | Returns         | Use Case                                                                        |
| ------------------------------ | --------------- | ------------------------------------------------------------------------------- |
| `ResultExtractors.Json`        | Parsed JSON     | REST APIs (**decorator default**; plain `fetcher.get()` defaults to `Response`) |
| `ResultExtractors.Response`    | `Response`      | Need status/headers                                                             |
| `ResultExtractors.Exchange`    | `FetchExchange` | Full request/response access                                                    |
| `ResultExtractors.Text`        | Plain text      | Text responses                                                                  |
| `ResultExtractors.Blob`        | `Blob`          | Binary data                                                                     |
| `ResultExtractors.ArrayBuffer` | `ArrayBuffer`   | Raw binary data                                                                 |
| `ResultExtractors.Bytes`       | `Uint8Array`    | Byte arrays                                                                     |

Event stream extractors from `@ahoo-wang/fetcher-eventstream`:

| Extractor                        | Returns                     | Use Case           |
| -------------------------------- | --------------------------- | ------------------ |
| `EventStreamResultExtractor`     | `ServerSentEventStream`     | SSE streaming      |
| `JsonEventStreamResultExtractor` | `JsonServerSentEventStream` | LLM streaming APIs |

```typescript
import { ResultExtractors } from '@ahoo-wang/fetcher';
import {
  EventStreamResultExtractor,
  JsonEventStreamResultExtractor,
} from '@ahoo-wang/fetcher-eventstream';

@api('/users', { fetcher: myFetcher })
export class UserService {
  @get('/{id}', { resultExtractor: ResultExtractors.Response })
  getUserResponse(@path() id: number): Promise<Response> {
    throw autoGeneratedError();
  }

  @get('/{id}/stream', { resultExtractor: EventStreamResultExtractor })
  getUserStream(@path() id: string): Promise<ServerSentEventStream> {
    throw autoGeneratedError();
  }
}
```

### 7. Lifecycle Hooks

Implement `ExecuteLifeCycle` to hook into request execution:

```typescript
import type { ExecuteLifeCycle } from '@ahoo-wang/fetcher-decorator';
import type { FetchExchange } from '@ahoo-wang/fetcher';

@api('/users', { fetcher: myFetcher })
export class UserService implements ExecuteLifeCycle {
  @get('/{id}')
  getUser(@path() id: number): Promise<User> {
    throw autoGeneratedError();
  }

  beforeExecute(exchange: FetchExchange): void | Promise<void> {
    exchange.ensureRequestHeaders()['X-Custom-Header'] = 'value';
  }

  afterExecute(exchange: FetchExchange): void | Promise<void> {
    // Only reached when the exchange succeeded (or an error interceptor recovered it).
    console.debug(exchange.request.url, exchange.response?.status);
  }
}
```

**Execution flow:**

1. Fetcher resolved (`getFetcher(endpoint.fetcher ?? api.fetcher)`), then method arguments resolved into request config
2. `FetchExchange` created with `fetcher.resolveExchange()` (fetcher default headers/timeout merged in); attributes also carry the service instance under `DECORATOR_TARGET_ATTRIBUTE_KEY` and the `FunctionMetadata` under `DECORATOR_METADATA_ATTRIBUTE_KEY`
3. `beforeExecute` hook called -- before any request interceptor, so `request.url` is still the unresolved template and `urlParams` are editable
4. `fetcher.interceptors.exchange()` runs request, response and error phases
5. `afterExecute` hook called -- **skipped when step 4 throws** (e.g. `HttpStatusValidationError`, an `ExchangeError`, for a 401 under the default `validateStatus`); handle failures in an error interceptor or a `try/catch` at the call site
6. `EXCHANGE` return type returns the exchange; otherwise `exchange.extractResult()` is returned

### 8. Service Inheritance

Child services inherit endpoints from parent services:

```typescript
@api('/users', { fetcher: myFetcher })
export class BaseUserService {
  @get('/status')
  getStatus(): Promise<object> {
    throw autoGeneratedError();
  }
}

@api('/admin/users', { fetcher: myFetcher })
export class AdminUserService extends BaseUserService {
  @get('/{userId}/posts')
  getPosts(@path('userId') userId: string): Promise<Post[]> {
    throw autoGeneratedError();
  }
}
// new AdminUserService().getStatus() -> GET /admin/users/status
```

Note: `@api()` walks the whole prototype chain and rebinds every decorated method on the child class with the child's `@api()` metadata, so inherited endpoints use the child's fetcher and base path. A child base path with a path placeholder (e.g. `/users/{userId}`) therefore breaks every inherited endpoint that has no matching `@path` argument. A child that overrides an inherited endpoint method without decorating the override keeps its own implementation (for example one that calls `super.getStatus()`); decorate the override to redefine the endpoint.

### 9. Fetcher Resolution Priority

Resolution is `getFetcher(endpoint.fetcher ?? api.fetcher)`, where `api` is the class-level `@api()` metadata merged with any instance-level `apiMetadata` override:

1. **Endpoint-level fetcher** (method decorator options, highest priority)
2. **Instance `apiMetadata` property** (`ApiMetadataCapable` — shallow-merges over class metadata per service instance; applies to every `ApiMetadata` field, not only `fetcher`)
3. **Class-level fetcher** (from `@api()` decorator)
4. **Default fetcher** (`fetcherRegistrar.default`, registered as `'default'`)

A string name resolves through `fetcherRegistrar.requiredGet()` at call time and throws `Fetcher <name> not found` if unregistered. The merged metadata is cached per instance and method (in a module-level `WeakMap`, not on the instance) and rebuilt when `apiMetadata` is replaced, so assigning a new `apiMetadata` object takes effect on the next call; mutating the existing object in place does not.

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import type {
  ApiMetadata,
  ApiMetadataCapable,
} from '@ahoo-wang/fetcher-decorator';

const customFetcher = new Fetcher({ baseURL: 'https://custom.com' });

@api('/users', { fetcher: 'class-level' })
class UserService implements ApiMetadataCapable {
  // Declare a mutable apiMetadata field so instances can override class metadata
  apiMetadata?: ApiMetadata;

  @get('/{id}', { fetcher: 'endpoint-level' })
  getUser(@path() id: number): Promise<User> {
    throw autoGeneratedError();
  }
}

const service = new UserService();
service.apiMetadata = { fetcher: customFetcher }; // overrides class-level for this instance
```

## Auto-Generated Error Pattern

The `throw autoGeneratedError()` in method bodies is a placeholder. `@api()` replaces every method that has endpoint metadata on the class prototype at decoration time (except an undecorated override of an inherited endpoint). A replaced method called without its instance throws a `TypeError`; bind it before passing it around. Never put real logic in these methods. `autoGeneratedError(...)` returns an `AutoGenerated` error; its arguments are **ignored** -- they exist only to prevent ESLint `no-unused-vars` errors. If an `AutoGenerated` error is actually thrown, the class is missing `@api()` or the method is missing an endpoint decorator.

```text
// CORRECT - placeholder for auto-generation
@get('/{id}')
getUser(@path() id: number): Promise<User> {
  throw autoGeneratedError(id); // `id` is ignored, but prevents lint error
}

// WRONG - real logic will be overwritten
@get('/{id}')
getUser(@path() id: number): Promise<User> {
  return fetch(`/api/users/${id}`); // This will be replaced!
}
```

## Complete Example: CRUD Service

```typescript
import {
  api,
  autoGeneratedError,
  get,
  post,
  put,
  patch,
  del,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';
import { NamedFetcher } from '@ahoo-wang/fetcher';

const fetcher = new NamedFetcher('api', {
  baseURL: 'https://jsonplaceholder.typicode.com',
});

@api('/posts', { fetcher })
export class PostService {
  @get('')
  getPosts(): Promise<Post[]> {
    throw autoGeneratedError();
  }

  @get('/{postId}')
  getPost(@path('postId') postId: string): Promise<Post> {
    throw autoGeneratedError();
  }

  @post('')
  createPost(@body() post: Post): Promise<Post> {
    throw autoGeneratedError();
  }

  @put('/{postId}')
  updatePost(
    @path('postId') postId: string,
    @body() post: Post,
  ): Promise<Post> {
    throw autoGeneratedError();
  }

  @patch('/{postId}')
  patchPost(
    @path('postId') postId: string,
    @body() post: Partial<Post>,
  ): Promise<Post> {
    throw autoGeneratedError();
  }

  @del('/{postId}')
  deletePost(@path('postId') postId: string): Promise<object> {
    throw autoGeneratedError();
  }

  @get('')
  filterPosts(@query('userId') userId?: string): Promise<Post[]> {
    throw autoGeneratedError();
  }
}
```

## Key Imports

```typescript
import {
  api,
  get,
  post,
  put,
  patch,
  del,
  head,
  options,
  endpoint,
  path,
  query,
  body,
  header,
  request,
  attribute,
  autoGeneratedError,
  EndpointReturnType,
} from '@ahoo-wang/fetcher-decorator';
import type {
  ExecuteLifeCycle,
  ApiMetadata,
  ApiMetadataCapable,
  EndpointMetadata,
  ParameterRequest,
  ParameterMetadata,
} from '@ahoo-wang/fetcher-decorator';
import { HttpMethod, ResultExtractors } from '@ahoo-wang/fetcher';
import type { FetchExchange } from '@ahoo-wang/fetcher';
import {
  EventStreamResultExtractor,
  JsonEventStreamResultExtractor,
} from '@ahoo-wang/fetcher-eventstream';
```

## Further Reading

- [Package README](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/README.md) - Full API documentation
- [CRUD Service Example](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test/src/decorator/typicodePostService.ts) - Complete PostService
- [Inheritance Example](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test/src/decorator/typicodeUserService.ts) - Service inheritance pattern
- [Result Extractor Example](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test/src/decorator/resultExtractorService.ts) - Using different extractors
