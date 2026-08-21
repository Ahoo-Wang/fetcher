import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FixedDelayStrategy,
  ExponentialBackoffStrategy,
  ExponentialBackoffWithJitterStrategy,
  LinearBackoffStrategy,
  defaultBackoffStrategy,
} from '../src/strategies';

describe('Backoff Strategies', () => {
  describe('FixedDelayStrategy', () => {
    const strategy = new FixedDelayStrategy();

    it('should return the same delay for all attempts', () => {
      expect(strategy.calculateDelay(1)).toBe(1000);
      expect(strategy.calculateDelay(2)).toBe(1000);
      expect(strategy.calculateDelay(3)).toBe(1000);
    });

    it('should use custom baseDelay when provided', () => {
      expect(strategy.calculateDelay(1, { baseDelay: 500 })).toBe(500);
      expect(strategy.calculateDelay(2, { baseDelay: 500 })).toBe(500);
    });
  });

  describe('ExponentialBackoffStrategy', () => {
    const strategy = new ExponentialBackoffStrategy();

    it('should calculate exponential delays', () => {
      expect(strategy.calculateDelay(1)).toBe(1000);
      expect(strategy.calculateDelay(2)).toBe(2000);
      expect(strategy.calculateDelay(3)).toBe(4000);
    });

    it('should respect maxDelay', () => {
      const strategyWithMax = new ExponentialBackoffStrategy();
      expect(strategyWithMax.calculateDelay(10, { maxDelay: 5000 })).toBe(5000);
    });

    it('should use custom baseDelay when provided', () => {
      expect(strategy.calculateDelay(1, { baseDelay: 500 })).toBe(500);
      expect(strategy.calculateDelay(2, { baseDelay: 500 })).toBe(1000);
      expect(strategy.calculateDelay(3, { baseDelay: 500 })).toBe(2000);
    });
  });

  describe('ExponentialBackoffWithJitterStrategy', () => {
    const strategy = new ExponentialBackoffWithJitterStrategy();

    it('should return values close to exponential with jitter', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      expect(strategy.calculateDelay(1, { jitter: 0 })).toBe(1000);
      expect(strategy.calculateDelay(2, { jitter: 0 })).toBe(2000);
      expect(strategy.calculateDelay(3, { jitter: 0 })).toBe(4000);

      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const delays: number[] = [];
      for (let i = 0; i < 10; i++) {
        delays.push(strategy.calculateDelay(2, { jitter: 0.3 }));
      }

      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(1000);
        expect(delay).toBeLessThanOrEqual(3000);
      });
    });

    it('should not return negative delays', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1);

      const delay = strategy.calculateDelay(1, { jitter: 0.3 });
      expect(delay).toBeGreaterThanOrEqual(0);
    });
  });

  describe('LinearBackoffStrategy', () => {
    const strategy = new LinearBackoffStrategy();

    it('should calculate linear delays', () => {
      expect(strategy.calculateDelay(1)).toBe(1000);
      expect(strategy.calculateDelay(2)).toBe(2000);
      expect(strategy.calculateDelay(3)).toBe(3000);
    });

    it('should use custom baseDelay when provided', () => {
      expect(strategy.calculateDelay(1, { baseDelay: 500 })).toBe(500);
      expect(strategy.calculateDelay(2, { baseDelay: 500 })).toBe(1000);
    });
  });

  describe('defaultBackoffStrategy', () => {
    it('should be an instance of ExponentialBackoffStrategy', () => {
      expect(defaultBackoffStrategy).toBeInstanceOf(ExponentialBackoffStrategy);
    });
  });
});
