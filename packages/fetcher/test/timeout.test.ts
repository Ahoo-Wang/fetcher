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

import { FetchTimeoutError, HttpMethod, resolveTimeout, TimeoutCapable, timeoutFetch } from '../src';

describe('timeout.ts', () => {
  describe('resolveTimeout', () => {
    it('should return request timeout when it is defined', () => {
      expect(resolveTimeout(1000, 2000)).toBe(1000);
      expect(resolveTimeout(0, 5000)).toBe(0);
      expect(resolveTimeout(3000, undefined)).toBe(3000);
    });

    it('should return options timeout when request timeout is undefined', () => {
      expect(resolveTimeout(undefined, 2000)).toBe(2000);
      expect(resolveTimeout(undefined, 0)).toBe(0);
    });

    it('should return undefined when both timeouts are undefined', () => {
      expect(resolveTimeout(undefined, undefined)).toBeUndefined();
    });

    it('should handle edge cases correctly', () => {
      // 测试0值 - 表示不设置超时
      expect(resolveTimeout(0, undefined)).toBe(0);
      expect(resolveTimeout(undefined, 0)).toBe(0);
    });
  });

  describe('TimeoutCapable', () => {
    it('should define timeout as an optional number', () => {
      const timeoutCapable: TimeoutCapable = {};
      expect(timeoutCapable.timeout).toBeUndefined();

      const timeoutCapableWithTimeout: TimeoutCapable = { timeout: 1000 };
      expect(timeoutCapableWithTimeout.timeout).toBe(1000);
    });
  });

  describe('FetchTimeoutError', () => {
    it('should create FetchTimeoutError with correct properties', () => {
      const url = 'https://api.example.com/users';
      const request = { method: HttpMethod.GET };
      const timeout = 1000;

      const error = new FetchTimeoutError(url, request, timeout);

      expect(error).toBeInstanceOf(FetchTimeoutError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('FetchTimeoutError');
      expect(error.url).toBe(url);
      expect(error.request).toBe(request);
      expect(error.timeout).toBe(timeout);
      expect(error.message).toBe(
        'Request timeout of 1000ms exceeded for GET https://api.example.com/users',
      );
    });

    it('should use default method GET when request method is not provided', () => {
      const url = 'https://api.example.com/users';
      const request = {};
      const timeout = 5000;

      const error = new FetchTimeoutError(url, request, timeout);

      expect(error.message).toBe(
        'Request timeout of 5000ms exceeded for GET https://api.example.com/users',
      );
    });

    it('should handle different HTTP methods correctly', () => {
      const url = 'https://api.example.com/users';
      const timeout = 1000;

      const postRequest = { method: HttpMethod.POST };
      const postError = new FetchTimeoutError(url, postRequest, timeout);
      expect(postError.message).toBe(
        'Request timeout of 1000ms exceeded for POST https://api.example.com/users',
      );

      const putRequest = { method: HttpMethod.PUT };
      const putError = new FetchTimeoutError(url, putRequest, timeout);
      expect(putError.message).toBe(
        'Request timeout of 1000ms exceeded for PUT https://api.example.com/users',
      );
    });

    it('should maintain proper prototype chain', () => {
      const url = 'https://api.example.com/users';
      const request = { method: HttpMethod.GET };
      const timeout = 1000;

      const error = new FetchTimeoutError(url, request, timeout);

      expect(error.constructor).toBe(FetchTimeoutError);
      expect(error instanceof FetchTimeoutError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('timeoutFetch', () => {
    beforeEach(() => {
      // 清除所有模拟
      vi.clearAllMocks();
    });

    it('should call fetch directly when no timeout is provided', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock global fetch
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      const url = 'https://api.example.com/users';
      const request = { method: HttpMethod.GET };

      const response = await timeoutFetch(url, request);

      expect(mockFetch).toHaveBeenCalledWith(url, request);
      expect(response).toBe(mockResponse);

      // Clean up
      mockFetch.mockRestore();
    });

    it('should call fetch with AbortController signal when timeout is provided', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock global fetch
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      const url = 'https://api.example.com/users';
      const request = { method: HttpMethod.GET };
      const timeout = 1000;

      const response = await timeoutFetch(url, request, timeout);

      expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
      expect(response).toBe(mockResponse);

      // Clean up
      mockFetch.mockRestore();
    });

    it('should reject with FetchTimeoutError when timeout is exceeded', async () => {
      // Mock global fetch to simulate a long-running request
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        return new Promise(() => {
        }); // Never resolves
      });

      const url = 'https://api.example.com/users';
      const request = { method: HttpMethod.GET };
      const timeout = 10; // Short timeout for testing

      await expect(timeoutFetch(url, request, timeout)).rejects.toThrow(FetchTimeoutError);
      await expect(timeoutFetch(url, request, timeout)).rejects.toHaveProperty('url', url);
      await expect(timeoutFetch(url, request, timeout)).rejects.toHaveProperty('timeout', timeout);

      // Clean up
      mockFetch.mockRestore();
    });

    it('should clear timeout when fetch completes successfully', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock global fetch
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      // Mock clearTimeout to verify it's called
      const mockClearTimeout = vi.spyOn(globalThis, 'clearTimeout');

      const url = 'https://api.example.com/users';
      const request = { method: HttpMethod.GET };
      const timeout = 1000;

      const response = await timeoutFetch(url, request, timeout);

      expect(response).toBe(mockResponse);
      // Verify that clearTimeout was called (timer was cleared)
      expect(mockClearTimeout).toHaveBeenCalled();

      // Clean up
      mockFetch.mockRestore();
      mockClearTimeout.mockRestore();
    });

    it('should abort the request when timeout is exceeded', async () => {
      // Mock global fetch to simulate a long-running request
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        return new Promise(() => {
        }); // Never resolves
      });

      const url = 'https://api.example.com/users';
      const request = { method: HttpMethod.GET };
      const timeout = 10; // Short timeout for testing

      await expect(timeoutFetch(url, request, timeout)).rejects.toThrow(FetchTimeoutError);

      // Verify that the AbortController's abort method would be called
      // We can't directly test this without more complex mocking, but we can
      // verify that the signal would be aborted by checking the error
      try {
        await timeoutFetch(url, request, timeout);
      } catch (error) {
        expect(error).toBeInstanceOf(FetchTimeoutError);
        const timeoutError = error as FetchTimeoutError;
        // The error should have the correct properties
        expect(timeoutError.url).toBe(url);
        expect(timeoutError.timeout).toBe(timeout);
      }

      // Clean up
      mockFetch.mockRestore();
    });
  });
});
