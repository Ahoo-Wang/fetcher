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
import { Fetcher, FetchExchange, FetchRequest, UrlBuilder, UrlResolveInterceptor } from '../src';

describe('UrlResolveInterceptor', () => {
  it('should have correct name and order', () => {
    const interceptor = new UrlResolveInterceptor();

    expect(interceptor.name).toBe('UrlResolveInterceptor');
    expect(interceptor.order).toBe(Number.MIN_SAFE_INTEGER + 100);
  });

  it('should resolve URL using urlBuilder', () => {
    const interceptor = new UrlResolveInterceptor();
    const mockResolvedUrl = 'https://api.example.com/users/123?filter=active';

    const mockUrlBuilder = {
      resolveRequestUrl: vi.fn().mockReturnValue(mockResolvedUrl),
    } as unknown as UrlBuilder;

    const request = {
      url: '/users/{id}',
    } as FetchRequest;

    const fetcher = {
      urlBuilder: mockUrlBuilder,
    } as Fetcher;

    const exchange = new FetchExchange(fetcher, request);

    interceptor.intercept(exchange);

    expect(mockUrlBuilder.resolveRequestUrl).toHaveBeenCalledWith(request);
    expect(request.url).toBe(mockResolvedUrl);
  });
});
