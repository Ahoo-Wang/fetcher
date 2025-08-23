import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fetcher } from '../src';
import {
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from '../src';

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
    const requestInterceptor: RequestInterceptor = {
      intercept: vi.fn(request => {
        return {
          ...request,
          headers: {
            ...request.headers,
            'X-Test-Header': 'test-value',
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
    const responseInterceptor: ResponseInterceptor = {
      intercept: vi.fn(async response => {
        // Add a custom property to the response
        Object.defineProperty(response, 'customProperty', {
          value: 'intercepted',
          writable: false,
        });
        return response;
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
    const errorInterceptor: ErrorInterceptor = {
      intercept: vi.fn(async error => {
        return new Error(`Intercepted: ${error.message}`);
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
    const interceptor1: RequestInterceptor = {
      intercept: vi.fn(request => {
        return {
          ...request,
          headers: {
            ...request.headers,
            'X-Interceptor-1': 'value-1',
          },
        };
      }),
    };

    const interceptor2: RequestInterceptor = {
      intercept: vi.fn(request => {
        return {
          ...request,
          headers: {
            ...request.headers,
            'X-Interceptor-2': 'value-2',
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
    const asyncInterceptor: RequestInterceptor = {
      intercept: vi.fn(request => {
        return Promise.resolve({
          ...request,
          headers: {
            ...request.headers,
            'X-Async-Header': 'async-value',
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
    const interceptor: RequestInterceptor = {
      intercept: vi.fn(request => {
        return {
          ...request,
          headers: {
            ...request.headers,
            'X-Ejected-Header': 'ejected-value',
          },
        };
      }),
    };

    const index = fetcher.interceptors.request.use(interceptor);
    fetcher.interceptors.request.eject(index);
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
});
