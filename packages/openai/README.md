# @ahoo-wang/fetcher-openai

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openai.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-openai.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-openai)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)
[![Node Version](https://img.shields.io/node/v/@ahoo-wang/fetcher-openai.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

> 🚀 **Modern • Type-Safe • Streaming-Ready** - A comprehensive OpenAI client built on the Fetcher ecosystem

A modern, type-safe OpenAI client library built on the Fetcher ecosystem. Provides seamless integration with OpenAI's Chat Completions API, supporting both streaming and non-streaming responses with full TypeScript support and automatic request handling.

## ✨ Features

- 🚀 **Full TypeScript Support**: Complete type safety with strict typing and IntelliSense
- 📡 **Native Streaming**: Built-in support for server-sent event streams with automatic termination
- 🎯 **Declarative API**: Clean, readable code using decorator patterns
- 🔧 **Fetcher Ecosystem**: Built on the robust Fetcher HTTP client with advanced features
- 📦 **Optimized Bundle**: Full tree shaking support with minimal bundle size
- 🧪 **Comprehensive Testing**: 100% test coverage with Vitest
- 🔄 **Conditional Types**: Smart return types based on streaming configuration
- 🛡️ **Error Handling**: Robust error handling with detailed error messages
- ⚡ **Performance**: Optimized for both development and production environments
- 🔌 **Extensible**: Easy integration with custom interceptors and middleware

## 📦 Installation

### Prerequisites

- **Node.js**: >= 16.0.0
- **TypeScript**: >= 5.0 (recommended)

### Install with npm

```bash
npm install @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

### Install with yarn

```bash
yarn add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

### Install with pnpm

```bash
pnpm add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

### Peer Dependencies

This package requires the following peer dependencies:

- `@ahoo-wang/fetcher`: Core HTTP client functionality
- `@ahoo-wang/fetcher-decorator`: Declarative API decorators
- `@ahoo-wang/fetcher-eventstream`: Server-sent events support

These are automatically installed when using the commands above.

## 🚀 Quick Start

### Basic Setup

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

// Initialize the client with your API key
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!, // Your OpenAI API key
});

// Create a simple chat completion
const response = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' },
  ],
  temperature: 0.7,
  max_tokens: 150,
});

console.log(response.choices[0].message.content);
// Output: "Hello! I'm doing well, thank you for asking. How can I help you today?"
```

### Environment Variables Setup

Create a `.env` file in your project root:

```bash
# .env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
```

Then use in your code:

```typescript
import { config } from 'dotenv';
config(); // Load environment variables

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY!,
});
```

## 📡 Streaming Examples

### Basic Streaming

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Create a streaming chat completion
const stream = await openai.chat.completions({
  model: 'gpt-4', // Use GPT-4 for better quality
  messages: [
    { role: 'system', content: 'You are a creative storyteller.' },
    {
      role: 'user',
      content: 'Tell me a short story about a robot learning to paint',
    },
  ],
  stream: true,
  temperature: 0.8, // Higher creativity
  max_tokens: 1000,
});

// Process the streaming response in real-time
let fullResponse = '';
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  if (content) {
    process.stdout.write(content); // Real-time output
    fullResponse += content;
  }
}

console.log('\n\n--- Stream Complete ---');
console.log('Total characters:', fullResponse.length);
```

### Advanced Streaming with Progress Tracking

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Write a haiku about programming' }],
  stream: true,
});

// Track streaming progress
let chunksReceived = 0;
let totalContent = '';

for await (const chunk of stream) {
  chunksReceived++;
  const content = chunk.choices[0]?.delta?.content || '';

  if (content) {
    totalContent += content;
    // Show progress every 5 chunks
    if (chunksReceived % 5 === 0) {
      console.log(
        `Received ${chunksReceived} chunks, ${totalContent.length} chars`,
      );
    }
  }

  // Check for completion
  if (chunk.choices[0]?.finish_reason) {
    console.log(`Stream finished: ${chunk.choices[0].finish_reason}`);
    break;
  }
}

console.log('Final content:', totalContent);
```

## 📚 API Reference

### OpenAI Class

The main client class that provides access to all OpenAI API features.

#### Constructor

```typescript
new OpenAI(options: OpenAIOptions)
```

Creates a new OpenAI client instance with the specified configuration.

**Parameters:**

| Parameter         | Type     | Required | Description                                                           |
| ----------------- | -------- | -------- | --------------------------------------------------------------------- |
| `options.baseURL` | `string` | ✅       | The base URL for the OpenAI API (e.g., `'https://api.openai.com/v1'`) |
| `options.apiKey`  | `string` | ✅       | Your OpenAI API key for authentication                                |

**Example:**

```typescript
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: 'sk-your-api-key-here',
});
```

**Throws:**

- `TypeError`: If `apiKey` or `baseURL` are not provided or are not strings

#### Properties

| Property  | Type         | Description                                                        |
| --------- | ------------ | ------------------------------------------------------------------ |
| `fetcher` | `Fetcher`    | The underlying HTTP client instance configured with authentication |
| `chat`    | `ChatClient` | Chat completion client for interacting with chat models            |

### ChatClient

Specialized client for OpenAI's Chat Completions API with support for both streaming and non-streaming responses.

#### Methods

##### `completions<T extends ChatRequest>(chatRequest: T)`

Creates a chat completion with conditional return types based on the streaming configuration.

**Type Parameters:**

- `T`: Extends `ChatRequest` - The request type that determines return type

**Parameters:**

- `chatRequest: T` - Chat completion request configuration

**Returns:**

- `Promise<ChatResponse>` when `T['stream']` is `false` or `undefined`
- `Promise<JsonServerSentEventStream<ChatResponse>>` when `T['stream']` is `true`

**Throws:**

- `Error`: Network errors, authentication failures, or API errors
- `EventStreamConvertError`: When streaming response cannot be processed

### Core Interfaces

#### ChatRequest

Configuration object for chat completion requests.

```typescript
interface ChatRequest {
  // Core parameters
  model?: string; // Model ID (e.g., 'gpt-3.5-turbo', 'gpt-4')
  messages: Message[]; // Conversation messages
  stream?: boolean; // Enable streaming responses

  // Generation parameters
  temperature?: number; // Sampling temperature (0.0 - 2.0)
  max_tokens?: number; // Maximum tokens to generate
  top_p?: number; // Nucleus sampling parameter (0.0 - 1.0)

  // Penalty parameters
  frequency_penalty?: number; // Repetition penalty (-2.0 - 2.0)
  presence_penalty?: number; // Topic diversity penalty (-2.0 - 2.0)

  // Advanced parameters
  n?: number; // Number of completions to generate
  stop?: string | string[]; // Stop sequences
  logit_bias?: Record<string, number>; // Token bias adjustments
  user?: string; // End-user identifier

  // Response format
  response_format?: object; // Response format specification

  // Function calling (beta)
  tools?: any[]; // Available tools/functions
  tool_choice?: any; // Tool selection strategy

  // Other OpenAI parameters
  [key: string]: any;
}
```

#### Message

Represents a single message in the conversation.

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string; // For function messages
  function_call?: any; // For function call results
}
```

#### ChatResponse

Response object for non-streaming chat completions.

```typescript
interface ChatResponse {
  id: string; // Unique response identifier
  object: string; // Object type (usually 'chat.completion')
  created: number; // Unix timestamp of creation
  model: string; // Model used for completion
  choices: Choice[]; // Array of completion choices
  usage: Usage; // Token usage statistics
}
```

#### Choice

Represents a single completion choice.

```typescript
interface Choice {
  index: number; // Choice index (0-based)
  message: Message; // The completion message
  finish_reason: string; // Reason completion stopped
}
```

#### Usage

Token usage statistics for the request.

```typescript
interface Usage {
  prompt_tokens: number; // Tokens in the prompt
  completion_tokens: number; // Tokens in the completion
  total_tokens: number; // Total tokens used
}
```

## ⚙️ Configuration

### Environment Variables

Set up your environment variables for easy configuration:

```bash
# .env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
```

Load them in your application:

```typescript
import { config } from 'dotenv';
config();

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY!,
});
```

### Custom Base URL

Use with OpenAI-compatible APIs, proxies, or custom deployments:

```typescript
// Using Azure OpenAI
const openai = new OpenAI({
  baseURL:
    'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
  apiKey: 'your-azure-api-key',
});

// Using a proxy service
const openai = new OpenAI({
  baseURL: 'https://your-proxy-service.com/api/openai',
  apiKey: 'your-proxy-api-key',
});

// Using a local OpenAI-compatible server
const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'not-needed-for-local',
});
```

### Advanced Configuration

#### Custom HTTP Client Configuration

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const customFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Custom-Header': 'value',
  },
  timeout: 30000, // 30 second timeout
  retry: {
    attempts: 3,
    delay: 1000,
  },
});

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Replace the default fetcher
openai.fetcher = customFetcher;
```

#### Request Interceptors

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

// Add request logging
const loggingFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  interceptors: [
    {
      request: config => {
        console.log('Making request to:', config.url);
        return config;
      },
      response: response => {
        console.log('Response status:', response.status);
        return response;
      },
    },
  ],
});

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

openai.fetcher = loggingFetcher;
```

## 🛡️ Error Handling

The library provides comprehensive error handling with detailed error messages and proper error types.

### Basic Error Handling

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

try {
  const response = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello, world!' }],
  });

  console.log('Success:', response.choices[0].message.content);
} catch (error) {
  console.error('OpenAI API Error:', error.message);
  console.error('Error details:', error);
}
```

### Advanced Error Handling with Status Codes

```typescript
try {
  const response = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
} catch (error: any) {
  // Handle different error types
  if (error.response) {
    // API returned an error response
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        console.error('Authentication failed - check your API key');
        break;
      case 429:
        console.error('Rate limit exceeded - implement backoff strategy');
        console.log('Retry after:', data.retry_after, 'seconds');
        break;
      case 400:
        console.error('Bad request - check your parameters');
        console.log('Error details:', data.error);
        break;
      case 500:
      case 502:
      case 503:
        console.error('OpenAI server error - retry with exponential backoff');
        break;
      default:
        console.error(`Unexpected error (${status}):`, data.error?.message);
    }
  } else if (error.request) {
    // Network error
    console.error('Network error - check your internet connection');
    console.error('Request details:', error.request);
  } else {
    // Other error
    console.error('Unexpected error:', error.message);
  }
}
```

### Streaming Error Handling

```typescript
try {
  const stream = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Tell me a story' }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      process.stdout.write(content);
    }
  }
} catch (error) {
  if (error.name === 'EventStreamConvertError') {
    console.error('Streaming error - response may not be a valid event stream');
  } else {
    console.error('Streaming failed:', error.message);
  }
}
```

### Retry Logic Implementation

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

class ResilientOpenAI {
  private client: OpenAI;
  private maxRetries: number;
  private baseDelay: number;

  constructor(apiKey: string, maxRetries = 3, baseDelay = 1000) {
    this.client = new OpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey,
    });
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async completions(request: any, attempt = 1): Promise<any> {
    try {
      return await this.client.chat.completions(request);
    } catch (error: any) {
      const isRetryable =
        error.response?.status >= 500 ||
        error.response?.status === 429 ||
        !error.response; // Network errors

      if (isRetryable && attempt <= this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.delay(delay);
        return this.completions(request, attempt + 1);
      }

      throw error;
    }
  }
}

// Usage
const resilientClient = new ResilientOpenAI(process.env.OPENAI_API_KEY!);

try {
  const response = await resilientClient.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
  console.log(response.choices[0].message.content);
} catch (error) {
  console.error('All retry attempts failed:', error.message);
}
```

## 🔧 Advanced Usage

### Custom Fetcher Configuration

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const customFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Custom-Header': 'value',
    'X-Custom-Client': 'my-app/1.0.0',
  },
  timeout: 30000, // 30 second timeout
  retry: {
    attempts: 3, // Retry failed requests
    delay: 1000, // Initial delay between retries
    backoff: 'exponential', // Exponential backoff strategy
  },
  interceptors: [
    {
      request: config => {
        console.log(`Making ${config.method} request to ${config.url}`);
        return config;
      },
      response: response => {
        console.log(`Response: ${response.status}`);
        return response;
      },
    },
  ],
});

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Replace the default fetcher
openai.fetcher = customFetcher;
```

### Function Calling (Beta)

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Define available functions
const functions = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA',
        },
      },
      required: ['location'],
    },
  },
];

// Make a request with function calling
const response = await openai.chat.completions({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: "What's the weather like in San Francisco?" },
  ],
  functions: functions,
  function_call: 'auto', // Let the model decide when to call functions
});

// Handle function calls
if (response.choices[0].message.function_call) {
  const functionCall = response.choices[0].message.function_call;
  console.log('Function called:', functionCall.name);
  console.log('Arguments:', JSON.parse(functionCall.arguments));
}
```

### Conversation Management

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

class ChatConversation {
  private client: OpenAI;
  private messages: Array<{ role: string; content: string }> = [];

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey,
    });
  }

  async addMessage(role: 'system' | 'user' | 'assistant', content: string) {
    this.messages.push({ role, content });
  }

  async sendMessage(content: string, options: Partial<ChatRequest> = {}) {
    await this.addMessage('user', content);

    const response = await this.client.chat.completions({
      model: 'gpt-3.5-turbo',
      messages: this.messages,
      ...options,
    });

    const assistantMessage = response.choices[0].message;
    await this.addMessage('assistant', assistantMessage.content);

    return assistantMessage;
  }

  getHistory() {
    return [...this.messages];
  }

  clearHistory() {
    this.messages = [];
  }
}

// Usage
const conversation = new ChatConversation(process.env.OPENAI_API_KEY!);

// Set system prompt
await conversation.addMessage('system', 'You are a helpful coding assistant.');

// Have a conversation
const response1 = await conversation.sendMessage('How do I use TypeScript?');
console.log('Assistant:', response1.content);

const response2 = await conversation.sendMessage('Can you show me an example?');
console.log('Assistant:', response2.content);
```

### Batch Processing

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

async function processBatch(prompts: string[], batchSize = 5) {
  const results = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);

    const batchPromises = batch.map(prompt =>
      openai.chat.completions({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    );

    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < prompts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      // Continue with next batch or implement retry logic
    }
  }

  return results;
}

// Usage
const prompts = [
  'Explain quantum computing',
  'What is machine learning?',
  'How does blockchain work?',
  'Describe cloud computing',
];

const results = await processBatch(prompts);
results.forEach((result, index) => {
  console.log(`Prompt ${index + 1}:`, result.choices[0].message.content);
});
```

### Integration with Other Fetcher Features

Since this library is built on the Fetcher ecosystem, you can leverage all Fetcher features:

#### Request/Response Interceptors

```typescript
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Add logging interceptor
openai.fetcher.interceptors.request.use(config => {
  console.log(`[${new Date().toISOString()}] ${config.method} ${config.url}`);
  return config;
});

openai.fetcher.interceptors.response.use(response => {
  console.log(`[${new Date().toISOString()}] Response: ${response.status}`);
  return response;
});
```

#### Custom Result Extractors

```typescript
import { ResultExtractor } from '@ahoo-wang/fetcher';

// Create a custom extractor that adds metadata
const metadataExtractor: ResultExtractor = exchange => {
  const response = exchange.response;
  return {
    ...response,
    _metadata: {
      requestId: response.headers.get('x-request-id'),
      processingTime: Date.now() - exchange.startTime,
      model: response.model,
    },
  };
};

// Use with chat completions
const response = await openai.chat.completions(
  {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  {
    resultExtractor: metadataExtractor,
  },
);
```

#### Request Deduplication

```typescript
// Enable request deduplication for identical requests
openai.fetcher.defaults.deduplicate = true;

// This will reuse the response from identical concurrent requests
const [response1, response2] = await Promise.all([
  openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
  openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
]);
```

## 🔄 Migration Guide

### Migrating from OpenAI SDK

If you're migrating from the official OpenAI SDK:

```typescript
// Before (OpenAI SDK)
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
});

// After (Fetcher OpenAI)
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const response = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Key Differences

| Feature            | OpenAI SDK            | Fetcher OpenAI                      |
| ------------------ | --------------------- | ----------------------------------- |
| **Streaming**      | `for await (...)`     | `for await (...)` (same)            |
| **Error Handling** | Custom error types    | Standard JavaScript errors          |
| **Configuration**  | `new OpenAI(options)` | `new OpenAI(options)`               |
| **TypeScript**     | Full support          | Full support with conditional types |
| **Interceptors**   | Limited               | Full Fetcher interceptor support    |
| **Bundle Size**    | Larger                | Optimized with tree shaking         |

## 🐛 Troubleshooting

### Common Issues

#### Authentication Errors

**Problem:** `401 Unauthorized` error

**Solutions:**

```typescript
// 1. Check your API key
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!, // Make sure this is set
});

// 2. Verify API key format
if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
  throw new Error('Invalid API key format');
}
```

#### Streaming Not Working

**Problem:** Streaming responses not working as expected

**Solutions:**

```typescript
// 1. Ensure stream parameter is set to true
const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true, // This is required for streaming
});

// 2. Handle the stream properly
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content); // Use process.stdout.write for real-time output
  }
}
```

#### Rate Limiting

**Problem:** `429 Too Many Requests` error

**Solutions:**

```typescript
// Implement exponential backoff
async function completionsWithRetry(request: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await openai.chat.completions(request);
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

#### Network Errors

**Problem:** Connection timeouts or network failures

**Solutions:**

```typescript
// Configure timeout and retry
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Set custom timeout
openai.fetcher.defaults.timeout = 60000; // 60 seconds

// Add retry logic
openai.fetcher.defaults.retry = {
  attempts: 3,
  delay: 1000,
  backoff: 'exponential',
};
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Enable request logging
openai.fetcher.interceptors.request.use(config => {
  console.log('Request:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    body: config.body,
  });
  return config;
});

openai.fetcher.interceptors.response.use(response => {
  console.log('Response:', {
    status: response.status,
    headers: response.headers,
    data: response.data,
  });
  return response;
});
```

## ⚡ Performance Tips

### Optimize Bundle Size

```typescript
// Only import what you need
import { OpenAI } from '@ahoo-wang/fetcher-openai';

// Avoid importing unused features
// ❌ Don't do this if you only need chat completions
// import * as OpenAI from '@ahoo-wang/fetcher-openai';
```

### Connection Pooling

For high-throughput applications:

```typescript
// Use HTTP/2 compatible clients for better performance
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Configure connection pooling if using Node.js
process.env.NODE_OPTIONS = '--max-http-header-size=81920';
```

### Streaming Optimization

```typescript
// Process streaming responses efficiently
const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Long response here...' }],
  stream: true,
  max_tokens: 1000, // Limit tokens for faster responses
});

// Use efficient streaming processing
let buffer = '';
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  buffer += content;

  // Process in chunks rather than character by character
  if (buffer.length >= 100) {
    processChunk(buffer);
    buffer = '';
  }
}
```

### Caching Strategy

```typescript
// Implement response caching for similar requests
class CachedOpenAI {
  private cache = new Map<string, any>();
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey,
    });
  }

  private getCacheKey(request: any): string {
    return JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
    });
  }

  async completions(request: any, useCache = true) {
    const cacheKey = this.getCacheKey(request);

    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await this.client.chat.completions(request);

    if (useCache) {
      this.cache.set(cacheKey, response);
    }

    return response;
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Ahoo-Wang/fetcher.git
cd fetcher

# Install dependencies
pnpm install

# Run tests for this package
pnpm --filter @ahoo-wang/fetcher-openai test

# Build the package
pnpm --filter @ahoo-wang/fetcher-openai build
```

### Code Style

This project uses ESLint and Prettier for code formatting. Please ensure your code follows the established patterns:

```bash
# Lint the code
pnpm --filter @ahoo-wang/fetcher-openai lint

# Format code
pnpm format
```

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](../../LICENSE) for details.

## 🔗 Related Packages

- [**@ahoo-wang/fetcher**](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher) - Core HTTP client with advanced features
- [**@ahoo-wang/fetcher-decorator**](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher-decorator) - Declarative API decorators for type-safe requests
- [**@ahoo-wang/fetcher-eventstream**](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/fetcher-eventstream) - Server-sent events support for real-time streaming
- [**@ahoo-wang/fetcher-openapi**](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/openapi) - OpenAPI specification client generation

## 📊 Project Status

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openai.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openai)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)

---

<p align="center">
  <strong>Built with ❤️ using the Fetcher ecosystem</strong>
</p>

<p align="center">
  <a href="https://github.com/Ahoo-Wang/fetcher">GitHub</a> •
  <a href="https://www.npmjs.com/package/@ahoo-wang/fetcher-openai">NPM</a> •
  <a href="https://deepwiki.com/Ahoo-Wang/fetcher">Documentation</a>
</p>
