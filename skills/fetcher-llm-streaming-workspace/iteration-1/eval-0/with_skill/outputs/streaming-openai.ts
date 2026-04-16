// Streaming OpenAI Chat Completions with Fetcher Eventstream
// This example demonstrates token-by-token streaming using the fetcher eventstream package

import '@ahoo-wang/fetcher-eventstream';
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

async function streamChat() {
  // Create streaming chat completion request
  const stream = await openai.chat.completions({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true, // Enable streaming mode
  });

  // Process tokens as they arrive - real-time output, no buffering
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      process.stdout.write(content); // Real-time token output
    }
  }
}

streamChat();

export { streamChat };
