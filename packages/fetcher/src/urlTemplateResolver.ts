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

export interface UrlTemplateResolver {

  /**
   * Extracts path parameters from the URL.
   * @param urlTemplate
   */
  extractPathParams(urlTemplate: string): string[];

  /**
   * Replaces placeholders in the URL with path parameters.
   * @param urlTemplate
   * @param pathParams
   */
  resolve(urlTemplate: string, pathParams?: Record<string, any> | null): string;

}

export function urlTemplateRegexResolve(urlTemplate: string, pathParamRegex: RegExp, pathParams?: Record<string, any> | null) {
  if (!pathParams) return urlTemplate;
  return urlTemplate.replace(pathParamRegex, (_, key) => {
    const value = pathParams[key];
    // If path parameter is undefined, throw an error instead of preserving the placeholder
    if (value === undefined) {
      throw new Error(`Missing required path parameter: ${key}`);
    }
    return encodeURIComponent(value);
  });
}

export function urlTemplateRegexExtract(urlTemplate: string, pathParamRegex: RegExp): string[] {
  const matches: string[] = [];
  let match;
  while ((match = pathParamRegex.exec(urlTemplate)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * https://www.rfc-editor.org/rfc/rfc6570.html
 */
export class UriTemplateResolver implements UrlTemplateResolver {
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
  private static PATH_PARAM_REGEX = /{([^}]+)}/g;

  /**
   * Extracts path parameters from a URL string.
   *
   * @param urlTemplate - The URL string to extract path parameters from
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
  extractPathParams(urlTemplate: string): string[] {
    return urlTemplateRegexExtract(urlTemplate, UriTemplateResolver.PATH_PARAM_REGEX);
  }

  /**
   * Replaces placeholders in the URL with path parameters.
   *
   * @param urlTemplate - Path string containing placeholders, e.g., "http://localhost/users/{id}/posts/{postId}"
   * @param pathParams - Path parameter object used to replace placeholders in the URL
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
  resolve(urlTemplate: string, pathParams?: Record<string, any> | null): string {
    return urlTemplateRegexResolve(urlTemplate, UriTemplateResolver.PATH_PARAM_REGEX, pathParams);
  }
}

export const uriTemplateResolver = new UriTemplateResolver();

export class ExpressUrlTemplateResolver implements UrlTemplateResolver {
  private static PATH_PARAM_REGEX = /:([^/]+)/g;

  extractPathParams(urlTemplate: string): string[] {
    return urlTemplateRegexExtract(urlTemplate, ExpressUrlTemplateResolver.PATH_PARAM_REGEX);
  }

  resolve(urlTemplate: string, pathParams?: Record<string, any> | null): string {
    return urlTemplateRegexResolve(urlTemplate, ExpressUrlTemplateResolver.PATH_PARAM_REGEX, pathParams);
  }
}

export const expressUrlTemplateResolver = new ExpressUrlTemplateResolver();