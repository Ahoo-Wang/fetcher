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

import { scalar } from '../filter/filterScalar.js';
import { formatRecordNumber, type ViewFieldDefinition } from './recordModel.js';

export type RecordDateTimeFormat = Pick<
  Intl.DateTimeFormatOptions,
  'dateStyle' | 'timeStyle'
> & { locale?: string };
export function formatRecordDateTime(
  value: unknown,
  type: 'date' | 'datetime',
  timeZone?: string,
  format: RecordDateTimeFormat = {},
): string {
  // Validate configuration even when this row has no value.
  const formatter = new Intl.DateTimeFormat(format.locale ?? 'zh-CN', {
    timeZone,
    dateStyle: format.dateStyle ?? 'medium',
    ...(type === 'datetime' ? { timeStyle: format.timeStyle ?? 'medium' } : {}),
  });
  if (value === null || value === undefined || value === '') return '—';
  if (
    !(value instanceof Date) &&
    typeof value !== 'string' &&
    typeof value !== 'number'
  )
    return '—';
  let date: Date;
  try {
    if (typeof value === 'string') {
      // Parse the accepted forms once. Unsupported local strings never use the host timezone.
      const parts =
        /^(\d{4}-\d{2}-\d{2})(?:(?:t|\s+)((?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?)(z|[+-]\d{2}:?\d{2})?)?$/i.exec(
          value.trim(),
        );
      if (!parts) return '—';
      const [, calendarDate, time, offset] = parts;
      scalar(calendarDate, { field: 'date', label: '日期', type: 'date' });
      if (!time) return calendarDate;
      date = offset
        ? new Date(`${calendarDate}T${time}${offset.toUpperCase()}`)
        : new Date(
            scalar(
              { date: calendarDate, time },
              { field: 'datetime', label: '时间', type: 'datetime' },
              timeZone,
            ) as number,
          );
    } else date = value instanceof Date ? value : new Date(value);
  } catch {
    return '—';
  }
  return Number.isFinite(date.getTime()) ? formatter.format(date) : '—';
}
export function recordValueText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value) ?? '';
  return String(value);
}
export function formatRecordValue(
  value: unknown,
  field: Pick<ViewFieldDefinition, 'options' | 'type' | 'numberFormat'> = {},
  timeZone?: string,
): string {
  if (value === null || value === undefined || value === '') return '—';
  const option = field.options?.find(option => Object.is(option.value, value));
  if (option) return option.label;
  if (field.type === 'date' || field.type === 'datetime')
    return formatRecordDateTime(value, field.type, timeZone);
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'number')
    return Number.isFinite(value) ? formatRecordNumber(value, field) : '—';
  return recordValueText(value) || '—';
}
