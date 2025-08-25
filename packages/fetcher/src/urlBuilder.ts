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

import { combineURLs } from './urls';
import { BaseURLCapable } from './types';

/**
 * UrlBuilder Class
 *
 * URL builder class for constructing complete URLs with path parameters and query parameters.
 * This class handles URL composition, path parameter interpolation, and query string generation.
 *
 * @example
 * ```typescript
 * const urlBuilder = new UrlBuilder('https://api.example.com');
 * const url = urlBuilder.build('/users/{id}', { id: 123 }, { filter: 'active' });
 * // Result: https://api.example.com/users/123?filter=active
 * ```
 */
export class UrlBuilder implements BaseURLCapable {
  /**
   * Base URL that all constructed URLs will be based on
   */
  baseURL: string;

  /**
   * Creates a UrlBuilder instance
   *
   * @param baseURL - Base URL that all constructed URLs will be based on
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Builds a complete URL, including path parameter replacement and query parameter addition
   *
   * @param url - URL path to build
   * @param path - Path parameter object used to replace placeholders in the URL (e.g., {id})
   * @param query - Query parameter object to be added to the URL query string
   * @returns Complete URL string
   * @throws Error when required path parameters are missing
   *
   * @example
   * ```typescript
   * const urlBuilder = new UrlBuilder('https://api.example.com');
   * const url = urlBuilder.build('/users/{id}/posts/{postId}',
   *   { id: 123, postId: 456 },
   *   { filter: 'active', limit: 10 }
   * );
   * // Result: https://api.example.com/users/123/posts/456?filter=active&limit=10
   * ```
   */
  build(
    url: string,
    path?: Record<string, any>,
    query?: Record<string, any>,
  ): string {
    const combinedURL = combineURLs(this.baseURL, url);
    let finalUrl = this.interpolateUrl(combinedURL, path);
    if (query) {
      const queryString = new URLSearchParams(query).toString();
      if (queryString) {
        finalUrl += '?' + queryString;
      }
    }
    return finalUrl;
  }

  /**
   * Replaces placeholders in the URL with path parameters
   *
   * @param url - Path string containing placeholders, e.g., "http://localhost/users/{id}/posts/{postId}"
   * @param path - Path parameter object used to replace placeholders in the URL
   * @returns Path string with placeholders replaced
   * @throws Error when required path parameters are missing
   *
   * @example
   * ```typescript
   * const urlBuilder = new UrlBuilder('https://api.example.com');
   * const result = urlBuilder.interpolateUrl('/users/{id}/posts/{postId}', { id: 123, postId: 456 });
   * // Result: /users/123/posts/456
   * ```
   */
  interpolateUrl(url: string, path?: Record<string, any>): string {
    if (!path) return url;
    return url.replace(/{([^}]+)}/g, (_, key) => {
      const value = path[key];
      // If path parameter is undefined, throw an error instead of preserving the placeholder
      if (value === undefined) {
        throw new Error(`Missing required path parameter: ${key}`);
      }
      return String(value);
    });
  }
}
