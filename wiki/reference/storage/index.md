---
prev: false
title: 'Storage reference'
description: 'Typed values backed by browser Storage or memory, with explicit notification ownership.'
---

# Storage reference

Typed values backed by browser Storage or memory, with explicit notification ownership.

## Installation and runtime

```sh
pnpm add @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher
```

The command includes the recursive peer chain: Storage → EventBus → Fetcher. Browser persistence needs accessible localStorage; non-browser defaults use a fresh memory store.

Version 5.0.0 declares Node >=18.20.8 for consumers. Repository development has a separate Node >=20.20.2 / pnpm 10.34.5 requirement. Browser/runtime APIs used by a feature must also exist; the engine range is not a promise that every Web API (for example Response.bytes) is available.

## Choose an entry point

Use `KeyStorage` for a typed value and listeners; use native `Storage` or `InMemoryStorage` directly when only string storage is needed. The default local serial bus does not synchronize tabs. Inject one shared bus for coordinated instances, or an explicitly owned broadcast bus for cross-context notification.

## Choose a topic

| Topic                                                             | Use it for                                                                                                                                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [KeyStorage and change listeners](key-storage.md)                 | `KeyStorage<T>` binds one typed value to one string key. Operations are synchronous; notifications are dispatched asynchronously through an event bus. It does not automatically watch native browser storage events. |
| [Serialization and runtime storage](serialization-and-runtime.md) | Use a string serializer with `KeyStorage`; use a native `Storage` backend or the exported in-memory implementation. Runtime detection selects a backend, not a durability or availability guarantee.                  |

## Minimal complete example

```ts
import { KeyStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';

const settings = new KeyStorage<{ theme: string }>({
  key: 'settings',
  storage: new InMemoryStorage(),
  defaultValue: { theme: 'system' },
});
const removeListener = settings.addListener({
  name: 'settings-ui',
  handle: event => {
    console.log(event.newValue);
  },
});
settings.set({ theme: 'dark' });
console.assert(settings.get()?.theme === 'dark');
settings.remove();
console.assert(settings.get()?.theme === 'system');
removeListener();
settings.destroy();
settings.eventBus.destroy();
```

[Complete public symbol index](./symbols.md)
