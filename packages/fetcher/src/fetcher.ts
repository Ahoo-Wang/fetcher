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
import { BaseURLCapable, ContentTypeHeader, ContentTypeValues, HeadersCapable, HttpMethod } from './types';
import { FetcherInterceptors } from './interceptor';
import { FetcherRequest, FetchExchange, RequestField } from './fetchExchange';

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
export class Fetcher implements UrlBuilderCapable, HeadersCapable, TimeoutCapable {
  urlBuilder: UrlBuilder;
  headers?: Record<string, string> = DEFAULT_HEADERS;
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
      timeout: resolveTimeout(request.timeout, this.timeout),
    };
    const exchange: FetchExchange = {
      fetcher: this,
      url: url,
      request: fetchRequest,
      response: undefined,
      error: undefined,
      attributes: {},
    };
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
      fetchExchange = await this.interceptors.request.intercept(fetchExchange);
      // Apply response interceptors
      fetchExchange = await this.interceptors.response.intercept(fetchExchange);
      return fetchExchange;
    } catch (error) {
      // Apply error interceptors
      fetchExchange.error = error;
      fetchExchange = await this.interceptors.error.intercept(fetchExchange);
      if (fetchExchange.response) {
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
