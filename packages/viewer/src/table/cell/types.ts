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

import React from 'react';
import { AttributesCapable } from '../../types';

/**
 * Represents the data structure for a single table cell.
 *
 * This interface encapsulates all the information needed to render a cell,
 * including the value to display, the complete record for context, and
 * the row index for conditional rendering or styling.
 *
 * @template ValueType - The type of the cell value (e.g., string, number, Date).
 * @template RecordType - The type of the complete record object.
 * @interface CellData
 *
 * @property {ValueType} value - The value to display in the cell.
 * @property {RecordType} record - The full record object providing context for the cell.
 * @property {number} index - The zero-based index of the row in the table.
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const cellData: CellData<string, User> = {
 *   value: "john@example.com",
 *   record: { id: 1, name: "John", email: "john@example.com" },
 *   index: 0
 * };
 * ```
 */
export interface CellData<ValueType = any, RecordType = any> {
  /** The value to display in the cell. */
  value: ValueType;
  /** The full record object for context. */
  record: RecordType;
  /** The index of the row in the table. */
  index: number;
}

/**
 * Props for rendering a table cell component.
 *
 * This interface defines the standard props structure for all cell components,
 * combining cell data with optional attributes for customization. It extends
 * AttributesCapable to provide a consistent way to pass component-specific
 * attributes.
 *
 * @template ValueType - The type of the cell value (e.g., string, number, Date).
 * @template RecordType - The type of the record containing the cell data.
 * @template Attributes - The type of additional attributes passed to the cell component.
 * @interface CellProps
 * @extends AttributesCapable<Attributes>
 *
 * @property {CellData<ValueType, RecordType>} data - The cell data containing value, record, and index.
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 * }
 *
 * // Text cell props
 * const textCellProps: CellProps<string, User, TextProps> = {
 *   data: {
 *     value: "John Doe",
 *     record: { id: 1, name: "John Doe" },
 *     index: 0
 *   },
 *   attributes: { ellipsis: true }
 * };
 *
 * // Number cell props
 * const numberCellProps: CellProps<number, User, InputNumberProps> = {
 *   data: {
 *     value: 25,
 *     record: { id: 1, name: "John Doe" },
 *     index: 0
 *   },
 *   attributes: { min: 0, max: 100 }
 * };
 * ```
 */
export interface CellProps<ValueType = any, RecordType = any, Attributes = any>
  extends AttributesCapable<Attributes> {
  data: CellData<ValueType, RecordType>;
}

/**
 * A React component for rendering table cells.
 *
 * This type represents functional React components that can render table cells.
 * Cell components receive standardized props containing the cell data and
 * optional attributes, and return JSX elements for display in table rows.
 *
 * @template ValueType - The type of the cell value.
 * @template RecordType - The type of the record containing the cell data.
 * @template Attributes - The type of additional attributes for the component.
 * @typedef CellComponent
 * @type {React.FC<CellProps<ValueType, RecordType, Attributes>>}
 *
 * @example
 * ```tsx
 * // Text cell component
 * const TextCell: CellComponent<string, User, TextProps> = ({ data, attributes }) => {
 *   return <Typography.Text {...attributes}>{data.value}</Typography.Text>;
 * };
 *
 * // Number cell component
 * const NumberCell: CellComponent<number, Product, InputNumberProps> = ({ data, attributes }) => {
 *   return <InputNumber value={data.value} {...attributes} />;
 * };
 *
 * // Usage in table
 * const columns = [
 *   {
 *     title: 'Name',
 *     render: (value, record, index) => (
 *       <TextCell
 *         data={{ value, record, index }}
 *         attributes={{ ellipsis: true }}
 *       />
 *     )
 *   }
 * ];
 * ```
 */
export type CellComponent<
  ValueType = any,
  RecordType = any,
  Attributes = any,
> = React.FC<CellProps<ValueType, RecordType, Attributes>>;
