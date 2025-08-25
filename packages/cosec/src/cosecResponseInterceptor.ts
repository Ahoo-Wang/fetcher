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
 */
export class CoSecResponseInterceptor implements Interceptor {
  name = 'CoSecResponseInterceptor';
  order = Number.MAX_SAFE_INTEGER;
  private options: CoSecOptions;

  constructor(options: CoSecOptions) {
    this.options = options;
  }

  async intercept(exchange: FetchExchange): Promise<FetchExchange> {
    const response = exchange.response;
    if (!response) {
      return exchange;
    }
    if (response.status !== ResponseCodes.UNAUTHORIZED) {
      return exchange;
    }
    const currentToken = this.options.tokenStorage.get();
    if (!currentToken) {
      return exchange;
    }
    try {
      const newToken = await this.options.tokenRefresher.refresh(currentToken);
      this.options.tokenStorage.set(newToken);
      return exchange.fetcher.request(exchange.url, exchange.request);
    } catch (error) {
      // If token refresh fails, clear stored tokens and re-throw the error
      this.options.tokenStorage.clear();
      throw error;
    }
  }
}
