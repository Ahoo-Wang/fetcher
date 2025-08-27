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
import { BaseURLCapable, FetchRequest } from './fetchRequest';

/**
 * Container for URL parameters including path and query parameters.
 *
 * Used to define dynamic parts of a URL including path placeholders and query string parameters.
 */
export interface UrlParams {
  /**
   * Path parameter object used to replace placeholders in the URL (e.g., {id}).
   *
   * These parameters are used to substitute named placeholders in the URL path.
   *
   * @example
   * ```typescript
   * // For URL template '/users/{id}/posts/{postId}'
   * const path = { id: 123, postId: 456 };
   * ```
   */
  path?: Record<string, any>;

  /**
   * Query parameter object to be added to the URL query string.
   *
   * These parameters are appended to the URL as a query string.
   *
   * @example
   * ```typescript
   * const query = { filter: 'active', page: 1, limit: 10 };
   * // Results in query string: ?filter=active&page=1&limit=10
   * ```
   */
  query?: Record<string, any>;
}

/**
 * Utility class for constructing complete URLs with path parameters and query parameters.
 *
 * Handles URL composition, path parameter interpolation, and query string generation.
 * Combines a base URL with a path, replaces path placeholders with actual values, and appends
 * query parameters to create a complete URL.
 *
 * @example
 * ```typescript
 * const urlBuilder = new UrlBuilder('https://api.example.com');
 * const url = urlBuilder.build('/users/{id}', {
 *   path: { id: 123 },
 *   query: { filter: 'active' }
 * });
 * // Result: https://api.example.com/users/123?filter=active
 * ```
 */
export class UrlBuilder implements BaseURLCapable {
  /**
   * Base URL that all constructed URLs will be based on.
   *
   * This is typically the root of your API endpoint (e.g., 'https://api.example.com').
   */
  readonly baseURL: string;

  /**
   * Initializes a new UrlBuilder instance.
   *
   * @param baseURL - Base URL that all constructed URLs will be based on
   *
   * @example
   * ```typescript
   * const urlBuilder = new UrlBuilder('https://api.example.com');
   * ```
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Builds a complete URL, including path parameter replacement and query parameter addition.
   *
   * @param url - URL path to build (e.g., '/users/{id}/posts')
   * @param params - URL parameters including path and query parameters
   * @returns Complete URL string with base URL, path parameters interpolated, and query string appended
   * @throws Error when required path parameters are missing
   *
   * @example
   * ```typescript
   * const urlBuilder = new UrlBuilder('https://api.example.com');
   * const url = urlBuilder.build('/users/{id}/posts/{postId}', {
   *   path: { id: 123, postId: 456 },
   *   query: { filter: 'active', limit: 10 }
   * });
   * // Result: https://api.example.com/users/123/posts/456?filter=active&limit=10
   * ```
   */
  build(url: string, params?: UrlParams): string {
    const path = params?.path;
    const query = params?.query;
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
   * Resolves a complete URL from a FetchRequest.
   *
   * Used internally by the Fetcher to build the final URL for a request
   * by combining the request URL with its URL parameters using this UrlBuilder.
   *
   * @param request - The FetchRequest containing URL and URL parameters
   * @returns Complete resolved URL string
   */
  resolveRequestUrl(request: FetchRequest): string {
    return this.build(request.url, request.urlParams);
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
  interpolateUrl(url: string, path?: Record<string, any> | null): string {
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

/**
 * Interface for objects that have a UrlBuilder capability.
 *
 * Indicates that an object has a UrlBuilder instance for URL construction.
 */
export interface UrlBuilderCapable {
  /**
   * The UrlBuilder instance.
   */
  urlBuilder: UrlBuilder;
}
