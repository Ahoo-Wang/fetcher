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

import { FunctionComponent } from 'react';

/**
 * Interface for objects that have a type property.
 * This is used to identify components or other typed entities in the registry.
 *
 * @template Type - The type of the type property, defaults to string.
 */
export interface TypeCapable<Type = string> {
  /**
   * The type identifier for this object.
   */
  type: Type;
}

/**
 * A registry class for storing and retrieving React components by type.
 * This allows dynamic component resolution based on type identifiers, useful for
 * rendering different components based on data types or configurations.
 *
 * @template Type - The type used as keys in the registry (e.g., string, number).
 * @template Props - The props type that all registered components must accept.
 */
export class TypedComponentRegistry<Type, Props> {
  private readonly registry: Map<Type, FunctionComponent<Props>> = new Map();

  /**
   * Gets an array of all registered types in the registry.
   *
   * @returns An array containing all type keys currently registered.
   */
  get types(): Type[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Gets an array of all type-component pairs in the registry.
   *
   * @returns An array of tuples containing [type, component] pairs.
   */
  get entries(): [Type, FunctionComponent<Props>][] {
    return Array.from(this.registry.entries());
  }

  /**
   * Gets the number of registered components in the registry.
   *
   * @returns The total count of registered components.
   */
  get size(): number {
    return this.registry.size;
  }

  /**
   * Checks if a component is registered for the given type.
   *
   * @param {Type} type - The type to check for registration.
   * @returns {boolean} True if a component is registered for the type, false otherwise.
   */
  has(type: Type): boolean {
    return this.registry.has(type);
  }

  /**
   * Removes all registered components from the registry.
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * Registers a React component for a specific type.
   * Each type can only have one component registered.
   *
   * @param {Type} type - The type identifier for the component.
   * @param {FunctionComponent<Props>} component - The React functional component to register.
   * @throws {Error} If a component is already registered for the given type.
   *
   * @example
   * ```typescript
   * const registry = new TypedComponentRegistry<string, { value: string }>();
   * registry.register('text', ({ value }) => <span>{value}</span>);
   * ```
   */
  register(type: Type, component: FunctionComponent<Props>): void {
    if (this.registry.has(type)) {
      throw new Error(`Component for type ${type} already registered.`);
    }
    this.registry.set(type, component);
  }

  /**
   * Unregisters the component for the given type.
   * If no component is registered for the type, this operation does nothing.
   *
   * @param {Type} type - The type identifier to unregister.
   */
  unregister(type: Type): void {
    this.registry.delete(type);
  }

  /**
   * Retrieves the component registered for the given type.
   *
   * @param {Type} type - The type identifier to look up.
   * @returns {FunctionComponent<Props> | undefined} The registered React component, or undefined if not found.
   */
  get(type: Type): FunctionComponent<Props> | undefined {
    return this.registry.get(type);
  }

  /**
   * Creates a new TypedComponentRegistry instance and optionally registers initial components.
   *
   * @template Type - The type used as keys.
   * @template Props - The props type for components.
   * @param {Array<[Type, FunctionComponent<Props>]>} [components=[]] - An optional array of [type, component] pairs to register initially.
   * @returns {TypedComponentRegistry<Type, Props>} A new TypedComponentRegistry instance with the specified components registered.
   *
   * @example
   * ```typescript
   * const registry = TypedComponentRegistry.create([
   *   ['text', ({ value }) => <span>{value}</span>],
   *   ['number', ({ value }) => <strong>{value}</strong>]
   * ]);
   * ```
   */
  static create<Type, Props>(
    components: [Type, FunctionComponent<Props>][] = [],
  ): TypedComponentRegistry<Type, Props> {
    const registry = new TypedComponentRegistry<Type, Props>();
    components.forEach(([type, component]) =>
      registry.register(type, component),
    );
    return registry;
  }
}
