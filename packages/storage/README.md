# @ahoo-wang/fetcher-storage

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-storage.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-storage)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

A lightweight, cross-environment storage library with key-based storage and automatic environment detection. Provides
consistent API for browser localStorage and in-memory storage with change notifications.

## Features

- 🌐 Cross-environment support (Browser & Node.js)
- 📦 Ultra-lightweight (~2KB gzip)
- 🔔 Storage change event listening
- 🔄 Automatic environment detection with fallback
- 🛠️ Key-based storage with caching and serialization
- 🔧 Custom serialization support
- 📝 Full TypeScript support

## Installation

```bash
npm install @ahoo-wang/fetcher-storage
```

## Usage

### Environment Detection and Storage Selection

```typescript
import { getStorage, isBrowser } from '@ahoo-wang/fetcher-storage';

// Check if running in browser
console.log('Is browser:', isBrowser());

// Get appropriate storage for current environment
const storage = getStorage(); // localStorage in browser, InMemoryStorage in Node.js

// Use like standard Storage API
storage.setItem('key', 'value');
const value = storage.getItem('key');
```

### Key-based Storage with Caching

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// Create typed storage for a specific key
const userStorage = new KeyStorage<{ name: string; age: number }>({
  key: 'user',
});

// Set and get values with automatic caching
userStorage.set({ name: 'John', age: 30 });
const user = userStorage.get(); // {name: 'John', age: 30}

// Listen for changes to this specific key
const removeListener = userStorage.addListener(event => {
  console.log('User changed:', event.newValue, 'from:', event.oldValue);
});

// Clean up when done
removeListener();
```

### Custom Serialization

```typescript
import { KeyStorage, JsonSerializer } from '@ahoo-wang/fetcher-storage';

// Use JSON serialization (default)
const jsonStorage = new KeyStorage<any>({
  key: 'data',
  serializer: new JsonSerializer(),
});

jsonStorage.set({ message: 'Hello World', timestamp: Date.now() });
const data = jsonStorage.get(); // {message: 'Hello World', timestamp: 1234567890}
```

### In-Memory Storage

```typescript
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// Create in-memory storage (works in any environment)
const memoryStorage = new InMemoryStorage();

// Use like standard Storage API
memoryStorage.setItem('temp', 'data');
console.log(memoryStorage.getItem('temp')); // 'data'
console.log(memoryStorage.length); // 1
```

### Advanced Configuration

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// Custom storage and event bus
const customStorage = new KeyStorage<string>({
  key: 'custom',
  storage: new InMemoryStorage(), // Use in-memory instead of localStorage
  // eventBus: customEventBus, // Custom event bus for notifications
});
```

## API Reference

### Environment Utilities

#### `isBrowser(): boolean`

Checks if the current environment is a browser.

#### `getStorage(): Storage`

Returns the appropriate storage implementation:

- Browser: `window.localStorage` (with availability check)
- Non-browser: `InMemoryStorage` instance

### KeyStorage

A storage wrapper for managing typed values with caching and change notifications.

```typescript
new KeyStorage<T>(options
:
KeyStorageOptions<T>
)
```

#### Options

- `key: string` - Storage key
- `serializer?: Serializer<string, T>` - Custom serializer (default: JsonSerializer)
- `storage?: Storage` - Custom storage (default: getStorage())
- `eventBus?: TypedEventBus<StorageEvent<T>>` - Custom event bus

#### Methods

- `get(): T | null` - Get cached value
- `set(value: T): void` - Set value with caching and notification
- `remove(): void` - Remove value and clear cache
- `addListener(handler: EventHandler<StorageEvent<T>>): RemoveStorageListener` - Add change listener

### InMemoryStorage

In-memory implementation of the Storage interface.

```typescript
new InMemoryStorage();
```

Implements all standard Storage methods with Map-based storage.

### Serializers

#### `JsonSerializer`

Serializes values to/from JSON strings.

#### `typedIdentitySerializer<T>()`

Identity serializer that passes values through unchanged.

## TypeScript Support

Full TypeScript support with generics and type inference:

```typescript
// Typed storage
const userStorage = new KeyStorage<User>({ key: 'user' });

// Type-safe operations
userStorage.set({ id: 1, name: 'John' });
const user = userStorage.get(); // User | null
```

## License

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)
