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
 * Interface for objects that can be ordered
 *
 * This interface allows objects to specify their execution or display order.
 * Objects implementing this interface can be sorted using the `toSorted` function.
 * Lower order values indicate higher priority (executed/displayed first).
 *
 * @example
 * ```typescript
 * const interceptor: OrderedCapable = { order: 10 };
 * const highPriority: OrderedCapable = { order: -5 };
 * ```
 */
export interface OrderedCapable {
  /**
   * Optional order value for sorting
   *
   * - Lower values have higher priority (sorted first)
   * - Supports negative, zero, and positive numbers
   * - Defaults to 0 if undefined
   * - Equal values maintain original relative order (stable sort)
   *
   * @default 0
   */
  order?: number;
}

/**
 * Comparator function for sorting OrderedCapable elements
 *
 * Compares two elements based on their order property. Elements with lower order values
 * are sorted first. If order is undefined, defaults to DEFAULT_ORDER (0).
 *
 * @param a - First element to compare
 * @param b - Second element to compare
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
export function sortOrder<T extends OrderedCapable>(a: T, b: T): number {
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
