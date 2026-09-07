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
  DeletionState,
  FilterOperator,
  SearchMode,
  StringComparison,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import { FILTER_OPERATORS } from '../filter/filterCore.js';
import type { FilterFieldDefinition } from '../filter/filterModel.js';

/** Describes the applied expression; draft values and display rounding must not change its meaning. */
export function describeRecordFilter(
  expression: FilterExpression,
  fields: readonly FilterFieldDefinition[],
  root = true,
): { count: number; text: string } {
  const operator = FILTER_OPERATORS[expression.op];
  if ('operands' in expression) {
    const children = expression.operands.map(child =>
      describeRecordFilter(child, fields, false),
    );
    return {
      count: children.reduce((sum, child) => sum + child.count, 0),
      text: `${operator.label}（${children.map(child => child.text).join('；')}）`,
    };
  }
  const field =
    'field' in expression
      ? fields.find(field => field.field === expression.field)
      : undefined;
  const label =
    'field' in expression
      ? `${field?.label ?? expression.field} ${operator.label}`
      : operator.label;
  if ('predicate' in expression) {
    const child = describeRecordFilter(
      expression.predicate,
      field?.fields ?? [],
      false,
    );
    return { count: child.count, text: `${label}（${child.text}）` };
  }
  function literal(value: unknown): string {
    const option = field?.options?.find(option =>
      Object.is(option.value, value),
    );
    if (option) return option.label;
    if (value === null) return '空值';
    if (value === '') return '空字符串';
    if (typeof value === 'boolean') return value ? '是' : '否';
    if (
      typeof value === 'number' &&
      (field?.type === 'date' || field?.type === 'datetime')
    ) {
      const date = new Date(value);
      if (Number.isFinite(date.getTime())) return date.toISOString();
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
  const values: string[] = [];
  if ('value' in expression) values.push(literal(expression.value));
  if ('values' in expression)
    values.push(`[${expression.values.map(literal).join('、')}]`);
  if ('lowerBound' in expression)
    values.push(
      `${literal(expression.lowerBound)} 至 ${literal(expression.upperBound)}`,
    );
  if ('query' in expression) {
    values.push(expression.query);
    if (expression.fields?.length)
      values.push(
        `范围：${expression.fields.map(path => fields.find(field => field.field === path)?.label ?? path).join('、')}`,
      );
    if (expression.mode)
      values.push(
        expression.mode === SearchMode.PHRASE ? '短语匹配' : '分词匹配',
      );
  }
  if ('state' in expression)
    values.push(
      {
        [DeletionState.ACTIVE]: '未删除',
        [DeletionState.DELETED]: '已删除',
        [DeletionState.ALL]: '全部',
      }[expression.state],
    );
  if ('time' in expression) values.push(expression.time);
  if ('days' in expression) values.push(`${expression.days} 天`);
  if ('zoneId' in expression && expression.zoneId)
    values.push(`时区：${expression.zoneId}`);
  if ('stringComparison' in expression && expression.stringComparison)
    values.push(
      expression.stringComparison === StringComparison.CASE_INSENSITIVE
        ? '不区分大小写'
        : '区分大小写',
    );
  return {
    count: root && expression.op === FilterOperator.MATCH_ALL ? 0 : 1,
    text: [label, ...values].join(' '),
  };
}
