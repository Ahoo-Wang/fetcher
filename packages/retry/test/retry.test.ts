import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  retry,
  createRetryInterceptor,
  createBackoffStrategy,
  RetriesExhaustedError,
  FixedDelayStrategy,
  ExponentialBackoffStrategy,
  LinearBackoffStrategy,
} from '../src/retry';

const createRetryableError = (message: string) => {
  const error = new Error(message) as any;
  error.isRetryable = true;
  return error;
};

describe('retry', () => {
  describe('retry function', () => {
    it('should return result when function succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw RetriesExhaustedError when maxAttempts is 1', async () => {
      const fn = vi.fn().mockRejectedValue(createRetryableError('fail'));

      await expect(retry(fn, { maxAttempts: 1 })).rejects.toThrow(RetriesExhaustedError);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry when shouldRetry returns false', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('never retry'));
      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(retry(fn, { shouldRetry, maxAttempts: 3 })).rejects.toThrow(RetriesExhaustedError);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry when shouldRetry returns true', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce('success');
      const shouldRetry = vi.fn().mockReturnValue(true);

      const result = await retry(fn, { shouldRetry, maxAttempts: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback on retry', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(createRetryableError('fail 1'))
        .mockResolvedValueOnce('success');
      const onRetry = vi.fn();

      const result = await retry(fn, { onRetry, maxAttempts: 3, baseDelay: 0 });

      expect(result).toBe('success');
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });
  });

  describe('createBackoffStrategy', () => {
    it('should create FixedDelayStrategy', () => {
      const strategy = createBackoffStrategy('fixed');
      expect(strategy).toBeInstanceOf(FixedDelayStrategy);
    });

    it('should create ExponentialBackoffStrategy', () => {
      const strategy = createBackoffStrategy('exponential');
      expect(strategy).toBeInstanceOf(ExponentialBackoffStrategy);
    });

    it('should create LinearBackoffStrategy', () => {
      const strategy = createBackoffStrategy('linear');
      expect(strategy).toBeInstanceOf(LinearBackoffStrategy);
    });

    it('should return default strategy for unknown type', () => {
      const strategy = createBackoffStrategy('unknown' as any);
      expect(strategy).toBeInstanceOf(ExponentialBackoffStrategy);
    });
  });

  describe('createRetryInterceptor', () => {
    it('should create an interceptor with correct properties', () => {
      const interceptor = createRetryInterceptor();

      expect(interceptor.name).toBe('RetryInterceptor');
      expect(interceptor.order).toBe(100);
    });

    it('should pass through when there is no error', async () => {
      const interceptor = createRetryInterceptor();
      const exchange = {
        error: undefined,
        response: new Response(),
        request: new Request('http://test.com'),
      } as any;

      await interceptor.intercept(exchange);

      expect(exchange.response).toBeDefined();
    });

    it('should pass through when max retries exhausted', async () => {
      const interceptor = createRetryInterceptor({ maxAttempts: 2 });
      const exchange = {
        error: new Error('test error'),
        response: undefined,
        request: new Request('http://test.com'),
      } as any;

      await interceptor.intercept(exchange);

      expect(exchange.error).toBeDefined();
    });
  });
});
