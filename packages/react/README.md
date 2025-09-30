# @ahoo-wang/fetcher-react

React Integration Package Fetcher Ecosystem. Provides React Hooks and components for seamless data fetching with
automatic re-rendering and loading states.

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-react.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-react)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

## Features

- 🔄 **React Hooks**: Provides React hooks for seamless integration with Fetcher
- 🌐 **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- 🚀 **Modern**: Built with modern React patterns and best practices
- 🧠 **Smart Caching**: Built-in caching and automatic revalidation
- ⚡ **Promise State Management**: Hooks for managing async operations and promise states

## Installation

```bash
npm install @ahoo-wang/fetcher-react
```

## Usage

### usePromiseState Hook

The `usePromiseState` hook provides state management for promise operations without execution logic.

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

### useExecutePromise Hook

The `useExecutePromise` hook manages asynchronous operations with automatic state handling.

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

### useFetcher Hook

The `useFetcher` hook provides data fetching capabilities with automatic state management.

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, error, result, execute } = useFetcher<string>();

  const handleFetch = () => {
    execute({ url: '/api/users', method: 'GET' });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      <button onClick={handleFetch}>Fetch Data</button>
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

## API Reference

### usePromiseState

```typescript
function usePromiseState<R = unknown>(
  options?: UsePromiseStateOptions<R>,
): UsePromiseStateReturn<R>;
```

A React hook for managing promise state without execution logic.

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
- `setLoading`: Set status to LOADING
- `setSuccess`: Set status to SUCCESS with result
- `setError`: Set status to ERROR with error
- `setIdle`: Set status to IDLE

### useExecutePromise

```typescript
function useExecutePromise<R = unknown>(): UseExecutePromiseReturn<R>;
```

A React hook for managing asynchronous operations with proper state handling.

**Returns:**

An object containing:

- `status`: Current status
- `loading`: Indicates if currently loading
- `result`: The result value
- `error`: The error value
- `execute`: Function to execute a promise supplier
- `reset`: Function to reset the state to initial values

### useFetcher

```typescript
function useFetcher<R>(options?: UseFetcherOptions): UseFetcherReturn<R>;
```

A React hook for managing asynchronous fetch operations with proper state handling.

**Parameters:**

- `options`: Configuration options
    - `fetcher`: Custom fetcher instance to use. Defaults to the default fetcher.

**Returns:**

An object containing:

- `status`: Current status
- `loading`: Indicates if currently loading
- `result`: The result value
- `error`: The error value
- `exchange`: The FetchExchange object
- `execute`: Function to execute a fetch request

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

## License

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
