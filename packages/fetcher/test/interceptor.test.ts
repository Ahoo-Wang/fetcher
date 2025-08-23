import { describe, it, expect, vi } from 'vitest';
import {
  Interceptor,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorManager,
  FetcherInterceptors,
} from '../src';
import { FetcherRequest } from '../src';
import { HttpMethod } from '../src';

describe('interceptor.ts', () => {
  describe('InterceptorManager', () => {
    it('should add interceptor with use method', () => {
      const manager = new InterceptorManager<any, Interceptor<any>>();
      const interceptor: Interceptor<any> = {
        intercept: vi.fn(data => data),
      };

      const index = manager.use(interceptor);
      expect(index).toBe(0);
    });

    it('should eject interceptor by index', () => {
      const manager = new InterceptorManager<any, Interceptor<any>>();
      const interceptor: Interceptor<any> = {
        intercept: vi.fn(data => data),
      };

      const index = manager.use(interceptor);
      expect(manager['interceptors'][index]).toBe(interceptor);

      manager.eject(index);
      expect(manager['interceptors'][index]).toBeNull();
    });

    it('should clear all interceptors', () => {
      const manager = new InterceptorManager<any, Interceptor<any>>();
      const interceptor1: Interceptor<any> = {
        intercept: vi.fn(data => data),
      };
      const interceptor2: Interceptor<any> = {
        intercept: vi.fn(data => data),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);
      expect(manager['interceptors']).toHaveLength(2);

      manager.clear();
      expect(manager['interceptors']).toHaveLength(0);
    });

    it('should process data through interceptors', async () => {
      const manager = new InterceptorManager<number, Interceptor<number>>();
      const interceptor1: Interceptor<number> = {
        intercept: vi.fn(data => data + 1),
      };
      const interceptor2: Interceptor<number> = {
        intercept: vi.fn(data => data * 2),
      };

      manager.use(interceptor1);
      manager.use(interceptor2);

      const result = await manager.intercept(5);
      expect(result).toBe(12); // (5 + 1) * 2 = 12
      expect(interceptor1.intercept).toHaveBeenCalledWith(5);
      expect(interceptor2.intercept).toHaveBeenCalledWith(6);
    });

    it('should skip ejected interceptors', async () => {
      const manager = new InterceptorManager<number, Interceptor<number>>();
      const interceptor1: Interceptor<number> = {
        intercept: vi.fn(data => data + 1),
      };
      const interceptor2: Interceptor<number> = {
        intercept: vi.fn(data => data * 2),
      };

      const index = manager.use(interceptor1);
      manager.use(interceptor2);
      manager.eject(index);

      const result = await manager.intercept(5);
      expect(result).toBe(10); // 5 * 2 = 10 (first interceptor was ejected)
      expect(interceptor1.intercept).not.toHaveBeenCalled();
      expect(interceptor2.intercept).toHaveBeenCalledWith(5);
    });

    it('should handle async interceptors', async () => {
      const manager = new InterceptorManager<string, Interceptor<string>>();
      const interceptor: Interceptor<string> = {
        intercept: vi.fn((data: string) => {
          return Promise.resolve(data + ' processed');
        }),
      };

      manager.use(interceptor);

      const result = await manager.intercept('test');
      expect(result).toBe('test processed');
      expect(interceptor.intercept).toHaveBeenCalledWith('test');
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
      const requestInterceptor: RequestInterceptor = {
        intercept: vi.fn(request => request),
      };

      const index = interceptors.request.use(requestInterceptor);
      expect(index).toBe(0);
    });

    it('should allow adding response interceptors', () => {
      const interceptors = new FetcherInterceptors();
      const responseInterceptor: ResponseInterceptor = {
        intercept: vi.fn(response => response),
      };

      const index = interceptors.response.use(responseInterceptor);
      expect(index).toBe(0);
    });

    it('should allow adding error interceptors', () => {
      const interceptors = new FetcherInterceptors();
      const errorInterceptor: ErrorInterceptor = {
        intercept: vi.fn(error => error),
      };

      const index = interceptors.error.use(errorInterceptor);
      expect(index).toBe(0);
    });
  });

  describe('Interceptor Types', () => {
    it('should process request interceptors correctly', async () => {
      const interceptors = new FetcherInterceptors();
      const request: FetcherRequest = {
        method: HttpMethod.GET,
        headers: { 'Content-Type': 'application/json' },
      };

      const requestInterceptor: RequestInterceptor = {
        intercept: vi.fn(req => ({
          ...req,
          headers: {
            ...req.headers,
            Authorization: 'Bearer token',
          },
        })),
      };

      interceptors.request.use(requestInterceptor);
      const processedRequest = await interceptors.request.intercept(request);

      expect(processedRequest.headers).toHaveProperty(
        'Authorization',
        'Bearer token',
      );
      expect(requestInterceptor.intercept).toHaveBeenCalledWith(request);
    });

    it('should process response interceptors correctly', async () => {
      const interceptors = new FetcherInterceptors();
      const response = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      const responseInterceptor: ResponseInterceptor = {
        intercept: vi.fn(async res => {
          // Add a custom header to the response
          Object.defineProperty(res, 'customHeader', {
            value: 'intercepted',
            writable: false,
          });
          return res;
        }),
      };

      interceptors.response.use(responseInterceptor);
      const processedResponse = await interceptors.response.intercept(response);

      expect(processedResponse).toBe(response);
      expect((processedResponse as any).customHeader).toBe('intercepted');
      expect(responseInterceptor.intercept).toHaveBeenCalledWith(response);
    });

    it('should process error interceptors correctly', async () => {
      const interceptors = new FetcherInterceptors();
      const error = new Error('Network error');

      const errorInterceptor: ErrorInterceptor = {
        intercept: vi.fn(err => {
          return new Error(`Intercepted: ${err.message}`);
        }),
      };

      interceptors.error.use(errorInterceptor);
      const processedError = await interceptors.error.intercept(error);

      expect(processedError.message).toBe('Intercepted: Network error');
      expect(errorInterceptor.intercept).toHaveBeenCalledWith(error);
    });
  });
});
