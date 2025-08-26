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
import { FetchExchange } from './fetchExchange';

/**
 * URL Resolution Interceptor
 *
 * This interceptor is responsible for resolving the final URL for a request by combining
 * the base URL, path parameters, and query parameters. It should be executed early in
 * the interceptor chain to ensure the URL is properly resolved before other interceptors
 * process the request.
 *
 * @remarks
 * This interceptor has the lowest possible order (Number.MIN_SAFE_INTEGER) to ensure
 * it runs first in the request interceptor chain, before any other request processing.
 *
 * @example
 * // With baseURL: 'https://api.example.com'
 * // Request URL: '/users/{id}'
 * // Path params: { id: 123 }
 * // Query params: { filter: 'active' }
 * // Final URL: 'https://api.example.com/users/123?filter=active'
 */
export class UrlResolveInterceptor implements Interceptor {
  /**
   * The name of this interceptor
   */
  name = 'UrlResolveInterceptor';

  /**
   * The order of this interceptor (executed first)
   *
   * @remarks
   * This interceptor should run first in the request interceptor chain to ensure
   * URL resolution happens before any other request processing. The order is set to
   * Number.MIN_SAFE_INTEGER + 100 to allow for other interceptors that need to run
   * even earlier while still maintaining a high priority.
   */
  order = Number.MIN_SAFE_INTEGER + 100;

  /**
   * Resolves the final URL by combining the base URL, path parameters, and query parameters
   *
   * @param exchange - The fetch exchange containing the request information
   * @returns The modified exchange with the resolved URL
   */
  intercept(exchange: FetchExchange) {
    const request = exchange.request;
    request.url = exchange.fetcher.urlBuilder.resolveRequestUrl(request);
  }
}
