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

const DEFAULT_ORDER = 0;

/**
 * OrderedCapable Interface
 *
 * Interface that provides ordering capability for types that implement it.
 * Implementing types must provide an order property to determine execution order.
 * Lower numerical values have higher priority, and elements with the same value
 * maintain their relative order.
 */
export interface OrderedCapable {
  /**
   * Order value
   *
   * Lower numerical values have higher priority. Negative numbers, zero, and
   * positive numbers are all supported.
   * When multiple elements have the same order value, their relative order
   * will remain unchanged (stable sort).
   */
  order?: number;
}


function sortOrder<T extends OrderedCapable>(a: T, b: T): number {
  return (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER);
}

/**
 * Sorts an array of elements that implement the OrderedCapable interface
 *
 * This function creates and returns a new sorted array without modifying the
 * original array. It supports an optional filter function to select elements
 * that should participate in sorting.
 *
 * @template T - Array element type that must implement the OrderedCapable interface
 * @param array - The array to be sorted
 * @param filter - Optional filter function to select elements that should be sorted
 * @returns A new array sorted in ascending order by the order property
 *
 * @example
 * ```typescript
 * const items: OrderedCapable[] = [
 *   { order: 10 },
 *   { order: 5 },
 *   { order: 1 },
 * ];
 *
 * const sortedItems = toSorted(items);
 * // Result: [{ order: 1 }, { order: 5 }, { order: 10 }]
 *
 * // Using filter function
 * const filteredAndSorted = toSorted(items, item => item.order > 3);
 * // Result: [{ order: 5 }, { order: 10 }]
 * ```
 */
export function toSorted<T extends OrderedCapable>(
  array: T[],
  filter?: (item: T) => boolean,
): T[] {
  if (filter) {
    return array.filter(filter).sort(sortOrder);
  }
  return [...array].sort(sortOrder);
}
