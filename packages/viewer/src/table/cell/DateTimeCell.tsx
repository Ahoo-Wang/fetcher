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
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;

/**
 * Constant representing the type identifier for datetime cells.
 *
 * This constant is used to register and identify datetime cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for datetime-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'datetime'
 *
 * @example
 * ```tsx
 * import { typedCellRender, DATETIME_CELL_TYPE } from './table/cell';
 *
 * const datetimeRenderer = typedCellRender(DATETIME_CELL_TYPE, {
 *   format: 'YYYY-MM-DD HH:mm:ss'
 * });
 * ```
 */
export const DATETIME_CELL_TYPE = 'datetime';

/**
 * Props for the DateTimeCell component, extending CellProps with datetime value type and TextProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface DateTimeCellProps
 * @extends CellProps<string | number | Date | Dayjs, RecordType, TextProps & { format?: string }>
 *
 * @example
 * ```tsx
 * interface Event {
 *   id: number;
 *   title: string;
 *   createdAt: string;
 *   updatedAt: number;
 * }
 *
 * const props: DateTimeCellProps<Event> = {
 *   data: {
 *     value: "2024-01-15T10:30:00Z",
 *     record: { id: 1, title: "Meeting", createdAt: "2024-01-15T10:30:00Z", updatedAt: 1705312200000 },
 *     index: 0
 *   },
 *   attributes: {
 *     format: "YYYY-MM-DD HH:mm:ss"
 *   }
 * };
 * ```
 */
export interface DateTimeCellProps<RecordType = any>
  extends CellProps<
    string | number | Date | Dayjs,
    RecordType,
    TextProps & { format?: string }
  > {
}

const DEFAULT_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * Renders a datetime cell using Ant Design's Typography.Text component with dayjs formatting.
 *
 * This component displays datetime values in table cells, supporting various input formats
 * (string, number timestamp, Date object, or Dayjs object) and customizable formatting
 * through the dayjs library. It provides consistent datetime display with fallback handling
 * for invalid dates.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the datetime cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The datetime value to display (string, number, Date, or Dayjs).
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes including format string and TextProps.
 * @param props.attributes.format - Optional dayjs format string (default: 'YYYY-MM-DD HH:mm:ss').
 * @returns A React element representing the formatted datetime cell.
 *
 * @example
 * ```tsx
 * <DateTimeCell
 *   data={{
 *     value: "2024-01-15T10:30:00Z",
 *     record: { id: 1, title: "Event", createdAt: "2024-01-15T10:30:00Z" },
 *     index: 0
 *   }}
 *   attributes={{
 *     format: "YYYY-MM-DD HH:mm:ss"
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript and timestamp
 * interface Log {
 *   id: number;
 *   message: string;
 *   timestamp: number;
 * }
 *
 * <DateTimeCell<Log>
 *   data={{
 *     value: 1705312200000,
 *     record: { id: 1, message: "User login", timestamp: 1705312200000 },
 *     index: 0
 *   }}
 *   attributes={{
 *     format: "MMM DD, YYYY hh:mm A",
 *     style: { color: '#666' }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With Date object
 * <DateTimeCell
 *   data={{
 *     value: new Date(),
 *     record: { id: 1, title: "Current time" },
 *     index: 0
 *   }}
 * />
 * ```
 */
export function DateTimeCell<RecordType = any>(
  props: DateTimeCellProps<RecordType>,
) {
  const { data, attributes = {} } = props;
  const { format = DEFAULT_DATE_TIME_FORMAT, ...textProps } = attributes;
  if (!data.value) {
    return <Text {...textProps}>-</Text>;
  }
  const date = parseDayjs(data.value);
  if (!date.isValid()) {
    return <Text {...textProps}>-</Text>;
  }
  return <Text {...textProps}>{date.format(format)}</Text>;
}

export function parseDayjs(value: string | number | Date | Dayjs): Dayjs {
  if (dayjs.isDayjs(value)) {
    return value;
  }
  return dayjs(value);
}
