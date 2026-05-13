---
name: fetcher-eventbus
description: >
  Typed event bus system with serial (SerialTypedEventBus), parallel (ParallelTypedEventBus), and cross-tab broadcast (BroadcastTypedEventBus) execution strategies. Includes multi-type EventBus<Events> router, CrossTabMessenger (BroadcastChannelMessenger, StorageMessenger, createCrossTabMessenger), EventHandler with priority ordering and once-semantics, NameGenerator, and AbstractTypedEventBus base.
  Use for: event bus, events, broadcasting, cross-tab, BroadcastChannel, serial/parallel execution, typed events, EventBus, StorageMessenger, event handler priority, once handler, NameGenerator, cross-tab sync, StorageEvent fallback.
---

# fetcher-eventbus Skill

## When to Use

Use this skill when working with the `@ahoo-wang/fetcher-eventbus` package. Trigger when:

- User mentions **event bus**, **events**, **broadcasting**, or **cross-tab communication**
- User wants **serial** or **parallel event execution**
- User asks about **BroadcastChannel**, **StorageMessenger**, or **cross-tab sync**
- User needs **typed event handling** with TypeScript support
- User asks about **NameGenerator**, **once handlers**, or **event handler priority**

## Core Concepts

### TypedEventBus<EVENT> Interface

The core contract for all typed event bus implementations:

```typescript
interface TypedEventBus<EVENT> {
  type: EventType;
  handlers: EventHandler<EVENT>[];
  on(handler: EventHandler<EVENT>): boolean;   // false if duplicate name
  off(name: string): boolean;
  emit(event: EVENT): Promise<void>;
  destroy(): void;
}
```

### AbstractTypedEventBus<EVENT>

Abstract base class for all typed event bus implementations. Provides shared handler storage, error-wrapped `handleEvent()`, and `destroy()`. SerialTypedEventBus, ParallelTypedEventBus extend this.

### EventHandler<EVENT>

```typescript
interface EventHandler<EVENT> extends NamedCapable, OrderedCapable {
  name: string;           // Unique identifier (prevents duplicates)
  order: number;          // Execution priority (lower = earlier)
  handle(event: EVENT): void | Promise<void>;
  once?: boolean;         // If true, auto-removes after first execution
}
```

#### Once Handlers

Handlers with `once: true` automatically unregister after their first execution:

```typescript
bus.on({
  name: 'one-time-handler',
  order: 1,
  once: true,
  handle: event => console.log('This runs only once:', event),
});
```

### NameGenerator

Generates unique handler names via incrementing counter:

```typescript
import { nameGenerator, DefaultNameGenerator } from '@ahoo-wang/fetcher-eventbus';

nameGenerator.generate('handler'); // "handler_1"
nameGenerator.generate('handler'); // "handler_2"

// Or create a dedicated instance:
const gen = new DefaultNameGenerator();
gen.generate('listener'); // "listener_1"
```

## Event Bus Implementations

### 1. SerialTypedEventBus

Handlers execute **in priority order** (determined by `order` property). Each handler must complete before the next starts.

```typescript
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const bus = new SerialTypedEventBus<string>('my-events');

bus.on({
  name: 'logger',
  order: 1,
  handle: event => console.log('Event:', event),
});

bus.on({
  name: 'processor',
  order: 2,
  handle: event => console.log('Processing:', event),
});

await bus.emit('hello'); // Executes in order: logger then processor
```

### 2. ParallelTypedEventBus

Handlers execute **concurrently** regardless of order. Use when handlers are independent.

```typescript
import { ParallelTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const bus = new ParallelTypedEventBus<string>('my-events');

bus.on({
  name: 'handler1',
  order: 1,
  handle: async event => console.log('Handler 1:', event),
});

bus.on({
  name: 'handler2',
  order: 2,
  handle: async event => console.log('Handler 2:', event),
});

await bus.emit('hello'); // Both execute in parallel
```

### 3. BroadcastTypedEventBus

Broadcasts events to **other browser tabs** using a delegate bus. Works locally and cross-tab.

```typescript
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const delegate = new SerialTypedEventBus<string>('shared-events');
const bus = new BroadcastTypedEventBus({ delegate });

bus.on({
  name: 'cross-tab-handler',
  order: 1,
  handle: event => console.log('Received from other tab:', event),
});

await bus.emit('broadcast-message'); // Local + cross-tab
```

Default messenger channel: `_broadcast_:{type}`. Pass a custom `messenger` option to override.

### Generic EventBus<Events>

Manages multiple named event types with lazy-loaded TypedEventBus instances:

```typescript
import { EventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface AppEvents {
  'user:login': { username: string };
  'order:created': { orderId: string };
}

const supplier = (type: string) => new SerialTypedEventBus(type);
const appBus = new EventBus<AppEvents>(supplier);

appBus.on('user:login', {
  name: 'login-logger',
  order: 1,
  handle: e => console.log(`Welcome ${e.username}!`),
});

await appBus.emit('user:login', { username: 'john-doe' });
```

## Cross-Tab Messengers

### CrossTabMessenger Interface

```typescript
interface CrossTabMessenger {
  postMessage(message: any): void;
  set onmessage(handler: (message: any) => void);
  close(): void;
}
```

### BroadcastChannelMessenger

Uses the native `BroadcastChannel` API for efficient cross-tab messaging.

```typescript
import { BroadcastChannelMessenger } from '@ahoo-wang/fetcher-eventbus';

const messenger = new BroadcastChannelMessenger('my-channel');
messenger.onmessage = message => console.log('Received:', message);
messenger.postMessage('Hello from another tab!');
messenger.close();
```

### StorageMessenger

Uses `localStorage` events as fallback when `BroadcastChannel` is unavailable. Supports TTL and cleanup.

```typescript
import { StorageMessenger } from '@ahoo-wang/fetcher-eventbus';

const messenger = new StorageMessenger({
  channelName: 'my-channel',
  ttl: 5000,               // Messages expire after 5 seconds (default: 1000)
  cleanupInterval: 1000,   // Clean expired messages every 1 second (default: 60000)
});
messenger.onmessage = message => console.log('Received:', message);
messenger.postMessage('Hello from another tab!');
messenger.close();
```

### createCrossTabMessenger() Fallback Chain

Automatically selects the best available messenger: **BroadcastChannel -> StorageEvent -> undefined**.

```typescript
import { createCrossTabMessenger } from '@ahoo-wang/fetcher-eventbus';

const messenger = createCrossTabMessenger('my-channel');
if (messenger) {
  messenger.onmessage = msg => console.log(msg);
  messenger.postMessage('Hello!');
}
```

## API Reference

| Method                    | Returns           | Description                                              |
| ------------------------- | ----------------- | -------------------------------------------------------- |
| `on(handler)`             | `boolean`         | Register handler; returns `false` if duplicate name      |
| `off(name)`               | `boolean`         | Remove handler by name; returns `false` if not found     |
| `emit(event)`             | `Promise<void>`   | Trigger event to all handlers                            |
| `destroy()`               | `void`            | Clean up all handlers and resources                      |

## Ecosystem Usage

- **Storage** (`@ahoo-wang/fetcher-storage`): Uses EventBus for cross-tab cache synchronization
- **CoSec** (`@ahoo-wang/fetcher-cosec`): Uses EventBus for token change notifications

## Further Reading

- [Package Source](https://github.com/Ahoo-Wang/fetcher/tree/main/packages/eventbus/) - Source code
- [Package Tests](https://github.com/Ahoo-Wang/fetcher/tree/main/packages/eventbus/test/) - Test examples
