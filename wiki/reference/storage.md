---
title: Storage reference
description: Store one typed value, observe changes, and select browser or in-memory persistence.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-storage`

The storage package wraps one `Storage` key with serialization, caching, and a
typed change event.

## Install

```bash
pnpm add @ahoo-wang/fetcher-storage
```

## Store a typed value

```ts
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

interface Preferences {
  theme: 'light' | 'dark';
}

const preferences = new KeyStorage<Preferences>({
  key: 'preferences',
  defaultValue: { theme: 'light' },
});

const removeListener = preferences.addListener({
  name: 'apply-theme',
  handle: ({ newValue }) => applyTheme(newValue?.theme ?? 'light'),
});

preferences.set({ theme: 'dark' });
preferences.get();
preferences.remove();

removeListener();
preferences.destroy();
```

## `KeyStorageOptions<T>`

| Option         | Default          | Purpose                                      |
| -------------- | ---------------- | -------------------------------------------- |
| `key`          | required         | Underlying storage key                       |
| `serializer`   | `jsonSerializer` | Convert between strings and `T`              |
| `storage`      | `getStorage()`   | Browser `localStorage` or in-memory fallback |
| `eventBus`     | serial typed bus | Deliver local change events                  |
| `defaultValue` | `null`           | Value returned when the key is absent        |

`get()` returns `T | null` and caches a deserialized value. `set()` and
`remove()` update storage, refresh the cache, and emit `{ oldValue, newValue }`.

## Method contract

| Method                 | Result           | Side effect                                           |
| ---------------------- | ---------------- | ----------------------------------------------------- |
| `get()`                | `T               | null`                                                 | Reads and caches the deserialized value |
| `set(value)`           | `void`           | Serializes, writes, updates cache, and emits a change |
| `remove()`             | `void`           | Removes the key, clears cache, and emits a change     |
| `addListener(handler)` | remover function | Subscribes to typed local changes                     |
| `destroy()`            | `void`           | Releases listeners and owned event resources          |

`StorageEvent<T>` contains the key plus `oldValue` and `newValue`. Treat
`null` as absence; do not overload it with a domain value when removal must be
distinguishable.

## Storage and serializers

`getStorage()` returns `localStorage` when it is available and an
`InMemoryStorage` otherwise. Pass an explicit storage when persistence scope is
part of your application contract.

Use `JsonSerializer` / `jsonSerializer` for structured values. Use
`IdentitySerializer` or `typedIdentitySerializer<T>()` only with a storage
implementation whose value type already matches `T`.

### Runtime selection

| Runtime                                | Default storage   | Persistence                        |
| -------------------------------------- | ----------------- | ---------------------------------- |
| Browser with accessible `localStorage` | `localStorage`    | Across reloads for the same origin |
| SSR, test, or restricted browser       | `InMemoryStorage` | Current process only               |

Pass storage explicitly when persistence is a requirement. The fallback keeps
code runnable; it does not promise durable data. Serializer failures surface
from `get()` or `set()`; version stored data when a schema change cannot safely
read the previous representation.

## Lifecycle

`addListener()` returns a remover. Call both listener removers and `destroy()`
when the owning component or service is disposed. The default event bus is
in-process; use an event-bus cross-tab messenger when browser tabs must observe
one another.

## Source and agent reference

- Public exports: [`packages/storage/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/index.ts)
- Detailed agent API: [`skills/fetcher-storage/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-storage/references/api.md)
- Skill: [`$fetcher-storage`](../skills/http-and-services.md#fetcher-storage)

See [State and events](../recipes/state-and-events.md) for a complete ownership
example.
