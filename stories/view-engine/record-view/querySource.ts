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
  filter,
  FilterOperator,
  SortDirection,
  type AggregationQuery,
  type CursorPage,
  type CursorQuery,
  type FilterExpression,
  type PagedList,
  type PagedQueryRequest,
} from '@ahoo-wang/fetcher-wow';
import type {
  RecordData,
  RecordKey,
  RecordQuerySource,
  FilterOptionSource,
} from '@ahoo-wang/fetcher-view-engine';
import type { DemoQuery, ScenarioOptions } from './demoTypes.js';
import { orders, pause } from './fixtures.js';

function matches(record: RecordData, expression: FilterExpression): boolean {
  switch (expression.op) {
    case FilterOperator.MATCH_ALL:
      return true;
    case FilterOperator.AND:
      return expression.operands.every(child => matches(record, child));
    case FilterOperator.OR:
      return expression.operands.some(child => matches(record, child));
    case FilterOperator.EQ:
      return record[expression.field] === expression.value;
    case FilterOperator.NE:
      return record[expression.field] !== expression.value;
    case FilterOperator.IN:
      return expression.values.some(
        value => value === record[expression.field],
      );
    case FilterOperator.NOT_IN:
      return !expression.values.some(
        value => value === record[expression.field],
      );
    case FilterOperator.BETWEEN: {
      const actual = record[expression.field];
      if (
        typeof actual !== 'number' ||
        typeof expression.lowerBound !== 'number' ||
        typeof expression.upperBound !== 'number'
      )
        throw new Error('演示服务的范围比较仅支持数值或时间戳。');
      return actual >= expression.lowerBound && actual <= expression.upperBound;
    }
    case FilterOperator.GT:
    case FilterOperator.GTE:
    case FilterOperator.LT:
    case FilterOperator.LTE: {
      const actual = record[expression.field];
      if (typeof actual !== 'number' || typeof expression.value !== 'number')
        throw new Error('演示服务的大小比较仅支持数值字段。');
      if (expression.op === FilterOperator.GT) return actual > expression.value;
      if (expression.op === FilterOperator.GTE)
        return actual >= expression.value;
      if (expression.op === FilterOperator.LT) return actual < expression.value;
      return actual <= expression.value;
    }
    default:
      throw new Error(`演示服务未实现操作 ${expression.op}。`);
  }
}

function compare(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number')
    return left - right;
  if (typeof left === 'string' && typeof right === 'string')
    return left.localeCompare(right, 'zh-CN');
  throw new Error('演示服务仅支持字符串和数值排序。');
}

export function createOrderSource(
  {
    empty = false,
    failFirstQuery = false,
    failFirstSummary = false,
  }: ScenarioOptions,
  onQuery: (method: 'paged' | 'cursor', request: DemoQuery) => void,
  onSummary: (query: AggregationQuery) => void,
) {
  let records = structuredClone(empty ? [] : orders);
  let failNext = failFirstQuery;
  let failNextSummary = failFirstSummary;
  let nextOrder = 1019;
  // ponytail: this small in-memory server supports only the operators advertised above; use a real QueryApi for production data.
  async function queryRecords(
    method: 'paged' | 'cursor',
    query: DemoQuery,
    abortController?: AbortController,
  ) {
    abortController?.signal.throwIfAborted();
    onQuery(method, structuredClone(query));
    await pause();
    abortController?.signal.throwIfAborted();
    if (failNext) {
      failNext = false;
      throw new Error('订单服务暂时不可用，请重试查询。');
    }
    if (!('filter' in query))
      throw new Error('演示服务只接收 Wow Filter 查询。');
    return records
      .filter(record => matches(record, query.filter))
      .sort((left, right) => {
        for (const sort of query.sort ?? []) {
          const result = compare(left[sort.field], right[sort.field]);
          if (result)
            return sort.direction === SortDirection.ASC ? result : -result;
        }
        return 0;
      });
  }

  const source: RecordQuerySource = {
    async aggregate<
      Row extends RecordData = RecordData,
      Fields extends string = string,
    >(
      query: AggregationQuery<string, Fields>,
      _attributes?: Record<string, unknown>,
      abortController?: AbortController,
    ): Promise<Row[]> {
      abortController?.signal.throwIfAborted();
      onSummary(structuredClone(query));
      await pause();
      abortController?.signal.throwIfAborted();
      if (failNextSummary) {
        failNextSummary = false;
        throw new Error('汇总服务暂时不可用，请重试汇总。');
      }
      if (query.groupBy?.length || query.elements?.length || query.sort?.length)
        throw new Error('演示服务仅支持无分组字段汇总');
      const matched = records.filter(record =>
        matches(record, query.filter ?? filter.matchAll()),
      );
      const result: RecordData = {};
      for (const metric of query.metrics) {
        if (metric.type !== 'NUMERIC' || metric.expression.type !== 'FIELD')
          throw new Error('演示服务仅支持数值字段汇总');
        const field = metric.expression.field;
        const values = matched
          .map(record => record[field])
          .filter(
            (value): value is number =>
              typeof value === 'number' && Number.isFinite(value),
          );
        if (!values.length) {
          result[metric.alias] = null;
          continue;
        }
        const sum = values.reduce((sum, value) => sum + value, 0);
        result[metric.alias] =
          metric.function === 'SUM'
            ? sum
            : metric.function === 'AVG'
              ? sum / values.length
              : metric.function === 'MIN'
                ? Math.min(...values)
                : Math.max(...values);
      }
      return [result as Row];
    },
    async paged<T extends Partial<RecordData> = RecordData>(
      query: PagedQueryRequest,
      _attributes?: Record<string, unknown>,
      abortController?: AbortController,
    ): Promise<PagedList<T>> {
      const result = await queryRecords('paged', query, abortController);
      const { index = 1, size = 5 } = query.pagination ?? {};
      return {
        total: result.length,
        list: structuredClone(
          result.slice((index - 1) * size, index * size),
        ) as T[],
      };
    },
    async cursor<T extends Partial<RecordData> = RecordData>(
      query: CursorQuery,
      _attributes?: Record<string, unknown>,
      abortController?: AbortController,
    ): Promise<CursorPage<T>> {
      const result = await queryRecords('cursor', query, abortController);
      const token = query.cursor?.match(/^orders:(\d+)$/);
      if (query.cursor && !token) throw new Error('无效的订单游标。');
      const offset = token ? Number(token[1]) : 0;
      const end = offset + (query.size ?? 5);
      return {
        list: structuredClone(result.slice(offset, end)) as T[],
        nextCursor: end < result.length ? `orders:${end}` : null,
      };
    },
  };
  return {
    source,
    customerOptions: {
      async search({ search, cursor, size = 3 }, signal) {
        signal.throwIfAborted();
        await pause();
        signal.throwIfAborted();
        const values = [
          ...new Set(records.map(record => String(record.customer))),
        ];
        const filtered = values.filter(value => value.includes(search));
        const offset = cursor ? Number(cursor) : 0;
        if (!Number.isSafeInteger(offset) || offset < 0)
          throw new Error('无效的客户游标。');
        return {
          list: filtered
            .slice(offset, offset + size)
            .map(value => ({ value, label: value })),
          nextCursor:
            offset + size < filtered.length ? String(offset + size) : null,
        };
      },
      async resolve(values, signal) {
        signal.throwIfAborted();
        await pause();
        signal.throwIfAborted();
        const available = new Set(records.map(record => record.customer));
        return {
          list: values
            .filter(value => available.has(value))
            .map(value => ({ value, label: String(value) })),
          missing: values.filter(value => !available.has(value)),
        };
      },
    } satisfies FilterOptionSource,
    createOrder() {
      const order = {
        ...structuredClone(orders[0]),
        id: `ORD-202609-${nextOrder++}`,
        customer: '新叶商贸',
        amount: 3200,
        status: 'pending',
        createdAt: Date.parse('2026-09-06T12:30:00+08:00'),
      };
      records.push(order);
      return order;
    },
    processOrders(keys: readonly RecordKey[]) {
      records = records.map(record =>
        keys.includes(String(record.id))
          ? { ...record, status: 'processing' }
          : record,
      );
    },
  };
}
