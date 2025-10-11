# @ahoo-wang/fetcher-eventbus

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventbus.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-eventbus.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventbus)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventbus)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

一个 TypeScript 事件总线库，提供多种实现来处理事件：串行执行、并行执行和跨标签页广播。

## 🌟 功能特性

- **🔄 串行执行**：按优先级顺序执行事件处理器
- **⚡ 并行执行**：并发运行事件处理器以提升性能
- **🌐 跨标签页广播**：使用 BroadcastChannel API 在浏览器标签页间广播事件
- **📦 通用事件总线**：使用懒加载管理多种事件类型
- **🔧 类型安全**：完整的 TypeScript 支持和严格类型检查
- **🧵 异步支持**：处理同步和异步事件处理器
- **🔄 一次性处理器**：支持一次性事件处理器
- **🛡️ 错误处理**：强大的错误处理和日志记录

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
const bus = new BroadcastTypedEventBus(delegate);

bus.on({
  name: 'cross-tab-handler',
  order: 1,
  handle: event => console.log('来自其他标签页:', event),
});

await bus.emit('broadcast-message'); // 本地执行并广播到其他标签页
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

- **BroadcastTypedEventBus** 需要 BroadcastChannel API 支持（现代浏览器）
- 其他实现适用于支持 ES2020+ 的所有环境

## 📄 许可证

Apache-2.0

---

<p align="center">
  <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> 生态系统的一部分
</p>
