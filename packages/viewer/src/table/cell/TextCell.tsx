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
import { Typography } from 'antd';
import { TextProps } from 'antd/es/typography/Text';

const { Text } = Typography;

/**
 * Constant representing the type identifier for text cells.
 *
 * This constant is used to register and identify text cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for text-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'text'
 *
 * @example
 * ```tsx
 * import { typedCellRender, TEXT_CELL_TYPE } from './table/cell';
 *
 * const textRenderer = typedCellRender(TEXT_CELL_TYPE, { ellipsis: true });
 * ```
 */
export const TEXT_CELL_TYPE = 'text';

/**
 * Props for the TextCell component, extending CellProps with string value type and TextProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface TextCellProps
 * @extends CellProps<string, RecordType, TextProps>
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 * }
 *
 * const props: TextCellProps<User> = {
 *   data: {
 *     value: "John Doe",
 *     record: { id: 1, name: "John Doe" },
 *     index: 0
 *   },
 *   attributes: { ellipsis: true }
 * };
 * ```
 */
export interface TextCellProps<RecordType = any>
  extends CellProps<string, RecordType, TextProps> {
}

/**
 * Renders a text cell using Ant Design's Typography.Text component.
 *
 * This component displays string values in table cells with support for
 * various text formatting options provided by Ant Design's Typography.Text.
 * It handles the rendering of text content while allowing customization
 * through attributes like ellipsis, styling, and other TextProps.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the text cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The string value to display in the cell.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes to pass to Typography.Text component.
 * @returns A React element representing the text cell.
 *
 * @throws {Error} If the value cannot be rendered as React children (e.g., objects).
 *
 * @example
 * ```tsx
 * <TextCell
 *   data={{
 *     value: "Hello World",
 *     record: { id: 1, name: "John" },
 *     index: 0
 *   }}
 *   attributes={{
 *     ellipsis: true,
 *     style: { color: 'blue' }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript
 * interface User {
 *   id: number;
 *   name: string;
 * }
 *
 * <TextCell<User>
 *   data={{
 *     value: "John Doe",
 *     record: { id: 1, name: "John Doe" },
 *     index: 0
 *   }}
 *   attributes={{ ellipsis: { tooltip: true } }}
 * />
 * ```
 */
export function TextCell<RecordType = any>(props: TextCellProps<RecordType>) {
  return <Text {...props.attributes}>{props.attributes?.children ?? props.data.value}</Text>;
}
