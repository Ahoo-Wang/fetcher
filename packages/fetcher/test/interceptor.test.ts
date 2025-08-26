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

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Fetcher, FetcherInterceptors, FetchExchange, HttpMethod, Interceptor, InterceptorManager } from '../src';

describe('interceptor.ts', () => {
  describe('InterceptorManager', () => {
    let manager: InterceptorManager;

    beforeEach(() => {
      manager = new InterceptorManager();
    });

    it('should have correct order value', () => {
      expect(manager.order).toBe(Number.MIN_SAFE_INTEGER);
    });

    it('should add interceptor with use method', () => {
      const interceptor: Interceptor = {
        name: 'test-interceptor',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };

      const result = manager.use(interceptor);

      expect(result).toBe(true);

      // Test indirectly by checking if the interceptor is called
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        request: {
          url: 'http://example.com',
          method: HttpMethod.GET,
        },
        response: undefined,
        error: undefined,
        attributes: {},
      };

      manager.intercept(mockExchange);
      expect(interceptor.intercept).toHaveBeenCalled();
    });

    it('should reject interceptor with duplicate name', () => {
      const interceptor1: Interceptor = {
        name: 'duplicate-interceptor',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };
      const interceptor2: Interceptor = {
        name: 'duplicate-interceptor',
        order: 1,
        intercept: vi.fn(exchange => exchange),
      };

      const result1 = manager.use(interceptor1);
      const result2 = manager.use(interceptor2);

      expect(result1).toBe(true);
      expect(result2).toBe(false);

      // Test that only the first interceptor is called
      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        request: {
          url: 'http://example.com',
          method: HttpMethod.GET,
        },
        response: undefined,
        error: undefined,
        attributes: {},
      };

      manager.intercept(mockExchange);
      expect(interceptor1.intercept).toHaveBeenCalled();
    });

    it('should process data through interceptors', async () => {
      const interceptor1: Interceptor = {
        name: 'interceptor-1',
        order: 0,
        intercept: vi.fn(async exchange => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return exchange;
        }),
      };
      const interceptor2: Interceptor = {
        name: 'interceptor-2',
        order: 1,
        intercept: vi.fn(exchange => exchange),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);

      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        request: {
          url: 'http://example.com',
          method: HttpMethod.GET,
        },
        response: undefined,
        error: undefined,
        attributes: {},
      };

      await manager.intercept(mockExchange);

      expect(mockExchange).toBe(mockExchange);
      expect(interceptor1.intercept).toHaveBeenCalledWith(mockExchange);
      expect(interceptor2.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should skip ejected interceptors', async () => {
      const interceptor1: Interceptor = {
        name: 'interceptor-1',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };
      const interceptor2: Interceptor = {
        name: 'interceptor-2',
        order: 1,
        intercept: vi.fn(exchange => exchange),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      manager.eject('interceptor-1');

      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        request: {
          url: 'http://example.com',
          method: HttpMethod.GET,
        },
        response: undefined,
        error: undefined,
        attributes: {},
      };

      await manager.intercept(mockExchange);

      expect(mockExchange).toBe(mockExchange);
      expect(interceptor1.intercept).not.toHaveBeenCalled();
      expect(interceptor2.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should clear all interceptors', async () => {
      const interceptor1: Interceptor = {
        name: 'interceptor-1',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };
      const interceptor2: Interceptor = {
        name: 'interceptor-2',
        order: 1,
        intercept: vi.fn(exchange => exchange),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      manager.clear();

      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        request: {
          url: 'http://example.com',
          method: HttpMethod.GET,
        },
        response: undefined,
        error: undefined,
        attributes: {},
      };

      await manager.intercept(mockExchange);

      expect(mockExchange).toBe(mockExchange);
      expect(interceptor1.intercept).not.toHaveBeenCalled();
      expect(interceptor2.intercept).not.toHaveBeenCalled();
    });

    it('should handle async interceptors', async () => {
      const asyncInterceptor: Interceptor = {
        name: 'async-interceptor',
        order: 0,
        intercept: vi.fn(async exchange => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 10));
          exchange.attributes = {
            ...exchange.attributes,
            processed: true,
          };
        }),
      };

      manager.use(asyncInterceptor);

      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        request: {
          url: 'http://example.com',
          method: HttpMethod.GET,
        },
        response: undefined,
        error: undefined,
        attributes: {},
      };

      await manager.intercept(mockExchange);

      expect(mockExchange.attributes?.processed).toBe(true);
      expect(asyncInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should execute interceptors in order', async () => {
      const callOrder: string[] = [];

      const interceptor1: Interceptor = {
        name: 'interceptor-1',
        order: 1,
        intercept: vi.fn(async exchange => {
          callOrder.push('interceptor-1');
          return exchange;
        }),
      };

      const interceptor2: Interceptor = {
        name: 'interceptor-2',
        order: 0,
        intercept: vi.fn(async exchange => {
          callOrder.push('interceptor-2');
          return exchange;
        }),
      };

      const interceptor3: Interceptor = {
        name: 'interceptor-3',
        order: 2,
        intercept: vi.fn(async exchange => {
          callOrder.push('interceptor-3');
          return exchange;
        }),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      manager.use(interceptor3);

      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        request: {
          url: 'http://example.com',
          method: HttpMethod.GET,
        },
        response: undefined,
        error: undefined,
        attributes: {},
      };

      await manager.intercept(mockExchange);

      expect(callOrder).toEqual([
        'interceptor-2',
        'interceptor-1',
        'interceptor-3',
      ]);
    });
  });

  describe('FetcherInterceptors', () => {
    it('should create interceptor managers for request, response and error', () => {
      const interceptors = new FetcherInterceptors();

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
        request: {
          url: 'http://example.com',
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
        intercept: vi.fn(exchange => {
          exchange.request = {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              Authorization: 'Bearer token',
            },
          };
        }),
      };

      interceptors.request.use(requestInterceptor);
      await interceptors.request.intercept(mockExchange);

      expect(mockExchange.request.headers).toHaveProperty(
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
        request: {
          url: 'http://example.com',
        },
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
      await interceptors.response.intercept(mockExchange);

      expect(mockExchange.response).toBe(response);
      expect((mockExchange.response as any).customHeader).toBe('intercepted');
      expect(responseInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should process error interceptors correctly', async () => {
      const interceptors = new FetcherInterceptors();
      const error = new Error('Network error');

      const mockExchange: FetchExchange = {
        fetcher: new Fetcher(),
        request: {
          url: 'http://example.com',
        },
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
      await interceptors.error.intercept(mockExchange);

      expect(mockExchange.error?.message).toBe('Intercepted: Network error');
      expect(errorInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });
  });
});
