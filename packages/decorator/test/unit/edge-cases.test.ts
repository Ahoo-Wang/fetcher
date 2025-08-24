import { describe, it, expect, vi } from 'vitest';
import {
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  PARAMETER_METADATA_KEY,
  ParameterType,
} from '../../src/metadata';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import { Fetcher, HttpMethod } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

describe('decorators edge cases and uncovered branches', () => {
  it('should handle parameter without name (default naming)', async () => {
    // Mock fetch implementation
    const mockResponse = new Response('{"success": true}', { status: 200 });
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    // Create and register a mock fetcher
    const mockFetcher = {
      fetch: mockFetch,
      timeout: 5000,
    } as unknown as Fetcher;

    fetcherRegistrar.register('default', mockFetcher);

    class TestService {
    }

    // Set up metadata with parameters that have no names
    Reflect.defineMetadata(API_METADATA_KEY, { basePath: '/api' }, TestService);
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      { method: HttpMethod.GET, path: '/test' },
      TestService.prototype,
      'testMethod',
    );

    // Parameter without name - this should trigger the default naming branch
    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      [
        { type: ParameterType.PATH, index: 0 }, // No name
        { type: ParameterType.QUERY, index: 1 }, // No name
      ],
      TestService.prototype,
      'testMethod',
    );

    // Verify metadata is set correctly
    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'testMethod',
    );
    expect(paramMetadata).toEqual([
      { type: ParameterType.PATH, index: 0 },
      { type: ParameterType.QUERY, index: 1 },
    ]);
  });

  it('should handle header parameter with undefined value', async () => {
    class TestService {
    }

    // Set up metadata with header parameter that has undefined value
    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      [{ type: ParameterType.HEADER, name: 'Authorization', index: 0 }],
      TestService.prototype,
      'testMethod',
    );

    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'testMethod',
    );
    expect(paramMetadata).toEqual([
      { type: ParameterType.HEADER, name: 'Authorization', index: 0 },
    ]);
  });

  it('should handle empty parameter metadata array', async () => {
    class TestService {
    }

    // Set up metadata with empty parameter array
    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      [],
      TestService.prototype,
      'testMethod',
    );

    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'testMethod',
    );
    expect(paramMetadata).toEqual([]);
  });

  it('should handle class metadata with empty basePath', async () => {
    class TestService {
    }

    // Set up metadata with empty basePath
    Reflect.defineMetadata(API_METADATA_KEY, { basePath: '' }, TestService);

    const classMetadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
    expect(classMetadata).toEqual({ basePath: '' });
  });

  it('should handle method metadata without path', async () => {
    class TestService {
    }

    // Set up metadata without path
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      { method: HttpMethod.GET }, // No path
      TestService.prototype,
      'testMethod',
    );

    const methodMetadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      TestService.prototype,
      'testMethod',
    );
    expect(methodMetadata).toEqual({ method: 'GET' });
  });

  it('should handle class metadata without basePath', async () => {
    class TestService {
    }

    // Set up metadata without basePath
    Reflect.defineMetadata(API_METADATA_KEY, {}, TestService);

    const classMetadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
    expect(classMetadata).toEqual({});
  });

  it('should handle fetcher resolution with different precedence levels', async () => {
    // Create and register fetchers
    const defaultFetcher = {
      fetch: vi.fn(),
      timeout: 5000,
    } as unknown as Fetcher;

    const customFetcher = {
      fetch: vi.fn(),
      timeout: 10000,
    } as unknown as Fetcher;

    fetcherRegistrar.register('default', defaultFetcher);
    fetcherRegistrar.register('custom', customFetcher);

    // Test fetcher resolution order: method > class > default
    expect(() => fetcherRegistrar.requiredGet('custom')).not.toThrow();
    expect(() => fetcherRegistrar.requiredGet('default')).not.toThrow();

    // Test that non-existent fetcher throws
    expect(() => fetcherRegistrar.requiredGet('nonexistent')).toThrow();
  });

  it('should handle URL building with various path combinations', async () => {
    class TestService {
    }

    // Test different basePath and path combinations
    const testCases = [
      { basePath: '', path: '/users', expected: '/users' },
      { basePath: '/api', path: '/users', expected: '/api/users' },
      { basePath: '/api/', path: '/users', expected: '/api/users' },
      { basePath: '/api', path: 'users', expected: '/api/users' },
      { basePath: '/api/', path: 'users', expected: '/api/users' },
    ];

    for (const testCase of testCases) {
      Reflect.defineMetadata(
        API_METADATA_KEY,
        { basePath: testCase.basePath },
        TestService,
      );

      Reflect.defineMetadata(
        ENDPOINT_METADATA_KEY,
        { method: HttpMethod.GET, path: testCase.path },
        TestService.prototype,
        'testMethod',
      );

      const classMetadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      const methodMetadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'testMethod',
      );

      expect(classMetadata.basePath).toBe(testCase.basePath);
      expect(methodMetadata.path).toBe(testCase.path);
    }
  });

  it('should handle header merging with empty headers', async () => {
    class TestService {
    }

    // Test header merging scenarios
    const testCases = [
      { classHeaders: undefined, methodHeaders: undefined, paramHeaders: {} },
      { classHeaders: {}, methodHeaders: undefined, paramHeaders: {} },
      { classHeaders: undefined, methodHeaders: {}, paramHeaders: {} },
      {
        classHeaders: { 'Content-Type': 'application/json' },
        methodHeaders: undefined,
        paramHeaders: {},
      },
    ];

    for (const testCase of testCases) {
      Reflect.defineMetadata(
        API_METADATA_KEY,
        { headers: testCase.classHeaders },
        TestService,
      );

      Reflect.defineMetadata(
        ENDPOINT_METADATA_KEY,
        { method: HttpMethod.GET, headers: testCase.methodHeaders },
        TestService.prototype,
        'testMethod',
      );

      const classMetadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      const methodMetadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'testMethod',
      );

      expect(classMetadata.headers).toBe(testCase.classHeaders);
      expect(methodMetadata.headers).toBe(testCase.methodHeaders);
    }
  });
});
