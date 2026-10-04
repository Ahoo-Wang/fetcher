---
name: fetcher-storage
description: >
  Persist one typed value per key with `@ahoo-wang/fetcher-storage`: `KeyStorage` (defaults, serializers, change listeners, caching), `InMemoryStorage` for tests and SSR, and cross-tab sync through a broadcast bus. Use to remember a setting, token or draft in localStorage, or to keep such a stored value (a theme, say) in sync across tabs. For notifications with nothing stored use fetcher-eventbus.
---

# fetcher-storage

## Decisions

- **Backend**: `KeyStorage` uses `getStorage()` by default — `localStorage` when `window` exists, otherwise a fresh, unshared `InMemoryStorage` per call. It does **not** fall back when `localStorage` exists but is blocked. Pass `storage: new InMemoryStorage()` in tests and SSR for determinism.
- **Serializer**: the default is `jsonSerializer`; leave it unless values need a custom format (`Serializer<string, T>`). `typedIdentitySerializer<T>()` only makes sense for `KeyStorage<string>`, since `Storage` holds strings.
- **Cross-tab sync is opt-in**: the default `eventBus` is a local `SerialTypedEventBus('KeyStorage:{key}')`. Pass `eventBus: new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus('app:theme') })` to sync; native `window` `storage` events are never used. One broadcast bus serves one key (and one serializer instance); reusing it for another key throws.
- **One instance per key**: share a single `KeyStorage` (export it from a module). Instances only see each other's writes through a shared `eventBus`.

## Gotchas a capable model gets wrong

- `get()` caches. A write that does not travel over this instance's bus — another `KeyStorage` for the same key with its own default bus, or a direct `localStorage.setItem` — is not seen once a value is cached; `reload()` re-reads the backend.
- `defaultValue` is returned when nothing is stored but is never written or cached.
- Listen with `addListener({ name, handle })`, which returns a remover function. The event is `{ newValue, oldValue }` (`StorageEvent<T>` from this package, not the DOM's). A `name` already registered on the bus is not added and gets a no-op remover.
- `set(undefined)` is `remove()`. An unreadable stored value is removed with a `console.warn` and read as missing.
- `destroy()` detaches the internal cache handler and destroys the bus only if the storage created it (the default one); listeners and a bus passed in `eventBus` stay alive.
- Peer: `@ahoo-wang/fetcher-eventbus` must be installed too.

## Minimal example

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { KeyStorage, type StorageEvent } from '@ahoo-wang/fetcher-storage';

interface Theme {
  mode: 'light' | 'dark';
}

// Browser only: BroadcastTypedEventBus throws when no cross-tab messenger exists.
export const themeStorage = new KeyStorage<Theme>({
  key: 'app:theme',
  defaultValue: { mode: 'light' },
  eventBus: new BroadcastTypedEventBus<StorageEvent<Theme>>({
    delegate: new SerialTypedEventBus('app:theme'),
  }),
});

const remove = themeStorage.addListener({
  name: 'theme-log',
  handle: e => console.log(e.oldValue, '->', e.newValue), // this tab and others
});
themeStorage.set({ mode: 'dark' });
themeStorage.get(); // { mode: 'dark' }
remove();
```

## References

- `references/api.md`: `KeyStorageOptions`, listener API, serializers, `InMemoryStorage`, environment detection and cross-tab details. Load it for exact signatures.

## Related Skills

- $fetcher-eventbus: the buses and messengers underneath storage events.
- $fetcher-react-hooks: `useKeyStorage` / `useImmerKeyStorage` bind a `KeyStorage` to component state.
- $fetcher-cosec-auth: token, device-id and space-id storages built on `KeyStorage`.
