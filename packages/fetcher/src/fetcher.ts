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

import { UrlBuilder } from './urlBuilder';
import { FetchTimeoutError, resolveTimeout, TimeoutCapable } from './timeout';
import {
  BaseURLCapable,
  ContentTypeHeader,
  ContentTypeValues,
  HeadersCapable,
  HttpMethod,
  RequestField,
} from './types';
import { FetcherInterceptors, FetchExchange } from './interceptor';

/**
 * Fetcher configuration options interface
 */
export interface FetcherOptions
  extends BaseURLCapable,
    HeadersCapable,
    TimeoutCapable {
  interceptors?: FetcherInterceptors;
}

const DEFAULT_HEADERS: Record<string, string> = {
  [ContentTypeHeader]: ContentTypeValues.APPLICATION_JSON,
};

export const DEFAULT_OPTIONS: FetcherOptions = {
  baseURL: '',
  headers: DEFAULT_HEADERS,
};

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
 * HTTP client class that supports URL building, timeout control, and more
 *
 * @example
 * const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
 * const response = await fetcher.fetch('/users/{id}', {
 *   pathParams: { id: 123 },
 *   queryParams: { filter: 'active' },
 *   timeout: 5000
 * });
 */
export class Fetcher implements HeadersCapable, TimeoutCapable {
  headers?: Record<string, string> = DEFAULT_HEADERS;
  timeout?: number;
  private urlBuilder: UrlBuilder;
  interceptors: FetcherInterceptors;

  /**
   * Create a Fetcher instance
   *
   * @param options - Fetcher configuration options
   */
  constructor(options: FetcherOptions = DEFAULT_OPTIONS) {
    this.urlBuilder = new UrlBuilder(options.baseURL);
    this.headers = options.headers ?? DEFAULT_HEADERS;
    this.timeout = options.timeout;
    this.interceptors = options.interceptors ?? new FetcherInterceptors();
  }

  /**
   * Make an HTTP request
   *
   * @param url - Request URL path
   * @param request - Request options, including path parameters, query parameters, etc.
   * @returns Promise<Response> HTTP response
   */
  async fetch(url: string, request: FetcherRequest = {}): Promise<Response> {
    const exchange = await this.request(url, request);
    if (!exchange.response) {
      throw new Error(`Request to ${exchange.url} failed with no response`);
    }
    return exchange.response;
  }

  /**
   * Send an HTTP request
   *
   * @param url - Request URL address, supports path parameter placeholders
   * @param request - Request configuration object, including method, headers, body, etc.
   * @returns Promise that resolves to a FetchExchange object containing request and response information
   *
   * @throws Throws an exception when an error occurs during the request and is not handled by error interceptors
   */
  async request(
    url: string,
    request: FetcherRequest = {},
  ): Promise<FetchExchange> {
    // Merge default headers and request-level headers
    const mergedHeaders = {
      ...(this.headers || {}),
      ...(request.headers || {}),
    };
    // Merge request options
    const fetchRequest: FetcherRequest = {
      ...request,
      headers:
        Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
    };
    const finalUrl = this.urlBuilder.build(url, request.path, request.query);
    let exchange: FetchExchange = {
      fetcher: this,
      url: finalUrl,
      request: fetchRequest,
      response: undefined,
      error: undefined,
    };
    try {
      // Apply request interceptors
      const requestExchange = {
        ...exchange,
      };
      exchange = await this.interceptors.request.intercept(requestExchange);
      exchange.response = await this.timeoutFetch(exchange);
      // Apply response interceptors
      const responseExchange = {
        ...exchange,
      };
      exchange = await this.interceptors.response.intercept(responseExchange);
      return exchange;
    } catch (error) {
      // Apply error interceptors
      exchange.error = error;
      exchange = await this.interceptors.error.intercept(exchange);
      if (exchange.response) {
        return exchange;
      }
      throw exchange.error;
    }
  }

  /**
   * HTTP request method with timeout control
   *
   * This method uses Promise.race to implement timeout control, initiating both
   * fetch request and timeout Promise simultaneously. When either Promise completes,
   * it returns the result or throws an exception.
   *
   * @param exchange - The exchange containing request information
   * @returns Promise<Response> HTTP response Promise
   * @throws FetchTimeoutError Thrown when the request times out
   */
  private async timeoutFetch(exchange: FetchExchange) {
    // Extract timeout from request
    const url = exchange.url;
    const request = exchange.request;
    const requestTimeout = request.timeout;
    const timeout = resolveTimeout(requestTimeout, this.timeout);
    if (!timeout) {
      return fetch(url, request as RequestInit);
    }

    const controller = new AbortController();
    // Create a new request object to avoid modifying the original request object
    const fetchRequest = {
      ...request,
      signal: controller.signal,
    };

    let timerId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<Response>((_, reject) => {
      timerId = setTimeout(() => {
        // Clean up timer resources and handle timeout error
        if (timerId) {
          clearTimeout(timerId);
        }
        const error = new FetchTimeoutError(exchange, timeout);
        controller.abort(error);
        reject(error);
      }, timeout);
    });

    try {
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

  /**
   * Make an HTTP request with the specified method
   *
   * @param method - HTTP method to use
   * @param url - Request URL path
   * @param request - Request options
   * @returns Promise<Response> HTTP response
   */
  private async methodFetch(
    method: HttpMethod,
    url: string,
    request: FetcherRequest = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method,
    });
  }

  /**
   * Make a GET request
   *
   * @param url - Request URL path
   * @param request - Request options, including path parameters, query parameters, etc.
   * @returns Promise<Response> HTTP response
   */
  async get(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD | RequestField.BODY> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.GET, url, request);
  }

  /**
   * Make a POST request
   *
   * @param url - Request URL path
   * @param request - Request options, including path parameters, query parameters, request body, etc.
   * @returns Promise<Response> HTTP response
   */
  async post(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.POST, url, request);
  }

  /**
   * Make a PUT request
   *
   * @param url - Request URL path
   * @param request - Request options, including path parameters, query parameters, request body, etc.
   * @returns Promise<Response> HTTP response
   */
  async put(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.PUT, url, request);
  }

  /**
   * Make a DELETE request
   *
   * @param url - Request URL path
   * @param request - Request options, including path parameters, query parameters, etc.
   * @returns Promise<Response> HTTP response
   */
  async delete(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.DELETE, url, request);
  }

  /**
   * Make a PATCH request
   *
   * @param url - Request URL path
   * @param request - Request options, including path parameters, query parameters, request body, etc.
   * @returns Promise<Response> HTTP response
   */
  async patch(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.PATCH, url, request);
  }

  /**
   * Make a HEAD request
   *
   * @param url - Request URL path
   * @param request - Request options, including path parameters, query parameters, etc.
   * @returns Promise<Response> HTTP response
   */
  async head(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD | RequestField.BODY> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.HEAD, url, request);
  }

  /**
   * Make an OPTIONS request
   *
   * @param url - Request URL path
   * @param request - Request options, including path parameters, query parameters, etc.
   * @returns Promise<Response> HTTP response
   */
  async options(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD | RequestField.BODY> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.OPTIONS, url, request);
  }
}
