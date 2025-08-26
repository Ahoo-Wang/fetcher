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

export class FetcherError extends Error {
  constructor(errorMsg?: string, cause?: Error | any) {
    const errorMessage = errorMsg || cause?.message || 'An error occurred in the fetcher';
    super(errorMessage);
    this.name = 'FetcherError';
    if (cause?.stack) {
      this.stack = cause.stack;
    }
    Object.setPrototypeOf(this, FetcherError.prototype);
  }
}

/**
 * Custom error class for FetchExchange related errors.
 *
 * This error is thrown when there are issues with the HTTP exchange process,
 * such as when a request fails and no response is generated.
 */
export class ExchangeError extends FetcherError {
  constructor(public readonly exchange: FetchExchange) {
    const errorMessage =
      exchange.error?.message ||
      exchange.response?.statusText ||
      'Unknown error occurred during exchange';
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
 */
export class FetchError extends FetcherError {
  constructor(public readonly exchange: FetchExchange, errorMsg?: string) {
    const errorMessage = errorMsg || exchange.error?.message;
    super(errorMessage, exchange.error);
    this.name = 'FetchError';
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}