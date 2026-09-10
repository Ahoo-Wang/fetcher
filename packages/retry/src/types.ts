export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

export interface BackoffStrategy {
  calculateDelay(attempt: number, options?: { baseDelay?: number; maxDelay?: number; jitter?: number }): number;
}

export interface RetryableError extends Error {
  isRetryable?: boolean;
  statusCode?: number;
}

export interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
  strategy?: RetryStrategyType | BackoffStrategy;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: number;
  retryStatusCodes?: number[];
  retryableErrorFn?: (error: unknown) => boolean;
}

export type RetryStrategyType = 'fixed' | 'exponential' | 'exponential-jitter' | 'linear';

export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_BASE_DELAY = 1000;
export const DEFAULT_MAX_DELAY = 30000;

export const DEFAULT_RETRY_STATUS_CODES = new Set([
  408, 429, 500, 502, 503, 504,
]);

export function isRetryableError(
  error: unknown,
  options?: {
    retryStatusCodes?: Set<number>;
    retryableErrorFn?: (error: unknown) => boolean;
  },
): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as RetryableError;

  if (err.isRetryable === false) {
    return false;
  }

  if (err.isRetryable === true) {
    return true;
  }

  if (err.statusCode && options?.retryStatusCodes?.has(err.statusCode)) {
    return true;
  }

  if (options?.retryableErrorFn) {
    return options.retryableErrorFn(error);
  }

  if (err.statusCode && DEFAULT_RETRY_STATUS_CODES.has(err.statusCode)) {
    return true;
  }

  if (err.message?.includes('network') || err.message?.includes('timeout')) {
    return true;
  }

  return false;
}
