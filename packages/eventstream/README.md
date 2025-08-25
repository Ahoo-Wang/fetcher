# @ahoo-wang/fetcher-eventstream

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-eventstream.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventstream)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

Support for text/event-stream in Fetcher, enabling Server-Sent Events (SSE) functionality for real-time data streaming.

## 🌟 Features

- **📡 Event Stream Conversion**: Converts `text/event-stream` responses to async generators of `ServerSentEvent` objects
- **🔌 Interceptor Integration**: Automatically adds `eventStream()` method to responses with `text/event-stream` content
  type
- **📋 SSE Parsing**: Parses Server-Sent Events according to the specification, including data, event, id, and retry
  fields
- **🔄 Streaming Support**: Handles chunked data and multi-line events correctly
- **💬 Comment Handling**: Properly ignores comment lines (lines starting with `:`) as per SSE specification
- **🛡️ TypeScript Support**: Complete TypeScript type definitions
- **⚡ Performance Optimized**: Efficient parsing and streaming for high-performance applications

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @ahoo-wang/fetcher-eventstream

# Using pnpm
pnpm add @ahoo-wang/fetcher-eventstream

# Using yarn
yarn add @ahoo-wang/fetcher-eventstream
```

### Basic Usage with Interceptor

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// Add the event stream interceptor
fetcher.interceptors.response.use(new EventStreamInterceptor());

// Using the eventStream method on responses with text/event-stream content type
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('Received event:', event);
  }
}
```

### Manual Conversion

```typescript
import { toServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

// Convert a Response object manually
const response = await fetch('/events');
const eventStream = toServerSentEventStream(response);

// Read events from the stream
const reader = eventStream.getReader();
try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log('Received event:', value);
  }
} finally {
  reader.releaseLock();
}
```

## 📚 API Reference

### EventStreamInterceptor

A response interceptor that automatically adds an `eventStream()` method to responses with `text/event-stream` content
type.

#### Usage

```typescript
fetcher.interceptors.response.use(new EventStreamInterceptor());
```

### toServerSentEventStream

Converts a Response object with a `text/event-stream` body to a readable stream of ServerSentEvent objects.

#### Signature

```typescript
function toServerSentEventStream(response: Response): ServerSentEventStream;
```

#### Parameters

- `response`: The HTTP response with `text/event-stream` content type

#### Returns

- `ServerSentEventStream`: A readable stream of ServerSentEvent objects

### ServerSentEvent

Interface defining the structure of a Server-Sent Event.

```typescript
interface ServerSentEvent {
  data: string; // Event data (required)
  event?: string; // Event type (optional, defaults to 'message')
  id?: string; // Event ID (optional)
  retry?: number; // Retry timeout in milliseconds (optional)
}
```

### ServerSentEventStream

Type alias for a readable stream of ServerSentEvent objects.

```typescript
type ServerSentEventStream = ReadableStream<ServerSentEvent>;
```

## 🛠️ Examples

### Real-time Notifications

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});
fetcher.interceptors.response.use(new EventStreamInterceptor());

// Listen for real-time notifications
const response = await fetcher.get('/notifications');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    switch (event.event) {
      case 'message':
        showNotification('Message', event.data);
        break;
      case 'alert':
        showAlert('Alert', event.data);
        break;
      case 'update':
        handleUpdate(JSON.parse(event.data));
        break;
      default:
        console.log('Unknown event:', event);
    }
  }
}
```

### Progress Updates

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});
fetcher.interceptors.response.use(new EventStreamInterceptor());

// Track long-running task progress
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

### Chat Application

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://chat-api.example.com',
});
fetcher.interceptors.response.use(new EventStreamInterceptor());

// Real-time chat messages
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

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage
```

The test suite includes:

- Event stream conversion tests
- Interceptor functionality tests
- Edge case handling (malformed events, chunked data, etc.)
- Performance tests for large event streams

## 📋 Server-Sent Events Specification Compliance

This package fully implements
the [Server-Sent Events specification](https://html.spec.whatwg.org/multipage/server-sent-events.html):

- **Data field**: Supports multi-line data fields
- **Event field**: Custom event types
- **ID field**: Last event ID tracking
- **Retry field**: Automatic reconnection timeout
- **Comment lines**: Lines starting with `:` are ignored
- **Event dispatching**: Proper event dispatching with default event type 'message'

## 🤝 Contributing

Contributions are welcome! Please see
the [contributing guide](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the [Apache-2.0 License](../../LICENSE).

---

<p align="center">
  Part of the <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> ecosystem
</p>
