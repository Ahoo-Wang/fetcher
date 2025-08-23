# @ahoo-wang/fetcher-eventstream

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-eventstream.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream)

Support for text/event-stream in Fetcher, enabling Server-Sent Events (SSE) functionality.

## Features

- **Event Stream Conversion**: Converts `text/event-stream` responses to async generators of `ServerSentEvent` objects
- **Interceptor Integration**: Automatically adds `eventStream()` method to responses with `text/event-stream` content type
- **SSE Parsing**: Parses Server-Sent Events according to the specification, including data, event, id, and retry fields
- **Streaming Support**: Handles chunked data and multi-line events correctly
- **Comment Handling**: Properly ignores comment lines (lines starting with `:`) as per SSE specification
- **TypeScript Support**: Complete TypeScript type definitions

## Installation

Using pnpm:

```bash
pnpm add @ahoo-wang/fetcher-eventstream
```

Using npm:

```bash
npm install @ahoo-wang/fetcher-eventstream
```

Using yarn:

```bash
yarn add @ahoo-wang/fetcher-eventstream
```

## Usage

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

### Async Iterator Usage

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  interceptors: {
    response: [new EventStreamInterceptor()],
  },
});

// Using async iteration
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    switch (event.event) {
      case 'message':
        console.log('Message:', event.data);
        break;
      case 'notification':
        console.log('Notification:', event.data);
        break;
      default:
        console.log('Unknown event:', event);
    }
  }
}
```

## API Reference

### EventStreamConverter

A utility class for converting `text/event-stream` responses to readable streams.

#### `toServerSentEventStream(response: Response): ServerEventStream`

Converts a Response object with a `text/event-stream` body to a readable stream of ServerSentEvent objects.

**Parameters:**

- `response`: The HTTP response with `text/event-stream` content type

**Returns:**

- `ServerEventStream`: A readable stream of ServerSentEvent objects

### EventStreamInterceptor

A response interceptor that automatically adds an `eventStream()` method to responses with `text/event-stream` content type.

#### `intercept(exchange: FetchExchange): FetchExchange`

Intercepts a response and adds the `eventStream()` method if the content type is `text/event-stream`.

**Parameters:**

- `exchange`: The fetch exchange containing the response to intercept

**Returns:**

- `FetchExchange`: The intercepted exchange with response potentially modified to include `eventStream()` method

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

## Server-Sent Events Specification Compliance

This package fully implements the [Server-Sent Events specification](https://html.spec.whatwg.org/multipage/server-sent-events.html):

- **Data field**: Supports multi-line data fields
- **Event field**: Custom event types
- **ID field**: Last event ID tracking
- **Retry field**: Automatic reconnection timeout
- **Comment lines**: Lines starting with `:` are ignored
- **Event dispatching**: Proper event dispatching with default event type 'message'

## Examples

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

## Testing

To run tests for this package:

```bash
pnpm test
```

The test suite includes:

- Event stream conversion tests
- Interceptor functionality tests
- Edge case handling (malformed events, chunked data, etc.)
- Performance tests for large event streams

## License

This project is licensed under the [Apache-2.0 License](../../LICENSE).
