---
title: Share State and Events
description: Store typed values and coordinate serial, parallel, and cross-tab work with Fetcher packages.
---

# Share State and Events

Use storage for durable/current values and an event bus for transient notifications. Do not use an event bus as an implicit database.

## Store a typed value

```ts
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';

interface Preferences {
  theme: 'light' | 'dark';
}

const preferences = new KeyStorage<Preferences>({
  key: 'preferences',
  storage: new InMemoryStorage(),
  defaultValue: { theme: 'light' },
});

const removeListener = preferences.addListener({
  name: 'render-preferences',
  order: 0,
  handle: event => console.log(event.newValue),
});

preferences.set({ theme: 'dark' });
console.log(preferences.get()); // { theme: 'dark' }

removeListener();
preferences.destroy();
```

`KeyStorage` serializes values as JSON by default, caches the deserialized value, and invalidates it through storage events. Provide `InMemoryStorage` for tests or non-persistent state; the default storage is selected from the current environment.

## Run handlers in order

```ts
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface UserSaved {
  id: string;
}

const saved = new SerialTypedEventBus<UserSaved>('user-saved');

saved.on({
  name: 'cache',
  order: 10,
  handle: event => console.log('cache', event.id),
});
saved.on({
  name: 'toast',
  order: 20,
  once: true,
  handle: event => console.log('toast', event.id),
});

await saved.emit({ id: '42' });
saved.destroy();
```

Serial handlers run by ascending order. A `once` handler is removed after it runs. Handler names are unique.

## Run independent handlers concurrently

Use `ParallelTypedEventBus` only when handlers do not depend on each other's effects:

```ts
import { ParallelTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const bus = new ParallelTypedEventBus<UserSaved>('user-saved');
```

`emit()` waits for all handlers. Handler failures are logged by the bus implementation and do not stop unrelated handlers.

## Broadcast across tabs

Wrap a local bus:

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const local = new SerialTypedEventBus<UserSaved>('user-saved');
const broadcast = new BroadcastTypedEventBus({ delegate: local });

broadcast.on({
  name: 'refresh-user',
  order: 0,
  handle: event => console.log(event.id),
});

await broadcast.emit({ id: '42' });
broadcast.destroy();
```

The event must be structured-clone/serialization safe for the chosen messenger. `destroy()` closes cross-tab messaging; call it when the owner unmounts or shuts down.

## Choose the smallest tool

- One module owns the value: a variable may be enough.
- The value must survive reload: use `KeyStorage` with browser storage.
- Several local consumers react to a transient event: use a serial bus.
- Consumers are independent and slow: consider a parallel bus.
- Other tabs must react: use a broadcast bus and explicit cleanup.
