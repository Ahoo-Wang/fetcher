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
import type { Fetcher } from '../src';
import {
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

    const exchange = new FetchExchange({ fetcher, request });

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
    const exchange = new FetchExchange({ fetcher, request });

    // Mock the urlBuilder.resolveRequestUrl method
    const resolvedUrl = 'https://api.example.com/users';
    urlBuilder.resolveRequestUrl = vi.fn().mockReturnValue(resolvedUrl);

    interceptor.intercept(exchange);

    expect(exchange.request.url).toBe(resolvedUrl);
  });

  // Regression test: intercepting the same exchange twice (e.g. an error
  // interceptor retrying after a token refresh) must not append the query
  // string to the resolved URL a second time.
  it('should be idempotent when re-run on an already-resolved request', () => {
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
    const exchange = new FetchExchange({ fetcher, request });

    interceptor.intercept(exchange);
    const firstUrl = exchange.request.url;
    expect(firstUrl).toBe('https://api.example.com/users/123?filter=active');

    interceptor.intercept(exchange);
    expect(exchange.request.url).toBe(firstUrl);
  });

  // Regression test for #2009: a relative base URL must not be prefixed again
  // when the same exchange re-runs the request chain (e.g. an auth interceptor's 401 retry).
  it.each(['/api', 'api', '/api/', ''])(
    'should not prefix the relative base URL %j again on a re-run',
    baseURL => {
      const fetcher = { urlBuilder: new UrlBuilder(baseURL) } as Fetcher;
      const interceptor = new UrlResolveInterceptor();
      const exchange = new FetchExchange({
        fetcher,
        request: {
          url: '/resource/{id}',
          urlParams: { path: { id: 1 }, query: { limit: 1 } },
        },
      });

      interceptor.intercept(exchange);
      const firstUrl = exchange.request.url;
      expect(firstUrl).toBe(
        `${baseURL.replace(/\/+$/, '')}/resource/1?limit=1`,
      );

      interceptor.intercept(exchange);
      interceptor.intercept(exchange);
      expect(exchange.request.url).toBe(firstUrl);
    },
  );

  it('should apply URL params set before a re-run without the base URL again', () => {
    const fetcher = { urlBuilder: new UrlBuilder('/api') } as Fetcher;
    const interceptor = new UrlResolveInterceptor();
    const exchange = new FetchExchange({
      fetcher,
      request: { url: '/resource', urlParams: { query: { limit: 1 } } },
    });

    interceptor.intercept(exchange);
    exchange.request.urlParams = { query: { retry: 1 } };
    interceptor.intercept(exchange);

    expect(exchange.request.url).toBe('/api/resource?limit=1&retry=1');
    expect(exchange.request.urlParams).toBeUndefined();
  });

  it('should resolve a URL replaced before a re-run in full', () => {
    const fetcher = { urlBuilder: new UrlBuilder('/api') } as Fetcher;
    const interceptor = new UrlResolveInterceptor();
    const exchange = new FetchExchange({
      fetcher,
      request: { url: '/resource' },
    });

    interceptor.intercept(exchange);
    exchange.request.url = '/other';
    interceptor.intercept(exchange);

    expect(exchange.request.url).toBe('/api/other');
  });
});
