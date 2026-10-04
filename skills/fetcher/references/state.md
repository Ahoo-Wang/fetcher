# Events and persisted values — `@ahoo-wang/fetcher-eventbus`, `@ahoo-wang/fetcher-storage`

Choose by what must survive: **a notification** (nothing stored) is an event
bus; **a value** (theme, draft, token) is a `KeyStorage`, which can also sync
across tabs.

## Event bus

| Bus                      | Use                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| `SerialTypedEventBus`    | Handlers in `order` (lower first, default 0), one after another       |
| `ParallelTypedEventBus`  | All handlers at once with `Promise.all`; **ignores `order`**          |
| `BroadcastTypedEventBus` | Wraps a delegate bus and also delivers to other tabs                  |
| `EventBus<Events>`       | Many event types; creates one typed bus per type on first `on`/`emit` |

- **`on(handler)` returns `boolean`, not an unsubscribe function.** A handler is
  `{ name, order?, once?, handle }`; a duplicate `name` returns `false` and keeps
  the existing one. Unsubscribe with `off(name)`.
- **Handler errors never reject `emit()`**: they are logged with
  `console.warn` and the next handler still runs.
- **Cross-tab**: `new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus(type) })`.
  The channel is named after the delegate's `type`, so every tab must use the
  same string, and two buses with the same type are one channel. `emit` runs the
  local handlers, then posts; a tab never receives its own post. Payloads are
  structured-cloned (no functions or prototypes); with the `localStorage`
  fallback messenger they go through JSON (a `Date` arrives as a string). The
  constructor throws when neither `BroadcastChannel` nor `localStorage` exists.
- `once: true` handlers are removed before dispatch, so they fire once even
  with overlapping emits.
- `destroy()` on a broadcast bus stops cross-tab traffic but keeps the
  delegate's handlers; it closes only a messenger it created.
- **Node has `BroadcastChannel`**: broadcast buses in one test worker or server
  process talk to each other. Use a plain serial bus or unique types there.

## KeyStorage

```text
new KeyStorage<T>({ key, defaultValue?, serializer?, storage?, eventBus? })
```

- **Cross-tab sync is opt-in.** The default bus is local to the instance. Pass
  `eventBus: new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus<StorageEvent<T>>(key) })`.
  Native `storage` events are not used.
- **One delegate type per key.** Two broadcast buses whose delegates share a
  type share a channel and overwrite each other's values. Name the delegate
  after the key.
- **Listeners**: `addListener({ name, handle })` returns a remover function
  (there is no `on`/`subscribe` on `KeyStorage`). A taken name returns a no-op
  remover. Listeners run **asynchronously** after `set()`: tests must wait
  (`await vi.waitFor(…)`). The handler gets `{ newValue, oldValue }`.
- **`get()` is cached.** A direct `localStorage.setItem`, or a `KeyStorage` on a
  different bus, is invisible until `reload()`. Instances that must agree
  should share a bus.
- **Always `set` a new object.** `get()` returns the cached object; mutating
  it and calling `set(sameObject)` reports `oldValue === newValue`.
- **`defaultValue`** is returned while the key is absent, never written, and
  returned by reference: treat it as immutable.
- `set(undefined)` removes the key. A stored value that cannot be deserialized
  is removed with a warning and read as the default.
- The default serializer is JSON: `Date`, `Map` and class instances do not
  round-trip; write a `Serializer<string, T>`. `typedIdentitySerializer<T>()` is
  for string values only.
- **Backend**: `localStorage` when `window` exists, otherwise a new, unshared
  `InMemoryStorage` per instance. For tests and SSR pass
  `storage: new InMemoryStorage()` per test and keep the default local bus.
- **`destroy()`** closes only the bus the storage created. A bus you passed in,
  and your listeners, stay alive: destroy them yourself.

## Examples

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

interface CartUpdated {
  cartId: string;
  count: number;
}

export const cartUpdated = new BroadcastTypedEventBus<CartUpdated>({
  delegate: new SerialTypedEventBus<CartUpdated>('cart-updated'),
});
cartUpdated.on({ name: 'audit', order: 0, handle: event => audit(event) });
cartUpdated.on({
  name: 'badge',
  order: 10,
  handle: event => setBadge(event.count),
});
await cartUpdated.emit({ cartId: 'c1', count: 3 });
cartUpdated.off('badge');
```

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { KeyStorage, type StorageEvent } from '@ahoo-wang/fetcher-storage';

type Theme = { mode: 'light' | 'dark' };

export const themeStorage = new KeyStorage<Theme>({
  key: 'app:theme',
  defaultValue: { mode: 'light' },
  eventBus: new BroadcastTypedEventBus<StorageEvent<Theme>>({
    delegate: new SerialTypedEventBus<StorageEvent<Theme>>('app:theme'),
  }),
});

const stop = themeStorage.addListener({
  name: 'apply-theme',
  handle: ({ newValue }) => {
    document.documentElement.dataset.theme = (
      newValue ?? { mode: 'light' }
    ).mode;
  },
});
themeStorage.set({ mode: 'dark' });

// Cleanup: the bus was passed in, so destroy it too.
stop();
themeStorage.destroy();
themeStorage.eventBus.destroy();
```
