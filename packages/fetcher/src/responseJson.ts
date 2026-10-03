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

// Type-only module: it widens the global `Response.json` for every consumer
// of this package.
export {};

/**
 * Global extension of the native Response interface.
 *
 * This declaration augments the standard Web API Response interface to provide
 * enhanced type safety for JSON parsing operations. The extended json() method
 * allows specifying the expected return type, enabling better TypeScript
 * inference and compile-time type checking.
 *
 * @interface Response
 */
declare global {
  interface Response {
    /**
     * Parses the response body as JSON with type safety.
     *
     * This method extends the native Response.json() method to support generic
     * type parameters, allowing developers to specify the expected shape of
     * the parsed JSON data. This provides compile-time type checking and
     * better IDE support.
     *
     * @template T - The expected type of the parsed JSON data. Defaults to 'any' for backward compatibility.
     * @returns {Promise<T>} A promise that resolves to the parsed JSON data of type T.
     *
     * @throws {SyntaxError} If the response body is not valid JSON.
     * @throws {TypeError} If the response has no body or the body cannot be parsed.
     *
     * @example
     * interface User {
     *   id: number;
     *   name: string;
     *   email: string;
     * }
     *
     * const response = await fetch('/api/user/123');
     * const user: User = await response.json<User>();
     * console.log(user.name); // TypeScript knows this is a string
     *
     * @example
     * // Without type parameter (defaults to any)
     * const data = await response.json();
     * // data is of type 'any'
     *
     * @example
     * // Error handling
     * try {
     *   const result = await response.json<{ success: boolean; data: string[] }>();
     *   if (result.success) {
     *     result.data.forEach(item => console.log(item));
     *   }
     * } catch (error) {
     *   console.error('Failed to parse JSON:', error);
     * }
     */
    json<T = any>(): Promise<T>;
  }
}
