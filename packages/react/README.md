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

## Installation

```bash
npm install @ahoo-wang/fetcher-react
```

## Usage

### useFetcher Hook

The `useFetcher` hook provides a convenient way to fetch data in React components with automatic state management for
loading, error, and result states.

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, error, result, execute, cancel } = useFetcher({
    url: '/api/users',
    method: 'GET'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      <button onClick={execute}>Refresh</button>
      <button onClick={cancel}>Cancel</button>
    </div>
  );
};
```

### Manual Execution

To manually control when the fetch occurs, set the `immediate` option to `false`:

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, error, result, execute } = useFetcher({
    url: '/api/users',
    method: 'POST',
    body: JSON.stringify({ name: 'John' })
  }, { immediate: false });

  const handleSubmit = async () => {
    await execute();
  };

  if (loading) return <div>Submitting...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

### Custom Dependencies

You can specify dependencies that will trigger a refetch when they change:

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const UserProfile = ({ userId }: { userId: string }) => {
  const { loading, error, result } = useFetcher({
    url: `/api/users/${userId}`,
    method: 'GET'
  }, { deps: [userId] });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{result?.name}</h1>
      <p>{result?.email}</p>
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

### useFetcher

```typescript
function useFetcher<R>(
  request: FetchRequest,
  options?: UseFetcherOptions,
): UseFetcherResult<R>;
```

A React hook that provides data fetching capabilities with automatic state management.

**Parameters:**

- `request`: The fetch request configuration
- `options`: Configuration options for the fetch operation
    - `deps`: Dependencies list for the fetch operation. When provided, the hook will re-fetch when any of these values
      change.
    - `immediate`: Whether the fetch operation should execute immediately upon component mount. Defaults to `true`.
    - `fetcher`: Custom fetcher instance to use. Defaults to the default fetcher.

**Returns:**

An object containing:

- `loading`: Indicates if the fetch operation is currently in progress
- `exchange`: The FetchExchange object representing the ongoing fetch operation
- `result`: The data returned by the fetch operation
- `error`: Any error that occurred during the fetch operation
- `execute`: Function to manually trigger the fetch operation
- `cancel`: Function to cancel the ongoing fetch operation

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
