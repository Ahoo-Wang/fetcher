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
import { mergeRecords } from '../src';

describe('utils', () => {
  describe('mergeRecords', () => {
    it('should return undefined when both records are undefined', () => {
      const result = mergeRecords(undefined, undefined);
      expect(result).toBeUndefined();
    });

    it('should return first record when second record is undefined', () => {
      const first = { a: 1, b: 2 };
      const result = mergeRecords(first, undefined);
      expect(result).toBe(first);
    });

    it('should return second record when first record is undefined', () => {
      const second = { a: 1, b: 2 };
      const result = mergeRecords(undefined, second);
      expect(result).toBe(second);
    });

    it('should merge two records with second taking precedence', () => {
      const first = { a: 1, b: 2, c: 3 };
      const second = { b: 20, d: 4 };
      const result = mergeRecords(first, second);

      expect(result).toEqual({
        a: 1,
        b: 20, // second record takes precedence
        c: 3,
        d: 4,
      });
    });

    it('should handle empty records', () => {
      const first = {};
      const second = { a: 1 };
      const result = mergeRecords(first, second);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle different value types', () => {
      const first = {
        string: 'hello',
        number: 42,
        boolean: true,
      };
      const second = {
        string: 'world',
        number: 100,
      };
      const result = mergeRecords(first, second);

      expect(result).toEqual({
        string: 'world', // second takes precedence
        number: 100,
        boolean: true,
      });
    });
  });
});
