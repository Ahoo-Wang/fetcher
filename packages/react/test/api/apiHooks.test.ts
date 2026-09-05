import { describe, it, expect } from 'vitest';
import { methodNameToHookName, collectMethods } from '../../src/api/apiHooks';

describe('apiHooks utilities', () => {
  describe('methodNameToHookName', () => {
    it('should convert method name to hook name', () => {
      expect(methodNameToHookName('getUser')).toBe('useGetUser');
      expect(methodNameToHookName('createPost')).toBe('useCreatePost');
      expect(methodNameToHookName('deleteItem')).toBe('useDeleteItem');
      expect(methodNameToHookName('APIGetData')).toBe('useAPIGetData');
    });

    it('should handle single character method names', () => {
      expect(methodNameToHookName('a')).toBe('useA');
      expect(methodNameToHookName('z')).toBe('useZ');
    });

    it('should handle already capitalized method names', () => {
      expect(methodNameToHookName('GetUser')).toBe('useGetUser');
      expect(methodNameToHookName('CreatePost')).toBe('useCreatePost');
    });

    it('should throw error for empty or null method names', () => {
      expect(() => methodNameToHookName('')).toThrow(
        'Method name cannot be empty',
      );
      expect(() => methodNameToHookName(null as any)).toThrow(
        'Method name cannot be empty',
      );
      expect(() => methodNameToHookName(undefined as any)).toThrow(
        'Method name cannot be empty',
      );
    });
  });

  describe('collectMethods', () => {
    it('should collect methods from object', () => {
      const obj = {
        getUser: async () => 'user',
        createPost: async () => 'post',
        notAMethod: 'string',
      };

      const methods = collectMethods(obj);
      expect(methods.size).toBe(2);
      expect(methods.has('getUser')).toBe(true);
      expect(methods.has('createPost')).toBe(true);
      expect(methods.has('notAMethod')).toBe(false);
    });

    it('should collect methods from prototype chain', () => {
      class BaseApi {
        baseMethod = async () => 'base';
      }

      class ExtendedApi extends BaseApi {
        extendedMethod = async () => 'extended';
      }

      const obj = new ExtendedApi();
      const methods = collectMethods(obj);
      expect(methods.size).toBe(2);
      expect(methods.has('baseMethod')).toBe(true);
      expect(methods.has('extendedMethod')).toBe(true);
    });

    it('should bind methods to original object', () => {
      class Api {
        value = 'test';

        getValue = async () => this.value;
      }

      const obj = new Api();
      const methods = collectMethods(obj);
      const boundMethod = methods.get('getValue')!;

      // The bound method should have the correct 'this' context
      expect(boundMethod()).toBeInstanceOf(Promise);
    });

    it('should skip constructor', () => {
      class Api {
        constructor() {
          // constructor logic
        }

        method = async () => 'method';
      }

      const obj = new Api();
      const methods = collectMethods(obj);
      expect(methods.has('constructor')).toBe(false);
      expect(methods.has('method')).toBe(true);
    });
  });
});

it('collects function-valued getters with the public single-argument utility', async () => {
  class Api {
    prefix = 'instance';
    get load() {
      return async function (this: Api, id: string) {
        return `${this.prefix}:${id}`;
      };
    }
    get ready() {
      return true;
    }
  }
  const methods = collectMethods(new Api());
  expect([...methods.keys()]).toEqual(['load']);
  await expect(methods.get('load')?.('direct')).resolves.toBe(
    'instance:direct',
  );
});

it('collects ordinary properties through a Proxy get trap', async () => {
  const api = new Proxy(
    { prefix: 'instance', load: undefined },
    {
      get(target, key, receiver) {
        if (key === 'load') {
          return async function (this: { prefix: string }, id: string) {
            return `${this.prefix}:${id}`;
          };
        }
        return Reflect.get(target, key, receiver);
      },
    },
  );
  const methods = collectMethods(api);
  expect([...methods.keys()]).toEqual(['load']);
  await expect(methods.get('load')?.('proxy')).resolves.toBe('instance:proxy');
});

it('keeps two-argument accessor callbacks lazy and separate from ordinary methods', () => {
  let reads = 0;
  const lazyMethods = new Map<string, () => unknown>();
  const methods = collectMethods(
    {
      async first() {
        return 'first';
      },
      get load() {
        reads++;
        return async () => 'loaded';
      },
      async last() {
        return 'last';
      },
    },
    (name, get) => lazyMethods.set(name, get),
  );
  expect(reads).toBe(0);
  expect([...methods.keys()]).toEqual(['first', 'last']);
  expect([...lazyMethods.keys()]).toEqual(['load']);
  expect(lazyMethods.get('load')?.()).toBeTypeOf('function');
  expect(reads).toBe(1);
});

it.each(['own', 'inherited'])(
  'collects %s accessors through a Proxy get trap',
  async placement => {
    const reads = { getter: 0, proxy: 0 };
    class Api {
      prefix = 'instance';
      get load() {
        reads.getter++;
        return undefined;
      }
    }
    const target = new Api();
    if (placement === 'own') {
      Object.defineProperty(
        target,
        'load',
        Object.getOwnPropertyDescriptor(Api.prototype, 'load')!,
      );
    }
    const api = new Proxy(target, {
      get(target, key, receiver) {
        if (key === 'load') {
          reads.proxy++;
          return async function (this: Api, id: string) {
            return `${this.prefix}:${id}`;
          };
        }
        return Reflect.get(target, key, receiver);
      },
    });
    const methods = collectMethods(api);
    expect([...methods.keys()]).toEqual(['load']);
    await expect(methods.get('load')?.('proxy')).resolves.toBe(
      'instance:proxy',
    );
    expect(reads).toEqual({ getter: 0, proxy: 1 });
  },
);

it('collects inherited ordinary properties through the original Proxy', async () => {
  let reads = 0;
  class Api {
    prefix = 'instance';
    async load() {
      return 'prototype';
    }
  }
  const api = new Proxy(new Api(), {
    get(target, key, receiver) {
      if (key === 'load') {
        reads++;
        return async function (this: Api, id: string) {
          return `${this.prefix}:${id}`;
        };
      }
      return Reflect.get(target, key, receiver);
    },
  });
  const methods = collectMethods(api);
  expect([...methods.keys()]).toEqual(['load']);
  await expect(methods.get('load')?.('proxy')).resolves.toBe('instance:proxy');
  expect(reads).toBe(1);
});
