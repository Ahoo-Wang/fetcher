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
 * Creates a new type by removing all readonly properties from an existing type.
 *
 * This utility type takes a type T and produces a new type that excludes all properties
 * that are marked as readonly in the original type. This is useful when you need to create
 * a mutable version of an interface or when working with data that should be modifiable.
 *
 * @template T - The original type from which to remove readonly properties
 * @returns A new type containing only the mutable (non-readonly) properties of T
 *
 * @example
 * interface User {
 *   readonly id: number;
 *   name: string;
 *   readonly createdAt: Date;
 *   email: string;
 * }
 *
 * type MutableUser = RemoveReadonlyFields<User>;
 * // Result: { name: string; email: string; }
 * // 'id' and 'createdAt' are excluded because they are readonly
 *
 * @example
 * // Usage in function parameters
 * function updateUser(user: RemoveReadonlyFields<User>) {
 *   // user.id and user.createdAt are not available here
 *   user.name = 'New Name'; // OK
 *   user.email = 'new@email.com'; // OK
 * }
 */
export type RemoveReadonlyFields<T> = {
  [
    K in keyof T as Equal<Pick<T, K>, Readonly<Pick<T, K>>> extends true
      ? never
      : K
  ]: T[K];
};

/**
 * Utility type to check if two types X and Y are exactly equal.
 *
 * This type uses conditional types and function type inference to determine
 * strict type equality. It returns true if X and Y are identical types,
 * false otherwise. This is particularly useful in mapped types for filtering
 * based on type properties.
 *
 * @template X - First type to compare
 * @template Y - Second type to compare
 * @returns true if X and Y are the same type, false otherwise
 *
 * @internal This is an internal utility type used by other type definitions
 */
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

/**
 * Interface representing a named capable entity.
 *
 * This interface defines a contract for objects that have an identifiable name.
 * Any type implementing this interface must provide a string property called 'name'
 * that uniquely identifies the entity within its context.
 *
 * @interface NamedCapable
 *
 * @property {string} name - A unique identifier for the entity, used for
 *   identification, logging, and user-facing display purposes.
 *
 * @example
 * class Service implements NamedCapable {
 *   name = 'UserService';
 *
 *   async getUser(id: number) {
 *     // Implementation
 *   }
 * }
 *
 * @example
 * const services: NamedCapable[] = [
 *   { name: 'AuthService' },
 *   { name: 'DataService' }
 * ];
 *
 * services.forEach(service => {
 *   console.log(`Initializing ${service.name}`);
 * });
 */
export interface NamedCapable {
  /**
   * The name of the entity.
   *
   * This property serves as a unique identifier for the implementing object.
   * It should be descriptive and follow consistent naming conventions
   * within the application context.
   */
  name: string;
}
