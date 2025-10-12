# @ahoo-wang/fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

The lightweight core that powers the entire Fetcher ecosystem. Ultra-lightweight foundation with Axios-like API.

## 🌟 Features

- **⚡ Ultra-Lightweight**: Only 3KiB min+gzip
- **🧭 Path & Query Parameters**: Built-in support for path (`{id}`/`:id`) and query parameters
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

### URL Template Styles

Fetcher supports different URL template styles for path parameters:

1. **URI Template Style** (default): Uses curly braces, e.g., `/users/{id}/posts/{postId}`
2. **Express Style**: Uses colons, e.g., `/users/:id/posts/:postId`

You can configure the URL template style when creating a Fetcher instance:

```typescript
import { Fetcher, UrlTemplateStyle } from '@ahoo-wang/fetcher';

// Default URI Template style
const fetcher1 = new Fetcher({
  baseURL: 'https://api.example.com',
});

// Explicit URI Template style
const fetcher2 = new Fetcher({
  baseURL: 'https://api.example.com',
  urlTemplateStyle: UrlTemplateStyle.UriTemplate,
});

// Express style
const fetcher3 = new Fetcher({
  baseURL: 'https://api.example.com',
  urlTemplateStyle: UrlTemplateStyle.Express,
});

// Usage with URI Template style
const response1 = await fetcher1.get('/users/{id}', {
  urlParams: {
    path: { id: 123 },
  },
});

// Usage with Express style
const response2 = await fetcher3.get('/users/:id', {
  urlParams: {
    path: { id: 123 },
  },
});
```

### Integration Test Example: Typicode API Integration

The following example shows how to integrate with the JSONPlaceholder API, similar to the integration test in the
Fetcher project. You can find the complete implementation
in [integration-test/src/fetcher/typicodeFetcher.ts](../../integration-test/src/fetcher/typicodeFetcher.ts).

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';
import { cosecRequestInterceptor, cosecResponseInterceptor } from '../cosec';

export const typicodeFetcher = new NamedFetcher('typicode', {
  baseURL: 'https://jsonplaceholder.typicode.com',
});

typicodeFetcher.interceptors.request.use(cosecRequestInterceptor);
typicodeFetcher.interceptors.response.use(cosecResponseInterceptor);
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

1. **UrlResolveInterceptor**: Resolves URLs with path and query parameters (order: Number.MIN_SAFE_INTEGER + 1000)
2. **RequestBodyInterceptor**: Converts object bodies to JSON strings (order: Number.MIN_SAFE_INTEGER + 2000)
3. **FetchInterceptor**: Executes the actual HTTP request (order: Number.MAX_SAFE_INTEGER - 1000)
4. **ValidateStatusInterceptor**: Validates HTTP status codes and throws errors for invalid statuses (response
   interceptor, order: Number.MAX_SAFE_INTEGER - 1000)

### Using Interceptors

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Add request interceptor (e.g., for authentication)
const success = fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 100,
  intercept(exchange) {
    exchange.request.headers.Authorization = 'Bearer ' + getAuthToken();
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

## 🚀 Advanced Usage Examples

### Custom Result Extractors

Create custom result extractors for different response formats:

```typescript
import { Fetcher, ResultExtractor } from '@ahoo-wang/fetcher';

// Custom XML extractor
class XmlResultExtractor implements ResultExtractor<string> {
  async extract(response: Response): Promise<string> {
    const text = await response.text();
    // Parse XML and return as string (simplified example)
    return text;
  }
}

// Custom GraphQL extractor
class GraphQLErrorExtractor implements ResultExtractor<any> {
  async extract(response: Response): Promise<any> {
    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(`GraphQL Error: ${data.errors[0].message}`);
    }

    return data.data;
  }
}

// Usage
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  resultExtractor: new GraphQLErrorExtractor(),
});

// GraphQL query
const result = await fetcher.post('/graphql', {
  body: {
    query: `query { user(id: "123") { name email } }`,
  },
});
```

### Advanced Interceptor Patterns

Implement complex interceptor patterns for enterprise applications:

```typescript
import { Fetcher, FetchInterceptor } from '@ahoo-wang/fetcher';

// Request signing interceptor (e.g., AWS Signature V4)
class RequestSigningInterceptor implements FetchInterceptor {
  name = 'request-signer';
  order = 50;

  async intercept(exchange: any) {
    const { request } = exchange;

    // Generate signature based on request
    const signature = await this.generateSignature(request);

    // Add signature to headers
    request.headers['Authorization'] = `AWS4-HMAC-SHA256 ${signature}`;

    return exchange;
  }

  private async generateSignature(request: any): Promise<string> {
    // Implementation of AWS Signature V4 or similar
    // This is a simplified example
    const timestamp = new Date().toISOString();
    return `Credential=key/${timestamp}/region/service/aws4_request`;
  }
}

// Circuit breaker interceptor
class CircuitBreakerInterceptor implements FetchInterceptor {
  name = 'circuit-breaker';
  order = 25;

  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async intercept(exchange: any) {
    // Check if circuit is open
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      // Proceed with request
      const result = await exchange.proceed();

      // Reset on success
      this.failures = 0;
      return result;
    } catch (error) {
      // Record failure
      this.failures++;
      this.lastFailureTime = Date.now();
      throw error;
    }
  }

  private isCircuitOpen(): boolean {
    if (this.failures < this.threshold) {
      return false;
    }

    // Check if timeout has passed
    return Date.now() - this.lastFailureTime < this.timeout;
  }
}

// Usage
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

fetcher.interceptors.request.use(new RequestSigningInterceptor());
fetcher.interceptors.request.use(new CircuitBreakerInterceptor());
```

### Multi-Environment Configuration

Create environment-specific fetcher configurations:

```typescript
import { Fetcher, NamedFetcher } from '@ahoo-wang/fetcher';

type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  baseURL: string;
  timeout: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  development: {
    baseURL: 'http://localhost:3000/api',
    timeout: 30000,
    retryConfig: { maxRetries: 0, retryDelay: 0 },
  },
  staging: {
    baseURL: 'https://api-staging.example.com',
    timeout: 10000,
    retryConfig: { maxRetries: 2, retryDelay: 1000 },
  },
  production: {
    baseURL: 'https://api.example.com',
    timeout: 5000,
    retryConfig: { maxRetries: 3, retryDelay: 2000 },
  },
};

class EnvironmentAwareFetcher extends NamedFetcher {
  constructor(name: string, environment: Environment) {
    const config = environmentConfigs[environment];

    super(name, {
      baseURL: config.baseURL,
      timeout: config.timeout,
      // Add other environment-specific configurations
    });

    // Add environment-specific interceptors
    if (environment === 'production') {
      this.interceptors.request.use({
        name: 'production-monitoring',
        order: 1,
        intercept(exchange) {
          // Add production monitoring headers
          exchange.request.headers['X-Environment'] = 'production';
          exchange.request.headers['X-Request-Id'] = crypto.randomUUID();
        },
      });
    }
  }
}

// Usage
const currentEnv = (process.env.NODE_ENV as Environment) || 'development';
const apiFetcher = new EnvironmentAwareFetcher('api', currentEnv);
```

### Request Batching and Deduplication

Implement request batching to reduce network overhead:

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

class RequestBatcher {
  private queue: Map<string, any[]> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly batchDelay = 100; // ms

  constructor(private fetcher: Fetcher) {}

  async batchRequest<T>(
    endpoint: string,
    data: any,
    batchKey?: string,
  ): Promise<T> {
    const key = batchKey || endpoint;

    return new Promise((resolve, reject) => {
      if (!this.queue.has(key)) {
        this.queue.set(key, []);
      }

      this.queue.get(key)!.push({ data, resolve, reject });

      // Schedule batch execution
      if (!this.timeoutId) {
        this.timeoutId = setTimeout(
          () => this.executeBatch(key),
          this.batchDelay,
        );
      }
    });
  }

  private async executeBatch(key: string) {
    const requests = this.queue.get(key);
    if (!requests || requests.length === 0) return;

    this.queue.delete(key);
    this.timeoutId = null;

    try {
      // Execute batch request
      const batchData = requests.map(r => r.data);
      const response = await this.fetcher.post(`/${key}/batch`, {
        body: { requests: batchData },
      });

      const results = await response.json();

      // Resolve individual promises
      requests.forEach((request, index) => {
        if (results[index]?.success) {
          request.resolve(results[index].data);
        } else {
          request.reject(
            new Error(results[index]?.error || 'Batch request failed'),
          );
        }
      });
    } catch (error) {
      // Reject all promises in batch
      requests.forEach(request => request.reject(error));
    }
  }
}

// Usage
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const batcher = new RequestBatcher(fetcher);

// Batch multiple user updates
const results = await Promise.all([
  batcher.batchRequest('users', { id: 1, name: 'John' }),
  batcher.batchRequest('users', { id: 2, name: 'Jane' }),
  batcher.batchRequest('users', { id: 3, name: 'Bob' }),
]);
```

### Custom Error Handling and Retry Logic

Implement sophisticated error handling with exponential backoff:

```typescript
import { Fetcher, FetcherError } from '@ahoo-wang/fetcher';

class ExponentialBackoffRetry {
  constructor(
    private maxRetries: number = 3,
    private baseDelay: number = 1000,
    private maxDelay: number = 30000,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.maxRetries) {
          break; // Don't retry on last attempt
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          this.maxDelay,
        );

        console.log(
          `Retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, 5xx server errors, and timeouts
    if (error instanceof FetcherError) {
      return (
        error.name === 'FetchTimeoutError' ||
        (error.response && error.response.status >= 500) ||
        !error.response // Network error
      );
    }

    // Retry on network-related errors
    return error.name === 'TypeError' || error.message.includes('fetch');
  }
}

// Enhanced fetcher with retry logic
class ResilientFetcher extends Fetcher {
  private retryHandler = new ExponentialBackoffRetry();

  async request<T = any>(request: any): Promise<T> {
    return this.retryHandler.execute(() => super.request<T>(request));
  }
}

// Usage
const fetcher = new ResilientFetcher({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// This will automatically retry on failures
try {
  const data = await fetcher.get('/unreliable-endpoint');
  console.log('Success:', data);
} catch (error) {
  console.error('All retries failed:', error);
}
```

### Integration with Popular Libraries

Examples of integrating Fetcher with popular JavaScript libraries:

#### With Axios Compatibility Layer

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

// Axios-compatible wrapper
class AxiosCompatibleFetcher {
  constructor(private fetcher: Fetcher) {}

  async get(url: string, config?: any) {
    return this.fetcher.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.fetcher.post(url, { ...config, body: data });
  }

  async put(url: string, data?: any, config?: any) {
    return this.fetcher.put(url, { ...config, body: data });
  }

  async delete(url: string, config?: any) {
    return this.fetcher.delete(url, config);
  }

  // Add interceptors in Axios style
  interceptors = {
    request: {
      use: (interceptor: any) => {
        this.fetcher.interceptors.request.use({
          name: 'axios-compat',
          order: 100,
          intercept: interceptor,
        });
      },
    },
    response: {
      use: (interceptor: any) => {
        this.fetcher.interceptors.response.use({
          name: 'axios-compat',
          order: 100,
          intercept: interceptor,
        });
      },
    },
  };
}

// Usage
const axiosLike = new AxiosCompatibleFetcher(
  new Fetcher({ baseURL: 'https://api.example.com' }),
);

// Use like Axios
const response = await axiosLike.get('/users');
```

#### With React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Custom hooks for React Query
function useApiQuery(key: string, endpoint: string) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const response = await fetcher.get(endpoint);
      return response.json();
    },
    retry: (failureCount, error) => {
      // Custom retry logic based on error type
      if (error instanceof FetcherError && error.response?.status === 404) {
        return false; // Don't retry 404s
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

function useApiMutation(endpoint: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetcher.request({
        url: endpoint,
        method,
        body: data,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      // Custom error handling
      console.error('Mutation failed:', error);
    },
  });
}

// Usage in React component
function UserManagement() {
  const { data: users, isLoading } = useApiQuery('users', '/users');
  const createUser = useApiMutation('/users', 'POST');

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser.mutateAsync(userData);
      message.success('User created successfully');
    } catch (error) {
      message.error('Failed to create user');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* User management UI */}
    </div>
  );
}
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
- `urlTemplateStyle`: URL template style for path parameter resolution (default: UriTemplate)

#### Properties

- `urlBuilder`: URL builder instance for constructing URLs
- `headers`: Default request headers
- `timeout`: Default request timeout
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
- `request(request: FetchRequest): Promise<FetchExchange>` - Process an HTTP request through the Fetcher's internal
  workflow

### FetcherRequest Interface

Configuration options for HTTP requests.

**Properties:**

- `method`: HTTP method (GET, POST, PUT, DELETE, etc.)
- `headers`: Request headers
- `body`: Request body (can be object, string, Blob, etc.)
- `urlParams`: URL parameters including path parameters for URL templating and query parameters for URL query string
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

#### InterceptorRegistry Class

Registry for managing multiple interceptors of the same type.

**Properties:**

- `interceptors: Interceptor[]` - Get all interceptors in the registry

**Methods:**

- `use(interceptor: Interceptor): boolean` - Add interceptor, returns whether the addition was successful
- `eject(name: string): boolean` - Remove interceptor by name, returns whether the removal was successful
- `clear(): void` - Clear all interceptors
- `intercept(exchange: FetchExchange): Promise<void>` - Execute all interceptors in sequence

#### InterceptorManager Class

Fetcher interceptor collection, including request, response, and error interceptor managers.

**Properties:**

- `request: InterceptorRegistry` - Request interceptor manager
- `response: InterceptorRegistry` - Response interceptor manager
- `error: InterceptorRegistry` - Error interceptor manager

**Methods:**

- `exchange(fetchExchange: FetchExchange): Promise<FetchExchange>` - Process a FetchExchange through the interceptor
  pipeline, executing request, response, and error interceptors in sequence

## 🤝 Contributing

Contributions are welcome! Please see
the [contributing guide](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the [Apache-2.0 License](https://opensource.org/licenses/Apache-2.0).

---

<p align="center">
  Part of the <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> ecosystem
</p>
