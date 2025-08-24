import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  api,
  get,
  path,
  PARAMETER_METADATA_KEY,
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  ParameterType,
} from '../src';
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
