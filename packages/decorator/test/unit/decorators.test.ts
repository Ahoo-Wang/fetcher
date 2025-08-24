import { describe, it, expect } from 'vitest';
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
} from '../../src/decorators';
import {
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  PARAMETER_METADATA_KEY,
  ParameterType,
} from '../../src/metadata';
import { HttpMethod } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

describe('decorator functions unit tests', () => {
  describe('api decorator function', () => {
    it('should return a function that sets metadata', () => {
      const decorator = api('/test', { fetcher: 'test' });
      expect(typeof decorator).toBe('function');

      const mockConstructor = function() {
      };
      decorator(mockConstructor);

      const metadata = Reflect.getMetadata(API_METADATA_KEY, mockConstructor);
      expect(metadata).toEqual({
        basePath: '/test',
        fetcher: 'test',
      });
    });
  });

  describe('method decorator functions', () => {
    const target = {};
    const propertyKey = 'testMethod';
    const descriptor = {
      value: function() {
      },
    };

    it('get decorator should set correct metadata', () => {
      const decorator = get('/users');
      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual({
        method: HttpMethod.GET,
        path: '/users',
      });
    });

    it('post decorator should set correct metadata', () => {
      const decorator = post('/users', { timeout: 5000 });
      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual({
        method: HttpMethod.POST,
        path: '/users',
        timeout: 5000,
      });
    });

    it('put decorator should set correct metadata', () => {
      const decorator = put('/users/{id}');
      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual({
        method: HttpMethod.PUT,
        path: '/users/{id}',
      });
    });

    it('del decorator should set correct metadata', () => {
      const decorator = del('/users/{id}');
      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual({
        method: HttpMethod.DELETE,
        path: '/users/{id}',
      });
    });

    it('patch decorator should set correct metadata', () => {
      const decorator = patch('/users/{id}');
      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual({
        method: HttpMethod.PATCH,
        path: '/users/{id}',
      });
    });

    it('head decorator should set correct metadata', () => {
      const decorator = head('/users/{id}');
      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual({
        method: HttpMethod.HEAD,
        path: '/users/{id}',
      });
    });

    it('options decorator should set correct metadata', () => {
      const decorator = options('/users');
      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ENDPOINT_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual({
        method: HttpMethod.OPTIONS,
        path: '/users',
      });
    });
  });

  describe('parameter decorator functions', () => {
    const target = {};
    const propertyKey = 'testMethod';

    it('path decorator should set correct metadata', () => {
      const decorator = path('id');
      decorator(target, propertyKey, 0);

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual([
        { type: ParameterType.PATH, name: 'id', index: 0 },
      ]);
    });

    it('query decorator should set correct metadata', () => {
      // Clear any existing metadata
      Reflect.defineMetadata(PARAMETER_METADATA_KEY, [], target, propertyKey);

      const decorator = query('filter');
      decorator(target, propertyKey, 0);

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual([
        { type: ParameterType.QUERY, name: 'filter', index: 0 },
      ]);
    });

    it('body decorator should set correct metadata', () => {
      // Clear any existing metadata
      Reflect.defineMetadata(PARAMETER_METADATA_KEY, [], target, propertyKey);

      const decorator = body();
      decorator(target, propertyKey, 0);

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual([{ type: ParameterType.BODY, index: 0 }]);
    });

    it('header decorator should set correct metadata', () => {
      // Clear any existing metadata
      Reflect.defineMetadata(PARAMETER_METADATA_KEY, [], target, propertyKey);

      const decorator = header('Authorization');
      decorator(target, propertyKey, 0);

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual([
        { type: ParameterType.HEADER, name: 'Authorization', index: 0 },
      ]);
    });

    it('should handle multiple parameters', () => {
      // Clear any existing metadata
      Reflect.defineMetadata(PARAMETER_METADATA_KEY, [], target, propertyKey);

      // First parameter
      const pathDecorator = path('id');
      pathDecorator(target, propertyKey, 0);

      // Second parameter
      const bodyDecorator = body();
      bodyDecorator(target, propertyKey, 1);

      const metadata = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        propertyKey,
      );
      expect(metadata).toEqual([
        { type: ParameterType.PATH, name: 'id', index: 0 },
        { type: ParameterType.BODY, index: 1 },
      ]);
    });
  });
});
