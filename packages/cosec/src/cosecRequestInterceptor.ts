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
  DEFAULT_INTERCEPTOR_ORDER_STEP,
  FetchExchange,
  type RequestInterceptor,
} from '@ahoo-wang/fetcher';
import { AppIdCapable, CoSecHeaders, DeviceIdStorageCapable } from './types';
import { idGenerator } from './idGenerator';
import { NoneSpaceIdProvider, SpaceIdProvider } from './spaceIdProvider';
import { DeviceIdStorage } from './deviceIdStorage';

/**
 * Configuration options for CoSecRequestInterceptor.
 *
 * This interface combines the required dependencies (appId and deviceIdStorage)
 * with an optional spaceIdProvider for multi-tenant, multi-space applications.
 *
 * @remarks
 * The appId identifies your application in the CoSec authentication system.
 * The deviceIdStorage manages persistent device identifiers for tracking.
 * The spaceIdProvider (optional) enables space-scoped resource access control.
 *
 * @example
 * ```typescript
 * // Basic configuration
 * const options: CoSecRequestOptions = {
 *   appId: 'my-web-app',
 *   deviceIdStorage: new DeviceIdStorage()
 * };
 *
 * // With space support for multi-tenant applications
 * const optionsWithSpace: CoSecRequestOptions = {
 *   appId: 'my-web-app',
 *   deviceIdStorage: new DeviceIdStorage(),
 *   spaceIdProvider: new DefaultSpaceIdProvider({
 *     spacedResourcePredicate: urlPredicate,
 *     spaceIdStorage: new SpaceIdStorage()
 *   })
 * };
 * ```
 */
export interface CoSecRequestOptions
  extends AppIdCapable, DeviceIdStorageCapable {
  /**
   * Optional provider for resolving space identifiers from requests.
   *
   * When provided, enables space-scoped resource access by adding the
   * CoSec-Space-Id header to requests for space-scoped resources.
   *
   * @defaultValue NoneSpaceIdProvider (no space identification)
   */
  spaceIdProvider?: SpaceIdProvider;
}

/**
 * The unique identifier name for the CoSecRequestInterceptor.
 *
 * This constant is used by the Fetcher interceptor registration system
 * to identify and manage this interceptor instance.
 *
 * @example
 * ```typescript
 * // Used internally by Fetcher for interceptor registration
 * fetcher.addInterceptor(new CoSecRequestInterceptor(options));
 * console.log(interceptor.name); // 'CoSecRequestInterceptor'
 * ```
 */
export const COSEC_REQUEST_INTERCEPTOR_NAME = 'CoSecRequestInterceptor';

/**
 * The execution order for the CoSecRequestInterceptor.
 *
 * This value is calculated to ensure the interceptor runs after request body
 * processing but before the actual HTTP request is made. The order is set
 * to Number.MIN_SAFE_INTEGER + DEFAULT_INTERCEPTOR_ORDER_STEP to guarantee
 * early execution while maintaining safe integer boundaries.
 *
 * @remarks
 * - Position: After RequestBodyInterceptor
 * - Position: Before FetchInterceptor
 * - Value: Number.MIN_SAFE_INTEGER + 1000
 *
 * @example
 * ```typescript
 * const interceptor = new CoSecRequestInterceptor(options);
 * console.log(interceptor.order); // -9007199254740990
 * ```
 */
export const COSEC_REQUEST_INTERCEPTOR_ORDER =
  Number.MIN_SAFE_INTEGER + DEFAULT_INTERCEPTOR_ORDER_STEP;

/**
 * Attribute key used to mark requests that should skip token refresh.
 *
 * When this attribute is set to true on a request exchange, the
 * AuthorizationRequestInterceptor will skip the automatic token refresh
 * for that specific request. This is useful for operations where
 * token refresh would cause issues, such as logout requests.
 *
 * @remarks
 * Set this attribute on the exchange before the AuthorizationRequestInterceptor runs:
 * ```typescript
 * exchange.attributes.set(IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true);
 * ```
 *
 * @example
 * ```typescript
 * // Skip refresh during logout
 * const logoutExchange = await fetcher.createRequest('/logout', {
 *   method: 'POST'
 * }).getExchange();
 * logoutExchange.attributes.set(IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true);
 * await fetcher.fetch(logoutExchange);
 * ```
 */
export const IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY = 'Ignore-Refresh-Token';

/**
 * Request interceptor that automatically adds CoSec authentication headers to outgoing requests.
 *
 * CoSecRequestInterceptor enriches each HTTP request with security-related headers
 * that enable the CoSec authentication system to:
 * - Track device identifiers for security monitoring
 * - Identify the application making the request
 * - Correlate requests for logging and analytics
 * - Scope requests to specific spaces in multi-tenant environments
 *
 * @remarks
 * **Header Injection:**
 * This interceptor injects the following headers into every outgoing request:
 * - `CoSec-App-Id`: Identifies your application
 * - `CoSec-Device-Id`: Unique device identifier (persisted or generated)
 * - `CoSec-Request-Id`: Unique identifier for this request (per-request)
 * - `CoSec-Space-Id`: Space identifier (when spaceIdProvider returns a value)
 *
 * **Execution Order:**
 * The interceptor runs at COSEC_REQUEST_INTERCEPTOR_ORDER position, which ensures:
 * 1. Request body processing is complete
 * 2. Authentication headers are not overwritten by subsequent interceptors
 * 3. Headers are present before the actual HTTP request is made
 *
 * **Device ID Management:**
 * - First request: Generates a new device ID using nanoid
 * - Subsequent requests: Reuses the stored device ID
 * - Storage: Persisted in localStorage with cross-tab synchronization
 *
 * **Space ID Resolution:**
 * - The spaceIdProvider determines if the request requires space scoping
 * - Space ID is resolved before header injection
 * - Supports both space-scoped and non-scoped resources
 *
 * @example
 * ```typescript
 * import { Fetcher } from '@ahoo-wang/fetcher';
 * import { CoSecRequestInterceptor } from '@ahoo-wang/fetcher-cosec';
 * import { DeviceIdStorage } from '@ahoo-wang/fetcher-cosec';
 *
 * // Create dependencies
 * const deviceIdStorage = new DeviceIdStorage();
 *
 * // Create the interceptor
 * const coSecInterceptor = new CoSecRequestInterceptor({
 *   appId: 'my-saas-application',
 *   deviceIdStorage
 * });
 *
 * // Register with Fetcher
 * const fetcher = new Fetcher()
 *   .addInterceptor(coSecInterceptor)
 *   .setBaseUrl('https://api.example.com');
 *
 * // All requests will now include CoSec headers
 * const response = await fetcher.get('/api/users');
 * // Request headers include:
 * // - CoSec-App-Id: my-saas-application
 * // - CoSec-Device-Id: <unique-device-id>
 * // - CoSec-Request-Id: <unique-request-id>
 * ```
 *
 * @example
 * ```typescript
 * // Multi-tenant with space support
 * import { DefaultSpaceIdProvider, SpaceIdStorage } from '@ahoo-wang/fetcher-cosec';
 *
 * const spaceStorage = new SpaceIdStorage();
 * const spaceIdProvider = new DefaultSpaceIdProvider({
 *   spacedResourcePredicate: {
 *     test: (exchange) => exchange.request.url.includes('/spaces/')
 *   },
 *   spaceIdStorage: spaceStorage
 * });
 *
 * const coSecInterceptor = new CoSecRequestInterceptor({
 *   appId: 'my-saas-application',
 *   deviceIdStorage,
 *   spaceIdProvider
 * });
 * ```
 */
export class CoSecRequestInterceptor implements RequestInterceptor {
  /**
   * The unique name of this interceptor.
   *
   * Used by the Fetcher interceptor system for identification and ordering.
   */
  readonly name = COSEC_REQUEST_INTERCEPTOR_NAME;

  /**
   * The execution order of this interceptor.
   *
   * Set to COSEC_REQUEST_INTERCEPTOR_ORDER to ensure proper positioning
   * in the interceptor chain.
   */
  readonly order = COSEC_REQUEST_INTERCEPTOR_ORDER;

  /**
   * The application identifier.
   *
   * This value is injected into the CoSec-App-Id header for every request.
   * It identifies your application in the CoSec authentication system.
   */
  private readonly appId: string;

  /**
   * Storage for device identifiers.
   *
   * Provides persistent storage and retrieval of device identifiers
   * with cross-tab synchronization.
   */
  private readonly deviceIdStorage: DeviceIdStorage;

  /**
   * Provider for resolving space identifiers.
   *
   * Determines which space a request belongs to (if any) for
   * multi-tenant, multi-space applications.
   */
  private readonly spaceIdProvider: SpaceIdProvider;

  /**
   * Creates a new CoSecRequestInterceptor instance.
   *
   * @param options - The CoSec configuration options
   * @param options.appId - The application identifier for CoSec authentication
   * @param options.deviceIdStorage - Storage for device identifier management
   * @param options.spaceIdProvider - Optional provider for space identification
   *
   * @throws Error if appId is empty or not provided
   * @throws Error if deviceIdStorage is not provided
   *
   * @example
   * ```typescript
   * // Basic instantiation
   * const interceptor = new CoSecRequestInterceptor({
   *   appId: 'my-web-app',
   *   deviceIdStorage: new DeviceIdStorage()
   * });
   *
   * // With custom device ID storage
   * const customStorage = new DeviceIdStorage({
   *   key: 'custom-device-key',
   *   storage: sessionStorage
   * });
   * const interceptorWithCustom = new CoSecRequestInterceptor({
   *   appId: 'my-web-app',
   *   deviceIdStorage: customStorage
   * });
   *
   * // With space support
   * const spaceStorage = new SpaceIdStorage();
   * const spaceProvider = new DefaultSpaceIdProvider({
   *   spacedResourcePredicate: { test: (e) => true },
   *   spaceIdStorage: spaceStorage
   * });
   * const interceptorWithSpace = new CoSecRequestInterceptor({
   *   appId: 'my-web-app',
   *   deviceIdStorage,
   *   spaceIdProvider: spaceProvider
   * });
   * ```
   */
  constructor({
    appId,
    deviceIdStorage,
    spaceIdProvider,
  }: CoSecRequestOptions) {
    this.appId = appId;
    this.deviceIdStorage = deviceIdStorage;
    this.spaceIdProvider = spaceIdProvider ?? NoneSpaceIdProvider;
  }

  /**
   * Intercepts outgoing requests to add CoSec authentication headers.
   *
   * This method is called by the Fetcher interceptor chain for each request.
   * It enriches the request with security headers before the HTTP request is made.
   *
   * **Header Injection Process:**
   * 1. Generates a unique request ID using the idGenerator
   * 2. Retrieves or creates a device ID from deviceIdStorage
   * 3. Resolves space ID from spaceIdProvider (if applicable)
   * 4. Adds all headers to the request
   *
   * @param exchange - The fetch exchange containing the request to process
   *
   * @remarks
   * **Header Values:**
   * - `CoSec-App-Id`: Always set to the configured appId
   * - `CoSec-Device-Id`: Retrieved from storage or newly generated
   * - `CoSec-Request-Id`: Unique per request (not persisted)
   * - `CoSec-Space-Id`: Set only if spaceIdProvider returns a value
   *
   * **Error Handling:**
   * - If deviceIdStorage.getOrCreate() throws, the error propagates
   * - If spaceIdProvider.resolveSpaceId() throws, the error propagates
   * - If ensureRequestHeaders() fails, the error propagates
   *
   * **Thread Safety:**
   * - The idGenerator is safe for concurrent use
   * - deviceIdStorage handles concurrent access internally
   * - Each request gets a unique request ID
   *
   * @example
   * ```typescript
   * // The interceptor is called automatically by Fetcher
   * const fetcher = new Fetcher()
   *   .addInterceptor(new CoSecRequestInterceptor({
   *     appId: 'my-app',
   *     deviceIdStorage: new DeviceIdStorage()
   *   }));
   *
   * // This request will have CoSec headers added
   * const response = await fetcher.get('/api/data');
   * ```
   *
   * @example
   * ```typescript
   * // Headers added to outgoing request:
   * // GET /api/users HTTP/1.1
   * // Host: api.example.com
   * // CoSec-App-Id: my-app
   * // CoSec-Device-Id: abc123xyz789
   * // CoSec-Request-Id: req_abc123def456
   * // CoSec-Space-Id: workspace-alpha  (if space resolved)
   * ```
   */
  async intercept(exchange: FetchExchange) {
    // Generate a unique request ID for this request
    const requestId = idGenerator.generateId();

    // Get or create a device ID
    const deviceId = this.deviceIdStorage.getOrCreate();

    // Resolve space ID for multi-tenant support
    const spaceId = this.spaceIdProvider.resolveSpaceId(exchange);

    // Ensure request headers object exists
    const requestHeaders = exchange.ensureRequestHeaders();

    // Add CoSec headers to the request
    requestHeaders[CoSecHeaders.APP_ID] = this.appId;
    requestHeaders[CoSecHeaders.DEVICE_ID] = deviceId;
    requestHeaders[CoSecHeaders.REQUEST_ID] = requestId;
    if (spaceId) {
      requestHeaders[CoSecHeaders.SPACE_ID] = spaceId;
    }
  }
}
