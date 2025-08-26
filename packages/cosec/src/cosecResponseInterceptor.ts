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

import { CoSecOptions, ResponseCodes } from './types';
import { FetchExchange, Interceptor } from '@ahoo-wang/fetcher';

/**
 * CoSec Response Interceptor
 *
 * Handles automatic token refresh based on response codes
 *
 * @remarks
 * This interceptor runs near the end of the response processing chain, just before
 * the final response is returned. The order is set to Number.MAX_SAFE_INTEGER - 100
 * to ensure it runs after most other response interceptors but still allows for
 * final processing interceptors to run afterward. This order aligns with other
 * response enhancement interceptors like EventStreamInterceptor.
 */
export class CoSecResponseInterceptor implements Interceptor {
  name = 'CoSecResponseInterceptor';
  order = Number.MAX_SAFE_INTEGER - 100;
  private options: CoSecOptions;

  constructor(options: CoSecOptions) {
    this.options = options;
  }

  /**
   * Intercept responses to handle token refresh for unauthorized responses
   *
   * This method checks if a response has a 401 (UNAUTHORIZED) status code and attempts
   * to refresh the authentication token if one is available. If token refresh is successful,
   * the original request is retried with the new token. If token refresh fails, stored
   * tokens are cleared and the original error is re-thrown.
   *
   * @param exchange - The fetch exchange containing the response to be processed
   * @returns Promise<FetchExchange> The processed exchange, either with a refreshed token or original error
   * @throws Error if token refresh fails or other errors occur during processing
   */
  async intercept(exchange: FetchExchange): Promise<void> {
    const response = exchange.response;
    if (!response) {
      return;
    }
    if (response.status !== ResponseCodes.UNAUTHORIZED) {
      return;
    }
    const currentToken = this.options.tokenStorage.get();
    if (!currentToken) {
      return;
    }
    try {
      const newToken = await this.options.tokenRefresher.refresh(currentToken);
      this.options.tokenStorage.set(newToken);
      await exchange.fetcher.request(exchange.request);
    } catch (error) {
      // If token refresh fails, clear stored tokens and re-throw the error
      this.options.tokenStorage.clear();
      throw error;
    }
  }
}
