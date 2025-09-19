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

import { FetchExchange, RequestInterceptor } from '@ahoo-wang/fetcher';
import {
  COSEC_REQUEST_INTERCEPTOR_ORDER,
  IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY,
} from './cosecRequestInterceptor';
import { CoSecHeaders, JwtTokenManagerCapable } from './types';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AuthorizationInterceptorOptions
  extends JwtTokenManagerCapable {
}

export const AUTHORIZATION_REQUEST_INTERCEPTOR_NAME =
  'AuthorizationRequestInterceptor';
export const AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER =
  COSEC_REQUEST_INTERCEPTOR_ORDER + 1000;

/**
 * Request interceptor that automatically adds Authorization header to requests.
 *
 * This interceptor handles JWT token management by:
 * 1. Adding Authorization header with Bearer token if not already present
 * 2. Refreshing tokens when needed and possible
 * 3. Skipping refresh when explicitly requested via attributes
 *
 * The interceptor runs after CoSecRequestInterceptor but before FetchInterceptor in the chain.
 */
export class AuthorizationRequestInterceptor implements RequestInterceptor {
  readonly name = AUTHORIZATION_REQUEST_INTERCEPTOR_NAME;
  readonly order = AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER;

  /**
   * Creates an AuthorizationRequestInterceptor instance.
   *
   * @param options - Configuration options containing the token manager
   */
  constructor(private readonly options: AuthorizationInterceptorOptions) {
  }

  /**
   * Intercepts the request exchange to add authorization headers.
   *
   * This method performs the following operations:
   * 1. Checks if a token exists and if Authorization header is already set
   * 2. Refreshes the token if needed, possible, and not explicitly ignored
   * 3. Adds the Authorization header with Bearer token if a token is available
   *
   * @param exchange - The fetch exchange containing request information
   * @returns Promise that resolves when the interception is complete
   */
  async intercept(exchange: FetchExchange): Promise<void> {
    // Get the current token from token manager
    let currentToken = this.options.tokenManager.currentToken;

    const requestHeaders = exchange.ensureRequestHeaders();

    // Skip if no token exists or Authorization header is already set
    if (!currentToken || requestHeaders[CoSecHeaders.AUTHORIZATION]) {
      return;
    }

    // Refresh token if needed and refreshable
    if (
      !exchange.attributes.has(IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY) &&
      currentToken.isRefreshNeeded &&
      currentToken.isRefreshable
    ) {
      await this.options.tokenManager.refresh();
    }

    // Get the current token again (might have been refreshed)
    currentToken = this.options.tokenManager.currentToken;

    // Add Authorization header if we have a token
    if (currentToken) {
      requestHeaders[CoSecHeaders.AUTHORIZATION] =
        `Bearer ${currentToken.access.token}`;
    }
  }
}
