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

import { Fetcher } from './fetcher';
import type { FetchRequest, RequestHeaders } from './fetchRequest';
import { ExchangeError } from './interceptorManager';
import { type UrlParams } from './urlBuilder';
import { type RequiredBy } from './types';

export interface AttributesCapable {
  /**
   * Shared attributes for passing data between interceptors.
   *
   * This property allows interceptors to share arbitrary data with each other.
   * Interceptors can read from and write to this object to pass information
   * along the interceptor chain.
   *
   * @remarks
   * - This property is optional and may be undefined initially
   * - Interceptors should initialize this property if they need to use it
   * - Use string keys to avoid conflicts between different interceptors
   * - Consider namespacing your keys (e.g., 'mylib.retryCount' instead of 'retryCount')
   * - Be mindful of memory usage when storing large objects
   */
  attributes?: Record<string, any>;
}

export interface FetchExchangeInit extends AttributesCapable {
  /**
   * The Fetcher instance that initiated this exchange.
   */
  fetcher: Fetcher;

  /**
   * The request configuration including url, method, headers, body, etc.
   */
  request: FetchRequest;

  /**
   * The response object, undefined until the request completes successfully.
   */
  response?: Response;

  /**
   * Any error that occurred during the request processing, undefined if no error occurred.
   */
  error?: Error | any;
}

/**
 * Container for HTTP request/response data that flows through the interceptor chain.
 *
 * Represents the complete exchange object that flows through the interceptor chain.
 * This object contains all the information about a request, response, and any errors
 * that occur during the HTTP request lifecycle. It also provides a mechanism for
 * sharing data between interceptors through the attributes property.
 *
 * FetchExchange instances are unique within a single request scope, meaning each HTTP
 * request creates its own FetchExchange instance that is passed through the interceptor
 * chain for that specific request.
 *
 * @example
 * ```typescript
 * // In a request interceptor
 * const requestInterceptor: Interceptor = {
 *   name: 'RequestInterceptor',
 *   order: 0,
 *   intercept(exchange: FetchExchange) {
 *     // Add custom data to share with other interceptors
 *     exchange.attributes = exchange.attributes || {};
 *     exchange.attributes.startTime = Date.now();
 *     exchange.attributes.customHeader = 'my-value';
 *   }
 * };
 *
 * // In a response interceptor
 * const responseInterceptor: Interceptor = {
 *   name: 'ResponseInterceptor',
 *   order: 0,
 *   intercept(exchange: FetchExchange) {
 *     // Access data shared by previous interceptors
 *     if (exchange.attributes && exchange.attributes.startTime) {
 *       const startTime = exchange.attributes.startTime;
 *       const duration = Date.now() - startTime;
 *       console.log(`Request took ${duration}ms`);
 *     }
 *   }
 * };
 * ```
 */
export class FetchExchange
  implements RequiredBy<FetchExchangeInit, 'attributes'> {
  /**
   * The Fetcher instance that initiated this exchange.
   */
  fetcher: Fetcher;

  /**
   * The request configuration including url, method, headers, body, etc.
   */
  request: FetchRequest;

  /**
   * The response object, undefined until the request completes successfully.
   */
  response?: Response;

  /**
   * Any error that occurred during the request processing, undefined if no error occurred.
   */
  error?: Error | any;

  /**
   * Shared attributes for passing data between interceptors.
   *
   * This property allows interceptors to share arbitrary data with each other.
   * Interceptors can read from and write to this object to pass information
   * along the interceptor chain.
   *
   * @remarks
   * - This property is optional and may be undefined initially
   * - Interceptors should initialize this property if they need to use it
   * - Use string keys to avoid conflicts between different interceptors
   * - Consider namespacing your keys (e.g., 'mylib.retryCount' instead of 'retryCount')
   * - Be mindful of memory usage when storing large objects
   */
  attributes: Record<string, any>;

  constructor(exchangeInit: FetchExchangeInit) {
    this.fetcher = exchangeInit.fetcher;
    this.request = exchangeInit.request;
    this.attributes = exchangeInit.attributes ?? {};
    this.response = exchangeInit.response;
    this.error = exchangeInit.error;
  }

  /**
   * Ensures that request headers object exists, creating it if necessary.
   *
   * This method checks if the request headers object is present and initializes
   * it as an empty object if it's missing. This guarantees that headers can
   * be safely accessed and modified after calling this method.
   *
   * @returns The request headers object, guaranteed to be non-null
   */
  ensureRequestHeaders(): RequestHeaders {
    if (!this.request.headers) {
      this.request.headers = {};
    }
    return this.request.headers;
  }

  /**
   * Ensures that request URL parameters object exists with all required properties,
   * creating them if necessary.
   *
   * This method checks if the request URL parameters object is present and initializes
   * it with empty path and query objects if it's missing. It also ensures that both
   * path and query sub-objects exist. This guarantees that URL parameters can be
   * safely accessed and modified after calling this method.
   *
   * @returns The request URL parameters object with guaranteed non-null path and query properties
   */
  ensureRequestUrlParams(): Required<UrlParams> {
    if (!this.request.urlParams) {
      this.request.urlParams = {
        path: {},
        query: {},
      };
    }
    if (!this.request.urlParams.path) {
      this.request.urlParams.path = {};
    }
    if (!this.request.urlParams.query) {
      this.request.urlParams.query = {};
    }
    return this.request.urlParams as Required<UrlParams>;
  }

  /**
   * Checks if the exchange has an error.
   *
   * @returns true if an error is present, false otherwise
   */
  hasError(): boolean {
    return !!this.error;
  }

  /**
   * Checks if the exchange has a response.
   *
   * @returns true if a response is present, false otherwise
   */
  hasResponse(): boolean {
    return !!this.response;
  }

  /**
   * Gets the required response object, throwing an error if no response is available.
   *
   * This getter ensures that a response object is available, and throws an ExchangeError
   * with details about the request if no response was received. This is useful for
   * guaranteeing that downstream code always has a valid Response object to work with.
   *
   * @throws {ExchangeError} If no response is available for the current exchange
   * @returns The Response object for this exchange
   */
  get requiredResponse(): Response {
    if (!this.response) {
      throw new ExchangeError(
        this,
        `Request to ${this.request.url} failed with no response`,
      );
    }
    return this.response;
  }
}
