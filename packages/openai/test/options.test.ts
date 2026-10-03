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

import { describe, expect, it, vi } from 'vitest';
import { OpenAI } from '../src';

describe('OpenAI options', () => {
  it('passes Fetcher options through and keeps the API key authoritative', async () => {
    const send = vi.fn(async () => Response.json({ id: 'x', choices: [] }));
    const openai = new OpenAI({
      baseURL: 'https://llm.test/v1',
      apiKey: 'key',
      timeout: 1234,
      fetch: send,
      headers: { authorization: 'Bearer other', 'X-Trace': '1' },
    });
    expect(openai.fetcher.timeout).toBe(1234);
    await openai.chat.completions({ model: 'm', messages: [] });
    const [input, init] = send.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(input).toBe('https://llm.test/v1/chat/completions');
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get('Authorization')).toBe('Bearer key');
    expect(headers.get('X-Trace')).toBe('1');
  });
});
