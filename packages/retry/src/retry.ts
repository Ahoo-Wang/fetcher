import type { ErrorInterceptor, FetchExchange } from '@ahoo-wang/fetcher';
import type { BackoffStrategy, RetryConfig, RetryStrategyType } from './types';
import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_BASE_DELAY,
  DEFAULT_MAX_DELAY,
  isRetryableError,
} from './types';
import { RetriesExhaustedError } from './errors';
import {
  FixedDelayStrategy,
  ExponentialBackoffStrategy,
  ExponentialBackoffWithJitterStrategy,
  LinearBackoffStrategy,
  defaultBackoffStrategy,
} from './strategies';

export type { RetryStrategyType } from './types';
export type { RetryConfig } from './types';

export function createBackoffStrategy(type: RetryStrategyType): BackoffStrategy {
  switch (type) {
    case 'fixed':
      return new FixedDelayStrategy();
    case 'exponential':
      return new ExponentialBackoffStrategy();
    case 'exponential-jitter':
      return new ExponentialBackoffWithJitterStrategy();
    case 'linear':
      return new LinearBackoffStrategy();
    default:
      return defaultBackoffStrategy;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<T> {
  const {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    shouldRetry,
    onRetry,
    strategy = 'exponential',
    baseDelay = DEFAULT_BASE_DELAY,
    maxDelay = DEFAULT_MAX_DELAY,
    jitter = 0.3,
  } = config;

  const backoffStrategy: BackoffStrategy =
    typeof strategy === 'string'
      ? createBackoffStrategy(strategy)
      : strategy;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isRetryable = shouldRetry
        ? shouldRetry(error, attempt)
        : isRetryableError(error, {
            retryStatusCodes: config.retryStatusCodes
              ? new Set(config.retryStatusCodes)
              : undefined,
            retryableErrorFn: config.retryableErrorFn,
          });

      if (!isRetryable || attempt === maxAttempts) {
        throw new RetriesExhaustedError(
          `Retries exhausted after ${attempt} attempt(s)`,
          attempt,
          lastError,
        );
      }

      const delay = backoffStrategy.calculateDelay(attempt, {
        baseDelay,
        maxDelay,
        jitter,
      });

      onRetry?.(error, attempt);

      if (delay > 0) {
        await sleep(delay);
      }
    }
  }

  throw new RetriesExhaustedError(
    `Retries exhausted after ${maxAttempts} attempt(s)`,
    maxAttempts,
    lastError,
  );
}

export function createRetryInterceptor(config: RetryConfig = {}): ErrorInterceptor {
  return {
    name: 'RetryInterceptor',
    order: 100,
    async intercept(exchange: FetchExchange): Promise<void> {
      if (exchange.response || !exchange.error) {
        return;
      }

      const {
        maxAttempts = DEFAULT_MAX_ATTEMPTS,
        shouldRetry,
        strategy = 'exponential',
        baseDelay = DEFAULT_BASE_DELAY,
        maxDelay = DEFAULT_MAX_DELAY,
        jitter = 0.3,
      } = config;

      const backoffStrategy: BackoffStrategy =
        typeof strategy === 'string'
          ? createBackoffStrategy(strategy)
          : strategy;

      let lastError = exchange.error;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const isRetryable = shouldRetry
          ? shouldRetry(exchange.error, attempt)
          : isRetryableError(exchange.error);

        if (!isRetryable || attempt === maxAttempts) {
          return;
        }

        const delay = backoffStrategy.calculateDelay(attempt, {
          baseDelay,
          maxDelay,
          jitter,
        });

        config.onRetry?.(exchange.error, attempt);

        if (delay > 0) {
          await sleep(delay);
        }

        try {
          exchange.request.headers.set('X-Retry-Attempt', String(attempt));
          exchange.response = await fetch(exchange.request);
          exchange.error = undefined;
          return;
        } catch (error) {
          lastError = error;
          exchange.error = error;
        }
      }
    },
  };
}

export { isRetryableError } from './types';
export { RetriesExhaustedError, TimeoutError } from './errors';
export {
  FixedDelayStrategy,
  ExponentialBackoffStrategy,
  ExponentialBackoffWithJitterStrategy,
  LinearBackoffStrategy,
  defaultBackoffStrategy,
} from './strategies';
export type { RetryOptions, BackoffStrategy, RetryableError } from './types';
