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
