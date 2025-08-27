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

import { RequestInterceptor } from './interceptor';
import { FetchExchange } from './fetchExchange';

/**
 * The name of the UrlResolveInterceptor.
 */
export const URL_RESOLVE_INTERCEPTOR_NAME = 'UrlResolveInterceptor';

/**
 * The order of the UrlResolveInterceptor.
 * Set to Number.MIN_SAFE_INTEGER + 1000 to ensure it runs earliest among request interceptors.
 */
export const URL_RESOLVE_INTERCEPTOR_ORDER = Number.MIN_SAFE_INTEGER + 1000;

/**
 * Interceptor responsible for resolving the final URL for a request.
 *
 * This interceptor combines the base URL, path parameters, and query parameters
 * to create the final URL for a request. It should be executed earliest in
 * the interceptor chain to ensure the URL is properly resolved before other interceptors
 * process the request.
 *
 * @remarks
 * This interceptor runs at the very beginning of the request interceptor chain to ensure
 * URL resolution happens before any other request processing. The order is set to
 * URL_RESOLVE_INTERCEPTOR_ORDER to ensure it executes before all other request interceptors,
 * establishing the foundation for subsequent processing.
 *
 * @example
 * // With baseURL: 'https://api.example.com'
 * // Request URL: '/users/{id}'
 * // Path params: { id: 123 }
 * // Query params: { filter: 'active' }
 * // Final URL: 'https://api.example.com/users/123?filter=active'
 */
export class UrlResolveInterceptor implements RequestInterceptor {
  /**
   * The name of this interceptor.
   */
  readonly name = URL_RESOLVE_INTERCEPTOR_NAME;

  /**
   * The order of this interceptor (executed earliest).
   *
   * This interceptor should run at the very beginning of the request interceptor chain to ensure
   * URL resolution happens before any other request processing. The order is set to
   * URL_RESOLVE_INTERCEPTOR_ORDER to ensure it executes before all other request interceptors,
   * establishing the foundation for subsequent processing.
   */
  readonly order = URL_RESOLVE_INTERCEPTOR_ORDER;

  /**
   * Resolves the final URL by combining the base URL, path parameters, and query parameters.
   *
   * @param exchange - The fetch exchange containing the request information
   */
  intercept(exchange: FetchExchange) {
    const request = exchange.request;
    request.url = exchange.fetcher.urlBuilder.resolveRequestUrl(request);
  }
}
