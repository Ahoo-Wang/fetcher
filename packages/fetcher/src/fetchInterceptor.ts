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
 * The name of the FetchInterceptor.
 */
export const FETCH_INTERCEPTOR_NAME = 'FetchInterceptor';

/**
 * The order of the FetchInterceptor.
 * Set to Number.MAX_SAFE_INTEGER - 1000 to ensure it runs last among request interceptors.
 */
export const FETCH_INTERCEPTOR_ORDER = Number.MAX_SAFE_INTEGER - 1000;

/**
 * Interceptor implementation responsible for executing actual HTTP requests.
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
   * Interceptor name, used to identify and manage interceptor instances.
   *
   * Each interceptor must have a unique name for identification and manipulation
   * within the interceptor manager.
   */
  readonly name = FETCH_INTERCEPTOR_NAME;

  /**
   * Interceptor execution order, set to near maximum safe integer to ensure last execution.
   *
   * Since this is the interceptor that actually executes HTTP requests, it should
   * execute after all other request interceptors, so its order is set to
   * FETCH_INTERCEPTOR_ORDER. This ensures that all request preprocessing is
   * completed before the actual network request is made, while still allowing
   * other interceptors to run after it if needed.
   */
  readonly order = FETCH_INTERCEPTOR_ORDER;

  /**
   * Intercept and process HTTP requests.
   *
   * Executes the actual HTTP request and applies timeout control. This is the final
   * step in the request processing chain, responsible for calling the timeoutFetch
   * function to send the network request.
   *
   * @param exchange - Exchange object containing request information
   *
   * @throws {FetchTimeoutError} Throws timeout exception when request times out
   *
   * @example
   * // Usually called internally by Fetcher
   * const fetcher = new Fetcher();
   * const exchange = new FetchExchange(
   *   fetcher,
   *   {
   *     url: 'https://api.example.com/users',
   *     method: 'GET',
   *     timeout: 5000
   *   }
   * );
   * await fetchInterceptor.intercept(exchange);
   * console.log(exchange.response); // HTTP response object
   */
  async intercept(exchange: FetchExchange) {
    exchange.response = await timeoutFetch(exchange.request);
  }
}
