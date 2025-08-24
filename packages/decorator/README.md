# @ahoo-wang/fetcher-decorator

Decorator support for Fetcher HTTP client.

## Installation

```bash
npm install @ahoo-wang/fetcher-decorator
```

## Usage

```typescript
import { Fetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';
import {
  api,
  get,
  post,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';

// Create and register a fetcher
const userFetcher = new Fetcher({ baseURL: 'https://api.user-service.com' });
fetcherRegistrar.register('user', userFetcher);

// Define your service class with decorators
@api('/users', { headers: {}, fetcher: 'user', timeout: 10000 })
class UserService {
  @post('/', { headers: {}, timeout: 5000 })
  createUser(@body() user: User): Promise<Response> {
    // Implementation will be generated automatically
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
userService.createUser({ name: 'John' }).then(response => {
  console.log(response);
});
```

## API

### Class Decorators

#### `@api(basePath, metadata)`

Defines API metadata for a class.

- `basePath`: Base path for all endpoints in the class
- `metadata`: Additional metadata for the API
    - `headers`: Default headers for all requests in the class
    - `timeout`: Default timeout for all requests in the class
    - `fetcher`: Name of the fetcher instance to use (default: 'default')

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

Common parameters for all method decorators:

- `path`: Path for the endpoint (relative to class base path)
- `metadata`: Additional metadata for the endpoint
    - `headers`: Headers for the request
    - `timeout`: Timeout for the request
    - `fetcher`: Name of the fetcher instance to use

### Parameter Decorators

#### `@path(name)`

Defines a path parameter.

- `name`: Name of the parameter (used in the path template)

#### `@query(name)`

Defines a query parameter.

- `name`: Name of the parameter (used in the query string)

#### `@body()`

Defines a request body.

#### `@header(name)`

Defines a header parameter.

- `name`: Name of the header

## License

Apache-2.0
