import { describe, it, expect } from 'vitest';
import {
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  PARAMETER_METADATA_KEY,
  ParameterType,
} from '../../src/metadata';
import { get, path, query, body, header } from '../../src/decorators';
import 'reflect-metadata';

describe('automatic parameter name extraction', () => {
  it('should automatically extract path parameter names', () => {
    class TestService {
      @get('/users/{userId}/posts/{postId}')
      getUserPost(
        @path() userId: string, // Should automatically get name "userId"
        @path() postId: string, // Should automatically get name "postId"
        @query() include: string, // Should automatically get name "include"
      ) {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'getUserPost',
    );

    // Sort by index to ensure consistent order
    const sortedMetadata = [...paramMetadata].sort((a, b) => a.index - b.index);
    expect(sortedMetadata).toEqual([
      { type: ParameterType.PATH, name: 'userId', index: 0 },
      { type: ParameterType.PATH, name: 'postId', index: 1 },
      { type: ParameterType.QUERY, name: 'include', index: 2 },
    ]);
  });

  it('should use provided names when available', () => {
    class TestService {
      @get('/users/{id}')
      getUser(
        @path('id') userId: string, // Should use provided name "id"
        @query('filter') filter: string, // Should use provided name "filter"
      ) {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'getUser',
    );

    // Sort by index to ensure consistent order
    const sortedMetadata = [...paramMetadata].sort((a, b) => a.index - b.index);
    expect(sortedMetadata).toEqual([
      { type: ParameterType.PATH, name: 'id', index: 0 },
      { type: ParameterType.QUERY, name: 'filter', index: 1 },
    ]);
  });

  it('should handle mixed automatic and manual naming', () => {
    class TestService {
      @get('/users/{userId}/posts')
      getUserPosts(
        @path() userId: string, // Should automatically get name "userId"
        @path('category') categoryId: string, // Should use provided name "category"
        @query() limit: number, // Should automatically get name "limit"
        @query('offset') offset: number, // Should use provided name "offset"
      ) {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'getUserPosts',
    );

    // Sort by index to ensure consistent order
    const sortedMetadata = [...paramMetadata].sort((a, b) => a.index - b.index);
    expect(sortedMetadata).toEqual([
      { type: ParameterType.PATH, name: 'userId', index: 0 },
      { type: ParameterType.PATH, name: 'category', index: 1 },
      { type: ParameterType.QUERY, name: 'limit', index: 2 },
      { type: ParameterType.QUERY, name: 'offset', index: 3 },
    ]);
  });

  it('should handle header parameter automatic naming', () => {
    class TestService {
      @get('/users')
      getUsers(
        @header() authorization: string, // Should automatically get name "authorization"
        @header('X-Custom-Header') custom: string, // Should use provided name
      ) {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'getUsers',
    );

    // Sort by index to ensure consistent order
    const sortedMetadata = [...paramMetadata].sort((a, b) => a.index - b.index);
    expect(sortedMetadata).toEqual([
      { type: ParameterType.HEADER, name: 'authorization', index: 0 },
      { type: ParameterType.HEADER, name: 'X-Custom-Header', index: 1 },
    ]);
  });

  it('should handle complex function signatures', () => {
    class TestService {
      @get('/complex/{param1}')
      complexMethod(
        @path() param1: string,
        @query() param2: number = 10,
        @query() ...rest: any[]
      ) {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const paramMetadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      TestService.prototype,
      'complexMethod',
    );

    // Sort by index to ensure consistent order
    const sortedMetadata = [...paramMetadata].sort((a, b) => a.index - b.index);
    expect(sortedMetadata).toEqual([
      { type: ParameterType.PATH, name: 'param1', index: 0 },
      { type: ParameterType.QUERY, name: 'param2', index: 1 },
      { type: ParameterType.QUERY, name: '...rest', index: 2 },
    ]);
  });
});
