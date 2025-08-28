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
import { api, get, PARAMETER_METADATA_KEY } from '../src';
import 'reflect-metadata';

describe('apiDecorator - branch coverage', () => {
  it('should handle various non-function properties and edge cases', () => {
    @api('/test')
    class TestService {
      static staticProperty = 'static';
      instanceProperty = 'instance';

      @get('/users')
      getUsers() {
        return Promise.resolve(new Response('{"users": []}'));
      }
    }

    // Add various non-function properties to test edge cases
    (TestService.prototype as any).nonFunctionProp = 'not-a-function';
    (TestService.prototype as any).numberValue = 42;
    (TestService.prototype as any).nullValue = null;
    (TestService.prototype as any).undefinedValue = undefined;

    // Directly define non-function properties
    Object.defineProperty(TestService.prototype, 'definedProp', {
      value: 'defined-value',
      writable: true,
    });

    // Verify that static and instance properties are not affected
    expect(TestService.staticProperty).toBe('static');
    const instance = new TestService();
    expect(instance.instanceProperty).toBe('instance');

    // Verify that all non-function properties remain
    expect((instance as any).nonFunctionProp).toBe('not-a-function');
    expect((instance as any).numberValue).toBe(42);
    expect((instance as any).nullValue).toBeNull();
    expect((instance as any).undefinedValue).toBeUndefined();
    expect((instance as any).definedProp).toBe('defined-value');

    // Verify that the decorated method still works
    expect(typeof instance.getUsers).toBe('function');

    // Test parameter metadata (should be undefined for this method since no parameters)
    const parameterMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'getUsers',
    );
    expect(parameterMetadata).toBeUndefined();

    // Constructor should not be processed
    expect(typeof TestService.prototype.constructor).toBe('function');
  });

  it('should handle methods with no parameter metadata', () => {
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

  it('should handle constructor function name', () => {
    // This test ensures that the bindExecutor function properly handles
    // the 'constructor' function name without errors
    @api('/test')
    class TestService {
      @get('/users')
      getUsers() {
        return Promise.resolve(new Response('{"users": []}'));
      }
    }

    const instance = new TestService();
    // Constructor should not be affected
    expect(typeof TestService.constructor).toBe('function');
    // Method should still be replaced with executor
    expect(typeof instance.getUsers).toBe('function');
  });

  it('should handle non-function prototype properties', () => {
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

  it('should handle non-function properties on prototype', () => {
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
});
