# @ahoo-wang/fetcher-eventbus

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventbus.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-eventbus.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-eventbus.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventbus)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

A TypeScript event bus library providing multiple implementations for handling events: serial execution, parallel
execution, and cross-tab broadcasting.

## 🌟 Features

- **🔄 Serial Execution**: Execute event handlers in order with priority support
- **⚡ Parallel Execution**: Run event handlers concurrently for better performance
- **🌐 Cross-Tab Broadcasting**: Broadcast events across browser tabs using BroadcastChannel API
- **📦 Generic Event Bus**: Manage multiple event types with lazy loading
- **🔧 Type-Safe**: Full TypeScript support with strict typing
- **🧵 Async Support**: Handle both synchronous and asynchronous event handlers
- **🔄 Once Handlers**: Support for one-time event handlers
- **🛡️ Error Handling**: Robust error handling with logging

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @ahoo-wang/fetcher-eventbus

# Using pnpm
pnpm add @ahoo-wang/fetcher-eventbus

# Using yarn
yarn add @ahoo-wang/fetcher-eventbus
```

### Basic Usage

### Serial Event Bus

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

await bus.emit('hello'); // Handlers execute serially in order
```

### Parallel Event Bus

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

await bus.emit('hello'); // Both handlers execute in parallel
```

### Broadcast Event Bus

```typescript
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const delegate = new SerialTypedEventBus<string>('shared-events');
const bus = new BroadcastTypedEventBus(delegate);

bus.on({
  name: 'cross-tab-handler',
  order: 1,
  handle: event => console.log('Received from other tab:', event),
});

await bus.emit('broadcast-message'); // Emits locally and broadcasts to other tabs
```

### Generic Event Bus

```typescript
import { EventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const supplier = (type: string) => new SerialTypedEventBus(type);
const bus = new EventBus<{ 'user-login': string; 'order-update': number }>(
  supplier,
);

bus.on('user-login', {
  name: 'welcome',
  order: 1,
  handle: username => console.log(`Welcome ${username}!`),
});

await bus.emit('user-login', 'john-doe');
```

## API

### TypedEventBus<EVENT>

- `type: EventType` - The event type identifier
- `handlers: EventHandler<EVENT>[]` - Array of registered handlers
- `on(handler: EventHandler<EVENT>): boolean` - Add an event handler
- `off(name: string): boolean` - Remove an event handler by name
- `emit(event: EVENT): Promise<void>` - Emit an event
- `destroy(): void` - Clean up resources

### EventHandler<EVENT>

```typescript
interface EventHandler<EVENT> {
  name: string;
  order: number;
  handle: (event: EVENT) => void | Promise<void>;
  once?: boolean; // Optional: remove after first execution
}
```

### EventBus<Events>

- `on<Key>(type: Key, handler: EventHandler<Events[Key]>): boolean`
- `off<Key>(type: Key, handler: EventHandler<Events[Key]>): boolean`
- `emit<Key>(type: Key, event: Events[Key]): void | Promise<void>`
- `destroy(): void`

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage
```

## 🤝 Contributing

Contributions are welcome! Please see
the [contributing guide](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) for more details.

## Browser Support

- **BroadcastTypedEventBus** requires BroadcastChannel API support (modern browsers)
- Other implementations work in all environments supporting ES2020+

## 📄 License

Apache-2.0

---

<p align="center">
  Part of the <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> ecosystem
</p>
