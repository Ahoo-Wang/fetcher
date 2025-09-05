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
import { fetcherRegistrar, HttpMethod, Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

// Mock fetcher
const mockFetch = vi.fn();
const mockFetcher = new Fetcher({} as any);
vi.spyOn(mockFetcher, 'fetch').mockImplementation(mockFetch);
vi.spyOn(fetcherRegistrar, 'requiredGet').mockReturnValue(mockFetcher);

describe('FunctionMetadata - branch coverage', () => {
  it('should handle parameter without name', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map([
        [
          0,
          {
            type: ParameterType.PATH,
            index: 0,
          },
        ],
        [
          1,
          {
            type: ParameterType.QUERY,
            index: 1,
          },
        ],
      ]),
    );

    const request = metadata.resolveRequest(['pathValue', 'queryValue']);

    expect(request.urlParams?.path).toEqual({ param0: 'pathValue' });
    expect(request.urlParams?.query).toEqual({ param1: 'queryValue' });
  });

  it('should handle fetcher resolution with different priorities', () => {
    // Test with endpoint fetcher
    const metadata1 = new FunctionMetadata(
      'testFunc',
      { fetcher: 'apiFetcher' },
      { method: HttpMethod.GET, fetcher: 'endpointFetcher' },
      new Map(),
    );

    expect(metadata1.fetcher).toBe(mockFetcher);

    // Test with api fetcher
    const metadata2 = new FunctionMetadata(
      'testFunc',
      { fetcher: 'apiFetcher' },
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata2.fetcher).toBe(mockFetcher);

    // Test with default fetcher
    const metadata3 = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata3.fetcher).toBeDefined();
  });

  it('should handle path resolution with different basePath and path combinations', () => {
    // Test with both basePath and path
    const metadata1 = new FunctionMetadata(
      'testFunc',
      { basePath: '/api' },
      { method: HttpMethod.GET, path: '/users' },
      new Map(),
    );
    expect(metadata1.resolvePath('orders')).toBe('/api/orders');
    expect(metadata1.resolvePath()).toBe('/api/users');

    // Test with only basePath
    const metadata2 = new FunctionMetadata(
      'testFunc',
      { basePath: '/api' },
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata2.resolvePath()).toBe('/api');

    // Test with only path
    const metadata3 = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET, path: '/users' },
      new Map(),
    );

    expect(metadata3.resolvePath()).toBe('/users');

    // Test with neither basePath nor path
    const metadata4 = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata4.resolvePath()).toBe('');
  });

  it('should handle timeout resolution with different priorities', () => {
    // Test with endpoint timeout
    const metadata1 = new FunctionMetadata(
      'testFunc',
      { timeout: 1000 },
      { method: HttpMethod.GET, timeout: 2000 },
      new Map(),
    );

    expect(metadata1.resolveTimeout()).toBe(2000);

    // Test with api timeout
    const metadata2 = new FunctionMetadata(
      'testFunc',
      { timeout: 1000 },
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata2.resolveTimeout()).toBe(1000);

    // Test with no timeout
    const metadata3 = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata3.resolveTimeout()).toBeUndefined();
  });

  it('should handle path parameter without name', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map([
        [
          0,
          {
            type: ParameterType.PATH,
            index: 0,
          },
        ],
      ]),
    );

    const request = metadata.resolveRequest(['pathValue']);
    expect(request.urlParams?.path).toEqual({ param0: 'pathValue' });
  });

  it('should handle query parameter without name', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map([
        [
          0,
          {
            type: ParameterType.QUERY,
            index: 0,
          },
        ],
      ]),
    );

    const request = metadata.resolveRequest(['queryValue']);
    expect(request.urlParams?.query).toEqual({ param0: 'queryValue' });
  });

  it('should handle header parameter with undefined value', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map([
        [
          0,
          {
            type: ParameterType.HEADER,
            name: 'Authorization',
            index: 0,
          },
        ],
      ]),
    );

    const request = metadata.resolveRequest([undefined]);
    expect(request.headers).toEqual({});
  });

  it('should handle AbortSignal parameter', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    const abortController = new AbortController();
    const request = metadata.resolveRequest([abortController.signal]);
    expect(request.signal).toBe(abortController.signal);
  });

  it('should handle result extractor resolution with different priorities', () => {
    // Mock a custom result extractor
    const customExtractor = vi.fn();

    // Test with endpoint result extractor
    const metadata1 = new FunctionMetadata(
      'testFunc',
      { resultExtractor: ResultExtractors.Json },
      { method: HttpMethod.GET, resultExtractor: customExtractor },
      new Map(),
    );

    expect(metadata1.resolveResultExtractor()).toBe(customExtractor);

    // Test with api result extractor
    const metadata2 = new FunctionMetadata(
      'testFunc',
      { resultExtractor: ResultExtractors.Json },
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata2.resolveResultExtractor()).toBe(ResultExtractors.Json);

    // Test with default result extractor
    const metadata3 = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata3.resolveResultExtractor()).toBe(ResultExtractors.Json);
  });

  it('should handle case when parameter metadata does not exist', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(), // Empty parameters map
    );

    // Should handle empty parameters without errors
    const request = metadata.resolveRequest(['someValue']);
    expect(request).toBeDefined();
    expect(request.method).toBe(HttpMethod.GET);
  });

  it('should handle case when funParameter does not exist', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(), // Empty parameters map
    );

    // Should handle case where parameters.get returns undefined
    const request = metadata.resolveRequest(['value1', 'value2']);
    expect(request).toBeDefined();
    expect(request.method).toBe(HttpMethod.GET);
  });

  it('should handle body parameter type', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.POST },
      new Map([
        [
          0,
          {
            type: ParameterType.BODY,
            index: 0,
          },
        ],
      ]),
    );

    const bodyData = { name: 'test', value: 123 };
    const request = metadata.resolveRequest([bodyData]);
    expect(request.body).toEqual(bodyData);
  });

  it('should handle header parameter with valid value', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map([
        [
          0,
          {
            type: ParameterType.HEADER,
            name: 'Authorization',
            index: 0,
          },
        ],
      ]),
    );

    const request = metadata.resolveRequest(['Bearer token']);
    expect(request.headers).toEqual({ 'Authorization': 'Bearer token' });
  });

  it('should handle request parameter type', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.POST },
      new Map([
        [
          0,
          {
            type: ParameterType.REQUEST,
            index: 0,
          },
        ],
      ]),
    );

    const requestObject = {
      headers: { 'X-Custom': 'value' },
      body: { test: true },
    };

    const request = metadata.resolveRequest([requestObject]);
    expect(request.headers).toEqual({ 'X-Custom': 'value' });
    expect(request.body).toEqual({ test: true });
  });

  it('should process path params correctly', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map([
        [
          0,
          {
            type: ParameterType.PATH,
            name: 'id',
            index: 0,
          },
        ],
      ]),
    );

    const request = metadata.resolveRequest([123]);
    expect(request.urlParams?.path).toEqual({ id: 123 });
  });

  it('should process query params correctly', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map([
        [
          0,
          {
            type: ParameterType.QUERY,
            name: 'filter',
            index: 0,
          },
        ],
      ]),
    );

    const request = metadata.resolveRequest(['active']);
    expect(request.urlParams?.query).toEqual({ filter: 'active' });
  });

  it('should merge api and endpoint headers', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { headers: { 'API-Key': 'api-key-value' } },
      {
        method: HttpMethod.GET,
        headers: { 'Endpoint-Key': 'endpoint-key-value' },
      },
      new Map(),
    );

    const request = metadata.resolveRequest([]);
    expect(request.headers).toEqual({
      'API-Key': 'api-key-value',
      'Endpoint-Key': 'endpoint-key-value',
    });
  });
});