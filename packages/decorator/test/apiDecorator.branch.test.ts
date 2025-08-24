import { describe, it, expect } from 'vitest';
import { api, get, PARAMETER_METADATA_KEY } from '../src';
import 'reflect-metadata';

describe('apiDecorator - branch coverage', () => {
  it('should handle non-function properties', () => {
    @api('/test')
    class TestService {
      static staticProperty = 'static';
      instanceProperty = 'instance';

      @get('/users')
      getUsers() {
        return Promise.resolve(new Response('{"users": []}'));
      }
    }

    // Verify that static and instance properties are not affected
    expect(TestService.staticProperty).toBe('static');
    const instance = new TestService();
    expect(instance.instanceProperty).toBe('instance');

    // Verify that the decorated method still works
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
