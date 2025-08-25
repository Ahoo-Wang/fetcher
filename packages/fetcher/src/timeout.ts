/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * TimeoutCapable Interface
 *
 * Interface that defines timeout capability for HTTP requests.
 */
export interface TimeoutCapable {
  /**
   * Request timeout in milliseconds
   *
   * When the value is 0, it indicates no timeout should be set.
   * The default value is undefined.
   */
  timeout?: number;
}

/**
 * Resolves request timeout settings, prioritizing request-level timeout settings
 *
 * @param requestTimeout - Request-level timeout setting
 * @param optionsTimeout - Configuration-level timeout setting
 * @returns Resolved timeout setting
 *
 * @remarks
 * If requestTimeout is defined, it takes precedence over optionsTimeout.
 * Otherwise, optionsTimeout is returned. If both are undefined, undefined is returned.
 */
export function resolveTimeout(
  requestTimeout?: number,
  optionsTimeout?: number,
): number | undefined {
  if (typeof requestTimeout !== 'undefined') {
    return requestTimeout;
  }
  return optionsTimeout;
}

/**
 * FetchTimeoutError Class
 *
 * Exception class thrown when an HTTP request times out.
 * This error is thrown by the timeoutFetch function when a request exceeds its timeout limit.
 *
 * @example
 * ```typescript
 * try {
 *   const response = await timeoutFetch('https://api.example.com/users', {}, 1000);
 * } catch (error) {
 *   if (error instanceof FetchTimeoutError) {
 *     console.log(`Request timed out after ${error.timeout}ms`);
 *   }
 * }
 * ```
 */
export class FetchTimeoutError extends Error {
  /**
   * The URL that timed out
   */
  url: string;

  /**
   * The request options that timed out
   */
  request: RequestInit;

  /**
   * The timeout value in milliseconds
   */
  timeout: number;

  /**
   * Creates a new FetchTimeoutError instance
   *
   * @param url - The URL that timed out
   * @param request - The request options that timed out
   * @param timeout - The timeout value in milliseconds
   */
  constructor(url: string, request: RequestInit, timeout: number) {
    const method = request.method || 'GET';
    const message = `Request timeout of ${timeout}ms exceeded for ${method} ${url}`;
    super(message);
    this.name = 'FetchTimeoutError';
    this.url = url;
    this.request = request;
    this.timeout = timeout;
    // Fix prototype chain
    Object.setPrototypeOf(this, FetchTimeoutError.prototype);
  }
}

/**
 * HTTP request method with timeout control
 *
 * This method uses Promise.race to implement timeout control, initiating both
 * fetch request and timeout Promise simultaneously. When either Promise completes,
 * it returns the result or throws an exception.
 *
 * @param url - The URL to fetch
 * @param request - The request initialization options
 * @param timeout - Optional timeout in milliseconds
 * @returns Promise<Response> HTTP response Promise
 * @throws FetchTimeoutError Thrown when the request times out
 *
 * @example
 * ```typescript
 * // With timeout
 * try {
 *   const response = await timeoutFetch('https://api.example.com/users', { method: 'GET' }, 5000);
 *   console.log('Request completed successfully');
 * } catch (error) {
 *   if (error instanceof FetchTimeoutError) {
 *     console.log(`Request timed out after ${error.timeout}ms`);
 *   }
 * }
 *
 * // Without timeout (delegates to regular fetch)
 * const response = await timeoutFetch('https://api.example.com/users', { method: 'GET' });
 * ```
 */
export async function timeoutFetch(
  url: string,
  request: RequestInit,
  timeout?: number,
): Promise<Response> {
  // Extract timeout from request
  if (!timeout) {
    return fetch(url, request as RequestInit);
  }

  // Create AbortController for fetch request cancellation
  const controller = new AbortController();
  // Create a new request object to avoid modifying the original request object
  const fetchRequest = {
    ...request,
    signal: controller.signal,
  };

  // Timer resource management
  let timerId: ReturnType<typeof setTimeout> | null = null;
  // Create timeout Promise that rejects after specified time
  const timeoutPromise = new Promise<Response>((_, reject) => {
    timerId = setTimeout(() => {
      // Clean up timer resources and handle timeout error
      if (timerId) {
        clearTimeout(timerId);
      }
      const error = new FetchTimeoutError(url, request, timeout);
      controller.abort(error);
      reject(error);
    }, timeout);
  });

  try {
    // Race between fetch request and timeout Promise
    return await Promise.race([
      fetch(url, fetchRequest as RequestInit),
      timeoutPromise,
    ]);
  } finally {
    // Clean up timer resources
    if (timerId) {
      clearTimeout(timerId);
    }
  }
}
