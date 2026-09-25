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

import type {
  Fetcher,
  FetchRequestInit,
  NamedCapable,
  ResultExtractor,
} from '@ahoo-wang/fetcher';
import {
  combineURLs,
  formatUrlParam,
  type FetchExchangeInit,
  getFetcher,
  JsonResultExtractor,
  mergeRecordToMap,
  mergeRequest,
  mergeHeaders,
  setHeader,
  resolveTimeout,
  type RequestHeaders,
  type UrlParams,
  type UrlTemplateResolver,
} from '@ahoo-wang/fetcher';
import type { ApiMetadata } from './apiDecorator.js';
import type { EndpointMetadata } from './endpointDecorator.js';
import type {
  ParameterMetadata,
  ParameterRequest,
} from './parameterDecorator.js';
import { ParameterType } from './parameterDecorator.js';
import { EndpointReturnType } from './endpointReturnTypeCapable.js';

/**
 * RFC 6570 `{name}` path-template placeholders, e.g. `{userId}` in
 * `/users/{userId}`.
 */
/**
 * Warns when a path template placeholder has no path parameter. fetcher then
 * fails with `Missing required path parameter`, unless an interceptor supplies
 * it; the usual cause is a minifier renaming the parameter an unnamed
 * `@path()` inferred its name from.
 */
function warnUnboundPathPlaceholders(
  templatePath: string,
  pathParams: Record<string, unknown>,
  resolver: UrlTemplateResolver,
): void {
  if (!templatePath) return;
  const unbound = resolver
    .extractPathParams(templatePath)
    .filter(name => !(name in pathParams));
  if (unbound.length > 0) {
    console.warn(
      `[fetcher-decorator] Path template "${templatePath}" has placeholder(s) ` +
        `${unbound.join(', ')} with no matching path parameter, so resolving ` +
        `the URL fails unless an interceptor supplies it. ` +
        `This usually means the parameter name was changed by a minifier; ` +
        `pass the name explicitly, e.g. @path('${unbound[0]}').`,
    );
  }
}

/** An object literal or `Object.create(null)`: the only objects spread into keys. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function formatHeader(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value)
    ? value.map(formatUrlParam).join(', ')
    : formatUrlParam(value);
}

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
   * @param parameters - Parameter metadata by argument index
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
    return getFetcher(this.endpoint.fetcher ?? this.api.fetcher);
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
    return resolveTimeout(this.endpoint.timeout, this.api.timeout);
  }

  /**
   * Resolves the result extractor for the request.
   *
   * Returns the result extractor specified in the endpoint metadata, or the API metadata,
   * or falls back to the default JsonResultExtractor if none is specified.
   *
   * @returns The result extractor function to use for processing responses
   */
  resolveResultExtractor(): ResultExtractor<any> {
    return (
      this.endpoint.resultExtractor ||
      this.api.resultExtractor ||
      JsonResultExtractor
    );
  }

  /**
   * Resolves the attributes for the request.
   *
   * Merges attributes from API-level and endpoint-level metadata into a single Map.
   * API-level attributes are applied first, then endpoint-level attributes can override them.
   *
   * @returns A Map containing all resolved attributes for the request
   */
  resolveAttributes(): Map<string, any> {
    const resolvedAttributes = mergeRecordToMap(this.api.attributes);
    return mergeRecordToMap(this.endpoint.attributes, resolvedAttributes);
  }

  /**
   * Resolves the endpoint return type for the request.
   *
   * Returns the return type specified in the endpoint metadata, or the API metadata,
   * or falls back to EndpointReturnType.RESULT if none is specified.
   *
   * @returns The endpoint return type determining what the method should return
   */
  resolveEndpointReturnType(): EndpointReturnType {
    return (
      this.endpoint.returnType ||
      this.api.returnType ||
      EndpointReturnType.RESULT
    );
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
   * //     ...apiHeaders,
   * //     ...endpointHeaders,
   * //     'Authorization': 'Bearer token', // parameters win
   * //   }
   * // }
   * ```
   */
  resolveExchangeInit(
    args: any[],
  ): Required<Pick<FetchExchangeInit, 'request' | 'attributes'>> {
    const pathParams: Record<string, any> = {
      ...this.api.urlParams?.path,
      ...this.endpoint.urlParams?.path,
    };
    const queryParams: Record<string, any> = {
      ...this.api.urlParams?.query,
      ...this.endpoint.urlParams?.query,
    };
    const headers = mergeHeaders(this.api.headers, this.endpoint.headers);
    let body: any = undefined;
    let signal: AbortSignal | null | undefined = undefined;
    let abortController: AbortController | null | undefined = undefined;
    let parameterRequest: ParameterRequest = {};
    const attributes: Map<string, any> = this.resolveAttributes();
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
    // `path` only selects the URL; it is not a fetch option.
    delete mergedRequest.path;
    mergedRequest.url = this.resolvePath(parameterPath);

    // Minify safety: the placeholders of the fetcher's template style against
    // the path parameters after every layer (including @request) merged.
    warnUnboundPathPlaceholders(
      parameterPath || this.endpoint.path || '',
      mergedRequest.urlParams?.path ?? {},
      this.fetcher.urlBuilder.urlTemplateResolver,
    );

    return {
      request: mergedRequest,
      attributes,
    };
  }

  /**
   * Binds a path or query argument. A plain object is spread into its keys
   * (`@query() filter: { status, page }`); anything else, arrays and dates
   * included, is bound to the parameter's name and serialized by fetcher's
   * `UrlBuilder`. Absent values (`undefined`, `null`) are left out.
   */
  private processHttpParam(
    param: ParameterMetadata,
    value: any,
    params: Record<string, any>,
  ) {
    if (value === undefined || value === null) {
      return;
    }
    if (isPlainObject(value)) {
      for (const [key, item] of Object.entries(value)) {
        if (item !== undefined && item !== null) params[key] = item;
      }
      return;
    }
    params[param.name || `param${param.index}`] = value;
  }

  private processPathParam(
    param: ParameterMetadata,
    value: any,
    path: Record<string, any>,
  ) {
    this.processHttpParam(param, value, path);
  }

  private processQueryParam(
    param: ParameterMetadata,
    value: any,
    query: Record<string, any>,
  ) {
    this.processHttpParam(param, value, query);
  }

  /**
   * Binds a header argument: a plain object sets one header per key, any
   * other value the header named after the parameter. An array is sent as a
   * comma-separated list, a date in ISO 8601. An `undefined` or `null` entry
   * of an object removes that header.
   */
  private processHeaderParam(
    param: ParameterMetadata,
    value: any,
    headers: RequestHeaders,
  ) {
    if (value === undefined || value === null) return;
    const entries: [string, unknown][] = isPlainObject(value)
      ? Object.entries(value)
      : [[param.name || `param${param.index}`, value]];
    for (const [name, headerValue] of entries) {
      setHeader(headers, name, formatHeader(headerValue));
    }
  }

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

  /**
   * Binds an attribute argument. An explicitly named one
   * (`@attribute('user')`) stores the value under that name. Otherwise a Map
   * or plain object is merged entry by entry, and any other value is stored
   * under the inferred parameter name.
   */
  private processAttributeParam(
    param: ParameterMetadata,
    value: any,
    attributes: Map<string, any>,
  ) {
    if (value === undefined) return;
    if (param.explicit && param.name) {
      attributes.set(param.name, value);
      return;
    }
    if (value instanceof Map || isPlainObject(value)) {
      mergeRecordToMap(value, attributes);
      return;
    }
    if (param.name) {
      attributes.set(param.name, value);
    }
  }
}
