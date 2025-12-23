/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it } from 'vitest';
import { deepEqual, mapToTableRecord } from '../src/utils';
import type { TableRecordType } from '../src/types';

describe('deepEqual', () => {
  describe('Primitive Types', () => {
    it('should return true for identical primitive values', () => {
      expect(deepEqual(42, 42)).toBe(true);
      expect(deepEqual('hello', 'hello')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(false, false)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('should return false for different primitive values', () => {
      expect(deepEqual(42, 43)).toBe(false);
      expect(deepEqual('hello', 'world')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
      expect(deepEqual(42, '42')).toBe(false);
      expect(deepEqual(0, false)).toBe(false);
    });

    it('should return false when comparing null/undefined with other values', () => {
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(null, 0)).toBe(false);
      expect(deepEqual(undefined, '')).toBe(false);
      expect(deepEqual(null, {})).toBe(false);
      expect(deepEqual(undefined, [])).toBe(false);
    });
  });

  describe('Arrays', () => {
    it('should return true for identical arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(deepEqual([], [])).toBe(true);
    });

    it('should return false for arrays with different lengths', () => {
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
    });

    it('should return false for arrays with different elements', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual(['a', 'b'], ['a', 'c'])).toBe(false);
    });

    it('should handle nested arrays', () => {
      expect(
        deepEqual(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 4],
          ],
        ),
      ).toBe(true);
      expect(
        deepEqual(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 5],
          ],
        ),
      ).toBe(false);
      expect(
        deepEqual(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 4],
            [5, 6],
          ],
        ),
      ).toBe(false);
    });

    it('should handle arrays with mixed types', () => {
      expect(deepEqual([1, 'hello', true], [1, 'hello', true])).toBe(true);
      expect(deepEqual([1, 'hello', true], [1, 'hello', false])).toBe(false);
    });
  });

  describe('Objects', () => {
    it('should return true for identical objects', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(
        deepEqual({ name: 'John', age: 30 }, { name: 'John', age: 30 }),
      ).toBe(true);
      expect(deepEqual({}, {})).toBe(true);
    });

    it('should return false for objects with different keys', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should return false for objects with different values', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(deepEqual({ name: 'John' }, { name: 'Jane' })).toBe(false);
    });

    it('should handle nested objects', () => {
      const obj1 = { user: { name: 'John', age: 30 }, active: true };
      const obj2 = { user: { name: 'John', age: 30 }, active: true };
      const obj3 = { user: { name: 'John', age: 31 }, active: true };

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });

    it('should handle objects with different constructors', () => {
      expect(deepEqual({}, [])).toBe(false);
      expect(deepEqual(new Date(), {})).toBe(false);
      expect(deepEqual(/test/, {})).toBe(false);
    });

    it('should handle objects with array values', () => {
      expect(deepEqual({ items: [1, 2, 3] }, { items: [1, 2, 3] })).toBe(true);
      expect(deepEqual({ items: [1, 2, 3] }, { items: [1, 2, 4] })).toBe(false);
    });
  });

  describe('Mixed Types', () => {
    it('should return false when comparing different types', () => {
      expect(deepEqual({}, [])).toBe(false);
      expect(deepEqual([], {})).toBe(false);
      expect(deepEqual(42, [42])).toBe(false);
      expect(deepEqual('hello', { value: 'hello' })).toBe(false);
      expect(deepEqual(true, { value: true })).toBe(false);
    });

    it('should handle complex nested structures', () => {
      const complex1 = {
        users: [
          { id: 1, name: 'John', roles: ['admin', 'user'] },
          { id: 2, name: 'Jane', roles: ['user'] },
        ],
        settings: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
          },
        },
      };

      const complex2 = {
        users: [
          { id: 1, name: 'John', roles: ['admin', 'user'] },
          { id: 2, name: 'Jane', roles: ['user'] },
        ],
        settings: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
          },
        },
      };

      const complex3 = {
        users: [
          { id: 1, name: 'John', roles: ['admin', 'user'] },
          { id: 2, name: 'Jane', roles: ['user'] },
        ],
        settings: {
          theme: 'light', // Different theme
          notifications: {
            email: true,
            push: false,
          },
        },
      };

      expect(deepEqual(complex1, complex2)).toBe(true);
      expect(deepEqual(complex1, complex3)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle same object references', () => {
      const obj = { a: 1 };
      const arr = [1, 2, 3];

      expect(deepEqual(obj, obj)).toBe(true);
      expect(deepEqual(arr, arr)).toBe(true);
    });

    it('should handle functions (considered not equal)', () => {
      const func1 = () => {};
      const func2 = () => {};

      expect(deepEqual(func1, func1)).toBe(true); // Same reference
      expect(deepEqual(func1, func2)).toBe(false); // Different references
    });

    it('should handle symbols', () => {
      const sym1 = Symbol('test');
      const sym2 = Symbol('test');

      expect(deepEqual(sym1, sym1)).toBe(true); // Same reference
      expect(deepEqual(sym1, sym2)).toBe(false); // Different symbols
    });
  });
});

describe('mapToTableRecord', () => {
  it('should return empty array when dataSource is undefined', () => {
    const result = mapToTableRecord(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array when dataSource is empty array', () => {
    const result = mapToTableRecord([]);
    expect(result).toEqual([]);
  });

  it('should map records with index-based keys', () => {
    const dataSource = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 3, name: 'Bob' },
    ];

    const result = mapToTableRecord(dataSource);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 1, name: 'John', key: 0 });
    expect(result[1]).toEqual({ id: 2, name: 'Jane', key: 1 });
    expect(result[2]).toEqual({ id: 3, name: 'Bob', key: 2 });
  });

  it('should preserve existing properties while adding key', () => {
    const dataSource = [
      { id: 1, name: 'John', active: true },
      { id: 2, name: 'Jane', active: false },
    ];

    const result = mapToTableRecord(dataSource);

    expect(result[0]).toEqual({ id: 1, name: 'John', active: true, key: 0 });
    expect(result[1]).toEqual({ id: 2, name: 'Jane', active: false, key: 1 });
  });

  it('should work with different record types', () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    const dataSource: User[] = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' },
    ];

    const result = mapToTableRecord<User>(dataSource);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 1,
      name: 'John',
      email: 'john@example.com',
      key: 0,
    });
    expect(result[1]).toEqual({
      id: 2,
      name: 'Jane',
      email: 'jane@example.com',
      key: 1,
    });

    // Type check: result should be assignable to TableRecordType<User>[]
    const typedResult: TableRecordType<User>[] = result;
    expect(typedResult).toBeDefined();
  });

  it('should handle complex nested objects', () => {
    const dataSource = [
      {
        id: 1,
        user: { name: 'John', profile: { avatar: 'url1' } },
        tags: ['admin', 'user'],
      },
      {
        id: 2,
        user: { name: 'Jane', profile: { avatar: 'url2' } },
        tags: ['user'],
      },
    ];

    const result = mapToTableRecord(dataSource);

    expect(result).toHaveLength(2);
    expect(result[0].key).toBe(0);
    expect(result[1].key).toBe(1);
    expect(result[0].user.name).toBe('John');
    expect(result[1].tags).toEqual(['user']);
  });

  it('should handle records with existing key property', () => {
    const dataSource = [
      { id: 1, name: 'John', key: 'existing-key' },
      { id: 2, name: 'Jane', key: 'another-key' },
    ];

    const result = mapToTableRecord(dataSource);

    // The function should overwrite existing key with index-based key
    expect(result[0]).toEqual({ id: 1, name: 'John', key: 0 });
    expect(result[1]).toEqual({ id: 2, name: 'Jane', key: 1 });
  });

  it('should handle single record array', () => {
    const dataSource = [{ id: 1, name: 'John' }];
    const result = mapToTableRecord(dataSource);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 1, name: 'John', key: 0 });
  });

  it('should handle large arrays', () => {
    const dataSource = Array.from({ length: 1000 }, (_, index) => ({
      id: index + 1,
      name: `User ${index + 1}`,
    }));

    const result = mapToTableRecord(dataSource);

    expect(result).toHaveLength(1000);
    expect(result[0]).toEqual({ id: 1, name: 'User 1', key: 0 });
    expect(result[999]).toEqual({ id: 1000, name: 'User 1000', key: 999 });
  });
});
