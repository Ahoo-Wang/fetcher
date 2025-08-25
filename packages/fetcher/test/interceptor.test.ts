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
import { Fetcher, FetcherInterceptors, FetchExchange, HttpMethod, Interceptor, InterceptorManager } from '../src';

describe('interceptor.ts', () => {
  describe('InterceptorManager', () => {
    it('should initialize with provided interceptors', () => {
      const interceptor1: Interceptor = {
        name: 'init-interceptor-1',
        order: 10,
        intercept: vi.fn(data => data),
      };

      const interceptor2: Interceptor = {
        name: 'init-interceptor-2',
        order: 5,
        intercept: vi.fn(data => data),
      };

      const manager = new InterceptorManager([interceptor1, interceptor2]);
      expect(manager.order).toEqual(Number.MIN_SAFE_INTEGER);
      expect(manager['sortedInterceptors']).toHaveLength(2);
      expect(manager['sortedInterceptors'][0]).toBe(interceptor2); // order 5
      expect(manager['sortedInterceptors'][1]).toBe(interceptor1); // order 10
    });

    it('should add interceptor with use method', () => {
      const manager = new InterceptorManager();
      const interceptor: Interceptor = {
        name: 'test-interceptor-1',
        order: 0,
        intercept: vi.fn(data => data),
      };

      const result = manager.use(interceptor);
      expect(result).toBe(true);
    });

    it('should reject interceptor with duplicate name', () => {
      const manager = new InterceptorManager();
      const interceptor1: Interceptor = {
        name: 'duplicate-name-interceptor',
        order: 0,
        intercept: vi.fn(data => data),
      };

      const interceptor2: Interceptor = {
        name: 'duplicate-name-interceptor',
        order: 10,
        intercept: vi.fn(data => data),
      };

      // Add first interceptor
      const result1 = manager.use(interceptor1);
      expect(result1).toBe(true);

      // Try to add interceptor with same name - should be rejected
      const result2 = manager.use(interceptor2);
      expect(result2).toBe(false);

      // Should still have only one interceptor
      expect(manager['sortedInterceptors']).toHaveLength(1);
      expect(manager['sortedInterceptors'][0]).toBe(interceptor1);
    });

    it('should eject interceptor by name', () => {
      const manager = new InterceptorManager();
      const interceptor: Interceptor = {
        name: 'test-interceptor-2',
        order: 0,
        intercept: vi.fn(data => data),
      };

      manager.use(interceptor);

      manager.eject('test-interceptor-2');
      expect(manager['sortedInterceptors'].length).toBe(0);
    });

    it('should clear all interceptors', () => {
      const manager = new InterceptorManager();
      const interceptor1: Interceptor = {
        name: 'test-interceptor-3',
        order: 0,
        intercept: vi.fn(data => data),
      };
      const interceptor2: Interceptor = {
        name: 'test-interceptor-4',
        order: 0,
        intercept: vi.fn(data => data),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      expect(manager['sortedInterceptors']).toHaveLength(2);

      manager.clear();
      expect(manager['sortedInterceptors']).toHaveLength(0);
    });

    it('should process data through interceptors', async () => {
      const manager = new InterceptorManager();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: undefined,
        attributes: {},
      };

      const interceptor1: Interceptor = {
        name: 'test-interceptor-5',
        order: 0,
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/modified1',
          };
        }),
      };

      const interceptor2: Interceptor = {
        name: 'test-interceptor-6',
        order: 0,
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
        attributes: {},
      };

      const interceptor1: Interceptor = {
        name: 'test-interceptor-7',
        order: 0,
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/modified1',
          };
        }),
      };

      const interceptor2: Interceptor = {
        name: 'test-interceptor-8',
        order: 0,
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/modified2',
          };
        }),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      manager.eject('test-interceptor-8');

      const result = await manager.intercept(mockExchange);
      expect(result.url).toBe('http://example.com/modified1'); // second interceptor was ejected
      expect(interceptor1.intercept).toHaveBeenCalledWith(mockExchange);
      expect(interceptor2.intercept).not.toHaveBeenCalled();
    });

    it('should handle ejecting interceptor by name when multiple interceptors exist', async () => {
      const manager = new InterceptorManager();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: undefined,
        attributes: {},
      };

      const interceptor1: Interceptor = {
        name: 'test-interceptor-9',
        order: 0,
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/first',
          };
        }),
      };

      const interceptor2: Interceptor = {
        name: 'test-interceptor-10',
        order: 0,
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/second',
          };
        }),
      };

      const interceptor3: Interceptor = {
        name: 'test-interceptor-11',
        order: 0,
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/third',
          };
        }),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      manager.use(interceptor3);
      manager.eject('test-interceptor-10');

      const result = await manager.intercept(mockExchange);
      expect(result.url).toBe('http://example.com/first/third'); // second interceptor was ejected
      expect(interceptor1.intercept).toHaveBeenCalledWith(mockExchange);
      expect(interceptor2.intercept).not.toHaveBeenCalled();
      expect(interceptor3.intercept).toHaveBeenCalled();
    });

    it('should handle async interceptors', async () => {
      const manager = new InterceptorManager();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: undefined,
        attributes: {},
      };

      const interceptor: Interceptor = {
        name: 'test-interceptor-9',
        order: 0,
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

    it('should execute interceptors in order', async () => {
      const manager = new InterceptorManager();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: undefined,
        attributes: {},
      };

      const interceptor1: Interceptor = {
        name: 'test-interceptor-10',
        order: 10,
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/second',
          };
        }),
      };

      const interceptor2: Interceptor = {
        name: 'test-interceptor-11',
        order: 5,
        intercept: vi.fn(exchange => {
          return {
            ...exchange,
            url: exchange.url + '/first',
          };
        }),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);

      const result = await manager.intercept(mockExchange);
      expect(result.url).toBe('http://example.com/first/second');
      expect(interceptor2.intercept).toHaveBeenCalledWith(mockExchange);
      expect(interceptor1.intercept).toHaveBeenCalled();
    });

    it('should eject interceptor by name', () => {
      const manager = new InterceptorManager();
      const interceptor: Interceptor = {
        name: 'test-interceptor-to-eject',
        order: 0,
        intercept: vi.fn(data => data),
      };

      manager.use(interceptor);

      manager.eject('test-interceptor-to-eject');
      expect(manager['sortedInterceptors'].length).toBe(0);
    });

    it('should execute interceptors in order', async () => {
      const manager = new InterceptorManager();
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        url: 'http://example.com',
        request: {},
        response: undefined,
        error: undefined,
        attributes: {},
      };

      const calls: string[] = [];

      const interceptor1: Interceptor = {
        name: 'ordered-interceptor-1',
        order: 10,
        intercept: vi.fn(exchange => {
          calls.push('interceptor1');
          return exchange;
        }),
      };

      const interceptor2: Interceptor = {
        name: 'ordered-interceptor-2',
        order: 5,
        intercept: vi.fn(exchange => {
          calls.push('interceptor2');
          return exchange;
        }),
      };

      const interceptor3: Interceptor = {
        name: 'ordered-interceptor-3',
        order: 15,
        intercept: vi.fn(exchange => {
          calls.push('interceptor3');
          return exchange;
        }),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      manager.use(interceptor3);

      await manager.intercept(mockExchange);

      // Should execute in order: interceptor2 (order 5), interceptor1 (order 10), interceptor3 (order 15)
      expect(calls).toEqual(['interceptor2', 'interceptor1', 'interceptor3']);
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
        name: 'request-interceptor',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };

      const result = interceptors.request.use(requestInterceptor);
      expect(result).toBe(true);
    });

    it('should allow adding response interceptors', () => {
      const interceptors = new FetcherInterceptors();
      const responseInterceptor: Interceptor = {
        name: 'response-interceptor',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };

      const result = interceptors.response.use(responseInterceptor);
      expect(result).toBe(true);
    });

    it('should allow adding error interceptors', () => {
      const interceptors = new FetcherInterceptors();
      const errorInterceptor: Interceptor = {
        name: 'error-interceptor',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };

      const result = interceptors.error.use(errorInterceptor);
      expect(result).toBe(true);
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
        attributes: {},
      };

      const requestInterceptor: Interceptor = {
        name: 'request-interceptor-1',
        order: 0,
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
        attributes: {},
      };

      const responseInterceptor: Interceptor = {
        name: 'response-interceptor-1',
        order: 0,
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
        attributes: {},
      };

      const errorInterceptor: Interceptor = {
        name: 'error-interceptor-1',
        order: 0,
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
