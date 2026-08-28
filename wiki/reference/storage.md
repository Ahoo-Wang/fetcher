---
title: Storage reference
description: Persist one typed key, choose serialization and runtime storage, and own local change listeners.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-storage`

`KeyStorage<T>` wraps exactly one `Storage` key with synchronous serialization,
a nullable cache, and event-bus notifications. It is not a multi-key database,
a migration layer, or automatic browser `storage`-event synchronizer.

## Install

```bash
pnpm add @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-storage
```

`@ahoo-wang/fetcher-eventbus` is a peer dependency. In browsers the default
runtime reads `window.localStorage`; in non-browser runtimes it creates an
`InMemoryStorage` instance.

## Construct `KeyStorage<T>`

```ts
import {
  InMemoryStorage,
  KeyStorage,
} from '@ahoo-wang/fetcher-storage';

interface Preferences {
  theme: 'light' | 'dark';
}

const preferences = new KeyStorage<Preferences>({
  key: 'preferences',
  defaultValue: { theme: 'light' },
  storage: new InMemoryStorage(),
});

const removeThemeListener = preferences.addListener({
  name: 'apply-theme',
  handle: ({ newValue }) => console.log(newValue?.theme),
});

preferences.set({ theme: 'dark' });
console.log(preferences.get());
preferences.remove();
removeThemeListener();
preferences.destroy();
```

| Option | Type / default | Contract |
| --- | --- | --- |
| `key` | `string`, required | The one underlying `Storage` key. |
| `serializer` | `Serializer<string, T>` / `jsonSerializer` | Converts `T` to/from the string required by the DOM `Storage` API. |
| `storage` | `Storage` / `getStorage()` | Explicit browser, test, or custom storage implementation. |
| `eventBus` | `TypedEventBus<StorageEvent<T>>` / new `SerialTypedEventBus` | Delivers change events and owns the cache invalidation handler. |
| `defaultValue` | `T` / `null` | Returned by `get()` when the underlying key is absent. |

The default serializer is JSON, not an identity serializer. `defaultValue` is
normalized with `?? null`, so a supplied `null` is treated as absence.

## Method and event contract

| API | Return | Storage, cache, and listener behavior |
| --- | --- | --- |
| `get()` | `T \| null` | Returns a non-null cached value; otherwise reads and deserializes the key, or returns `defaultValue`. |
| `set(value)` | `void` | Reads the previous value, serializes and writes, caches `value`, then emits `{ oldValue, newValue: value }`. |
| `remove()` | `void` | Reads the previous value, removes the key, clears the cache, then emits `{ oldValue, newValue: null }`. |
| `addListener(handler)` | `() => void` | Registers `EventHandler<StorageEvent<T>>`; the returned function calls `off(handler.name)`. |
| `destroy()` | `void` | Removes only the instance's internal cache-invalidation handler. |

`StorageEvent<T>` has optional `oldValue?: T | null` and `newValue?: T | null`.
The current `set()` / `remove()` implementations populate both fields. Since
`eventBus.emit()` is not awaited by these `void` methods, do not rely on `set()`
or `remove()` to mean async listeners have completed.

## Serializer and storage selection

| Need | Use | Boundary |
| --- | --- | --- |
| Structured data in DOM storage | `JsonSerializer` or `jsonSerializer` | `JSON.stringify` / `JSON.parse`; invalid persisted JSON throws from `get()`. |
| Already-string values | `typedIdentitySerializer<string>()` | Identity is compatible with `KeyStorage` because DOM `Storage` values are strings. |
| Isolated test or SSR state | `new InMemoryStorage()` | A new in-process `Map<string, string>`; no persistence or sharing. |
| Application-controlled persistence | A supplied `Storage` | `KeyStorage` delegates `getItem`, `setItem`, and `removeItem` directly. |

`Serializer<Serialized, Deserialized>` exposes `serialize(value)` and
`deserialize(value)`. `IdentitySerializer<T>` is public, but `KeyStorage<T>`
requires a serializer whose serialized type is `string`; do not use identity
for object values with browser storage.

| Runtime | `getStorage()` result | Persistence / failure boundary |
| --- | --- | --- |
| Browser (`window` exists) | `window.localStorage` | Same-origin persistent storage; accessing it may throw under browser policy. |
| SSR / non-browser | `new InMemoryStorage()` | Fresh process-local storage for each `getStorage()` call. |

`getStorage()` does not catch a `localStorage` access failure or fall back in a
browser. Pass `InMemoryStorage` or another explicit implementation when that is
your product policy.

## Listener lifecycle and cross-context behavior

The default serial event bus is local to the `KeyStorage` instance. Calling
`set()` in one tab does not make another instance observe the browser's native
`storage` event. To distribute values, provide an event bus that implements the
required transport, and ensure every consumer subscribes to that shared bus;
the payload contains values, not the storage key.

`remove()` is data mutation: it calls the underlying `removeItem`, changes the
cache to `null`, and emits a removal event. `destroy()` is listener cleanup: it
does not remove data, clear caller listeners, or destroy a supplied event bus.
Call the remover returned by `addListener()` for every caller-owned listener
before destroying the wrapper.

## Diagnosis

| Symptom | Check |
| --- | --- |
| `get()` repeatedly deserializes a default or missing value | Only non-null values are cached; use an explicit sentinel in your domain if repeated reads matter. |
| `get()` throws | Validate stored JSON / custom `deserialize`, and check whether the supplied storage throws. |
| `set()` throws before listeners run | Check `serialize` and `storage.setItem`; these synchronous errors propagate and prevent emission. |
| A listener runs later than `set()` | `set()` ignores the event bus promise; do not use it as a listener-completion barrier. |
| Another tab does not observe changes | Default notifications are local; wire a shared cross-context event bus yourself. |
| Data disappears after cleanup | Verify `remove()` was not called; `destroy()` never deletes the underlying key. |
| Browser storage access fails | Supply a test/memory/custom storage; `getStorage()` does not catch restricted `localStorage` access. |

## Source reference

- Public exports: [index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/index.ts#L14)
- StorageEvent: [keyStorage.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L23)
- KeyStorage options: [keyStorage.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L47)
- KeyStorage lifecycle: [keyStorage.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L80)
- Serializer contract: [serializer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L19)
- JsonSerializer: [serializer.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L38)
- IdentitySerializer: [serializer.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L62)
- Runtime storage selection: [env.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L29)
- In-memory implementation: [inMemoryStorage.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/inMemoryStorage.ts#L14)
