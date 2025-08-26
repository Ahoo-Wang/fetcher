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
import { FetchExchange } from './fetchExchange';
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
 * Fetcher configuration options interface
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
 * HTTP client class that supports URL building, timeout control, and more
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
  implements UrlBuilderCapable, RequestHeadersCapable, TimeoutCapable {
  urlBuilder: UrlBuilder;
  headers?: RequestHeaders = DEFAULT_HEADERS;
  timeout?: number;
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
   * Send an HTTP request
   *
   * @param request - Request configuration object, including url, method, headers, body, etc.
   * @returns Promise that resolves to a FetchExchange object containing request and response information
   *
   * @throws Throws an exception when an error occurs during the request and is not handled by error interceptors
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
   * Process a fetch exchange through the interceptor chain
   *
   * This method orchestrates the complete request lifecycle by applying interceptors
   * in the following order:
   * 1. Request interceptors - to modify the outgoing request
   * 2. Response interceptors - to process the incoming response
   *
   * If any error occurs during the process, error interceptors are applied to handle it.
   * If an error interceptor produces a response, that response is returned. Otherwise,
   * the original error is re-thrown.
   *
   * @param fetchExchange - The exchange object containing request, response, and metadata
   * @returns Promise<FetchExchange> The processed exchange with final response or error
   * @throws Error if an error occurs and is not handled by error interceptors
   */
  async exchange(fetchExchange: FetchExchange): Promise<FetchExchange> {
    try {
      // Apply request interceptors
      await this.interceptors.request.intercept(fetchExchange);
      // Apply response interceptors
      await this.interceptors.response.intercept(fetchExchange);
      return fetchExchange;
    } catch (error) {
      // Apply error interceptors
      fetchExchange.error = error;
      await this.interceptors.error.intercept(fetchExchange);
      if (fetchExchange.hasResponse()) {
        return fetchExchange;
      }
      throw fetchExchange.error;
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
    request: FetchRequestInit = {},
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
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
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
    request: Omit<FetchRequestInit, 'method'> = {},
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
    request: Omit<FetchRequestInit, 'method'> = {},
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
    request: Omit<FetchRequestInit, 'method'> = {},
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
    request: Omit<FetchRequestInit, 'method'> = {},
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
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
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
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
  ): Promise<Response> {
    return this.methodFetch(HttpMethod.OPTIONS, url, request);
  }
}
