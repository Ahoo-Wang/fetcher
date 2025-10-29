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
  - [Debounced Hooks](#debounced-hooks)
    - [useDebouncedCallback](#usedebouncedcallback)
    - [useDebouncedExecutePromise](#usedebouncedexecutepromise)
    - [useDebouncedFetcher](#usedebouncedfetcher)
  - [useExecutePromise Hook](#useexecutepromise-hook)
  - [usePromiseState Hook](#usepromisestate-hook)
  - [useRequestId Hook](#userequestid-hook)
  - [useLatest Hook](#uselatest-hook)
  - [useRefs Hook](#userefs-hook)
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

### Debounced Hooks

🚀 **Advanced Debouncing for React Applications** - Powerful hooks that combine debouncing with async operations, providing seamless rate limiting for API calls, user interactions, and promise execution.

#### useDebouncedCallback

A React hook that provides a debounced version of any callback function with leading/trailing edge execution options.

```typescript jsx
import { useDebouncedCallback } from '@ahoo-wang/fetcher-react';

const SearchComponent = () => {
  const { run: debouncedSearch, cancel, isPending } = useDebouncedCallback(
    async (query: string) => {
      const response = await fetch(`/api/search?q=${query}`);
      const results = await response.json();
      console.log('Search results:', results);
    },
    { delay: 300 }
  );

  const handleSearch = (query: string) => {
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      cancel(); // Cancel any pending search
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending() && <div>Searching...</div>}
    </div>
  );
};
```

**Configuration Options:**

- `delay`: Delay in milliseconds before execution (required, positive number)
- `leading`: Execute immediately on first call (default: false)
- `trailing`: Execute after delay on last call (default: true)

#### useDebouncedExecutePromise

Combines promise execution with debouncing functionality, perfect for API calls and async operations.

```typescript jsx
import { useDebouncedExecutePromise } from '@ahoo-wang/fetcher-react';

const DataFetcher = () => {
  const { loading, result, error, run } = useDebouncedExecutePromise({
    debounce: { delay: 300 },
  });

  const handleLoadUser = (userId: string) => {
    run(async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    });
  };

  return (
    <div>
      <button onClick={() => handleLoadUser('user123')}>
        Load User
      </button>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {result && <div>User: {result.name}</div>}
    </div>
  );
};
```

#### useDebouncedFetcher

Specialized hook combining HTTP fetching with debouncing, built on top of the core fetcher library.

```typescript jsx
import { useDebouncedFetcher } from '@ahoo-wang/fetcher-react';

const SearchInput = () => {
  const [query, setQuery] = useState('');
  const { loading, result, error, run } = useDebouncedFetcher({
    debounce: { delay: 300 },
    onSuccess: (data) => {
      setSearchResults(data.results);
    }
  });

  const handleChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      run({
        url: '/api/search',
        method: 'GET',
        params: { q: value }
      });
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search..."
      />
      {loading && <div>Searching...</div>}
      {error && <div>Error: {error.message}</div>}
      {result && <SearchResults data={result} />}
    </div>
  );
};
```

**Debouncing Strategies:**

- **Leading Edge**: Execute immediately on first call, then debounce subsequent calls
- **Trailing Edge**: Execute after delay on last call (default behavior)
- **Leading + Trailing**: Execute immediately, then again after delay if called again

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

### useRefs Hook

The `useRefs` hook provides a Map-like interface for managing multiple React refs dynamically. It allows registering, retrieving, and managing refs by key, with automatic cleanup on component unmount.

```typescript jsx
import { useRefs } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const refs = useRefs<HTMLDivElement>();

  const handleFocus = (key: string) => {
    const element = refs.get(key);
    element?.focus();
  };

  return (
    <div>
      <div ref={refs.register('first')} tabIndex={0}>First Element</div>
      <div ref={refs.register('second')} tabIndex={0}>Second Element</div>
      <button onClick={() => handleFocus('first')}>Focus First</button>
      <button onClick={() => handleFocus('second')}>Focus Second</button>
    </div>
  );
};
```

Key features:

- **Dynamic Registration**: Register refs with string, number, or symbol keys
- **Map-like API**: Full Map interface with get, set, has, delete, etc.
- **Automatic Cleanup**: Refs are cleared when component unmounts
- **Type Safety**: Full TypeScript support for ref types

### useKeyStorage Hook

The `useKeyStorage` hook provides reactive state management for a KeyStorage instance. It subscribes to storage changes and returns the current value along with a setter function. Optionally accepts a default value to use when the storage is empty.

```typescript jsx
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useKeyStorage } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const keyStorage = new KeyStorage<string>({ key: 'my-key' });

  // Without default value - can be null
  const [value, setValue] = useKeyStorage(keyStorage);

  return (
    <div>
      <p>Current value: {value || 'No value stored'}</p>
      <button onClick={() => setValue('new value')}>
        Update Value
      </button>
    </div>
  );
};
```

#### With Default Value

```typescript jsx
const MyComponent = () => {
  const keyStorage = new KeyStorage<string>({ key: 'theme' });

  // With default value - guaranteed to be non-null
  const [theme, setTheme] = useKeyStorage(keyStorage, 'light');

  return (
    <div className={theme}>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
};
```

### More Examples

```typescript jsx
// Working with different value types
const numberStorage = new KeyStorage<number>({ key: 'counter' });
const [count, setCount] = useKeyStorage(numberStorage, 0); // Default to 0

// Working with objects
interface User {
  id: string;
  name: string;
}

const userStorage = new KeyStorage<User>({ key: 'current-user' });
const [user, setUser] = useKeyStorage(userStorage, { id: '', name: 'Guest' });

// Complex state management
const settingsStorage = new KeyStorage<{ volume: number; muted: boolean }>({
  key: 'audio-settings',
});
const [settings, setSettings] = useKeyStorage(settingsStorage, {
  volume: 50,
  muted: false,
});

// Update specific properties
const updateVolume = (newVolume: number) => {
  setSettings({ ...settings, volume: newVolume });
};
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

## 🚀 Advanced Usage Examples

### Custom Hook Composition

Create reusable hooks by composing multiple fetcher-react hooks:

```typescript jsx
import { useFetcher, usePromiseState, useLatest } from '@ahoo-wang/fetcher-react';
import { useCallback, useEffect } from 'react';

function useUserProfile(userId: string) {
  const latestUserId = useLatest(userId);
  const { loading, result: profile, error, execute } = useFetcher();

  const fetchProfile = useCallback(() => {
    execute({
      url: `/api/users/${latestUserId.current}`,
      method: 'GET'
    });
  }, [execute, latestUserId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { profile, loading, error, refetch } = useUserProfile(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{profile?.name}</h2>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Error Boundaries Integration

Integrate with React Error Boundaries for better error handling:

```typescript jsx
import { Component, ErrorInfo, ReactNode } from 'react';

class FetchErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Fetch error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

// Usage with hooks
function DataComponent() {
  const { result, loading, error, execute } = useFetcher();

  // Error will be caught by boundary if thrown
  if (error) {
    throw error;
  }

  return (
    <div>
      {loading ? 'Loading...' : JSON.stringify(result)}
    </div>
  );
}

// Wrap components that use fetcher hooks
function App() {
  return (
    <FetchErrorBoundary fallback={<div>Failed to load data</div>}>
      <DataComponent />
    </FetchErrorBoundary>
  );
}
```

### Suspense Integration

Use with React Suspense for better loading states:

```typescript jsx
import { Suspense, useState } from 'react';
import { useFetcher } from '@ahoo-wang/fetcher-react';

// Create a resource that throws a promise
function createDataResource<T>(promise: Promise<T>) {
  let status = 'pending';
  let result: T;
  let error: Error;

  const suspender = promise.then(
    (data) => {
      status = 'success';
      result = data;
    },
    (err) => {
      status = 'error';
      error = err;
    }
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw error;
      } else {
        return result;
      }
    }
  };
}

function DataComponent({ resource }: { resource: any }) {
  const data = resource.read(); // This will throw if pending
  return <div>{JSON.stringify(data)}</div>;
}

function App() {
  const [resource, setResource] = useState<any>(null);

  const handleFetch = () => {
    const { execute } = useFetcher();
    const promise = execute({ url: '/api/data', method: 'GET' });
    setResource(createDataResource(promise));
  };

  return (
    <div>
      <button onClick={handleFetch}>Fetch Data</button>
      <Suspense fallback={<div>Loading...</div>}>
        {resource && <DataComponent resource={resource} />}
      </Suspense>
    </div>
  );
}
```

### Performance Optimization Patterns

Advanced patterns for optimal performance:

```typescript jsx
import { useMemo, useCallback, useRef } from 'react';
import { useListQuery } from '@ahoo-wang/fetcher-react';

function OptimizedDataTable({ filters, sortBy }) {
  // Memoize query configuration to prevent unnecessary re-executions
  const queryConfig = useMemo(() => ({
    condition: filters,
    sort: [{ field: sortBy, order: 'asc' }],
    limit: 50
  }), [filters, sortBy]);

  const { result, loading, execute, setCondition } = useListQuery({
    initialQuery: queryConfig,
    execute: useCallback(async (query) => {
      // Debounce API calls
      await new Promise(resolve => setTimeout(resolve, 300));
      return fetchData(query);
    }, []),
    autoExecute: true
  });

  // Use ref to track latest filters without causing re-renders
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  });

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      setCondition({ ...filtersRef.current, search: searchTerm });
    }, 500),
    [setCondition]
  );

  return (
    <div>
      <input
        onChange={(e) => debouncedSearch(e.target.value)}
        placeholder="Search..."
      />
      {loading ? 'Loading...' : (
        <table>
          <tbody>
            {result?.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### Real-World Integration Examples

Complete examples showing integration with popular libraries:

#### With React Query (TanStack Query)

```typescript jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFetcher } from '@ahoo-wang/fetcher-react';

function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { execute } = useFetcher();
      const result = await execute({
        url: `/api/users/${userId}`,
        method: 'GET'
      });
      return result;
    }
  });
}

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useUserData(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Welcome, {data.name}!</div>;
}
```

#### With Redux Toolkit

```typescript jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useFetcher } from '@ahoo-wang/fetcher-react';

const fetchUserData = createAsyncThunk(
  'user/fetchData',
  async (userId: string) => {
    const { execute } = useFetcher();
    return await execute({
      url: `/api/users/${userId}`,
      method: 'GET'
    });
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

function UserComponent({ userId }: { userId: string }) {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserData(userId));
  }, [userId, dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{data?.name}</div>;
}
```

#### With Zustand

```typescript jsx
import { create } from 'zustand';
import { useFetcher } from '@ahoo-wang/fetcher-react';

interface UserStore {
  user: any;
  loading: boolean;
  error: string | null;
  fetchUser: (userId: string) => Promise<void>;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  fetchUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      const { execute } = useFetcher();
      const user = await execute({
        url: `/api/users/${userId}`,
        method: 'GET'
      });
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

function UserComponent({ userId }: { userId: string }) {
  const { user, loading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{user?.name}</div>;
}
```

### Testing Patterns

Comprehensive testing examples for hooks:

```typescript jsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetcher, useListQuery } from '@ahoo-wang/fetcher-react';

// Mock fetcher
jest.mock('@ahoo-wang/fetcher', () => ({
  Fetcher: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}));

describe('useFetcher', () => {
  it('should handle successful fetch', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetcher = { request: jest.fn().mockResolvedValue(mockData) };

    const { result } = renderHook(() => useFetcher({ fetcher: mockFetcher }));

    act(() => {
      result.current.execute({ url: '/api/test', method: 'GET' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.result).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Network error');
    const mockFetcher = { request: jest.fn().mockRejectedValue(mockError) };

    const { result } = renderHook(() => useFetcher({ fetcher: mockFetcher }));

    act(() => {
      result.current.execute({ url: '/api/test', method: 'GET' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.result).toBe(null);
    });
  });
});

describe('useListQuery', () => {
  it('should manage query state', async () => {
    const mockData = [{ id: 1, name: 'Item 1' }];
    const mockExecute = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useListQuery({
        initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
        execute: mockExecute,
      }),
    );

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.result).toEqual(mockData);
    });

    expect(mockExecute).toHaveBeenCalledWith({
      condition: {},
      projection: {},
      sort: [],
      limit: 10,
    });
  });

  it('should update condition', () => {
    const { result } = renderHook(() =>
      useListQuery({
        initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
        execute: jest.fn(),
      }),
    );

    act(() => {
      result.current.setCondition({ status: 'active' });
    });

    expect(result.current.condition).toEqual({ status: 'active' });
  });
});
```

## API Reference

### Debounced Hooks

#### useDebouncedCallback

```typescript
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedCallbackReturn<T>;
```

A React hook that provides a debounced version of a callback function with leading/trailing edge execution options.

**Type Parameters:**

- `T`: The type of the callback function

**Parameters:**

- `callback`: The function to debounce
- `options`: Configuration object
  - `delay`: Delay in milliseconds before execution (required, positive number)
  - `leading?`: Execute immediately on first call (default: false)
  - `trailing?`: Execute after delay on last call (default: true)

**Returns:**

An object containing:

- `run`: Function to execute the debounced callback with arguments
- `cancel`: Function to cancel any pending debounced execution
- `isPending`: Function that returns true if a debounced execution is currently pending

#### useDebouncedExecutePromise

```typescript
function useDebouncedExecutePromise<R = unknown, E = FetcherError>(
  options: UseDebouncedExecutePromiseOptions<R, E>,
): UseDebouncedExecutePromiseReturn<R, E>;
```

Combines promise execution with debouncing functionality.

**Type Parameters:**

- `R`: The type of the promise result (defaults to unknown)
- `E`: The type of the error (defaults to FetcherError)

**Parameters:**

- `options`: Configuration object containing promise execution options and debounce settings
  - `debounce`: Debounce configuration (delay, leading, trailing)
  - All options from `UseExecutePromiseOptions`

**Returns:**

An object containing:

- `loading`: Boolean indicating if the promise is currently executing
- `result`: The resolved value of the promise
- `error`: Any error that occurred during execution
- `status`: Current execution status
- `run`: Debounced function to execute the promise with provided arguments
- `cancel`: Function to cancel any pending debounced execution
- `isPending`: Boolean indicating if a debounced call is pending
- `reset`: Function to reset the hook state to initial values

#### useDebouncedFetcher

```typescript
function useDebouncedFetcher<R, E = FetcherError>(
  options: UseDebouncedFetcherOptions<R, E>,
): UseDebouncedFetcherReturn<R, E>;
```

Specialized hook combining HTTP fetching with debouncing.

**Type Parameters:**

- `R`: The type of the fetch result
- `E`: The type of the error (defaults to FetcherError)

**Parameters:**

- `options`: Configuration object extending `UseFetcherOptions` and `DebounceCapable`
  - HTTP request options (method, headers, timeout, etc.)
  - `debounce`: Debounce configuration (delay, leading, trailing)

**Returns:**

An object containing:

- `loading`: Boolean indicating if the fetch is currently executing
- `result`: The resolved value of the fetch
- `error`: Any error that occurred during execution
- `status`: Current execution status
- `exchange`: The FetchExchange object representing the ongoing fetch operation
- `run`: Function to execute the debounced fetch with request parameters
- `cancel`: Function to cancel any pending debounced execution
- `isPending`: Boolean indicating if a debounced call is pending

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

### useRefs

```typescript
function useRefs<T>(): UseRefsReturn<T>;
```

A React hook for managing multiple refs with a Map-like interface, allowing dynamic registration and retrieval of refs by key.

**Type Parameters:**

- `T`: The type of the ref instances (e.g., HTMLElement)

**Returns:**

An object implementing `UseRefsReturn<T>` with:

- `register(key: RefKey): (instance: T | null) => void` - Returns a callback to register/unregister a ref
- `get(key: RefKey): T | undefined` - Get a ref by key
- `set(key: RefKey, value: T): void` - Set a ref value
- `has(key: RefKey): boolean` - Check if key exists
- `delete(key: RefKey): boolean` - Delete a ref by key
- `clear(): void` - Clear all refs
- `size: number` - Number of refs
- `keys(): IterableIterator<RefKey>` - Iterator over keys
- `values(): IterableIterator<T>` - Iterator over values
- `entries(): IterableIterator<[RefKey, T]>` - Iterator over entries
- `Symbol.iterator`: Iterator for for...of loops

**Related Types:**

- `RefKey = string | number | symbol`
- `UseRefsReturn<T> extends Iterable<[RefKey, T]>`

### useKeyStorage

```typescript
// Without default value - can return null
function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void];

// With default value - guaranteed non-null
function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (value: T) => void];
```

A React hook that provides reactive state management for a KeyStorage instance. Subscribes to storage changes and returns the current value along with a setter function. Optionally accepts a default value to use when the storage is empty.

**Type Parameters:**

- `T`: The type of value stored in the key storage

**Parameters:**

- `keyStorage`: The KeyStorage instance to subscribe to and manage. Should be a stable reference (useRef, memo, or module-level instance)
- `defaultValue` _(optional)_: The default value to use when storage is empty. When provided, the hook guarantees the returned value will never be null

**Returns:**

- **Without default value**: `[T | null, (value: T) => void]` - A tuple where the first element can be null if storage is empty
- **With default value**: `[T, (value: T) => void]` - A tuple where the first element is guaranteed to be non-null (either the stored value or the default value)

**Examples:**

```typescript
// Without default value
const [value, setValue] = useKeyStorage(keyStorage);
// value: string | null

// With default value
const [theme, setTheme] = useKeyStorage(themeStorage, 'light');
// theme: string (never null)
```

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
