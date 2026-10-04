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

`getStorage()` checks only `typeof window !== 'undefined'`; it does not probe whether `localStorage` is accessible. Each call without a window returns a new, unshared `InMemoryStorage`.

## Core Interfaces

### `StorageEvent<Deserialized>`

```typescript
interface StorageEvent<Deserialized> {
  newValue?: Deserialized | null;
  oldValue?: Deserialized | null;
}
```

`set()` emits `{ newValue: value, oldValue }` and `remove()` emits `{ newValue: null, oldValue }`, where `oldValue` is what `get()` returned before (possibly the `defaultValue`).

### `StorageListenable<Deserialized>`

```typescript
interface StorageListenable<Deserialized> {
  addListener(
    listener: EventHandler<StorageEvent<Deserialized>>,
  ): RemoveStorageListener;
}
```

`EventHandler` (from `@ahoo-wang/fetcher-eventbus`) is `{ name: string; order?: number; once?: boolean; handle(event): void | Promise<void> }`.
`RemoveStorageListener` is `() => void`; it removes this listener only (a later listener registered under the same name is left alone).

This `StorageEvent` type shadows the DOM global `StorageEvent`; import it explicitly (`import type { StorageEvent } from '@ahoo-wang/fetcher-storage'`).

## KeyStorage

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

const userStorage = new KeyStorage<{ name: string; age: number }>({
  key: 'user',
});
```

### KeyStorageOptions\<T\>

| Option         | Type                             | Description                                                                                                                   |
| -------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `key`          | `string`                         | Storage key (required)                                                                                                        |
| `serializer`   | `Serializer<string, T>`          | Custom serializer (default: `jsonSerializer`)                                                                                 |
| `storage`      | `Storage`                        | Custom backend (default: `getStorage()`)                                                                                      |
| `eventBus`     | `TypedEventBus<StorageEvent<T>>` | Bus for change events (default: a new local `SerialTypedEventBus('KeyStorage:{key}')`); a `BroadcastTypedEventBus` syncs tabs |
| `defaultValue` | `T` (optional)                   | Value returned by `get()` when key is missing in storage                                                                      |

### Methods

- `get(): T | null` — Returns the in-memory cache if non-null; otherwise reads and deserializes the key (and caches it). Returns `defaultValue` (or `null`) if the key is missing; the default is neither cached nor written. A stored value that fails to deserialize is removed with a `console.warn` and read as missing, so it cannot make every later `get`/`set`/`remove` throw. The cache is updated only by this instance's `set`/`remove`/`reload` and by events on its bus (its cache handler runs first, at `order: Number.MIN_SAFE_INTEGER`, so listeners already see the new value via `get()`). Writes that bypass the bus are not seen by `get()` once a value is cached: another `KeyStorage` for the same key with its own (default) bus, a direct `storage.setItem`, or another tab without a broadcast bus. Share one instance, or one bus, between code that must agree.
- `set(value: T): void` — Store value with caching and emit change event. `set(undefined)` removes the value (same as `remove()`).
- `remove(): void` — Remove value, clear cache, emit change event.
- `reload(): T | null` — Re-reads the key bypassing the cache, for a value another tab may have written before its change event arrived. Keeps the cached object when the stored text is unchanged; returns `defaultValue` (or `null`) when the key is missing.
- `destroy(): void` — Removes this instance's internal cache handler from the bus and destroys the bus this instance created (the default `SerialTypedEventBus`, or one a subclass marked with the protected `ownEventBus()`). It does not destroy a bus passed in `eventBus`, does not remove listeners added with `addListener`, and leaves any automatic codec installed on a broadcast bus.
- `addListener(handler: EventHandler<StorageEvent<T>>): RemoveStorageListener` — Registers on `eventBus` via `on()`. When the `name` is already taken on that bus, the handler is not added and the returned remover does nothing; otherwise the remover removes exactly this handler.
- `eventBus` — Public readonly; the supplied bus or a default `SerialTypedEventBus` with type `KeyStorage:{key}`.

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

`KeyStorage` defaults to a local `SerialTypedEventBus`, so change notifications stay in the current JavaScript context. Pass a `BroadcastTypedEventBus` to sync tabs: a `set()`/`remove()` in one tab updates the other tabs' caches and calls their listeners. The value is written to the backend (`localStorage`) by the writing tab only; the bus carries the event. Native `window` `storage` events are not used. `BroadcastTypedEventBus` throws `Error('Messenger setup failed')` where no cross-tab messenger exists (SSR/Node without `BroadcastChannel`), so create it only in the browser.

Rules:

- **One key per broadcast bus.** Binding a second `KeyStorage` with a different `key` to the same bus throws (`A shared storage event bus requires the same storage key`). Two instances for the same key may share it.
- **One serializer instance per bus.** When the bus has no `messageTransformer`, `KeyStorage` installs an automatic codec that sends the serialized value and decodes it with the same serializer on the receiving side, so custom classes (e.g. `Date` with a `DateSerializer`) arrive restored. A different serializer object on the same bus throws; instances that both omit `serializer` share the default one. The binding outlives `destroy()`.
- **A caller-supplied `messageTransformer`** (set before the first `KeyStorage`) is left alone; the caller then owns encoding and decoding of `StorageEvent` values.
- On the receiving side `oldValue` can be `undefined` when the old value could not be serialized or decoded; `newValue` is still applied. A received event whose `newValue` cannot be decoded is dropped with a `console.warn`.
- Messages from older versions without serialized snapshots are passed through as-is unless the serializer implements `deserializeLegacy(value: unknown): T`.
- Serialization, storage write and removal errors from `set()`/`remove()` throw synchronously; listener errors are only logged.

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

`Serializer<Serialized, Deserialized>` defines `serialize(value: any): Serialized`,
`deserialize(value: Serialized): Deserialized`, and optional
`deserializeLegacy(value: unknown): Deserialized` for restoring legacy broadcast
messages (see above). `KeyStorage` takes a `Serializer<string, T>`.

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

Full `Storage` interface implementation using a `Map` backend; `setItem` stores `String(value)` like Web Storage. Used automatically by `getStorage()` in Node/SSR (a new one per call). It fires no events — pair it with a local bus in tests.

## Installation

`@ahoo-wang/fetcher-eventbus` is the only peer dependency:

```bash
pnpm add @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-eventbus
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
