# 🚀 Fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-Interactive%20Docs-FF4785)](https://fetcher.ahoo.me/)

**Ultra-lightweight • Modular • TypeScript-First • Interceptor-Powered • LLM Streaming API Support**

## 🌟 Why Fetcher?

Fetcher is not just another HTTP client—it's a complete ecosystem designed for modern web development with native LLM
streaming API support. Built on the native Fetch API, Fetcher provides an Axios-like experience with powerful features
while maintaining an incredibly small footprint.

## 🚀 Core Features

### 🎯 [`@ahoo-wang/fetcher`](./packages/fetcher) - The Foundation

The lightweight core that powers the entire ecosystem:

- **⚡ Ultra-Lightweight**: Only 3KiB min+gzip - smaller than most alternatives
- **🧭 Path & Query Parameters**: Built-in support for path (`{id}`/`:id`) and query parameters
- **🔗 Interceptor System**: Request, response, and error interceptors with ordered execution for flexible middleware
  patterns
- **⏱️ Timeout Control**: Configurable request timeouts with proper error handling
- **🔄 Fetch API Compatible**: Fully compatible with the native Fetch API
- **🛡️ TypeScript Support**: Complete TypeScript definitions for type-safe development
- **🧩 Modular Architecture**: Lightweight core with optional extension packages
- **📦 Named Fetcher Support**: Automatic registration and retrieval of fetcher instances
- **⚙️ Default Fetcher**: Pre-configured default fetcher instance for quick start

### 🎨 [`@ahoo-wang/fetcher-decorator`](./packages/decorator) - Declarative APIs

Transform your API interactions with clean, declarative service definitions:

- **🎨 Clean API Definitions**: Define HTTP services using intuitive decorators
- **🧭 Automatic Parameter Binding**: Path, query, header, and body parameters automatically bound
- **⏱️ Configurable Timeouts**: Per-method and per-class timeout settings
- **🔗 Fetcher Integration**: Seamless integration with Fetcher's named fetcher system
- **⚡ Automatic Implementation**: Methods automatically implemented with HTTP calls
- **📦 Metadata System**: Rich metadata support for advanced customization

### 🔧 [`@ahoo-wang/fetcher-generator`](./packages/generator) - OpenAPI Code Generator

A powerful TypeScript code generation tool that automatically generates type-safe API client code based on OpenAPI specifications. It is designed for general use cases and is also deeply optimized for the [Wow](https://github.com/Ahoo-Wang/Wow) Domain-Driven Design framework, providing native support for the CQRS architectural pattern.

- **🎯 OpenAPI 3.0+ Support**: Full support for OpenAPI 3.0+ specifications (JSON/YAML)
- **📦 TypeScript Code Generation**: Generates type-safe TypeScript interfaces, enums, and classes
- **🔧 CLI Tool**: Easy-to-use command-line interface for code generation
- **🎨 Decorator-Based APIs**: Generates decorator-based client classes for clean API interactions
- **📋 Comprehensive Models**: Handles complex schemas including unions, intersections, enums, and references
- **🚀 Fetcher Integration**: Seamlessly integrates with the Fetcher ecosystem packages
- **📊 Progress Logging**: Friendly logging with progress indicators during generation
- **📁 Auto Index Generation**: Automatically generates index.ts files for clean module organization
- **🌐 Remote Spec Support**: Load OpenAPI specs directly from HTTP/HTTPS URLs
- **🎭 Event Streaming**: Generates both regular and event-stream command clients
- **🏗️ Domain-Driven Design Support**: Specialized support for Wow framework with aggregates, commands, queries, and events (CQRS patterns)

### 🎯 [`@ahoo-wang/fetcher-eventbus`](./packages/eventbus) - Event Bus System

A TypeScript event bus library providing multiple implementations for handling events: serial execution, parallel
execution, and cross-tab broadcasting.

- **🔄 Serial Execution**: Execute event handlers in order of priority
- **⚡ Parallel Execution**: Run event handlers concurrently for better performance
- **🌐 Cross-Tab Broadcasting**: Broadcast events across browser tabs using BroadcastChannel API or localStorage fallback
- **💾 Storage Messenger**: Direct cross-tab messaging with TTL and cleanup
- **📦 Generic Event Bus**: Manage multiple event types with lazy loading
- **🔧 Type-Safe**: Full TypeScript support with strict typing
- **🧵 Async Support**: Handle both synchronous and asynchronous event handlers
- **🔄 Once Handlers**: Support for one-time event handlers
- **🛡️ Error Handling**: Robust error handling with logging
- **🔌 Auto Fallback**: Automatically selects best available cross-tab communication method

### 📡 [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) - Real-Time Streaming & LLM Support

Power your real-time applications with Server-Sent Events support, specially designed for Large Language Model streaming
APIs:

- **📡 Event Stream Conversion**: Converts `text/event-stream` responses to async generators of `ServerSentEvent` objects
- **🔌 Interceptor Integration**: Automatically adds `eventStream()` and `jsonEventStream()` methods to responses with
  `text/event-stream` content
  type
- **📋 SSE Parsing**: Parses Server-Sent Events according to the specification, including data, event, id, and retry
  fields
- **🔄 Streaming Support**: Handles chunked data and multi-line events correctly
- **💬 Comment Handling**: Properly ignores comment lines (lines starting with `:`) as per SSE specification
- **🛡️ TypeScript Support**: Complete TypeScript type definitions
- **⚡ Performance Optimized**: Efficient parsing and streaming for high-performance applications
- **🤖 LLM Streaming Ready**: Native support for streaming responses from popular LLM APIs like OpenAI GPT, Claude, etc.

### 🤖 [`@ahoo-wang/fetcher-openai`](./packages/openai) - OpenAI API Client

Type-safe OpenAI API client with native streaming support for chat completions:

- **🎯 Type-Safe OpenAI Integration**: Complete TypeScript support for OpenAI Chat Completions API
- **📡 Native Streaming Support**: Built-in support for streaming chat completions with Server-Sent Events
- **🔧 Declarative API**: Clean, decorator-based API for OpenAI interactions
- **⚡ Fetcher Integration**: Seamlessly integrates with the Fetcher ecosystem

### 💾 [`@ahoo-wang/fetcher-storage`](./packages/storage) - Cross-Environment Storage

A lightweight, cross-environment storage library with key-based storage and automatic environment detection:

- **🌐 Cross-Environment Support**: Consistent API for browser localStorage/sessionStorage and in-memory storage
- **📦 Ultra-Lightweight**: Only ~1KB gzip - minimal footprint
- **🔔 Storage Change Events**: Listen for storage changes with event-driven architecture
- **🔄 Automatic Environment Detection**: Automatically selects appropriate storage with fallback
- **🛠️ Key-Based Storage**: Efficient key-based storage with built-in caching and serialization
- **🔧 Custom Serialization**: Support for custom serialization strategies (JSON, Identity)
- **📝 TypeScript Support**: Full TypeScript definitions for type-safe storage operations

### 🧩 [`@ahoo-wang/fetcher-wow`](./packages/wow) - CQRS/DDD Framework Support

First-class integration with the [Wow](https://github.com/Ahoo-Wang/Wow) CQRS/DDD framework:

- **🔄 CQRS Pattern Implementation**: First-class support for Command Query Responsibility Segregation architectural
  pattern
- **🧱 DDD Primitives**: Essential Domain-Driven Design building blocks including aggregates, events, and value objects
- **📦 Complete TypeScript Support**: Full type definitions for all Wow framework entities including commands, events,
  and queries
- **📡 Real-time Event Streaming**: Built-in support for Server-Sent Events to receive real-time command results and data
  updates
- **🚀 Command Client**: High-level client for sending commands to Wow services with both synchronous and streaming
  responses
- **🔍 Powerful Query DSL**: Rich query condition builder with comprehensive operator support for complex querying
- **🔍 Query Clients**: Specialized clients for querying snapshot and event stream data with comprehensive query
  operations:
  - Counting resources
  - Listing resources
  - Streaming resources as Server-Sent Events
  - Paging resources
  - Retrieving single resources

### 🔐 [`@ahoo-wang/fetcher-cosec`](./packages/cosec) - Enterprise Security

Secure your applications with integrated authentication:

- **🔐 Automatic Authentication**: Automatic CoSec authentication headers
- **📱 Device Management**: Device ID management with localStorage persistence
- **🔄 Token Refresh**: Automatic token refresh based on response codes (401)
- **🌈 Request Tracking**: Unique request ID generation for tracking
- **💾 Token Storage**: Secure token storage management

## 📦 Package Ecosystem

| Package                                                    | Description                                                                                                                                                                                                   | Version                                                                                                                                 | Size                                                                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@ahoo-wang/fetcher`](./packages/fetcher)                 | **Core HTTP Client**<br/>Ultra-lightweight foundation with Axios-like API                                                                                                                                     | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)                         |
| [`@ahoo-wang/fetcher-decorator`](./packages/decorator)     | **Decorator Support**<br/>Declarative API service definitions                                                                                                                                                 | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-decorator)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)     |
| [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream) | **Real-Time Streaming & LLM Support**<br/>Server-Sent Events (SSE) support with native LLM streaming API integration                                                                                          | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-eventstream.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-eventstream)](https://www.npmjs.com/package/@ahoo-wang/fetcher-eventstream) |
| [`@ahoo-wang/fetcher-openai`](./packages/openai)           | **OpenAI Client**<br/>Type-safe OpenAI API client with streaming support for chat completions                                                                                                                 | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openai.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)           | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-openai)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)           |
| [`@ahoo-wang/fetcher-generator`](./packages/generator)     | **OpenAPI Code Generator**<br/>Powerful TypeScript code generator from OpenAPI specifications, designed to be general-purpose with specialized support for Wow domain-driven design framework's CQRS patterns | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-generator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-generator)     |                                                                                                                                                        |
| [`@ahoo-wang/fetcher-openapi`](./packages/openapi)         | **OpenAPI TypeScript Types**<br/>Complete TypeScript type definitions for OpenAPI 3.0+ specifications                                                                                                         | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)         | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)         |
| [`@ahoo-wang/fetcher-storage`](./packages/storage)         | **Cross-Environment Storage**<br/>Lightweight storage library with key-based storage and automatic environment detection                                                                                      | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)         | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-storage)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)         |
| [`@ahoo-wang/fetcher-react`](./packages/react)             | **React Integration**<br/>React hooks and components for seamless data fetching with automatic re-rendering                                                                                                   | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)             | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-react)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)             |
| [`@ahoo-wang/fetcher-wow`](./packages/wow)                 | **CQRS/DDD Framework Support**<br/>First-class integration with the Wow CQRS/DDD framework                                                                                                                    | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-wow.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-wow)                 | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-wow)](https://www.npmjs.com/package/@ahoo-wang/fetcher-wow)                 |
| [`@ahoo-wang/fetcher-cosec`](./packages/cosec)             | **Enterprise Security**<br/>CoSec authentication integration                                                                                                                                                  | [![npm](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             | [![size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)             |

## 🚀 Getting Started

### 📦 Installation

```shell
# Install the core package
npm install @ahoo-wang/fetcher

# Or install with all extensions including LLM streaming support
npm install @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-cosec

# Using pnpm (recommended)
pnpm add @ahoo-wang/fetcher

# Using yarn
yarn add @ahoo-wang/fetcher
```

### ⚡ Quick Examples

#### Basic HTTP Client

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

// Create a fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// GET request with path and query parameters
const response = await fetcher.get('/users/{id}', {
  urlParams: {
    path: { id: 123 },
    query: { include: 'profile' },
  },
});
const userData = await response.json<User>();

// POST request with automatic JSON conversion
const createUserResponse = await fetcher.post('/users', {
  body: { name: 'John Doe', email: 'john@example.com' },
});
```

#### Declarative API Services

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';
import {
  api,
  get,
  post,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';

// Register a named fetcher
const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
});

// Define service with decorators
@api('/users', { fetcher: 'api' })
class UserService {
  @get('/')
  getUsers(@query('limit') limit?: number): Promise<User[]> {
    throw autoGeneratedError(limit);
  }

  @post('/')
  createUser(@body() user: User): Promise<User> {
    throw autoGeneratedError(user);
  }

  @get('/{id}')
  getUser(@path('id') id: number): Promise<User> {
    throw autoGeneratedError(id);
  }
}

// Use the service
const userService = new UserService();
const users = await userService.getUsers(10);
```

#### OpenAPI Code Generator

```shell
# Global Installation Generator CLI
npm install -g @ahoo-wang/fetcher-generator

# Generate TypeScript code from OpenAPI specifications
fetcher-generator generate -i ./openapi-spec.json -o ./src/generated

# or generated from a remote URL
fetcher-generator generate -i https://api.example.com/openapi.json -o ./src/generated
```

#### Powerful Interceptors

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Add request interceptor with ordering
fetcher.interceptors.request.use({
  name: 'auth-interceptor',
  order: 100,
  intercept(exchange) {
    exchange.request.headers.Authorization = 'Bearer ' + getAuthToken();
  },
});

// Add response interceptor for logging
fetcher.interceptors.response.use({
  name: 'logging-interceptor',
  order: 10,
  intercept(exchange) {
    console.log('Response:', exchange.response.status);
  },
});
```

#### Real-Time Streaming & LLM Support

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
fetcher.interceptors.response.use(new EventStreamInterceptor());

// Stream real-time events (generic SSE)
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('Real-time event:', event);
  }
}

// Stream LLM responses token by token
const llmResponse = await fetcher.post('/chat/completions', {
  body: {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  },
});

if (llmResponse.jsonEventStream) {
  // Specialized for JSON SSE events from LLM APIs
  for await (const event of llmResponse.jsonEventStream<ChatCompletionChunk>()) {
    const content = event.data.choices[0]?.delta?.content || '';
    process.stdout.write(content); // Real-time token output
  }
}
```

#### OpenAI Chat Completions

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Non-streaming chat completion
const response = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello, how are you?' }],
  stream: false,
});

console.log(response.choices[0].message.content);

// Streaming chat completion
const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.data.choices[0]?.delta?.content || '';
  process.stdout.write(content); // Real-time output
}
```

#### Event Bus for Cross-Tab Communication

```typescript
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

// Create a delegate for local event handling
const delegate = new SerialTypedEventBus<string>('shared-events');

// Create broadcast event bus for cross-tab communication
const eventBus = new BroadcastTypedEventBus(delegate);

// Add event handler
eventBus.on({
  name: 'user-action',
  order: 1,
  handle: action => console.log('User action:', action),
});

// Emit event locally and broadcast to other tabs
await eventBus.emit('button-clicked');
```

## 🎯 Integration Test Examples

Explore comprehensive, production-ready implementations in our [integration-test](./integration-test) directory:

### 🌐 HTTP Operations

- **Typicode API Integration** - Complete integration with JSONPlaceholder API demonstrating real-world usage
- **Parameter Handling** - Advanced path, query, and body parameter management
- **Error Handling** - Comprehensive error handling patterns

### 🔧 Advanced Patterns

- **COSEC Authentication** - Enterprise-grade security integration with token management
- **Interceptor Chains** - Complex middleware patterns with ordered execution
- **Timeout Strategies** - Adaptive timeout configurations

### 📡 Real-Time Features

- **LLM Streaming API** - Native support for streaming responses from Large Language Models
- **Server-Sent Events** - Real-time notifications and updates
- **Streaming Data** - Continuous data streams with automatic reconnection

### 🎨 Decorator Patterns

- **Declarative Services** - Clean, maintainable API service layers using TypeScript decorators
- **Metadata Extensions** - Custom metadata for advanced use cases
- **Type-Safe APIs** - Full TypeScript integration with automatic type inference

### 🎯 Event Bus Patterns

- **Cross-Tab Communication** - Seamless event broadcasting between browser tabs
- **Typed Event Handling** - Type-safe event management with priority ordering
- **Async Event Processing** - Support for both synchronous and asynchronous event handlers

## 🏗️ Development & Contributing

### 🛠️ Prerequisites

- Node.js >= 16
- pnpm >= 8

### 🚀 Development Commands

```shell
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run unit tests with coverage
pnpm test:unit

# Format code
pnpm format

# Clean build artifacts
pnpm clean

# Run integration tests
#pnpm test:it
```

### 📦 Version Management

Update all packages simultaneously:

```shell
pnpm update-version <new-version>
```

This updates the version field in all `package.json` files across the monorepo.

### 🤝 Contributing

We welcome contributions! Please see our [contributing guide](./CONTRIBUTING.md) for details:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

### 🧪 Quality Assurance

- **Code Coverage**: Maintained above 95% across all packages
- **TypeScript**: Strict type checking enabled
- **Linting**: ESLint with Prettier for consistent code style
- **Testing**: Comprehensive unit and integration tests

## 📄 License

This project is licensed under the [Apache-2.0 License](./LICENSE).
