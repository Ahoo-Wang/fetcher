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

import {
  aggregation,
  type AggregationQuery,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import type {
  RecordColumn,
  RecordData,
  RecordSummaryFunction,
  RecordSummaryResult,
} from './recordModel.js';
import { readRecordValue } from './recordValidation.js';

type SummaryColumn = Omit<
  Extract<RecordColumn, { kind: 'field' }>,
  'summary'
> & {
  summary: RecordSummaryFunction;
};
export const EMPTY_RECORD_SUMMARY: RecordSummaryResult = {
  status: 'idle',
  values: {},
  error: null,
};
/** Stable ordering keeps server aliases and query identity independent of table presentation. */
export function getRecordSummaryColumns(
  columns: readonly RecordColumn[],
): SummaryColumn[] {
  return columns
    .flatMap(column =>
      column.kind === 'field'
        ? (column.summary ?? []).map(summary => ({ ...column, summary }))
        : [],
    )
    .sort(
      (a, b) => a.id.localeCompare(b.id) || a.summary.localeCompare(b.summary),
    );
}
/** Current-page values use the loaded record snapshot, never a second record query. */
export function calculateRecordSummary(
  rows: readonly RecordData[],
  columns: readonly RecordColumn[],
): RecordSummaryResult['values'] {
  const result: Record<
    string,
    Partial<Record<RecordSummaryFunction, number | null>>
  > = Object.create(null);
  for (const column of getRecordSummaryColumns(columns)) {
    const values: number[] = [];
    for (const row of rows) {
      const value = readRecordValue(row, column.field);
      if (value === null || value === undefined) continue;
      if (typeof value !== 'number' || !Number.isFinite(value))
        throw new Error(`${column.field} 包含非有限数值，无法汇总`);
      values.push(value);
    }
    if (!values.length) {
      (result[column.id] ??= {})[column.summary] = null;
      continue;
    }
    let value: number;
    switch (column.summary) {
      case 'SUM':
        value = values.reduce((sum, item) => sum + item, 0);
        break;
      case 'AVG':
        value = values.reduce((sum, item) => sum + item, 0);
        value = Number.isFinite(value)
          ? value / values.length
          : values.reduce((sum, item) => sum + item / values.length, 0);
        break;
      case 'MIN':
        value = values.reduce((min, item) => Math.min(min, item));
        break;
      case 'MAX':
        value = values.reduce((max, item) => Math.max(max, item));
        break;
      default:
        throw new Error('汇总函数不支持');
    }
    if (!Number.isFinite(value))
      throw new Error(`${column.field} 汇总结果超出数值范围`);
    (result[column.id] ??= {})[column.summary] = value;
  }
  return result;
}
export function createRecordSummaryQuery(
  filter: FilterExpression,
  columns: readonly RecordColumn[],
): AggregationQuery {
  const metrics = getRecordSummaryColumns(columns).map((column, index) => {
    const alias = `summary${index}`;
    const expression = aggregation.field(column.field);
    switch (column.summary) {
      case 'SUM':
        return aggregation.sum(expression, alias);
      case 'AVG':
        return aggregation.avg(expression, alias);
      case 'MIN':
        return aggregation.min(expression, alias);
      case 'MAX':
        return aggregation.max(expression, alias);
      default:
        throw new Error('汇总函数不支持');
    }
  });
  const [first, ...rest] = metrics;
  if (!first || metrics.length > 64) throw new Error('汇总指标需要 1–64 项');
  return { filter, metrics: [first, ...rest] };
}
/** Wow's ungrouped contract always returns one row; missing aliases are errors, not zero. */
export function readRecordSummaryResult(
  value: unknown,
  columns: readonly RecordColumn[],
): RecordSummaryResult['values'] {
  if (
    !Array.isArray(value) ||
    value.length !== 1 ||
    !value[0] ||
    typeof value[0] !== 'object' ||
    Array.isArray(value[0])
  )
    throw new Error('所有汇总应返回一行聚合结果');
  const result: Record<
    string,
    Partial<Record<RecordSummaryFunction, number | null>>
  > = Object.create(null);
  getRecordSummaryColumns(columns).forEach((column, index) => {
    const alias = `summary${index}`;
    if (!Object.prototype.hasOwnProperty.call(value[0], alias))
      throw new Error(`汇总结果缺少 ${alias}`);
    const metric: unknown = value[0][alias];
    if (
      metric !== null &&
      (typeof metric !== 'number' || !Number.isFinite(metric))
    )
      throw new Error(`汇总结果 ${alias} 必须是合法数值`);
    (result[column.id] ??= {})[column.summary] = metric as number | null;
  });
  return result;
}
