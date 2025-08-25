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
import { HeadersCapable } from './types';
import { TimeoutCapable } from './timeout';


/**
 * Fetcher request configuration interface
 *
 * This interface defines all the configuration options available for making HTTP requests
 * with the Fetcher client. It extends the standard RequestInit interface while adding
 * Fetcher-specific features like path parameters, query parameters, and timeout control.
 *
 * @example
 * ```typescript
 * const request: FetcherRequest = {
 *   method: 'GET',
 *   path: { id: 123 },
 *   query: { include: 'profile' },
 *   headers: { 'Authorization': 'Bearer token' },
 *   timeout: 5000
 * };
 *
 * const response = await fetcher.fetch('/users/{id}', request);
 * ```
 */
export interface FetcherRequest
  extends TimeoutCapable,
    HeadersCapable,
    Omit<RequestInit, 'body' | 'headers'> {
  /**
   * Path parameters for URL templating
   *
   * An object containing key-value pairs that will be used to replace placeholders
   * in the URL path. Placeholders are specified using curly braces, e.g., '/users/{id}'.
   *
   * @example
   * ```typescript
   * // With URL '/users/{id}/posts/{postId}'
   * const request = {
   *   path: { id: 123, postId: 456 }
   * };
   * // Results in URL: '/users/123/posts/456'
   * ```
   */
  path?: Record<string, any>;

  /**
   * Query parameters for URL query string
   *
   * An object containing key-value pairs that will be serialized and appended
   * to the URL as query parameters. Arrays are serialized as multiple parameters
   * with the same name, and objects are JSON-stringified.
   *
   * @example
   * ```typescript
   * const request = {
   *   query: {
   *     limit: 10,
   *     filter: 'active',
   *     tags: ['important', 'urgent']
   *   }
   * };
   * // Results in query string: '?limit=10&filter=active&tags=important&tags=urgent'
   * ```
   */
  query?: Record<string, any>;

  /**
   * Request body
   *
   * The body of the request. Can be a string, Blob, ArrayBuffer, FormData,
   * URLSearchParams, or a plain object. Plain objects are automatically
   * converted to JSON and the appropriate Content-Type header is set.
   *
   * @example
   * ```typescript
   * // Plain object (automatically converted to JSON)
   * const request = {
   *   method: 'POST',
   *   body: { name: 'John', email: 'john@example.com' }
   * };
   *
   * // FormData
   * const formData = new FormData();
   * formData.append('name', 'John');
   * const request = {
   *   method: 'POST',
   *   body: formData
   * };
   * ```
   */
  body?: BodyInit | Record<string, any> | null;
}

/**
 * FetchExchange Interface
 *
 * Represents the complete exchange object that flows through the interceptor chain.
 * This object contains all the information about a request, response, and any errors
 * that occur during the HTTP request lifecycle. It also provides a mechanism for
 * sharing data between interceptors through the attributes property.
 *
 * @example
 * ```typescript
 * // In a request interceptor
 * const requestInterceptor: Interceptor = {
 *   name: 'RequestInterceptor',
 *   order: 0,
 *   async intercept(exchange: FetchExchange): Promise<FetchExchange> {
 *     // Add custom data to share with other interceptors
 *     exchange.attributes = exchange.attributes || {};
 *     exchange.attributes.startTime = Date.now();
 *     exchange.attributes.customHeader = 'my-value';
 *     return exchange;
 *   }
 * };
 *
 * // In a response interceptor
 * const responseInterceptor: Interceptor = {
 *   name: 'ResponseInterceptor',
 *   order: 0,
 *   async intercept(exchange: FetchExchange): Promise<FetchExchange> {
 *     // Access data shared by previous interceptors
 *     if (exchange.attributes && exchange.attributes.startTime) {
 *       const startTime = exchange.attributes.startTime;
 *       const duration = Date.now() - startTime;
 *       console.log(`Request took ${duration}ms`);
 *     }
 *     return exchange;
 *   }
 * };
 * ```
 */
export interface FetchExchange {
  /**
   * The Fetcher instance that initiated this exchange
   */
  fetcher: Fetcher;

  /**
   * The URL for this request
   */
  url: string;

  /**
   * The request configuration including method, headers, body, etc.
   */
  request: FetcherRequest;

  /**
   * The response object, undefined until the request completes successfully
   */
  response: Response | undefined;

  /**
   * Any error that occurred during the request processing, undefined if no error occurred
   */
  error: Error | any | undefined;

  /**
   * Shared attributes for passing data between interceptors
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