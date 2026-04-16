/**
 * Fetcher Client Configuration
 *
 * This module sets up a Fetcher instance with:
 * - Base URL: https://api.example.com
 * - Timeout: 5000ms
 * - Request interceptor that adds Bearer token from localStorage
 */

import { Fetcher } from 'fetcher';

const API_BASE_URL = 'https://api.example.com';
const TIMEOUT_MS = 5000;
const TOKEN_KEY = 'auth_token';

/**
 * Request interceptor that adds a Bearer token from localStorage to outgoing requests.
 *
 * This interceptor runs before each HTTP request is sent and automatically
 * adds an Authorization header with the Bearer token retrieved from localStorage.
 */
const bearerTokenInterceptor = {
  name: 'BearerTokenInterceptor',
  order: 100,
  intercept(exchange: import('fetcher').FetchExchange): void | Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      exchange.request.headers = {
        ...exchange.request.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  },
};

/**
 * Creates and configures a Fetcher instance with the specified settings.
 *
 * @returns A configured Fetcher instance with Bearer token interceptor
 *
 * @example
 * ```typescript
 * const fetcher = createFetcher();
 *
 * // Now all requests will automatically include the Bearer token
 * const response = await fetcher.get('/users');
 * ```
 */
export function createFetcher(): Fetcher {
  const fetcher = new Fetcher({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT_MS,
  });

  // Register the Bearer token interceptor
  fetcher.interceptors.request.use(bearerTokenInterceptor);

  return fetcher;
}

/**
 * Pre-configured Fetcher instance ready for use.
 *
 * @example
 * ```typescript
 * import { apiFetcher } from './fetcher-setup';
 *
 * const response = await apiFetcher.get('/users');
 * ```
 */
export const apiFetcher = createFetcher();

// Alternative: Create fetcher with inline interceptor using an async approach
// if you need to retrieve the token asynchronously
export function createFetcherWithAsyncToken(): Fetcher {
  const fetcher = new Fetcher({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT_MS,
  });

  const asyncBearerTokenInterceptor = {
    name: 'AsyncBearerTokenInterceptor',
    order: 100,
    async intercept(exchange: import('fetcher').FetchExchange): Promise<void> {
      // For async token retrieval (e.g., from a promise-based storage)
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        exchange.request.headers = {
          ...exchange.request.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    },
  };

  fetcher.interceptors.request.use(asyncBearerTokenInterceptor);

  return fetcher;
}
