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

import { cellRegistry } from './cellRegistry';
import React from 'react';
import { CellData } from './types';

/**
 * Represents the type identifier for different cell components.
 *
 * Cell types are string identifiers used to register and retrieve
 * specific cell rendering components from the cell registry.
 * Common types include 'text', 'number', 'date', etc.
 *
 * @example
 * ```tsx
 * const textType: CellType = 'text';
 * const customType: CellType = 'custom-cell';
 * ```
 */
export type CellType = string;

/**
 * A function type for rendering typed cells, supporting both synchronous and asynchronous rendering.
 *
 * Cell renderers are functions that take cell data and return React nodes
 * for display in table cells. They can be synchronous for immediate rendering
 * or asynchronous for cases requiring data fetching or complex computations.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param value - The value to render in the cell. Can be any type depending on the cell implementation.
 * @param record - The full record object providing context for the cell rendering.
 * @param index - The zero-based index of the row in the table.
 * @returns A React node for synchronous rendering, or a Promise resolving to a React node for asynchronous rendering.
 *
 * @example
 * ```tsx
 * // Synchronous renderer
 * const textRenderer: CellRenderer<User> = (value, record, index) => {
 *   return <span>{String(value)}</span>;
 * };
 *
 * // Asynchronous renderer
 * const asyncRenderer: CellRenderer<User> = async (value, record, index) => {
 *   const formatted = await formatValue(value);
 *   return <span>{formatted}</span>;
 * };
 * ```
 */
export type CellRenderer<RecordType = any> = (
  value: any,
  record: RecordType,
  index: number,
) => React.ReactNode;

/**
 * Creates a typed cell renderer function for a given cell type.
 *
 * This function retrieves a cell component from the registry based on the
 * provided type and returns a renderer function that can be used to render
 * cells of that type. The returned renderer encapsulates the component and
 * its attributes for repeated use.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @template Attributes - The type of additional attributes for the cell component.
 * @param type - The cell type identifier to look up in the registry (e.g., 'text', 'number').
 * @param attributes - Optional attributes object to pass to the cell component for customization.
 * @returns A renderer function for the specified cell type, or undefined if the type is not registered.
 *
 * @throws {Error} This function itself doesn't throw, but the returned renderer may throw
 *                 if the underlying component encounters rendering errors.
 *
 * @example
 * ```tsx
 * // Create a text renderer with ellipsis
 * const textRenderer = typedCellRender('text', { ellipsis: true });
 *
 * // Use the renderer to create cells
 * const cell1 = textRenderer('Hello World', { id: 1 }, 0);
 * const cell2 = textRenderer('Long text...', { id: 2 }, 1);
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript types
 * interface User {
 *   id: number;
 *   name: string;
 * }
 *
 * const userNameRenderer = typedCellRender<User>('text', {
 *   style: { fontWeight: 'bold' }
 * });
 *
 * const cell = userNameRenderer('John Doe', { id: 1, name: 'John Doe' }, 0);
 * ```
 *
 * @example
 * ```tsx
 * // Handling unregistered types
 * const unknownRenderer = typedCellRender('unknown-type');
 * if (!unknownRenderer) {
 *   console.warn('Unknown cell type');
 * }
 * ```
 */
export function typedCellRender<RecordType = any, Attributes = any>(
  type: CellType,
  attributes?: Attributes,
): CellRenderer<RecordType> | undefined {
  const CellComponent = cellRegistry.get(type);
  if (!CellComponent) {
    return undefined;
  }
  return (value: any, record: RecordType, index: number) => {
    const data: CellData = {
      value,
      record,
      index,
    };

    return React.createElement(CellComponent, {
      attributes,
      data,
    });
  };
}
