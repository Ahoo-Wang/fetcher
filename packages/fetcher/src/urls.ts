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
 * Checks if the given URL is an absolute URL
 *
 * @param url - URL string to check
 * @returns boolean - Returns true if it's an absolute URL, false otherwise
 *
 * @example
 * ```typescript
 * isAbsoluteURL('https://api.example.com/users'); // true
 * isAbsoluteURL('/users'); // false
 * isAbsoluteURL('users'); // false
 * ```
 */
export function isAbsoluteURL(url: string) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

/**
 * Combines a base URL and a relative URL into a complete URL
 *
 * @param baseURL - Base URL
 * @param relativeURL - Relative URL
 * @returns string - Combined complete URL
 *
 * @remarks
 * If the relative URL is already an absolute URL, it will be returned as-is.
 * Otherwise, the base URL and relative URL will be combined with proper path separator handling.
 *
 * @example
 * ```typescript
 * combineURLs('https://api.example.com', '/users'); // https://api.example.com/users
 * combineURLs('https://api.example.com/', 'users'); // https://api.example.com/users
 * combineURLs('https://api.example.com', 'https://other.com/users'); // https://other.com/users
 * ```
 */
export function combineURLs(baseURL: string, relativeURL: string) {
  if (isAbsoluteURL(relativeURL)) {
    return relativeURL;
  }
  // If relative URL exists, combine base URL and relative URL, otherwise return base URL
  return relativeURL
    ? baseURL.replace(/\/?\/$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}