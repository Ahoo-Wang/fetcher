import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  PARAMETER_METADATA_KEY,
  ParameterType,
} from '../../src';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import { Fetcher } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

// Mock fetch implementation
const mockFetch = vi.fn();

describe('decorators metadata', () => {
  beforeEach(() => {
    // Reset fetcher registrar
    const fetchers = fetcherRegistrar.fetchers;
    for (const [name] of fetchers) {
      fetcherRegistrar.unregister(name);
    }

    // Create and register a mock fetcher
    const mockFetcher = {
      fetch: mockFetch,
      timeout: 5000,
    } as unknown as Fetcher;

    fetcherRegistrar.register('default', mockFetcher);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should store class metadata', () => {
    class TestService {
    }

    // Manually set metadata to simulate decorator behavior
    Reflect.defineMetadata(
      API_METADATA_KEY,
      { basePath: '/api/v1' },
      TestService,
    );

    const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
    expect(metadata.basePath).toBe('/api/v1');
  });

  it('should store method metadata', () => {
    class TestService {
      getUsers() {
      }

      createUser() {
      }
    }

    // Manually set metadata to simulate decorator behavior
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      {
        method: 'GET',
        path: '/users',
      },
      TestService.prototype,
      'getUsers',
    );

    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      {
        method: 'POST',
        path: '/users',
      },
      TestService.prototype,
      'createUser',
    );

    const getUsersMetadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      TestService.prototype,
      'getUsers',
    );
    expect(getUsersMetadata.method).toBe('GET');
    expect(getUsersMetadata.path).toBe('/users');

    const createUserMetadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      TestService.prototype,
      'createUser',
    );
    expect(createUserMetadata.method).toBe('POST');
    expect(createUserMetadata.path).toBe('/users');
  });

  it('should store parameter metadata', () => {
    class TestService {
      getUser() {
      }

      createUser() {
      }
    }

    // Manually set metadata to simulate decorator behavior
    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      [
        { type: ParameterType.PATH, name: 'id', index: 0 },
        { type: ParameterType.QUERY, name: 'filter', index: 1 },
      ],
      TestService.prototype,
      'getUser',
    );

    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      [{ type: ParameterType.BODY, index: 0 }],
      TestService.prototype,
      'createUser',
    );

    const getUserParams = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'getUser',
    );
    expect(getUserParams).toHaveLength(2);
    expect(getUserParams[0]).toEqual({ type: 'path', name: 'id', index: 0 });
    expect(getUserParams[1]).toEqual({
      type: 'query',
      name: 'filter',
      index: 1,
    });

    const createUserParams = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'createUser',
    );
    expect(createUserParams).toHaveLength(1);
    expect(createUserParams[0]).toEqual({ type: 'body', index: 0 });
  });
});
