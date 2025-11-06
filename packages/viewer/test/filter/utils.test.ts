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

import { describe, it, expect } from 'vitest';
import { isValidBetweenValue, isValidValue } from '../../src';

describe('isValidValue', () => {
  it('should return false for null', () => {
    expect(isValidValue(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidValue(undefined)).toBe(false);
  });

  it('should return true for number zero', () => {
    expect(isValidValue(0)).toBe(true);
  });

  it('should return true for negative numbers', () => {
    expect(isValidValue(-1)).toBe(true);
  });

  it('should return true for positive numbers', () => {
    expect(isValidValue(42)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isValidValue('')).toBe(true);
  });

  it('should return true for non-empty string', () => {
    expect(isValidValue('hello')).toBe(true);
  });

  it('should return true for boolean false', () => {
    expect(isValidValue(false)).toBe(true);
  });

  it('should return true for boolean true', () => {
    expect(isValidValue(true)).toBe(true);
  });

  it('should return true for empty object', () => {
    expect(isValidValue({})).toBe(true);
  });

  it('should return true for non-empty object', () => {
    expect(isValidValue({ key: 'value' })).toBe(true);
  });

  it('should return true for empty array', () => {
    expect(isValidValue([])).toBe(true);
  });

  it('should return true for non-empty array', () => {
    expect(isValidValue([1, 2, 3])).toBe(true);
  });

  it('should return true for NaN', () => {
    expect(isValidValue(NaN)).toBe(true);
  });

  it('should return true for Infinity', () => {
    expect(isValidValue(Infinity)).toBe(true);
  });

  it('should return true for negative Infinity', () => {
    expect(isValidValue(-Infinity)).toBe(true);
  });

  it('should return true for Symbol', () => {
    expect(isValidValue(Symbol('test'))).toBe(true);
  });

  it('should return true for BigInt', () => {
    expect(isValidValue(BigInt(123))).toBe(true);
  });

  it('should return true for Date object', () => {
    expect(isValidValue(new Date())).toBe(true);
  });

  it('should return true for RegExp object', () => {
    expect(isValidValue(/test/)).toBe(true);
  });

  it('should return true for function', () => {
    expect(isValidValue(() => {})).toBe(true);
  });
});

describe('isValidBetweenValue', () => {
  it('should return false for null', () => {
    expect(isValidBetweenValue(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidBetweenValue(undefined)).toBe(false);
  });

  it('should return false for number', () => {
    expect(isValidBetweenValue(123)).toBe(false);
  });

  it('should return false for string', () => {
    expect(isValidBetweenValue('string')).toBe(false);
  });

  it('should return false for object', () => {
    expect(isValidBetweenValue({})).toBe(false);
  });

  it('should return false for boolean', () => {
    expect(isValidBetweenValue(true)).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(isValidBetweenValue([])).toBe(false);
  });

  it('should return false for array with single element', () => {
    expect(isValidBetweenValue([1])).toBe(false);
  });

  it('should return false for array with three elements', () => {
    expect(isValidBetweenValue([1, 2, 3])).toBe(false);
  });

  it('should return false for array with four elements', () => {
    expect(isValidBetweenValue([1, 2, 3, 4])).toBe(false);
  });

  it('should return false when first element is null', () => {
    expect(isValidBetweenValue([null, 1])).toBe(false);
  });

  it('should return false when first element is undefined', () => {
    expect(isValidBetweenValue([undefined, 1])).toBe(false);
  });

  it('should return false when second element is null', () => {
    expect(isValidBetweenValue([1, null])).toBe(false);
  });

  it('should return false when second element is undefined', () => {
    expect(isValidBetweenValue([1, undefined])).toBe(false);
  });

  it('should return false when both elements are null', () => {
    expect(isValidBetweenValue([null, null])).toBe(false);
  });

  it('should return false when both elements are undefined', () => {
    expect(isValidBetweenValue([undefined, undefined])).toBe(false);
  });

  it('should return false when first is valid and second is null', () => {
    expect(isValidBetweenValue([0, null])).toBe(false);
  });

  it('should return false when first is valid and second is undefined', () => {
    expect(isValidBetweenValue([0, undefined])).toBe(false);
  });

  it('should return false when first is null and second is valid', () => {
    expect(isValidBetweenValue([null, 0])).toBe(false);
  });

  it('should return false when first is undefined and second is valid', () => {
    expect(isValidBetweenValue([undefined, 0])).toBe(false);
  });

  it('should return true for array with two numbers', () => {
    expect(isValidBetweenValue([1, 2])).toBe(true);
  });

  it('should return true for array with two strings', () => {
    expect(isValidBetweenValue(['a', 'b'])).toBe(true);
  });

  it('should return true for array with two booleans', () => {
    expect(isValidBetweenValue([true, false])).toBe(true);
  });

  it('should return true for array with two objects', () => {
    expect(isValidBetweenValue([{}, {}])).toBe(true);
  });

  it('should return true for array with two arrays', () => {
    expect(isValidBetweenValue([[], []])).toBe(true);
  });

  it('should return true for array with two dates', () => {
    expect(isValidBetweenValue([new Date(), new Date()])).toBe(true);
  });

  it('should return true for array with mixed valid types', () => {
    expect(isValidBetweenValue([1, 'string'])).toBe(true);
  });

  it('should return true for array with zero and empty string', () => {
    expect(isValidBetweenValue([0, ''])).toBe(true);
  });

  it('should return true for array with false and empty object', () => {
    expect(isValidBetweenValue([false, {}])).toBe(true);
  });

  it('should return true for array with NaN and Infinity', () => {
    expect(isValidBetweenValue([NaN, Infinity])).toBe(true);
  });

  it('should return true for array with two symbols', () => {
    expect(isValidBetweenValue([Symbol('a'), Symbol('b')])).toBe(true);
  });

  it('should return true for array with two BigInts', () => {
    expect(isValidBetweenValue([BigInt(1), BigInt(2)])).toBe(true);
  });

  it('should return true for array with two functions', () => {
    expect(isValidBetweenValue([() => {}, () => {}])).toBe(true);
  });

  it('should return true for array with two RegExp', () => {
    expect(isValidBetweenValue([/a/, /b/])).toBe(true);
  });
});