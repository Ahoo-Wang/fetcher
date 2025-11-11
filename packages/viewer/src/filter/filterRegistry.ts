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

import { FilterProps } from './types';
import { TEXT_FILTER, TextFilter } from './TextFilter';
import { ID_FILTER, IdFilter } from './IdFilter';
import { NUMBER_FILTER, NumberFilter } from './NumberFilter';
import { FilterType } from './TypedFilter';
import { SELECT_FILTER, SelectFilter } from './SelectFilter';
import { BOOL_FILTER, BoolFilter } from './BoolFilter';
import { DATE_TIME_FILTER_NAME, DateTimeFilter } from './DateTimeFilter';
import { TypedComponentRegistry } from '../registry';

/**
 * A centralized registry containing all available filter components for the viewer package.
 *
 * This registry provides a mapping from filter type identifiers to their corresponding React components,
 * enabling dynamic filter component resolution based on filter types. It includes all standard filter
 * types supported by the viewer: ID, text, number, select, boolean, and date-time filters.
 *
 * The registry is pre-populated with all built-in filter components and can be used to retrieve
 * filter components by their type names for rendering in filter interfaces.
 *
 * @example
 * ```typescript
 * import { filterRegistry } from './filterRegistry';
 *
 * // Get a text filter component
 * const TextFilterComponent = filterRegistry.get('text');
 *
 * // Check if a filter type is available
 * if (filterRegistry.has('number')) {
 *   const NumberFilterComponent = filterRegistry.get('number');
 *   // Render the component
 * }
 *
 * // Get all available filter types
 * const availableTypes = filterRegistry.types; // ['id', 'text', 'number', 'select', 'bool', 'dateTime']
 * ```
 *
 * @example
 * ```typescript
 * // Using in a React component
 * import React from 'react';
 * import { filterRegistry } from './filterRegistry';
 *
 * interface FilterRendererProps {
 *   filterType: string;
 *   filterProps: FilterProps;
 * }
 *
 * const FilterRenderer: React.FC<FilterRendererProps> = ({ filterType, filterProps }) => {
 *   const FilterComponent = filterRegistry.get(filterType);
 *
 *   if (!FilterComponent) {
 *     return <div>Unknown filter type: {filterType}</div>;
 *   }
 *
 *   return <FilterComponent {...filterProps} />;
 * };
 * ```
 */
export const filterRegistry = TypedComponentRegistry.create<
  FilterType,
  FilterProps
>([
  [ID_FILTER, IdFilter],
  [TEXT_FILTER, TextFilter],
  [NUMBER_FILTER, NumberFilter],
  [SELECT_FILTER, SelectFilter],
  [BOOL_FILTER, BoolFilter],
  [DATE_TIME_FILTER_NAME, DateTimeFilter],
]);
