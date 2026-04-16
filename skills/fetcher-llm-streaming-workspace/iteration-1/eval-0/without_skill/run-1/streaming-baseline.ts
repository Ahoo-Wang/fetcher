// Streaming OpenAI Chat Completions - Baseline (No Skill)
// This is a generic implementation without using fetcher-eventstream skill

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function streamChat() {
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  });

  // Process tokens as they arrive
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      process.stdout.write(content);
    }
  }
}

streamChat();

export { streamChat };
