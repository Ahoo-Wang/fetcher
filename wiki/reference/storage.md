---
title: Storage reference
description: Store one typed value, observe changes, and select browser or in-memory persistence.
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

## Storage and serializers

`getStorage()` returns `localStorage` when it is available and an
`InMemoryStorage` otherwise. Pass an explicit storage when persistence scope is
part of your application contract.

Use `JsonSerializer` / `jsonSerializer` for structured values. Use
`IdentitySerializer` or `typedIdentitySerializer<T>()` only with a storage
implementation whose value type already matches `T`.

## Lifecycle

`addListener()` returns a remover. Call both listener removers and `destroy()`
when the owning component or service is disposed. The default event bus is
in-process; use an event-bus cross-tab messenger when browser tabs must observe
one another.

See [State and events](../recipes/state-and-events.md) for a complete ownership
example.
