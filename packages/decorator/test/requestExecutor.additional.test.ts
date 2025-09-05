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
import { FunctionMetadata, ParameterMetadata } from '../src';
import { HttpMethod, ResultExtractors } from '@ahoo-wang/fetcher';

describe('RequestExecutor - Additional Tests', () => {

  it('should handle resolvePath with various combinations', () => {
    // Test with parameter path
    const metadata1 = new FunctionMetadata(
      'testFunc',
      { basePath: '/api' },
      { method: HttpMethod.GET, path: '/users' },
      new Map(),
    );

    expect(metadata1.resolvePath('/orders')).toBe('/api/orders');
    expect(metadata1.resolvePath()).toBe('/api/users');

    // Test without basePath
    const metadata2 = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET, path: '/users' },
      new Map(),
    );

    expect(metadata2.resolvePath()).toBe('/users');

    // Test without any path
    const metadata3 = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata3.resolvePath()).toBe('');
  });

  it('should handle resolveTimeout with various combinations', () => {
    // Test with endpoint timeout
    const metadata1 = new FunctionMetadata(
      'testFunc',
      { timeout: 1000 },
      { method: HttpMethod.GET, timeout: 2000 },
      new Map(),
    );

    expect(metadata1.resolveTimeout()).toBe(2000);

    // Test with API timeout only
    const metadata2 = new FunctionMetadata(
      'testFunc',
      { timeout: 1000 },
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata2.resolveTimeout()).toBe(1000);

    // Test without any timeout
    const metadata3 = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    expect(metadata3.resolveTimeout()).toBeUndefined();
  });

  it('should handle resolveResultExtractor with various combinations', () => {
    const customExtractor = () => {
    };

    // Test with endpoint result extractor
    const metadata1 = new FunctionMetadata(
      'testFunc',
      { resultExtractor: ResultExtractors.Json },
      { method: HttpMethod.GET, resultExtractor: customExtractor },
      new Map(),
    );

    expect(metadata1.resolveResultExtractor()).toBe(customExtractor);

    // Test with API result extractor
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

  it('should handle processHeaderParam with various cases', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    // Test with valid header
    const headers1: Record<string, string> = {};
    // @ts-expect-error - accessing private method for testing
    metadata.processHeaderParam(
      { name: 'Authorization', index: 0 } as ParameterMetadata,
      'Bearer token',
      headers1,
    );
    expect(headers1).toEqual({ Authorization: 'Bearer token' });

    // Test with undefined value
    const headers2: Record<string, string> = {};
    // @ts-expect-error - accessing private method for testing
    metadata.processHeaderParam(
      { name: 'Authorization', index: 0 } as ParameterMetadata,
      undefined,
      headers2,
    );
    expect(headers2).toEqual({});

    // Test without name
    const headers3: Record<string, string> = {};
    // @ts-expect-error - accessing private method for testing
    metadata.processHeaderParam({ index: 0 }, 'Bearer token', headers3);
    expect(headers3).toEqual({});
  });

  it('should handle processPathParam and processQueryParam', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      new Map(),
    );

    // Test processPathParam with name
    const path: Record<string, any> = {};
    // @ts-expect-error - accessing private method for testing
    metadata.processPathParam({ name: 'id', index: 0 }, 123, path);
    expect(path).toEqual({ id: 123 });

    // Test processPathParam without name
    const path2: Record<string, any> = {};
    // @ts-expect-error - accessing private method for testing
    metadata.processPathParam({ index: 0 }, 123, path2);
    expect(path2).toEqual({ param0: 123 });

    // Test processQueryParam with name
    const query: Record<string, any> = {};
    // @ts-expect-error - accessing private method for testing
    metadata.processQueryParam({ name: 'filter', index: 0 }, 'active', query);
    expect(query).toEqual({ filter: 'active' });

    // Test processQueryParam without name
    const query2: Record<string, any> = {};
    // @ts-expect-error - accessing private method for testing
    metadata.processQueryParam({ index: 0 }, 'active', query2);
    expect(query2).toEqual({ param0: 'active' });
  });
});
