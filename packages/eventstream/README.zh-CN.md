# @ahoo-wang/fetcher-eventstream

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-eventstream.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventstream)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

为 Fetcher 提供 text/event-stream 支持，实现服务器发送事件（SSE）功能，用于实时数据流。

## 🌟 特性

- **📡 事件流转换**：将 `text/event-stream` 响应转换为 `ServerSentEvent` 对象的异步生成器
- **🔌 拦截器集成**：自动为 `text/event-stream` 内容类型的响应添加 `eventStream()` 和 `jsonEventStream()` 方法
- **📋 SSE 解析**：根据规范解析服务器发送事件，包括数据、事件、ID 和重试字段
- **🔄 流支持**：正确处理分块数据和多行事件
- **💬 注释处理**：正确忽略注释行（以 `:` 开头的行）
- **🛡️ TypeScript 支持**：完整的 TypeScript 类型定义
- **⚡ 性能优化**：高效的解析和流处理，适用于高性能应用

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @ahoo-wang/fetcher-eventstream

# 使用 pnpm
pnpm add @ahoo-wang/fetcher-eventstream

# 使用 yarn
yarn add @ahoo-wang/fetcher-eventstream
```

### 带拦截器的基本用法

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// 添加事件流拦截器
fetcher.interceptors.response.use(new EventStreamInterceptor());

// 在响应中使用 eventStream 方法处理 text/event-stream 内容类型
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('收到事件:', event);
  }
}

// 使用 jsonEventStream 方法处理 JSON 数据
const jsonResponse = await fetcher.get('/json-events');
if (response.jsonEventStream) {
  for await (const event of response.jsonEventStream<MyDataType>()) {
    console.log('收到 JSON 事件:', event.data);
  }
}
```

### 手动转换

```typescript
import { toServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

// 手动转换 Response 对象
const response = await fetch('/events');
const eventStream = toServerSentEventStream(response);

// 从流中读取事件
const reader = eventStream.getReader();
try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log('收到事件:', value);
  }
} finally {
  reader.releaseLock();
}
```

## 📚 API 参考

### EventStreamInterceptor

响应拦截器，自动为 `text/event-stream` 内容类型的响应添加 `eventStream()` 方法。

#### 用法

```typescript
fetcher.interceptors.response.use(new EventStreamInterceptor());
```

### toJsonServerSentEventStream

将 ServerSentEventStream 转换为 JsonServerSentEventStream，用于处理带有 JSON 数据的服务器发送事件。

#### 签名

```typescript
function toJsonServerSentEventStream<DATA>(
  serverSentEventStream: ServerSentEventStream,
): JsonServerSentEventStream<DATA>;
```

#### 参数

- `serverSentEventStream`：要转换的 ServerSentEventStream

#### 返回

- `JsonServerSentEventStream<DATA>`：带有 JSON 数据的 ServerSentEvent 对象的可读流

### JsonServerSentEvent

定义带有 JSON 数据的服务器发送事件结构的接口。

```typescript
interface JsonServerSentEvent<DATA> extends Omit<ServerSentEvent, 'data'> {
  data: DATA; // 作为解析 JSON 的事件数据
}
```

### JsonServerSentEventStream

带有 JSON 数据的 ServerSentEvent 对象的可读流的类型别名。

```typescript
type JsonServerSentEventStream<DATA> = ReadableStream<
  JsonServerSentEvent<DATA>
>;
```

### toServerSentEventStream

将带有 `text/event-stream` 主体的 Response 对象转换为 ServerSentEvent 对象的可读流。

#### 签名

```typescript
function toServerSentEventStream(response: Response): ServerSentEventStream;
```

#### 参数

- `response`：带有 `text/event-stream` 内容类型的 HTTP 响应

#### 返回

- `ServerSentEventStream`：ServerSentEvent 对象的可读流

### ServerSentEvent

定义服务器发送事件结构的接口。

```typescript
interface ServerSentEvent {
  data: string; // 事件数据（必需）
  event?: string; // 事件类型（可选，默认为 'message'）
  id?: string; // 事件 ID（可选）
  retry?: number; // 以毫秒为单位的重试超时（可选）
}
```

### ServerSentEventStream

ServerSentEvent 对象的可读流的类型别名。

```typescript
type ServerSentEventStream = ReadableStream<ServerSentEvent>;
```

## 🛠️ 示例

### 实时通知

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});
fetcher.interceptors.response.use(new EventStreamInterceptor());

// 监听实时通知
const response = await fetcher.get('/notifications');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    switch (event.event) {
      case 'message':
        showNotification('消息', event.data);
        break;
      case 'alert':
        showAlert('警报', event.data);
        break;
      case 'update':
        handleUpdate(JSON.parse(event.data));
        break;
      default:
        console.log('未知事件:', event);
    }
  }
}
```

### 进度更新

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});
fetcher.interceptors.response.use(new EventStreamInterceptor());

// 跟踪长时间运行的任务进度
const response = await fetcher.get('/tasks/123/progress');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    if (event.event === 'progress') {
      const progress = JSON.parse(event.data);
      updateProgressBar(progress.percentage);
    } else if (event.event === 'complete') {
      showCompletionMessage(event.data);
      break;
    }
  }
}
```

### 聊天应用

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://chat-api.example.com',
});
fetcher.interceptors.response.use(new EventStreamInterceptor());

// 实时聊天消息
const response = await fetcher.get('/rooms/123/messages');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    if (event.event === 'message') {
      const message = JSON.parse(event.data);
      displayMessage(message);
    } else if (event.event === 'user-joined') {
      showUserJoined(event.data);
    } else if (event.event === 'user-left') {
      showUserLeft(event.data);
    }
  }
}
```

## 🧪 测试

```bash
# 运行测试
pnpm test

# 运行带覆盖率的测试
pnpm test --coverage
```

测试套件包括：

- 事件流转换测试
- 拦截器功能测试
- 边界情况处理（畸形事件、分块数据等）
- 大事件流的性能测试

## 📋 服务器发送事件规范合规性

此包完全实现了 [服务器发送事件规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)：

- **数据字段**：支持多行数据字段
- **事件字段**：自定义事件类型
- **ID 字段**：最后事件 ID 跟踪
- **重试字段**：自动重连超时
- **注释行**：忽略以 `:` 开头的行
- **事件分发**：正确的事件分发，默认事件类型为 'message'

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 了解更多详情。

## 📄 许可证

本项目采用 [Apache-2.0 许可证](../../LICENSE)。

---

<p align="center">
  Fetcher 生态系统的一部分
</p>
