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
import { ExchangeError, Fetcher, FetchTimeoutError } from '../src';

describe('Fetcher fetch option', () => {
  it('sends requests with the given fetch, a RequestInit without fetcher-only fields', async () => {
    const send = vi.fn(async () => new Response('ok'));
    const fetcher = new Fetcher({
      baseURL: 'https://custom.test',
      fetch: send,
    });
    const controller = new AbortController();
    await fetcher.get('/users/{id}', {
      urlParams: { path: { id: 1 }, query: { q: 'a' } },
      timeout: 1000,
      abortController: controller,
      headers: { Accept: 'text/plain' },
    });
    expect(send).toHaveBeenCalledTimes(1);
    const [input, init] = send.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(input).toBe('https://custom.test/users/1?q=a');
    expect(init.method).toBe('GET');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    for (const key of ['url', 'timeout', 'urlParams', 'abortController']) {
      expect(init).not.toHaveProperty(key);
    }
  });

  it('keeps the timeout with a custom fetch', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = new Fetcher({
        fetch: () => new Promise<Response>(() => {}),
        timeout: 50,
      });
      const pending = fetcher.get('https://custom.test/slow').catch(e => e);
      await vi.advanceTimersByTimeAsync(50);
      const error = await pending;
      expect(error).toBeInstanceOf(ExchangeError);
      expect(error.cause).toBeInstanceOf(FetchTimeoutError);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('InterceptorManager error phase', () => {
  it('rejects with an ExchangeError when an error interceptor throws', async () => {
    const thrown = new TypeError('callback failed');
    const fetcher = new Fetcher({
      fetch: async () => new Response('missing', { status: 404 }),
    });
    fetcher.interceptors.error.use({
      name: 'Failing',
      order: 0,
      intercept() {
        throw thrown;
      },
    });
    const error = await fetcher.get('https://custom.test/x').catch(e => e);
    expect(error).toBeInstanceOf(ExchangeError);
    expect(error.cause).toBe(thrown);
    expect(error.exchange.error).toBe(thrown);
  });
});
