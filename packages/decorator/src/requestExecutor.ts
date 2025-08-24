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
  DEFAULT_FETCHER_NAME,
  Fetcher,
  fetcherRegistrar,
  FetcherRequest,
  NamedCapable,
} from '@ahoo-wang/fetcher';
import { ApiMetadata } from './apiDecorator';
import { EndpointMetadata } from './endpointDecorator';
import { ParameterMetadata, ParameterType } from './parameterDecorator';

/**
 * Metadata container for a function with HTTP endpoint decorators
 *
 * This class encapsulates all the metadata needed to execute an HTTP request
 * for a decorated method, including API-level defaults, endpoint-specific
 * configuration, and parameter metadata.
 */
export class FunctionMetadata implements NamedCapable {
  /**
   * Name of the function
   */
  name: string;

  /**
   * API-level metadata (class-level configuration)
   */
  api: ApiMetadata;

  /**
   * Endpoint-level metadata (method-level configuration)
   */
  endpoint: EndpointMetadata;

  /**
   * Parameter metadata for all decorated parameters
   */
  parameters: ParameterMetadata[];

  /**
   * Creates a new FunctionMetadata instance
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
    parameters: ParameterMetadata[],
  ) {
    this.name = name;
    this.api = api;
    this.endpoint = endpoint;
    this.parameters = parameters;
  }

  /**
   * Gets the fetcher instance to use for this function
   *
   * Returns the fetcher specified in the endpoint metadata, or the API metadata,
   * or falls back to the default fetcher if none is specified.
   *
   * @returns The fetcher instance
   */
  get fetcher(): Fetcher {
    const fetcherName =
      this.endpoint.fetcher || this.api.fetcher || DEFAULT_FETCHER_NAME;
    return fetcherRegistrar.requiredGet(fetcherName);
  }

  /**
   * Resolves the request configuration from the method arguments
   *
   * This method processes the runtime arguments according to the parameter metadata
   * and constructs a FetcherRequest object with path parameters, query parameters,
   * headers, body, and timeout.
   *
   * @param args - The runtime arguments passed to the method
   * @returns A FetcherRequest object with all request configuration
   */
  resolveRequest(args: any[]): FetcherRequest {
    const path: Record<string, any> = {};
    const query: Record<string, any> = {};
    const headers: Record<string, string> = {
      ...this.api.headers,
      ...this.endpoint.headers,
    };
    let body: any = null;
    // Process parameters based on their decorators
    this.parameters.forEach(param => {
      const value = args[param.index];
      switch (param.type) {
        case ParameterType.PATH:
          if (param.name) {
            path[param.name] = value;
          } else {
            // If no name specified, use as default path param
            path['param' + param.index] = value;
          }
          break;
        case ParameterType.QUERY:
          if (param.name) {
            query[param.name] = value;
          } else {
            query['param' + param.index] = value;
          }
          break;
        case ParameterType.HEADER:
          if (param.name && value !== undefined) {
            headers[param.name] = String(value);
          }
          break;
        case ParameterType.BODY:
          body = value;
          break;
      }
    });
    return {
      method: this.endpoint.method,
      path,
      query,
      headers,
      body,
      timeout: this.resolveTimeout(),
    };
  }

  /**
   * Resolves the full path for the request
   *
   * Combines the base path from API metadata with the endpoint path
   * from endpoint metadata to create the complete path.
   *
   * @returns The full path for the request
   */
  resolvePath(): string {
    const basePath = this.endpoint.basePath || this.api.basePath || '';
    const endpointPath = this.endpoint.path || '';
    return combineURLs(basePath, endpointPath);
  }

  /**
   * Resolves the timeout for the request
   *
   * Returns the timeout specified in the endpoint metadata, or the API metadata,
   * or undefined if no timeout is specified.
   *
   * @returns The timeout value in milliseconds, or undefined
   */
  resolveTimeout(): number | undefined {
    return this.endpoint.timeout || this.api.timeout;
  }
}

/**
 * Executor for HTTP requests based on decorated method metadata
 *
 * This class is responsible for executing HTTP requests based on the metadata
 * collected from decorators. It resolves the path, constructs the request,
 * and executes it using the appropriate fetcher.
 */
export class RequestExecutor {
  private readonly metadata: FunctionMetadata;

  /**
   * Creates a new RequestExecutor instance
   *
   * @param metadata - The function metadata containing all request information
   */
  constructor(metadata: FunctionMetadata) {
    this.metadata = metadata;
  }

  /**
   * Executes the HTTP request
   *
   * This method resolves the path and request configuration from the metadata
   * and arguments, then executes the request using the configured fetcher.
   *
   * @param args - The runtime arguments passed to the method
   * @returns A Promise that resolves to the Response
   */
  async execute(args: any[]): Promise<Response> {
    const path = this.metadata.resolvePath();
    const request = this.metadata.resolveRequest(args);
    return await this.metadata.fetcher.fetch(path, request);
  }
}
