import { describe, it, expect } from 'vitest';

import { resolveTimeout, TimeoutCapable, FetchTimeoutError } from '../src';
import { HttpMethod } from '../src';

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
});
