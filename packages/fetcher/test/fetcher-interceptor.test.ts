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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Fetcher, FetchExchange, Interceptor } from '../src';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Fetcher Interceptors', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockClear();
  });

  it('should apply request interceptors', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Add a request interceptor that modifies the request
    const requestInterceptor: Interceptor = {
      name: 'request-interceptor-1',
      order: 0,
      intercept: vi.fn((exchange: FetchExchange) => {
        return {
          ...exchange,
          request: {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              'X-Test-Header': 'test-value',
            },
          },
        };
      }),
    };

    fetcher.interceptors.request.use(requestInterceptor);
    mockFetch.mockResolvedValue(new Response('OK'));

    await fetcher.get('/users');

    // Verify interceptor was called
    expect(requestInterceptor.intercept).toHaveBeenCalled();

    // Verify fetch was called with modified request
    const callArgs = mockFetch.mock.calls[0];
    const fetchInit = callArgs[1];
    expect(fetchInit.headers).toHaveProperty('X-Test-Header', 'test-value');
  });

  it('should apply response interceptors', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Add a response interceptor that modifies the response
    const responseInterceptor: Interceptor = {
      name: 'response-interceptor-1',
      order: 0,
      intercept: vi.fn(async (exchange: FetchExchange) => {
        // Add a custom property to the response
        if (exchange.response) {
          Object.defineProperty(exchange.response, 'customProperty', {
            value: 'intercepted',
            writable: false,
          });
        }
        return exchange;
      }),
    };

    fetcher.interceptors.response.use(responseInterceptor);
    mockFetch.mockResolvedValue(new Response('{"data": "test"}'));

    const response = await fetcher.get('/users');

    // Verify interceptor was called
    expect(responseInterceptor.intercept).toHaveBeenCalled();

    // Verify response was modified
    expect((response as any).customProperty).toBe('intercepted');
  });

  it('should apply error interceptors', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Add an error interceptor that modifies the error
    const errorInterceptor: Interceptor = {
      name: 'error-interceptor-1',
      order: 0,
      intercept: vi.fn(async (exchange: FetchExchange) => {
        exchange.error = new Error(`Intercepted: ${exchange.error?.message}`);
        return exchange;
      }),
    };

    fetcher.interceptors.error.use(errorInterceptor);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const promise = fetcher.get('/users');

    await expect(promise).rejects.toThrow('Intercepted: Network error');
    expect(errorInterceptor.intercept).toHaveBeenCalled();
  });

  it('should apply multiple request interceptors in order', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Add multiple request interceptors
    const interceptor1: Interceptor = {
      name: 'multi-request-interceptor-1',
      order: 0,
      intercept: vi.fn((exchange: FetchExchange) => {
        return {
          ...exchange,
          request: {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              'X-Interceptor-1': 'value-1',
            },
          },
        };
      }),
    };

    const interceptor2: Interceptor = {
      name: 'multi-request-interceptor-2',
      order: 0,
      intercept: vi.fn((exchange: FetchExchange) => {
        return {
          ...exchange,
          request: {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              'X-Interceptor-2': 'value-2',
            },
          },
        };
      }),
    };

    fetcher.interceptors.request.use(interceptor1);
    fetcher.interceptors.request.use(interceptor2);
    mockFetch.mockResolvedValue(new Response('OK'));

    await fetcher.get('/users');

    // Verify both interceptors were called
    expect(interceptor1.intercept).toHaveBeenCalled();
    expect(interceptor2.intercept).toHaveBeenCalled();

    // Verify fetch was called with headers from both interceptors
    const callArgs = mockFetch.mock.calls[0];
    const fetchInit = callArgs[1];
    expect(fetchInit.headers).toHaveProperty('X-Interceptor-1', 'value-1');
    expect(fetchInit.headers).toHaveProperty('X-Interceptor-2', 'value-2');
  });

  it('should handle async interceptors', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Add an async request interceptor
    const asyncInterceptor: Interceptor = {
      name: 'async-interceptor-1',
      order: 0,
      intercept: vi.fn((exchange: FetchExchange) => {
        return Promise.resolve({
          ...exchange,
          request: {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              'X-Async-Header': 'async-value',
            },
          },
        });
      }),
    };

    fetcher.interceptors.request.use(asyncInterceptor);
    mockFetch.mockResolvedValue(new Response('OK'));

    await fetcher.get('/users');

    // Verify async interceptor was called
    expect(asyncInterceptor.intercept).toHaveBeenCalled();

    // Verify fetch was called with modified request
    const callArgs = mockFetch.mock.calls[0];
    const fetchInit = callArgs[1];
    expect(fetchInit.headers).toHaveProperty('X-Async-Header', 'async-value');
  });

  it('should skip ejected interceptors', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Add an interceptor and then eject it
    const interceptor: Interceptor = {
      name: 'ejected-interceptor-1',
      order: 0,
      intercept: vi.fn((exchange: FetchExchange) => {
        return {
          ...exchange,
          request: {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              'X-Ejected-Header': 'ejected-value',
            },
          },
        };
      }),
    };

    fetcher.interceptors.request.use(interceptor);
    fetcher.interceptors.request.eject('ejected-interceptor-1');
    mockFetch.mockResolvedValue(new Response('OK'));

    await fetcher.get('/users');

    // Verify interceptor was not called
    expect(interceptor.intercept).not.toHaveBeenCalled();

    // Verify fetch was called without the header
    const callArgs = mockFetch.mock.calls[0];
    const fetchInit = callArgs[1];
    if (fetchInit.headers) {
      expect(fetchInit.headers).not.toHaveProperty('X-Ejected-Header');
    }
  });

  it('should handle interceptor that transforms error to response', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Add an error interceptor that transforms error to response
    const errorInterceptor: Interceptor = {
      name: 'error-to-response-interceptor-1',
      order: 0,
      intercept: vi.fn(async (exchange: FetchExchange) => {
        // Transform the error to a response
        exchange.response = new Response('Error handled by interceptor', {
          status: 200,
        });
        return exchange;
      }),
    };

    fetcher.interceptors.error.use(errorInterceptor);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const response = await fetcher.get('/users');

    // Verify the interceptor was called
    expect(errorInterceptor.intercept).toHaveBeenCalled();

    // Verify we got a response instead of an error
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Error handled by interceptor');
  });

  it('should apply interceptors in the correct order', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Add multiple request interceptors to test order
    const calls: string[] = [];

    fetcher.interceptors.request.use({
      name: 'order-test-interceptor-1',
      order: 0,
      intercept: vi.fn((exchange: FetchExchange) => {
        calls.push('interceptor1');
        return exchange;
      }),
    });

    fetcher.interceptors.request.use({
      name: 'order-test-interceptor-2',
      order: 0,
      intercept: vi.fn((exchange: FetchExchange) => {
        calls.push('interceptor2');
        return exchange;
      }),
    });

    mockFetch.mockResolvedValue(new Response('OK'));
    await fetcher.get('/users');

    // Verify the order of interceptor execution
    expect(calls).toEqual(['interceptor1', 'interceptor2']);
  });
});
