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

import { TypedComponentRegistry } from '../../registry';
import { CellType } from './TypedCell';
import { CellProps } from './types';
import { TEXT_CELL_TYPE, TextCell } from './TextCell';
import { TAG_CELL_TYPE, TagCell } from './TagCell';
import { TAGS_CELL_TYPE, TagsCell } from './TagsCell';
import { DATETIME_CELL_TYPE, DateTimeCell } from './DateTimeCell';
import { CALENDAR_CELL_TYPE, CalendarTimeCell } from './CalendarTime';
import { IMAGE_CELL_TYPE, ImageCell } from './ImageCell';
import { IMAGE_GROUP_CELL_TYPE, ImageGroupCell } from './ImageGroupCell';
import { LINK_CELL_TYPE, LinkCell } from './LinkCell';

/**
 * Registry for cell components, mapping cell types to their corresponding components.
 *
 * This registry instance manages the available cell component types for table rendering.
 * It is pre-initialized with the text cell component and can be extended with additional
 * cell types as needed. The registry provides type-safe component resolution for
 * dynamic cell rendering based on data types.
 *
 * @constant
 * @type {TypedComponentRegistry<CellType, CellProps>}
 *
 * @example
 * ```tsx
 * // Get a registered component
 * const TextCellComponent = cellRegistry.get('text');
 *
 * // Check if a type is registered
 * if (cellRegistry.has('number')) {
 *   // Use number cell
 * }
 *
 * // Register a custom cell type
 * cellRegistry.register('custom', CustomCellComponent);
 * ```
 *
 * @example
 * ```tsx
 * // Using with typedCellRender
 * import { typedCellRender } from './TypedCell';
 *
 * const renderer = typedCellRender('text', { ellipsis: true });
 * if (renderer) {
 *   const cell = renderer('Hello', { id: 1 }, 0);
 * }
 * ```
 */
export const cellRegistry = TypedComponentRegistry.create<CellType, CellProps>([
  [TEXT_CELL_TYPE, TextCell],
  [TAG_CELL_TYPE, TagCell],
  [TAGS_CELL_TYPE, TagsCell],
  [DATETIME_CELL_TYPE, DateTimeCell],
  [CALENDAR_CELL_TYPE, CalendarTimeCell],
  [IMAGE_CELL_TYPE, ImageCell],
  [IMAGE_GROUP_CELL_TYPE, ImageGroupCell],
  [LINK_CELL_TYPE, LinkCell],
]);
