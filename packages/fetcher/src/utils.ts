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

/**
 * Merges two record objects, giving precedence to the second record for overlapping keys.
 *
 * This utility function is used to merge configuration objects where the second object
 * takes precedence over the first when there are conflicting keys.
 *
 * @template V - The type of values in the records
 * @param first - The first record to merge (lower precedence)
 * @param second - The second record to merge (higher precedence)
 * @returns A new merged record, or undefined if both inputs are undefined
 *
 * @example
 * ```typescript
 * // Merge two objects
 * const defaults = { timeout: 5000, retries: 3 };
 * const overrides = { timeout: 10000 };
 * const result = mergeRecords(defaults, overrides);
 * // Result: { timeout: 10000, retries: 3 }
 *
 * // Handle undefined values
 * const result2 = mergeRecords(undefined, { timeout: 5000 });
 * // Result: { timeout: 5000 }
 *
 * // Return undefined when both are undefined
 * const result3 = mergeRecords(undefined, undefined);
 * // Result: undefined
 * ```
 */
export function mergeRecords<V>(
  first?: Record<string, V>,
  second?: Record<string, V>,
): Record<string, V> | undefined {
  // If both records are undefined, return undefined
  if (first === undefined && second === undefined) {
    return undefined;
  }

  // If second record is undefined, return first record
  if (second === undefined) {
    return first;
  }

  // If first record is undefined, return second record
  if (first === undefined) {
    return second;
  }

  // Merge both records, with second taking precedence
  return { ...first, ...second };
}

/**
 * Merge a Record object or Map object into a target Map
 * @param record - Source data, can be either Record<string, V> or Map<string, V> type
 * @param map - Target Map object, if not provided a new Map will be created
 * @returns The merged Map object
 */
export function mergeRecordToMap<V>(record?: Record<string, V> | Map<string, V>, map?: Map<string, V>): Map<string, V> {
  map ??= new Map();
  if (!record) {
    return map;
  }
  if (record instanceof Map) {
    for (const [key, value] of record) {
      map.set(key, value);
    }
    return map;
  }
  for (const [key, value] of Object.entries(record)) {
    map.set(key, value);
  }
  return map;
}
