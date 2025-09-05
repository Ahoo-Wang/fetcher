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
import { RequestExecutor, FunctionMetadata, ParameterType } from '../src';
import { Fetcher, HttpMethod, ResultExtractors } from '@ahoo-wang/fetcher';

describe('RequestExecutor', () => {
  it('should create RequestExecutor instance', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);
    expect(executor).toBeInstanceOf(RequestExecutor);
  });

  it('should get target fetcher when target has valid fetcher property', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Create a mock fetcher
    const mockFetcher = new Fetcher();
    const target = {
      fetcher: mockFetcher,
    };

    // @ts-expect-error - accessing private method for testing
    const result = executor.getTargetFetcher(target);
    expect(result).toBe(mockFetcher);
  });

  it('should return undefined when target has invalid fetcher property', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Test with non-Fetcher fetcher property
    const target1 = {
      fetcher: 'not-a-fetcher',
    };

    // @ts-expect-error - accessing private method for testing
    const result1 = executor.getTargetFetcher(target1);
    expect(result1).toBeUndefined();

    // Test with null target
    // @ts-expect-error - accessing private method for testing
    const result2 = executor.getTargetFetcher(null);
    expect(result2).toBeUndefined();

    // Test with undefined target
    // @ts-expect-error - accessing private method for testing
    const result3 = executor.getTargetFetcher(undefined);
    expect(result3).toBeUndefined();

    // Test with non-object target
    // @ts-expect-error - accessing private method for testing
    const result4 = executor.getTargetFetcher('string');
    expect(result4).toBeUndefined();
  });

  it('should execute request with metadata fetcher when no target fetcher', async () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Mock the metadata fetcher request method
    const mockRequest = vi.fn().mockResolvedValue(new Response('test'));
    metadata.fetcher.request = mockRequest;

    const target = {};
    const args: any[] = [];

    const result = await executor.execute(target, args);
    expect(result).toBeInstanceOf(Response);
    expect(mockRequest).toHaveBeenCalled();
  });

  it('should execute request with target fetcher when available', async () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Create mock fetchers
    const mockTargetRequest = vi.fn().mockResolvedValue(new Response('target'));
    const targetFetcher = new Fetcher();
    targetFetcher.request = mockTargetRequest;

    const mockMetadataRequest = vi
      .fn()
      .mockResolvedValue(new Response('metadata'));
    metadata.fetcher.request = mockMetadataRequest;

    const target = {
      fetcher: targetFetcher,
    };

    const args: any[] = [];

    const result = await executor.execute(target, args);
    expect(result).toBeInstanceOf(Response);
    expect(mockTargetRequest).toHaveBeenCalled();
    expect(mockMetadataRequest).not.toHaveBeenCalled();
  });

  it('should resolve request and use correct result extractor', async () => {
    const mockParameters = new Map<number, any>([
      [
        0,
        {
          type: ParameterType.PATH,
          name: 'id',
          index: 0,
        },
      ],
    ]);

    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      {
        method: HttpMethod.GET,
        path: '/users/{id}',
        resultExtractor: ResultExtractors.Response,
      },
      mockParameters,
    );

    const executor = new RequestExecutor(metadata);

    // Mock the request method to return a known response
    const mockResponse = new Response(JSON.stringify({ id: 1, name: 'John' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const mockRequest = vi.fn().mockResolvedValue(mockResponse);
    metadata.fetcher.request = mockRequest;

    const target = {};
    const args = [123]; // id parameter

    const result = await executor.execute(target, args);
    expect(result).toBeInstanceOf(Response);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.GET,
      }),
      ResultExtractors.Response,
    );
  });

  it('should handle request with custom result extractor', async () => {
    // Create a custom result extractor
    const customExtractor = vi.fn(exchange => {
      return { custom: true, data: exchange.requiredResponse };
    });

    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      {
        method: HttpMethod.POST,
        resultExtractor: customExtractor,
      },
      new Map(),
    );

    const executor = new RequestExecutor(metadata);

    // Mock the request method
    const mockResponse = new Response('{"result": "success"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const mockRequest = vi.fn().mockResolvedValue(mockResponse);
    metadata.fetcher.request = mockRequest;

    const target = {};
    const args: any[] = [];

    const result = await executor.execute(target, args);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.POST,
      }),
      customExtractor,
    );
  });
});
