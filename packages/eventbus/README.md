# `@ahoo-wang/fetcher-eventbus`

Typed serial, parallel, and cross-tab events without a framework runtime. Use an
event bus for transient notifications between owners—not as hidden persistent
state.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus
```

Peer dependency: `@ahoo-wang/fetcher`.

## Example

```ts
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface UserSaved {
  id: string;
}

const events = new SerialTypedEventBus<UserSaved>('user-saved');

events.on({
  name: 'refresh-profile',
  order: 10,
  handle: ({ id }) => console.log(id),
});

await events.emit({ id: 'u-42' });
events.destroy();
```

## Core capabilities

- Serial handlers in ascending order.
- Parallel delivery for independent handlers.
- `once` handlers and unique handler names.
- Named event maps through `EventBus<Events>`.
- BroadcastChannel or storage-backed cross-tab messaging.
- Explicit `off()` and `destroy()` lifecycle cleanup.

## Documentation

- [State and events recipe](https://fetcher.ahoo.me/recipes/state-and-events)
- [Event bus reference](https://fetcher.ahoo.me/reference/eventbus)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
