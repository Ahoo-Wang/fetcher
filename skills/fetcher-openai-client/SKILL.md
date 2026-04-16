---
name: fetcher-openai-client
description: Create type-safe OpenAI clients using @ahoo-wang/fetcher-openai. Use when users want to create OpenAI scripts, set up chat completions, use GPT models, implement AI clients with streaming or function calling, or mention @ahoo-wang/fetcher-openai.
---

# Fetcher OpenAI Client Skill

This skill helps you work with the `@ahoo-wang/fetcher-openai` package for type-safe OpenAI API interactions.

## Overview

A modern, type-safe OpenAI client built on the Fetcher ecosystem. Supports both streaming and non-streaming responses with full TypeScript support.

## Installation

```bash
pnpm add @ahoo-wang/fetcher-openai @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream
```

## Core Concepts

### 1. OpenAI Class Initialization

The `OpenAI` class requires `baseURL` and `apiKey`:

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});
```

**Constructor parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseURL` | `string` | Yes | Base URL for the API (e.g., `'https://api.openai.com/v1'`) |
| `apiKey` | `string` | Yes | Your OpenAI API key for authentication |

**Custom base URL examples:**
```typescript
// Azure OpenAI
const openai = new OpenAI({
  baseURL: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
  apiKey: 'your-azure-api-key',
});

// OpenAI-compatible proxy
const openai = new OpenAI({
  baseURL: 'https://your-proxy-service.com/api/openai',
  apiKey: 'your-proxy-api-key',
});

// Local server
const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'not-needed-for-local',
});
```

### 2. chat.completions() Method

The main method for creating chat completions:

```typescript
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
```

**Key request parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | `string` | Required | Model ID (e.g., `'gpt-3.5-turbo'`, `'gpt-4'`) |
| `messages` | `Message[]` | Required | Conversation messages |
| `stream` | `boolean` | `false` | Enable streaming responses |
| `temperature` | `number` | `1.0` | Sampling temperature (0.0 - 2.0) |
| `max_tokens` | `number` | None | Maximum tokens to generate |
| `top_p` | `number` | `1.0` | Nucleus sampling (0.0 - 1.0) |
| `frequency_penalty` | `number` | `0.0` | Repetition penalty (-2.0 - 2.0) |
| `presence_penalty` | `number` | `0.0` | Topic diversity penalty (-2.0 - 2.0) |
| `n` | `number` | `1` | Number of completions to generate |
| `stop` | `string \| string[]` | None | Stop sequences |

**Message structure:**
```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  name?: string;           // For tool messages
  tool_call_id?: string;  // ID of the tool call (for tool role)
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}
```

### 3. Streaming vs Non-Streaming Responses

**Non-streaming (default):**
```typescript
const response = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);
// Returns: ChatResponse object
```

**Streaming:**
```typescript
const stream = await openai.chat.completions({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});

// Process streaming response
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  if (content) {
    process.stdout.write(content); // Real-time output
  }
  if (chunk.choices[0]?.finish_reason) {
    break;
  }
}
```

**Return types:**
- `stream: false` or `undefined` -> `Promise<ChatResponse>`
- `stream: true` -> `Promise<JsonServerSentEventStream<ChatResponse>>`

**Streaming with progress tracking:**
```typescript
let chunksReceived = 0;
let totalContent = '';

for await (const chunk of stream) {
  chunksReceived++;
  const content = chunk.choices[0]?.delta?.content || '';
  totalContent += content;

  if (chunksReceived % 5 === 0) {
    console.log(`Received ${chunksReceived} chunks, ${totalContent.length} chars`);
  }

  if (chunk.choices[0]?.finish_reason) {
    console.log(`Stream finished: ${chunk.choices[0].finish_reason}`);
    break;
  }
}
```

### 4. Tools and Function Calling

Define tools and let the model decide when to call them:

```typescript
const tools = [
  {
    type: 'function',
    function: {
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
  },
];

const response = await openai.chat.completions({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: "What's the weather like in San Francisco?" },
  ],
  tools: tools,
  tool_choice: 'auto', // Let model decide
});

// Handle tool calls
if (response.choices[0].message.tool_calls) {
  const toolCall = response.choices[0].message.tool_calls[0];
  console.log('Tool called:', toolCall.function.name);
  console.log('Arguments:', JSON.parse(toolCall.function.arguments));
}
```

**Tool choice options:**
- `'auto'` - Let the model decide
- `'none'` - Do not use any tools
- `{ type: 'function', function: { name: 'function_name' } }` - Force specific function

### 5. Integration with fetcher-decorator-service Pattern

Combine OpenAI client with decorator services for declarative API definitions:

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';
import { api, post, body } from '@ahoo-wang/fetcher-decorator';
import { NamedFetcher } from '@ahoo-wang/fetcher';

// Create OpenAI client
const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

// Register as named fetcher for use with decorators
const openaiFetcher = new NamedFetcher('openai', openai.fetcher);

// Define a chat service using decorators
@api('/chat', { fetcher: openaiFetcher })
export class ChatService {
  @post('/completions')
  complete(@body() request: ChatRequest): Promise<any> {
    throw autoGeneratedError(request);
  }
}

// Use the service
const chatService = new ChatService();
const response = await chatService.complete({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

**Alternative: Direct OpenAI usage with decorator-style patterns:**
```typescript
// Create a conversation manager class
class ChatConversation {
  private client: OpenAI;
  private messages: Array<{ role: string; content: string }> = [];

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey,
    });
  }

  async sendMessage(content: string, options: Partial<ChatRequest> = {}) {
    this.messages.push({ role: 'user', content });

    const response = await this.client.chat.completions({
      model: 'gpt-3.5-turbo',
      messages: this.messages,
      ...options,
    });

    const assistantMessage = response.choices[0].message;
    this.messages.push({ role: 'assistant', content: assistantMessage.content });

    return assistantMessage;
  }

  clearHistory() {
    this.messages = [];
  }
}

// Usage
const conversation = new ChatConversation(process.env.OPENAI_API_KEY!);
const response = await conversation.sendMessage('How do I use TypeScript?');
```

## Error Handling

```typescript
try {
  const response = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
} catch (error: any) {
  if (error.response) {
    const status = error.response.status;
    switch (status) {
      case 401:
        console.error('Authentication failed - check your API key');
        break;
      case 429:
        console.error('Rate limit exceeded');
        break;
      case 400:
        console.error('Bad request:', error.response.data.error);
        break;
    }
  }
}
```

**Streaming error handling:**
```typescript
try {
  const stream = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  });

  for await (const chunk of stream) {
    // process chunk
  }
} catch (error) {
  if (error.name === 'EventStreamConvertError') {
    console.error('Streaming error - invalid event stream');
  }
}
```

## Advanced Configuration

**Custom Fetcher with interceptors:**
```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const customFetcher = new Fetcher({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  timeout: 30000,
  interceptors: [
    {
      request: config => {
        console.log('Request:', config.url);
        return config;
      },
    },
  ],
});

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

openai.fetcher = customFetcher;
```

**Retry logic:**
```typescript
openai.fetcher.defaults.retry = {
  attempts: 3,
  delay: 1000,
  backoff: 'exponential',
};
```

## Key Imports

```typescript
import { OpenAI } from '@ahoo-wang/fetcher-openai';
import type { ChatRequest, ChatResponse, Message } from '@ahoo-wang/fetcher-openai';
```

## Reference Files

For more examples, see:
- `/Users/ahoo/work/ahoo-git/agent-coder/fetcher/packages/openai/README.md` - Full API documentation