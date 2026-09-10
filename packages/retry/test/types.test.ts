import { describe, it, expect } from 'vitest';
import {
  isRetryableError,
  DEFAULT_RETRY_STATUS_CODES,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_BASE_DELAY,
  DEFAULT_MAX_DELAY,
} from '../src/types';

describe('types', () => {
  describe('isRetryableError', () => {
    it('should return false for null or undefined', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isRetryableError('error')).toBe(false);
      expect(isRetryableError(123)).toBe(false);
      expect(isRetryableError(true)).toBe(false);
    });

    it('should return true when isRetryable is explicitly true', () => {
      const error = new Error('test') as any;
      error.isRetryable = true;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false when isRetryable is explicitly false', () => {
      const error = new Error('test') as any;
      error.isRetryable = false;
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for retryable status codes', () => {
      for (const code of DEFAULT_RETRY_STATUS_CODES) {
        const error = new Error('test') as any;
        error.statusCode = code;
        expect(isRetryableError(error)).toBe(true);
      }
    });

    it('should return false for non-retryable status codes', () => {
      const error = new Error('test') as any;
      error.statusCode = 200;
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for network errors', () => {
      const error = new Error('network error') as any;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('request timeout') as any;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should use custom retryableErrorFn when provided', () => {
      const error = new Error('specific error');
      const result = isRetryableError(error, {
        retryableErrorFn: () => true,
      });
      expect(result).toBe(true);
    });

    it('should use custom retryStatusCodes when provided', () => {
      const error = new Error('test') as any;
      error.statusCode = 418;
      const result = isRetryableError(error, {
        retryStatusCodes: new Set([418]),
      });
      expect(result).toBe(true);
    });
  });

  describe('constants', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_MAX_ATTEMPTS).toBe(3);
      expect(DEFAULT_BASE_DELAY).toBe(1000);
      expect(DEFAULT_MAX_DELAY).toBe(30000);
    });

    it('should include common retryable status codes', () => {
      expect(DEFAULT_RETRY_STATUS_CODES.has(408)).toBe(true);
      expect(DEFAULT_RETRY_STATUS_CODES.has(429)).toBe(true);
      expect(DEFAULT_RETRY_STATUS_CODES.has(500)).toBe(true);
      expect(DEFAULT_RETRY_STATUS_CODES.has(502)).toBe(true);
      expect(DEFAULT_RETRY_STATUS_CODES.has(503)).toBe(true);
      expect(DEFAULT_RETRY_STATUS_CODES.has(504)).toBe(true);
    });
  });
});
