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
 * Interface for resolving URL templates by extracting path parameters and replacing placeholders.
 *
 * This interface provides methods to work with URL templates that contain parameter placeholders.
 * It supports extracting parameter names from templates and replacing placeholders with actual values.
 *
 * @example
 * ```typescript
 * // Example usage of UrlTemplateResolver
 * const resolver: UrlTemplateResolver = new UriTemplateResolver();
 *
 * // Extract path parameters
 * const params = resolver.extractPathParams('/users/{id}/posts/{postId}');
 * // params = ['id', 'postId']
 *
 * // Resolve URL template with parameters
 * const url = resolver.resolve('/users/{id}/posts/{postId}', { id: 123, postId: 456 });
 * // url = '/users/123/posts/456'
 * ```
 */
export interface UrlTemplateResolver {

  /**
   * Extracts path parameters from the URL.
   * @param urlTemplate - The URL template string containing parameter placeholders
   * @returns An array of parameter names extracted from the URL template
   *
   * @example
   * ```typescript
   * const resolver: UrlTemplateResolver = uriTemplateResolver;
   * const params = resolver.extractPathParams('/users/{id}/posts/{postId}');
   * // params = ['id', 'postId']
   *
   * const noParams = resolver.extractPathParams('/users/profile');
   * // noParams = []
   * ```
   */
  extractPathParams(urlTemplate: string): string[];

  /**
   * Replaces placeholders in the URL with path parameters.
   * @param urlTemplate - The URL template string containing parameter placeholders
   * @param pathParams - Object containing parameter values to replace placeholders
   * @returns The URL with placeholders replaced by actual values
   *
   * @example
   * ```typescript
   * const resolver: UrlTemplateResolver = uriTemplateResolver;
   * const url = resolver.resolve('/users/{id}/posts/{postId}', { id: 123, postId: 456 });
   * // url = '/users/123/posts/456'
   *
   * // With Express-style resolver
   * const expressResolver: UrlTemplateResolver = new ExpressUrlTemplateResolver();
   * const expressUrl = expressResolver.resolve('/users/:id/posts/:postId', { id: 123, postId: 456 });
   * // expressUrl = '/users/123/posts/456'
   * ```
   *
   * @throws Error when required path parameters are missing
   * @example
   * ```typescript
   * const resolver: UrlTemplateResolver = uriTemplateResolver;
   * try {
   *   resolver.resolve('/users/{id}', { name: 'John' });
   * } catch (error) {
   *   console.error(error.message); // "Missing required path parameter: id"
   * }
   * ```
   */
  resolve(urlTemplate: string, pathParams?: Record<string, any> | null): string;

}

/**
 * Replaces placeholders in a URL template with actual parameter values.
 *
 * @param urlTemplate - The URL template string containing parameter placeholders
 * @param pathParamRegex - Regular expression to match parameter placeholders
 * @param pathParams - Object containing parameter values to replace placeholders
 * @returns The URL with placeholders replaced by actual values
 * @throws Error when required path parameters are missing
 */
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

/**
 * Extracts parameter names from a URL template using a regular expression.
 *
 * @param urlTemplate - The URL template string containing parameter placeholders
 * @param pathParamRegex - Regular expression to match parameter placeholders
 * @returns An array of parameter names extracted from the URL template
 */
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
 *
 * Implementation of URI Template resolution following RFC 6570 specification.
 * Handles URI templates with parameters enclosed in curly braces like {paramName}.
 *
 * @example
 * ```typescript
 * const resolver = uriTemplateResolver;
 *
 * // Extract path parameters
 * const params = resolver.extractPathParams('/users/{id}/posts/{postId}');
 * // params = ['id', 'postId']
 *
 * // Resolve URL template with parameters
 * const url = resolver.resolve('/users/{id}/posts/{postId}', { id: 123, postId: 456 });
 * // url = '/users/123/posts/456'
 * ```
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
   * const resolver = uriTemplateResolver;
   *
   * // Extract multiple parameters
   * const params = resolver.extractPathParams('/users/{id}/posts/{postId}');
   * // params = ['id', 'postId']
   *
   * // Extract parameters from full URLs
   * const urlParams = resolver.extractPathParams('https://api.example.com/{resource}/{id}');
   * // urlParams = ['resource', 'id']
   *
   * // No parameters
   * const noParams = resolver.extractPathParams('/users/profile');
   * // noParams = []
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
   * const resolver = uriTemplateResolver;
   *
   * // Replace parameters
   * const url = resolver.resolve('/users/{id}/posts/{postId}', { id: 123, postId: 456 });
   * // url = '/users/123/posts/456'
   *
   * // Handle string parameter values
   * const stringUrl = resolver.resolve('/users/{username}', { username: 'john_doe' });
   * // stringUrl = '/users/john_doe'
   *
   * // URL encode parameter values
   * const encodedUrl = resolver.resolve('/search/{query}', { query: 'hello world' });
   * // encodedUrl = '/search/hello%20world'
   * ```
   * 
   * @example
   * ```typescript
   * // Missing required parameter throws an error
   * const resolver = uriTemplateResolver;
   * try {
   *   resolver.resolve('/users/{id}', { name: 'John' });
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

/**
 * Express-style URL template resolver.
 * Handles URI templates with parameters in the format :paramName.
 *
 * @example
 * ```typescript
 * const resolver = expressUrlTemplateResolver;
 *
 * // Extract path parameters
 * const params = resolver.extractPathParams('/users/:id/posts/:postId');
 * // params = ['id', 'postId']
 *
 * // Resolve URL template with parameters
 * const url = resolver.resolve('/users/:id/posts/:postId', { id: 123, postId: 456 });
 * // url = '/users/123/posts/456'
 * ```
 */
export class ExpressUrlTemplateResolver implements UrlTemplateResolver {
  /**
   * Regular expression pattern to match Express-style path parameters in the format :paramName
   */
  private static PATH_PARAM_REGEX = /:([^/]+)/g;

  /**
   * Extracts path parameters from an Express-style URL string.
   *
   * @param urlTemplate - The URL string with Express-style parameter placeholders
   * @returns An array of parameter names extracted from the URL template
   *
   * @example
   * ```typescript
   * const resolver = new expressUrlTemplateResolver;
   *
   * // Extract multiple parameters
   * const params = resolver.extractPathParams('/users/:id/posts/:postId');
   * // params = ['id', 'postId']
   *
   * // No parameters
   * const noParams = resolver.extractPathParams('/users/profile');
   * // noParams = []
   * ```
   */
  extractPathParams(urlTemplate: string): string[] {
    return urlTemplateRegexExtract(urlTemplate, ExpressUrlTemplateResolver.PATH_PARAM_REGEX);
  }

  /**
   * Replaces Express-style placeholders in the URL with path parameters.
   *
   * @param urlTemplate - Path string containing Express-style placeholders
   * @param pathParams - Object containing parameter values to replace placeholders
   * @returns Path string with placeholders replaced
   * @throws Error when required path parameters are missing
   *
   * @example
   * ```typescript
   * const resolver = expressUrlTemplateResolver;
   *
   * // Replace parameters
   * const url = resolver.resolve('/users/:id/posts/:postId', { id: 123, postId: 456 });
   * // url = '/users/123/posts/456'
   *
   * // Handle string parameter values
   * const stringUrl = resolver.resolve('/users/:username', { username: 'john_doe' });
   * // stringUrl = '/users/john_doe'
   * ```
   *
   * @example
   * ```typescript
   * // Missing required parameter throws an error
   * const resolver = expressUrlTemplateResolver;
   * try {
   *   resolver.resolve('/users/:id', { name: 'John' });
   * } catch (error) {
   *   console.error(error.message); // "Missing required path parameter: id"
   * }
   * ```
   */
  resolve(urlTemplate: string, pathParams?: Record<string, any> | null): string {
    return urlTemplateRegexResolve(urlTemplate, ExpressUrlTemplateResolver.PATH_PARAM_REGEX, pathParams);
  }
}

export const expressUrlTemplateResolver = new ExpressUrlTemplateResolver();