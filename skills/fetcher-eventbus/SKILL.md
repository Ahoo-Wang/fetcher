---
name: fetcher-eventbus
description: Work with typed event buses (Serial, Parallel, Broadcast) and cross-tab communication. Use when users mention event bus, events, broadcasting, cross-tab, serial/parallel execution, BroadcastChannel, or typed event handling.
---

# fetcher-eventbus Skill

## When to Use

Use this skill when working with the `@ahoo-wang/fetcher-eventbus` package. Trigger when:

- User mentions **event bus**, **events**, **broadcasting**, or **cross-tab communication**
- User wants **serial** or **parallel event execution**
- User asks about **BroadcastChannel** or **StorageMessenger**
- User needs **typed event handling** with TypeScript support

## Core Concepts

### Event Bus Implementations

The package provides three event bus implementations:

#### 1. SerialTypedEventBus

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

#### 2. ParallelTypedEventBus

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

#### 3. BroadcastTypedEventBus

Broadcasts events to **other browser tabs** using a delegate bus. Works locally and cross-tab.

```typescript
import { BroadcastTypedEventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const delegate = new SerialTypedEventBus<string>('shared-events');
const bus = new BroadcastTypedEventBus({ delegate });

bus.on({
  name: 'cross-tab-handler',
  order: 1,
  handle: event => console.log('Received from other tab:', event),
});

await bus.emit('broadcast-message'); // Local + cross-tab
```

### Cross-Tab Messengers

Two messenger implementations for direct cross-tab communication:

#### BroadcastChannelMessenger

Uses the native `BroadcastChannel` API for efficient cross-tab messaging.

```typescript
import { BroadcastChannelMessenger } from '@ahoo-wang/fetcher-eventbus';

const messenger = new BroadcastChannelMessenger('my-channel');

messenger.onmessage = message => {
  console.log('Received:', message);
};

messenger.postMessage('Hello from another tab!');
messenger.close();
```

#### StorageMessenger

Uses `localStorage` events as fallback when `BroadcastChannel` is unavailable. Supports TTL and cleanup.

```typescript
import { StorageMessenger } from '@ahoo-wang/fetcher-eventbus';

const messenger = new StorageMessenger({
  channelName: 'my-channel',
  ttl: 5000,              // Messages expire after 5 seconds
  cleanupInterval: 1000,  // Clean expired messages every 1 second
});

messenger.onmessage = message => {
  console.log('Received:', message);
};

messenger.postMessage('Hello from another tab!');
messenger.close();
```

#### createCrossTabMessenger

Automatically selects the best available messenger:

```typescript
import { createCrossTabMessenger } from '@ahoo-wang/fetcher-eventbus';

const messenger = createCrossTabMessenger('my-channel');
if (messenger) {
  messenger.onmessage = msg => console.log(msg);
  messenger.postMessage('Hello!');
}
```

### Event Handlers

#### Handler Interface

```typescript
interface EventHandler<EVENT> {
  name: string;           // Unique identifier
  order: number;          // Execution priority (lower = earlier)
  handle: (event: EVENT) => void | Promise<void>;
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

### Generic EventBus

Manages multiple event types with lazy-loaded buses:

```typescript
import { EventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const supplier = (type: string) => new SerialTypedEventBus(type);
const bus = new EventBus<{
  'user-login': string;
  'order-update': number;
}>(supplier);

bus.on('user-login', {
  name: 'welcome',
  order: 1,
  handle: username => console.log(`Welcome ${username}!`),
});

await bus.emit('user-login', 'john-doe');
```

### Error Handling Patterns

1. **Try-catch in handlers**: Wrap async operations in try-catch
2. **Error bus delegation**: Pass errors to a dedicated error handling bus
3. **Logging**: Use the built-in logger for error visibility

```typescript
bus.on({
  name: 'safe-handler',
  order: 1,
  handle: async event => {
    try {
      await riskyOperation(event);
    } catch (error) {
      console.error('Handler failed:', error);
    }
  },
});
```

### API Reference

| Method | Description |
|--------|-------------|
| `on(handler)` | Register an event handler |
| `off(name)` | Remove handler by name |
| `emit(event)` | Trigger event to all handlers |
| `destroy()` | Clean up all handlers and resources |

### Browser Support

- **BroadcastTypedEventBus**: Chrome 54+, Firefox 38+, Safari 15.4+
- **StorageMessenger**: All browsers with localStorage support
- **Other implementations**: ES2020+ environments (Node.js, browsers)

## File Locations

- Package: `/Users/ahoo/work/ahoo-git/agent-coder/fetcher/packages/eventbus/`
- Tests: `/Users/ahoo/work/ahoo-git/agent-coder/fetcher/packages/eventbus/test/`