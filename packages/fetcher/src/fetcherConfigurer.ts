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

import type { Fetcher } from './fetcher.js';

/**
 * Interface for configuring Fetcher instances.
 *
 * This interface defines a contract for objects that can configure a Fetcher instance
 * with specific interceptors, middleware, or other customizations. Implementations of
 * this interface provide a standardized way to apply configuration to Fetcher objects,
 * enabling modular and reusable configuration patterns.
 *
 * @interface FetcherConfigurer
 *
 * @example
 * ```typescript
 * class AuthConfigurer implements FetcherConfigurer {
 *   applyTo(fetcher: Fetcher): void {
 *     fetcher.interceptors.request.use(new AuthRequestInterceptor());
 *     fetcher.interceptors.error.use(new UnauthorizedErrorInterceptor());
 *   }
 * }
 *
 * const fetcher = new Fetcher({ baseURL: '/api' });
 * new AuthConfigurer().applyTo(fetcher);
 * ```
 */
export interface FetcherConfigurer {
  /**
   * Applies configuration to the provided Fetcher instance.
   *
   * This method should apply all necessary configuration to the Fetcher instance,
   * such as adding interceptors, setting default headers, or configuring other
   * behavior. It should be idempotent: `InterceptorRegistry.use` ignores an
   * interceptor whose name is already registered, so give interceptors stable
   * names.
   *
   * @param fetcher - The Fetcher instance to configure
   *
   * @example
   * ```typescript
   * applyTo(fetcher: Fetcher): void {
   *   fetcher.interceptors.request.use({
   *     name: 'AuthorizationInterceptor',
   *     order: 0,
   *     intercept(exchange) {
   *       exchange.ensureRequestHeaders().Authorization = `Bearer ${getToken()}`;
   *     },
   *   });
   * }
   * ```
   */
  applyTo(fetcher: Fetcher): void;
}
