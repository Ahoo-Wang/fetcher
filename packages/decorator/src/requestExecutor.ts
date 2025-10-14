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
import { FunctionMetadata } from './functionMetadata';
import { EndpointReturnType } from './endpointReturnTypeCapable';
import { ExecuteLifeCycle } from './executeLifeCycle';

export const DECORATOR_TARGET_ATTRIBUTE_KEY = '__decorator_target__';
export const DECORATOR_METADATA_ATTRIBUTE_KEY = '__decorator_metadata__';

/**
 * Executes the HTTP request based on the decorated method metadata.
 *
 * This method orchestrates the complete HTTP request lifecycle:
 * 1. Resolves request configuration from metadata and runtime arguments
 * 2. Sets up request attributes for interceptor access
 * 3. Creates the FetchExchange object
 * 4. Executes lifecycle hooks (beforeExecute)
 * 5. Processes the request through the interceptor chain
 * 6. Executes lifecycle hooks (afterExecute)
 * 7. Extracts and returns the result based on endpoint return type
 *
 * @param args - The runtime arguments passed to the decorated method.
 *               These are mapped to request components (path variables, query params, body, etc.)
 *               based on parameter decorators applied to the method.
 * @returns A Promise that resolves to the extracted result. The return type depends on:
 *          - EndpointReturnType.EXCHANGE: Returns the FetchExchange object directly
 *          - Otherwise: Returns the result of exchange.extractResult() (e.g., Response, parsed JSON)
 * @throws Error if the request fails during execution or if lifecycle hooks/interceptors throw
 *
 * @example
 * ```typescript
 * // Given a decorated service method:
 * class UserService {
 *   @get('/users/{id}')
 *   getUser(@path('id') id: number): Promise<User> {
 *     // This method body is replaced by the executor at runtime
 *   }
 * }
 *
 * // When calling:
 * const userService = new UserService();
 * const user = await userService.getUser(123);
 *
 * // The execute method will:
 * // 1. Resolve the path to '/users/123'
 * // 2. Create a GET request
 * // 3. Execute the request using the configured fetcher
 * // 4. Extract and return the parsed User object
 * ```
 */
export class RequestExecutor {
  /**
   * Creates a new RequestExecutor instance.
   * @param target - The target object that the method is called on.
   *                 This can contain a custom fetcher instance in its 'fetcher' property.
   * @param metadata - The function metadata containing all request information
   */
  constructor(
    private readonly target: any,
    private readonly metadata: FunctionMetadata,
  ) {}

  /**
   * Executes the HTTP request based on the decorated method metadata.
   *
   * This method orchestrates the complete HTTP request lifecycle:
   * 1. Resolves request configuration from metadata and runtime arguments
   * 2. Sets up request attributes for interceptor access
   * 3. Creates the FetchExchange object
   * 4. Executes lifecycle hooks (beforeExecute)
   * 5. Processes the request through the interceptor chain
   * 6. Executes lifecycle hooks (afterExecute)
   * 7. Extracts and returns the result based on endpoint return type
   *
   * @param args - The runtime arguments passed to the decorated method.
   *               These are mapped to request components (path variables, query params, body, etc.)
   *               based on parameter decorators applied to the method.
   * @returns A Promise that resolves to the extracted result. The return type depends on:
   *          - EndpointReturnType.EXCHANGE: Returns the FetchExchange object directly
   *          - Otherwise: Returns the result of exchange.extractResult() (e.g., Response, parsed JSON)
   * @throws Error if the request fails during execution or if lifecycle hooks/interceptors throw
   *
   * @example
   * ```typescript
   * // Given a decorated service method:
   * class UserService {
   *   @get('/users/{id}')
   *   getUser(@path('id') id: number): Promise<User> {
   *     // This method body is replaced by the executor at runtime
   *   }
   * }
   *
   * // When calling:
   * const userService = new UserService();
   * const user = await userService.getUser(123);
   *
   * // The execute method will:
   * // 1. Resolve the path to '/users/123'
   * // 2. Create a GET request
   * // 3. Execute the request using the configured fetcher
   * // 4. Extract and return the parsed User object
   * ```
   */
  async execute(args: any[]): Promise<any> {
    const fetcher = this.metadata.fetcher;
    const exchangeInit = this.metadata.resolveExchangeInit(args);
    exchangeInit.attributes.set(DECORATOR_TARGET_ATTRIBUTE_KEY, this.target);
    exchangeInit.attributes.set(
      DECORATOR_METADATA_ATTRIBUTE_KEY,
      this.metadata,
    );
    const resultExtractor = this.metadata.resolveResultExtractor();
    const endpointReturnType = this.metadata.resolveEndpointReturnType();

    const exchange = fetcher.resolveExchange(exchangeInit.request, {
      resultExtractor: resultExtractor,
      attributes: exchangeInit.attributes,
    });
    const executeLifeCycle = this.target as ExecuteLifeCycle;
    // Call lifecycle hook if target implements ExecuteLifeCycle
    if (executeLifeCycle.beforeExecute) {
      await executeLifeCycle.beforeExecute(exchange);
    }
    // Process through interceptor chain
    await fetcher.interceptors.exchange(exchange);
    // Call afterExecute lifecycle hook if target implements ExecuteLifeCycle
    if (executeLifeCycle.afterExecute) {
      await executeLifeCycle.afterExecute(exchange);
    }

    if (endpointReturnType === EndpointReturnType.EXCHANGE) {
      return exchange;
    }
    return await exchange.extractResult();
  }
}
