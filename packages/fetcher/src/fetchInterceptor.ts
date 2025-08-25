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

import { Interceptor } from './interceptor';
import { timeoutFetch } from './timeout';
import { FetchExchange } from './fetchExchange';

/**
 * FetchInterceptor Class
 *
 * This is an interceptor implementation responsible for executing actual HTTP requests
 * and handling timeout control. It is the last interceptor in the Fetcher request
 * processing chain, ensuring that the actual network request is executed after all
 * previous interceptors have completed processing.
 *
 * @example
 * // Usually not created manually as Fetcher uses it automatically
 * const fetcher = new Fetcher();
 * // FetchInterceptor is automatically registered in fetcher.interceptors.request
 */
export class FetchInterceptor implements Interceptor {
  /**
   * Interceptor name, used to identify and manage interceptor instances
   *
   * @remarks
   * Each interceptor must have a unique name for identification and manipulation
   * within the interceptor manager
   */
  name = 'FetchInterceptor';

  /**
   * Interceptor execution order, set to near maximum safe integer to ensure last execution
   *
   * @remarks
   * Since this is the interceptor that actually executes HTTP requests, it should
   * execute after all other request interceptors, so its order is set to
   * Number.MAX_SAFE_INTEGER - 100. This ensures that all request preprocessing is
   * completed before the actual network request is made, while still allowing
   * other interceptors to run after it if needed.
   */
  order = Number.MAX_SAFE_INTEGER - 100;

  /**
   * Intercept and process HTTP requests
   *
   * Executes the actual HTTP request and applies timeout control. This is the final
   * step in the request processing chain, responsible for calling the timeoutFetch
   * function to send the network request.
   *
   * @param exchange - Exchange object containing request information
   * @returns Promise<FetchExchange> Processed exchange object containing response information
   *
   * @throws {FetchTimeoutError} Throws timeout exception when request times out
   *
   * @example
   * // Usually called internally by Fetcher
   * const exchange = {
   *   url: 'https://api.example.com/users',
   *   request: {
   *     method: 'GET',
   *     timeout: 5000
   *   }
   * };
   * const result = await fetchInterceptor.intercept(exchange);
   * console.log(result.response); // HTTP response object
   */
  async intercept(exchange: FetchExchange): Promise<FetchExchange> {
    exchange.response = await timeoutFetch(
      exchange.url,
      exchange.request as RequestInit,
      exchange.request.timeout,
    );
    return exchange;
  }
}
