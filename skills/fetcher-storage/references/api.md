# Fetcher Storage API Reference

## Contents

- [Environment Detection](#environment-detection)
- [Core Interfaces](#core-interfaces)
  - [`StorageEvent<Deserialized>`](#storageeventdeserialized)
  - [`StorageListenable<Deserialized>`](#storagelistenabledeserialized)
- [KeyStorage](#keystorage)
  - [KeyStorageOptions\<T\>](#keystorageoptionst)
  - [Methods](#methods)
  - [Example: Basic Usage with defaultValue](#example-basic-usage-with-defaultvalue)
  - [Example: Change Listener (EventHandler object)](#example-change-listener-eventhandler-object)
  - [Example: Destroy for cleanup](#example-destroy-for-cleanup)
- [Cross-tab Synchronization](#cross-tab-synchronization)
- [Serializers](#serializers)
  - [`jsonSerializer` (singleton, recommended)](#jsonserializer-singleton-recommended)
  - [`IdentitySerializer<T>` — Generic passthrough](#identityserializert--generic-passthrough)
  - [`typedIdentitySerializer<T>()` — Type-safe singleton](#typedidentityserializert--type-safe-singleton)
  - [Custom Serializer](#custom-serializer)
- [InMemoryStorage](#inmemorystorage)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Related Packages](#related-packages)

Key-based storage abstraction with serialization, caching, environment-aware backend, change notifications via EventBus, and cross-tab synchronization.

## Environment Detection

```typescript
import { isBrowser, getStorage } from '@ahoo-wang/fetcher-storage';

isBrowser(); // true in browser, false in Node/SSR
const storage = getStorage(); // window.localStorage or InMemoryStorage
```

## Core Interfaces

### `StorageEvent<Deserialized>`

```typescript
interface StorageEvent<Deserialized> {
  newValue?: Deserialized | null;
  oldValue?: Deserialized | null;
}
```

### `StorageListenable<Deserialized>`

```typescript
interface StorageListenable<Deserialized> {
  addListener(
    listener: EventHandler<StorageEvent<Deserialized>>,
  ): RemoveStorageListener;
}
```

`EventHandler` requires `name` and `handle` properties (from `@ahoo-wang/fetcher-eventbus`).
`RemoveStorageListener` is `() => void`.

## KeyStorage

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

const userStorage = new KeyStorage<{ name: string; age: number }>({
  key: 'user',
});
```

### KeyStorageOptions\<T\>

| Option         | Type                             | Description                                              |
| -------------- | -------------------------------- | -------------------------------------------------------- |
| `key`          | `string`                         | Storage key (required)                                   |
| `serializer`   | `Serializer<string, T>`          | Custom serializer (default: `jsonSerializer`)            |
| `storage`      | `Storage`                        | Custom backend (default: `getStorage()`)                 |
| `eventBus`     | `TypedEventBus<StorageEvent<T>>` | Custom event bus for notifications                       |
| `defaultValue` | `T \| null`                      | Value returned by `get()` when key is missing in storage |

### Methods

- `get(): T | null` — Get value (cached, or deserialized from storage). Returns `defaultValue` if key missing.
- `set(value: T): void` — Store value with caching and emit change event.
- `remove(): void` — Remove value, clear cache, emit change event.
- `destroy(): void` — Remove internal event handler to prevent memory leaks. Call when done.
- `addListener(handler: EventHandler<StorageEvent<T>>): RemoveStorageListener`

### Example: Basic Usage with defaultValue

```typescript
const themeStorage = new KeyStorage<string>({
  key: 'theme',
  defaultValue: 'light',
});

themeStorage.get(); // 'light' (if not set yet)
themeStorage.set('dark');
```

### Example: Change Listener (EventHandler object)

```typescript
const removeListener = storage.addListener({
  name: 'user-change-listener',
  handle(event) {
    console.log('Changed:', event.newValue, 'from:', event.oldValue);
  },
});

removeListener(); // cleanup
```

### Example: Destroy for cleanup

```typescript
const storage = new KeyStorage<string>({ key: 'temp' });
// ... use storage ...
storage.destroy(); // prevent memory leaks
```

## Cross-tab Synchronization

KeyStorage integrates with EventBus via `BroadcastTypedEventBus` for cross-tab sync. Events propagate via `BroadcastChannel` API with automatic fallback to `StorageEvent` when BroadcastChannel is unavailable.

```typescript
import { BroadcastTypedEventBus } from '@ahoo-wang/fetcher-eventbus';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

const broadcastBus = new BroadcastTypedEventBus<StorageEvent<string>>({
  delegate: new SerialTypedEventBus('user-sync'),
});

const storage = new KeyStorage<string>({
  key: 'user',
  eventBus: broadcastBus,
});
// Changes in one tab propagate to all tabs
```

## Serializers

### `jsonSerializer` (singleton, recommended)

```typescript
import { jsonSerializer, JsonSerializer } from '@ahoo-wang/fetcher-storage';

// Use the singleton (recommended)
const storage = new KeyStorage<any>({
  key: 'data',
  serializer: jsonSerializer,
});

// Or instantiate the class if needed
const custom = new JsonSerializer();
```

This is the default serializer. No need to specify it explicitly.

### `IdentitySerializer<T>` — Generic passthrough

Passes values through unchanged for **any** type, not just strings.

```typescript
import { IdentitySerializer } from '@ahoo-wang/fetcher-storage';

// Generic: works with any type T
const stringStorage = new KeyStorage<string>({
  key: 'simple',
  serializer: new IdentitySerializer<string>(),
});
```

### `typedIdentitySerializer<T>()` — Type-safe singleton

```typescript
import { typedIdentitySerializer } from '@ahoo-wang/fetcher-storage';

const numberStorage = new KeyStorage<number>({
  key: 'count',
  serializer: typedIdentitySerializer<number>(),
});
```

### Custom Serializer

```typescript
import type { Serializer } from '@ahoo-wang/fetcher-storage';

class DateSerializer implements Serializer<string, Date> {
  serialize(value: Date): string {
    return value.toISOString();
  }
  deserialize(value: string): Date {
    return new Date(value);
  }
}
```

## InMemoryStorage

```typescript
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';

const memory = new InMemoryStorage();
memory.setItem('temp', 'data');
memory.getItem('temp'); // 'data'
memory.length; // 1
```

Full `Storage` interface implementation using a `Map` backend. Used automatically by `getStorage()` in Node/SSR.

## Installation

```bash
pnpm add @ahoo-wang/fetcher-storage
```

## Quick Start

```typescript
import { KeyStorage, getStorage } from '@ahoo-wang/fetcher-storage';

const userStorage = new KeyStorage<{ name: string }>({
  key: 'user',
  defaultValue: { name: 'Guest' },
});

userStorage.set({ name: 'John' });
userStorage.get(); // { name: 'John' }

const removeListener = userStorage.addListener({
  name: 'user-logger',
  handle(event) {
    console.log('User changed:', event.newValue);
  },
});

// Cleanup when done
removeListener();
userStorage.destroy();
```

## Related Packages

- `@ahoo-wang/fetcher-eventbus` — EventBus, BroadcastTypedEventBus for cross-tab sync
