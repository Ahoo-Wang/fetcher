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

import { Fetcher, FetcherConfigurer, FetchExchange } from '@ahoo-wang/fetcher';
import { AuthorizationRequestInterceptor } from './authorizationRequestInterceptor';
import { AuthorizationResponseInterceptor } from './authorizationResponseInterceptor';
import { CoSecRequestInterceptor } from './cosecRequestInterceptor';
import { DeviceIdStorage } from './deviceIdStorage';
import { ForbiddenErrorInterceptor } from './forbiddenErrorInterceptor';
import { JwtTokenManager } from './jwtTokenManager';
import { ResourceAttributionRequestInterceptor } from './resourceAttributionRequestInterceptor';
import { TokenRefresher } from './tokenRefresher';
import { TokenStorage } from './tokenStorage';
import { UnauthorizedErrorInterceptor } from './unauthorizedErrorInterceptor';

/**
 * Simplified configuration interface for CoSec setup.
 * Only requires the essential configuration, with sensible defaults for everything else.
 */
export interface CoSecConfig {
  /**
   * Application ID to be sent in the CoSec-App-Id header.
   * This is required for identifying your application in the CoSec system.
   */
  appId: string;

  tokenStorage?: TokenStorage;
  deviceIdStorage?: DeviceIdStorage;
  /**
   * Token refresher implementation for handling expired tokens.
   * This is required to enable automatic token refresh functionality.
   */
  tokenRefresher?: TokenRefresher;
  /**
   * Callback function invoked when an unauthorized (401) response is detected.
   * If not provided, defaults to throwing an error.
   */
  onUnauthorized?: (exchange: FetchExchange) => Promise<void> | void;

  /**
   * Callback function invoked when a forbidden (403) response is detected.
   * If not provided, 403 errors will not be intercepted.
   */
  onForbidden?: (exchange: FetchExchange) => Promise<void>;
}

/**
 * CoSecConfigurer provides a simplified way to configure all CoSec interceptors
 * and dependencies with a single configuration object.
 *
 * This class automatically creates all necessary dependencies (TokenStorage, DeviceIdStorage,
 * JwtTokenManager) and configures all CoSec interceptors with sensible defaults.
 *
 * @example
 * ```typescript
 * const configurer = new CoSecConfigurer({
 *   appId: 'my-app-001',
 *   tokenRefresher: {
 *     refresh: async (token: CompositeToken) => {
 *       // Your token refresh logic here
 *       const response = await fetch('/api/auth/refresh', {
 *         method: 'POST',
 *         body: JSON.stringify({ refreshToken: token.refreshToken }),
 *       });
 *       const newTokens = await response.json();
 *       return {
 *         accessToken: newTokens.accessToken,
 *         refreshToken: newTokens.refreshToken,
 *       };
 *     },
 *   },
 * });
 *
 * configurer.applyTo(fetcher);
 * ```
 */
export class CoSecConfigurer implements FetcherConfigurer {
  readonly tokenStorage: TokenStorage;
  readonly deviceIdStorage: DeviceIdStorage;
  readonly tokenManager?: JwtTokenManager;

  /**
   * Creates a new CoSecConfigurer instance with the provided configuration.
   *
   * @param config - Simplified CoSec configuration
   */
  constructor(public readonly config: CoSecConfig) {
    // Create storage instances
    this.tokenStorage = config.tokenStorage ?? new TokenStorage();
    this.deviceIdStorage = config.deviceIdStorage ?? new DeviceIdStorage();

    // Create token manager
    if (config.tokenRefresher){
      this.tokenManager = new JwtTokenManager(
        this.tokenStorage,
        config.tokenRefresher,
      );
    }
  }

  /**
   * Applies all CoSec interceptors to the provided Fetcher instance.
   *
   * This method configures the following interceptors in the correct order:
   * 1. CoSecRequestInterceptor - Adds CoSec headers (appId, deviceId, requestId)
   * 2. AuthorizationRequestInterceptor - Adds Authorization header with Bearer token
   * 3. ResourceAttributionRequestInterceptor - Adds tenant/owner path parameters
   * 4. AuthorizationResponseInterceptor - Handles 401 responses with token refresh
   * 5. UnauthorizedErrorInterceptor - Handles unauthorized errors
   * 6. ForbiddenErrorInterceptor - Handles forbidden errors
   *
   * @param fetcher - The Fetcher instance to configure
   */
  applyTo(fetcher: Fetcher): void {
    fetcher.interceptors.request.use(
      new CoSecRequestInterceptor({
        appId: this.config.appId,
        deviceIdStorage: this.deviceIdStorage,
      }),
    );

    fetcher.interceptors.request.use(
      new ResourceAttributionRequestInterceptor({
        tokenStorage: this.tokenStorage,
      }),
    );
    if (this.tokenManager){
      fetcher.interceptors.request.use(
        new AuthorizationRequestInterceptor({
          tokenManager: this.tokenManager,
        }),
      );

      fetcher.interceptors.response.use(
        new AuthorizationResponseInterceptor({
          tokenManager: this.tokenManager,
        }),
      );
    }
    if (this.config.onUnauthorized) {
      fetcher.interceptors.error.use(
        new UnauthorizedErrorInterceptor({
          onUnauthorized: this.config.onUnauthorized,
        }),
      );
    }

    if (this.config.onForbidden) {
      fetcher.interceptors.error.use(
        new ForbiddenErrorInterceptor({
          onForbidden: this.config.onForbidden,
        }),
      );
    }
  }
}
