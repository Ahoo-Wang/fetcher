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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FunctionMetadata, ParameterType } from '../src';
import { fetcherRegistrar, HttpMethod, Fetcher } from '@ahoo-wang/fetcher';
import { RequestExecutor } from '../src/requestExecutor';
import * as fetcherCapableModule from '../src/fetcherCapable';

// Mock fetcher
const mockRequest = vi.fn();
const mockFetcher: any = {
  request: mockRequest,
};

describe('RequestExecutor', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock fetcher registrar
    vi.spyOn(fetcherRegistrar, 'requiredGet').mockReturnValue(mockFetcher);

    // Mock getFetcher function to return our mock fetcher
    vi.spyOn(fetcherCapableModule, 'getFetcher').mockReturnValue(mockFetcher);
  });

  it('should execute request with target fetcher', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(''),
    } as any;

    const mockExchange = {
      request: {},
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);
    const target = { fetcher: mockFetcher };
    await executor.execute(target, []);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
      }),
    );
  });

  it('should fallback to metadata fetcher when target fetcher is not a Fetcher instance', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(''),
    } as any;

    const mockExchange = {
      request: {},
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Test with a non-Fetcher instance
    const target = { fetcher: {} }; // Not a Fetcher instance
    await executor.execute(target, []);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
      }),
    );
  });

  it('should fallback to metadata fetcher when target has no fetcher property', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(''),
    } as any;

    const mockExchange = {
      request: {},
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Test with an object that has no fetcher property
    const target = { otherProperty: 'value' };
    await executor.execute(target, []);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
      }),
    );
  });

  it('should return fetcher when target has valid fetcher instance', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Create a real Fetcher instance
    const realFetcher = new Fetcher();

    // Test with a valid Fetcher instance
    const target = { fetcher: realFetcher };
    const result = (executor as any).getTargetFetcher(target);

    expect(result).toBe(realFetcher);
  });

  it('should return undefined when target has non-Fetcher fetcher property', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Test with a non-Fetcher instance
    const target = { fetcher: {} };
    const result = (executor as any).getTargetFetcher(target);

    expect(result).toBeUndefined();
  });

  it('should return undefined when target has no fetcher property', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Test with an object that has no fetcher property
    const target = { otherProperty: 'value' };
    const result = (executor as any).getTargetFetcher(target);

    expect(result).toBeUndefined();
  });

  it('should return undefined when target is not an object', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Test with null target
    let result = (executor as any).getTargetFetcher(null);
    expect(result).toBeUndefined();

    // Test with undefined target
    result = (executor as any).getTargetFetcher(undefined);
    expect(result).toBeUndefined();

    // Test with string target
    result = (executor as any).getTargetFetcher('not-an-object');
    expect(result).toBeUndefined();

    // Test with number target
    result = (executor as any).getTargetFetcher(123);
    expect(result).toBeUndefined();
  });

  it('should fallback to metadata fetcher when target is null or undefined', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(''),
    } as any;

    const mockExchange = {
      request: {},
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Test with null target
    await executor.execute(null, []);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
      }),
    );

    // Clear mock to test with undefined target
    vi.clearAllMocks();
    mockRequest.mockResolvedValue(mockExchange);

    // Test with undefined target
    await executor.execute(undefined, []);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
      }),
    );
  });

  it('should fallback to metadata fetcher when target is not an object', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(''),
    } as any;

    const mockExchange = {
      request: {},
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '' },
      { method: HttpMethod.GET, path: '/api/users' },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Test with non-object target (string)
    await executor.execute('not-an-object', []);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
      }),
    );

    // Clear mock to test with number
    vi.clearAllMocks();
    mockRequest.mockResolvedValue(mockExchange);

    // Test with number target
    await executor.execute(123, []);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
      }),
    );
  });
});

describe('FunctionMetadata', () => {
  it('should resolve path correctly', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: '/api' },
      { method: HttpMethod.GET, path: '/users' },
      new Map(),
    );

    const path = metadata.resolvePath();
    expect(path).toBe('/api/users');
  });

  it('should resolve timeout correctly', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      { timeout: 5000 },
      { method: HttpMethod.GET },
      new Map(),
    );

    const timeout = metadata.resolveTimeout();
    expect(timeout).toBe(5000);
  });

  it('should resolve request with path parameters', () => {
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

  it('should resolve request with query parameters', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map([
        [
          0,
          {
            type: ParameterType.QUERY,
            name: 'limit',
            index: 0,
          },
        ],
      ]),
    );

    const request = metadata.resolveRequest([10]);
    expect(request.urlParams?.query).toEqual({ limit: 10 });
  });

  it('should resolve request with header parameters', () => {
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
    expect(request.headers).toEqual({ Authorization: 'Bearer token' });
  });

  it('should resolve request with body parameter', () => {
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

    const requestBody = { name: 'John', age: 30 };
    const request = metadata.resolveRequest([requestBody]);
    expect(request.body).toEqual(requestBody);
  });

  it('should resolve request with null signal when no signal provided', () => {
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
      new Map(),
    );

    const fetcher = metadata.fetcher;
    expect(fetcher).toBe(mockFetcher);
  });
});
