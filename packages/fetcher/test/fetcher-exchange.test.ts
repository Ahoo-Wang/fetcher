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

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Fetcher, FetchExchange, Interceptor, InterceptorManager } from '../src';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Fetcher - exchange', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockClear();
  });

  it('should process exchange through interceptor chain successfully', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Create custom interceptor managers
    const requestManager = new InterceptorManager();
    const responseManager = new InterceptorManager();

    // Mock interceptors
    const requestInterceptor: Interceptor = {
      name: 'RequestInterceptor',
      order: 0,
      async intercept(exchange: FetchExchange): Promise<FetchExchange> {
        // Modify the exchange in the request interceptor
        exchange.attributes = exchange.attributes || {};
        exchange.attributes.requestModified = true;
        return exchange;
      },
    };

    const responseInterceptor: Interceptor = {
      name: 'ResponseInterceptor',
      order: 0,
      async intercept(exchange: FetchExchange): Promise<FetchExchange> {
        // Create a mock response
        exchange.response = new Response('OK');
        exchange.attributes = exchange.attributes || {};
        exchange.attributes.responseModified = true;
        return exchange;
      },
    };

    // Add interceptors to managers
    requestManager.use(requestInterceptor);
    responseManager.use(responseInterceptor);

    // Replace interceptors
    fetcher.interceptors.request = requestManager;
    fetcher.interceptors.response = responseManager;

    const exchange: FetchExchange = {
      fetcher,
      request: { url: '/test', method: 'GET' },
      response: undefined,
      error: undefined,
      attributes: {},
    };

    const result = await fetcher.exchange(exchange);

    // Verify the exchange was processed through interceptors
    expect(result).toBeDefined();
    expect(result.attributes).toBeDefined();
    expect(result.attributes?.requestModified).toBe(true);
    expect(result.attributes?.responseModified).toBe(true);
    expect(result.response).toBeInstanceOf(Response);
  });

  it('should handle error in exchange and apply error interceptors', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Create custom interceptor managers
    const requestManager = new InterceptorManager();
    const errorManager = new InterceptorManager();

    // Mock interceptors
    const requestInterceptor: Interceptor = {
      name: 'RequestInterceptor',
      order: 0,
      async intercept(_exchange: FetchExchange): Promise<FetchExchange> {
        // Throw an error to trigger error interceptor
        throw new Error('Request failed');
      },
    };

    const errorInterceptor: Interceptor = {
      name: 'ErrorInterceptor',
      order: 0,
      async intercept(exchange: FetchExchange): Promise<FetchExchange> {
        // Handle the error and create a response
        exchange.response = new Response('Error handled', { status: 500 });
        return exchange;
      },
    };

    // Add interceptors to managers
    requestManager.use(requestInterceptor);
    errorManager.use(errorInterceptor);

    // Replace interceptors
    fetcher.interceptors.request = requestManager;
    fetcher.interceptors.error = errorManager;

    const exchange: FetchExchange = {
      fetcher,
      request: { url: '/test', method: 'GET' },
      response: undefined,
      error: undefined,
      attributes: {},
    };

    const result = await fetcher.exchange(exchange);

    // Verify the error was handled and response was created
    expect(result).toBeDefined();
    expect(result.response).toBeInstanceOf(Response);
    expect(result.response?.status).toBe(500);
  });

  it('should rethrow error when error interceptor does not produce response', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Create custom interceptor managers
    const requestManager = new InterceptorManager();
    const errorManager = new InterceptorManager();

    // Mock interceptors
    const requestInterceptor: Interceptor = {
      name: 'RequestInterceptor',
      order: 0,
      //@typescript-eslint/no-unused-vars
      async intercept(_exchange: FetchExchange): Promise<FetchExchange> {
        // Throw an error to trigger error interceptor
        throw new Error('Request failed');
      },
    };

    const errorInterceptor: Interceptor = {
      name: 'ErrorInterceptor',
      order: 0,
      async intercept(exchange: FetchExchange): Promise<FetchExchange> {
        // Just rethrow the error without creating a response
        throw exchange.error;
      },
    };

    // Add interceptors to managers
    requestManager.use(requestInterceptor);
    errorManager.use(errorInterceptor);

    // Replace interceptors
    fetcher.interceptors.request = requestManager;
    fetcher.interceptors.error = errorManager;

    const exchange: FetchExchange = {
      fetcher,
      request: { url: '/test', method: 'GET' },
      response: undefined,
      error: undefined,
      attributes: {},
    };

    // Verify the error is rethrown
    await expect(fetcher.exchange(exchange)).rejects.toThrow('Request failed');
  });
});
