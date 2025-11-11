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
 * @template ValueType - The type of the cell value.
 * @template RecordType - The type of the record containing the cell data.
 * @template Attributes - The type of additional attributes passed to the cell.
 */
export interface CellProps<ValueType = any, RecordType = any, Attributes = any>
  extends AttributesCapable<Attributes> {
  data: CellData<ValueType, RecordType>;
}

/** A React component for rendering table cells. */
export type CellComponent<
  ValueType = any,
  RecordType = any,
  Attributes = any,
> = React.FC<CellProps<ValueType, RecordType, Attributes>>;
