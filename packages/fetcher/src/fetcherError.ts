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

import { FetchExchange } from './fetchExchange';

/**
 * Base error class for all Fetcher-related errors.
 *
 * This class extends the native Error class and provides a foundation for
 * all custom errors thrown by the Fetcher library. It includes support for
 * error chaining through the cause property.
 *
 * @example
 * ```typescript
 * try {
 *   await fetcher.get('/api/users');
 * } catch (error) {
 *   if (error instanceof FetcherError) {
 *     console.log('Fetcher error:', error.message);
 *     if (error.cause) {
 *       console.log('Caused by:', error.cause);
 *     }
 *   }
 * }
 * ```
 */
export class FetcherError extends Error {
  /**
   * Creates a new FetcherError instance.
   *
   * @param errorMsg - Optional error message. If not provided, will use the cause's message or a default message.
   * @param cause - Optional underlying error that caused this error.
   */
  constructor(
    errorMsg?: string,
    public readonly cause?: Error | any,
  ) {
    const errorMessage =
      errorMsg || cause?.message || 'An error occurred in the fetcher';
    super(errorMessage);
    this.name = 'FetcherError';

    // Copy stack trace from cause if available
    if (cause?.stack) {
      this.stack = cause.stack;
    }

    // Set prototype for instanceof checks to work correctly
    Object.setPrototypeOf(this, FetcherError.prototype);
  }
}

/**
 * Custom error class for FetchExchange related errors.
 *
 * This error is thrown when there are issues with the HTTP exchange process,
 * such as when a request fails and no response is generated. It provides
 * comprehensive information about the failed request through the exchange object.
 *
 * @example
 * ```typescript
 * try {
 *   await fetcher.get('/api/users');
 * } catch (error) {
 *   if (error instanceof ExchangeError) {
 *     console.log('Request URL:', error.exchange.request.url);
 *     console.log('Request method:', error.exchange.request.method);
 *     if (error.exchange.error) {
 *       console.log('Underlying error:', error.exchange.error);
 *     }
 *   }
 * }
 * ```
 */
export class ExchangeError extends FetcherError {
  /**
   * Creates a new ExchangeError instance.
   *
   * @param exchange - The FetchExchange object containing request/response/error information.
   */
  constructor(public readonly exchange: FetchExchange) {
    const errorMessage =
      exchange.error?.message ||
      exchange.response?.statusText ||
      `Request to ${exchange.request.url} failed during exchange`;
    super(errorMessage, exchange.error);
    this.name = 'ExchangeError';
    Object.setPrototypeOf(this, ExchangeError.prototype);
  }
}

/**
 * Custom error class for Fetcher request failures.
 *
 * This error is thrown when a fetch request fails and no response is generated.
 * It wraps the FetchExchange object to provide comprehensive information about the failed request.
 *
 * @example
 * ```typescript
 * try {
 *   await fetcher.get('/api/users');
 * } catch (error) {
 *   if (error instanceof FetchError) {
 *     console.log('Failed URL:', error.exchange.request.url);
 *     console.log('Request headers:', error.exchange.request.headers);
 *     console.log('Interceptor attributes:', error.exchange.attributes);
 *   }
 * }
 * ```
 */
export class FetchError extends FetcherError {
  /**
   * Creates a new FetchError instance.
   *
   * @param exchange - The FetchExchange object containing request/response/error information.
   * @param errorMsg - Optional custom error message. If not provided, will use the exchange's error message.
   */
  constructor(
    public readonly exchange: FetchExchange,
    errorMsg?: string,
  ) {
    const errorMessage =
      errorMsg ||
      exchange.error?.message ||
      `Request to ${exchange.request.url} failed with no response`;
    super(errorMessage, exchange.error);
    this.name = 'FetchError';
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

