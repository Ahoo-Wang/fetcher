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
import {
  api,
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  get,
  PARAMETER_METADATA_KEY,
  ParameterType,
  path,
} from '../src';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

// Mock fetcher
const mockRequest = vi.fn();

// Create a mock fetcher object
const mockFetcher: any = {
  request: mockRequest,
};

describe('apiDecorator', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock fetcher registrar
    vi.spyOn(fetcherRegistrar, 'requiredGet').mockReturnValue(mockFetcher);
  });

  afterEach(() => {
    // Clean up mocks
    vi.restoreAllMocks();
  });

  describe('metadata definition', () => {
    it('should define API metadata on class', () => {
      @api('/api', { headers: { 'X-Test': 'test' }, timeout: 5000 })
      class TestService {}

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toEqual({
        basePath: '/api',
        headers: { 'X-Test': 'test' },
        timeout: 5000,
      });
    });

    it('should handle empty basePath', () => {
      @api()
      class TestService {}

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toEqual({
        basePath: '',
      });
    });

    it('should handle complex metadata', () => {
      @api('/test', {
        headers: { 'X-Custom': 'value' },
        timeout: 5000,
        fetcher: 'custom',
      })
      class TestService {}

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toEqual({
        basePath: '/test',
        headers: { 'X-Custom': 'value' },
        timeout: 5000,
        fetcher: 'custom',
      });
    });
  });

  describe('method decoration', () => {
    it('should enhance methods with endpoint metadata', () => {
      @api('/api')
      class TestService {
        @get('/users')
        getUsers() {
          // Implementation will be generated automatically
        }
      }

      const instance = new TestService();
      const endpointMetadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        Object.getPrototypeOf(instance),
        'getUsers',
      );

      expect(endpointMetadata).toEqual({
        method: 'GET',
        path: '/users',
      });
    });

    it('should handle methods without endpoint metadata', () => {
      @api('/test')
      class TestService {
        // Regular method without endpoint decorator
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
  });

  describe('parameter handling', () => {
    it('should handle method parameters correctly', () => {
      @api('/api')
      class TestService {
        @get('/users/{id}')
        getUser(@path('id') id: number) {
          // Implementation will be generated automatically
        }
      }

      const instance = new TestService();
      const parameterMetadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        Object.getPrototypeOf(instance),
        'getUser',
      );

      expect(parameterMetadata).toEqual([
        {
          type: ParameterType.PATH,
          name: 'id',
          index: 0,
        },
      ]);
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
  });

  describe('class structure handling', () => {
    it('should handle class with no methods', () => {
      @api('/test')
      class TestService {}

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toBeDefined();
      expect(metadata.basePath).toBe('/test');
    });

    it('should handle non-function properties gracefully', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Add a non-function property to the prototype
      (TestService.prototype as any)['nonFunctionProperty'] = 'not a function';

      const instance = new TestService();
      // Non-function property should remain unchanged
      expect((instance as any)['nonFunctionProperty']).toBe('not a function');
      // Method should still be replaced with executor
      expect(typeof instance.getUsers).toBe('function');
    });

    it('should handle case where prototype property is not a function', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Manually set a prototype property to a non-function value
      Object.defineProperty(TestService.prototype, 'nonFunctionMethod', {
        value: 'not a function',
        writable: true,
        enumerable: true,
        configurable: true,
      });

      const instance = new TestService();
      // Non-function property should remain unchanged
      expect((instance as any).nonFunctionMethod).toBe('not a function');
      // Decorated method should still work
      expect(typeof instance.getUsers).toBe('function');
    });

    it('should handle class with only constructor', () => {
      @api('/test')
      class TestService {
        constructor() {
          // Empty constructor
        }
      }

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toBeDefined();
      expect(metadata.basePath).toBe('/test');

      // Constructor should not be modified
      const instance = new TestService();
      expect(typeof instance.constructor).toBe('function');
    });

    it('should handle class with non-function properties', () => {
      @api('/test')
      class TestService {
        static staticProperty = 'static';
        instanceProperty = 'instance';

        static staticMethod() {
          return 'static method';
        }

        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toBeDefined();
      expect(metadata.basePath).toBe('/test');

      // Static properties should be preserved
      expect(TestService.staticProperty).toBe('static');
      expect(TestService.staticMethod()).toBe('static method');

      // Instance properties should be preserved
      const instance = new TestService();
      expect(instance.instanceProperty).toBe('instance');

      // Decorated method should be replaced with executor
      expect(typeof instance.getUsers).toBe('function');
    });

    it('should handle class inheritance', () => {
      @api('/base')
      class BaseService {
        @get('/base')
        getBase() {
          return Promise.resolve(new Response('{"base": true}'));
        }
      }

      @api('/derived')
      class DerivedService extends BaseService {
        @get('/derived')
        getDerived() {
          return Promise.resolve(new Response('{"derived": true}'));
        }
      }

      const baseInstance = new BaseService();
      const derivedInstance = new DerivedService();

      // Both instances should have their respective methods replaced with executors
      expect(typeof baseInstance.getBase).toBe('function');
      expect(typeof derivedInstance.getBase).toBe('function');
      expect(typeof derivedInstance.getDerived).toBe('function');
    });

    it('should handle multiple decorators on same method', () => {
      @api('/test')
      class TestService {
        @get('/users/{id}')
        getUser(@path('id') id: number) {
          return Promise.resolve(new Response('{"user": {"id": 1}}'));
        }
      }

      const instance = new TestService();
      const endpointMetadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        Object.getPrototypeOf(instance),
        'getUser',
      );

      const parameterMetadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        Object.getPrototypeOf(instance),
        'getUser',
      );

      // Should have both endpoint and parameter metadata
      expect(endpointMetadata).toBeDefined();
      expect(parameterMetadata).toBeDefined();
      expect(parameterMetadata).toEqual([
        {
          type: ParameterType.PATH,
          name: 'id',
          index: 0,
        },
      ]);

      // Method should be replaced with executor
      expect(typeof instance.getUser).toBe('function');
    });
  });
});
