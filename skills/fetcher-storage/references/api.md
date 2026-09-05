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

Automatic broadcast conversion preserves which standard fields are own properties.
A missing field stays absent; an explicitly present `undefined` stays present over
BroadcastChannel. JSON transports, including StorageMessenger, follow JSON's native
omission of `undefined` object fields. `set()` and `remove()` continue emitting both
fields. If an existing old-value snapshot cannot be decoded, the received event
retains an explicit `oldValue: undefined` instead of discarding its valid new value.

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

`KeyStorage` defaults to `SerialTypedEventBus`, so its change notifications stay in the current JavaScript context. Pass a `BroadcastTypedEventBus` to enable browser cross-tab synchronization; its default messenger uses `BroadcastChannel` with a `StorageEvent` fallback. A shared bus must represent the same logical storage key. A broadcast bus with the public `messageTransformer` capability gets an automatic snapshot codec when no caller codec is configured. That codec and its snapshot table stay bound to the exact same serializer object for the bus lifetime, even after all KeyStorage instances are destroyed. Passing a different key or a different serializer object to that automatic bus throws; use a new bus for a different key, format, or deserialization configuration. Separate but equivalent explicitly supplied serializer objects are not treated as interchangeable. When both instances omit `serializer`, they reuse the first instance's default JSON serializer, including across duplicate package modules. Ownership and snapshot state are shared across module copies in the same JavaScript global through a non-enumerable global registry of weak bus keys; no properties are added to the bus itself. Receiving caches and listeners use the serializer to restore custom class semantics for both `newValue` and `oldValue`.

`keyStorage.eventBus` is the supplied bus itself. A preconfigured `messageTransformer` takes precedence; the caller owns transport encoding and decoding of ordinary `StorageEvent` values, including custom class restoration. KeyStorage never installs an automatic codec on a bus that started with a caller codec. `destroy()` removes the instance's internal listener and leaves the automatic codec and snapshot table available for direct bus subscribers and pending messages. Clearing or replacing the codec is an explicit caller override: creating another KeyStorage does not reinstall or replace it. Existing automatic owners keep the same snapshot table, so explicitly restoring the original codec does not orphan their snapshots. In-flight emissions retain the transformer captured at dispatch; incoming messages use the caller-selected codec present when they arrive. The automatic codec captures each dispatch's wire snapshot before local listeners run. A prepared storage snapshot belongs to its originating dispatch; reentrant or later direct emits encode their own current public fields. Messenger serialization and posting still happen after local delivery, and caller codecs retain their default timing. For caller codecs and non-broadcast buses, all shared instances must also use the same value semantics and deserialization configuration because listeners receive the same public event object.

With the default transformer, prepared storage snapshots are attached only at the messenger boundary and decoded before any receiving handler runs. Subscribers registered on the supplied bus before or after KeyStorage construction, through `eventBus.on`, or through `addListener` all receive standard enumerable `newValue` and `oldValue` fields. Spreading or JSON-serializing these events does not expose transport metadata. Local notifications preserve object identity; ordinary custom local buses receive the same standard events.

Wire messages retain their ordinary standard fields for legacy receivers. BroadcastChannel
uses its native structured-clone semantics, preserving Date, Map, NaN, and undefined
properties. A non-enumerable wire `toJSON` is used only by JSON transports: it projects
each supported standard field using its original property key and omits unsupported
JSON values such as BigInt or cycles. If native cloning fails with `DataCloneError`,
the automatic transformer retries once with only the prepared string snapshots.
Neither preparation nor retry traverses the original values; native messenger
serialization retains its normal getter and `toJSON` behavior after local dispatch.
Values requiring snapshot-only transport cannot be restored by legacy receivers.
The default channel and storage keys do not change.

Legacy messages without snapshots keep their standard fields unless the serializer
explicitly implements `deserializeLegacy(value: unknown): T`. This optional hook may
restore a known old wire shape; arbitrary lost class prototypes cannot be recovered.
A failed legacy old-value decode leaves `oldValue` undefined, while a failed new-value
decode is warned and the message is not dispatched. Snapshot-aware endpoints sharing
the same key and channel across contexts must use compatible serialization formats
and decoding semantics. A serializer format change requires application migration
or a caller-provided independent channel; the generic serializer API does not detect
incompatible formats, including parsers that silently return an incorrect value.

For the automatic transformer, the old snapshot serializes the actual local `oldValue`, including a cached value or source default, so local and remote notifications describe the same transition. If that value cannot be serialized or the receiver cannot decode it, remote `oldValue` is undefined and a valid new value still updates the cache and listeners. Local buses and caller codecs do not perform this extra old-value serialization. Asynchronous event delivery failures are reported with a warning; synchronous serialization, storage read, write, and removal failures still propagate to the caller. Incoming new-value decoding failures are warned and dropped without changing the receiving cache.

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

`Serializer<Serialized, Deserialized>` defines `serialize(value)`,
`deserialize(value)`, and optional `deserializeLegacy(value: unknown)` for restoring
known legacy broadcast values. Only serialized snapshots use `deserialize`; the
legacy hook is never guessed from or replaced by a serialize/deserialize round trip.

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
