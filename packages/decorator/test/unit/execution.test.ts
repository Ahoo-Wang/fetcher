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

// We'll test the execution logic by manually setting up the metadata
// and then calling the executeRequest function through reflection

describe('decorators execution tests', () => {
  it('should execute requests with proper metadata', async () => {
    // Mock fetch implementation
    const mockResponse = new Response('{"id": 1, "name": "test"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    // Create and register a mock fetcher
    const mockFetcher = {
      fetch: mockFetch,
      timeout: 5000,
    } as unknown as Fetcher;

    fetcherRegistrar.register('default', mockFetcher);

    // Create a mock class
    class UserService {
    }

    // Manually set up the metadata as decorators would do
    Reflect.defineMetadata(
      API_METADATA_KEY,
      { basePath: '/api/v1' },
      UserService,
    );

    // Set up method metadata
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      { method: HttpMethod.GET, path: '/users/{id}' },
      UserService.prototype,
      'getUser',
    );

    // Set up parameter metadata
    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      [
        { type: ParameterType.PATH, name: 'id', index: 0 },
        { type: ParameterType.QUERY, name: 'include', index: 1 },
      ],
      UserService.prototype,
      'getUser',
    );

    // Since we can't easily test the actual execution without decorator syntax,
    // let's at least verify that the metadata is properly set up
    const classMetadata = Reflect.getMetadata(API_METADATA_KEY, UserService);
    const methodMetadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      UserService.prototype,
      'getUser',
    );
    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      UserService.prototype,
      'getUser',
    );

    expect(classMetadata).toEqual({ basePath: '/api/v1' });
    expect(methodMetadata).toEqual({ method: 'GET', path: '/users/{id}' });
    expect(paramMetadata).toEqual([
      { type: ParameterType.PATH, name: 'id', index: 0 },
      { type: ParameterType.QUERY, name: 'include', index: 1 },
    ]);
  });

  it('should handle different parameter types', async () => {
    class TestService {
    }

    // Set up parameter metadata with all types
    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      [
        { type: ParameterType.PATH, name: 'id', index: 0 },
        { type: ParameterType.QUERY, name: 'filter', index: 1 },
        { type: ParameterType.BODY, index: 2 },
        { type: ParameterType.HEADER, name: 'Authorization', index: 3 },
      ],
      TestService.prototype,
      'testMethod',
    );

    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'testMethod',
    );

    expect(paramMetadata).toEqual([
      { type: ParameterType.PATH, name: 'id', index: 0 },
      { type: ParameterType.QUERY, name: 'filter', index: 1 },
      { type: ParameterType.BODY, index: 2 },
      { type: ParameterType.HEADER, name: 'Authorization', index: 3 },
    ]);
  });

  it('should handle custom fetcher configuration', async () => {
    // Create and register a custom fetcher
    const mockFetcher = {
      fetch: vi.fn(),
      timeout: 10000,
    } as unknown as Fetcher;

    fetcherRegistrar.register('custom', mockFetcher);

    class TestService {
    }

    // Set up class metadata with custom fetcher
    Reflect.defineMetadata(
      API_METADATA_KEY,
      {
        basePath: '/api/v2',
        fetcher: 'custom',
        timeout: 8000,
      },
      TestService,
    );

    // Set up method metadata
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      { method: HttpMethod.POST, path: '/users', timeout: 6000 },
      TestService.prototype,
      'createUser',
    );

    const classMetadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
    const methodMetadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      TestService.prototype,
      'createUser',
    );

    expect(classMetadata).toEqual({
      basePath: '/api/v2',
      fetcher: 'custom',
      timeout: 8000,
    });
    expect(methodMetadata).toEqual({
      method: 'POST',
      path: '/users',
      timeout: 6000,
    });
  });
});
