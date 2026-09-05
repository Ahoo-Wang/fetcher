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
| `defaultValue` | `T` (optional)                   | Value returned by `get()` when key is missing in storage |

### Methods

- `get(): T | null` — Get value (cached, or deserialized from storage). Returns `defaultValue` if key missing.
- `set(value: T): void` — Store value with caching and emit change event.
- `remove(): void` — Remove value, clear cache, emit change event.
- `destroy(): void` — Remove the internal event handler and release this storage's share of the default message transformer. The automatic codec stays on the supplied bus so its direct subscribers can decode messages already in transit. Call when done.
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

`KeyStorage` defaults to `SerialTypedEventBus`, so its change notifications stay in the current JavaScript context. Pass a `BroadcastTypedEventBus` to enable browser cross-tab synchronization; its default messenger uses `BroadcastChannel` with a `StorageEvent` fallback. When the bus has no `messageTransformer`, KeyStorage installs its default snapshot conversion. Storage instances sharing that bus also share the default transformer and snapshot table; their serializers must accept the same value type and wire representation. Receiving caches and listeners use the serializer to restore custom class semantics for both `newValue` and `oldValue`.

`keyStorage.eventBus` is the supplied bus itself. A preconfigured `messageTransformer` takes precedence and remains unchanged; the caller then owns transport encoding and decoding of ordinary `StorageEvent` values, including custom class restoration. KeyStorage does not send its private snapshot format through the caller's transformer. `destroy()` releases one default-transformer owner but leaves the codec available to direct bus subscribers. When no owners remain, a later KeyStorage can install its serializer and snapshot table if the bus still uses that automatic codec. Preconfigured or subsequently replaced transformers remain in place. In-flight emissions retain their starting transformer and snapshots after an owner is destroyed; incoming messages use the codec present when they arrive, including after an explicit replacement or idle-bus takeover.

With the default transformer, storage snapshots are serialized only at the messenger boundary and decoded before any receiving handler runs. Subscribers registered on the supplied bus before or after KeyStorage construction, through `eventBus.on`, or through `addListener` all receive standard enumerable `newValue` and `oldValue` fields. Spreading or JSON-serializing these events does not expose transport metadata. Local notifications preserve object identity; ordinary custom local buses receive the same standard events.

Wire messages additionally retain each JSON-serializable standard value alongside snapshot metadata, so existing tabs that only understand `newValue`/`oldValue` continue receiving ordinary JSON updates. Unsupported JSON values, such as BigInt or cyclic objects, use only the string snapshots and require the newer decoder; those values cannot be reconstructed by a legacy receiver. The default channel and storage keys do not change.

For the default transformer, the old snapshot comes from the stored string without reserializing a cached value, so readable legacy values can still be replaced or removed. When storage returns null or undefined for a missing key, a serializable source default is included as the old value. If that default cannot be serialized, the optional snapshot read fails, or a receiving serializer cannot decode the old snapshot, remote `oldValue` is undefined and a valid new value still updates the cache and listeners. New-value decoding errors, uncached `get()` reads and actual storage writes/removals still propagate their errors.

```typescript
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { KeyStorage, type StorageEvent } from '@ahoo-wang/fetcher-storage';

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
import {
  JsonSerializer,
  KeyStorage,
  jsonSerializer,
} from '@ahoo-wang/fetcher-storage';

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

Passes values through unchanged. Because `KeyStorage` persists through the DOM `Storage` contract, its serialized value must be a string; use the identity serializer with `KeyStorage<string>` only.

```typescript
import { IdentitySerializer, KeyStorage } from '@ahoo-wang/fetcher-storage';

const stringStorage = new KeyStorage<string>({
  key: 'simple',
  serializer: new IdentitySerializer<string>(),
});
```

### `typedIdentitySerializer<T>()` — Type-safe singleton

```typescript
import {
  KeyStorage,
  typedIdentitySerializer,
} from '@ahoo-wang/fetcher-storage';

const typedStringStorage = new KeyStorage<string>({
  key: 'label',
  serializer: typedIdentitySerializer<string>(),
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
