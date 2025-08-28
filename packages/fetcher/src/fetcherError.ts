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
