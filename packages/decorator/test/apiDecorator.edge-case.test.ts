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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, API_METADATA_KEY, get, PARAMETER_METADATA_KEY } from '../src';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

// Mock fetcher
const mockFetch = vi.fn();
const mockFetcher = {
  fetch: mockFetch,
};

describe('apiDecorator - edge cases', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock fetcher registrar
    vi.spyOn(fetcherRegistrar, 'requiredGet').mockReturnValue(
      mockFetcher as any,
    );
  });

  afterEach(() => {
    // Clean up mocks
    vi.restoreAllMocks();
  });

  it('should handle class with no methods', () => {
    @api('/test')
    class TestService {
    }

    const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
    expect(metadata).toBeDefined();
    expect(metadata.basePath).toBe('/test');
  });

  it('should handle method with no endpoint metadata', () => {
    @api('/test')
    class TestService {
      regularMethod() {
        return 'regular';
      }

      @get('/users')
      getUsers() {
        return Promise.resolve(new Response('{"users": []}'));
      }
    }

    const instance = new TestService();
    // Regular method should remain unchanged
    expect(instance.regularMethod()).toBe('regular');
    // Decorated method should be replaced with executor
    expect(typeof instance.getUsers).toBe('function');
  });

  it('should handle method with endpoint metadata but no parameters', () => {
    @api('/test')
    class TestService {
      @get('/users')
      getUsers() {
        return Promise.resolve(new Response('{"users": []}'));
      }
    }

    const instance = new TestService();
    const parameterMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'getUsers',
    );

    // Should have no parameter metadata
    expect(parameterMetadata).toBeUndefined();
    // Method should still be replaced with executor
    expect(typeof instance.getUsers).toBe('function');
  });

  it('should handle method with endpoint metadata and parameters but no names', () => {
    @api('/test')
    class TestService {
      @get('/users/{id}')
      getUser(id: number) {
        return Promise.resolve(new Response('{"user": {"id": 1}}'));
      }
    }

    const instance = new TestService();
    // Method should still be replaced with executor
    expect(typeof instance.getUser).toBe('function');
  });

  it('should handle empty basePath', () => {
    @api()
    class TestService {
      @get('/users')
      getUsers() {
        return Promise.resolve(new Response('{"users": []}'));
      }
    }

    const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
    expect(metadata).toBeDefined();
    expect(metadata.basePath).toBe('');

    const instance = new TestService();
    expect(typeof instance.getUsers).toBe('function');
  });

  it('should handle complex metadata', () => {
    @api('/test', {
      headers: { 'X-Custom': 'value' },
      timeout: 5000,
      fetcher: 'custom',
    })
    class TestService {
      @get('/users')
      getUsers() {
        return Promise.resolve(new Response('{"users": []}'));
      }
    }

    const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
    expect(metadata).toBeDefined();
    expect(metadata.basePath).toBe('/test');
    expect(metadata.headers).toEqual({ 'X-Custom': 'value' });
    expect(metadata.timeout).toBe(5000);
    expect(metadata.fetcher).toBe('custom');

    const instance = new TestService();
    expect(typeof instance.getUsers).toBe('function');
  });
});
