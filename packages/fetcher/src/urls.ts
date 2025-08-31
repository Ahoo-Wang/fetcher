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

/**
 * Regular expression pattern to match path parameters in the format {paramName}
 *
 * This regex is used to identify and extract path parameters from URL patterns.
 * It matches any text enclosed in curly braces {} and captures the content inside.
 *
 * Example matches:
 * - {id} -> captures "id"
 * - {userId} -> captures "userId"
 * - {category-name} -> captures "category-name"
 */
const PATH_PARAM_REGEX = /{([^}]+)}/g;

/**
 * Extracts path parameters from a URL string.
 *
 * @param url - The URL string to extract path parameters from
 * @returns An array of path parameter names without the curly braces, or an empty array if no matches found
 *
 * @example
 * ```typescript
 * extractPathParams('/users/{id}/posts/{postId}');
 * // Returns: ['id', 'postId']
 *
 * extractPathParams('https://api.example.com/{resource}/{id}');
 * // Returns: ['resource', 'id']
 *
 * extractPathParams('/users/profile');
 * // Returns: []
 * ```
 */
export function extractPathParams(url: string): string[] {
  // Extract all path parameter matches using regex
  const matches = url.match(PATH_PARAM_REGEX);
  if (!matches) {
    return [];
  }
  // Remove the curly braces from each matched parameter and return as array
  return matches.map(match => match.slice(1, -1));
}

/**
 * Replaces placeholders in the URL with path parameters.
 *
 * @param url - Path string containing placeholders, e.g., "http://localhost/users/{id}/posts/{postId}"
 * @param path - Path parameter object used to replace placeholders in the URL
 * @returns Path string with placeholders replaced
 * @throws Error when required path parameters are missing
 *
 * @example
 * ```typescript
 * const urlBuilder = new UrlBuilder('https://api.example.com');
 * const result = urlBuilder.interpolateUrl('/users/{id}/posts/{postId}', {
 *   path: { id: 123, postId: 456 }
 * });
 * // Result: https://api.example.com/users/123/posts/456
 * ```
 *
 * @example
 * ```typescript
 * // Missing required parameter throws an error
 * try {
 *   urlBuilder.interpolateUrl('/users/{id}', { name: 'John' });
 * } catch (error) {
 *   console.error(error.message); // "Missing required path parameter: id"
 * }
 * ```
 */
export function interpolateUrl(
  url: string,
  path?: Record<string, any> | null,
): string {
  if (!path) return url;
  return url.replace(PATH_PARAM_REGEX, (_, key) => {
    const value = path[key];
    // If path parameter is undefined, throw an error instead of preserving the placeholder
    if (value === undefined) {
      throw new Error(`Missing required path parameter: ${key}`);
    }
    return String(value);
  });
}
