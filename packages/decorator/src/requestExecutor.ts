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
import { Fetcher } from '@ahoo-wang/fetcher';
import { FunctionMetadata } from './functionMetadata';

const TARGET_FETCHER_PROPERTY = 'fetcher';

export const DECORATOR_TARGET_ATTRIBUTE_KEY = '__decorator_target__';

/**
 * Executor for HTTP requests based on decorated method metadata.
 *
 * This class is responsible for executing HTTP requests based on the metadata
 * collected from decorators. It resolves the path, constructs the request,
 * and executes it using the appropriate fetcher.
 */
export class RequestExecutor {
  private readonly metadata: FunctionMetadata;

  /**
   * Creates a new RequestExecutor instance.
   *
   * @param metadata - The function metadata containing all request information
   */
  constructor(metadata: FunctionMetadata) {
    this.metadata = metadata;
  }

  /**
   * Retrieves the fetcher instance from the target object.
   *
   * @param target - The target object that may contain a fetcher property
   * @returns The fetcher instance if exists, otherwise undefined
   */
  private getTargetFetcher(target: any): Fetcher | undefined {
    if (!target || typeof target !== 'object') {
      return undefined;
    }
    // Extract the fetcher property from the target object
    const fetcher = target[TARGET_FETCHER_PROPERTY];

    // Validate that the fetcher is an instance of the Fetcher class
    if (fetcher instanceof Fetcher) {
      return fetcher;
    }

    // Return undefined if no valid fetcher instance is found
    return undefined;
  }

  /**
   * Executes the HTTP request.
   *
   * This method resolves the path and request configuration from the metadata
   * and arguments, then executes the request using the configured fetcher.
   * It handles the complete request lifecycle from parameter processing to
   * response extraction.
   *
   * @param target - The target object that the method is called on.
   *                 This can contain a custom fetcher instance in its 'fetcher' property.
   * @param args - The runtime arguments passed to the decorated method.
   *               These are mapped to request components based on parameter decorators.
   * @returns A Promise that resolves to the extracted result based on the configured result extractor.
   *          By default, this is the Response object, but can be customized to return
   *          parsed JSON, the raw exchange object, or any other transformed result.
   *
   * @example
   * ```typescript
   * // Given a decorated service method:
   * class UserService {
   *   @get('/users/{id}')
   *   getUser(@path('id') id: number): Promise<Response> {
   *     // This method body is replaced by the executor at runtime
   *   }
   * }
   *
   * // When calling:
   * const userService = new UserService();
   * const response = await userService.getUser(123);
   *
   * // The execute method will:
   * // 1. Resolve the path to '/users/123'
   * // 2. Create a request with method 'GET'
   * // 3. Execute the request using the configured fetcher
   * // 4. Return the Response object
   * ```
   */
  async execute(target: any, args: any[]): Promise<any> {
    const fetcher = this.getTargetFetcher(target) || this.metadata.fetcher;
    const exchangeInit = this.metadata.resolveExchangeInit(args);
    const attributes = exchangeInit.attributes as Map<string, any>;
    attributes.set(DECORATOR_TARGET_ATTRIBUTE_KEY, target);
    const extractor = this.metadata.resolveResultExtractor();
    return fetcher.request(exchangeInit.request, extractor, exchangeInit.attributes);
  }
}
