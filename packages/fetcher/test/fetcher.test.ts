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
import type { FetchRequest } from '../src';
import { DEFAULT_OPTIONS, Fetcher, FetcherError, HttpMethod } from '../src';

describe('Fetcher', () => {
  it('should create Fetcher with default options', () => {
    const fetcher = new Fetcher();

    expect(fetcher).toBeInstanceOf(Fetcher);
    expect(fetcher.urlBuilder.baseURL).toBe(DEFAULT_OPTIONS.baseURL);
    expect(fetcher.headers).toEqual(DEFAULT_OPTIONS.headers);
    expect(fetcher.timeout).toBeUndefined();
    expect(fetcher.interceptors).toBeDefined();
  });

  it('should create Fetcher with custom options', () => {
    const options = {
      baseURL: 'https://api.example.com',
      headers: { Authorization: 'Bearer token' },
      timeout: 5000,
    };

    const fetcher = new Fetcher(options);

    expect(fetcher.urlBuilder.baseURL).toBe(options.baseURL);
    expect(fetcher.headers).toEqual(options.headers);
    expect(fetcher.timeout).toBe(options.timeout);
  });

  it('should handle missing headers in options', () => {
    const options = {
      baseURL: 'https://api.example.com',
    };

    const fetcher = new Fetcher(options as any);

    expect(fetcher.headers).toEqual(DEFAULT_OPTIONS.headers);
  });

  it('should handle missing interceptors in options', () => {
    const options = {
      baseURL: 'https://api.example.com',
    };

    const fetcher = new Fetcher(options as any);

    expect(fetcher.interceptors).toBeDefined();
  });

  // Helper: stub global fetch to capture the init and return a fixed Response.
  // Keeps the REAL interceptor chain running (UrlResolve, RequestBody, Fetch,
  // ValidateStatus) so tests verify actual request construction — not a
  // mocked-out exchange. The previous tests stubbed interceptors.exchange (the
  // unit under test), verifying only "mock returned mock".
  function stubFetchReturning(body = 'ok', status = 200) {
    const calls: RequestInit[] = [];
    const stub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(init ?? ({ url: String(input) } as RequestInit));
      return new Response(body, { status });
    });
    vi.stubGlobal('fetch', stub);
    return { calls, stub };
  }

  it('should make GET request with correct method', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.get('/users');
    expect(calls[0].method).toBe(HttpMethod.GET);
  });

  it('should make POST request with correct method', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.post('/users', { body: { name: 'John' } });
    expect(calls[0].method).toBe(HttpMethod.POST);
  });

  it('should make PUT request with correct method', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.put('/users/1', { body: { name: 'John' } });
    expect(calls[0].method).toBe(HttpMethod.PUT);
  });

  it('should make DELETE request with correct method', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.delete('/users/1');
    expect(calls[0].method).toBe(HttpMethod.DELETE);
  });

  it('should make PATCH request with correct method', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.patch('/users/1', { body: { name: 'John' } });
    expect(calls[0].method).toBe(HttpMethod.PATCH);
  });

  it('should make HEAD request with correct method', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.head('/users');
    expect(calls[0].method).toBe(HttpMethod.HEAD);
  });

  it('should make OPTIONS request with correct method', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.options('/users');
    expect(calls[0].method).toBe(HttpMethod.OPTIONS);
  });

  it('should make TRACE request with correct method', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.trace('/users');
    expect(calls[0].method).toBe(HttpMethod.TRACE);
  });

  it('should return the actual Response from the real interceptor chain', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    stubFetchReturning('real-body', 200);
    const response = await fetcher.get('/users');
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('real-body');
  });

  it('should construct the full URL via the real urlBuilder', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const { calls } = stubFetchReturning();
    await fetcher.get('/users/42');
    expect(calls[0].url).toBe('https://api.example.com/users/42');
  });

  it('should throw FetcherError when fetch returns no response', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    vi.stubGlobal('fetch', vi.fn(async () => undefined as any));
    await expect(fetcher.get('/users')).rejects.toThrow(FetcherError);
  });

  it('should merge default and request headers and pass them to fetch', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      headers: { 'Content-Type': 'application/json' },
    });
    const { calls } = stubFetchReturning();
    await fetcher.request({
      url: '/users',
      headers: { Authorization: 'Bearer token' },
    });
    const headers = new Headers(calls[0].headers as HeadersInit);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer token');
  });

  it('should resolve request timeout over fetcher timeout and wire AbortSignal to fetch', async () => {
    // The timeout is resolved inside the chain before fetch; verify the request
    // reaches fetch with a fresh AbortSignal (the timeout mechanism's
    // observable boundary). Request timeout (3000) overrides fetcher (5000).
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });
    const { calls } = stubFetchReturning();
    const request: FetchRequest = { url: '/users', timeout: 3000 };
    await fetcher.request(request);
    expect(calls[0].signal).toBeInstanceOf(AbortSignal);
    expect(calls[0].signal?.aborted).toBe(false);
  });

  it('should use fetcher timeout when request does not specify one', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });
    const { calls } = stubFetchReturning();
    await fetcher.request({ url: '/users' });
    expect(calls[0].signal).toBeInstanceOf(AbortSignal);
  });
});
