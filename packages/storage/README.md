# @ahoo-wang/fetcher-storage

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-storage.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-storage)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

A lightweight, cross-environment storage library with change event listening capabilities. Provides consistent API for
browser localStorage/sessionStorage and in-memory storage with change notifications.

## Features

- 🌐 Cross-environment support (Browser & Node.js)
- 📦 Ultra-lightweight (~1KB gzip)
- 🔔 Storage change event listening
- 🔄 Automatic environment detection
- 🛠️ Key-based storage with caching
- 🔧 Custom serialization support
- 📝 TypeScript support

## Installation

```bash
npm install @ahoo-wang/fetcher-storage
```

## Usage

### Basic Usage

```typescript
import { createListenableStorage } from '@ahoo-wang/fetcher-storage';

// Automatically selects the appropriate storage implementation
const storage = createListenableStorage();

// Use like regular Storage API
storage.setItem('key', 'value');
const value = storage.getItem('key');

// Listen for storage changes
const removeListener = storage.addListener((event) => {
  console.log('Storage changed:', event);
});

// Remove listener when no longer needed
removeListener();
```

### Key-based Storage with Caching

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// Create a storage for a specific key
const userStorage = new KeyStorage<{ name: string, age: number }>({
  key: 'user'
});

// Set and get values
userStorage.set({ name: 'John', age: 30 });
const user = userStorage.get(); // {name: 'John', age: 30}

// Listen for changes to this specific key
const removeListener = userStorage.addListener((event) => {
  console.log('User changed:', event.newValue);
});
```

### Custom Serialization

```typescript
import { KeyStorage, JsonSerializer } from '@ahoo-wang/fetcher-storage';

const jsonStorage = new KeyStorage<any>({
  key: 'data',
  serializer: new JsonSerializer()
});

jsonStorage.set({ message: 'Hello World' });
const data = jsonStorage.get(); // {message: 'Hello World'}
```

### Environment-specific Storage

```typescript
import { BrowserListenableStorage, InMemoryListenableStorage } from '@ahoo-wang/fetcher-storage';

// Browser storage (wraps localStorage or sessionStorage)
const browserStorage = new BrowserListenableStorage(localStorage);

// In-memory storage (works in any environment)
const memoryStorage = new InMemoryListenableStorage();
```

## API

### createListenableStorage()

Factory function that automatically returns the appropriate storage implementation based on the environment:

- Browser environment: `BrowserListenableStorage` wrapping `localStorage`
- Non-browser environment: `InMemoryListenableStorage`

### ListenableStorage

Extends the native `Storage` interface with event listening capabilities:

- `addListener(listener: StorageListener): RemoveStorageListener`
- All standard `Storage` methods (`getItem`, `setItem`, `removeItem`, etc.)

### KeyStorage

A storage wrapper for managing a single value associated with a specific key:

- Automatic caching with cache invalidation
- Key-specific event listening
- Custom serialization support

### Serializers

- `JsonSerializer`: Serializes values to/from JSON strings
- `IdentitySerializer`: Passes values through without modification

## License

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)