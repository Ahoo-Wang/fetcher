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

import { UrlBuilder, type UrlBuilderCapable } from './urlBuilder';
import { resolveTimeout, type TimeoutCapable } from './timeout';
import { AttributesCapable, FetchExchange } from './fetchExchange';
import type {
  BaseURLCapable,
  FetchRequest,
  FetchRequestInit,
  RequestHeaders,
  RequestHeadersCapable,
} from './fetchRequest';
import { ContentTypeValues, HttpMethod } from './fetchRequest';
import { InterceptorManager } from './interceptorManager';
import { UrlTemplateStyle } from './urlTemplateResolver';
import { ResultExtractor, ResultExtractorCapable, ResultExtractors } from './resultExtractor';

/**
 * Configuration options for the Fetcher client.
 *
 * Defines the customizable aspects of a Fetcher instance including base URL,
 * default headers, timeout settings, and interceptors.
 *
 * @example
 * ```typescript
 * const options: FetcherOptions = {
 *   urlTemplateStyle: UrlTemplateStyle.UriTemplate,
 *   baseURL: 'https://api.example.com',
 *   headers: { 'Content-Type': 'application/json' },
 *   timeout: 5000,
 *   interceptors: new InterceptorManager()
 * };
 * ```
 */
export interface FetcherOptions
  extends BaseURLCapable,
    RequestHeadersCapable,
    TimeoutCapable {
  urlTemplateStyle?: UrlTemplateStyle;
  interceptors?: InterceptorManager;
}

const DEFAULT_HEADERS: RequestHeaders = {
  'Content-Type': ContentTypeValues.APPLICATION_JSON,
};

export const DEFAULT_OPTIONS: FetcherOptions = {
  baseURL: '',
  headers: DEFAULT_HEADERS,
};


export interface RequestOptions extends AttributesCapable, ResultExtractorCapable {
}


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
  implements UrlBuilderCapable, RequestHeadersCapable, TimeoutCapable {
  readonly urlBuilder: UrlBuilder;
  readonly headers?: RequestHeaders = DEFAULT_HEADERS;
  readonly timeout?: number;
  readonly interceptors: InterceptorManager;

  /**
   * Initializes a new Fetcher instance with optional configuration.
   *
   * Creates a Fetcher with default settings that can be overridden through the options parameter.
   * If no interceptors are provided, a default set of interceptors will be used.
   *
   * @param options - Configuration options for the Fetcher instance
   */
  constructor(options: FetcherOptions = DEFAULT_OPTIONS) {
    this.urlBuilder = new UrlBuilder(options.baseURL, options.urlTemplateStyle);
    this.headers = options.headers ?? DEFAULT_HEADERS;
    this.timeout = options.timeout;
    this.interceptors = options.interceptors ?? new InterceptorManager();
  }

  /**
   * Processes an HTTP request through the Fetcher's internal workflow.
   *
   * This method prepares the request by merging headers and timeout settings,
   * creates a FetchExchange object, and passes it through the exchange method
   * for interceptor processing.
   *
   * @param request - Complete request configuration object
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the extracted result based on resultExtractor
   * @throws Error if an unhandled error occurs during request processing
   */
  async request<R = FetchExchange>(
    request: FetchRequest,
    options: RequestOptions = { resultExtractor: ResultExtractors.Exchange, attributes: new Map() },
  ): Promise<R> {
    // Merge default headers and request-level headers. defensive copy
    const mergedHeaders = {
      ...this.headers,
      ...request.headers,
    };
    // Merge request options
    const fetchRequest: FetchRequest = {
      ...request,
      headers: mergedHeaders,
      timeout: resolveTimeout(request.timeout, this.timeout),
    };
    const { resultExtractor, attributes } = options;
    const exchange: FetchExchange = new FetchExchange({
      fetcher: this,
      request: fetchRequest,
      resultExtractor,
      attributes,
    });
    await this.interceptors.exchange(exchange);
    return exchange.extractResult();
  }

  /**
   * Executes an HTTP request with the specified URL and options.
   *
   * This is the primary method for making HTTP requests. It processes the request
   * through the interceptor chain and returns the resulting Response.
   *
   * @param url - The URL path for the request (relative to baseURL if set)
   * @param request - Request configuration including headers, body, parameters, etc.
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.

   * @returns Promise that resolves to the HTTP response
   * @throws FetchError if the request fails and no response is generated
   */
  async fetch<R = Response>(
    url: string,
    request: FetchRequestInit = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    const fetchRequest = request as FetchRequest;
    fetchRequest.url = url;
    return this.request(fetchRequest, options);
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
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  private async methodFetch<R = Response>(
    method: HttpMethod,
    url: string,
    request: FetchRequestInit = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    return this.fetch(
      url,
      {
        ...request,
        method,
      },
      options,
    );
  }

  /**
   * Makes a GET HTTP request.
   *
   * Convenience method for making GET requests. The request body is omitted
   * as GET requests should not contain a body according to HTTP specification.
   *
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async get<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    return this.methodFetch(HttpMethod.GET, url, request, options);
  }

  /**
   * Makes a POST HTTP request.
   *
   * Convenience method for making POST requests, commonly used for creating resources.
   *
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async post<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    return this.methodFetch(HttpMethod.POST, url, request, options);
  }

  /**
   * Makes a PUT HTTP request.
   *
   * Convenience method for making PUT requests, commonly used for updating resources.
   *
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async put<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    return this.methodFetch(HttpMethod.PUT, url, request, options);
  }

  /**
   * Makes a DELETE HTTP request.
   *
   * Convenience method for making DELETE requests, commonly used for deleting resources.
   *
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async delete<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    return this.methodFetch(HttpMethod.DELETE, url, request, options);
  }

  /**
   * Makes a PATCH HTTP request.
   *
   * Convenience method for making PATCH requests, commonly used for partial updates.
   *
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async patch<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    return this.methodFetch(HttpMethod.PATCH, url, request, options);
  }

  /**
   * Makes a HEAD HTTP request.
   *
   * Convenience method for making HEAD requests, which retrieve headers only.
   * The request body is omitted as HEAD requests should not contain a body.
   *
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async head<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    return this.methodFetch(HttpMethod.HEAD, url, request, options);
  }

  /**
   * Makes an OPTIONS HTTP request.
   *
   * Convenience method for making OPTIONS requests, commonly used for CORS preflight.
   * The request body is omitted as OPTIONS requests typically don't contain a body.
   *
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @param resultExtractor - Function to extract the desired result from the exchange.
   *                          Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param attributes - Optional shared attributes that can be accessed by interceptors
   *                     throughout the request lifecycle. These attributes allow passing
   *                     custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async options<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
    options: RequestOptions = { resultExtractor: ResultExtractors.Response, attributes: new Map() },
  ): Promise<R> {
    return this.methodFetch(HttpMethod.OPTIONS, url, request, options);
  }
}
