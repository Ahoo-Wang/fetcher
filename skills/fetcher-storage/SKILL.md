---
name: fetcher-storage
description: Cross-environment storage with localStorage/sessionStorage/in-memory support. Use when users want storage, mention localStorage, cross-environment, serialization, or typed key-value storage.
---

# fetcher-storage

Cross-environment storage library with key-based storage, automatic environment detection, and change notifications.

## Trigger Conditions

This skill activates when the user:
- Wants localStorage, sessionStorage, or in-memory storage
- Asks about cross-environment storage (browser vs Node.js)
- Mentions storage events, serialization, or caching
- Needs typed key-value storage

## Environment Detection

### `isBrowser(): boolean`

Checks if the current environment is a browser.

```typescript
import { isBrowser } from '@ahoo-wang/fetcher-storage';

if (isBrowser()) {
  console.log('Running in browser');
}
```

### `getStorage(): Storage`

Returns the appropriate storage implementation:
- Browser: `window.localStorage` (with availability check)
- Non-browser: `InMemoryStorage` instance

```typescript
import { getStorage } from '@ahoo-wang/fetcher-storage';

const storage = getStorage();
storage.setItem('key', 'value');
```

## KeyStorage

A storage wrapper for managing typed values with caching and change notifications.

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

const userStorage = new KeyStorage<{ name: string; age: number }>({
  key: 'user',
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `key` | `string` | Storage key (required) |
| `serializer` | `Serializer<string, T>` | Custom serializer (default: JsonSerializer) |
| `storage` | `Storage` | Custom storage backend (default: getStorage()) |
| `eventBus` | `TypedEventBus<StorageEvent<T>>` | Custom event bus for notifications |

### Methods

- `get(): T | null` - Get cached value from storage
- `set(value: T): void` - Set value with caching and notification
- `remove(): void` - Remove value and clear cache
- `addListener(handler: EventHandler<StorageEvent<T>>): RemoveStorageListener` - Add change listener

### Example: Basic Usage

```typescript
const storage = new KeyStorage<{ name: string; age: number }>({
  key: 'user',
});

storage.set({ name: 'John', age: 30 });
const user = storage.get(); // { name: 'John', age: 30 }
```

### Example: Change Listener

```typescript
const removeListener = storage.addListener(event => {
  console.log('Changed:', event.newValue, 'from:', event.oldValue);
});

// Clean up when done
removeListener();
```

## InMemoryStorage

In-memory implementation of the Storage interface for Node.js or fallback.

```typescript
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';

const memoryStorage = new InMemoryStorage();
memoryStorage.setItem('temp', 'data');
console.log(memoryStorage.getItem('temp')); // 'data'
console.log(memoryStorage.length); // 1
```

Implements the full `Storage` interface using a `Map` backend.

## Serializers

### JsonSerializer

Serializes values to/from JSON strings. This is the default serializer.

```typescript
import { KeyStorage, JsonSerializer } from '@ahoo-wang/fetcher-storage';

const storage = new KeyStorage<any>({
  key: 'data',
  serializer: new JsonSerializer(),
});

storage.set({ message: 'Hello', timestamp: Date.now() });
```

### IdentitySerializer

Passes values through unchanged (for strings only).

```typescript
import { KeyStorage, IdentitySerializer } from '@ahoo-wang/fetcher-storage';

const storage = new KeyStorage<string>({
  key: 'simple',
  serializer: new IdentitySerializer(),
});
```

### `typedIdentitySerializer<T>()`

Type-safe identity serializer for primitive values.

```typescript
import { KeyStorage, typedIdentitySerializer } from '@ahoo-wang/fetcher-storage';

const stringStorage = new KeyStorage<string>({
  key: 'string',
  serializer: typedIdentitySerializer<string>(),
});

const numberStorage = new KeyStorage<number>({
  key: 'number',
  serializer: typedIdentitySerializer<number>(),
});
```

## Storage Change Listeners

Use `addListener` to subscribe to storage changes for a specific key.

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

const storage = new KeyStorage<{ theme: string }>({
  key: 'preferences',
});

const removeListener = storage.addListener(event => {
  if (event.newValue) {
    console.log('Theme changed to:', event.newValue.theme);
  }
});

// Remove listener when done
removeListener();
```

The event object contains:
- `newValue`: The new stored value
- `oldValue`: The previous stored value

## Custom Serializers

Implement the `Serializer<S, T>` interface for custom serialization:

```typescript
import { KeyStorage, Serializer } from '@ahoo-wang/fetcher-storage';

class DateSerializer implements Serializer<string, Date> {
  serialize(value: Date): string {
    return JSON.stringify({ __type: 'Date', value: value.toISOString() });
  }

  deserialize(value: string): Date {
    const parsed = JSON.parse(value);
    return new Date(parsed.value);
  }
}

const dateStorage = new KeyStorage<Date>({
  key: 'date',
  serializer: new DateSerializer(),
});

dateStorage.set(new Date('2024-01-01'));
```

## Installation

```bash
pnpm add @ahoo-wang/fetcher-storage
```

## Quick Start

```typescript
import { KeyStorage, getStorage, isBrowser } from '@ahoo-wang/fetcher-storage';

// Check environment
console.log('Browser:', isBrowser());

// Get automatic storage (localStorage in browser, memory in Node.js)
const storage = getStorage();

// Create typed key storage
const userStorage = new KeyStorage<{ name: string }>({
  key: 'user',
});

// Use it
userStorage.set({ name: 'John' });
const user = userStorage.get();

// Listen for changes
userStorage.addListener(event => {
  console.log('User updated:', event.newValue);
});
```

## Related Packages

- `@ahoo-wang/fetcher-eventbus` - Event bus for cross-tab broadcasting
- `@ahoo-wang/fetcher-decorator` - Declarative API decorators