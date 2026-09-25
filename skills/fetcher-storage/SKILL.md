---
name: fetcher-storage
description: >
  Persist one typed value per key with `@ahoo-wang/fetcher-storage`: `KeyStorage` with defaults, serializers, change listeners, caching, `InMemoryStorage` for tests/SSR, and optional cross-tab sync through a broadcast bus. Use for "remember this setting/token/draft" or to keep a stored value such as a theme in sync across browser tabs. For notifications without a stored value use fetcher-eventbus.
---

# fetcher-storage

## Decisions

- **Backend**: `KeyStorage` uses `getStorage()` by default — `localStorage` when `window` exists, otherwise a fresh, unshared `InMemoryStorage` per call. It does **not** fall back when `localStorage` exists but is blocked. Pass `storage: new InMemoryStorage()` in tests and SSR for determinism.
- **Serializer**: the default is `jsonSerializer`; leave it unless values need a custom format. `typedIdentitySerializer<T>()` only makes sense for `KeyStorage<string>`, since `Storage` holds strings.
- **Cross-tab sync is opt-in**: the default `eventBus` is a local `SerialTypedEventBus('KeyStorage:{key}')`. Pass `eventBus: new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus('app:theme') })` to sync; native `storage` events are never used.

## Gotchas a capable model gets wrong

- `get()` caches. Writes that bypass this instance or its bus (direct `localStorage.setItem`) are not seen once a value is cached; `reload()` re-reads the backend (keeping the cached object when the stored text is unchanged).
- `defaultValue` is returned when nothing is stored but is never written or cached.
- `addListener(handler)` returns a remover function; a duplicate handler `name` is ignored silently, and its remover then deletes the handler registered first under that name.
- `destroy()` detaches the internal cache handler and closes the bus the storage created (the default one); listeners and a bus passed in `eventBus` stay alive.
- One broadcast bus serves one key (and one serializer instance); sharing it across keys throws.
- Installing needs the peers: `@ahoo-wang/fetcher-eventbus`, which itself needs `@ahoo-wang/fetcher`.

## Minimal example

```ts
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';

const theme = new KeyStorage<{ mode: 'light' | 'dark' }>({
  key: 'app:theme',
  defaultValue: { mode: 'light' },
  storage: new InMemoryStorage(), // omit in the browser to use localStorage
});
const remove = theme.addListener({
  name: 'theme-log',
  handle: e => console.log(e.oldValue, '->', e.newValue),
});
theme.set({ mode: 'dark' });
theme.get(); // { mode: 'dark' }
remove();
theme.destroy();
```

## References

- `references/api.md`: `KeyStorageOptions`, listener API, serializers, `InMemoryStorage`, environment detection and cross-tab setup. Load it for exact signatures.

## Related Skills

- $fetcher-eventbus: the buses and messengers underneath storage events.
- $fetcher-react-hooks: `useKeyStorage` / `useImmerKeyStorage` bind a `KeyStorage` to component state.
- $fetcher-cosec-auth: token, device-id and space-id storages built on `KeyStorage`.
