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

### useKeyStorage

```typescript jsx
function useKeyStorage<T>(keyStorage: KeyStorage<T>): [T | null, (value: T) => void]
```

A React hook that provides state management for a KeyStorage instance.

**Parameters:**

- `keyStorage`: The KeyStorage instance to subscribe to and manage

**Returns:**

- A tuple containing the current stored value and a function to update it

## License

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)