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

import { describe, it, expect, vi } from 'vitest';
import {
  Interceptor,
  InterceptorManager,
  FetcherInterceptors,
  FetchExchange,
} from '../src';
import { HttpMethod } from '../src';
import { Fetcher } from '../src';

describe('interceptor.ts', () => {
  describe('InterceptorManager', () => {
    it('should add interceptor with use method', () => {
      const manager = new InterceptorManager();
      const interceptor: Interceptor = {
        intercept: vi.fn(data => data),
      };

      const index = manager.use(interceptor);
      expect(index).toBe(0);
    });

    it('should eject interceptor by index', () => {
      const manager = new InterceptorManager();
      const interceptor: Interceptor = {
        intercept: vi.fn(data => data),
      };

      const index = manager.use(interceptor);
      expect(manager['interceptors'][index]).toBe(interceptor);

      manager.eject(index);
      expect(manager['interceptors'][index]).toBeNull();
    });

    it('should clear all interceptors', () => {
      const manager = new InterceptorManager();
      const interceptor1: Interceptor = {
        intercept: vi.fn(data => data),
      };
      const interceptor2: Interceptor = {
        intercept: vi.fn(data => data),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      expect(manager['interceptors']).toHaveLength(2);

      manager.clear();
      expect(manager['interceptors']).toHaveLength(0);
    });

    it('should process data through interceptors', async () => {
      const manager = new InterceptorManager();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: undefined,
      };

      const interceptor1: Interceptor = {
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/modified1',
          };
        }),
      };

      const interceptor2: Interceptor = {
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/modified2',
          };
        }),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);

      const result = await manager.intercept(mockExchange);
      expect(result.url).toBe('http://example.com/modified1/modified2');
      expect(interceptor1.intercept).toHaveBeenCalledWith(mockExchange);
      expect(interceptor2.intercept).toHaveBeenCalled();
    });

    it('should skip ejected interceptors', async () => {
      const manager = new InterceptorManager();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: undefined,
      };

      const interceptor1: Interceptor = {
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/modified1',
          };
        }),
      };

      const interceptor2: Interceptor = {
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/modified2',
          };
        }),
      };

      const index = manager.use(interceptor1);
      manager.use(interceptor2);
      manager.eject(index);

      const result = await manager.intercept(mockExchange);
      expect(result.url).toBe('http://example.com/modified2'); // first interceptor was ejected
      expect(interceptor1.intercept).not.toHaveBeenCalled();
      expect(interceptor2.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should handle async interceptors', async () => {
      const manager = new InterceptorManager();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: undefined,
      };

      const interceptor: Interceptor = {
        intercept: vi.fn((exchange: FetchExchange) => {
          return Promise.resolve({
            ...exchange,
            url: exchange.url + '/processed',
          });
        }),
      };

      manager.use(interceptor);

      const result = await manager.intercept(mockExchange);
      expect(result.url).toBe('http://example.com/processed');
      expect(interceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });
  });

  describe('FetcherInterceptors', () => {
    it('should create interceptor managers for request, response and error', () => {
      const interceptors = new FetcherInterceptors();

      expect(interceptors.request).toBeDefined();
      expect(interceptors.response).toBeDefined();
      expect(interceptors.error).toBeDefined();

      expect(interceptors.request).toBeInstanceOf(InterceptorManager);
      expect(interceptors.response).toBeInstanceOf(InterceptorManager);
      expect(interceptors.error).toBeInstanceOf(InterceptorManager);
    });

    it('should allow adding request interceptors', () => {
      const interceptors = new FetcherInterceptors();
      const requestInterceptor: Interceptor = {
        intercept: vi.fn(exchange => exchange),
      };

      const index = interceptors.request.use(requestInterceptor);
      expect(index).toBe(0);
    });

    it('should allow adding response interceptors', () => {
      const interceptors = new FetcherInterceptors();
      const responseInterceptor: Interceptor = {
        intercept: vi.fn(exchange => exchange),
      };

      const index = interceptors.response.use(responseInterceptor);
      expect(index).toBe(0);
    });

    it('should allow adding error interceptors', () => {
      const interceptors = new FetcherInterceptors();
      const errorInterceptor: Interceptor = {
        intercept: vi.fn(exchange => exchange),
      };

      const index = interceptors.error.use(errorInterceptor);
      expect(index).toBe(0);
    });
  });

  describe('Interceptor Types', () => {
    it('should process request interceptors correctly', async () => {
      const interceptors = new FetcherInterceptors();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {
          method: HttpMethod.GET,
          headers: { 'Content-Type': 'application/json' },
        },
        response: undefined,
        error: undefined,
      };

      const requestInterceptor: Interceptor = {
        intercept: vi.fn(exchange => ({
          ...exchange,
          request: {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              Authorization: 'Bearer token',
            },
          },
        })),
      };

      interceptors.request.use(requestInterceptor);
      const processedExchange =
        await interceptors.request.intercept(mockExchange);

      expect(processedExchange.request.headers).toHaveProperty(
        'Authorization',
        'Bearer token',
      );
      expect(requestInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should process response interceptors correctly', async () => {
      const interceptors = new FetcherInterceptors();
      const response = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: response,
        error: undefined,
      };

      const responseInterceptor: Interceptor = {
        intercept: vi.fn(async exchange => {
          // Add a custom header to the response
          if (exchange.response) {
            Object.defineProperty(exchange.response, 'customHeader', {
              value: 'intercepted',
              writable: false,
            });
          }
          return exchange;
        }),
      };

      interceptors.response.use(responseInterceptor);
      const processedExchange =
        await interceptors.response.intercept(mockExchange);

      expect(processedExchange.response).toBe(response);
      expect((processedExchange.response as any).customHeader).toBe(
        'intercepted',
      );
      expect(responseInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should process error interceptors correctly', async () => {
      const interceptors = new FetcherInterceptors();
      const error = new Error('Network error');

      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: error,
      };

      const errorInterceptor: Interceptor = {
        intercept: vi.fn(exchange => {
          exchange.error = new Error(`Intercepted: ${exchange.error?.message}`);
          return exchange;
        }),
      };

      interceptors.error.use(errorInterceptor);
      const processedExchange =
        await interceptors.error.intercept(mockExchange);

      expect(processedExchange.error?.message).toBe(
        'Intercepted: Network error',
      );
      expect(errorInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });
  });
});
