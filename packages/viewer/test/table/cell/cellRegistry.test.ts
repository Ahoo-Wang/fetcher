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
import { cellRegistry } from '../../../src';
import { TEXT_CELL_TYPE } from '../../../src';

describe('cellRegistry', () => {
  it('should have text cell registered', () => {
    const TextCell = cellRegistry.get(TEXT_CELL_TYPE);
    expect(TextCell).toBeDefined();
    expect(typeof TextCell).toBe('function');
  });

  it('should return undefined for unregistered type', () => {
    const unregistered = cellRegistry.get('unregistered-type');
    expect(unregistered).toBeUndefined();
  });

  it('should handle edge case: empty string type', () => {
    const empty = cellRegistry.get('');
    expect(empty).toBeUndefined();
  });

  it('should handle edge case: null type', () => {
    const nullType = cellRegistry.get(null as any);
    expect(nullType).toBeUndefined();
  });

  it('should handle edge case: undefined type', () => {
    const undefinedType = cellRegistry.get(undefined as any);
    expect(undefinedType).toBeUndefined();
  });

  it('should handle edge case: numeric type', () => {
    const numericType = cellRegistry.get(123 as any);
    expect(numericType).toBeUndefined();
  });

  it('should handle edge case: object type', () => {
    const objectType = cellRegistry.get({} as any);
    expect(objectType).toBeUndefined();
  });
});
