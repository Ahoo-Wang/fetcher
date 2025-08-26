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
import { RequestBodyInterceptor } from './requestBodyInterceptor';
import { FetchInterceptor } from './fetchInterceptor';
import { FetchExchange } from './fetchExchange';
import { UrlResolveInterceptor } from './urlResolveInterceptor';

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
   * Used by InterceptorManager to manage interceptors, including adding, removing,
   * and preventing duplicates. Each interceptor must have a unique name.
   */
  name: string;

  /**
   * Process the exchange object in the interceptor pipeline.
   *
   * This method is called by InterceptorManager to process the exchange object.
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
 * Manager for a collection of interceptors of the same type.
 *
 * Handles adding, removing, and executing interceptors in the correct order.
 * Each InterceptorManager instance manages one type of interceptor (request, response, or error).
 *
 * @remarks
 * Interceptors are executed in ascending order of their `order` property.
 * Interceptors with the same order value are executed in the order they were added.
 *
 * @example
 * // Create an interceptor manager with initial interceptors
 * const requestManager = new InterceptorManager([interceptor1, interceptor2]);
 *
 * // Add a new interceptor
 * requestManager.use(newInterceptor);
 *
 * // Remove an interceptor by name
 * requestManager.eject('InterceptorName');
 *
 * // Process an exchange through all interceptors
 * const result = await requestManager.intercept(exchange);
 */
export class InterceptorManager implements Interceptor {
  /**
   * Gets the name of this interceptor manager.
   *
   * @returns The constructor name of this class
   */
  get name(): string {
    return this.constructor.name;
  }

  /**
   * Gets the order of this interceptor manager.
   *
   * @returns Number.MIN_SAFE_INTEGER, indicating this manager should execute early
   */
  get order(): number {
    return Number.MIN_SAFE_INTEGER;
  }

  /**
   * Array of interceptors managed by this manager, sorted by their order property.
   */
  private sortedInterceptors: Interceptor[] = [];

  /**
   * Initializes a new InterceptorManager instance.
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
   * Adds an interceptor to this manager.
   *
   * @param interceptor - The interceptor to add
   * @returns True if the interceptor was added, false if an interceptor with the
   *          same name already exists
   *
   * @remarks
   * Interceptors are uniquely identified by their name property. Attempting to add
   * an interceptor with a name that already exists in the manager will fail.
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
   * Removes all interceptors from this manager.
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

/**
 * Collection of interceptor managers for the Fetcher client.
 *
 * Manages three types of interceptors:
 * 1. Request interceptors - Process requests before sending HTTP requests
 * 2. Response interceptors - Process responses after receiving HTTP responses
 * 3. Error interceptors - Handle errors when they occur during the request process
 *
 * Each type of interceptor is managed by an InterceptorManager instance, supporting
 * adding, removing, and executing interceptors.
 *
 * @example
 * // Create a custom interceptor
 * const customRequestInterceptor: Interceptor = {
 *   name: 'CustomRequestInterceptor',
 *   order: 100,
 *   async intercept(exchange: FetchExchange): Promise<FetchExchange> {
 *     // Modify request headers
 *     exchange.request.headers = {
 *       ...exchange.request.headers,
 *       'X-Custom-Header': 'custom-value'
 *     };
 *     return exchange;
 *   }
 * };
 *
 * // Add interceptor to Fetcher
 * const fetcher = new Fetcher();
 * fetcher.interceptors.request.use(customRequestInterceptor);
 *
 * @remarks
 * By default, the request interceptor manager has three built-in interceptors registered:
 * 1. UrlResolveInterceptor - Resolves the final URL with parameters
 * 2. RequestBodyInterceptor - Automatically converts object-type request bodies to JSON strings
 * 3. FetchInterceptor - Executes actual HTTP requests and handles timeouts
 */
export class FetcherInterceptors {
  /**
   * Manager for request-phase interceptors.
   *
   * Executed before HTTP requests are sent. Contains three built-in interceptors by default:
   * UrlResolveInterceptor, RequestBodyInterceptor, and FetchInterceptor.
   *
   * @remarks
   * Request interceptors are executed in ascending order of their order values, with smaller
   * values having higher priority. The default interceptors are:
   * 1. UrlResolveInterceptor (order: Number.MIN_SAFE_INTEGER) - Resolves the final URL
   * 2. RequestBodyInterceptor (order: 0) - Converts object bodies to JSON
   * 3. FetchInterceptor (order: Number.MAX_SAFE_INTEGER) - Executes the actual HTTP request
   */
  request: InterceptorManager = new InterceptorManager([
    new UrlResolveInterceptor(),
    new RequestBodyInterceptor(),
    new FetchInterceptor(),
  ]);

  /**
   * Manager for response-phase interceptors.
   *
   * Executed after HTTP responses are received. Empty by default, custom response processing
   * logic can be added as needed.
   *
   * @remarks
   * Response interceptors are executed in ascending order of their order values, with smaller
   * values having higher priority.
   */
  response: InterceptorManager = new InterceptorManager();

  /**
   * Manager for error-handling phase interceptors.
   *
   * Executed when errors occur during HTTP requests. Empty by default, custom error handling
   * logic can be added as needed.
   *
   * @remarks
   * Error interceptors are executed in ascending order of their order values, with smaller
   * values having higher priority. Error interceptors can transform errors into normal responses,
   * avoiding thrown exceptions.
   */
  error: InterceptorManager = new InterceptorManager();
}
