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
import { FunctionMetadata, ParameterType } from '../src';
import { fetcherRegistrar, HttpMethod } from '@ahoo-wang/fetcher';

// Mock fetcher
const mockFetch = vi.fn();
const mockFetcher = {
  fetch: mockFetch,
};

describe('FunctionMetadata', () => {
  it('should resolve path correctly', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '/api' },
      { method: HttpMethod.GET, path: '/users' },
      [],
    );

    const path = metadata.resolvePath();
    expect(path).toBe('/api/users');
  });

  it('should resolve timeout correctly', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { timeout: 5000 },
      { method: HttpMethod.GET },
      [],
    );

    const timeout = metadata.resolveTimeout();
    expect(timeout).toBe(5000);
  });

  it('should resolve request with path parameters', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      [
        {
          type: ParameterType.PATH,
          name: 'id',
          index: 0,
        },
      ],
    );

    const request = metadata.resolveRequest([123]);
    expect(request.urlParams?.path).toEqual({ id: 123 });
  });

  it('should resolve request with query parameters', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      [
        {
          type: ParameterType.QUERY,
          name: 'limit',
          index: 0,
        },
      ],
    );

    const request = metadata.resolveRequest([10]);
    expect(request.urlParams?.query).toEqual({ limit: 10 });
  });

  it('should resolve request with header parameters', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      [
        {
          type: ParameterType.HEADER,
          name: 'Authorization',
          index: 0,
        },
      ],
    );

    const request = metadata.resolveRequest(['Bearer token']);
    expect(request.headers).toEqual({ Authorization: 'Bearer token' });
  });

  it('should resolve request with body parameter', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.POST },
      [
        {
          type: ParameterType.BODY,
          index: 0,
        },
      ],
    );

    const requestBody = { name: 'John', age: 30 };
    const request = metadata.resolveRequest([requestBody]);
    expect(request.body).toEqual(requestBody);
  });

  it('should resolve request with null signal when no signal provided', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      [
        {
          type: ParameterType.PATH,
          name: 'id',
          index: 0,
        },
      ],
    );

    const request = metadata.resolveRequest([123]);
    expect(request.urlParams?.path).toEqual({ id: 123 });
    expect(request.signal).toBeUndefined();
  });

  it('should get fetcher correctly', () => {
    // Mock fetcher registrar
    vi.spyOn(fetcherRegistrar, 'requiredGet').mockReturnValue(
      mockFetcher as any,
    );

    const metadata = new FunctionMetadata(
      'testFunc',
      { fetcher: 'test' },
      { method: HttpMethod.GET },
      [],
    );

    const fetcher = metadata.fetcher;
    expect(fetcher).toBe(mockFetcher);
  });
});
