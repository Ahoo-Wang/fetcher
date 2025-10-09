# @ahoo-wang/fetcher-react

🚀 **Powerful React Data Fetching Library** - Seamlessly integrate HTTP requests with React hooks, featuring automatic
state management, race condition protection, and TypeScript support. Perfect for modern React applications requiring
robust data fetching capabilities.

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-react.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-react)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

## Features

- 🚀 **Data Fetching**: Complete HTTP client integration with React hooks
- 🔄 **Promise State Management**: Advanced async operation handling with race condition protection
- 🛡️ **Type Safety**: Full TypeScript support with comprehensive type definitions
- ⚡ **Performance**: Optimized with useMemo, useCallback, and smart dependency management
- 🎯 **Options Flexibility**: Support for both static options and dynamic option suppliers
- 🔧 **Developer Experience**: Built-in loading states, error handling, and automatic re-rendering
- 📊 **Advanced Query Hooks**: Specialized hooks for list, paged, single, count, and stream queries with state management

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [useFetcher Hook](#usefetcher-hook)
    - [useExecutePromise Hook](#useexecutepromise-hook)
    - [usePromiseState Hook](#usepromisestate-hook)
    - [useRequestId Hook](#userequestid-hook)
    - [useLatest Hook](#uselatest-hook)
    - [useKeyStorage Hook](#usekeystorage-hook)
    - [Wow Query Hooks](#wow-query-hooks)
        - [useListQuery Hook](#uselistquery-hook)
        - [usePagedQuery Hook](#usepagedquery-hook)
        - [useSingleQuery Hook](#usesinglequery-hook)
        - [useCountQuery Hook](#usecountquery-hook)
        - [useListStreamQuery Hook](#useliststreamquery-hook)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)
- [License](#license)

## Installation

```bash
npm install @ahoo-wang/fetcher-react
```

### Requirements

- React 16.8+ (hooks support)
- TypeScript 4.0+ (for full type safety)

## Quick Start

Get started with `@ahoo-wang/fetcher-react` in just a few lines:

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

function App() {
  const { loading, result, error, execute } = useFetcher();

  return (
    <div>
      <button onClick={() => execute({ url: '/api/data', method: 'GET' })}>
        Fetch Data
      </button>
      {loading && <p>Loading...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## Usage

### useFetcher Hook

The `useFetcher` hook provides complete data fetching capabilities with automatic state management, race condition
protection, and flexible configuration options.

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, error, result, execute } = useFetcher<string>();

  const handleFetch = () => {
    execute({ url: '/api/users', method: 'GET' });
};
```

#### Auto Execute Example

```typescript jsx
import { useListQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useListQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
    list: async (listQuery) => fetchListData(listQuery),
    autoExecute: true, // Automatically execute on component mount
  });

  // The query will execute automatically when the component mounts
  // You can still manually trigger it with execute() or update conditions

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <ul>
        {result?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### useExecutePromise Hook

The `useExecutePromise` hook manages asynchronous operations with automatic state handling, built-in race condition
protection, and support for promise state options.

```typescript jsx
import { useExecutePromise } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, result, error, execute, reset } = useExecutePromise<string>();

  const fetchData = async () => {
    const response = await fetch('/api/data');
    return response.text();
  };

  const handleFetch = () => {
    execute(fetchData); // Using a promise supplier
  };

  const handleDirectPromise = () => {
    const promise = fetch('/api/data').then(res => res.text());
    execute(promise); // Using a direct promise
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return (
    <div>
      <button onClick={handleFetch}>Fetch with Supplier</button>
      <button onClick={handleDirectPromise}>Fetch with Promise</button>
      <button onClick={reset}>Reset</button>
      {result && <p>{result}</p>}
    </div>
  );
};
```

### usePromiseState Hook

The `usePromiseState` hook provides state management for promise operations without execution logic. Supports both
static options and dynamic option suppliers.

```typescript jsx
import { usePromiseState, PromiseStatus } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { status, loading, result, error, setSuccess, setError, setIdle } = usePromiseState<string>();

  const handleSuccess = () => setSuccess('Data loaded');
  const handleError = () => setError(new Error('Failed to load'));

  return (
    <div>
      <button onClick={handleSuccess}>Set Success</button>
      <button onClick={handleError}>Set Error</button>
      <button onClick={setIdle}>Reset</button>
      <p>Status: {status}</p>
      {loading && <p>Loading...</p>}
      {result && <p>Result: {result}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
};
```

#### usePromiseState with Options Supplier

```typescript jsx
import { usePromiseState, PromiseStatus } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  // Using options supplier for dynamic configuration
  const optionsSupplier = () => ({
    initialStatus: PromiseStatus.IDLE,
    onSuccess: async (result: string) => {
      await saveToAnalytics(result);
      console.log('Success:', result);
    },
    onError: async (error) => {
      await logErrorToServer(error);
      console.error('Error:', error);
    },
  });

  const { setSuccess, setError } = usePromiseState<string>(optionsSupplier);

  return (
    <div>
      <button onClick={() => setSuccess('Dynamic success!')}>Set Success</button>
      <button onClick={() => setError(new Error('Dynamic error!'))}>Set Error</button>
    </div>
  );
};
```

### useRequestId Hook

The `useRequestId` hook provides request ID management for preventing race conditions in async operations.

```typescript jsx
import { useRequestId } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { generate, isLatest, invalidate } = useRequestId();

  const handleFetch = async () => {
    const requestId = generate();

    try {
      const result = await fetchData();

      if (isLatest(requestId)) {
        setData(result);
      }
    } catch (error) {
      if (isLatest(requestId)) {
        setError(error);
      }
    }
  };

  return (
    <div>
      <button onClick={handleFetch}>Fetch Data</button>
      <button onClick={invalidate}>Cancel Ongoing</button>
    </div>
  );
};
```

### useLatest Hook

The `useLatest` hook returns a ref containing the latest value, useful for accessing the current value in async
callbacks.

```typescript jsx
import { useLatest } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const [count, setCount] = useState(0);
  const latestCount = useLatest(count);

  const handleAsync = async () => {
    await someAsyncOperation();
    console.log('Latest count:', latestCount.current); // Always the latest
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={handleAsync}>Async Log</button>
    </div>
  );
};
```

### useKeyStorage Hook

The `useKeyStorage` hook provides state management for a KeyStorage instance. It subscribes to storage changes and
returns the current value along with a setter function.

```typescript jsx
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useKeyStorage } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const keyStorage = new KeyStorage<string>({
    key: 'my-key',
  });

  const [value, setValue] = useKeyStorage(keyStorage);

  return (
    <div>
      <p>Current
        value: {value}
      </p>
      <button
        onClick={() => setValue('new value')}>
        Update
        Value
      </button>
    </div>
  )
    ;
};
```

### More Examples

```typescript jsx
// Working with different value types
const numberStorage = new KeyStorage<number>({ key: 'counter' });
const [count, setCount] = useKeyStorage(numberStorage);

// Working with objects
interface User {
  id: string;
  name: string;
}

const userStorage = new KeyStorage<User>({ key: 'current-user' });
const [user, setUser] = useKeyStorage(userStorage);
```

## Wow Query Hooks

The Wow Query Hooks provide advanced data querying capabilities with built-in state management for conditions,
projections, sorting, pagination, and limits. These hooks are designed to work with the `@ahoo-wang/fetcher-wow` package
for complex query operations.

### useListQuery Hook

The `useListQuery` hook manages list queries with state management for conditions, projections, sorting, and limits.

```typescript jsx
import { useListQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition, setLimit } = useListQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
    execute: async (listQuery) => {
      // Your list fetching logic here
      return fetchListData(listQuery);
    },
  });

  const handleSearch = (searchTerm: string) => {
    setCondition({ name: { $regex: searchTerm } });
    execute();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} placeholder="Search..." />
      <ul>
        {result?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

#### Auto Execute Example

```typescript jsx
import { useListQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useListQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
    execute: async (listQuery) => fetchListData(listQuery),
    autoExecute: true, // Automatically execute on component mount
  });

  // The query will execute automatically when the component mounts
  // You can still manually trigger it with execute() or update conditions

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <ul>
        {result?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### usePagedQuery Hook

The `usePagedQuery` hook manages paged queries with state management for conditions, projections, pagination, and
sorting.

```typescript jsx
import { usePagedQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition, setPagination } = usePagedQuery({
    initialQuery: {
      condition: {},
      pagination: { index: 1, size: 10 },
      projection: {},
      sort: []
    },
    execute: async (pagedQuery) => {
      // Your paged fetching logic here
      return fetchPagedData(pagedQuery);
    },
  });

  const handlePageChange = (page: number) => {
    setPagination({ index: page, size: 10 });
    execute();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <ul>
        {result?.list?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
      <button onClick={() => handlePageChange(result?.pagination?.index! - 1)} disabled={result?.pagination?.index === 1}>
        Previous
      </button>
      <button onClick={() => handlePageChange(result?.pagination?.index! + 1)}>
        Next
      </button>
    </div>
  );
};
```

#### Auto Execute Example

```typescript jsx
import { usePagedQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition, setPagination } = usePagedQuery({
    initialQuery: {
      condition: {},
      pagination: { index: 1, size: 10 },
      projection: {},
      sort: []
    },
    execute: async (pagedQuery) => fetchPagedData(pagedQuery),
    autoExecute: true, // Automatically execute on component mount
  });

  // The query will execute automatically when the component mounts

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <ul>
        {result?.list?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
      <button onClick={() => setPagination({ index: result?.pagination?.index! - 1, size: 10 })} disabled={result?.pagination?.index === 1}>
        Previous
      </button>
      <button onClick={() => setPagination({ index: result?.pagination?.index! + 1, size: 10 })}>
        Next
      </button>
    </div>
  );
};
```

### useSingleQuery Hook

The `useSingleQuery` hook manages single item queries with state management for conditions, projections, and sorting.

```typescript jsx
import { useSingleQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useSingleQuery({
    initialQuery: { condition: {}, projection: {}, sort: [] },
    execute: async (singleQuery) => {
      // Your single item fetching logic here
      return fetchSingleData(singleQuery);
    },
  });

  const handleFetchUser = (userId: string) => {
    setCondition({ id: userId });
    execute();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => handleFetchUser('123')}>Fetch User</button>
      {result && <p>User: {result.name}</p>}
    </div>
  );
};
```

#### Auto Execute Example

```typescript jsx
import { useSingleQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useSingleQuery({
    initialQuery: { condition: {}, projection: {}, sort: [] },
    execute: async (singleQuery) => fetchSingleData(singleQuery),
    autoExecute: true, // Automatically execute on component mount
  });

  // The query will execute automatically when the component mounts

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {result && <p>User: {result.name}</p>}
    </div>
  );
};
```

### useCountQuery Hook

The `useCountQuery` hook manages count queries with state management for conditions.

```typescript jsx
import { useCountQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useCountQuery({
    initialQuery: {},
    execute: async (condition) => {
      // Your count fetching logic here
      return fetchCount(condition);
    },
  });

  const handleCountActive = () => {
    setCondition({ status: 'active' });
    execute();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCountActive}>Count Active Items</button>
      <p>Total: {result}</p>
    </div>
  );
};
```

#### Auto Execute Example

```typescript jsx
import { useCountQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useCountQuery({
    initialQuery: {},
    execute: async (condition) => fetchCount(condition),
    autoExecute: true, // Automatically execute on component mount
  });

  // The query will execute automatically when the component mounts

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Total: {result}</p>
    </div>
  );
};
```

### useListStreamQuery Hook

The `useListStreamQuery` hook manages list stream queries that return a readable stream of server-sent events.

```typescript jsx
import { useListStreamQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useListStreamQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 100 },
    execute: async (listQuery) => {
      // Your stream fetching logic here
      return fetchListStream(listQuery);
    },
  });

  useEffect(() => {
    if (result) {
      const reader = result.getReader();
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log('Received:', value);
            // Process the stream event
          }
        } catch (error) {
          console.error('Stream error:', error);
        }
      };
      readStream();
    }
  }, [result]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={execute}>Start Stream</button>
    </div>
  );
};
```

#### Auto Execute Example

```typescript jsx
import { useListStreamQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useListStreamQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 100 },
    execute: async (listQuery) => fetchListStream(listQuery),
    autoExecute: true, // Automatically execute on component mount
  });

  useEffect(() => {
    if (result) {
      const reader = result.getReader();
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log('Received:', value);
            // Process the stream event
          }
        } catch (error) {
          console.error('Stream error:', error);
        }
      };
      readStream();
    }
  }, [result]);

  // The query will execute automatically when the component mounts

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {/* Stream is already started automatically */}
    </div>
  );
};
```

## Best Practices

### Performance Optimization

- Use `autoExecute: true` sparingly to avoid unnecessary requests on mount
- Leverage `setQuery` for query updates when `autoExecute` is enabled to trigger automatic re-execution
- Memoize expensive computations in your `execute` functions

### Error Handling

- Always handle loading and error states in your components
- Use custom error types for better error categorization
- Implement retry logic for transient failures

### Type Safety

- Define strict interfaces for your query parameters and results
- Use generic types consistently across your application
- Enable strict TypeScript mode for maximum safety

### State Management

- Combine with global state management (Redux, Zustand) for complex apps
- Use `useKeyStorage` for persistent client-side data
- Implement optimistic updates for better UX

## API Reference

### useFetcher

```typescript
function useFetcher<R = unknown, E = FetcherError>(
  options?: UseFetcherOptions<R, E> | UseFetcherOptionsSupplier<R, E>,
): UseFetcherReturn<R, E>;
```

A React hook for managing asynchronous fetch operations with proper state handling, race condition protection, and
flexible configuration.

**Type Parameters:**

- `R`: The type of the result
- `E`: The type of the error (defaults to `FetcherError`)

**Parameters:**

- `options`: Configuration options or supplier function
    - `fetcher`: Custom fetcher instance to use. Defaults to the default fetcher.
    - `initialStatus`: Initial status, defaults to IDLE
    - `onSuccess`: Callback invoked on success
    - `onError`: Callback invoked on error

**Returns:**

An object containing:

- `status`: Current status (IDLE, LOADING, SUCCESS, ERROR)
- `loading`: Indicates if currently loading
- `result`: The result value
- `error`: The error value
- `exchange`: The FetchExchange object representing the ongoing fetch operation
- `execute`: Function to execute a fetch request

### useExecutePromise

```typescript
function useExecutePromise<R = unknown, E = FetcherError>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E>;
```

A React hook for managing asynchronous operations with proper state handling, race condition protection, and promise
state options.

**Type Parameters:**

- `R`: The type of the result
- `E`: The type of the error (defaults to `FetcherError`)

**Parameters:**

- `options`: Configuration options
    - `initialStatus`: Initial status, defaults to IDLE
    - `onSuccess`: Callback invoked on success
    - `onError`: Callback invoked on error

**Returns:**

An object containing:

- `status`: Current status (IDLE, LOADING, SUCCESS, ERROR)
- `loading`: Indicates if currently loading
- `result`: The result value
- `error`: The error value
- `execute`: Function to execute a promise supplier or promise
- `reset`: Function to reset the state to initial values

### usePromiseState

```typescript
function usePromiseState<R = unknown, E = FetcherError>(
  options?: UsePromiseStateOptions<R, E> | UsePromiseStateOptionsSupplier<R, E>,
): UsePromiseStateReturn<R, E>;
```

A React hook for managing promise state without execution logic. Supports both static options and dynamic option
suppliers.

**Type Parameters:**

- `R`: The type of the result
- `E`: The type of the error (defaults to `FetcherError`)

**Parameters:**

- `options`: Configuration options or supplier function
    - `initialStatus`: Initial status, defaults to IDLE
    - `onSuccess`: Callback invoked on success (can be async)
    - `onError`: Callback invoked on error (can be async)

**Returns:**

An object containing:

- `status`: Current status (IDLE, LOADING, SUCCESS, ERROR)
- `loading`: Indicates if currently loading
- `result`: The result value
- `error`: The error value
- `setLoading`: Set status to LOADING
- `setSuccess`: Set status to SUCCESS with result
- `setError`: Set status to ERROR with error
- `setIdle`: Set status to IDLE

### useRequestId

```typescript
function useRequestId(): UseRequestIdReturn;
```

A React hook for managing request IDs and race condition protection in async operations.

**Returns:**

An object containing:

- `generate`: Generate a new request ID and get the current one
- `current`: Get the current request ID without generating a new one
- `isLatest`: Check if a given request ID is the latest
- `invalidate`: Invalidate current request ID (mark as stale)
- `reset`: Reset request ID counter

### useLatest

```typescript
function useLatest<T>(value: T): { current: T };
```

A React hook that returns a ref object containing the latest value, useful for accessing the current value in async
callbacks.

**Type Parameters:**

- `T`: The type of the value

**Parameters:**

- `value`: The value to track

**Returns:**

A ref object with a `current` property containing the latest value

### useKeyStorage

```typescript jsx
function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void];
```

A React hook that provides state management for a KeyStorage instance.

**Parameters:**

- `keyStorage`: The KeyStorage instance to subscribe to and manage

**Returns:**

- A tuple containing the current stored value and a function to update it

### useListQuery

```typescript
function useListQuery<R, FIELDS extends string = string, E = FetcherError>(
  options: UseListQueryOptions<R, FIELDS, E>,
): UseListQueryReturn<R, FIELDS, E>;
```

A React hook for managing list queries with state management for conditions, projections, sorting, and limits.

**Type Parameters:**

- `R`: The type of the result items in the list
- `FIELDS`: The type of the fields used in conditions and projections
- `E`: The type of the error (defaults to `FetcherError`)

**Parameters:**

- `options`: Configuration options including initialQuery and list function
    - `autoExecute`: Whether to automatically execute the query on component mount (defaults to false)

**Returns:**

An object containing promise state, execute function, and setters for condition, projection, sort, and limit.

### usePagedQuery

```typescript
function usePagedQuery<R, FIELDS extends string = string, E = FetcherError>(
  options: UsePagedQueryOptions<R, FIELDS, E>,
): UsePagedQueryReturn<R, FIELDS, E>;
```

A React hook for managing paged queries with state management for conditions, projections, pagination, and sorting.

**Type Parameters:**

- `R`: The type of the result items in the paged list
- `FIELDS`: The type of the fields used in conditions and projections
- `E`: The type of the error (defaults to `FetcherError`)

**Parameters:**

- `options`: Configuration options including initialQuery and query function
    - `autoExecute`: Whether to automatically execute the query on component mount (defaults to false)

**Returns:**

An object containing promise state, execute function, and setters for condition, projection, pagination, and sort.

### useSingleQuery

```typescript
function useSingleQuery<R, FIELDS extends string = string, E = FetcherError>(
  options: UseSingleQueryOptions<R, FIELDS, E>,
): UseSingleQueryReturn<R, FIELDS, E>;
```

A React hook for managing single queries with state management for conditions, projections, and sorting.

**Type Parameters:**

- `R`: The type of the result
- `FIELDS`: The type of the fields used in conditions and projections
- `E`: The type of the error (defaults to `FetcherError`)

**Parameters:**

- `options`: Configuration options including initialQuery and query function
    - `autoExecute`: Whether to automatically execute the query on component mount (defaults to false)

**Returns:**

An object containing promise state, execute function, and setters for condition, projection, and sort.

### useCountQuery

```typescript
function useCountQuery<FIELDS extends string = string, E = FetcherError>(
  options: UseCountQueryOptions<FIELDS, E>,
): UseCountQueryReturn<FIELDS, E>;
```

A React hook for managing count queries with state management for conditions.

**Type Parameters:**

- `FIELDS`: The type of the fields used in conditions
- `E`: The type of the error (defaults to `FetcherError`)

**Parameters:**

- `options`: Configuration options including initialQuery and execute function
    - `autoExecute`: Whether to automatically execute the query on component mount (defaults to false)

**Returns:**

An object containing promise state, execute function, and setter for condition.

### useListStreamQuery

```typescript
function useListStreamQuery<
  R,
  FIELDS extends string = string,
  E = FetcherError,
>(
  options: UseListStreamQueryOptions<R, FIELDS, E>,
): UseListStreamQueryReturn<R, FIELDS, E>;
```

A React hook for managing list stream queries with state management for conditions, projections, sorting, and limits.
Returns a readable stream of JSON server-sent events.

**Type Parameters:**

- `R`: The type of the result items in the stream events
- `FIELDS`: The type of the fields used in conditions and projections
- `E`: The type of the error (defaults to `FetcherError`)

**Parameters:**

- `options`: Configuration options including initialQuery and listStream function
    - `autoExecute`: Whether to automatically execute the query on component mount (defaults to false)

**Returns:**

An object containing promise state, execute function, and setters for condition, projection, sort, and limit.

## License

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
