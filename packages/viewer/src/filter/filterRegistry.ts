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

import { FilterComponent } from './types';
import { TEXT_FILTER, TextFilter } from './TextFilter';
import { ID_FILTER, IdFilter } from './IdFilter';

/**
 * Registry for managing condition filter components.
 *
 * Provides a centralized way to register, unregister, and retrieve
 * condition filter components by their type identifiers.
 */
export class FilterRegistry {
  private readonly filters: Map<string, FilterComponent> = new Map<
    string,
    FilterComponent
  >();

  constructor() {
    this.register(ID_FILTER, IdFilter);
    this.register(TEXT_FILTER, TextFilter);
  }

  /**
   * Registers a condition filter component for a specific type.
   *
   * @param type - The unique identifier for the filter type
   * @param filter - The condition filter component to register
   *
   * @example
   * ```typescript
   * const registry = new ConditionFilterRegistry();
   * registry.register('text', TextConditionFilter);
   * ```
   */
  register(type: string, filter: FilterComponent) {
    this.filters.set(type, filter);
  }

  /**
   * Unregisters a condition filter component for a specific type.
   *
   * @param type - The unique identifier for the filter type to remove
   * @returns true if the filter was successfully removed, false otherwise
   *
   * @example
   * ```typescript
   * const registry = new ConditionFilterRegistry();
   * const wasRemoved = registry.unregister('text');
   * ```
   */
  unregister(type: string) {
    return this.filters.delete(type);
  }

  /**
   * Retrieves a condition filter component for a specific type.
   *
   * @param type - The unique identifier for the filter type
   * @returns The condition filter component, or undefined if not found
   *
   * @example
   * ```typescript
   * const registry = new ConditionFilterRegistry();
   * const TextFilter = registry.get('text');
   * ```
   */
  get(type: string): FilterComponent | undefined {
    return this.filters.get(type);
  }
}

export const filterRegistry = new FilterRegistry();
