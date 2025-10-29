# @ahoo-wang/fetcher-eventbus

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventbus.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-eventbus.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventbus)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-Interactive%20Docs-FF4785)](https://fetcher.ahoo.me/?path=/docs/eventbus-introduction--docs)

一个 TypeScript 事件总线库，提供多种实现来处理事件：串行执行、并行执行和跨标签页广播。

## 🌟 功能特性

- **🔄 串行执行**：按优先级顺序执行事件处理器
- **⚡ 并行执行**：并发运行事件处理器以提升性能
- **🌐 跨标签页广播**：使用 BroadcastChannel API 或 localStorage 回退在浏览器标签页间广播事件
- **💾 存储消息器**：直接跨标签页消息传递，支持 TTL 和清理
- **📦 通用事件总线**：使用懒加载管理多种事件类型
- **🔧 类型安全**：完整的 TypeScript 支持和严格类型检查
- **🧵 异步支持**：处理同步和异步事件处理器
- **🔄 一次性处理器**：支持一次性事件处理器
- **🛡️ 错误处理**：强大的错误处理和日志记录
- **🔌 自动回退**：自动选择最佳可用的跨标签页通信方式

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @ahoo-wang/fetcher-eventbus

# 使用 pnpm
pnpm add @ahoo-wang/fetcher-eventbus

# 使用 yarn
yarn add @ahoo-wang/fetcher-eventbus
```

### 基本用法

## 串行事件总线

```typescript
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const bus = new SerialTypedEventBus<string>('my-events');

bus.on({
  name: 'logger',
  order: 1,
  handle: event => console.log('事件:', event),
});

bus.on({
  name: 'processor',
  order: 2,
  handle: event => console.log('处理:', event),
});

await bus.emit('hello'); // 处理器按顺序串行执行
```

### 并行事件总线

```typescript
import { ParallelTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const bus = new ParallelTypedEventBus<string>('my-events');

bus.on({
  name: 'handler1',
  order: 1,
  handle: async event => console.log('处理器 1:', event),
});

bus.on({
  name: 'handler2',
  order: 2,
  handle: async event => console.log('处理器 2:', event),
});

await bus.emit('hello'); // 两个处理器并行执行
```

### 广播事件总线

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
  handle: event => console.log('来自其他标签页:', event),
});

await bus.emit('broadcast-message'); // 本地执行并广播到其他标签页
```

**注意**：如果不支持 BroadcastChannel API，库会自动回退到使用 localStorage 进行跨标签页通信。

### 存储消息器（直接 API）

```typescript
import { StorageMessenger } from '@ahoo-wang/fetcher-eventbus';

const messenger = new StorageMessenger({
  channelName: 'my-channel',
  ttl: 5000, // 消息 TTL 5 秒
  cleanupInterval: 1000, // 每 1 秒清理过期消息
});

messenger.onmessage = message => {
  console.log('收到:', message);
};

messenger.postMessage('来自其他标签页的问候!');

// 完成后清理
messenger.close();
```

### 通用事件总线

```typescript
import { EventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const supplier = (type: string) => new SerialTypedEventBus(type);
const bus = new EventBus<{ 'user-login': string; 'order-update': number }>(
  supplier,
);

bus.on('user-login', {
  name: 'welcome',
  order: 1,
  handle: username => console.log(`欢迎 ${username}!`),
});

await bus.emit('user-login', 'john-doe');
```

## 🔧 配置

### EventHandler<EVENT> 接口

```typescript
interface EventHandler<EVENT> {
  name: string;
  order: number;
  handle: (event: EVENT) => void | Promise<void>;
  once?: boolean; // 可选：在首次执行后移除
}
```

## 📚 API 参考

### TypedEventBus<EVENT>

- `type: EventType` - 事件类型标识符
- `handlers: EventHandler<EVENT>[]` - 已注册处理器数组
- `on(handler: EventHandler<EVENT>): boolean` - 添加事件处理器
- `off(name: string): boolean` - 按名称移除事件处理器
- `emit(event: EVENT): Promise<void>` - 发射事件
- `destroy(): void` - 清理资源

### EventHandler<EVENT>

```typescript
interface EventHandler<EVENT> {
  name: string;
  order: number;
  handle: (event: EVENT) => void | Promise<void>;
  once?: boolean; // 可选：首次执行后移除
}
```

### 跨标签页消息器

- **BroadcastChannelMessenger**：使用 BroadcastChannel API 进行高效跨标签页通信
- **StorageMessenger**：当 BroadcastChannel 不可用时，使用 localStorage 事件作为回退
- **createCrossTabMessenger**：自动选择最佳可用的消息器

```typescript
import { createCrossTabMessenger } from '@ahoo-wang/fetcher-eventbus';

const messenger = createCrossTabMessenger('my-channel');
if (messenger) {
  messenger.onmessage = msg => console.log(msg);
  messenger.postMessage('你好!');
}
```

### EventBus<Events>

- `on<Key>(type: Key, handler: EventHandler<Events[Key]>): boolean`
- `off<Key>(type: Key, handler: EventHandler<Events[Key]>): boolean`
- `emit<Key>(type: Key, event: Events[Key]): void | Promise<void>`
- `destroy(): void`

## 🧪 测试

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test --coverage
```

## 🤝 贡献

欢迎贡献！请查看
[贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 获取更多详情。

## 🌐 浏览器支持

- **BroadcastTypedEventBus**：需要 BroadcastChannel API 支持（Chrome 54+、Firefox 38+、Safari 15.4+）
- **StorageMessenger**：适用于支持 localStorage 和 StorageEvent 的所有浏览器
- **其他实现**：兼容 ES2020+ 环境（Node.js、浏览器）

## 性能

- **串行事件总线**：最小开销，可预测执行顺序
- **并行事件总线**：优化并发处理器执行
- **广播事件总线**：高效跨标签页通信，自动回退
- **内存管理**：自动清理过期消息和事件处理器

## 📄 许可证

Apache-2.0

---

<p align="center">
  <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> 生态系统的一部分
</p>
