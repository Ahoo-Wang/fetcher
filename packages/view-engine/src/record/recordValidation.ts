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

import { FilterOperator, SortDirection } from '@ahoo-wang/fetcher-wow';
import { compileFilterDraft, createFilterDraft } from '../filter/filterCore.js';
import {
  RECORD_COLUMN_MAX_WIDTH,
  RECORD_SUMMARY_LABELS,
  getRecordSummaryFunctions,
  formatRecordNumber,
  type RecordSummaryFunction,
  type ViewFieldDefinition,
  RECORD_COLUMN_MIN_WIDTH,
  type RecordData,
  type RecordKey,
  type ViewDefinition,
  type ViewInstance,
} from './recordModel.js';

function object(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label}必须是对象`);
}
function text(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${label}不能为空`);
}
function path(value: unknown, label: string) {
  text(value, label);
  if (value.split('.').some(segment => !segment))
    throw new Error(`${label}包含空路径`);
}
function reference(value: unknown) {
  if (value === undefined) return;
  object(value, '扩展引用');
  text(value.name, '扩展名称');
  if (value.options !== undefined) {
    object(value.options, '扩展选项');
    const seen = new Set<object>();
    function json(item: unknown): void {
      if (
        item === null ||
        typeof item === 'string' ||
        typeof item === 'boolean'
      )
        return;
      if (typeof item === 'number' && Number.isFinite(item)) return;
      if (!item || typeof item !== 'object' || seen.has(item))
        throw new Error('扩展选项必须可序列化为 JSON');
      if (
        !Array.isArray(item) &&
        Object.getPrototypeOf(item) !== Object.prototype &&
        Object.getPrototypeOf(item) !== null
      )
        throw new Error('扩展选项必须是 JSON 对象');
      seen.add(item);
      Object.values(item).forEach(json);
      seen.delete(item);
    }
    json(value.options);
  }
}
function fields(value: unknown) {
  if (!Array.isArray(value)) throw new Error('字段定义必须是数组');
  const names = new Set<string>();
  for (const field of value) {
    object(field, '字段');
    text(field.field, '字段路径');
    path(field.field, '字段路径');
    text(field.label, '字段名称');
    if (field.group !== undefined) text(field.group, '字段分组');
    if (names.has(field.field)) throw new Error(`字段重复：${field.field}`);
    names.add(field.field);
    if (
      field.type !== undefined &&
      !['string', 'number', 'boolean', 'date', 'datetime', 'array'].includes(
        String(field.type),
      )
    )
      throw new Error('字段类型不支持');
    if (field.sortable !== undefined && typeof field.sortable !== 'boolean')
      throw new Error('sortable 必须是布尔值');
    if (
      field.operators !== undefined &&
      (!Array.isArray(field.operators) ||
        field.operators.some(op => !Object.values(FilterOperator).includes(op)))
    )
      throw new Error('字段操作符不支持');
    if (field.options !== undefined) {
      if (!Array.isArray(field.options)) throw new Error('枚举选项必须是数组');
      const values = new Set<string>();
      for (const option of field.options) {
        object(option, '枚举选项');
        text(option.label, '枚举选项名称');
        if (
          !['string', 'number', 'boolean'].includes(typeof option.value) ||
          (typeof option.value === 'number' && !Number.isFinite(option.value))
        )
          throw new Error('枚举选项值无效');
        const key = JSON.stringify(option.value);
        if (values.has(key)) throw new Error('枚举选项值重复');
        values.add(key);
        if (
          option.disabled !== undefined &&
          typeof option.disabled !== 'boolean'
        )
          throw new Error('枚举 disabled 必须是布尔值');
      }
    }
    if (field.timeZone !== undefined) {
      text(field.timeZone, '时区');
      new Intl.DateTimeFormat('en', { timeZone: field.timeZone });
    }
    if (field.numberFormat !== undefined) {
      object(field.numberFormat, '数值格式');
      if (field.type !== 'number') throw new Error('只有数值字段支持数值格式');
      if (field.numberFormat.locale !== undefined)
        text(field.numberFormat.locale, '数值区域设置');
      formatRecordNumber(0, field as unknown as ViewFieldDefinition);
    }
    if (field.summaryFunctions !== undefined) {
      if (
        !Array.isArray(field.summaryFunctions) ||
        new Set(field.summaryFunctions).size !==
          field.summaryFunctions.length ||
        field.summaryFunctions.some(
          fn =>
            typeof fn !== 'string' ||
            !Object.prototype.hasOwnProperty.call(RECORD_SUMMARY_LABELS, fn) ||
            field.type !== 'number',
        )
      )
        throw new Error('字段汇总函数无效或不支持');
    }
    reference(field.editor);
    reference(field.cellRenderer);
    if (field.fields !== undefined) fields(field.fields);
  }
}
export function validateViewDefinition(
  value: unknown,
): asserts value is ViewDefinition {
  object(value, '视图定义');
  text(value.id, '定义 ID');
  text(value.title, '定义名称');
  text(value.sourceId, '数据源 ID');
  path(value.rowKey, '记录主键');
  fields(value.fields);
  if (
    value.allowedOperators !== undefined &&
    (!Array.isArray(value.allowedOperators) ||
      value.allowedOperators.some(
        op => !Object.values(FilterOperator).includes(op),
      ))
  )
    throw new Error('定义操作符不支持');
  if (value.filterEditors !== undefined) {
    object(value.filterEditors, '筛选扩展');
    for (const [op, editor] of Object.entries(value.filterEditors)) {
      if (!Object.values(FilterOperator).includes(op as FilterOperator))
        throw new Error('筛选扩展操作符不支持');
      reference(editor);
    }
  }
  if (value.recordActions !== undefined) {
    object(value.recordActions, '业务操作');
    reference(value.recordActions.global);
    reference(value.recordActions.table);
    reference(value.recordActions.row);
  }
}
export function validateViewInstance(
  value: unknown,
  definition: ViewDefinition,
  expectedId?: string,
): asserts value is ViewInstance {
  object(value, '视图实例');
  text(value.id, '实例 ID');
  if (expectedId !== undefined && value.id !== expectedId)
    throw new Error('返回的实例 ID 不匹配');
  if (value.definitionId !== definition.id)
    throw new Error('实例不属于当前视图定义');
  text(value.title, '实例名称');
  if (value.kind !== 'record') throw new Error('当前仅支持 record 视图');
  object(value.scope, '实例范围');
  if (
    value.scope.type !== 'personal' &&
    !(
      value.scope.type === 'public' &&
      ['system', 'shared'].includes(String(value.scope.source))
    )
  )
    throw new Error('实例范围无效');
  if (value.revision !== undefined && typeof value.revision !== 'string')
    throw new Error('实例 revision 必须是字符串');
  object(value.config, '实例配置');
  const config = value.config;
  const compiled = compileFilterDraft(
    createFilterDraft(config.filter as ViewInstance['config']['filter']),
    definition.fields,
    definition.allowedOperators,
  );
  if (compiled.errors.length)
    throw new Error(compiled.errors.map(error => error.message).join('；'));
  if (!Array.isArray(config.sort) || config.sort.length > 32)
    throw new Error('排序必须为最多 32 项的数组');
  const sorted = new Set<string>();
  for (const sort of config.sort) {
    object(sort, '排序');
    text(sort.field, '排序字段');
    if (
      !definition.fields.some(
        field => field.field === sort.field && field.sortable === true,
      )
    )
      throw new Error(`字段不支持排序：${sort.field}`);
    if (
      ![SortDirection.ASC, SortDirection.DESC].includes(
        sort.direction as SortDirection,
      ) ||
      sorted.has(sort.field)
    )
      throw new Error('排序方向无效或字段重复');
    sorted.add(sort.field);
  }
  object(config.pagination, '分页配置');
  if (
    !['paged', 'cursor'].includes(String(config.pagination.mode)) ||
    !Number.isSafeInteger(config.pagination.size) ||
    Number(config.pagination.size) <= 0
  )
    throw new Error('分页方式或每页数量无效');
  object(config.presentation, '展示配置');
  if (config.presentation.layout !== 'table')
    throw new Error('当前仅支持 table 布局');
  object(config.presentation.table, '表格配置');
  const columns = config.presentation.table.columns;
  if (!Array.isArray(columns) || !columns.length)
    throw new Error('请至少配置一列');
  const columnIds = new Set<string>();
  let visible = false;
  let summaryCount = 0;
  for (const column of columns) {
    object(column, '列');
    text(column.id, '列 ID');
    if (columnIds.has(column.id)) throw new Error(`列 ID 重复：${column.id}`);
    columnIds.add(column.id);
    if (column.title !== undefined) text(column.title, '列名称');
    if (column.visible !== undefined && typeof column.visible !== 'boolean')
      throw new Error('列 visible 必须为布尔值');
    if (
      column.pinned !== undefined &&
      column.pinned !== false &&
      column.pinned !== 'left' &&
      column.pinned !== 'right'
    )
      throw new Error('列固定位置必须为 left、right 或 false');
    visible ||= column.visible !== false;
    if (
      column.width !== undefined &&
      (typeof column.width !== 'number' ||
        !Number.isFinite(column.width) ||
        column.width < RECORD_COLUMN_MIN_WIDTH ||
        column.width > RECORD_COLUMN_MAX_WIDTH)
    )
      throw new Error(
        `列宽必须在 ${RECORD_COLUMN_MIN_WIDTH}–${RECORD_COLUMN_MAX_WIDTH} 之间`,
      );
    reference(column.renderer);
    if (column.summary !== undefined) {
      const field = definition.fields.find(
        field => field.field === column.field,
      );
      if (
        column.kind !== 'field' ||
        !field ||
        !Array.isArray(column.summary) ||
        new Set(column.summary).size !== column.summary.length ||
        column.summary.some(
          summary =>
            !getRecordSummaryFunctions(field as ViewFieldDefinition).includes(
              summary as RecordSummaryFunction,
            ),
        )
      )
        throw new Error('列汇总函数无效或字段不支持');
      summaryCount += column.summary.length;
    }
    if (column.kind === 'field') {
      if (!definition.fields.some(field => field.field === column.field))
        throw new Error(`列引用了未知字段：${String(column.field)}`);
    } else if (column.kind === 'actions') {
      if (!column.renderer && !definition.recordActions?.row)
        throw new Error('操作列缺少行操作扩展');
    } else throw new Error('列类型不支持');
  }
  if (!visible) throw new Error('请至少显示一列');
  if (summaryCount > 64) throw new Error('最多配置 64 个汇总指标');
}
/** Dot paths use exact own-property segments, preserving null and falsey values. */
export function readRecordValue(record: RecordData, field: string): unknown {
  return field
    .split('.')
    .reduce<unknown>(
      (value, segment) =>
        value !== null &&
        typeof value === 'object' &&
        Object.prototype.hasOwnProperty.call(value, segment)
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      record,
    );
}
export function getRecordKey(record: RecordData, field: string): RecordKey {
  const key = readRecordValue(record, field);
  if (
    typeof key !== 'string' &&
    !(typeof key === 'number' && Number.isFinite(key))
  )
    throw new Error(`记录缺少有效主键：${field}`);
  return key;
}
export function validateRecordRows(
  rows: unknown,
  rowKey: string,
): asserts rows is RecordData[] {
  if (!Array.isArray(rows)) throw new Error('查询结果 list 必须是数组');
  const keys = new Set<RecordKey>();
  for (const row of rows) {
    object(row, '记录');
    const key = getRecordKey(row, rowKey);
    if (keys.has(key)) throw new Error(`查询结果包含重复主键：${String(key)}`);
    keys.add(key);
  }
}
