# `@ahoo-wang/fetcher-openai`

A typed OpenAI Chat Completions client with automatic JSON and Server-Sent
Event result handling. Use it on a trusted server or behind your own proxy.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openai
```

Peer dependencies: `fetcher`, `fetcher-decorator`, and `fetcher-eventstream`.

## Example

```ts
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const stream = await openai.chat.completions({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: 'Write a short release note.' }],
  stream: true,
});

for await (const event of stream) {
  const text = event.data.choices[0]?.delta?.content;
  if (text) process.stdout.write(text);
}
```

Never embed an API key in a browser bundle or Storybook.

## Core capabilities

- Conditional return types from the literal `stream` flag.
- Non-streaming `ChatResponse` JSON extraction.
- Typed SSE chunks with automatic `[DONE]` termination.
- Public request, response, message, choice, usage, and delta types.
- `ChatClient` for applications that already own a configured Fetcher.

## Documentation

- [OpenAI streaming recipe](https://fetcher.ahoo.me/recipes/openai-streaming)
- [OpenAI reference](https://fetcher.ahoo.me/reference/openai)
- [Interactive stream stories](https://fetcher.ahoo.me/storybook/)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
