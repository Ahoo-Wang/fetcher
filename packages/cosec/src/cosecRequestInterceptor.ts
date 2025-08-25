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

import { Interceptor, FetcherRequest, FetchExchange } from '@ahoo-wang/fetcher';
import { CoSecHeaders, CoSecOptions } from './types';
import { idGenerator } from './idGenerator';

/**
 * CoSec Request Interceptor
 *
 * Automatically adds CoSec authentication headers to requests:
 * - CoSec-Device-Id: Device identifier (stored in localStorage or generated)
 * - CoSec-App-Id: Application identifier
 * - Authorization: Bearer token
 * - CoSec-Request-Id: Unique request identifier for each request
 */
export class CoSecRequestInterceptor implements Interceptor {
  name = 'CoSecRequestInterceptor';
  order = Number.MIN_SAFE_INTEGER;
  private options: CoSecOptions;

  constructor(options: CoSecOptions) {
    this.options = options;
  }

  /**
   * Intercept requests to add CoSec authentication headers
   */
  intercept(exchange: FetchExchange): FetchExchange {
    const requestId = idGenerator.generateId();
    const deviceId = this.options.deviceIdStorage.getOrCreate();
    const token = this.options.tokenStorage.get();

    // Clone the request to avoid modifying the original
    const newRequest: FetcherRequest = {
      ...exchange.request,
      headers: {
        ...exchange.request.headers,
      },
    };

    const requestHeaders = newRequest.headers as Record<string, string>;
    requestHeaders[CoSecHeaders.APP_ID] = this.options.appId;
    requestHeaders[CoSecHeaders.DEVICE_ID] = deviceId;
    requestHeaders[CoSecHeaders.REQUEST_ID] = requestId;
    if (token) {
      requestHeaders[CoSecHeaders.AUTHORIZATION] =
        `Bearer ${token.accessToken}`;
    }
    return { ...exchange, request: newRequest };
  }
}
