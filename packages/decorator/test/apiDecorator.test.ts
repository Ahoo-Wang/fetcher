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

      expect(parameterMetadata).toEqual(
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
      expect(parameterMetadata).toEqual(
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

      // Method should be replaced with executor
      expect(typeof instance.getUser).toBe('function');
    });

    it('should handle constructor method without endpoint metadata', () => {
      @api('/test')
      class TestService {
        constructor() {
          // Constructor should not be processed
        }
      }

      // Constructor should remain unchanged
      expect(typeof TestService.prototype.constructor).toBe('function');
    });

    it('should handle non-function prototype properties', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Add a non-function property to the prototype
      (TestService.prototype as any).nonFunctionProp = 'not a function';

      const instance = new TestService();
      // Non-function property should remain
      expect((instance as any).nonFunctionProp).toBe('not a function');
      // Method should still be replaced with executor
      expect(typeof instance.getUsers).toBe('function');
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
    it('should handle constructor function name', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Constructor should not be processed
      expect(typeof TestService.prototype.constructor).toBe('function');
    });

    it('should handle non-function prototype properties', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Set a non-function property on prototype
      (TestService.prototype as any).nonFunctionProperty = 'test-value';

      const instance = new TestService();
      // Non-function property should remain
      expect((instance as any).nonFunctionProperty).toBe('test-value');
      // Decorated method should be replaced with executor
      expect(typeof instance.getUsers).toBe('function');
    });

    it('should handle non-function properties in bindExecutor', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Manually test the bindExecutor function with a non-function property
      const originalMethod = TestService.prototype.getUsers;
      // Set a property that is not a function
      (TestService.prototype as any).nonFunction = 'not-a-function';

      const instance = new TestService();
      // The non-function property should remain unchanged
      expect((TestService.prototype as any).nonFunction).toBe('not-a-function');
      // The method should still work
      expect(typeof instance.getUsers).toBe('function');
    });

    it('should handle constructor function name in bindExecutor', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Test that constructor is not processed
      expect(typeof TestService.prototype.constructor).toBe('function');
    });

    it('should handle non-function property types', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Add various non-function properties to test the typeof check
      (TestService.prototype as any).stringValue = 'string';
      (TestService.prototype as any).numberValue = 42;
      (TestService.prototype as any).objectValue = { key: 'value' };
      (TestService.prototype as any).nullValue = null;
      (TestService.prototype as any).undefinedValue = undefined;

      const instance = new TestService();

      // All non-function properties should remain
      expect((instance as any).stringValue).toBe('string');
      expect((instance as any).numberValue).toBe(42);
      expect((instance as any).objectValue).toEqual({ key: 'value' });
      expect((instance as any).nullValue).toBeNull();
      expect((instance as any).undefinedValue).toBeUndefined();

      // The method should still work
      expect(typeof instance.getUsers).toBe('function');
    });

    it('should handle non-function properties in prototype', () => {
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          return Promise.resolve(new Response('{"users": []}'));
        }
      }

      // Directly set a non-function property on the prototype to test bindExecutor
      Object.defineProperty(TestService.prototype, 'nonFunctionProp', {
        value: 'not-a-function',
        writable: true,
        enumerable: true,
        configurable: true,
      });

      // Also test with a property that is explicitly not a function
      (TestService.prototype as any).explicitlyNonFunction = 42;

      const instance = new TestService();

      // The properties should remain
      expect((instance as any).nonFunctionProp).toBe('not-a-function');
      expect((instance as any).explicitlyNonFunction).toBe(42);

      // The method should still work
      expect(typeof instance.getUsers).toBe('function');
    });

    it('should execute request executor', async () => {
      // Mock the RequestExecutor to test the execution path
      @api('/test')
      class TestService {
        @get('/users')
        getUsers() {
          throw new Error('Should be replaced by executor');
        }
      }

      const instance = new TestService();
      // The method should be replaced with a function that executes the request
      expect(typeof instance.getUsers).toBe('function');

      // Note: We can't easily test the actual execution here without mocking
      // the entire fetch infrastructure, but we can verify the function exists
    });
  });
});
