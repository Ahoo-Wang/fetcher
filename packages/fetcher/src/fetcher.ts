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
import {
  BaseURLCapable,
  CONTENT_TYPE_HEADER,
  ContentTypeValues,
  FetchRequest,
  FetchRequestInit,
  RequestHeaders,
  RequestHeadersCapable,
} from './fetchRequest';
import { HttpMethod } from './fetchRequest';
import { InterceptorManager } from './interceptorManager';
import { UrlTemplateStyle } from './urlTemplateResolver';
import { ResultExtractorCapable, ResultExtractors } from './resultExtractor';
import { mergeRequestOptions } from './mergeRequest';

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
  /**
   * The style of URL template to use for URL parameter interpolation.
   * @default UrlTemplateStyle.Path
   */
  urlTemplateStyle?: UrlTemplateStyle;

  /**
   * The interceptor manager to use for request/response processing.
   * @default new InterceptorManager()
   */
  interceptors?: InterceptorManager;
}

const DEFAULT_HEADERS: RequestHeaders = {
  [CONTENT_TYPE_HEADER]: ContentTypeValues.APPLICATION_JSON,
};

export const DEFAULT_OPTIONS: FetcherOptions = {
  baseURL: '',
  headers: DEFAULT_HEADERS,
};

/**
 * Options for individual requests.
 */
export interface RequestOptions
  extends AttributesCapable,
    ResultExtractorCapable {}

export const DEFAULT_REQUEST_OPTIONS: RequestOptions = {
  resultExtractor: ResultExtractors.Exchange,
};
export const DEFAULT_FETCH_OPTIONS: RequestOptions = {
  resultExtractor: ResultExtractors.Response,
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
   * @param options.baseURL - The base URL to prepend to all requests. Defaults to empty string.
   * @param options.headers - Default headers to include in all requests. Defaults to JSON content type.
   * @param options.timeout - Default timeout for requests in milliseconds. No timeout by default.
   * @param options.urlTemplateStyle - Style for URL template parameter interpolation.
   * @param options.interceptors - Interceptor manager for processing requests and responses.
   */
  constructor(options: FetcherOptions = DEFAULT_OPTIONS) {
    this.urlBuilder = new UrlBuilder(options.baseURL, options.urlTemplateStyle);
    this.headers = options.headers ?? DEFAULT_HEADERS;
    this.timeout = options.timeout;
    this.interceptors = options.interceptors ?? new InterceptorManager();
  }

  /**
   * Resolves a FetchRequest and RequestOptions into a FetchExchange object.
   *
   * This internal method prepares a complete FetchExchange by merging headers,
   * resolving timeout settings, and combining request options. It serves as the
   * preparation step before passing the exchange through the interceptor chain.
   *
   * The resolution process includes:
   * - Merging default headers with request-level headers (request headers take precedence)
   * - Resolving timeout settings (request timeout takes precedence over fetcher timeout)
   * - Merging request options with defaults
   * - Creating the final FetchExchange object with all resolved configuration
   *
   * @param request - The HTTP request configuration to resolve
   * @param options - Optional request options including result extractor and attributes
   * @returns A new FetchExchange object with fully resolved configuration
   *
   * @internal This method is used internally by the exchange method and should not
   *           be called directly by external consumers.
   */
  resolveExchange(request: FetchRequest, options?: RequestOptions) {
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
    const { resultExtractor, attributes } = mergeRequestOptions(
      DEFAULT_REQUEST_OPTIONS,
      options,
    );
    return new FetchExchange({
      fetcher: this,
      request: fetchRequest,
      resultExtractor,
      attributes,
    });
  }

  /**
   * Processes an HTTP request through the Fetcher's internal workflow.
   *
   * This method creates a FetchExchange object and passes it through the interceptor chain.
   * It handles header merging, timeout resolution, and result extractor configuration.
   *
   * @param request - The HTTP request configuration to process
   * @param options - Optional request options including result extractor and attributes
   * @returns Promise that resolves to the processed FetchExchange object
   */
  async exchange(
    request: FetchRequest,
    options?: RequestOptions,
  ): Promise<FetchExchange> {
    const exchange = this.resolveExchange(request, options);
    return await this.interceptors.exchange(exchange);
  }

  /**
   * Processes an HTTP request through the Fetcher's internal workflow.
   *
   * This method prepares the request by merging headers and timeout settings,
   * creates a FetchExchange object, and passes it through the exchange method
   * for interceptor processing.
   *
   * @template R - The type of the result to be returned
   * @param request - Complete request configuration object
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ExchangeResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the extracted result based on resultExtractor
   * @throws Error if an unhandled error occurs during request processing
   */
  async request<R = FetchExchange>(
    request: FetchRequest,
    options?: RequestOptions,
  ): Promise<R> {
    const fetchExchange = await this.exchange(request, options);
    return await fetchExchange.extractResult();
  }

  /**
   * Executes an HTTP request with the specified URL and options.
   *
   * This is the primary method for making HTTP requests. It processes the request
   * through the interceptor chain and returns the resulting Response.
   *
   * @template R - The type of the result to be returned
   * @param url - The URL path for the request (relative to baseURL if set)
   * @param request - Request configuration including headers, body, parameters, etc.
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   * @throws FetchError if the request fails and no response is generated
   */
  async fetch<R = Response>(
    url: string,
    request: FetchRequestInit = {},
    options?: RequestOptions,
  ): Promise<R> {
    const mergedRequest: FetchRequest = {
      ...request,
      url,
    };
    return await this.request(
      mergedRequest,
      mergeRequestOptions(DEFAULT_FETCH_OPTIONS, options),
    );
  }

  /**
   * Internal helper method for making HTTP requests with a specific method.
   *
   * This private method is used by the public HTTP method methods (get, post, etc.)
   * to execute requests with the appropriate HTTP verb.
   *
   * @template R - The type of the result to be returned
   * @param method - The HTTP method to use for the request
   * @param url - The URL path for the request
   * @param request - Additional request options
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  private async methodFetch<R = Response>(
    method: HttpMethod,
    url: string,
    request: FetchRequestInit = {},
    options?: RequestOptions,
  ): Promise<R> {
    const mergedRequest: FetchRequest = {
      ...request,
      url,
      method,
    };
    return await this.request(
      mergedRequest,
      mergeRequestOptions(DEFAULT_FETCH_OPTIONS, options),
    );
  }

  /**
   * Makes a GET HTTP request.
   *
   * Convenience method for making GET requests. The request body is omitted
   * as GET requests should not contain a body according to HTTP specification.
   *
   * @template R - The type of the result to be returned
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async get<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
    options?: RequestOptions,
  ): Promise<R> {
    return await this.methodFetch(HttpMethod.GET, url, request, options);
  }

  /**
   * Makes a PUT HTTP request.
   *
   * Convenience method for making PUT requests, commonly used for updating resources.
   *
   * @template R - The type of the result to be returned
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async put<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
    options?: RequestOptions,
  ): Promise<R> {
    return await this.methodFetch(HttpMethod.PUT, url, request, options);
  }

  /**
   * Makes a POST HTTP request.
   *
   * Convenience method for making POST requests, commonly used for creating resources.
   *
   * @template R - The type of the result to be returned
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async post<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
    options?: RequestOptions,
  ): Promise<R> {
    return await this.methodFetch(HttpMethod.POST, url, request, options);
  }

  /**
   * Makes a PATCH HTTP request.
   *
   * Convenience method for making PATCH requests, commonly used for partial updates.
   *
   * @template R - The type of the result to be returned
   * @param url - The URL path for the request
   * @param request - Request options including body and other parameters
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async patch<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
    options?: RequestOptions,
  ): Promise<R> {
    return await this.methodFetch(HttpMethod.PATCH, url, request, options);
  }

  /**
   * Makes a DELETE HTTP request.
   *
   * Convenience method for making DELETE requests, commonly used for deleting resources.
   *
   * @template R - The type of the result to be returned
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async delete<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method'> = {},
    options?: RequestOptions,
  ): Promise<R> {
    return await this.methodFetch(HttpMethod.DELETE, url, request, options);
  }

  /**
   * Makes a HEAD HTTP request.
   *
   * Convenience method for making HEAD requests, which retrieve headers only.
   * The request body is omitted as HEAD requests should not contain a body.
   *
   * @template R - The type of the result to be returned
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async head<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
    options?: RequestOptions,
  ): Promise<R> {
    return await this.methodFetch(HttpMethod.HEAD, url, request, options);
  }

  /**
   * Makes an OPTIONS HTTP request.
   *
   * Convenience method for making OPTIONS requests, commonly used for CORS preflight.
   * The request body is omitted as OPTIONS requests typically don't contain a body.
   *
   * @template R - The type of the result to be returned
   * @param url - The URL path for the request
   * @param request - Request options excluding method and body
   * @param options - Request options including result extractor and attributes
   * @param options.resultExtractor - Function to extract the desired result from the exchange.
   *                                  Defaults to ResponseResultExtractor which returns the entire exchange object.
   * @param options.attributes - Optional shared attributes that can be accessed by interceptors
   *                             throughout the request lifecycle. These attributes allow passing
   *                             custom data between different interceptors.
   * @returns Promise that resolves to the HTTP response
   */
  async options<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
    options?: RequestOptions,
  ): Promise<R> {
    return await this.methodFetch(HttpMethod.OPTIONS, url, request, options);
  }

  /**
   * Sends an HTTP TRACE request to the specified URL and returns the response.
   *
   * The TRACE method is used to echo the received request for debugging purposes.
   * This method automatically sets the HTTP method to TRACE and omits the request body
   * since TRACE requests must not have a body according to the HTTP specification.
   *
   * @param url - The target URL for the TRACE request. Must be a valid absolute or relative URL.
   * @param request - Request configuration options excluding 'method' and 'body' properties.
   *                  Defaults to an empty object. Common properties include headers, cache settings, etc.
   * @param options - Optional additional request parameters for extended functionality.
   *                  May include custom handling logic or metadata for the request pipeline.
   * @returns A Promise resolving to the response object of type R (defaults to Response).
   *          The response contains status, headers, and body data from the TRACE request.
   */
  async trace<R = Response>(
    url: string,
    request: Omit<FetchRequestInit, 'method' | 'body'> = {},
    options?: RequestOptions,
  ): Promise<R> {
    return await this.methodFetch(HttpMethod.TRACE, url, request, options);
  }
}
