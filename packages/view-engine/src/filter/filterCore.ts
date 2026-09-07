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
  filter,
  FilterOperator as Op,
  type ComparableFilterLiteral,
  type ElementFilterExpression,
  type FilterExpression,
  type FilterLiteral,
} from '@ahoo-wang/fetcher-wow';
import { TZDate } from '@date-fns/tz';
import type { DeepReadonly } from '../lib/types.js';
import type {
  FilterCompileResult,
  FilterDateTimeValue,
  FilterDraftNode,
  FilterFieldDefinition,
  FilterOperatorDefinition,
  FilterValidationError,
} from './filterModel.js';

export const FILTER_OPERATORS: Readonly<Record<Op, FilterOperatorDefinition>> =
  {
    MATCH_ALL: { label: '全部记录', category: 'root', input: 'none' },
    MATCH_NONE: { label: '不匹配记录', category: 'root', input: 'none' },
    ID: { label: '记录标识', category: 'root', input: 'value' },
    IDS: { label: '记录标识集合', category: 'root', input: 'values' },
    AGGREGATE_ID: { label: '聚合标识', category: 'root', input: 'value' },
    AGGREGATE_IDS: { label: '聚合标识集合', category: 'root', input: 'values' },
    TENANT_ID: { label: '租户标识', category: 'root', input: 'value' },
    OWNER_ID: { label: '所有者标识', category: 'root', input: 'value' },
    SPACE_ID: { label: '空间标识', category: 'root', input: 'value' },
    AND: { label: '满足全部条件', category: 'logical', input: 'none' },
    OR: { label: '满足任一条件', category: 'logical', input: 'none' },
    NOR: { label: '全部条件均不满足', category: 'logical', input: 'none' },
    EQ: { label: '等于', category: 'field', input: 'value' },
    NE: { label: '不等于', category: 'field', input: 'value' },
    GT: { label: '大于', category: 'field', input: 'value' },
    GTE: { label: '大于等于', category: 'field', input: 'value' },
    LT: { label: '小于', category: 'field', input: 'value' },
    LTE: { label: '小于等于', category: 'field', input: 'value' },
    CONTAINS: { label: '包含文本', category: 'field', input: 'value' },
    STARTS_WITH: { label: '开头是', category: 'field', input: 'value' },
    ENDS_WITH: { label: '结尾是', category: 'field', input: 'value' },
    IN: { label: '属于', category: 'field', input: 'values' },
    NOT_IN: { label: '不属于', category: 'field', input: 'values' },
    BETWEEN: { label: '介于', category: 'field', input: 'between' },
    CONTAINS_ALL: { label: '包含全部', category: 'field', input: 'values' },
    IS_EMPTY: { label: '集合为空', category: 'field', input: 'none' },
    IS_EMPTY_STRING: { label: '文本为空', category: 'field', input: 'none' },
    IS_NOT_EMPTY_STRING: {
      label: '文本非空',
      category: 'field',
      input: 'none',
    },
    IS_NULL: { label: '为空值', category: 'field', input: 'none' },
    IS_NOT_NULL: { label: '非空值', category: 'field', input: 'none' },
    EXISTS: { label: '存在', category: 'field', input: 'none' },
    NOT_EXISTS: { label: '不存在', category: 'field', input: 'none' },
    DELETION: { label: '删除状态', category: 'root', input: 'deletion' },
    ELEMENT_MATCH: {
      label: '同一元素满足',
      category: 'element',
      input: 'none',
    },
    SEARCH: { label: '全文搜索', category: 'root', input: 'search' },
    TODAY: {
      label: '今天',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    BEFORE_TODAY: {
      label: '今天指定时间之前',
      category: 'field',
      input: 'time',
      relativeTime: true,
    },
    TOMORROW: {
      label: '明天',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    THIS_WEEK: {
      label: '本周',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    NEXT_WEEK: {
      label: '下周',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    LAST_WEEK: {
      label: '上周',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    THIS_MONTH: {
      label: '本月',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    LAST_MONTH: {
      label: '上月',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    YESTERDAY: {
      label: '昨天',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    NEXT_MONTH: {
      label: '下月',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    LAST_YEAR: {
      label: '去年',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    THIS_YEAR: {
      label: '今年',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    NEXT_YEAR: {
      label: '明年',
      category: 'field',
      input: 'none',
      relativeTime: true,
    },
    RECENT_DAYS: {
      label: '最近天数',
      category: 'field',
      input: 'days',
      relativeTime: true,
    },
    EARLIER_DAYS: {
      label: '早于天数',
      category: 'field',
      input: 'days',
      relativeTime: true,
    },
  };

const common = [
  Op.EQ,
  Op.NE,
  Op.IN,
  Op.NOT_IN,
  Op.IS_NULL,
  Op.IS_NOT_NULL,
  Op.EXISTS,
  Op.NOT_EXISTS,
];
const comparison = [Op.GT, Op.GTE, Op.LT, Op.LTE, Op.BETWEEN];
const stringOperators = [Op.CONTAINS, Op.STARTS_WITH, Op.ENDS_WITH];
const optionalParameters = [
  'stringComparison',
  'fields',
  'mode',
  'zoneId',
  'datePattern',
  'timeUnit',
] as const;

export function getFieldOperators(field: FilterFieldDefinition): readonly Op[] {
  let operators: Op[];
  switch (field.type) {
    case 'string':
      operators = [
        ...common,
        ...comparison,
        ...stringOperators,
        Op.IS_EMPTY_STRING,
        Op.IS_NOT_EMPTY_STRING,
      ];
      break;
    case 'number':
      operators = [...common, ...comparison];
      break;
    case 'boolean':
      operators = common;
      break;
    case 'date':
    case 'datetime':
      operators = [
        ...common,
        ...comparison,
        ...Object.values(Op).filter(op => FILTER_OPERATORS[op].relativeTime),
      ];
      break;
    case 'array':
      operators = [...common, Op.CONTAINS_ALL, Op.IS_EMPTY, Op.ELEMENT_MATCH];
      break;
    default:
      operators = Object.values(Op).filter(op =>
        ['field', 'element'].includes(FILTER_OPERATORS[op].category),
      );
  }
  return field.operators
    ? field.operators.filter(op => operators.includes(op))
    : operators;
}

function definition(op: Op): FilterOperatorDefinition {
  if (!Object.prototype.hasOwnProperty.call(FILTER_OPERATORS, op))
    throw new TypeError(`未知操作：${String(op)}`);
  return FILTER_OPERATORS[op];
}

function checkShape(
  node: DeepReadonly<FilterDraftNode>,
): FilterOperatorDefinition {
  const descriptor = definition(node.op);
  const keys = ['id', 'op'];
  if (descriptor.category === 'field' || descriptor.category === 'element')
    keys.push('field');
  if (descriptor.category === 'logical') keys.push('operands');
  if (descriptor.category === 'element') keys.push('predicate');
  switch (descriptor.input) {
    case 'value':
      keys.push('value');
      break;
    case 'values':
      keys.push('values');
      break;
    case 'between':
      keys.push('lowerBound', 'upperBound');
      break;
    case 'search':
      keys.push('query', 'fields', 'mode');
      break;
    case 'deletion':
      keys.push('state');
      break;
    case 'time':
      keys.push('time');
      break;
    case 'days':
      keys.push('days');
      break;
  }
  if (stringOperators.includes(node.op)) keys.push('stringComparison');
  if (descriptor.relativeTime) keys.push('zoneId', 'datePattern', 'timeUnit');
  for (const key of Object.keys(node)) {
    if (!keys.includes(key) && node[key as keyof FilterDraftNode] !== undefined)
      throw new TypeError(`${node.op} 不支持参数 ${key}`);
  }
  return descriptor;
}

type CompiledNode = Omit<
  FilterDraftNode,
  'operands' | 'predicate' | 'values' | 'fields'
> & {
  operands?: FilterExpression[];
  predicate?: FilterExpression;
  values?: readonly unknown[];
  fields?: readonly string[];
};

/** The Wow constructors remain the authority for wire-level operator validation. */
function build(node: CompiledNode): FilterExpression {
  const field = node.field!;
  const value = node.value as ComparableFilterLiteral;
  const values = node.values as ComparableFilterLiteral[];
  let expression: FilterExpression;
  switch (node.op) {
    case Op.MATCH_ALL:
      return filter.matchAll();
    case Op.MATCH_NONE:
      return filter.matchNone();
    case Op.ID:
      return filter.id(value as string);
    case Op.IDS:
      return filter.ids(values as string[]);
    case Op.AGGREGATE_ID:
      return filter.aggregateId(value as string);
    case Op.AGGREGATE_IDS:
      return filter.aggregateIds(values as string[]);
    case Op.TENANT_ID:
      return filter.tenantId(value as string);
    case Op.OWNER_ID:
      return filter.ownerId(value as string);
    case Op.SPACE_ID:
      return filter.spaceId(value as string);
    case Op.AND:
      return filter.and(node.operands!);
    case Op.OR:
      return filter.or(node.operands!);
    case Op.NOR:
      return filter.nor(node.operands!);
    case Op.EQ:
      return filter.eq(field, node.value as FilterLiteral);
    case Op.NE:
      return filter.ne(field, node.value as FilterLiteral);
    case Op.GT:
      return filter.gt(field, value);
    case Op.GTE:
      return filter.gte(field, value);
    case Op.LT:
      return filter.lt(field, value);
    case Op.LTE:
      return filter.lte(field, value);
    case Op.CONTAINS:
      expression = filter.contains(
        field,
        value as string,
        node.stringComparison,
      );
      break;
    case Op.STARTS_WITH:
      expression = filter.startsWith(
        field,
        value as string,
        node.stringComparison,
      );
      break;
    case Op.ENDS_WITH:
      expression = filter.endsWith(
        field,
        value as string,
        node.stringComparison,
      );
      break;
    case Op.IN:
      return filter.isIn(field, values);
    case Op.NOT_IN:
      return filter.notIn(field, values);
    case Op.CONTAINS_ALL:
      return filter.containsAll(field, values);
    case Op.BETWEEN:
      return filter.between(
        field,
        node.lowerBound as ComparableFilterLiteral,
        node.upperBound as ComparableFilterLiteral,
      );
    case Op.IS_EMPTY:
      return filter.isEmpty(field);
    case Op.IS_EMPTY_STRING:
      return filter.isEmptyString(field);
    case Op.IS_NOT_EMPTY_STRING:
      return filter.isNotEmptyString(field);
    case Op.IS_NULL:
      return filter.isNull(field);
    case Op.IS_NOT_NULL:
      return filter.isNotNull(field);
    case Op.EXISTS:
      return filter.exists(field);
    case Op.NOT_EXISTS:
      return filter.notExists(field);
    case Op.DELETION:
      return filter.deletion(node.state!);
    case Op.ELEMENT_MATCH:
      return filter.elementMatch(
        field,
        node.predicate as ElementFilterExpression,
      );
    case Op.SEARCH:
      expression = filter.search(node.query!, {
        fields: node.fields,
        mode: node.mode,
      });
      break;
    case Op.TODAY:
      expression = filter.today(field, node);
      break;
    case Op.BEFORE_TODAY:
      expression = filter.beforeToday(field, node.time!, node);
      break;
    case Op.TOMORROW:
      expression = filter.tomorrow(field, node);
      break;
    case Op.THIS_WEEK:
      expression = filter.thisWeek(field, node);
      break;
    case Op.NEXT_WEEK:
      expression = filter.nextWeek(field, node);
      break;
    case Op.LAST_WEEK:
      expression = filter.lastWeek(field, node);
      break;
    case Op.THIS_MONTH:
      expression = filter.thisMonth(field, node);
      break;
    case Op.LAST_MONTH:
      expression = filter.lastMonth(field, node);
      break;
    case Op.YESTERDAY:
      expression = filter.yesterday(field, node);
      break;
    case Op.NEXT_MONTH:
      expression = filter.nextMonth(field, node);
      break;
    case Op.LAST_YEAR:
      expression = filter.lastYear(field, node);
      break;
    case Op.THIS_YEAR:
      expression = filter.thisYear(field, node);
      break;
    case Op.NEXT_YEAR:
      expression = filter.nextYear(field, node);
      break;
    case Op.RECENT_DAYS:
      expression = filter.recentDays(field, node.days as number, node);
      break;
    case Op.EARLIER_DAYS:
      expression = filter.earlierDays(field, node.days as number, node);
      break;
  }
  // Constructors supply defaults; loading or compiling an omitted option must not add it.
  for (const key of optionalParameters) {
    if (node[key] === undefined)
      delete (expression as unknown as Record<string, unknown>)[key];
  }
  return expression;
}

export function createFilterDraft(
  expression: DeepReadonly<FilterExpression>,
): FilterDraftNode {
  if (
    !expression ||
    typeof expression !== 'object' ||
    Array.isArray(expression)
  )
    throw new TypeError('过滤表达式必须是对象');
  const node: FilterDraftNode = {
    ...expression,
    id: crypto.randomUUID(),
  } as FilterDraftNode;
  const descriptor = checkShape(node);
  if (node.operands !== undefined) {
    if (!Array.isArray(node.operands))
      throw new TypeError('分组条件必须是数组');
    node.operands = Array.from(
      (expression as { operands: DeepReadonly<FilterExpression[]> }).operands,
      createFilterDraft,
    );
  }
  if (node.predicate !== undefined)
    node.predicate = createFilterDraft(
      (expression as { predicate: DeepReadonly<FilterExpression> }).predicate,
    );
  if (node.values !== undefined) {
    if (!Array.isArray(node.values)) throw new TypeError('集合值必须是数组');
    node.values = [...node.values];
  }
  if (node.fields !== undefined) {
    if (!Array.isArray(node.fields)) throw new TypeError('搜索字段必须是数组');
    node.fields = [...node.fields];
  }
  // No editor conversion here: remote objects are not protocol literals.
  if (descriptor.input === 'values' && !Array.isArray(node.values))
    throw new TypeError('缺少集合值');
  if (descriptor.category === 'logical' && !Array.isArray(node.operands))
    throw new TypeError('缺少分组条件');
  build(node as unknown as CompiledNode);
  return node;
}

export function newFilterDraft(op: Op, field?: string): FilterDraftNode {
  const descriptor = definition(op);
  const node: FilterDraftNode = {
    id: crypto.randomUUID(),
    op,
    ...(field === undefined ? {} : { field }),
  };
  if (descriptor.category === 'logical') node.operands = [];
  if (descriptor.category === 'element')
    node.predicate = newFilterDraft(Op.AND);
  if (op === Op.DELETION) node.state = DeletionState.ACTIVE;
  return node;
}

function numeric(value: unknown): number {
  if (
    typeof value === 'string' &&
    /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)
  )
    value = Number(value);
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError('请输入完整的有限数值');
  return value;
}

function dateParts(value: unknown): number[] {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new TypeError('日期格式应为 YYYY-MM-DD');
  const parts = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(parts[0], parts[1] - 1, parts[2]);
  if (
    date.getUTCFullYear() !== parts[0] ||
    date.getUTCMonth() !== parts[1] - 1 ||
    date.getUTCDate() !== parts[2]
  )
    throw new TypeError('日期不存在');
  return parts;
}

function datetime(value: unknown, timeZone?: string): number | undefined {
  if (typeof value === 'number') {
    if (
      !Number.isFinite(value) ||
      !Number.isFinite(new TZDate(value, timeZone).getTime())
    )
      throw new TypeError('日期时间戳无效');
    return value;
  }
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some(
      key => key !== 'date' && key !== 'time' && key !== 'offsetMinutes',
    )
  )
    throw new TypeError('请填写日期和时间');
  const { date, time, offsetMinutes } = value as FilterDateTimeValue;
  if (offsetMinutes !== undefined && !Number.isInteger(offsetMinutes))
    throw new TypeError('日期时间偏移必须是整数分钟');
  if (
    (date === undefined || date === '') &&
    (time === undefined || time === '')
  )
    return undefined;
  if (date === undefined || date === '' || time === undefined || time === '')
    throw new TypeError('请补全日期和时间');
  const [year, month, day] = dateParts(date);
  if (
    typeof time !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(time)
  )
    throw new TypeError('时间格式应为 HH:mm 或 HH:mm:ss');
  const [hour, minute, second = '0'] = time.split(':');
  const [seconds, fraction = ''] = second.split('.');
  const parts = [
    year,
    month - 1,
    day,
    Number(hour),
    Number(minute),
    Number(seconds),
    Number(fraction.padEnd(3, '0')),
  ];
  const zoned = new TZDate(0, timeZone);
  zoned.setFullYear(parts[0], parts[1], parts[2]);
  zoned.setHours(parts[3], parts[4], parts[5], parts[6]);
  const matchesParts = (candidate: Date) =>
    [
      candidate.getFullYear(),
      candidate.getMonth(),
      candidate.getDate(),
      candidate.getHours(),
      candidate.getMinutes(),
      candidate.getSeconds(),
      candidate.getMilliseconds(),
    ].every((part, index) => part === parts[index]);
  if (!Number.isFinite(zoned.getTime()) || !matchesParts(zoned))
    throw new TypeError('日期时间在指定时区不存在');
  if (offsetMinutes !== undefined) {
    const preferred = new TZDate(
      zoned.getTime() + (offsetMinutes - zoned.getTimezoneOffset()) * 60_000,
      timeZone,
    );
    if (matchesParts(preferred)) return preferred.getTime();
  }
  return zoned.getTime();
}

function scalar(
  value: unknown,
  field?: FilterFieldDefinition,
): FilterLiteral | undefined {
  if (value === undefined || value === null) return value;
  if (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'type' in value &&
    'value' in value
  ) {
    const typed = value as { type: string; value: unknown };
    if (Object.keys(value).some(key => key !== 'type' && key !== 'value'))
      throw new TypeError('标量编辑值无效');
    if (
      ['string', 'number', 'boolean'].includes(typed.type) &&
      typed.value === undefined
    )
      return undefined;
    if (typed.type === 'number') value = numeric(typed.value);
    else if (
      (typed.type === 'string' && typeof typed.value === 'string') ||
      (typed.type === 'boolean' && typeof typed.value === 'boolean')
    )
      value = typed.value;
    else throw new TypeError('标量类型与值不匹配');
  }
  if (field?.options) {
    if (!field.options.some(option => option.value === value))
      throw new TypeError('请选择定义中的枚举值');
  } else {
    switch (field?.type) {
      case 'number':
        if (typeof value !== 'number')
          throw new TypeError('请输入数值类型的值');
        break;
      case 'boolean':
        if (typeof value !== 'boolean') throw new TypeError('请选择布尔值');
        break;
      case 'string':
        if (typeof value !== 'string') throw new TypeError('请输入文本值');
        break;
      case 'date':
        dateParts(value);
        break;
      case 'datetime':
        return datetime(value, field.timeZone);
    }
  }
  if (
    typeof value !== 'string' &&
    typeof value !== 'boolean' &&
    !(typeof value === 'number' && Number.isFinite(value))
  )
    throw new TypeError('过滤值必须是有效标量');
  return value;
}

export function compileFilterDraft(
  draft: DeepReadonly<FilterDraftNode>,
  fields: readonly FilterFieldDefinition[],
  allowedOperators?: readonly Op[],
): FilterCompileResult {
  const errors: FilterValidationError[] = [];
  const visit = (
    node: DeepReadonly<FilterDraftNode>,
    scope: readonly FilterFieldDefinition[],
    element = false,
  ): FilterExpression | undefined => {
    try {
      const descriptor = checkShape(node);
      if (allowedOperators && !allowedOperators.includes(node.op))
        throw new TypeError(`当前视图不允许操作 ${node.op}`);
      if (
        element &&
        descriptor.category === 'root' &&
        node.op !== Op.MATCH_ALL &&
        node.op !== Op.MATCH_NONE
      )
        throw new TypeError('元素条件不能使用根级操作');
      const field = scope.find(candidate => candidate.field === node.field);
      if (
        descriptor.category === 'field' ||
        descriptor.category === 'element'
      ) {
        if (!field)
          throw new TypeError(
            `当前作用域没有字段 ${node.field ?? '（未指定）'}`,
          );
        filter.exists(field.field);
        if (!getFieldOperators(field).includes(node.op))
          throw new TypeError(`字段 ${field.label} 不支持操作 ${node.op}`);
      }
      if (descriptor.category === 'logical') {
        if (!Array.isArray(node.operands) || node.operands.length === 0)
          throw new TypeError('分组至少需要一个条件');
        const operands = Array.from(node.operands, child =>
          visit(child, scope, element),
        ).filter((child): child is FilterExpression => child !== undefined);
        return operands.length
          ? build({ ...node, operands, predicate: undefined })
          : undefined;
      }
      if (descriptor.category === 'element') {
        if (!node.predicate) throw new TypeError('请补全元素条件');
        const predicate = visit(node.predicate, field?.fields ?? [], true);
        return predicate
          ? build({ ...node, operands: undefined, predicate })
          : undefined;
      }
      const compiled: CompiledNode = {
        ...node,
        operands: undefined,
        predicate: undefined,
      };
      if (node.op === Op.SEARCH && node.fields !== undefined) {
        if (
          !Array.isArray(node.fields) ||
          Array.from(node.fields).some(
            name => !scope.some(candidate => candidate.field === name),
          )
        )
          throw new TypeError('搜索包含当前作用域没有的字段');
      }
      // Validate optional parameters even while the corresponding value is unset.
      if (stringOperators.includes(node.op)) build({ ...compiled, value: '' });
      if (descriptor.relativeTime)
        build({
          ...compiled,
          time: node.time ?? '00:00',
          days: node.days === undefined ? 1 : numeric(node.days),
        });
      if (node.op === Op.SEARCH)
        build({ ...compiled, query: node.query ?? '_' });
      switch (descriptor.input) {
        case 'value':
          compiled.value = scalar(
            node.value,
            stringOperators.includes(node.op) ? undefined : field,
          );
          if (compiled.value === undefined) return undefined;
          break;
        case 'values':
          if (node.values === undefined) return undefined;
          if (!Array.isArray(node.values))
            throw new TypeError('集合值必须是数组');
          if (node.values.length === 0) return undefined;
          compiled.values = Array.from(node.values, value => {
            const result = scalar(value, field);
            if (result === undefined) throw new TypeError('请补全集合中的值');
            return result;
          });
          break;
        case 'between': {
          const lower = scalar(node.lowerBound, field);
          const upper = scalar(node.upperBound, field);
          if (lower === undefined && upper === undefined) return undefined;
          if (lower === undefined || upper === undefined)
            throw new TypeError('请补全范围上下界');
          if (
            lower === null ||
            upper === null ||
            typeof lower !== typeof upper ||
            lower > upper
          )
            throw new TypeError('范围上下界类型必须相同且下界不能大于上界');
          compiled.lowerBound = lower;
          compiled.upperBound = upper;
          break;
        }
        case 'deletion':
          if (node.state === undefined) return undefined;
          break;
        case 'search':
          if (node.query === undefined) return undefined;
          break;
        case 'time':
          if (node.time === undefined) return undefined;
          break;
        case 'days':
          if (node.days === undefined) return undefined;
          compiled.days = numeric(node.days);
          break;
      }
      return build(compiled);
    } catch (error) {
      errors.push({
        id: node?.id ?? draft.id,
        message: error instanceof Error ? error.message : '过滤条件无效',
      });
      return undefined;
    }
  };
  const expression = visit(draft, fields);
  return errors.length
    ? { errors }
    : { expression: expression ?? filter.matchAll(), errors };
}

export function isSimpleFilter(draft: DeepReadonly<FilterDraftNode>): boolean {
  const ordinary = (node: DeepReadonly<FilterDraftNode>) =>
    Object.prototype.hasOwnProperty.call(FILTER_OPERATORS, node.op) &&
    FILTER_OPERATORS[node.op].category === 'field' &&
    typeof node.field === 'string' &&
    node.field.length > 0 &&
    node.operands === undefined &&
    node.predicate === undefined;
  return (
    draft.op === Op.MATCH_ALL ||
    ordinary(draft) ||
    (draft.op === Op.AND &&
      Array.isArray(draft.operands) &&
      draft.operands.length > 0 &&
      draft.operands.every(ordinary) &&
      new Set(draft.operands.map(node => node.field)).size ===
        draft.operands.length)
  );
}
