import { describe, it, expect } from 'vitest';
import {
  endpoint,
  get,
  post,
  put,
  del,
  patch,
  head,
  options,
  ENDPOINT_METADATA_KEY,
} from '../src';
import { HttpMethod } from '@ahoo-wang/fetcher';

describe('endpointDecorator', () => {
  it('should define endpoint metadata', () => {
    class TestService {

      getUsers() {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    endpoint(HttpMethod.GET, '/users')(TestService.prototype, 'getUsers');

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'getUsers',
    );

    expect(metadata).toEqual({
      method: HttpMethod.GET,
      path: '/users',
    });
  });

  it('should define GET endpoint', () => {
    class TestService {

      getUsers() {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    get('/users')(TestService.prototype, 'getUsers');

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'getUsers',
    );

    expect(metadata).toEqual({
      method: HttpMethod.GET,
      path: '/users',
    });
  });

  it('should define POST endpoint', () => {
    class TestService {

      createUsers() {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    post('/users')(TestService.prototype, 'createUsers');

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'createUsers',
    );

    expect(metadata).toEqual({
      method: HttpMethod.POST,
      path: '/users',
    });
  });

  it('should define PUT endpoint', () => {
    class TestService {

      updateUsers() {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    put('/users/{id}')(TestService.prototype, 'updateUsers');

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'updateUsers',
    );

    expect(metadata).toEqual({
      method: HttpMethod.PUT,
      path: '/users/{id}',
    });
  });

  it('should define DELETE endpoint', () => {
    class TestService {

      deleteUsers() {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    del('/users/{id}')(TestService.prototype, 'deleteUsers');

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'deleteUsers',
    );

    expect(metadata).toEqual({
      method: HttpMethod.DELETE,
      path: '/users/{id}',
    });
  });

  it('should define PATCH endpoint', () => {
    class TestService {

      patchUsers() {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    patch('/users/{id}')(TestService.prototype, 'patchUsers');

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'patchUsers',
    );

    expect(metadata).toEqual({
      method: HttpMethod.PATCH,
      path: '/users/{id}',
    });
  });

  it('should define HEAD endpoint', () => {
    class TestService {

      headUsers() {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    head('/users/{id}')(TestService.prototype, 'headUsers');

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'headUsers',
    );

    expect(metadata).toEqual({
      method: HttpMethod.HEAD,
      path: '/users/{id}',
    });
  });

  it('should define OPTIONS endpoint', () => {
    class TestService {

      optionsUsers() {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    options('/users/{id}')(TestService.prototype, 'optionsUsers');

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      ENDPOINT_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'optionsUsers',
    );

    expect(metadata).toEqual({
      method: HttpMethod.OPTIONS,
      path: '/users/{id}',
    });
  });
});
