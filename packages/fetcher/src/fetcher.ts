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

import { UrlBuilder, UrlBuilderCapable } from './urlBuilder';
import { resolveTimeout, TimeoutCapable } from './timeout';
import { FetcherInterceptors } from './interceptor';
import { ExchangeError, FetchExchange } from './fetchExchange';
import {
  BaseURLCapable,
  ContentTypeValues,
  FetchRequest,
  FetchRequestInit,
  HttpMethod,
  RequestHeaders,
  RequestHeadersCapable,
} from './fetchRequest';
import { mergeRecords } from './utils';

/**
 * Configuration options for the Fetcher client.
 *
 * Defines the customizable aspects of a Fetcher instance including base URL,
 * default headers, timeout settings, and interceptors.
 *
 * @example
 * ```typescript
 * const options: FetcherOptions = {
 *   baseURL: 'https://api.example.com',
 *   headers: { 'Content-Type': 'application/json' },
 *   timeout: 5000,
 *   interceptors: new FetcherInterceptors()
 * };
 * ```
 */
export interface FetcherOptions
  extends BaseURLCapable,
    RequestHeadersCapable,
    TimeoutCapable {
  interceptors?: FetcherInterceptors;
}

const DEFAULT_HEADERS: RequestHeaders = {
  'Content-Type': ContentTypeValues.APPLICATION_JSON,
};

export const DEFAULT_OPTIONS: FetcherOptions = {
  baseURL: '',
  headers: DEFAULT_HEADERS,
};

/**
 * HTTP client with support for interceptors, URL building, and timeout control.
 *
 * The Fetcher class provides a flexible and extensible HTTP client implementation
 * that follows the interceptor pattern. It supports URL parameter interpolation,
 * request/response transformation, and timeout handling.
 *
 * @example
 * ```typescript
 * const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
 * const response = await fetcher.fetch('/users/{id}', {
 *   urlParams: {
 *     path: { id: 123 },
 *     query: { filter: 'active' }
 *   },
 *   timeout: 5000
 * });
 * ```
 */
export class Fetcher
  implements UrlBuilderCapable, RequestHeadersCapable, TimeoutCapable
{
  urlBuilder: UrlBuilder;
  headers?: RequestHeaders = DEFAULT_HEADERS;
  timeout?: number;
  interceptors: FetcherInterceptors;

  /**
   * Initializes a new Fetcher instance with optional configuration.
   *
   * Creates a Fetcher with default settings that can be overridden through the options parameter.
   * If no interceptors are provided, a default set of interceptors will be used.
   *
   * @param options - Configuration options for the Fetcher instance
   */
  constructor(options: FetcherOptions = DEFAULT_OPTIONS) {
    this.urlBuilder = new UrlBuilder(options.baseURL);
    this.headers = options.headers ?? DEFAULT_HEADERS;
    this.timeout = options.timeout;
    this.interceptors = options.interceptors ?? new FetcherInterceptors();
  }

  /**
   * Executes an HTTP request with the specified URL and options.
   *
   * This is the primary method for making HTTP requests. It processes the request
   * through the interceptor chain and returns the resulting Response.
   *
   * @param url - The URL path for the request (relative to baseURL if set)
   * @param request - Request configuration including headers, body, parameters, etc.
   * @returns Promise that resolves to the HTTP response
   * @throws Error if the request fails and no response is generated
   */
  async fetch(url: string, request: FetchRequestInit = {}): Promise<Response> {
    const fetchRequest = request as FetchRequest;
    fetchRequest.url = url;
    const exchange = await this.request(fetchRequest);
    if (!exchange.response) {
      throw new Error(`Request to ${fetchRequest.url} failed with no response`);
    }
    return exchange.response;
  }

  /**
   * Processes an HTTP request through the Fetcher's internal workflow.
   *
   * This method prepares the request by merging headers and timeout settings,
   * creates a FetchExchange object, and passes it through the exchange method
   * for interceptor processing.
   *
   * @param request - Complete request configuration object
   * @returns Promise that resolves to a FetchExchange containing request/response data
   * @throws Error if an unhandled error occurs during request processing
   */
  async request(request: FetchRequest): Promise<FetchExchange> {
    // Merge default headers and request-level headers
    const mergedHeaders = mergeRecords(request.headers, this.headers);
    // Merge request options
    const fetchRequest: FetchRequest = {
      ...request,
      headers: mergedHeaders,
      timeout: resolveTimeout(request.timeout, this.timeout),
    };
    const exchange: FetchExchange = new FetchExchange(this, fetchRequest);
    return this.exchange(exchange);
  }

  /**
   * Processes a FetchExchange through the interceptor pipeline.
   *
   * This method is the core of the Fetcher's interceptor system. It executes the three
   * phases of interceptors in sequence:
   * 1. Request interceptors - Process the request before sending
   * 2. Response interceptors - Process the response after receiving
   * 3. Error interceptors - Handle any errors that occurred during the process
   *
   * The interceptor pipeline follows the Chain of Responsibility pattern, where each
   * interceptor can modify the exchange object and decide whether to continue or
   * terminate the chain.
   *
   * @param fetchExchange - The exchange object containing request, response, and error information
   * @returns Promise that resolves to the processed FetchExchange
   * @throws ExchangeError if an unhandled error occurs during processing
   *
   * @remarks
   * The method handles three distinct phases:
   *
   * 1. Request Phase: Executes request interceptors which can modify headers, URL, body, etc.
   *    Built-in interceptors handle URL resolution, body serialization, and actual HTTP execution.
   *
   * 2. Response Phase: Executes response interceptors which can transform or validate responses.
   *    These interceptors only run if the request phase completed without throwing.
   *
   * 3. Error Phase: Executes error interceptors when any phase throws an error. Error interceptors
   *    can handle errors by clearing the error property. If error interceptors clear the error,
   *    the exchange is returned successfully.
   *
   * Error Handling:
   * - If any interceptor throws an error, the error phase is triggered
   * - Error interceptors can "fix" errors by clearing the error property on the exchange
   * - If errors remain after error interceptors run, they are wrapped in ExchangeError
   *
   * Order of Execution:
   * 1. Request interceptors (sorted by order property, ascending)
   * 2. Response interceptors (sorted by order property, ascending) - only if no error in request phase
   * 3. Error interceptors (sorted by order property, ascending) - only if an error occurred
   *
   * @example
   * ```typescript
   * // Create a fetcher with custom interceptors
   * const fetcher = new Fetcher();
   *
   * // Add a request interceptor
   * fetcher.interceptors.request.use({
   *   name: 'AuthInterceptor',
   *   order: 100,
   *   async intercept(exchange: FetchExchange) {
   *     exchange.request.headers = {
   *       ...exchange.request.headers,
   *       'Authorization': 'Bearer ' + getToken()
   *     };
   *   }
   * });
   *
   * // Add a response interceptor
   * fetcher.interceptors.response.use({
   *   name: 'ResponseLogger',
   *   order: 100,
   *   async intercept(exchange: FetchExchange) {
   *     console.log(`Response status: ${exchange.response?.status}`);
   *   }
   * });
   *
   * // Add an error interceptor
   * fetcher.interceptors.error.use({
   *   name: 'ErrorLogger',
   *   order: 100,
   *   async intercept(exchange: FetchExchange) {
   *     console.error(`Request to ${exchange.request.url} failed:`, exchange.error);
   *     // Clear the error to indicate it's been handled
   *     exchange.error = undefined;
   *   }
   * });
   *
   * // Create and process an exchange
   * const request: FetchRequest = {
   *   url: '/api/users',
   *   method: HttpMethod.GET
   * };
   * const exchange = new FetchExchange(fetcher, request);
   * const result = await fetcher.exchange(exchange);
   * ```
   */
  async exchange(fetchExchange: FetchExchange): Promise<FetchExchange> {
    try {
      // Apply request interceptors
      await this.interceptors.request.intercept(fetchExchange);
      // Apply response interceptors
      await this.interceptors.response.intercept(fetchExchange);
      return fetchExchange;
    } catch (error: any) {
      // Apply error interceptors
      fetchExchange.error = error;
      await this.interceptors.error.intercept(fetchExchange);

      // If error interceptors cleared the error (indicating it's been handled/fixed), return the exchange
      if (!fetchExchange.hasError()) {
        return fetchExchange;
      }

      // Otherwise, wrap the error in ExchangeError
      throw new ExchangeError(fetchExchange);
    }
  }

  /**
   * Internal helper method for making HTTP requests with a specific method.
   *
   * This private method is used by the public HTTP method methods (get, post, etc.)
   * to execute requests with the appropriate HTTP verb.
   *
   * @param method - The HTTP method to use for the request
   * @param url - The URL path for the request
   * @param request - Additional request options
   * @returns Promise that resolves to the HTTP response
   */
  private async methodFetch(
    method: HttpMethod,
    url: string,
    request: FetchRequestInit = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method,
    });
  }

  /**
   * Makes a GET HTTP request.
   *
   * Convenience method for making GET requests. The request body is omitted
   * as GET requests should not contain a body according to HTTP specification.
   *
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @returns Promise that resolves to the HTTP response
   */
  async get(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.GET, url, request);
  }

  /**
   * Makes a POST HTTP request.
   *
   * Convenience method for making POST requests, commonly used for creating resources.
   *
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @returns Promise that resolves to the HTTP response
   */
  async post(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.POST, url, request);
  }

  /**
   * Makes a PUT HTTP request.
   *
   * Convenience method for making PUT requests, commonly used for updating resources.
   *
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @returns Promise that resolves to the HTTP response
   */
  async put(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.PUT, url, request);
  }

  /**
   * Makes a DELETE HTTP request.
   *
   * Convenience method for making DELETE requests, commonly used for deleting resources.
   *
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @returns Promise that resolves to the HTTP response
   */
  async delete(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.DELETE, url, request);
  }

  /**
   * Makes a PATCH HTTP request.
   *
   * Convenience method for making PATCH requests, commonly used for partial updates.
   *
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @returns Promise that resolves to the HTTP response
   */
  async patch(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.PATCH, url, request);
  }

  /**
   * Makes a HEAD HTTP request.
   *
   * Convenience method for making HEAD requests, which retrieve headers only.
   * The request body is omitted as HEAD requests should not contain a body.
   *
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @returns Promise that resolves to the HTTP response
   */
  async head(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.HEAD, url, request);
  }

  /**
   * Makes an OPTIONS HTTP request.
   *
   * Convenience method for making OPTIONS requests, commonly used for CORS preflight.
   * The request body is omitted as OPTIONS requests typically don't contain a body.
   *
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @returns Promise that resolves to the HTTP response
   */
  async options(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.OPTIONS, url, request);
  }
}
