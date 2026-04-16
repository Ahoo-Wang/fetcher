import { NamedFetcher } from '@ahoo-wang/fetcher';

/**
 * API Fetcher instance with:
 * - baseURL: https://api.example.com
 * - timeout: 5000ms
 * - Request interceptor that adds Bearer token from localStorage
 */
export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication - adds Bearer token from localStorage
apiFetcher.interceptors.request.use({
  name: 'auth-request-interceptor',
  order: 100,
  intercept(exchange) {
    const token = localStorage.getItem('authToken');
    if (token) {
      exchange.request.headers.Authorization = `Bearer ${token}`;
    }
    return exchange;
  },
});

// Error interceptor for timeout handling
apiFetcher.interceptors.error.use({
  name: 'timeout-error-interceptor',
  order: 100,
  intercept(exchange) {
    if (exchange.error?.name === 'FetchTimeoutError') {
      console.error('Request timeout:', exchange.error.message);
    }
    return exchange;
  },
});
