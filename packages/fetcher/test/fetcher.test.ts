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

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Fetcher } from '../src/fetcher';
import { HttpMethod } from '../src/types';
import { FetchTimeoutError } from '../src/timeout';
import { FetchExchange } from '../src/interceptor';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Fetcher', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockClear();
  });

  it('should create fetcher with default options', () => {
    const fetcher = new Fetcher();
    expect(fetcher).toBeDefined();
  });

  it('should create fetcher with custom options', () => {
    const options = {
      baseURL: 'https://api.example.com',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };
    const fetcher = new Fetcher(options);

    expect(fetcher).toBeDefined();
  });

  it('should make a GET request', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    mockFetch.mockResolvedValue(new Response('OK'));

    const response = await fetcher.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: HttpMethod.GET,
      }),
    );
    expect(response).toBeInstanceOf(Response);
  });

  it('should make a POST request with body', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    mockFetch.mockResolvedValue(new Response('OK'));

    const response = await fetcher.post('/users', {
      body: JSON.stringify({ name: 'John' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: HttpMethod.POST,
        body: JSON.stringify({ name: 'John' }),
      }),
    );
    expect(response).toBeInstanceOf(Response);
  });

  it('should build URL with path and query parameters', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    mockFetch.mockResolvedValue(new Response('OK'));

    await fetcher.get('/users/{id}', {
      pathParams: { id: 123 },
      queryParams: { filter: 'active' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users/123?filter=active',
      expect.objectContaining({
        method: HttpMethod.GET,
      }),
    );
  });

  it('should merge headers correctly', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      headers: { Authorization: 'Bearer token' },
    });
    mockFetch.mockResolvedValue(new Response('OK'));

    await fetcher.get('/users', {
      headers: { 'Content-Type': 'application/json' },
    });

    // Check that fetch was called with the right URL
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: HttpMethod.GET,
      }),
    );

    // Check headers specifically
    const callArgs = mockFetch.mock.calls[0];
    const fetchInit = callArgs[1];
    expect(fetchInit.headers).toBeDefined();
    expect(fetchInit.headers).toHaveProperty('Authorization', 'Bearer token');
    expect(fetchInit.headers).toHaveProperty(
      'Content-Type',
      'application/json',
    );
  });

  it('should handle timeout', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      timeout: 100,
    });

    // Mock fetch to simulate a timeout scenario
    mockFetch.mockImplementation((url, options) => {
      return new Promise((_, reject) => {
        // Simulate abort event when signal is aborted
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const exchange: FetchExchange = {
              fetcher,
              url,
              request: { method: HttpMethod.GET },
              response: undefined,
              error: undefined,
            };
            reject(new FetchTimeoutError(exchange, 100));
          });
        }
      });
    });

    const promise = fetcher.get('/users');
    await expect(promise).rejects.toThrow(FetchTimeoutError);
    await expect(promise).rejects.toHaveProperty('name', 'FetchTimeoutError');
    await expect(promise).rejects.toHaveProperty(
      'message',
      'Request timeout of 100ms exceeded for GET https://api.example.com/users',
    );
  });

  it('should use request-level timeout over config-level timeout', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    // Mock fetch to simulate a timeout scenario
    mockFetch.mockImplementation((url, options) => {
      return new Promise((_, reject) => {
        // Simulate abort event when signal is aborted
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const exchange: FetchExchange = {
              fetcher,
              url,
              request: { method: HttpMethod.GET },
              response: undefined,
              error: undefined,
            };
            reject(new FetchTimeoutError(exchange, 100));
          });
        }
      });
    });

    const promise = fetcher.get('/users', { timeout: 100 });
    await expect(promise).rejects.toThrow(FetchTimeoutError);
    await expect(promise).rejects.toHaveProperty('name', 'FetchTimeoutError');
    await expect(promise).rejects.toHaveProperty(
      'message',
      'Request timeout of 100ms exceeded for GET https://api.example.com/users',
    );
  });

  it('should throw FetchTimeoutError with correct properties', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      timeout: 100,
    });

    // Mock fetch to simulate a timeout scenario
    mockFetch.mockImplementation((url, options) => {
      return new Promise((_, reject) => {
        // Simulate abort event when signal is aborted
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const exchange: FetchExchange = {
              fetcher,
              url,
              request: {
                method: HttpMethod.POST,
                body: JSON.stringify({ name: 'John' }),
              },
              response: undefined,
              error: undefined,
            };
            reject(new FetchTimeoutError(exchange, 100));
          });
        }
      });
    });

    const promise = fetcher.post('/users/123', {
      body: JSON.stringify({ name: 'John' }),
    });

    await expect(promise).rejects.toThrow(FetchTimeoutError);
    await expect(promise).rejects.toHaveProperty('name', 'FetchTimeoutError');
    await expect(promise).rejects.toHaveProperty(
      'message',
      'Request timeout of 100ms exceeded for POST https://api.example.com/users/123',
    );
  });

  it('should make all HTTP method requests', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    mockFetch.mockResolvedValue(new Response('OK'));

    await fetcher.get('/users');
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/users',
      expect.objectContaining({ method: HttpMethod.GET }),
    );

    await fetcher.post('/users');
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/users',
      expect.objectContaining({ method: HttpMethod.POST }),
    );

    await fetcher.put('/users/123');
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      'https://api.example.com/users/123',
      expect.objectContaining({ method: HttpMethod.PUT }),
    );

    await fetcher.delete('/users/123');
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      'https://api.example.com/users/123',
      expect.objectContaining({ method: HttpMethod.DELETE }),
    );

    await fetcher.patch('/users/123');
    expect(mockFetch).toHaveBeenNthCalledWith(
      5,
      'https://api.example.com/users/123',
      expect.objectContaining({ method: HttpMethod.PATCH }),
    );

    await fetcher.head('/users');
    expect(mockFetch).toHaveBeenNthCalledWith(
      6,
      'https://api.example.com/users',
      expect.objectContaining({ method: HttpMethod.HEAD }),
    );

    await fetcher.options('/users');
    expect(mockFetch).toHaveBeenNthCalledWith(
      7,
      'https://api.example.com/users',
      expect.objectContaining({ method: HttpMethod.OPTIONS }),
    );
  });

  it('should convert object body to JSON string with RequestBodyInterceptor', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    mockFetch.mockResolvedValue(new Response('OK'));

    const requestBody = { name: 'John', age: 30 };
    await fetcher.post('/users', {
      body: requestBody as any,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: HttpMethod.POST,
        body: JSON.stringify(requestBody),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('should not convert non-object body with RequestBodyInterceptor', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    mockFetch.mockResolvedValue(new Response('OK'));

    const requestBody = 'plain text';
    await fetcher.post('/users', {
      body: requestBody as any,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: HttpMethod.POST,
        body: requestBody,
      }),
    );
  });

  it('should not convert supported body types with RequestBodyInterceptor', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    mockFetch.mockResolvedValue(new Response('OK'));

    const blobBody = new Blob(['hello'], { type: 'text/plain' });
    await fetcher.post('/users', {
      body: blobBody as any,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: HttpMethod.POST,
        body: blobBody,
      }),
    );
  });
});
