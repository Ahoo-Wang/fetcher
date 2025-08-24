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

## Decorators

### Class Decorators

- `@api(basePath, metadata)` - Define API metadata for a class

### Method Decorators

- `@get(path, metadata)` - Define a GET endpoint
- `@post(path, metadata)` - Define a POST endpoint
- `@put(path, metadata)` - Define a PUT endpoint
- `@del(path, metadata)` - Define a DELETE endpoint
- `@patch(path, metadata)` - Define a PATCH endpoint
- `@head(path, metadata)` - Define a HEAD endpoint
- `@options(path, metadata)` - Define an OPTIONS endpoint

### Parameter Decorators

- `@path(name)` - Define a path parameter
- `@query(name)` - Define a query parameter
- `@body()` - Define a request body
- `@header(name)` - Define a header parameter

## License

Apache-2.0
