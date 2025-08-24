import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  api,
  get,
  path,
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  PARAMETER_METADATA_KEY,
  ParameterType,
} from '../src';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

// Mock fetcher
const mockFetch = vi.fn();
const mockFetcher = {
  fetch: mockFetch,
};

describe('apiDecorator', () => {
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

  describe('method execution', () => {
    it('should replace method with request executor', () => {
      const mockResponse = new Response('{"id": 1, "name": "John"}');
      mockFetch.mockResolvedValue(Promise.resolve(mockResponse));

      @api('/api')
      class TestService {
        @get('/users/{id}')
        getUser(@path('id') id: number) {
          // Implementation will be generated automatically
        }
      }

      const instance = new TestService();
      expect(typeof instance.getUser).toBe('function');

      // Test actual execution
      const promise = instance.getUser(1);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should execute HTTP request when calling decorated method', async () => {
      const mockResponse = new Response('{"id": 1, "name": "John"}');
      mockFetch.mockResolvedValue(mockResponse);

      @api('/api')
      class TestService {
        @get('/users/{id}')
        getUser(@path('id') id: number) {
          // Implementation will be generated automatically
        }
      }

      const instance = new TestService();
      const response = await instance.getUser(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/users/{id}', {
        method: 'GET',
        path: { id: 1 },
        query: {},
        headers: {},
        body: null,
        timeout: undefined,
        signal: null,
      });
      expect(response).toBe(mockResponse);
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
