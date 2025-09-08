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

import {
  combineURLs,
  Fetcher, fetcher,
  type FetchExchangeInit,
  FetchRequestInit,
  mergeRequest,
  NamedCapable,
  type RequestHeaders,
  ResultExtractor,
  type UrlParams,
} from '@ahoo-wang/fetcher';
import { ApiMetadata } from './apiDecorator';
import { EndpointMetadata } from './endpointDecorator';
import { ParameterMetadata, ParameterRequest, ParameterType } from './parameterDecorator';
import { getFetcher } from './fetcherCapable';
import { ResultExtractors } from './resultExtractor';

/**
 * Metadata container for a function with HTTP endpoint decorators.
 *
 * Encapsulates all the metadata needed to execute an HTTP request
 * for a decorated method, including API-level defaults, endpoint-specific
 * configuration, and parameter metadata.
 */
export class FunctionMetadata implements NamedCapable {
  /**
   * Name of the function.
   */
  name: string;

  /**
   * API-level metadata (class-level configuration).
   */
  api: ApiMetadata;

  /**
   * Endpoint-level metadata (method-level configuration).
   */
  endpoint: EndpointMetadata;

  /**
   * Metadata for method parameters.
   *
   * Defines the metadata stored for each parameter decorated with @path, @query,
   * @header, or @body decorators. Stored as a Map keyed by parameter index.
   *
   * @remarks
   * The metadata is stored as a Map<number, ParameterMetadata> where the key is
   * the parameter index and the value is the parameter metadata. This ensures
   * correct parameter ordering regardless of decorator application order.
   */
  parameters: Map<number, ParameterMetadata>;

  /**
   * Creates a new FunctionMetadata instance.
   *
   * @param name - The name of the function
   * @param api - API-level metadata
   * @param endpoint - Endpoint-level metadata
   * @param parameters - Parameter metadata array
   */
  constructor(
    name: string,
    api: ApiMetadata,
    endpoint: EndpointMetadata,
    parameters: Map<number, ParameterMetadata>,
  ) {
    this.name = name;
    this.api = api;
    this.endpoint = endpoint;
    this.parameters = parameters;
  }

  /**
   * Gets the fetcher instance to use for this function.
   *
   * Returns the fetcher specified in the endpoint metadata, or the API metadata,
   * or falls back to the default fetcher if none is specified.
   *
   * @returns The fetcher instance
   */
  get fetcher(): Fetcher {
    return getFetcher(this.endpoint.fetcher ?? this.api.fetcher) ?? fetcher;
  }

  /**
   * Resolves the complete path by combining base path and endpoint path
   *
   * @param parameterPath - Optional path parameter to use instead of endpoint path
   * @returns The combined URL path
   */
  resolvePath(parameterPath?: string): string {
    // Get the base path from endpoint, API, or default to empty string
    const basePath = this.endpoint.basePath || this.api.basePath || '';

    // Use provided parameter path or fallback to endpoint path
    const endpointPath = parameterPath || this.endpoint.path || '';

    // Combine the base path and endpoint path into a complete URL
    return combineURLs(basePath, endpointPath);
  }

  /**
   * Resolves the timeout for the request.
   *
   * Returns the timeout specified in the endpoint metadata, or the API metadata,
   * or undefined if no timeout is specified.
   *
   * @returns The timeout value in milliseconds, or undefined
   */
  resolveTimeout(): number | undefined {
    return this.endpoint.timeout || this.api.timeout;
  }

  resolveResultExtractor(): ResultExtractor<any> {
    return (
      this.endpoint.resultExtractor ||
      this.api.resultExtractor ||
      ResultExtractors.DEFAULT
    );
  }

  resolveAttributes(): Record<string, any> {
    return {
      ...this.api.attributes,
      ...this.endpoint.attributes,
    };
  }

  /**
   * Resolves the request configuration from the method arguments.
   *
   * This method processes the runtime arguments according to the parameter metadata
   * and constructs a FetcherRequest object with path parameters, query parameters,
   * headers, body, and timeout. It handles various parameter types including:
   * - Path parameters (@path decorator)
   * - Query parameters (@query decorator)
   * - Header parameters (@header decorator)
   * - Body parameter (@body decorator)
   * - Complete request object (@request decorator)
   * - AbortSignal for request cancellation
   *
   * The method uses mergeRequest to combine the endpoint-specific configuration
   * with the parameter-provided request object, where the parameter request
   * takes precedence over endpoint configuration.
   *
   * @param args - The runtime arguments passed to the method
   * @returns A FetcherRequest object with all request configuration
   *
   * @example
   * ```typescript
   * // For a method decorated like:
   * @get('/users/{id}')
   * getUser(
   *   @path('id') id: number,
   *   @query('include') include: string,
   *   @header('Authorization') auth: string
   * ): Promise<Response>
   *
   * // Calling with: getUser(123, 'profile', 'Bearer token')
   * // Would produce a request with:
   * // {
   * //   method: 'GET',
   * //   urlParams: {
   * //     path: { id: 123 },
   * //     query: { include: 'profile' }
   * //   },
   * //   headers: {
   * //     'Authorization': 'Bearer token',
   * //     ...apiHeaders,
   * //     ...endpointHeaders
   * //   }
   * // }
   * ```
   */
  resolveExchangeInit(args: any[]): Required<Pick<FetchExchangeInit, 'request' | 'attributes'>> {
    const pathParams: Record<string, any> = {};
    const queryParams: Record<string, any> = {};
    const headers: RequestHeaders = {
      ...this.api.headers,
      ...this.endpoint.headers,
    };
    let body: any = undefined;
    let signal: AbortSignal | null | undefined = undefined;
    let abortController: AbortController | null | undefined = undefined;
    let parameterRequest: ParameterRequest = {};
    const attributes: Record<string, any> = this.resolveAttributes();
    // Process parameters based on their decorators
    args.forEach((value, index) => {
      if (value instanceof AbortSignal) {
        signal = value;
        return;
      }
      if (value instanceof AbortController) {
        abortController = value;
        return;
      }
      const funParameter = this.parameters.get(index);
      if (!funParameter) {
        return;
      }
      switch (funParameter.type) {
        case ParameterType.PATH:
          this.processPathParam(funParameter, value, pathParams);
          break;
        case ParameterType.QUERY:
          this.processQueryParam(funParameter, value, queryParams);
          break;
        case ParameterType.HEADER:
          this.processHeaderParam(funParameter, value, headers);
          break;
        case ParameterType.BODY:
          body = value;
          break;
        case ParameterType.REQUEST:
          parameterRequest = this.processRequestParam(value);
          break;
        case ParameterType.ATTRIBUTE:
          this.processAttributeParam(funParameter, value, attributes);
          break;
        case ParameterType.ATTRIBUTES:
          this.processAttributesParam(value, attributes);
          break;
      }
    });
    const urlParams: UrlParams = {
      path: pathParams,
      query: queryParams,
    };
    const endpointRequest: FetchRequestInit = {
      method: this.endpoint.method,
      urlParams,
      headers,
      body,
      timeout: this.resolveTimeout(),
      signal,
      abortController,
    };
    const mergedRequest = mergeRequest(
      endpointRequest,
      parameterRequest,
    ) as any;
    const parameterPath = parameterRequest.path;
    mergedRequest.url = this.resolvePath(parameterPath);
    return {
      request: mergedRequest,
      attributes,
    };
  }

  private processPathParam(
    param: ParameterMetadata,
    value: any,
    path: Record<string, any>,
  ) {
    const paramName = param.name || `param${param.index}`;
    path[paramName] = value;
  }

  private processQueryParam(
    param: ParameterMetadata,
    value: any,
    query: Record<string, any>,
  ) {
    const paramName = param.name || `param${param.index}`;
    query[paramName] = value;
  }

  private processHeaderParam(
    param: ParameterMetadata,
    value: any,
    headers: RequestHeaders,
  ) {
    if (param.name && value !== undefined) {
      headers[param.name] = String(value);
    }
  }

  /**
   * Processes a request parameter value.
   *
   * This method handles the @request() decorator parameter by casting
   * the provided value to a FetcherRequest. The @request() decorator
   * allows users to pass a complete FetcherRequest object to customize
   * the request configuration.
   *
   * @param value - The value provided for the @request() parameter
   * @returns The value cast to FetcherRequest type
   *
   * @example
   * ```typescript
   * @post('/users')
   * createUsers(@request() request: FetcherRequest): Promise<Response>
   *
   * // Usage:
   * const customRequest: FetcherRequest = {
   *   headers: { 'X-Custom': 'value' },
   *   timeout: 5000
   * };
   * await service.createUsers(customRequest);
   * ```
   */
  private processRequestParam(value: any): ParameterRequest {
    if (!value) {
      return {};
    }

    const request = value as ParameterRequest;
    // 确保请求对象中的属性被正确保留
    return {
      ...request,
      headers: request.headers || {},
      urlParams: request.urlParams || { path: {}, query: {} },
    };
  }


  private processAttributeParam(
    param: ParameterMetadata,
    value: any,
    attributes: Record<string, any>,
  ) {
    if (param.name && value !== undefined) {
      attributes[param.name] = value;
    }
  }

  private processAttributesParam(
    value: any,
    attributes: Record<string, any>,
  ) {
    if (typeof value !== 'object') {
      throw new Error('@attributes() parameter must be an object');
    }
    Object.keys(value).forEach(key => {
      attributes[key] = value[key];
    });
  }

}