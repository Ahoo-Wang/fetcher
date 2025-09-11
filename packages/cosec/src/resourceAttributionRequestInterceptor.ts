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

export const RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME = 'ResourceAttributionRequestInterceptor';
export const RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER = Number.MAX_SAFE_INTEGER;

export class ResourceAttributionRequestInterceptor implements RequestInterceptor {

  readonly name = RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME;
  readonly order = RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER;

  constructor(private readonly tokenStorage: TokenStorage) {
  }

  intercept(exchange: FetchExchange): void {
    const currentToken = this.tokenStorage.get();
    if (!currentToken) {
      return;
    }
    const pathParams = exchange.ensureRequestUrlParams().path;

    const tenantId = currentToken.access?.payload.tenantId;
    pathParams['tenantId'] = currentToken.access.payload.tenantId;
  }
}