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
import { OrderedCapable, toSorted } from '../src';

describe('orderedCapable.ts', () => {
  describe('OrderedCapable', () => {
    it('should define order property', () => {
      // This is a type-only interface, so we just verify it compiles
      const item: OrderedCapable = {
        order: 10,
      };
      expect(item.order).toBe(10);
    });
  });

  describe('toSorted', () => {
    it('should sort array by order property', () => {
      const items: OrderedCapable[] = [
        { order: 10 },
        { order: 5 },
        { order: 15 },
        { order: 1 },
      ];

      const sortedItems = toSorted(items);

      expect(sortedItems).toHaveLength(4);
      expect(sortedItems[0].order).toBe(1);
      expect(sortedItems[1].order).toBe(5);
      expect(sortedItems[2].order).toBe(10);
      expect(sortedItems[3].order).toBe(15);
    });

    it('should return new array without modifying original', () => {
      const items: OrderedCapable[] = [{ order: 10 }, { order: 5 }];

      const sortedItems = toSorted(items);

      expect(sortedItems).not.toBe(items);
      expect(items[0].order).toBe(10);
      expect(items[1].order).toBe(5);
    });

    it('should sort with filter function', () => {
      const items: OrderedCapable[] = [
        { order: 10 },
        { order: 5 },
        { order: 15 },
        { order: 1 },
      ];

      const sortedItems = toSorted(items, item => (item.order ?? 0) > 3);

      expect(sortedItems).toHaveLength(3);
      expect(sortedItems[0].order).toBe(5);
      expect(sortedItems[1].order).toBe(10);
      expect(sortedItems[2].order).toBe(15);
    });

    it('should handle empty array', () => {
      const items: OrderedCapable[] = [];
      const sortedItems = toSorted(items);

      expect(sortedItems).toHaveLength(0);
    });

    it('should handle single item array', () => {
      const items: OrderedCapable[] = [{ order: 5 }];
      const sortedItems = toSorted(items);

      expect(sortedItems).toHaveLength(1);
      expect(sortedItems[0].order).toBe(5);
    });

    it('should handle items with same order', () => {
      const items: OrderedCapable[] = [
        { order: 5 },
        { order: 10 },
        { order: 5 },
      ];

      const sortedItems = toSorted(items);

      expect(sortedItems).toHaveLength(3);
      expect(sortedItems[0].order).toBe(5);
      expect(sortedItems[1].order).toBe(5);
      expect(sortedItems[2].order).toBe(10);
    });

    it('should handle negative order values', () => {
      const items: OrderedCapable[] = [
        { order: -5 },
        { order: 10 },
        { order: -10 },
        { order: 0 },
      ];

      const sortedItems = toSorted(items);

      expect(sortedItems).toHaveLength(4);
      expect(sortedItems[0].order).toBe(-10);
      expect(sortedItems[1].order).toBe(-5);
      expect(sortedItems[2].order).toBe(0);
      expect(sortedItems[3].order).toBe(10);
    });

    it('should handle filter that returns no items', () => {
      const items: OrderedCapable[] = [{ order: 10 }, { order: 20 }];

      const sortedItems = toSorted(items, item => (item.order ?? 0) < 5);

      expect(sortedItems).toHaveLength(0);
    });

    it('should handle undefined order values as default 0', () => {
      const items: OrderedCapable[] = [
        { order: 5 },
        {},
        { order: -1 },
        { order: 10 },
      ];

      const sortedItems = toSorted(items);

      expect(sortedItems).toHaveLength(4);
      expect(sortedItems[0].order).toBe(-1);
      expect(sortedItems[1].order).toBeUndefined();
      expect(sortedItems[2].order).toBe(5);
      expect(sortedItems[3].order).toBe(10);
    });
  });
});
