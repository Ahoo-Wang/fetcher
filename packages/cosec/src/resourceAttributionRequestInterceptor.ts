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
import { TokenStorage } from './tokenStorage';

/**
 * Configuration options for resource attribution
 */
export interface ResourceAttributionOptions {
  /**
   * The path parameter key used for tenant ID in URL templates
   */
  tenantId: string;
  /**
   * The path parameter key used for owner ID in URL templates
   */
  ownerId: string;
  /**
   * Storage mechanism for retrieving current authentication tokens
   */
  tokenStorage: TokenStorage;
}

/**
 * Name identifier for the ResourceAttributionRequestInterceptor
 */
export const RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME = 'ResourceAttributionRequestInterceptor';
/**
 * Order priority for the ResourceAttributionRequestInterceptor, set to maximum safe integer to ensure it runs last
 */
export const RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER = Number.MAX_SAFE_INTEGER;

/**
 * Request interceptor that automatically adds tenant and owner ID path parameters to requests
 * based on the current authentication token. This is useful for multi-tenant applications where
 * requests need to include tenant-specific information in the URL path.
 */
export class ResourceAttributionRequestInterceptor implements RequestInterceptor {

  readonly name = RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME;
  readonly order = RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER;

  /**
   * Creates a new ResourceAttributionRequestInterceptor
   * @param options - Configuration options for resource attribution including tenantId, ownerId and tokenStorage
   */
  constructor(private readonly options: ResourceAttributionOptions) {
  }

  /**
   * Intercepts outgoing requests and automatically adds tenant and owner ID path parameters
   * if they are defined in the URL template but not provided in the request.
   * @param exchange - The fetch exchange containing the request information
   */
  intercept(exchange: FetchExchange): void {
    const currentToken = this.options.tokenStorage.get();
    if (!currentToken) {
      return;
    }
    const principal = currentToken.access.payload;
    if (!principal) {
      return;
    }
    if (!principal.tenantId && !principal.sub) {
      return;
    }

    // Extract path parameters from the URL template
    const extractedPathParams = exchange.fetcher.urlBuilder.urlTemplateResolver.extractPathParams(exchange.request.url);
    const tenantIdPathKey = this.options.tenantId;
    const requestPathParams = exchange.ensureRequestUrlParams().path;
    const tenantId = principal.tenantId;

    // Add tenant ID to path parameters if it's part of the URL template and not already provided
    if (tenantId && extractedPathParams.includes(tenantIdPathKey) && !requestPathParams[tenantIdPathKey]) {
      requestPathParams[tenantIdPathKey] = tenantId;
    }

    const ownerIdPathKey = this.options.ownerId;
    const ownerId = principal.sub;

    // Add owner ID to path parameters if it's part of the URL template and not already provided
    if (ownerId && extractedPathParams.includes(ownerIdPathKey) && !requestPathParams[ownerIdPathKey]) {
      requestPathParams[ownerIdPathKey] = ownerId;
    }
  }

}