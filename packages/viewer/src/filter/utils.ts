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
 * Validates if a value is a valid "between" value, which is an array containing exactly two valid values.
 * This function is typically used in filtering contexts where a range is specified as [min, max].
 *
 * @param value - The value to validate. Should be an array of exactly two elements.
 * @returns {boolean} Returns true if the value is an array of exactly two valid (non-null, non-undefined) values, otherwise false.
 *
 * @example
 * ```typescript
 * isValidBetweenValue([1, 10]); // true - valid range
 * isValidBetweenValue([null, 10]); // false - first value is invalid
 * isValidBetweenValue([1]); // false - not exactly two elements
 * isValidBetweenValue("not an array"); // false - not an array
 * ```
 */
export function isValidBetweenValue(value: any): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  if (value.length !== 2) {
    return false;
  }
  return isValidValue(value[0]) && isValidValue(value[1]);
}

/**
 * Checks if a value is valid by ensuring it is neither null nor undefined.
 * This is a basic validation function used throughout the filtering system to determine
 * if a value can be considered meaningful for operations.
 *
 * @param value - The value to check for validity. Can be of any type.
 * @returns {boolean} Returns true if the value is not null and not undefined, otherwise false.
 *
 * @example
 * ```typescript
 * isValidValue(42); // true
 * isValidValue("hello"); // true
 * isValidValue(null); // false
 * isValidValue(undefined); // false
 * isValidValue(0); // true - zero is valid
 * isValidValue(""); // true - empty string is valid
 * ```
 */
export function isValidValue(value: any): boolean {
  return value !== null && value !== undefined;
}

/**
 * Retrieves the current timezone of the user's environment.
 * This function uses the Intl.DateTimeFormat API to determine the system's timezone setting.
 *
 * @returns {string} The timezone identifier as a string (e.g., "America/New_York", "Europe/London").
 *
 * @throws {Error} May throw if the Intl API is not available in the environment.
 *
 * @example
 * ```typescript
 * const tz = currentTimeZone();
 * console.log(tz); // "America/New_York" (depending on system settings)
 * ```
 *
 * @note This function relies on the browser's or Node.js environment's Intl support.
 * In environments without Intl support, this may not work as expected.
 */
export function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
