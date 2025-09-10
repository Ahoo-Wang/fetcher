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

import { type CoSecOptions, ResponseCodes } from './types';
import { FetchExchange, type ResponseInterceptor } from '@ahoo-wang/fetcher';
import { CompositeToken } from './tokenRefresher';

/**
 * The name of the CoSecResponseInterceptor.
 */
export const COSEC_RESPONSE_INTERCEPTOR_NAME = 'CoSecResponseInterceptor';

/**
 * The order of the CoSecResponseInterceptor.
 * Set to a high negative value to ensure it runs early in the interceptor chain.
 */
export const COSEC_RESPONSE_INTERCEPTOR_ORDER = Number.MIN_SAFE_INTEGER + 1000;

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
export class CoSecResponseInterceptor implements ResponseInterceptor {
  readonly name = COSEC_RESPONSE_INTERCEPTOR_NAME;
  readonly order = COSEC_RESPONSE_INTERCEPTOR_ORDER;
  private options: CoSecOptions;
  private refreshInProgress?: Promise<CompositeToken>;

  /**
   * Creates a new CoSecResponseInterceptor instance.
   * @param options - The CoSec configuration options including token storage and refresher
   */
  constructor(options: CoSecOptions) {
    this.options = options;
  }

  private async refresh(currentToken: CompositeToken): Promise<CompositeToken> {
    if (this.refreshInProgress) {
      return this.refreshInProgress;
    }

    this.refreshInProgress = this.options.tokenRefresher.refresh(currentToken)
      .then(newToken => {
        this.options.tokenStorage.setCompositeToken(newToken);
        return newToken;
      })
      .catch(error => {
        this.options.tokenStorage.remove();
        throw error;
      })
      .finally(() => {
        this.refreshInProgress = undefined;
      });

    return this.refreshInProgress;
  }

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

    // Get the current token from storage
    const jwtToken = this.options.tokenStorage.get();
    // If there's no current token, we can't refresh it
    if (!jwtToken) {
      return;
    }

    try {
      // Attempt to refresh the token
      await this.refresh(jwtToken.token);
      // Retry the original request with the new token
      await exchange.fetcher.interceptors.exchange(exchange);
    } catch (error) {
      // If token refresh fails, clear stored tokens and re-throw the error
      this.options.tokenStorage.remove();
      throw error;
    }
  }
}
