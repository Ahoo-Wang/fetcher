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

import { CellProps } from './types';
import { Space, TagProps } from 'antd';
import { TagCell } from './TagCell';

/**
 * Constant representing the type identifier for tags cells.
 *
 * This constant is used to register and identify tags cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for tags-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'tags'
 *
 * @example
 * ```tsx
 * import { typedCellRender, TAGS_CELL_TYPE } from './table/cell';
 *
 * const tagsRenderer = typedCellRender(TAGS_CELL_TYPE, {
 *   'urgent': { color: 'red' },
 *   'normal': { color: 'blue' }
 * });
 * ```
 */
export const TAGS_CELL_TYPE = 'tags';

/**
 * Props for the TagsCell component, extending CellProps with string array value type and tag attributes mapping.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface TagsCellProps
 * @extends CellProps<string[], RecordType, Record<string, TagProps>>
 *
 * @example
 * ```tsx
 * interface Product {
 *   id: number;
 *   name: string;
 *   tags: string[];
 *   category: string;
 * }
 *
 * const props: TagsCellProps<Product> = {
 *   data: {
 *     value: ["electronics", "bestseller"],
 *     record: { id: 1, name: "Laptop", tags: ["electronics", "bestseller"], category: "computers" },
 *     index: 0
 *   },
 *   attributes: {
 *     "electronics": { color: "blue" },
 *     "bestseller": { color: "gold" }
 *   }
 * };
 * ```
 */
export interface TagsCellProps<RecordType = any>
  extends CellProps<string[], RecordType, Record<string, TagProps>> {}

/**
 * Renders a tags cell using Ant Design's Space and Tag components.
 *
 * This component displays multiple string tags in table cells, with each tag
 * rendered using the TagCell component. It supports individual tag styling
 * through attributes mapping and automatically filters out empty or whitespace-only tags.
 * Tags are displayed horizontally in a Space component for proper spacing.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the tags cell component.
 * @param props.data - The cell data containing value array, record, and index.
 * @param props.data.value - The array of string tags to display in the cell.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional mapping of tag names to TagProps for individual tag styling.
 * @returns A React element containing the tags wrapped in a Space component, or null if no valid tags.
 *
 * @example
 * ```tsx
 * <TagsCell
 *   data={{
 *     value: ["urgent", "frontend", "bug"],
 *     record: { id: 1, title: "Fix login issue", tags: ["urgent", "frontend", "bug"] },
 *     index: 0
 *   }}
 *   attributes={{
 *     "urgent": { color: "red" },
 *     "frontend": { color: "blue" },
 *     "bug": { color: "orange" }
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
 *   tags: string[];
 *   priority: string;
 * }
 *
 * <TagsCell<Task>
 *   data={{
 *     value: ["urgent", "frontend"],
 *     record: { id: 1, title: "Task", tags: ["urgent", "frontend"], priority: "high" },
 *     index: 0
 *   }}
 *   attributes={{
 *     "urgent": { color: "red", closable: true },
 *     "frontend": { color: "geekblue" }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Empty tags array - renders nothing
 * <TagsCell
 *   data={{
 *     value: [],
 *     record: { id: 1, title: "Task" },
 *     index: 0
 *   }}
 *   attributes={{}}
 * />
 * ```
 */
export function TagsCell<RecordType = any>(props: TagsCellProps<RecordType>) {
  const { data, attributes = {} } = props;
  if (data.value.length === 0) {
    return null;
  }
  return (
    <Space>
      {data.value.map((tag, index) => {
        const tagAttributes = attributes[tag];
        return (
          <TagCell
            key={index}
            data={{ value: tag, record: data.record, index: data.index }}
            attributes={tagAttributes}
          ></TagCell>
        );
      })}
    </Space>
  );
}
