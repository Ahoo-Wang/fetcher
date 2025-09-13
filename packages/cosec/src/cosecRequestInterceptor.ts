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

import {
  FetchExchange,
  REQUEST_BODY_INTERCEPTOR_ORDER,
  type RequestInterceptor,
} from '@ahoo-wang/fetcher';
import { AppIdCapable, CoSecHeaders, DeviceIdStorageCapable } from './types';
import { idGenerator } from './idGenerator';

export interface CoSecRequestOptions extends AppIdCapable, DeviceIdStorageCapable {
}

/**
 * The name of the CoSecRequestInterceptor.
 */
export const COSEC_REQUEST_INTERCEPTOR_NAME = 'CoSecRequestInterceptor';

/**
 * The order of the CoSecRequestInterceptor.
 * Set to REQUEST_BODY_INTERCEPTOR_ORDER + 1000 to ensure it runs after RequestBodyInterceptor.
 */
export const COSEC_REQUEST_INTERCEPTOR_ORDER =
  REQUEST_BODY_INTERCEPTOR_ORDER + 1000;

export const IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY = 'Ignore-Refresh-Token';

/**
 * Interceptor that automatically adds CoSec authentication headers to requests.
 *
 * This interceptor adds the following headers to each request:
 * - CoSec-Device-Id: Device identifier (stored in localStorage or generated)
 * - CoSec-App-Id: Application identifier
 * - CoSec-Request-Id: Unique request identifier for each request
 *
 * @remarks
 * This interceptor runs after RequestBodyInterceptor but before FetchInterceptor.
 * The order is set to COSEC_REQUEST_INTERCEPTOR_ORDER to ensure it runs after
 * request body processing but before the actual HTTP request is made. This positioning
 * allows for proper authentication header addition after all request body transformations
 * are complete, ensuring that the final request is properly authenticated before
 * being sent over the network.
 */
export class CoSecRequestInterceptor implements RequestInterceptor {
  readonly name = COSEC_REQUEST_INTERCEPTOR_NAME;
  readonly order = COSEC_REQUEST_INTERCEPTOR_ORDER;
  private options: CoSecRequestOptions;

  /**
   * Creates a new CoSecRequestInterceptor instance.
   * @param options - The CoSec configuration options including appId, deviceIdStorage, and tokenManager
   */
  constructor(options: CoSecRequestOptions) {
    this.options = options;
  }

  /**
   * Intercept requests to add CoSec authentication headers.
   *
   * This method adds the following headers to each request:
   * - CoSec-App-Id: The application identifier from the CoSec options
   * - CoSec-Device-Id: A unique device identifier, either retrieved from storage or generated
   * - CoSec-Request-Id: A unique identifier for this specific request
   *
   * @param exchange - The fetch exchange containing the request to process
   *
   * @remarks
   * This method runs after RequestBodyInterceptor but before FetchInterceptor.
   * It ensures that authentication headers are added to the request after all
   * body processing is complete. The positioning allows for proper authentication
   * header addition after all request body transformations are finished, ensuring
   * that the final request is properly authenticated before being sent over the network.
   * This execution order prevents authentication headers from being overwritten by
   * subsequent request processing interceptors.
   *
   * The method also handles token refreshing when the current token is expired but still refreshable.
   * It will attempt to refresh the token before adding the Authorization header to the request.
   */
  async intercept(exchange: FetchExchange) {
    // Generate a unique request ID for this request
    const requestId = idGenerator.generateId();

    // Get or create a device ID
    const deviceId = this.options.deviceIdStorage.getOrCreate();

    // Ensure request headers object exists
    const requestHeaders = exchange.ensureRequestHeaders();

    // Add CoSec headers to the request
    requestHeaders[CoSecHeaders.APP_ID] = this.options.appId;
    requestHeaders[CoSecHeaders.DEVICE_ID] = deviceId;
    requestHeaders[CoSecHeaders.REQUEST_ID] = requestId;

  }
}