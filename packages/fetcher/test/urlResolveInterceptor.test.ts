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

import { describe, expect, it, vi } from 'vitest';
import {
  Fetcher,
  FetchExchange,
  URL_RESOLVE_INTERCEPTOR_NAME,
  URL_RESOLVE_INTERCEPTOR_ORDER,
  UrlBuilder,
  UrlResolveInterceptor,
} from '../src';

describe('UrlResolveInterceptor', () => {
  it('should have correct name and order', () => {
    const interceptor = new UrlResolveInterceptor();
    expect(interceptor.name).toBe(URL_RESOLVE_INTERCEPTOR_NAME);
    expect(interceptor.order).toBe(URL_RESOLVE_INTERCEPTOR_ORDER);
  });

  it('should resolve URL using fetcher urlBuilder', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    const fetcher = { urlBuilder } as Fetcher;
    const interceptor = new UrlResolveInterceptor();

    const request = {
      url: '/users/{id}',
      urlParams: {
        path: { id: 123 },
        query: { filter: 'active' },
      },
    };

    const exchange = new FetchExchange(fetcher, request);

    // Mock the urlBuilder.resolveRequestUrl method
    const resolvedUrl = 'https://api.example.com/users/123?filter=active';
    urlBuilder.resolveRequestUrl = vi.fn().mockReturnValue(resolvedUrl);

    interceptor.intercept(exchange);

    expect(urlBuilder.resolveRequestUrl).toHaveBeenCalledWith(request);
    expect(exchange.request.url).toBe(resolvedUrl);
  });

  it('should update request URL with resolved URL', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    const fetcher = { urlBuilder } as Fetcher;
    const interceptor = new UrlResolveInterceptor();

    const request = { url: '/users' };
    const exchange = new FetchExchange(fetcher, request);

    // Mock the urlBuilder.resolveRequestUrl method
    const resolvedUrl = 'https://api.example.com/users';
    urlBuilder.resolveRequestUrl = vi.fn().mockReturnValue(resolvedUrl);

    interceptor.intercept(exchange);

    expect(exchange.request.url).toBe(resolvedUrl);
  });
});
