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

import type {
  DeletionState,
  FilterExpression,
  FilterLiteral,
  FilterOperator,
  SearchMode,
  StringComparison,
  TimeUnit,
} from '@ahoo-wang/fetcher-wow';
import type { FilterField } from './filterTypes.js';

export type FilterMode = 'simple' | 'advanced';
export type FilterFieldType =
  'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'array';
export type FilterJsonValue =
  | null
  | string
  | number
  | boolean
  | FilterJsonValue[]
  | { [key: string]: FilterJsonValue };
export interface FilterEditorReference {
  name: string;
  options?: Readonly<Record<string, FilterJsonValue>>;
}
export interface FilterFieldDefinition extends FilterField {
  type?: FilterFieldType;
  options?: readonly {
    value: Exclude<FilterLiteral, null>;
    label: string;
    disabled?: boolean;
  }[];
  fields?: readonly FilterFieldDefinition[];
  operators?: readonly FilterOperator[];
  editor?: FilterEditorReference;
  timeZone?: string;
}
export interface FilterDateTimeValue {
  date?: string;
  time?: string;
  /** Date.getTimezoneOffset() integer minutes; retained only when valid for the edited local time. */
  offsetMinutes?: number;
}
/** Keeps an item's intended type while its raw text is temporarily incomplete. */
export interface FilterScalarDraftValue {
  type: 'string' | 'number' | 'boolean';
  value: unknown;
}
/** Transient editor state. Compile before sending a query; never persist this as a Wow expression. */
export interface FilterDraftNode {
  id: string;
  op: FilterOperator;
  field?: string;
  value?: unknown;
  values?: unknown[];
  lowerBound?: unknown;
  upperBound?: unknown;
  operands?: FilterDraftNode[];
  predicate?: FilterDraftNode;
  query?: string;
  fields?: string[];
  mode?: SearchMode;
  state?: DeletionState;
  time?: string;
  days?: number | string;
  stringComparison?: StringComparison;
  zoneId?: string;
  datePattern?: string;
  timeUnit?: TimeUnit;
}
export interface FilterOperatorDefinition {
  label: string;
  category: 'logical' | 'element' | 'field' | 'root';
  input:
    | 'none'
    | 'value'
    | 'values'
    | 'between'
    | 'search'
    | 'deletion'
    | 'time'
    | 'days';
  relativeTime?: boolean;
}
export interface FilterValidationError {
  id: string;
  message: string;
}
export interface FilterCompileResult {
  expression?: FilterExpression;
  errors: FilterValidationError[];
}
