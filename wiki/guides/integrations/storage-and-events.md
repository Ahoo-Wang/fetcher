---
next: false
title: Share State and Events
description: Verify local state and ordered events, then opt into browser tab notifications.
---

# Share State and Events

Keep current values in storage and use events to notify consumers. First run a deterministic in-memory check; add cross-tab delivery only if your application needs it.

Installation must also resolve every declared peer dependency; see the [package prerequisites](../../reference/storage/index.md) for the complete graph. Application routes and identities below are supplied by your application, not created by installation.

## 1. Install and run a local check

Install `@ahoo-wang/fetcher-storage` and `@ahoo-wang/fetcher-eventbus`. Call this function in a runtime with the packages installed:

```ts
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface Preferences {
  theme: 'light' | 'dark';
}

export async function checkStateAndEvents() {
  const preferences = new KeyStorage<Preferences>({
    key: 'preferences',
    storage: new InMemoryStorage(),
    defaultValue: { theme: 'light' },
  });
  const remove = preferences.addListener({
    name: 'render-preferences',
    order: 0,
    handle: event => {
      console.log(event.newValue);
    },
  });
  const saved = new SerialTypedEventBus<{ id: string }>('user-saved');
  const calls: string[] = [];
  saved.on({
    name: 'cache',
    order: 10,
    handle: () => {
      calls.push('cache');
    },
  });
  saved.on({
    name: 'toast',
    order: 20,
    once: true,
    handle: () => {
      calls.push('toast');
    },
  });
  try {
    preferences.set({ theme: 'dark' });
    if (preferences.get()?.theme !== 'dark')
      throw new Error('Storage check failed');
    await saved.emit({ id: '42' });
    await saved.emit({ id: '43' });
    if (calls.join(',') !== 'cache,toast,cache')
      throw new Error('Delivery check failed');
  } finally {
    remove();
    preferences.destroy();
    preferences.eventBus.destroy();
    saved.destroy();
  }
}
```

A successful call verifies the stored value, ascending handler order and a once-only notification. `set()` writes and updates the cache synchronously, but does not await asynchronous listeners. Use `await bus.emit()` when you need to wait for local event delivery.

## 2. Choose persistence explicitly

`InMemoryStorage` does not survive reload. Browser `localStorage` persists strings; `KeyStorage` defaults to JSON serialization. Its default event bus is local: two independently constructed stores are not automatically a cross-tab reactive system. Parse failures, blocked storage access and quota errors can throw; handle them where the application chooses whether to retain an in-memory fallback or show an error.

## 3. Add browser tab notifications

Run the following in two same-origin browser tabs with storage access and an available cross-tab messenger:

```ts
import { KeyStorage, type StorageEvent } from '@ahoo-wang/fetcher-storage';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

export function watchTheme(onTheme: (theme: string) => void) {
  const bus = new BroadcastTypedEventBus({
    delegate: new SerialTypedEventBus<StorageEvent<string>>('app-theme'),
  });
  const theme = new KeyStorage<string>({
    key: 'app-theme',
    storage: localStorage,
    eventBus: bus,
    defaultValue: 'light',
  });
  const remove = theme.addListener({
    name: 'render-theme',
    order: 0,
    handle: event => {
      onTheme(event.newValue ?? 'light');
    },
  });
  onTheme(theme.get() ?? 'light');
  return {
    set: (value: 'light' | 'dark') => theme.set(value),
    dispose() {
      remove();
      theme.destroy();
      bus.destroy();
    },
  };
}
```

In each tab call `const theme = watchTheme(renderTheme)`, where `renderTheme` updates your UI. Call `theme.set('dark')` in one tab and check both UIs. Call `theme.dispose()` when its owner unmounts. This example owns its bus; do not destroy a bus shared with another owner.

Use the same key and channel in both tabs. The storage adapter installs a serialization bridge for broadcast values; a shared bus must represent one key and a compatible serializer. Messages are notifications, not a durable queue or conflict-resolution protocol. There is no delivery acknowledgement from all remote tabs.

## Failure and cleanup checklist

Handler names are unique; a second registration with the same name returns false. Handler errors are logged and do not stop other handlers. Use `ParallelTypedEventBus` only for independent consumers; its emit waits for local handlers, not remote acknowledgements. `destroy()` on KeyStorage only removes its internal listener; remove application listeners and close the owned bus separately. It does not delete stored values.

See [storage lifecycle](../../reference/storage/key-storage), [serialization and environment](../../reference/storage/serialization-and-runtime), [event delivery](../../reference/eventbus/events-and-delivery), and [broadcast messengers](../../reference/eventbus/broadcast-and-messengers).

[keyStorage.ts:242](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L242) selects the default local bus.

[Review integration boundaries](../../architecture/integration-decisions.md); [return to this task group](./index.md).
