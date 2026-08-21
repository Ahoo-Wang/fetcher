import type { BackoffStrategy } from './types';
import { DEFAULT_BASE_DELAY, DEFAULT_MAX_DELAY } from './types';

export class FixedDelayStrategy implements BackoffStrategy {
  calculateDelay(attempt: number, options?: { baseDelay?: number }): number {
    const delay = options?.baseDelay ?? DEFAULT_BASE_DELAY;
    return delay;
  }
}

export class ExponentialBackoffStrategy implements BackoffStrategy {
  calculateDelay(attempt: number, options?: { baseDelay?: number; maxDelay?: number }): number {
    const baseDelay = options?.baseDelay ?? DEFAULT_BASE_DELAY;
    const maxDelay = options?.maxDelay ?? DEFAULT_MAX_DELAY;

    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    return delay;
  }
}

export class ExponentialBackoffWithJitterStrategy implements BackoffStrategy {
  calculateDelay(attempt: number, options?: { baseDelay?: number; maxDelay?: number; jitter?: number }): number {
    const baseDelay = options?.baseDelay ?? DEFAULT_BASE_DELAY;
    const maxDelay = options?.maxDelay ?? DEFAULT_MAX_DELAY;
    const jitter = options?.jitter ?? 0.3;

    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const clampedDelay = Math.min(exponentialDelay, maxDelay);

    const jitterRange = clampedDelay * jitter;
    const randomJitter = (Math.random() * 2 - 1) * jitterRange;

    const delay = Math.round(clampedDelay + randomJitter);
    return Math.max(0, delay);
  }
}

export class LinearBackoffStrategy implements BackoffStrategy {
  calculateDelay(attempt: number, options?: { baseDelay?: number }): number {
    const baseDelay = options?.baseDelay ?? DEFAULT_BASE_DELAY;
    return baseDelay * attempt;
  }
}

export const defaultBackoffStrategy = new ExponentialBackoffStrategy();
