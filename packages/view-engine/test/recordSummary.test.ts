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

import { describe, expect, it, vi } from 'vitest';
import { ViewEngine } from '../src/record/ViewEngine.js';
import type {
  RecordSummaryFunction,
  ViewDefinition,
  ViewInstance,
} from '../src/record/recordModel.js';
import {
  getRecordSummaryFunctions,
  formatRecordNumber,
} from '../src/record/recordModel.js';
import {
  validateViewDefinition,
  validateViewInstance,
} from '../src/record/recordValidation.js';
import { aggregation, filter } from '@ahoo-wang/fetcher-wow';
import {
  calculateRecordSummary,
  createRecordSummaryQuery,
  readRecordSummaryResult,
} from '../src/record/recordSummary.js';
import type { RecordColumn } from '../src/record/recordModel.js';
const columns: RecordColumn[] = [
  { id: 'sum', kind: 'field', field: 'amount', summary: ['SUM'] },
  { id: 'avg', kind: 'field', field: 'amount', summary: ['AVG'] },
  { id: 'min', kind: 'field', field: 'amount', summary: ['MIN'] },
  { id: 'max', kind: 'field', field: 'amount', summary: ['MAX'] },
];
describe('record summaries', () => {
  it('formats numbers by field without changing calculation precision', () => {
    const field = { field: 'amount', label: '金额', type: 'number' as const };
    expect(formatRecordNumber(2025.3333333333333, field)).toBe('2,025.33');
    expect(
      formatRecordNumber(2025.3333333333333, {
        ...field,
        numberFormat: { style: 'currency', currency: 'CNY' },
      }),
    ).toBe('¥2,025.33');
    expect(
      formatRecordNumber(2025.3333333333333, {
        ...field,
        numberFormat: { style: 'currency', currency: 'JPY' },
      }),
    ).toBe('JP¥2,025');
    expect(
      formatRecordNumber(2.5, {
        ...field,
        numberFormat: { maximumFractionDigits: 0 },
      }),
    ).toBe('3');
    expect(
      formatRecordNumber(0.12345, {
        ...field,
        numberFormat: { style: 'percent', maximumFractionDigits: 2 },
      }),
    ).toBe('12.35%');
    expect(
      formatRecordNumber(1234.5, {
        ...field,
        numberFormat: { locale: 'de-DE', minimumFractionDigits: 4 },
      }),
    ).toBe('1.234,5000');
    expect(formatRecordNumber(0, field)).toBe('0');
  });
  it('keeps multiple metrics on one column distinct with stable query aliases', () => {
    const multiple: RecordColumn[] = [
      {
        id: 'amount',
        kind: 'field',
        field: 'amount',
        summary: ['SUM', 'AVG', 'MIN', 'MAX'],
      },
    ];
    const values = { amount: { SUM: 3, AVG: 1, MIN: -3, MAX: 6 } };
    expect(
      calculateRecordSummary(
        [{ amount: 0 }, { amount: 6 }, { amount: -3 }],
        multiple,
      ),
    ).toEqual(values);
    const query = createRecordSummaryQuery(filter.matchAll(), multiple);
    expect(query.metrics).toEqual([
      aggregation.avg(aggregation.field('amount'), 'summary0'),
      aggregation.max(aggregation.field('amount'), 'summary1'),
      aggregation.min(aggregation.field('amount'), 'summary2'),
      aggregation.sum(aggregation.field('amount'), 'summary3'),
    ]);
    expect(
      readRecordSummaryResult(
        [{ summary0: 1, summary1: 6, summary2: -3, summary3: 3 }],
        multiple,
      ),
    ).toEqual(values);
    expect(
      createRecordSummaryQuery(filter.matchAll(), [
        {
          ...multiple[0],
          kind: 'field',
          field: 'amount',
          summary: ['MAX', 'MIN', 'AVG', 'SUM'],
        },
      ]),
    ).toEqual(query);
  });
  it('summarizes visible page records with nulls and real zero kept distinct', () => {
    expect(
      calculateRecordSummary(
        [{ amount: 0 }, { amount: 6 }, { amount: -3 }, { amount: null }, {}],
        columns,
      ),
    ).toEqual({
      sum: { SUM: 3 },
      avg: { AVG: 1 },
      min: { MIN: -3 },
      max: { MAX: 6 },
    });
    expect(calculateRecordSummary([], columns)).toEqual({
      sum: { SUM: null },
      avg: { AVG: null },
      min: { MIN: null },
      max: { MAX: null },
    });
    expect(calculateRecordSummary([{ amount: 0 }], columns)).toMatchObject({
      sum: { SUM: 0 },
      avg: { AVG: 0 },
    });
    expect(() => calculateRecordSummary([{ amount: '12' }], columns)).toThrow();
    expect(() =>
      calculateRecordSummary([{ amount: Infinity }], columns),
    ).toThrow();
  });
  it('builds one ungrouped Wow query with stable safe aliases independent of column order and visibility', () => {
    const predicate = filter.gte('amount', 20);
    const query = createRecordSummaryQuery(predicate, columns);
    expect(query).toEqual({
      filter: predicate,
      metrics: [
        aggregation.avg(aggregation.field('amount'), 'summary0'),
        aggregation.max(aggregation.field('amount'), 'summary1'),
        aggregation.min(aggregation.field('amount'), 'summary2'),
        aggregation.sum(aggregation.field('amount'), 'summary3'),
      ],
    });
    expect(
      createRecordSummaryQuery(
        predicate,
        [...columns]
          .reverse()
          .map(column => ({ ...column, visible: false, width: 90 })),
      ),
    ).toEqual(query);
  });
  it('validates the complete aggregate response instead of substituting page totals or zero', () => {
    expect(
      readRecordSummaryResult(
        [{ summary0: 1, summary1: 6, summary2: -3, summary3: 3 }],
        columns,
      ),
    ).toEqual({
      avg: { AVG: 1 },
      max: { MAX: 6 },
      min: { MIN: -3 },
      sum: { SUM: 3 },
    });
    for (const value of [
      [],
      [{}],
      [{ summary0: Infinity }],
      [{ summary1: -1 }],
      [{ summary0: 1 }, { summary0: 2 }],
    ])
      expect(() => readRecordSummaryResult(value, columns)).toThrow();
    expect(
      readRecordSummaryResult(
        [
          {
            summary0: null,
            summary1: null,
            summary2: null,
            summary3: null,
          },
        ],
        columns,
      ),
    ).toEqual({
      avg: { AVG: null },
      max: { MAX: null },
      min: { MIN: null },
      sum: { SUM: null },
    });
  });
});

const definition: ViewDefinition = {
  id: 'orders',
  title: '订单',
  sourceId: 'orders',
  rowKey: 'id',
  fields: [
    { field: 'id', label: '编号', type: 'string' },
    { field: 'amount', label: '金额', type: 'number', sortable: true },
  ],
};
function setup() {
  const instance: ViewInstance = {
    id: 'mine',
    definitionId: 'orders',
    title: '我的订单',
    kind: 'record',
    scope: { type: 'personal' },
    config: {
      filter: filter.matchAll(),
      sort: [],
      pagination: { mode: 'paged', size: 2 },
      presentation: {
        layout: 'table',
        table: {
          columns: [
            { id: 'amount', kind: 'field', field: 'amount', summary: ['SUM'] },
            { id: 'id', kind: 'field', field: 'id' },
          ],
        },
      },
    },
  };
  const source = {
    paged: vi.fn().mockResolvedValue({
      list: [
        { id: 'a', amount: 2 },
        { id: 'b', amount: 3 },
      ],
      total: 3,
    }),
    cursor: vi.fn().mockResolvedValue({
      list: [{ id: 'a', amount: 2 }],
      nextCursor: 'next',
    }),
    aggregate: vi.fn().mockResolvedValue([{ summary0: 30 }]),
  };
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition,
    instances: { instances: [instance], defaultInstanceId: instance.id },
    host: { resolveSource: () => source },
  });
  return { engine, source, instance };
}
const session = (engine: ViewEngine) => engine.getSnapshot().sessions.mine;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

it('refreshes changed metric sets, ignores stale results and disables empty selections', async () => {
  const { engine, source } = setup();
  await engine.load();
  await vi.waitFor(() =>
    expect(session(engine).allSummary.status).toBe('success'),
  );
  const stale = deferred<unknown>();
  source.aggregate
    .mockReturnValueOnce(stale.promise)
    .mockResolvedValueOnce([{ summary0: 9, summary1: 30 }]);
  const setMetrics = (summary: RecordSummaryFunction[]) =>
    engine.setColumns(
      session(engine).instance.config.presentation.table.columns.map(column =>
        column.kind === 'field' && column.id === 'amount'
          ? { ...column, summary }
          : column,
      ),
    );
  setMetrics(['SUM', 'AVG']);
  expect(session(engine).pageSummary.values.amount).toEqual({
    SUM: 5,
    AVG: 2.5,
  });
  await vi.waitFor(() => expect(source.aggregate).toHaveBeenCalledTimes(2));
  setMetrics(['MAX', 'SUM']);
  expect(source.aggregate.mock.calls[1][2].signal.aborted).toBe(true);
  await vi.waitFor(() =>
    expect(session(engine).allSummary.values.amount).toEqual({
      MAX: 9,
      SUM: 30,
    }),
  );
  stale.resolve([{ summary0: 999, summary1: 999 }]);
  await Promise.resolve();
  expect(session(engine).allSummary.values.amount).toEqual({ MAX: 9, SUM: 30 });
  setMetrics(['SUM', 'MAX']);
  expect(source.aggregate).toHaveBeenCalledTimes(3);
  expect(source.paged).toHaveBeenCalledTimes(1);
  setMetrics([]);
  expect(session(engine).pageSummary.status).toBe('idle');
  expect(session(engine).allSummary.status).toBe('idle');
  engine.dispose();
});

it('rejects duplicate or unsupported selections and counts the total number of metrics', () => {
  const { engine, instance } = setup();
  const validate = (columns: unknown[]) =>
    validateViewInstance(
      {
        ...instance,
        config: {
          ...instance.config,
          presentation: { layout: 'table', table: { columns } },
        },
      },
      definition,
    );
  for (const summary of ['SUM', ['SUM', 'SUM'], ['COUNT'], [null]])
    expect(() =>
      validate([{ id: 'amount', kind: 'field', field: 'amount', summary }]),
    ).toThrow();
  expect(() =>
    validate([{ id: 'amount', kind: 'field', field: 'amount', summary: [] }]),
  ).not.toThrow();
  const all = Array.from({ length: 17 }, (_, index) => ({
    id: `amount${index}`,
    kind: 'field',
    field: 'amount',
    summary: ['SUM', 'AVG', 'MIN', 'MAX'],
  }));
  expect(() => validate(all.slice(0, 16))).not.toThrow();
  expect(() => validate(all)).toThrow('最多配置 64 个汇总指标');
  expect(() =>
    createRecordSummaryQuery(filter.matchAll(), all as RecordColumn[]),
  ).toThrow('汇总指标需要 1–64 项');
  engine.dispose();
});

it('loads page and all summaries together, preserving totals across page and presentation changes', async () => {
  const { engine, source } = setup();
  const total = deferred<unknown>();
  source.aggregate.mockReturnValueOnce(total.promise);
  await engine.load();
  expect(session(engine).pageSummary.values).toEqual({ amount: { SUM: 5 } });
  expect(session(engine).allSummary.status).toBe('loading');
  expect(source.aggregate).toHaveBeenCalledOnce();
  engine.setSelection(['a']);
  total.resolve([{ summary0: 30 }]);
  await vi.waitFor(() =>
    expect(session(engine).allSummary.status).toBe('success'),
  );
  expect(session(engine).allSummary.values).toEqual({ amount: { SUM: 30 } });
  expect(session(engine).selectedRowKeys).toEqual(['a']);
  expect(session(engine).dirty).toBe(false);
  expect(source.paged).toHaveBeenCalledTimes(1);
  expect(source.aggregate.mock.calls[0][0]).toEqual({
    filter: filter.matchAll(),
    metrics: [aggregation.sum(aggregation.field('amount'), 'summary0')],
  });
  const configured = session(engine).instance.config.presentation.table.columns;
  engine.setColumns(
    [...configured]
      .reverse()
      .map(column => ({ ...column, width: 90, visible: column.id === 'id' })),
  );
  await engine.setPage(2);
  expect(source.aggregate).toHaveBeenCalledTimes(1);
  await engine.applyFilter(filter.gte('amount', 2));
  await vi.waitFor(() => expect(source.aggregate).toHaveBeenCalledTimes(2));
  expect(source.aggregate.mock.calls[1][0].filter).toEqual(
    filter.gte('amount', 2),
  );
  engine.dispose();
});

it('isolates aggregation failure and retries only the summary', async () => {
  const { engine, source } = setup();
  source.aggregate.mockRejectedValueOnce(new Error('汇总服务不可用'));
  await engine.load();
  await vi.waitFor(() =>
    expect(session(engine).allSummary.status).toBe('error'),
  );
  expect(session(engine).queryStatus).toBe('success');
  expect(session(engine).rows).toHaveLength(2);
  expect(session(engine).pageSummary.values).toEqual({ amount: { SUM: 5 } });
  expect(source.aggregate).toHaveBeenCalledTimes(1);
  await engine.refreshSummary();
  expect(session(engine).allSummary.values.amount?.SUM).toBe(30);
  expect(source.paged).toHaveBeenCalledTimes(1);
  engine.dispose();
});

it('ignores old aggregate responses after filtering, removing summaries and disposal', async () => {
  const first = deferred<unknown>();
  const second = deferred<unknown>();
  const third = deferred<unknown>();
  const { engine, source } = setup();
  source.aggregate
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
    .mockReturnValueOnce(third.promise);
  await engine.load();
  await engine.applyFilter(filter.gte('amount', 10));
  await vi.waitFor(() => expect(source.aggregate).toHaveBeenCalledTimes(2));
  expect(source.aggregate.mock.calls[0][2].signal.aborted).toBe(true);
  second.resolve([{ summary0: 20 }]);
  await vi.waitFor(() =>
    expect(session(engine).allSummary.values.amount?.SUM).toBe(20),
  );
  first.resolve([{ summary0: 999 }]);
  await Promise.resolve();
  expect(session(engine).allSummary.values.amount?.SUM).toBe(20);
  const refresh = engine.refreshSummary();
  await vi.waitFor(() => expect(source.aggregate).toHaveBeenCalledTimes(3));
  engine.setColumns(
    session(engine).instance.config.presentation.table.columns.map(column => ({
      ...column,
      summary: undefined,
    })),
  );
  expect(source.aggregate.mock.calls[2][2].signal.aborted).toBe(true);
  expect(session(engine).pageSummary.status).toBe('idle');
  expect(session(engine).allSummary.status).toBe('idle');
  engine.dispose();
  const snapshot = engine.getSnapshot();
  third.resolve([{ summary0: 999 }]);
  await refresh;
  expect(engine.getSnapshot()).toBe(snapshot);
});

it('refreshes changed summary bindings but preserves totals on presentation changes', async () => {
  const { engine, source } = setup();
  await engine.load();
  await vi.waitFor(() =>
    expect(session(engine).allSummary.status).toBe('success'),
  );
  const cols = session(engine).instance.config.presentation.table.columns;
  engine.setColumns(
    cols.map(column =>
      column.id === 'amount' ? { ...column, id: 'amount2' } : column,
    ),
  );
  await vi.waitFor(() => expect(source.aggregate).toHaveBeenCalledTimes(2));
  await vi.waitFor(() =>
    expect(session(engine).allSummary.values.amount2?.SUM).toBe(30),
  );
  expect(session(engine).allSummary.values.amount).toBeUndefined();
  expect(source.paged).toHaveBeenCalledTimes(1);
  await engine.refresh();
  await vi.waitFor(() => expect(source.aggregate).toHaveBeenCalledTimes(3));
  engine.dispose();
});

it('offers only numeric summaries and rejects COUNT or nonnumeric field capabilities', () => {
  const { engine, instance } = setup();
  expect(getRecordSummaryFunctions(definition.fields[0])).toEqual([]);
  expect(getRecordSummaryFunctions(definition.fields[1])).toEqual([
    'SUM',
    'AVG',
    'MIN',
    'MAX',
  ]);
  expect(
    getRecordSummaryFunctions({
      field: 'enabled',
      label: '启用',
      type: 'boolean',
    }),
  ).toEqual([]);
  expect(
    getRecordSummaryFunctions({
      ...definition.fields[1],
      summaryFunctions: ['MAX'],
    }),
  ).toEqual(['MAX']);
  expect(() =>
    validateViewDefinition({
      ...definition,
      fields: [
        {
          field: 'id',
          label: '编号',
          type: 'string',
          summaryFunctions: ['SUM'],
        },
      ],
    }),
  ).toThrow();
  expect(() =>
    validateViewInstance(
      {
        ...instance,
        config: {
          ...instance.config,
          presentation: {
            layout: 'table',
            table: {
              columns: [
                { id: 'id', kind: 'field', field: 'id', summary: ['SUM'] },
              ],
            },
          },
        },
      },
      definition,
    ),
  ).toThrow();
  for (const field of ['id', 'amount'])
    expect(() =>
      validateViewInstance(
        {
          ...instance,
          config: {
            ...instance.config,
            presentation: {
              layout: 'table',
              table: {
                columns: [
                  { id: field, kind: 'field', field, summary: ['COUNT'] },
                ],
              },
            },
          },
        },
        definition,
      ),
    ).toThrow();
  expect(() =>
    validateViewInstance(instance, {
      ...definition,
      fields: [
        definition.fields[0],
        { ...definition.fields[1], summaryFunctions: [] },
      ],
    }),
  ).toThrow();
  engine.dispose();
});
