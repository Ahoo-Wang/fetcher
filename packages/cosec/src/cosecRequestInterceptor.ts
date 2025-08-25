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

import { FetcherRequest, FetchExchange, Interceptor } from '@ahoo-wang/fetcher';
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
 *
 * @remarks
 * This interceptor runs after the basic request processing interceptors but before
 * the actual HTTP request is made. The order is set to Number.MIN_SAFE_INTEGER + 1000
 * to allow for other authentication or preprocessing interceptors to run earlier
 * while ensuring it runs before FetchInterceptor.
 */
export class CoSecRequestInterceptor implements Interceptor {
  name = 'CoSecRequestInterceptor';
  order = Number.MIN_SAFE_INTEGER + 1000;
  private options: CoSecOptions;

  constructor(options: CoSecOptions) {
    this.options = options;
  }

  /**
   * Intercept requests to add CoSec authentication headers
   *
   * This method adds the following headers to each request:
   * - CoSec-App-Id: The application identifier from the CoSec options
   * - CoSec-Device-Id: A unique device identifier, either retrieved from storage or generated
   * - CoSec-Request-Id: A unique identifier for this specific request
   * - Authorization: Bearer token if available in token storage
   *
   * @param exchange - The fetch exchange containing the request to be processed
   * @returns The modified exchange with CoSec authentication headers added
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
    exchange.request = newRequest;
    return exchange;
  }
}
