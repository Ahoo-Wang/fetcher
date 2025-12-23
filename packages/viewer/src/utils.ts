import { TableRecordType } from './types';

/**
 * Performs a deep equality comparison between two values.
 *
 * This function recursively compares the structure and values of two objects or arrays,
 * ensuring that they are identical in both content and structure. It handles primitive
 * types, objects, arrays, and nested combinations thereof.
 *
 * @param left - The first value to compare. Can be of any type.
 * @param right - The second value to compare. Can be of any type.
 * @returns true if the values are deeply equal, false otherwise.
 *
 * @example
 * deepEqual(1, 1) // true
 * deepEqual({a: 1}, {a: 1}) // true
 * deepEqual([1, 2], [1, 2]) // true
 * deepEqual({a: 1}, {a: 2}) // false
 * deepEqual([1, 2], [1, 2, 3]) // false
 *
 * @note
 * - Uses strict equality (===) for primitive comparisons.
 * - Handles null and undefined as unequal unless both are the same.
 * - For arrays, compares lengths first, then recursively compares each element.
 * - For objects, compares constructors, then keys, then recursively compares values.
 * - Does not handle circular references (would cause infinite recursion).
 * - Does not consider object prototypes beyond constructor comparison.
 * - Performance may be poor for very large or deeply nested structures.
 */
export function deepEqual(left: any, right: any): boolean {
  // Quick check: if values are strictly equal, they are deeply equal
  // This covers primitives, same object references, and identical values
  if (left === right) {
    return true;
  }

  // Handle null/undefined cases: if one is null/undefined and the other isn't,
  // or if they are different (one null, one undefined), return false
  // Note: null == undefined is true, but null === undefined is false
  if (left == null || right == null) {
    return false;
  }

  // Handle array comparison
  if (Array.isArray(left) && Array.isArray(right)) {
    // Arrays must have the same length to be equal
    if (left.length !== right.length) return false;

    // Recursively compare each element at the same index
    // Uses Array.every for short-circuiting (stops on first false)
    return left.every((item, index) => deepEqual(item, right[index]));
  }

  // Handle object comparison (but not arrays, which were handled above)
  if (typeof left === 'object' && typeof right === 'object') {
    // Objects must be of the same type (same constructor)
    // This prevents comparing Date with {}, or custom class instances incorrectly
    if (left.constructor !== right.constructor) return false;

    // Get all enumerable keys from both objects
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    // Must have the same number of keys
    if (leftKeys.length !== rightKeys.length) return false;

    // Recursively compare the value of each key
    // Assumes keys are in the same order (Object.keys order is consistent for same keys)
    return leftKeys.every(key => deepEqual(left[key], right[key]));
  }

  // If neither primitive equality, nor array, nor object, they are not equal
  // This covers cases like number vs string, function vs object, etc.
  return false;
}

export function mapToTableRecord<RecordType = any>(
  dataSource: RecordType[] | undefined,
): TableRecordType<RecordType>[] {
  if (dataSource && dataSource.length > 0) {
    return dataSource.map((record, index) => ({
      ...record,
      key: index,
    }));
  }
  return [];
}
