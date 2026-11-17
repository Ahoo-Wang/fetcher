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

import { describe, expect, it } from 'vitest';
import { EventStreamIncompleteError } from '@ahoo-wang/fetcher-eventstream';
import { OpenAI } from '../src';

/**
 * A standard Response from another constructor, like the one an iframe's
 * `fetch` or a separately installed `undici` returns: it lacks the helpers
 * `@ahoo-wang/fetcher-eventstream` installs on the global `Response.prototype`.
 */
function foreignResponse(body: string, contentType: string): Response {
  const response = new Response(body, {
    headers: { 'Content-Type': contentType },
  });
  return {
    get headers() {
      return response.headers;
    },
    get body() {
      return response.body;
    },
    get bodyUsed() {
      return response.bodyUsed;
    },
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    json: () => response.json(),
    text: () => response.text(),
  } as unknown as Response;
}

const chunk = {
  id: 'chunk',
  object: 'chat.completion.chunk',
  created: 1,
  choices: [{ index: 0, delta: { content: 'hello' }, finish_reason: null }],
};

function clientReturning(response: () => Response) {
  return new OpenAI({
    baseURL: 'https://example.test',
    apiKey: 'local-test',
    fetch: async () => response(),
  });
}

describe('OpenAI with a custom fetch returning another Response', () => {
  const request = { model: 'local-fixture', messages: [] };

  it('reads a JSON completion', async () => {
    const client = clientReturning(() =>
      foreignResponse(
        JSON.stringify({ ...chunk, object: 'chat.completion' }),
        'application/json',
      ),
    );
    const response = await client.chat.completions(request);
    expect(response.id).toBe('chunk');
  });

  it('streams a completion up to data: [DONE]', async () => {
    const client = clientReturning(() =>
      foreignResponse(
        `data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`,
        'text/event-stream',
      ),
    );
    const stream = await client.chat.completions({ ...request, stream: true });
    const ids: string[] = [];
    for await (const event of stream) ids.push(event.data.id);
    expect(ids).toEqual(['chunk']);
  });

  it('errors a stream that ends without data: [DONE]', async () => {
    const client = clientReturning(() =>
      foreignResponse(
        `data: ${JSON.stringify(chunk)}\n\n`,
        'text/event-stream',
      ),
    );
    const stream = await client.chat.completions({ ...request, stream: true });
    const ids: string[] = [];
    await expect(
      (async () => {
        for await (const event of stream) ids.push(event.data.id);
      })(),
    ).rejects.toBeInstanceOf(EventStreamIncompleteError);
    expect(ids).toEqual(['chunk']);
  });
});
