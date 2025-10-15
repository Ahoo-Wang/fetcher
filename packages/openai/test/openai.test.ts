/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { OpenAI } from '../src';

const server = setupServer(
  // Mock chat completion endpoint
  http.post(
    'https://api.openai.com/v1/chat/completions',
    async ({ request }) => {
      const body = (await request.json()) as {
        stream?: boolean;
        model?: string;
        messages?: any[];
      };

      if (body.stream) {
        // Return streaming response as SSE
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            // Send initial chunk
            const chunk1 = {
              id: 'chatcmpl-test',
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: body.model || 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  delta: { role: 'assistant', content: 'Hello' },
                  finish_reason: null,
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk1)}\n\n`),
            );

            // Send content chunk
            const chunk2 = {
              id: 'chatcmpl-test',
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: body.model || 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  delta: { content: ' there!' },
                  finish_reason: null,
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk2)}\n\n`),
            );

            // Send final chunk
            const chunk3 = {
              id: 'chatcmpl-test',
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: body.model || 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: 'stop',
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk3)}\n\n`),
            );

            // Send end marker
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });

        return new HttpResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      } else {
        // Return regular JSON response
        const response = {
          id: 'chatcmpl-test',
          object: 'chat.completion',
          created: Date.now(),
          model: body.model || 'gpt-3.5-turbo',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Hello there! How can I help you today?',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 13,
            completion_tokens: 8,
            total_tokens: 21,
          },
        };

        return HttpResponse.json(response);
      }
    },
  ),
);

describe('OpenAI Test', () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  const openAI = new OpenAI({
    baseURL: 'https://api.openai.com/v1',
    apiKey: 'test-api-key',
  });

  it('should stream chat completion', async () => {
    const stream = await openAI.chat.completions({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      stream: true,
      max_tokens: 10,
    });
    expect(stream).toBeDefined();

    // Collect events from the stream
    const events: any[] = [];
    for await (const event of stream) {
      events.push(event);
      // Break after receiving a few events to avoid long-running test
      if (events.length >= 3) {
        break;
      }
    }

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].data.choices[0].delta.content).toBe('Hello');
  });

  it('should chat completion', async () => {
    const response = await openAI.chat.completions({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      max_tokens: 10,
    });
    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(Array.isArray(response.choices)).toBe(true);
    expect(response.choices.length).toBeGreaterThan(0);

    const choice = response.choices[0];
    expect(choice.message).toBeDefined();
    if (choice.message) {
      expect(choice.message.content).toBeDefined();
      expect(typeof choice.message.content).toBe('string');
      expect(choice.message.content).toBe(
        'Hello there! How can I help you today?',
      );
    }
  });
});
