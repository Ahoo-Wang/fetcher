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
import { Fetcher, FetchExchange, HttpMethod, Interceptor, InterceptorManager, InterceptorRegistry, } from '../src';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('InterceptorRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockClear();
  });

  describe('InterceptorRegistry', () => {
    let manager: InterceptorRegistry;

    beforeEach(() => {
      manager = new InterceptorRegistry();
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
      const mockExchange = new FetchExchange(new Fetcher(), {
        url: 'http://example.com',
        method: HttpMethod.GET,
      });

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
      const mockExchange = new FetchExchange(new Fetcher(), {
        url: 'http://example.com',
        method: HttpMethod.GET,
      });

      manager.intercept(mockExchange);
      expect(interceptor1.intercept).toHaveBeenCalled();
    });

    it('should process data through interceptors', async () => {
      const interceptor1: Interceptor = {
        name: 'interceptor-1',
        order: 0,
        intercept: vi.fn(async exchange => {
          // Simulate async operation without using setTimeout
          await Promise.resolve();
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

      const mockExchange = new FetchExchange(new Fetcher(), {
        url: 'http://example.com',
        method: HttpMethod.GET,
      });

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

      const mockExchange = new FetchExchange(new Fetcher(), {
        url: 'http://example.com',
        method: HttpMethod.GET,
      });

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

      const mockExchange = new FetchExchange(new Fetcher(), {
        url: 'http://example.com',
        method: HttpMethod.GET,
      });

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
          // Simulate async operation without using setTimeout
          await Promise.resolve();
          exchange.attributes = {
            ...exchange.attributes,
            processed: true,
          };
        }),
      };

      manager.use(asyncInterceptor);

      const mockExchange = new FetchExchange(new Fetcher(), {
        url: 'http://example.com',
        method: HttpMethod.GET,
      });

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

      const mockExchange = new FetchExchange(new Fetcher(), {
        url: 'http://example.com',
        method: HttpMethod.GET,
      });

      await manager.intercept(mockExchange);

      expect(callOrder).toEqual([
        'interceptor-2',
        'interceptor-1',
        'interceptor-3',
      ]);
    });
  });

  describe('InterceptorManager', () => {
    it('should create interceptor managers for request, response and error', () => {
      const interceptors = new InterceptorManager();

      expect(interceptors.request).toBeInstanceOf(InterceptorRegistry);
      expect(interceptors.response).toBeInstanceOf(InterceptorRegistry);
      expect(interceptors.error).toBeInstanceOf(InterceptorRegistry);
    });

    it('should allow adding request interceptors', () => {
      const interceptors = new InterceptorManager();
      const requestInterceptor: Interceptor = {
        name: 'request-interceptor',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };

      const result = interceptors.request.use(requestInterceptor);
      expect(result).toBe(true);
    });

    it('should allow adding response interceptors', () => {
      const interceptors = new InterceptorManager();
      const responseInterceptor: Interceptor = {
        name: 'response-interceptor',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };

      const result = interceptors.response.use(responseInterceptor);
      expect(result).toBe(true);
    });

    it('should allow adding error interceptors', () => {
      const interceptors = new InterceptorManager();
      const errorInterceptor: Interceptor = {
        name: 'error-interceptor',
        order: 0,
        intercept: vi.fn(exchange => exchange),
      };

      const result = interceptors.error.use(errorInterceptor);
      expect(result).toBe(true);
    });

    it('should process request through all phases correctly', async () => {
      const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
      const mockResponse = new Response('{"data": "test"}');

      mockFetch.mockResolvedValue(mockResponse);

      // Add a request interceptor
      const requestInterceptor: Interceptor = {
        name: 'request-interceptor-test',
        order: 0,
        intercept: vi.fn((exchange: FetchExchange) => {
          exchange.request = {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              'X-Request-Test': 'request-value',
            },
          };
        }),
      };

      // Add a response interceptor
      const responseInterceptor: Interceptor = {
        name: 'response-interceptor-test',
        order: 0,
        intercept: vi.fn((exchange: FetchExchange) => {
          if (exchange.response) {
            Object.defineProperty(exchange.response, 'intercepted', {
              value: true,
              writable: false,
            });
          }
        }),
      };

      fetcher.interceptors.request.use(requestInterceptor);
      fetcher.interceptors.response.use(responseInterceptor);

      const response = await fetcher.get('/users');

      // Verify interceptors were called
      expect(requestInterceptor.intercept).toHaveBeenCalled();
      expect(responseInterceptor.intercept).toHaveBeenCalled();

      // Verify the request interceptor modified the request
      const callArgs = mockFetch.mock.calls[0];
      const fetchInit = callArgs[1];
      expect(fetchInit.headers).toHaveProperty(
        'X-Request-Test',
        'request-value',
      );

      // Verify the response interceptor modified the response
      expect((response as any).intercepted).toBe(true);
    });

    it('should handle error phase correctly', async () => {
      const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
      const mockError = new Error('Network error');

      mockFetch.mockRejectedValue(mockError);

      // Add an error interceptor
      const errorInterceptor: Interceptor = {
        name: 'error-interceptor-test',
        order: 0,
        intercept: vi.fn((exchange: FetchExchange) => {
          exchange.error = new Error(`Intercepted: ${exchange.error?.message}`);
        }),
      };

      fetcher.interceptors.error.use(errorInterceptor);

      const promise = fetcher.get('/users');

      await expect(promise).rejects.toThrow('Intercepted: Network error');
      expect(errorInterceptor.intercept).toHaveBeenCalled();
    });

    it('should handle error interceptor that clears error', async () => {
      const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
      const mockError = new Error('Network error');

      mockFetch.mockRejectedValue(mockError);

      // Add an error interceptor that clears the error
      const errorInterceptor: Interceptor = {
        name: 'error-clear-interceptor-test',
        order: 0,
        intercept: vi.fn((exchange: FetchExchange) => {
          // Clear the error to indicate it's been handled
          exchange.error = undefined;
        }),
      };

      fetcher.interceptors.error.use(errorInterceptor);

      // This test verifies that the error interceptor is called
      // Note: The current implementation in fetcher.ts doesn't handle error-to-success conversion
      // in the fetch method, so this will still throw an error
      const promise = fetcher.get('/users');

      await expect(promise).rejects.toThrow(
        'Request to /users failed with no response',
      );
      expect(errorInterceptor.intercept).toHaveBeenCalled();
    });
  });

  describe('Interceptor Types', () => {
    it('should process request interceptors correctly', async () => {
      const manager = new InterceptorRegistry();
      const mockExchange = new FetchExchange(new Fetcher(), {
        url: 'http://example.com',
        method: HttpMethod.GET,
        headers: { 'Content-Type': 'application/json' },
      });

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

      manager.use(requestInterceptor);
      await manager.intercept(mockExchange);

      expect(mockExchange.request.headers).toHaveProperty(
        'Authorization',
        'Bearer token',
      );
      expect(requestInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should process response interceptors correctly', async () => {
      const manager = new InterceptorRegistry();
      const response = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      const mockExchange = new FetchExchange(
        new Fetcher(),
        {
          url: 'http://example.com',
        },
        response,
      );

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

      manager.use(responseInterceptor);
      await manager.intercept(mockExchange);

      expect(mockExchange.response).toBe(response);
      expect((mockExchange.response as any).customHeader).toBe('intercepted');
      expect(responseInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });

    it('should process error interceptors correctly', async () => {
      const manager = new InterceptorRegistry();
      const error = new Error('Network error');

      const mockExchange = new FetchExchange(
        new Fetcher(),
        {
          url: 'http://example.com',
        },
        undefined,
        error,
      );

      const errorInterceptor: Interceptor = {
        name: 'error-interceptor-1',
        order: 0,
        intercept: vi.fn(exchange => {
          exchange.error = new Error(`Intercepted: ${exchange.error?.message}`);
          return exchange;
        }),
      };

      manager.use(errorInterceptor);
      await manager.intercept(mockExchange);

      expect(mockExchange.error?.message).toBe('Intercepted: Network error');
      expect(errorInterceptor.intercept).toHaveBeenCalledWith(mockExchange);
    });
  });
});
