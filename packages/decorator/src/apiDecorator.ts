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
  FetcherCapable,
  UrlParamsCapable,
} from '@ahoo-wang/fetcher';
import {
  type AttributesCapable,
  type RequestHeaders,
  type RequestHeadersCapable,
  type ResultExtractorCapable,
  type TimeoutCapable,
} from '@ahoo-wang/fetcher';
import { ENDPOINT_METADATA_KEY } from './endpointDecorator.js';
import { RequestExecutor } from './requestExecutor.js';
import { PARAMETER_METADATA_KEY } from './parameterDecorator.js';
import 'reflect-metadata';
import { FunctionMetadata } from './functionMetadata.js';
import { assertLegacyDecorator } from './legacyDecorators.js';
import type { EndpointReturnTypeCapable } from './endpointReturnTypeCapable.js';

/**
 * Metadata for class-level API configuration.
 *
 * Defines the configuration options that can be applied to an entire API class.
 * These settings will be used as defaults for all endpoints within the class unless overridden
 * at the method level.
 */
export interface ApiMetadata
  extends
    TimeoutCapable,
    RequestHeadersCapable,
    ResultExtractorCapable,
    FetcherCapable,
    AttributesCapable,
    EndpointReturnTypeCapable,
    UrlParamsCapable {
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
  readonly apiMetadata?: ApiMetadata;
}

export const API_METADATA_KEY = Symbol('api:metadata');

/**
 * Binds a request executor to a method, replacing the original method with
 * an implementation that makes HTTP requests based on the decorator metadata.
 *
 * This internal function is called during class decoration to replace placeholder
 * method implementations with actual HTTP request execution logic. It creates
 * a RequestExecutor instance and assigns it to replace the original method.
 *
 * @param constructor - The class constructor being decorated
 * @param functionName - The name of the method to bind the executor to
 * @param apiMetadata - The API metadata for the class containing configuration
 * @internal This function is used internally during class decoration
 */
function bindExecutor<T extends new (...args: any[]) => any>(
  constructor: T,
  functionName: string,
  apiMetadata: ApiMetadata,
) {
  if (functionName === 'constructor') {
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
  // A subclass that overrides an inherited endpoint without decorating the
  // override wrote its own implementation: keep it. (The metadata lookup above
  // walks the prototype chain and finds the parent's endpoint.)
  if (
    Object.prototype.hasOwnProperty.call(constructor.prototype, functionName) &&
    !Reflect.hasOwnMetadata(
      ENDPOINT_METADATA_KEY,
      constructor.prototype,
      functionName,
    )
  ) {
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
  constructor.prototype[functionName] = async function (
    this: unknown,
    ...args: unknown[]
  ) {
    if (typeof this !== 'object' || this === null) {
      throw new TypeError(
        `${constructor.name}.${functionName} was called without its instance; ` +
          `call it on the service (service.${functionName}(...)) or bind it first.`,
      );
    }
    const requestExecutor: RequestExecutor = buildRequestExecutor(
      this,
      functionMetadata,
    );
    return await requestExecutor.execute(args);
  };
}

/**
 * Executors built per service instance and method, off the instance itself so
 * no field is added to user objects.
 */
const requestExecutors = new WeakMap<
  object,
  Map<string, { apiMetadata?: ApiMetadata; executor: RequestExecutor }>
>();

/**
 * Builds or retrieves a cached RequestExecutor for the given function metadata.
 *
 * The instance's `apiMetadata` (see {@link ApiMetadataCapable}) is spread over
 * the class metadata. The executor is cached per instance and method, and
 * rebuilt when the instance's `apiMetadata` object is replaced.
 *
 * @param target - The target object instance that contains the method
 * @param defaultFunctionMetadata - The function metadata containing endpoint configuration
 * @returns A RequestExecutor instance for executing the HTTP request
 */
export function buildRequestExecutor(
  target: any,
  defaultFunctionMetadata: FunctionMetadata,
): RequestExecutor {
  let executors = requestExecutors.get(target);
  if (!executors) {
    executors = new Map();
    requestExecutors.set(target, executors);
  }
  const targetApiMetadata: ApiMetadata | undefined = target['apiMetadata'];
  const cached = executors.get(defaultFunctionMetadata.name);
  if (cached && cached.apiMetadata === targetApiMetadata) {
    return cached.executor;
  }
  const mergedApiMetadata: ApiMetadata = {
    ...defaultFunctionMetadata.api,
    ...targetApiMetadata,
  };
  const executor = new RequestExecutor(
    target,
    new FunctionMetadata(
      defaultFunctionMetadata.name,
      mergedApiMetadata,
      defaultFunctionMetadata.endpoint,
      defaultFunctionMetadata.parameters,
    ),
  );
  executors.set(defaultFunctionMetadata.name, {
    apiMetadata: targetApiMetadata,
    executor,
  });
  return executor;
}

/**
 * Class decorator for defining API configurations.
 *
 * The @api decorator configures a class as an API client with shared settings
 * like base URL, default headers, timeout, and fetcher instance. All methods
 * in the decorated class that use HTTP method decorators (@get, @post, etc.)
 * will inherit these settings.
 *
 * @param basePath - Base path to prepend to all endpoint paths in the class
 * @param metadata - Additional API configuration including headers, timeout, fetcher, etc.
 * @returns A class decorator function
 *
 * @example
 * ```typescript
 * @api('/api/v1', {
 *   headers: { 'Authorization': 'Bearer token' },
 *   timeout: 5000,
 *   fetcher: 'myFetcher'
 * })
 * class UserService {
 *   @get('/users')
 *   getUsers(): Promise<User[]> {
 *     throw autoGeneratedError();
 *   }
 *
 *   @post('/users')
 *   createUser(@body() user: User): Promise<User> {
 *     throw autoGeneratedError();
 *   }
 * }
 * ```
 */
export function api(
  basePath: string = '',
  metadata: Omit<ApiMetadata, 'basePath'> = {},
) {
  return function <T extends new (...args: any[]) => any>(
    constructor: T,
    context?: unknown,
  ): T {
    assertLegacyDecorator(context, '@api');
    const apiMetadata: ApiMetadata = {
      basePath,
      ...metadata,
    };

    // Store metadata directly on the class constructor
    Reflect.defineMetadata(API_METADATA_KEY, apiMetadata, constructor);
    bindAllExecutors(constructor, apiMetadata);
    return constructor;
  };
}

function bindAllExecutors<T extends new (...args: any[]) => any>(
  constructor: T,
  apiMetadata: ApiMetadata,
) {
  const visitedNames = new Set<string>();
  let proto = constructor.prototype;
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach(functionName => {
      if (visitedNames.has(functionName)) return;
      visitedNames.add(functionName);
      const descriptor = Object.getOwnPropertyDescriptor(proto, functionName);
      if (typeof descriptor?.value === 'function') {
        bindExecutor(constructor, functionName, apiMetadata);
      }
    });
    proto = Object.getPrototypeOf(proto);
  }
}
