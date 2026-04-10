import { describe, it, expect } from 'vitest';
import { RetriesExhaustedError, TimeoutError } from '../src/errors';

describe('Errors', () => {
  describe('RetriesExhaustedError', () => {
    it('should create error with correct properties', () => {
      const originalError = new Error('original');
      const error = new RetriesExhaustedError('Retries exhausted', 3, originalError);

      expect(error.message).toBe('Retries exhausted');
      expect(error.name).toBe('RetriesExhaustedError');
      expect(error.attempts).toBe(3);
      expect(error.lastError).toBe(originalError);
    });

    it('should be an instance of Error', () => {
      const error = new RetriesExhaustedError('test', 1, new Error());
      expect(error).toBeInstanceOf(Error);
    });

    it('should be an instance of RetriesExhaustedError', () => {
      const error = new RetriesExhaustedError('test', 1, new Error());
      expect(error).toBeInstanceOf(RetriesExhaustedError);
    });
  });

  describe('TimeoutError', () => {
    it('should create error with default message', () => {
      const error = new TimeoutError();

      expect(error.message).toBe('Operation timed out');
      expect(error.name).toBe('TimeoutError');
    });

    it('should create error with custom message', () => {
      const error = new TimeoutError('Custom timeout message');

      expect(error.message).toBe('Custom timeout message');
      expect(error.name).toBe('TimeoutError');
    });

    it('should be an instance of Error', () => {
      const error = new TimeoutError();
      expect(error).toBeInstanceOf(Error);
    });
  });
});
