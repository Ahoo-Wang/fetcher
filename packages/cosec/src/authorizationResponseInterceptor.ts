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

import { ResponseCodes } from './types';
import { FetchExchange, type ResponseInterceptor } from '@ahoo-wang/fetcher';
import { AuthorizationInterceptorOptions } from './authorizationRequestInterceptor';

/**
 * The name of the AuthorizationResponseInterceptor.
 */
export const AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME =
  'AuthorizationResponseInterceptor';

/**
 * The order of the AuthorizationResponseInterceptor.
 * Set to a high negative value to ensure it runs early in the interceptor chain.
 */
export const AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER =
  Number.MIN_SAFE_INTEGER + 1000;

/**
 * CoSecResponseInterceptor is responsible for handling unauthorized responses (401)
 * by attempting to refresh the authentication token and retrying the original request.
 *
 * This interceptor:
 * 1. Checks if the response status is 401 (UNAUTHORIZED)
 * 2. If so, and if there's a current token, attempts to refresh it
 * 3. On successful refresh, stores the new token and retries the original request
 * 4. On refresh failure, clears stored tokens and propagates the error
 */
export class AuthorizationResponseInterceptor implements ResponseInterceptor {
  readonly name = AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME;
  readonly order = AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER;

  /**
   * Creates a new AuthorizationResponseInterceptor instance.
   * @param options - The CoSec configuration options including token storage and refresher
   */
  constructor(private options: AuthorizationInterceptorOptions) {}

  /**
   * Intercepts the response and handles unauthorized responses by refreshing tokens.
   * @param exchange - The fetch exchange containing request and response information
   */
  async intercept(exchange: FetchExchange): Promise<void> {
    const response = exchange.response;
    // If there's no response, nothing to intercept
    if (!response) {
      return;
    }

    // Only handle unauthorized responses (401)
    if (response.status !== ResponseCodes.UNAUTHORIZED) {
      return;
    }

    if (!this.options.tokenManager.isRefreshable) {
      return;
    }
    try {
      await this.options.tokenManager.refresh();
      // Retry the original request with the new token
      await exchange.fetcher.interceptors.exchange(exchange);
    } catch (error) {
      // If token refresh fails, clear stored tokens and re-throw the error
      this.options.tokenManager.tokenStorage.remove();
      throw error;
    }
  }
}
