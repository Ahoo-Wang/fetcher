import { describe, it, expect } from 'vitest';
import {
  parameter,
  path,
  query,
  header,
  body,
  request,
  ParameterType,
  PARAMETER_METADATA_KEY,
} from '../src';

describe('parameterDecorator', () => {
  it('should define parameter metadata', () => {
    class TestService {
      getUsers(id: number) {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    parameter(ParameterType.PATH, 'id')(TestService.prototype, 'getUsers', 0);

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'getUsers',
    );

    expect(metadata).toEqual([
      {
        type: ParameterType.PATH,
        name: 'id',
        index: 0,
      },
    ]);
  });

  it('should define path parameter', () => {
    class TestService {
      getUsers(id: number) {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    path('id')(TestService.prototype, 'getUsers', 0);

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'getUsers',
    );

    expect(metadata).toEqual([
      {
        type: ParameterType.PATH,
        name: 'id',
        index: 0,
      },
    ]);
  });

  it('should define query parameter', () => {
    class TestService {
      getUsers(limit: number) {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    query('limit')(TestService.prototype, 'getUsers', 0);

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'getUsers',
    );

    expect(metadata).toEqual([
      {
        type: ParameterType.QUERY,
        name: 'limit',
        index: 0,
      },
    ]);
  });

  it('should define header parameter', () => {
    class TestService {
      getUsers(auth: string) {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    header('Authorization')(TestService.prototype, 'getUsers', 0);

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'getUsers',
    );

    expect(metadata).toEqual([
      {
        type: ParameterType.HEADER,
        name: 'Authorization',
        index: 0,
      },
    ]);
  });

  it('should define body parameter', () => {
    class TestService {
      createUsers(user: any) {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    body()(TestService.prototype, 'createUsers', 0);

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'createUsers',
    );

    expect(metadata).toEqual([
      {
        type: ParameterType.BODY,
        name: 'user',
        index: 0,
      },
    ]);
  });

  it('should handle multiple parameters', () => {
    class TestService {
      updateUsers(_id: number, _force: boolean, _user: any) {
        // Implementation will be generated automatically
      }
    }

    // Apply decorators manually for testing
    path('id')(TestService.prototype, 'updateUsers', 0);
    query('force')(TestService.prototype, 'updateUsers', 1);
    body()(TestService.prototype, 'updateUsers', 2);

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'updateUsers',
    );

    expect(metadata).toEqual([
      {
        type: ParameterType.PATH,
        name: 'id',
        index: 0,
      },
      {
        type: ParameterType.QUERY,
        name: 'force',
        index: 1,
      },
      {
        type: ParameterType.BODY,
        name: '_user',
        index: 2,
      },
    ]);
  });

  it('should define request parameter', () => {
    class TestService {
      createUsers(_request: any) {
        // Implementation will be generated automatically
      }
    }

    // Apply decorator manually for testing
    request()(TestService.prototype, 'createUsers', 0);

    const instance = new TestService();
    const metadata = Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      Object.getPrototypeOf(instance),
      'createUsers',
    );

    expect(metadata).toEqual([
      {
        type: ParameterType.REQUEST,
        name: '_request',
        index: 0,
      },
    ]);
  });
});
