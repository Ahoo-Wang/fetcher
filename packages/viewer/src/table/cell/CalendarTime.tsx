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

import calendar from 'dayjs/plugin/calendar';
import dayjs, { Dayjs } from 'dayjs';
import { CellProps } from './types';
import { Typography } from 'antd';
import { TextProps } from 'antd/es/typography/Text';
import { parseDayjs } from './utils';
import { DateTimeCell, DEFAULT_DATE_TIME_FORMAT } from './DateTimeCell';

const { Text } = Typography;

dayjs.extend(calendar);

/**
 * Calendar format configuration for relative time display.
 *
 * Defines the format strings used by dayjs calendar plugin to display
 * dates relative to the current time (e.g., "今天", "昨天", etc.).
 *
 * @interface CalendarFormats
 *
 * @example
 * ```typescript
 * const customFormats: CalendarFormats = {
 *   sameDay: '[今天] HH:mm',
 *   lastDay: '[昨天] HH:mm',
 *   sameElse: 'YYYY-MM-DD HH:mm:ss'
 * };
 * ```
 */
export interface CalendarFormats {
  /** Format for dates that are today */
  sameDay?: string;
  /** Format for dates that are tomorrow */
  nextDay?: string;
  /** Format for dates in the next week */
  nextWeek?: string;
  /** Format for dates that were yesterday */
  lastDay?: string;
  /** Format for dates in the last week */
  lastWeek?: string;
  /** Format for all other dates */
  sameElse?: string;
}

/**
 * Constant representing the type identifier for calendar time cells.
 *
 * This constant is used to register and identify calendar time cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for calendar-based datetime table cells.
 *
 * @constant
 * @type {string}
 * @default 'calendar-time'
 *
 * @example
 * ```tsx
 * import { typedCellRender, CALENDAR_CELL_TYPE } from './table/cell';
 *
 * const calendarRenderer = typedCellRender(CALENDAR_CELL_TYPE, {
 *   formats: {
 *     sameDay: '[今天] HH:mm',
 *     lastDay: '[昨天] HH:mm'
 *   }
 * });
 * ```
 */
export const CALENDAR_CELL_TYPE = 'calendar-time';

/**
 * Default calendar formats for Chinese locale.
 *
 * Provides sensible defaults for displaying relative dates in Chinese,
 * falling back to standard datetime format for older dates.
 *
 * @constant
 * @type {CalendarFormats}
 */
export const DEFAULT_CALENDAR_FORMATS: CalendarFormats = {
  sameDay: '[今天] HH:mm',
  nextDay: '[明天] HH:mm',
  lastDay: '[昨天] HH:mm',
  nextWeek: DEFAULT_DATE_TIME_FORMAT,
  lastWeek: DEFAULT_DATE_TIME_FORMAT,
  sameElse: DEFAULT_DATE_TIME_FORMAT,
};

/**
 * Props for the CalendarTimeCell component, extending CellProps with datetime value type and TextProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface CalendarTimeProps
 * @extends CellProps<string | number | Date | Dayjs, RecordType, TextProps & { formats?: CalendarFormats }>
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
 * const props: CalendarTimeProps<Event> = {
 *   data: {
 *     value: "2024-01-15T10:30:45Z",
 *     record: { id: 1, title: "Meeting", createdAt: "2024-01-15T10:30:45Z", updatedAt: 1705312200000 },
 *     index: 0
 *   },
 *   attributes: {
 *     formats: {
 *       sameDay: "[今天] HH:mm",
 *       lastDay: "[昨天] HH:mm"
 *     }
 *   }
 * };
 * ```
 */
export interface CalendarTimeProps<RecordType = any>
  extends CellProps<
    string | number | Date | Dayjs,
    RecordType,
    TextProps & { formats?: CalendarFormats }
  > {
}

/**
 * Renders a calendar time cell using Ant Design's Typography.Text component with dayjs calendar formatting.
 *
 * This component displays datetime values in table cells using relative time formats
 * (e.g., "今天 10:30", "昨天 15:45") based on the current date. It supports various input formats
 * (string, number timestamp, Date object, or Dayjs object) and customizable calendar formats
 * through the dayjs calendar plugin. It provides consistent relative time display with fallback handling
 * for invalid dates.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the calendar time cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The datetime value to display (string, number, Date, or Dayjs).
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes including calendar formats and TextProps.
 * @param props.attributes.formats - Optional calendar format configuration (default: DEFAULT_CALENDAR_FORMATS).
 * @returns A React element representing the formatted calendar time cell.
 *
 * @example
 * ```tsx
 * <CalendarTimeCell
 *   data={{
 *     value: "2024-01-15T10:30:45Z",
 *     record: { id: 1, title: "Event", createdAt: "2024-01-15T10:30:45Z" },
 *     index: 0
 *   }}
 *   attributes={{
 *     formats: {
 *       sameDay: "[今天] HH:mm",
 *       lastDay: "[昨天] HH:mm"
 *     }
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
 * <CalendarTimeCell<Log>
 *   data={{
 *     value: 1705312200000,
 *     record: { id: 1, message: "User login", timestamp: 1705312200000 },
 *     index: 0
 *   }}
 *   attributes={{
 *     formats: {
 *       sameDay: "[今天] HH:mm",
 *       lastDay: "[昨天] HH:mm"
 *     },
 *     style: { color: '#666' }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With Date object
 * <CalendarTimeCell
 *   data={{
 *     value: new Date(),
 *     record: { id: 1, title: "Current time" },
 *     index: 0
 *   }}
 * />
 * ```
 */
export function CalendarTimeCell<RecordType = any>(
  props: CalendarTimeProps<RecordType>,
) {
  const { data, attributes = {} } = props;
  const { formats = DEFAULT_CALENDAR_FORMATS, ...textProps } = attributes;
  const format = (dayjs: Dayjs) => {
    return dayjs.calendar(null, formats);
  };
  return (<DateTimeCell data={data} attributes={{ format, ...textProps }} />);
}
