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

import { NamedCapable } from './types';
import { OrderedCapable, toSorted } from './orderedCapable';
import { FetchExchange } from './fetchExchange';

/**
 * Interface for HTTP interceptors in the fetcher pipeline.
 *
 * Interceptors are middleware components that can modify requests, responses, or handle errors
 * at different stages of the HTTP request lifecycle. They follow the Chain of Responsibility
 * pattern, where each interceptor can process the exchange object and pass it to the next.
 *
 * @example
 * // Example of a custom request interceptor
 * const customRequestInterceptor: Interceptor = {
 *   name: 'CustomRequestInterceptor',
 *   order: 100,
 *   async intercept(exchange: FetchExchange): Promise<void> {
 *     // Modify request headers
 *     exchange.request.headers = {
 *       ...exchange.request.headers,
 *       'X-Custom-Header': 'custom-value'
 *     };
 *   }
 * };
 */
export interface Interceptor extends NamedCapable, OrderedCapable {
  /**
   * Unique identifier for the interceptor.
   *
   * Used by InterceptorRegistry to manage interceptors, including adding, removing,
   * and preventing duplicates. Each interceptor must have a unique name.
   */
  readonly name: string;

  /**
   * Interceptor method that modifies the request or response.
   *
   * @param exchange - The current exchange object, which contains the request and response.
   * @returns A promise that resolves to the modified exchange object.
   */
  readonly order: number;

  /**
   * Process the exchange object in the interceptor pipeline.
   *
   * This method is called by InterceptorRegistry to process the exchange object.
   * Interceptors can modify request, response, or error properties directly.
   *
   * @param exchange - The exchange object containing request, response, and error information
   *
   * @remarks
   * Interceptors should modify the exchange object directly rather than returning it.
   * They can also throw errors or transform errors into responses.
   */
  intercept(exchange: FetchExchange): void | Promise<void>;
}

/**
 * Interface for request interceptors.
 *
 * Request interceptors are executed before the HTTP request is sent.
 * They can modify the request configuration, add headers, or perform
 * other preprocessing tasks.
 *
 * @example
 * // Example of a request interceptor that adds an authorization header
 * const authInterceptor: RequestInterceptor = {
 *   name: 'AuthorizationInterceptor',
 *   order: 100,
 *   async intercept(exchange: FetchExchange): Promise<void> {
 *     const token = getAuthToken();
 *     if (token) {
 *       exchange.request.headers = {
 *         ...exchange.request.headers,
 *         'Authorization': `Bearer ${token}`
 *       };
 *     }
 *   }
 * };
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RequestInterceptor extends Interceptor {
}

/**
 * Interface for response interceptors.
 *
 * Response interceptors are executed after the HTTP response is received
 * but before it's processed by the application. They can modify the response,
 * transform data, or handle response-specific logic.
 *
 * @example
 * // Example of a response interceptor that parses JSON data
 * const jsonInterceptor: ResponseInterceptor = {
 *   name: 'JsonResponseInterceptor',
 *   order: 100,
 *   async intercept(exchange: FetchExchange): Promise<void> {
 *     if (exchange.response && exchange.response.headers.get('content-type')?.includes('application/json')) {
 *       const data = await exchange.response.json();
 *       // Attach parsed data to a custom property
 *       (exchange.response as any).jsonData = data;
 *     }
 *   }
 * };
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ResponseInterceptor extends Interceptor {
}

/**
 * Interface for error interceptors.
 *
 * Error interceptors are executed when an HTTP request fails.
 * They can handle errors, transform them, or implement retry logic.
 *
 * @example
 * // Example of an error interceptor that retries failed requests
 * const retryInterceptor: ErrorInterceptor = {
 *   name: 'RetryInterceptor',
 *   order: 100,
 *   async intercept(exchange: FetchExchange): Promise<void> {
 *     if (exchange.error && isRetryableError(exchange.error)) {
 *       // Implement retry logic
 *       const retryCount = (exchange.request as any).retryCount || 0;
 *       if (retryCount < 3) {
 *         (exchange.request as any).retryCount = retryCount + 1;
 *         // Retry the request
 *         exchange.response = await fetch(exchange.request);
 *         // Clear the error since we've recovered
 *         exchange.error = undefined;
 *       }
 *     }
 *   }
 * };
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ErrorInterceptor extends Interceptor {
}

/**
 * Registry for a collection of interceptors of the same type.
 *
 * Handles adding, removing, and executing interceptors in the correct order.
 * Each InterceptorRegistry instance manages one type of interceptor (request, response, or error).
 *
 * @remarks
 * Interceptors are executed in ascending order of their `order` property.
 * Interceptors with the same order value are executed in the order they were added.
 *
 * @example
 * // Create an interceptor registry with initial interceptors
 * const requestRegistry = new InterceptorRegistry([interceptor1, interceptor2]);
 *
 * // Add a new interceptor
 * requestRegistry.use(newInterceptor);
 *
 * // Remove an interceptor by name
 * requestRegistry.eject('InterceptorName');
 *
 * // Process an exchange through all interceptors
 * const result = await requestRegistry.intercept(exchange);
 */
export class InterceptorRegistry implements Interceptor {
  /**
   * Gets the name of this interceptor registry.
   *
   * @returns The constructor name of this class
   */
  get name(): string {
    return this.constructor.name;
  }

  /**
   * Gets the order of this interceptor registry.
   *
   * @returns Number.MIN_SAFE_INTEGER, indicating this registry should execute early
   */
  get order(): number {
    return Number.MIN_SAFE_INTEGER;
  }

  /**
   * Array of interceptors managed by this registry, sorted by their order property.
   */
  private sortedInterceptors: Interceptor[] = [];

  /**
   * Initializes a new InterceptorRegistry instance.
   *
   * @param interceptors - Initial array of interceptors to manage
   *
   * @remarks
   * The provided interceptors will be sorted by their order property immediately
   * upon construction.
   */
  constructor(interceptors: Interceptor[] = []) {
    this.sortedInterceptors = toSorted(interceptors);
  }

  /**
   * Adds an interceptor to this registry.
   *
   * @param interceptor - The interceptor to add
   * @returns True if the interceptor was added, false if an interceptor with the
   *          same name already exists
   *
   * @remarks
   * Interceptors are uniquely identified by their name property. Attempting to add
   * an interceptor with a name that already exists in the registry will fail.
   *
   * After adding, interceptors are automatically sorted by their order property.
   */
  use(interceptor: Interceptor): boolean {
    if (this.sortedInterceptors.some(item => item.name === interceptor.name)) {
      return false;
    }
    this.sortedInterceptors = toSorted([
      ...this.sortedInterceptors,
      interceptor,
    ]);
    return true;
  }

  /**
   * Removes an interceptor by name.
   *
   * @param name - The name of the interceptor to remove
   * @returns True if an interceptor was removed, false if no interceptor with the
   *          given name was found
   */
  eject(name: string): boolean {
    const original = this.sortedInterceptors;
    this.sortedInterceptors = toSorted(
      original,
      interceptor => interceptor.name !== name,
    );
    return original.length !== this.sortedInterceptors.length;
  }

  /**
   * Removes all interceptors from this registry.
   */
  clear(): void {
    this.sortedInterceptors = [];
  }

  /**
   * Executes all managed interceptors on the given exchange object.
   *
   * @param exchange - The exchange object to process
   * @returns A promise that resolves when all interceptors have been executed
   *
   * @remarks
   * Interceptors are executed in order, with each interceptor receiving the result
   * of the previous interceptor. The first interceptor receives the original
   * exchange object.
   *
   * If any interceptor throws an error, the execution chain is broken and the error
   * is propagated to the caller.
   */
  async intercept(exchange: FetchExchange): Promise<void> {
    for (const interceptor of this.sortedInterceptors) {
      // Each interceptor processes the output of the previous interceptor
      await interceptor.intercept(exchange);
    }
  }
}
