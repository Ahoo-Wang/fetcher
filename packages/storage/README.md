# `@ahoo-wang/fetcher-storage`

Store one typed value with serialization, caching, and change notifications.
Use it for small application preferences or tokens that fit the browser
`Storage` model; use a database for queryable or transactional data.

## Install

```bash
pnpm add @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-storage
```

Peer dependency: `@ahoo-wang/fetcher-eventbus`.

## Example

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
  name: 'apply-theme',
  handle: ({ newValue }) => console.log(newValue?.theme),
});

preferences.set({ theme: 'dark' });

removeListener();
preferences.destroy();
```

## Core capabilities

- Browser `localStorage` with an in-memory fallback.
- One cached, typed value per `KeyStorage` instance.
- JSON serialization by default and custom serializers when needed.
- Typed `{ oldValue, newValue }` notifications.
- Explicit listener removal and owner cleanup.

## Documentation

- [State and events recipe](https://fetcher.ahoo.me/recipes/state-and-events)
- [Storage reference](https://fetcher.ahoo.me/reference/storage)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
