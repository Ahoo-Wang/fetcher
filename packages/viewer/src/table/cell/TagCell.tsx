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

import { Tag, TagProps } from 'antd';
import { CellProps } from './types';


/**
 * Constant representing the type identifier for tag cells.
 *
 * This constant is used to register and identify tag cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for tag-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'tag'
 *
 * @example
 * ```tsx
 * import { typedCellRender, TAG_CELL_TYPE } from './table/cell';
 *
 * const tagRenderer = typedCellRender(TAG_CELL_TYPE, { color: 'blue' });
 * ```
 */
export const TAG_CELL_TYPE = 'tag';

/**
 * Props for the TagCell component, extending CellProps with string value type and TagProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface TagCellProps
 * @extends CellProps<string, RecordType, TagProps>
 *
 * @example
 * ```tsx
 * interface Product {
 *   id: number;
 *   name: string;
 *   category: string;
 * }
 *
 * const props: TagCellProps<Product> = {
 *   data: {
 *     value: "electronics",
 *     record: { id: 1, name: "Laptop", category: "electronics" },
 *     index: 0
 *   },
 *   attributes: { color: "blue" }
 * };
 * ```
 */
export interface TagCellProps<RecordType = any>
  extends CellProps<string, RecordType, TagProps> {
}

/**
 * Renders a tag cell using Ant Design's Tag component.
 *
 * This component displays a single string tag in table cells with support for
 * various tag formatting options provided by Ant Design's Tag. It allows
 * customization through attributes like color, closable, and other TagProps.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the tag cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The string tag to display in the cell.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes to pass to the Tag component.
 * @returns A React element representing the tag cell.
 *
 * @throws {Error} If the value is not a string.
 *
 * @example
 * ```tsx
 * <TagCell
 *   data={{
 *     value: "urgent",
 *     record: { id: 1, title: "Task", priority: "urgent" },
 *     index: 0
 *   }}
 *   attributes={{
 *     color: "red"
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript
 * interface Task {
 *   id: number;
 *   title: string;
 *   priority: string;
 * }
 *
 * <TagCell<Task>
 *   data={{
 *     value: "urgent",
 *     record: { id: 1, title: "Task", priority: "urgent" },
 *     index: 0
 *   }}
 *   attributes={{ color: "orange", closable: true }}
 * />
 * ```
 */
export function TagCell<RecordType = any>(props: TagCellProps<RecordType>) {
  const { data, attributes } = props;
  if (!data.value?.trim()) {
    return null;
  }

  return <Tag {...attributes}>{attributes?.children ?? data.value}</Tag>;
}
