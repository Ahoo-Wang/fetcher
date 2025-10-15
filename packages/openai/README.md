# @ahoo-wang/fetcher-openai

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openai.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A modern, type-safe OpenAI client library built on the Fetcher ecosystem. Provides declarative API integration with OpenAI's Chat Completions API, supporting both streaming and non-streaming responses.

## Features

- 🚀 **Type-Safe**: Full TypeScript support with strict typing
- 📡 **Streaming Support**: Native support for server-sent event streams
- 🎯 **Declarative API**: Uses decorators for clean, readable code
- 🔧 **Fetcher Integration**: Built on the robust Fetcher HTTP client
- 📦 **Tree Shaking**: Optimized bundle size with full tree shaking support
- 🧪 **Well Tested**: Comprehensive test coverage with Vitest

## Installation

```bash
npm install @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

or

```bash
yarn add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

or

```bash
pnpm add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

## Quick Start

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

// Initialize the client
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Create a chat completion
const response = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello, how are you?' }],
  stream: false,
});

console.log(response.choices[0].message.content);
```

## Streaming Example

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Streaming chat completion
const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});

// Handle streaming response
for await (const chunk of stream) {
  console.log(chunk.choices[0].delta?.content || '');
}
```

## API Reference

### OpenAI Class

The main client class for interacting with OpenAI APIs.

#### Constructor

```typescript
new OpenAI(options: OpenAIOptions)
```

**Parameters:**

- `options.baseURL`: The base URL for the OpenAI API (e.g., `'https://api.openai.com/v1'`)
- `options.apiKey`: Your OpenAI API key

#### Properties

- `fetcher`: The underlying Fetcher instance
- `chat`: ChatClient instance for chat completions

### ChatClient

Handles chat completion requests.

#### Methods

##### `completions(chatRequest)`

Creates a chat completion.

**Parameters:**

- `chatRequest`: ChatRequest object with messages, model, and options

**Returns:**

- `Promise<ChatResponse>` for non-streaming requests
- `Promise<JsonServerSentEventStream<ChatResponse>>` for streaming requests

**ChatRequest Interface:**

```typescript
interface ChatRequest {
  model?: string;
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  // ... other OpenAI parameters
}
```

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Custom Base URL

For using with OpenAI-compatible APIs or proxies:

```typescript
const openai = new OpenAI({
  baseURL: 'https://your-custom-endpoint.com/v1',
  apiKey: 'your-api-key',
});
```

## Error Handling

The library throws standard JavaScript errors. Handle them appropriately:

```typescript
try {
  const response = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello' }],
  });
} catch (error) {
  console.error('OpenAI API error:', error.message);
}
```

## Advanced Usage

### Custom Fetcher Configuration

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const customFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Custom-Header': 'value',
  },
  timeout: 30000,
});

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey,
});
// Manually set fetcher if needed
openai.fetcher = customFetcher;
```

### Integration with Other Fetcher Features

Since this library is built on Fetcher, you can use all Fetcher features:

- Request/response interceptors
- Custom result extractors
- Advanced error handling
- Request deduplication

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](../../LICENSE) for details.

## Related Packages

- [@ahoo-wang/fetcher](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher) - Core HTTP client
- [@ahoo-wang/fetcher-decorator](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher-decorator) - Declarative API decorators
- [@ahoo-wang/fetcher-eventstream](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher-eventstream) - Server-sent events support
