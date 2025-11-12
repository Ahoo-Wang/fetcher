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

import dayjs, { Dayjs } from 'dayjs';

export function parseDayjs(value: string | number | Date | Dayjs): Dayjs {
  if (dayjs.isDayjs(value)) {
    return value;
  }
  return dayjs(value);
}

export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if a value is a valid image source URL.
 *
 * This function determines whether a given value can be used as an image source
 * by checking if it's a string that represents a valid image URL. It supports
 * absolute URLs (http/https), relative URLs (/), and data URLs (data:image/).
 *
 * @param value - The value to check
 * @returns true if the value is a valid image source, false otherwise
 *
 * @example
 * ```typescript
 * isValidImageSrc('https://example.com/image.jpg') // true
 * isValidImageSrc('/images/avatar.png') // true
 * isValidImageSrc('data:image/png;base64,iVBORw0KGgo...') // true
 * isValidImageSrc('John Doe') // false
 * isValidImageSrc(null) // false
 * ```
 */
export function isValidImageSrc(value: any): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  const trimmedValue = value.trim().toLowerCase();

  // Check for absolute URLs (http/https) - case insensitive
  if (
    trimmedValue.startsWith('http://') ||
    trimmedValue.startsWith('https://')
  ) {
    return true;
  }

  // Check for relative URLs starting with /
  if (value.trim().startsWith('/')) {
    return true;
  }

  // Check for valid data URLs (data:image/...;...)
  if (trimmedValue.startsWith('data:image/')) {
    // Ensure it has the proper format: data:image/type;base64,data
    const dataUrlPattern = /^data:image\/[a-z]+(;[a-z0-9]+)?,/i;
    return dataUrlPattern.test(value.trim());
  }

  return false;
}
