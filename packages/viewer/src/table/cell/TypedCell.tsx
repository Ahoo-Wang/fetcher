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
import type * as React from 'react';
import { CellData } from './types';

/**
 * Represents the type identifier for different cell components.
 */
export type CellType = string;

/**
 * A function type for rendering typed cells, supporting both synchronous and asynchronous rendering.
 * @template RecordType - The type of the record containing the cell data.
 * @param value - The value to render in the cell.
 * @param record - The full record object for context.
 * @param index - The index of the row in the table.
 * @returns A React node or a promise resolving to a React node.
 */
export type CellRenderer<RecordType = any> = (
  value: any,
  record: RecordType,
  index: number,
) => React.ReactNode | Promise<React.ReactNode>;

/**
 * Creates a typed cell renderer function for a given cell type.
 * @template RecordType - The type of the record containing the cell data.
 * @template Attributes - The type of additional attributes for the cell.
 * @param type - The cell type identifier to look up in the registry.
 * @param attributes - Optional attributes to pass to the cell component.
 * @returns A renderer function for the specified cell type.
 * @throws Error if the cell type is not registered in the registry.
 * @example
 * ```tsx
 * const renderer = typedCellRender('text', { ellipsis: true });
 * const cell = renderer('Hello', { id: 1 }, 0);
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
    return CellComponent({
      attributes,
      data,
    });
  };
}
