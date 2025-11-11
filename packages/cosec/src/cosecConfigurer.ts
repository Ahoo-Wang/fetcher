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
import { AppIdCapable, DeviceIdStorageCapable } from './types';

/**
 * Simplified configuration interface for CoSec setup.
 * Provides flexible configuration with sensible defaults for optional components.
 */
export interface CoSecConfig
  extends AppIdCapable,
    Partial<DeviceIdStorageCapable> {
  /**
   * Application ID to be sent in the CoSec-App-Id header.
   * This is required for identifying your application in the CoSec system.
   */
  appId: string;

  /**
   * Custom token storage implementation.
   * If not provided, a default TokenStorage instance will be created.
   * Useful for custom storage backends or testing scenarios.
   */
  tokenStorage?: TokenStorage;

  /**
   * Custom device ID storage implementation.
   * If not provided, a default DeviceIdStorage instance will be created.
   * Useful for custom device identification strategies or testing scenarios.
   */
  deviceIdStorage?: DeviceIdStorage;

  /**
   * Token refresher implementation for handling expired tokens.
   * If not provided, authentication interceptors will not be added.
   * This enables CoSec configuration without full JWT authentication.
   */
  tokenRefresher?: TokenRefresher;

  /**
   * Callback function invoked when an unauthorized (401) response is detected.
   * If not provided, 401 errors will not be intercepted.
   */
  onUnauthorized?: (exchange: FetchExchange) => Promise<void> | void;

  /**
   * Callback function invoked when a forbidden (403) response is detected.
   * If not provided, 403 errors will not be intercepted.
   */
  onForbidden?: (exchange: FetchExchange) => Promise<void>;
}

/**
 * CoSecConfigurer provides a flexible way to configure CoSec interceptors
 * and dependencies with a single configuration object.
 *
 * This class implements FetcherConfigurer and supports both full authentication
 * setups and minimal CoSec header injection. It conditionally creates dependencies
 * based on the provided configuration, allowing for different levels of integration.
 *
 * @implements {FetcherConfigurer}
 *
 * @example
 * Full authentication setup with custom storage:
 * ```typescript
 * const configurer = new CoSecConfigurer({
 *   appId: 'my-app-001',
 *   tokenStorage: new CustomTokenStorage(),
 *   deviceIdStorage: new CustomDeviceStorage(),
 *   tokenRefresher: {
 *     refresh: async (token: CompositeToken) => {
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
 *   onUnauthorized: (exchange) => redirectToLogin(),
 *   onForbidden: (exchange) => showPermissionError(),
 * });
 *
 * configurer.applyTo(fetcher);
 * ```
 *
 * @example
 * Minimal setup with only CoSec headers (no authentication):
 * ```typescript
 * const configurer = new CoSecConfigurer({
 *   appId: 'my-app-001',
 *   // No tokenRefresher provided - authentication interceptors won't be added
 * });
 *
 * configurer.applyTo(fetcher);
 * ```
 */
export class CoSecConfigurer implements FetcherConfigurer {
  /**
   * Token storage instance, either provided in config or auto-created.
   */
  readonly tokenStorage: TokenStorage;

  /**
   * Device ID storage instance, either provided in config or auto-created.
   */
  readonly deviceIdStorage: DeviceIdStorage;

  /**
   * JWT token manager instance, only created if tokenRefresher is provided.
   * When undefined, authentication interceptors will not be added.
   */
  readonly tokenManager?: JwtTokenManager;

  /**
   * Creates a new CoSecConfigurer instance with the provided configuration.
   *
   * This constructor conditionally creates dependencies based on the configuration:
   * - TokenStorage and DeviceIdStorage are always created (using defaults if not provided)
   * - JwtTokenManager is only created if tokenRefresher is provided
   *
   * @param config - CoSec configuration object
   *
   * @example
   * ```typescript
   * // Full setup with all dependencies
   * const configurer = new CoSecConfigurer({
   *   appId: 'my-app',
   *   tokenRefresher: myTokenRefresher,
   * });
   *
   * // Minimal setup with custom storage
   * const configurer = new CoSecConfigurer({
   *   appId: 'my-app',
   *   tokenStorage: customStorage,
   *   deviceIdStorage: customDeviceStorage,
   * });
   * ```
   */
  constructor(public readonly config: CoSecConfig) {
    // Create storage instances with fallbacks to defaults
    this.tokenStorage = config.tokenStorage ?? new TokenStorage();
    this.deviceIdStorage = config.deviceIdStorage ?? new DeviceIdStorage();

    // Create token manager only if token refresher is provided
    if (config.tokenRefresher) {
      this.tokenManager = new JwtTokenManager(
        this.tokenStorage,
        config.tokenRefresher,
      );
    }
  }

  /**
   * Applies CoSec interceptors to the provided Fetcher instance.
   *
   * This method conditionally configures interceptors based on the provided configuration:
   *
   * Always added:
   * 1. CoSecRequestInterceptor - Adds CoSec headers (appId, deviceId, requestId)
   * 2. ResourceAttributionRequestInterceptor - Adds tenant/owner path parameters
   *
   * Only when `tokenRefresher` is provided:
   * 3. AuthorizationRequestInterceptor - Adds Bearer token authentication
   * 4. AuthorizationResponseInterceptor - Handles token refresh on 401 responses
   *
   * Only when corresponding handlers are provided:
   * 5. UnauthorizedErrorInterceptor - Handles 401 unauthorized errors
   * 6. ForbiddenErrorInterceptor - Handles 403 forbidden errors
   *
   * @param fetcher - The Fetcher instance to configure
   *
   * @example
   * ```typescript
   * const fetcher = new Fetcher({ baseURL: '/api' });
   * const configurer = new CoSecConfigurer({
   *   appId: 'my-app',
   *   tokenRefresher: myTokenRefresher,
   *   onUnauthorized: handle401,
   *   onForbidden: handle403,
   * });
   *
   * configurer.applyTo(fetcher);
   * // Now fetcher has all CoSec interceptors configured
   * ```
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
    if (this.tokenManager) {
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
