import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  api,
  get,
  post,
  put,
  del,
  patch,
  head,
  options,
  path,
  query,
  body,
  header,
} from '../../src';
import {
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  PARAMETER_METADATA_KEY,
  ParameterType,
} from '../../src/metadata';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import { Fetcher } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

describe('decorators comprehensive tests', () => {
  beforeEach(() => {
    // Reset fetcher registrar
    const fetchers = fetcherRegistrar.fetchers;
    for (const [name] of fetchers) {
      fetcherRegistrar.unregister(name);
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('api decorator', () => {
    it('should store class metadata with default values', () => {
      @api()
      class TestService {
      }

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toEqual({ basePath: '' });
    });

    it('should store class metadata with custom basePath', () => {
      @api('/api/v1')
      class TestService {
      }

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toEqual({ basePath: '/api/v1' });
    });

    it('should store class metadata with custom metadata', () => {
      @api('/api/v1', {
        fetcher: 'test',
        timeout: 10000,
        headers: { 'X-Custom': 'value' },
      })
      class TestService {
      }

      const metadata = Reflect.getMetadata(API_METADATA_KEY, TestService);
      expect(metadata).toEqual({
        basePath: '/api/v1',
        fetcher: 'test',
        timeout: 10000,
        headers: { 'X-Custom': 'value' },
      });
    });
  });

  describe('method decorators', () => {
    it('should store GET method metadata', () => {
      class TestService {
        @get('/users')
        getUsers() {
        }
      }

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'getUsers',
      );
      expect(metadata).toEqual({
        method: 'GET',
        path: '/users',
      });
    });

    it('should store POST method metadata with custom options', () => {
      class TestService {
        @post('/users', {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' },
        })
        createUser() {
        }
      }

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'createUser',
      );
      expect(metadata).toEqual({
        method: 'POST',
        path: '/users',
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should store PUT method metadata', () => {
      class TestService {
        @put('/users/{id}')
        updateUser() {
        }
      }

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'updateUser',
      );
      expect(metadata).toEqual({
        method: 'PUT',
        path: '/users/{id}',
      });
    });

    it('should store DELETE method metadata', () => {
      class TestService {
        @del('/users/{id}')
        deleteUser() {
        }
      }

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'deleteUser',
      );
      expect(metadata).toEqual({
        method: 'DELETE',
        path: '/users/{id}',
      });
    });

    it('should store PATCH method metadata', () => {
      class TestService {
        @patch('/users/{id}')
        patchUser() {
        }
      }

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'patchUser',
      );
      expect(metadata).toEqual({
        method: 'PATCH',
        path: '/users/{id}',
      });
    });

    it('should store HEAD method metadata', () => {
      class TestService {
        @head('/users/{id}')
        headUser() {
        }
      }

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'headUser',
      );
      expect(metadata).toEqual({
        method: 'HEAD',
        path: '/users/{id}',
      });
    });

    it('should store OPTIONS method metadata', () => {
      class TestService {
        @options('/users')
        optionsUsers() {
        }
      }

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        TestService.prototype,
        'optionsUsers',
      );
      expect(metadata).toEqual({
        method: 'OPTIONS',
        path: '/users',
      });
    });
  });

  describe('parameter decorators', () => {
    it('should store path parameter metadata', () => {
      class TestService {
        getUser(@path('id') id: number) {
        }
      }

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        TestService.prototype,
        'getUser',
      );
      expect(metadata).toEqual([
        { type: ParameterType.PATH, name: 'id', index: 0 },
      ]);
    });

    it('should store query parameter metadata', () => {
      class TestService {
        getUsers(@query('limit') limit: number) {
        }
      }

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        TestService.prototype,
        'getUsers',
      );
      expect(metadata).toEqual([
        { type: ParameterType.QUERY, name: 'limit', index: 0 },
      ]);
    });

    it('should store body parameter metadata', () => {
      class TestService {
        createUser(@body() user: any) {
        }
      }

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        TestService.prototype,
        'createUser',
      );
      expect(metadata).toEqual([{ type: ParameterType.BODY, index: 0 }]);
    });

    it('should store header parameter metadata', () => {
      class TestService {
        getUsers(@header('Authorization') auth: string) {
        }
      }

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        TestService.prototype,
        'getUsers',
      );
      expect(metadata).toEqual([
        { type: ParameterType.HEADER, name: 'Authorization', index: 0 },
      ]);
    });

    it('should store multiple parameter metadata', () => {
      class TestService {
        updateUser(
          @path('id') id: number,
          @body() user: any,
          @header('Authorization') auth: string,
        ) {
        }
      }

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        TestService.prototype,
        'updateUser',
      );
      // Sort by index to ensure consistent order
      const sortedMetadata = metadata.sort(
        (a: any, b: any) => a.index - b.index,
      );
      expect(sortedMetadata).toEqual([
        { type: ParameterType.PATH, name: 'id', index: 0 },
        { type: ParameterType.BODY, index: 1 },
        { type: ParameterType.HEADER, name: 'Authorization', index: 2 },
      ]);
    });
  });
});
