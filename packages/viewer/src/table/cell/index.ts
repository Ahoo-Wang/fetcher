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
 * @module table/cell
 *
 * This module provides the core cell rendering system for tables, including:
 * - Cell component types and interfaces
 * - Text cell implementation
 * - Typed cell rendering utilities
 * - Cell registry for component management
 *
 * @example
 * ```tsx
 * import { TextCell, typedCellRender, TEXT_CELL_TYPE } from '@ahoo-wang/fetcher-viewer/table/cell';
 *
 * // Direct component usage
 * <TextCell
 *   data={{ value: 'Hello', record: { id: 1 }, index: 0 }}
 *   attributes={{ ellipsis: true }}
 * />
 *
 * // Using typed renderer
 * const renderer = typedCellRender(TEXT_CELL_TYPE, { ellipsis: true });
 * const cell = renderer('Hello', { id: 1 }, 0);
 * ```
 */

export * from './cellRegistry';
export * from './TextCell';
export * from './TypedCell';
export * from './types';
