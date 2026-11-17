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
import {
  ENDPOINT_METADATA_KEY,
  type EndpointMetadata,
} from './endpointDecorator.js';
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

/**
 * Registered (`Symbol.for`), so the ES module and CommonJS builds of this
 * package, loaded side by side, read each other's metadata.
 */
export const API_METADATA_KEY = Symbol.for('@ahoo-wang/fetcher-decorator:api');

/**
 * Marks the methods `@api` installs, so a later `@api` on a subclass can tell
 * them from a hand-written override. Registered for the same reason as the
 * metadata keys.
 */
const EXECUTOR_MARK = Symbol.for('@ahoo-wang/fetcher-decorator:executor');

/** What `@api` reads of the class it decorates; it never constructs it. */
type ServiceClass = { prototype: any; name: string };

/**
 * The endpoint metadata `@api` binds `functionName` to on `prototype`, or
 * `undefined` to leave the method alone. The nearest implementation up the
 * prototype chain decides: one declared with an endpoint decorator is bound
 * (rebound to this class's metadata); an executor a parent's `@api`
 * installed is looked past; anything else is a hand-written method, kept
 * even when an ancestor declared the endpoint.
 */
function resolveEndpoint(
  prototype: object,
  functionName: string | symbol,
): EndpointMetadata | undefined {
  for (
    let owner: object | null = prototype;
    owner && owner !== Object.prototype;
    owner = Object.getPrototypeOf(owner)
  ) {
    if (!Object.prototype.hasOwnProperty.call(owner, functionName)) continue;
    const declared: EndpointMetadata | undefined = Reflect.getOwnMetadata(
      ENDPOINT_METADATA_KEY,
      owner,
      functionName,
    );
    if (declared) return declared;
    const implementation = Object.getOwnPropertyDescriptor(
      owner,
      functionName,
    )?.value;
    if (!(
      typeof implementation === 'function' && implementation[EXECUTOR_MARK]
    )) {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Binds a request executor to a method, replacing the original method with
 * an implementation that makes HTTP requests based on the decorator metadata.
 *
 * This internal function is called during class decoration to replace placeholder
 * method implementations with actual HTTP request execution logic. It creates
 * a RequestExecutor instance and assigns it to replace the original method.
 *
 * @param constructor - The class constructor being decorated
 * @param functionName - The name (string or symbol) of the method to bind the executor to
 * @param apiMetadata - The API metadata for the class containing configuration
 * @internal This function is used internally during class decoration
 */
function bindExecutor(
  constructor: ServiceClass,
  functionName: string | symbol,
  apiMetadata: ApiMetadata,
) {
  if (functionName === 'constructor') {
    return;
  }

  const endpointMetadata = resolveEndpoint(constructor.prototype, functionName);
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
    String(functionName),
    apiMetadata,
    endpointMetadata,
    parameterMetadata,
  );

  // Create request executor

  // Replace method with actual implementation
  const executor = async function (this: unknown, ...args: unknown[]) {
    if (typeof this !== 'object' || this === null) {
      throw new TypeError(
        `${constructor.name}.${String(functionName)} was called without its ` +
          `instance; call it on the service (service.${String(functionName)}` +
          `(...)) or bind it first.`,
      );
    }
    const requestExecutor: RequestExecutor = buildRequestExecutor(
      this,
      functionMetadata,
    );
    return await requestExecutor.execute(args);
  };
  Object.defineProperty(executor, EXECUTOR_MARK, { value: true });
  constructor.prototype[functionName] = executor;
}

/**
 * Builds the RequestExecutor for one call of a decorated method.
 *
 * The instance's `apiMetadata` (see {@link ApiMetadataCapable}) is
 * shallow-spread over the class metadata, so replacing or mutating it takes
 * effect on the next call. Nothing is cached: building costs two small
 * objects, far less than the request itself, and a cache keyed by method
 * would have to tell an override apart from the parent method it shadows
 * (`super.foo()`).
 *
 * @param target - The target object instance that contains the method
 * @param defaultFunctionMetadata - The function metadata containing endpoint configuration
 * @returns A RequestExecutor instance for executing the HTTP request
 */
export function buildRequestExecutor(
  target: any,
  defaultFunctionMetadata: FunctionMetadata,
): RequestExecutor {
  const targetApiMetadata: ApiMetadata | undefined = target['apiMetadata'];
  if (!targetApiMetadata) {
    return new RequestExecutor(target, defaultFunctionMetadata);
  }
  return new RequestExecutor(
    target,
    new FunctionMetadata(
      defaultFunctionMetadata.name,
      { ...defaultFunctionMetadata.api, ...targetApiMetadata },
      defaultFunctionMetadata.endpoint,
      defaultFunctionMetadata.parameters,
    ),
  );
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
  // Any class: abstract, or with a private or protected constructor, too.
  // `@api` only binds prototype methods and never constructs the class.
  return function <T extends ServiceClass>(
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

function bindAllExecutors(constructor: ServiceClass, apiMetadata: ApiMetadata) {
  const visitedNames = new Set<string | symbol>();
  let proto = constructor.prototype;
  while (proto && proto !== Object.prototype) {
    Reflect.ownKeys(proto).forEach(functionName => {
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
