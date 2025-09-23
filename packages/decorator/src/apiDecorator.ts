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
  type AttributesCapable,
  Fetcher,
  FetcherCapable,
  type RequestHeaders,
  type RequestHeadersCapable,
  type ResultExtractorCapable,
  type TimeoutCapable,
} from '@ahoo-wang/fetcher';
import { ENDPOINT_METADATA_KEY } from './endpointDecorator';
import { RequestExecutor } from './requestExecutor';
import { PARAMETER_METADATA_KEY } from './parameterDecorator';
import 'reflect-metadata';
import { FunctionMetadata } from './functionMetadata';
import { EndpointReturnTypeCapable } from './endpointReturnTypeCapable';

/**
 * Metadata for class-level API configuration.
 *
 * Defines the configuration options that can be applied to an entire API class.
 * These settings will be used as defaults for all endpoints within the class unless overridden
 * at the method level.
 */
export interface ApiMetadata
  extends TimeoutCapable,
    RequestHeadersCapable,
    ResultExtractorCapable,
    FetcherCapable,
    AttributesCapable, EndpointReturnTypeCapable {
  /**
   * Base path for all endpoints in the class.
   *
   * This path will be prepended to all endpoint paths defined in the class.
   * For example, if basePath is '/api/v1' and an endpoint has path '/users',
   * the full path will be '/api/v1/users'.
   */
  basePath?: string;

  /**
   * Default headers for all requests in the class.
   *
   * These headers will be included in every request made by methods in this class.
   * They can be overridden or extended at the method level.
   */
  headers?: RequestHeaders;

  /**
   * Default timeout for all requests in the class (in milliseconds).
   *
   * This timeout value will be applied to all requests made by methods in this class.
   * Individual methods can specify their own timeout values to override this default.
   */
  timeout?: number;

  /**
   * Name of the fetcher instance to use, default: 'default'.
   *
   * This allows you to specify which fetcher instance should be used for requests
   * from this API class. The fetcher must be registered with the FetcherRegistrar.
   */
  fetcher?: string | Fetcher;
}

export interface ApiMetadataCapable {
  /**
   * API metadata for the class.
   */
  apiMetadata: ApiMetadata;
}

export const API_METADATA_KEY = Symbol('api:metadata');

/**
 * Binds a request executor to a method, replacing the original method with
 * an implementation that makes HTTP requests based on the decorator metadata.
 *
 * @param constructor - The class constructor
 * @param functionName - The name of the method to bind
 * @param apiMetadata - The API metadata for the class
 */
function bindExecutor<T extends new (...args: any[]) => any>(
  constructor: T,
  functionName: string,
  apiMetadata: ApiMetadata,
) {
  const endpointFunction = constructor.prototype[functionName];
  if (functionName === 'constructor') {
    return;
  }
  if (typeof endpointFunction !== 'function') {
    return;
  }

  const endpointMetadata = Reflect.getMetadata(
    ENDPOINT_METADATA_KEY,
    constructor.prototype,
    functionName,
  );
  if (!endpointMetadata) {
    return;
  }
  // Get parameter metadata for this method
  const parameterMetadata =
    Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      constructor.prototype,
      functionName,
    ) || new Map();

  // Create function metadata
  const functionMetadata: FunctionMetadata = new FunctionMetadata(
    functionName,
    apiMetadata,
    endpointMetadata,
    parameterMetadata,
  );

  // Create request executor


  // Replace method with actual implementation
  constructor.prototype[functionName] = function(...args: unknown[]) {
    let requestExecutor: RequestExecutor = buildRequestExecutor(this, functionMetadata);
    return requestExecutor.execute(this, args);
  };
}

export function buildRequestExecutor(
  target: any,
  defaultFunctionMetadata: FunctionMetadata,
): RequestExecutor {
  let requestExecutor: RequestExecutor = target['requestExecutor'];
  if (requestExecutor) {
    return requestExecutor;
  }
  let apiMetadata: ApiMetadata = target['apiMetadata'];
  if (!apiMetadata) {
    requestExecutor = new RequestExecutor(defaultFunctionMetadata);
    target['requestExecutor'] = requestExecutor;
    return requestExecutor;
  }
  requestExecutor = new RequestExecutor(
    new FunctionMetadata(
      defaultFunctionMetadata.name,
      apiMetadata,
      defaultFunctionMetadata.endpoint,
      defaultFunctionMetadata.parameters,
    ),
  );
  target['requestExecutor'] = requestExecutor;
  return requestExecutor;
}

export function api(
  basePath: string = '',
  metadata: Omit<ApiMetadata, 'basePath'> = {},
) {
  return function <T extends new (...args: any[]) => any>(constructor: T): T {
    const apiMetadata: ApiMetadata = {
      basePath,
      ...metadata,
    };

    // Store metadata directly on the class constructor
    Reflect.defineMetadata(API_METADATA_KEY, apiMetadata, constructor);

    // Override prototype methods to implement actual HTTP calls
    Object.getOwnPropertyNames(constructor.prototype).forEach(functionName => {
      bindExecutor(constructor, functionName, apiMetadata);
    });

    return constructor;
  };
}
