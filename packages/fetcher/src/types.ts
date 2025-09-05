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
 * Creates a new type by making specified properties of an existing type optional.
 *
 * This utility type takes a type T and a set of keys K (which must be keys of T),
 * and produces a new type where:
 * - Properties not in K remain required and unchanged
 * - Properties in K become optional (partial)
 *
 * @template T - The original type to modify
 * @template K - The keys of T that should become optional
 * @returns A new type with specified properties made optional
 *
 * @example
 * type User = { id: number; name: string; email: string; };
 * type UserWithOptionalEmail = PartialBy<User, 'email'>;
 * // Result: { id: number; name: string; email?: string; }
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Creates a new type by making specified properties of an existing type required.
 *
 * This utility type takes a type T and a set of keys K (which must be keys of T),
 * and produces a new type where:
 * - Properties not in K remain unchanged
 * - Properties in K become required
 *
 * @template T - The original type to modify
 * @template K - The keys of T that should become required
 * @returns A new type with specified properties made required
 *
 * @example
 * type User = { id: number; name?: string; email?: string; };
 * type UserWithRequiredNameAndEmail = RequiredBy<User, 'name' | 'email'>;
 * // Result: { id: number; name: string; email: string; }
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Interface representing a named capable entity
 * Types implementing this interface must provide a name property
 */
export interface NamedCapable {
  /**
   * The name of the entity
   */
  name: string;
}

/**
 * Global extension of Response interface
 * Adds type-safe json() method support to Response objects
 */
declare global {
  interface Response {
    /**
     * Parse response body as JSON in a type-safe manner
     * @template T The type of returned data, defaults to any
     * @returns Promise<T> The parsed JSON data
     */
    json<T = any>(): Promise<T>;
  }
}
