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

import { describe, expect, it } from 'vitest';
import { Fetcher, FetchExchange, UrlResolveInterceptor } from '../src';

describe('UrlResolveInterceptor', () => {
  it('should have correct name and order', () => {
    const interceptor = new UrlResolveInterceptor();
    expect(interceptor.name).toBe('UrlResolveInterceptor');
    expect(interceptor.order).toBe(Number.MIN_SAFE_INTEGER + 100);
  });

  it('should resolve URL with path and query parameters', () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const interceptor = new UrlResolveInterceptor();

    const exchange: FetchExchange = {
      fetcher,
      request: {
        url: '/users/{id}',
        method: 'GET',
        path: { id: 123 },
        query: { filter: 'active' },
      },
      response: undefined,
      error: undefined,
      attributes: {},
    };

    const result = interceptor.intercept(exchange);

    expect(result.request.url).toBe(
      'https://api.example.com/users/123?filter=active',
    );
  });

  it('should resolve URL without path and query parameters', () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const interceptor = new UrlResolveInterceptor();

    const exchange: FetchExchange = {
      fetcher,
      request: {
        url: '/users',
        method: 'GET',
      },
      response: undefined,
      error: undefined,
      attributes: {},
    };

    const result = interceptor.intercept(exchange);

    expect(result.request.url).toBe('https://api.example.com/users');
  });

  it('should resolve URL with only path parameters', () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const interceptor = new UrlResolveInterceptor();

    const exchange: FetchExchange = {
      fetcher,
      request: {
        url: '/users/{id}/posts/{postId}',
        method: 'GET',
        path: { id: 123, postId: 456 },
      },
      response: undefined,
      error: undefined,
      attributes: {},
    };

    const result = interceptor.intercept(exchange);

    expect(result.request.url).toBe(
      'https://api.example.com/users/123/posts/456',
    );
  });

  it('should resolve URL with only query parameters', () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const interceptor = new UrlResolveInterceptor();

    const exchange: FetchExchange = {
      fetcher,
      request: {
        url: '/users',
        method: 'GET',
        query: {
          filter: 'active',
          limit: 10,
        },
      },
      response: undefined,
      error: undefined,
      attributes: {},
    };

    const result = interceptor.intercept(exchange);

    expect(result.request.url).toBe(
      'https://api.example.com/users?filter=active&limit=10',
    );
  });

  it('should resolve URL with array query parameters', () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    const interceptor = new UrlResolveInterceptor();

    const exchange: FetchExchange = {
      fetcher,
      request: {
        url: '/users',
        method: 'GET',
        query: {
          tags: ['important', 'urgent'],
          status: 'active',
        },
      },
      response: undefined,
      error: undefined,
      attributes: {},
    };

    const result = interceptor.intercept(exchange);

    // Check that the URL contains the expected parameters
    expect(result.request.url).toContain('https://api.example.com/users');
    expect(result.request.url).toContain('tags=important');
    expect(result.request.url).toContain('status=active');
  });
});
