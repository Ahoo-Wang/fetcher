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
import { describe, expect, it } from 'vitest';
import {
  DeletionState,
  filter,
  FilterOperator as Op,
  SearchMode,
  StringComparison,
  TimeUnit,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import {
  compileFilterDraft,
  createFilterDraft,
  FILTER_OPERATORS,
  getFieldOperators,
  isSimpleFilter,
  newFilterDraft,
} from '../src/filter/filterCore';
import type {
  FilterDraftNode,
  FilterFieldDefinition,
} from '../src/filter/filterModel';

const fields: FilterFieldDefinition[] = [
  { field: 'name', label: '名称', type: 'string' },
  { field: 'amount', label: '金额', type: 'number' },
  { field: 'enabled', label: '启用', type: 'boolean' },
  { field: 'day', label: '日期', type: 'date' },
  {
    field: 'created',
    label: '时间',
    type: 'datetime',
    timeZone: 'Asia/Shanghai',
  },
  {
    field: 'items',
    label: '明细',
    type: 'array',
    fields: [{ field: 'quantity', label: '数量', type: 'number' }],
  },
  {
    field: 'status',
    label: '状态',
    options: [
      { value: 0, label: '零' },
      { value: false, label: '否' },
      { value: '', label: '空' },
    ],
  },
];
const calendar = [
  Op.TODAY,
  Op.TOMORROW,
  Op.THIS_WEEK,
  Op.NEXT_WEEK,
  Op.LAST_WEEK,
  Op.THIS_MONTH,
  Op.LAST_MONTH,
  Op.YESTERDAY,
  Op.NEXT_MONTH,
  Op.LAST_YEAR,
  Op.THIS_YEAR,
  Op.NEXT_YEAR,
] as const;
const expressions: FilterExpression[] = [
  filter.matchAll(),
  filter.matchNone(),
  filter.id('001'),
  filter.ids(['001', '002']),
  filter.aggregateId('001'),
  filter.aggregateIds(['001']),
  filter.tenantId('01'),
  filter.ownerId('02'),
  filter.spaceId('03'),
  filter.and([filter.eq('amount', 0)]),
  filter.or([filter.eq('name', '')]),
  filter.nor([filter.eq('enabled', false)]),
  filter.eq('amount', null),
  filter.ne('name', null),
  filter.gt('amount', 1),
  filter.gte('amount', 1),
  filter.lt('amount', 2),
  filter.lte('amount', 2),
  { op: Op.CONTAINS, field: 'name', value: '' },
  {
    op: Op.STARTS_WITH,
    field: 'name',
    value: 'a',
    stringComparison: StringComparison.CASE_INSENSITIVE,
  },
  { op: Op.ENDS_WITH, field: 'name', value: 'z' },
  filter.isIn('amount', [0, 2]),
  filter.notIn('enabled', [false]),
  filter.between('amount', 0, 10),
  filter.containsAll('items', ['a', 0, false]),
  filter.isEmpty('items'),
  filter.isEmptyString('name'),
  filter.isNotEmptyString('name'),
  filter.isNull('amount'),
  filter.isNotNull('amount'),
  filter.exists('name'),
  filter.notExists('name'),
  filter.deletion(DeletionState.ALL),
  filter.elementMatch('items', filter.and([filter.gt('quantity', 0)])),
  { op: Op.SEARCH, query: '订单' },
  ...calendar.map(op => ({ op, field: 'created' })),
  {
    op: Op.BEFORE_TODAY,
    field: 'created',
    time: '12:30:59.123456789',
    zoneId: 'Asia/Shanghai',
    datePattern: 'yyyy-MM-dd',
    timeUnit: TimeUnit.SECONDS,
  },
  { op: Op.RECENT_DAYS, field: 'created', days: 7 },
  { op: Op.EARLIER_DAYS, field: 'created', days: 1 },
];
const compile = (node: FilterDraftNode, definitions = fields) =>
  compileFilterDraft(node, definitions);
function node(
  op: Op,
  field?: string,
  values: Partial<FilterDraftNode> = {},
): FilterDraftNode {
  return {
    id: 'draft',
    op,
    ...(field === undefined ? {} : { field }),
    ...values,
  };
}

describe('filter compiler', () => {
  it('compiles repeated AND fields but keeps them out of simple mode, including unset values', () => {
    for (const value of [undefined, 2]) {
      const draft: FilterDraftNode = {
        id: 'and',
        op: Op.AND,
        operands: [
          { id: 'first', op: Op.GTE, field: 'amount', value: 1 },
          { id: 'second', op: Op.LTE, field: 'amount', value },
        ],
      };
      expect(compile(draft)).toEqual({
        expression: filter.and([
          filter.gte('amount', 1),
          ...(value === undefined ? [] : [filter.lte('amount', value)]),
        ]),
        errors: [],
      });
      expect(isSimpleFilter(draft)).toBe(false);
    }
  });
  it('keeps OR/NOR branches and separate nested groups independent', () => {
    for (const expression of [
      filter.or([filter.eq('amount', 1), filter.eq('amount', 2)]),
      filter.nor([filter.eq('amount', 1), filter.eq('amount', 2)]),
      filter.and([
        filter.and([filter.gte('amount', 1)]),
        filter.and([filter.lte('amount', 2)]),
      ]),
      filter.and([
        filter.eq('amount', 1),
        filter.elementMatch('items', filter.eq('quantity', 1)),
      ]),
    ])
      expect(compile(createFilterDraft(expression))).toEqual({
        expression,
        errors: [],
      });
    const element = filter.elementMatch(
      'items',
      filter.and([filter.eq('quantity', 1), filter.eq('quantity', 2)]),
    );
    expect(compile(createFilterDraft(element))).toEqual({
      expression: element,
      errors: [],
    });
  });
  it('covers all 50 Wow operators without inserting optional defaults', () => {
    expect(new Set(expressions.map(value => value.op)).size).toBe(50);
    expect(Object.keys(FILTER_OPERATORS).sort()).toEqual(
      Object.values(Op).sort(),
    );
    for (const expression of expressions) {
      const result = compile(createFilterDraft(expression));
      expect(result.errors, expression.op).toEqual([]);
      expect(result.expression, expression.op).toStrictEqual(expression);
    }
  });
  it('keeps nested order, single-child wrappers, explicit options and independent draft ids', () => {
    const expression = filter.and([
      filter.or([
        filter.search('词', { fields: ['name'], mode: SearchMode.PHRASE }),
      ]),
      filter.nor([
        filter.today('created', {
          zoneId: '+08:00',
          datePattern: 'yyyy-MM-dd',
          timeUnit: TimeUnit.DAYS,
        }),
      ]),
    ]);
    const draft = createFilterDraft(expression);
    expect(draft.id).not.toBe(createFilterDraft(expression).id);
    expect(draft.operands![0].id).not.toBe(draft.id);
    expect(compile(draft).expression).toStrictEqual(expression);
    draft.operands![0].operands![0].fields!.push('amount');
    expect(expression.operands[0]).toEqual(
      filter.or([
        filter.search('词', { fields: ['name'], mode: SearchMode.PHRASE }),
      ]),
    );
  });
  it.each([
    ['amount', null],
    ['amount', 0],
    ['enabled', false],
    ['name', ''],
    ['status', 0],
    ['status', false],
    ['status', ''],
  ] as const)('preserves explicit %s value %s', (field, value) => {
    expect(compile(node(Op.EQ, field, { value })).expression).toEqual({
      op: Op.EQ,
      field,
      value,
    });
  });
  it('coerces only explicit numeric editor drafts and leaves enum values typed', () => {
    expect(
      compile(
        node(Op.EQ, 'amount', { value: { type: 'number', value: '-1.25e2' } }),
      ).expression,
    ).toEqual(filter.eq('amount', -125));
    expect(
      compile(node(Op.IN, 'status', { values: [0, false, ''] })).expression,
    ).toEqual(filter.isIn('status', [0, false, '']));
    expect(compile(node(Op.EQ, 'status', { value: '0' })).errors).not.toEqual(
      [],
    );
  });
  it.each([
    '',
    ' ',
    '-',
    '1.',
    '1e',
    '12abc',
    '0x10',
    'Infinity',
    Infinity,
    NaN,
    {},
    true,
  ])('rejects invalid number %s', value => {
    expect(
      compile(node(Op.EQ, 'amount', { value: { type: 'number', value } }))
        .errors,
    ).not.toEqual([]);
  });
  it.each([
    { op: Op.EQ, field: 'amount', value: '001' },
    { op: Op.IN, field: 'amount', values: ['001', '002'] },
    { op: Op.BETWEEN, field: 'amount', lowerBound: '001', upperBound: '002' },
  ] as FilterExpression[])(
    'does not reinterpret loaded strings as numbers for $op',
    expression => {
      const draft = createFilterDraft(expression);
      const before = structuredClone(draft);
      const result = compile(draft);
      expect(result.errors).not.toEqual([]);
      expect(result.expression).toBeUndefined();
      expect(draft).toEqual(before);
      expect(
        compile(draft, [{ field: 'amount', label: '编码', type: 'string' }])
          .expression,
      ).toStrictEqual(expression);
    },
  );
  it('converts explicit number wrappers for numeric collection entries', () => {
    expect(
      compile(
        node(Op.IN, 'amount', {
          values: [
            { type: 'number', value: '001' },
            { type: 'number', value: '0' },
          ],
        }),
      ).expression,
    ).toEqual({ op: Op.IN, field: 'amount', values: [1, 0] });
  });
  it('creates unset values and explicitly empty groups', () => {
    expect(compile(newFilterDraft(Op.EQ, 'amount')).expression).toEqual(
      filter.matchAll(),
    );
    expect(newFilterDraft(Op.AND).operands).toEqual([]);
    expect(
      newFilterDraft(Op.ELEMENT_MATCH, 'items').predicate?.operands,
    ).toEqual([]);
    expect(compile(newFilterDraft(Op.AND)).errors).not.toEqual([]);
    expect(
      compile(newFilterDraft(Op.ELEMENT_MATCH, 'items')).errors,
    ).not.toEqual([]);
  });
  it.each([Op.OR, Op.NOR, Op.AND])(
    'prunes inactive %s children before composing, retaining wrappers',
    op => {
      const draft = node(op, undefined, {
        operands: [
          node(Op.EQ, 'amount'),
          node(Op.EQ, 'enabled', { value: false }),
        ],
      });
      expect(compile(draft).expression).toEqual({
        op,
        operands: [filter.eq('enabled', false)],
      });
      draft.operands!.pop();
      expect(compile(draft).expression).toEqual(filter.matchAll());
    },
  );
  it('prunes wholly inactive nested groups and element predicates', () => {
    const draft = node(Op.OR, undefined, {
      operands: [
        node(Op.ELEMENT_MATCH, 'items', {
          predicate: node(Op.AND, undefined, {
            operands: [node(Op.EQ, 'quantity')],
          }),
        }),
        node(Op.NOR, undefined, { operands: [node(Op.EQ, 'amount')] }),
        node(Op.EQ, 'name', { value: 'a' }),
      ],
    });
    expect(compile(draft).expression).toEqual(
      filter.or([filter.eq('name', 'a')]),
    );
  });
  it('rejects partial, reversed, mixed-type and invalid ranges', () => {
    expect(compile(node(Op.BETWEEN, 'amount')).expression).toEqual(
      filter.matchAll(),
    );
    for (const bounds of [
      { lowerBound: 0 },
      { upperBound: 0 },
      { lowerBound: 2, upperBound: 1 },
      { lowerBound: '', upperBound: 2 },
      { lowerBound: null, upperBound: 2 },
    ]) {
      expect(compile(node(Op.BETWEEN, 'amount', bounds)).errors).not.toEqual(
        [],
      );
    }
    expect(
      compile(
        node(Op.BETWEEN, 'amount', {
          lowerBound: { type: 'number', value: '0' },
          upperBound: { type: 'number', value: '2' },
        }),
      ).expression,
    ).toEqual(filter.between('amount', 0, 2));
  });
  it('treats cleared draft collections as unset but rejects incomplete entries and empty wire collections', () => {
    expect(compile(node(Op.IN, 'amount')).expression).toEqual(
      filter.matchAll(),
    );
    expect(compile(node(Op.IN, 'amount', { values: [] })).expression).toEqual(
      filter.matchAll(),
    );
    expect(() =>
      createFilterDraft({ op: Op.IN, field: 'amount', values: [] }),
    ).toThrow();
    for (const values of [[1, undefined], [1, null], ['']])
      expect(compile(node(Op.IN, 'amount', { values })).errors).not.toEqual([]);
  });
  it('validates fields, capabilities and element relative scope even for unset values', () => {
    for (const draft of [
      node(Op.EQ, 'missing'),
      node(Op.EQ),
      node('BOGUS' as Op),
      node(Op.CONTAINS, 'amount', { value: 'x' }),
      node(Op.ELEMENT_MATCH, 'items', {
        predicate: node(Op.EQ, 'amount', { value: 1 }),
      }),
      node(Op.ELEMENT_MATCH, 'items', {
        predicate: node(Op.ID, undefined, { value: 'x' }),
      }),
    ])
      expect(compile(draft).errors).not.toEqual([]);
    expect(
      compileFilterDraft(node(Op.EQ, 'amount'), fields, [Op.NE]).errors,
    ).not.toEqual([]);
    expect(
      compile(node(Op.EQ, 'amount'), [
        { field: 'amount', label: '金额', type: 'number', operators: [Op.GT] },
      ]).errors,
    ).not.toEqual([]);
    expect(
      compile(node(Op.SEARCH, undefined, { query: 'x', fields: ['missing'] }))
        .errors,
    ).not.toEqual([]);
    expect(getFieldOperators(fields[1])).not.toContain(Op.CONTAINS);
    expect(getFieldOperators({ ...fields[1], operators: [Op.EQ] })).toEqual([
      Op.EQ,
    ]);
  });
  it('omits a cleared deletion draft but rejects invalid states and missing wire states', () => {
    const cleared = node(Op.DELETION, undefined, { state: undefined });
    expect(compileFilterDraft(cleared, [])).toEqual({
      expression: { op: Op.MATCH_ALL },
      errors: [],
    });
    expect(
      compile(
        node(Op.OR, undefined, {
          operands: [cleared, node(Op.EQ, 'amount', { value: 0 })],
        }),
      ).expression,
    ).toEqual({
      op: Op.OR,
      operands: [{ op: Op.EQ, field: 'amount', value: 0 }],
    });
    for (const state of ['', 'BAD', null, 0, false]) {
      expect(
        compileFilterDraft(
          node(Op.DELETION, undefined, { state: state as DeletionState }),
          [],
        ).errors,
      ).not.toEqual([]);
    }
    expect(() =>
      createFilterDraft({ op: Op.DELETION } as FilterExpression),
    ).toThrow();
  });
  it('does not silently ignore invalid optional parameters or invalid special values', () => {
    for (const draft of [
      node(Op.SEARCH, undefined, { query: '' }),
      node(Op.SEARCH, undefined, { query: 'x', mode: 'BAD' as SearchMode }),
      node(Op.DELETION, undefined, { state: 'BAD' as DeletionState }),
      node(Op.ID, undefined, { value: 0 }),
      node(Op.TODAY, 'created', { timeUnit: 'BAD' as TimeUnit }),
      node(Op.TODAY, 'created', { zoneId: '' }),
      node(Op.BEFORE_TODAY, 'created', { time: '25:00' }),
      node(Op.RECENT_DAYS, 'created', { days: '1.5' }),
      node(Op.CONTAINS, 'name', {
        value: 'x',
        stringComparison: 'BAD' as StringComparison,
      }),
    ])
      expect(compile(draft).errors).not.toEqual([]);
  });
  it('outputs real date strings and rejects calendar normalization', () => {
    expect(
      compile(node(Op.EQ, 'day', { value: '2024-02-29' })).expression,
    ).toEqual(filter.eq('day', '2024-02-29'));
    for (const value of [
      '2023-02-29',
      '2024-02-30',
      '2024-13-01',
      '2024-2-01',
      '',
    ])
      expect(compile(node(Op.EQ, 'day', { value })).errors).not.toEqual([]);
  });
  it('keeps epoch zero and converts datetime parts using field timezone', () => {
    expect(compile(node(Op.EQ, 'created', { value: 0 })).expression).toEqual(
      filter.eq('created', 0),
    );
    expect(
      compile(
        node(Op.EQ, 'created', {
          value: { date: '1970-01-01', time: '08:00' },
        }),
      ).expression,
    ).toEqual(filter.eq('created', 0));
    expect(compile(node(Op.EQ, 'created', { value: {} })).expression).toEqual(
      filter.matchAll(),
    );
    expect(
      compile(node(Op.EQ, 'created', { value: { date: '', time: '' } }))
        .expression,
    ).toEqual(filter.matchAll());
    for (const value of [
      { date: '2024-01-01' },
      { time: '12:00' },
      { date: '2024-02-30', time: '12:00' },
      { date: '2024-01-01', time: '25:00' },
    ])
      expect(compile(node(Op.EQ, 'created', { value })).errors).not.toEqual([]);
  });
  it('rejects DST gaps and invalid zones while handling real zoned dates', () => {
    const zoned = [
      {
        field: 'created',
        label: '时间',
        type: 'datetime' as const,
        timeZone: 'America/New_York',
      },
    ];
    expect(
      compile(
        node(Op.EQ, 'created', {
          value: { date: '2024-03-10', time: '02:30' },
        }),
        zoned,
      ).errors,
    ).not.toEqual([]);
    expect(
      compile(
        node(Op.EQ, 'created', {
          value: { date: '2024-03-10', time: '03:30' },
        }),
        zoned,
      ).expression,
    ).toEqual(filter.eq('created', 1710055800000));
    expect(
      compile(
        node(Op.EQ, 'created', {
          value: { date: '2024-01-01', time: '12:00' },
        }),
        [{ ...zoned[0], timeZone: 'Bad/Zone' }],
      ).errors,
    ).not.toEqual([]);
  });
  it.each([
    ['2026-11-01', '01:30', 240, 1793511000000],
    ['2026-11-01', '01:30', 300, 1793514600000],
    ['2026-11-01', '01:45:12.345', 240, 1793511912345],
    ['2026-11-01', '01:45:12.345', 300, 1793515512345],
    ['2026-11-01', '01:30', undefined, 1793511000000],
    ['2026-07-01', '01:30', 300, 1782883800000],
    ['2026-12-01', '01:30', 240, 1796106600000],
  ])(
    'uses an applicable offset hint for %s %s (offset %s)',
    (date, time, offsetMinutes, timestamp) => {
      expect(
        compile(
          node(Op.EQ, 'created', {
            value: { date, time, offsetMinutes },
          }),
          [{ ...fields[4], timeZone: 'America/New_York' }],
        ),
      ).toEqual({
        expression: { op: Op.EQ, field: 'created', value: timestamp },
        errors: [],
      });
    },
  );
  it('rejects DST gaps and malformed datetime offset hints', () => {
    const zoned = [{ ...fields[4], timeZone: 'America/New_York' }];
    for (const value of [
      { date: '2026-03-08', time: '02:30', offsetMinutes: 240 },
      { date: '2026-03-08', time: '02:30', offsetMinutes: 300 },
      ...[NaN, Infinity, -Infinity, '300', null, {}, 300.5].map(
        offsetMinutes => ({
          date: '2026-11-01',
          time: '01:30',
          offsetMinutes,
        }),
      ),
      { offsetMinutes: NaN },
    ]) {
      const result = compile(node(Op.EQ, 'created', { value }), zoned);
      expect(result.expression).toBeUndefined();
      expect(result.errors).toEqual([
        { id: 'draft', message: expect.any(String) },
      ]);
    }
  });
  it.each([
    { op: Op.EQ, field: 'created', value: 0 },
    { op: Op.IN, field: 'created', values: [0] },
    { op: Op.BETWEEN, field: 'created', lowerBound: 0, upperBound: 1 },
  ] as FilterExpression[])(
    'validates the timezone of loaded numeric datetime values for $op',
    expression => {
      const draft = createFilterDraft(expression);
      const invalid = compile(draft, [
        {
          field: 'created',
          label: '时间',
          type: 'datetime',
          timeZone: 'Bad/Zone',
        },
      ]);
      expect(invalid.errors).not.toEqual([]);
      expect(invalid.expression).toBeUndefined();
      for (const timeZone of ['Asia/Shanghai', '+08:00', undefined]) {
        expect(
          compile(draft, [
            { field: 'created', label: '时间', type: 'datetime', timeZone },
          ]),
        ).toEqual({ expression, errors: [] });
      }
    },
  );
  it('compiles typed scalar editor drafts while preserving their actual scalar types', () => {
    expect(
      compile(
        node(Op.CONTAINS_ALL, 'items', {
          values: [
            { type: 'number', value: '0' },
            { type: 'string', value: '0' },
            { type: 'boolean', value: false },
          ],
        }),
      ).expression,
    ).toEqual(filter.containsAll('items', [0, '0', false]));
    for (const value of [
      { type: 'number', value: '1e' },
      { type: 'number', value: '' },
      { type: 'boolean', value: 'false' },
      { type: 'object', value: '{}' },
    ])
      expect(
        compile(node(Op.CONTAINS_ALL, 'items', { values: [value] })).errors,
      ).not.toEqual([]);
  });
  it('keeps typed scalar selection when its value is cleared, but blocks partial collection entries', () => {
    for (const type of ['number', 'string', 'boolean']) {
      expect(
        compile(node(Op.EQ, 'items', { value: { type, value: undefined } }))
          .expression,
      ).toEqual(filter.matchAll());
      expect(
        compile(
          node(Op.CONTAINS_ALL, 'items', {
            values: [{ type, value: undefined }],
          }),
        ).errors,
      ).not.toEqual([]);
    }
    expect(
      compile(
        node(Op.EQ, 'items', { value: { type: 'unknown', value: undefined } }),
      ).errors,
    ).not.toEqual([]);
  });
  it('allows partial string matching on enum fields without allowing unknown equality values', () => {
    const enumFields: FilterFieldDefinition[] = [
      {
        field: 'name',
        label: '名称',
        type: 'string',
        options: [{ value: 'pending', label: '待处理' }],
      },
    ];
    expect(
      compile(node(Op.STARTS_WITH, 'name', { value: 'pend' }), enumFields)
        .expression,
    ).toEqual({ op: Op.STARTS_WITH, field: 'name', value: 'pend' });
    expect(
      compile(node(Op.EQ, 'name', { value: 'pend' }), enumFields).errors,
    ).not.toEqual([]);
  });
  it('rejects sparse collection entries, search fields and logical operands', () => {
    const sparse = new Array(1);
    for (const draft of [
      node(Op.IN, 'name', { values: sparse }),
      node(Op.SEARCH, undefined, { query: 'x', fields: sparse }),
      node(Op.AND, undefined, { operands: sparse }),
    ])
      expect(compile(draft).errors).not.toEqual([]);
    expect(() => createFilterDraft({ op: Op.AND, operands: sparse })).toThrow();
  });
  it('rejects invalid wire expressions before creating editable drafts', () => {
    for (const expression of [
      { op: Op.EQ, field: 'amount', value: { type: 'number', value: '1' } },
      {
        op: Op.EQ,
        field: 'created',
        value: { date: '2024-01-01', time: '12:00' },
      },
      { op: Op.EQ, field: 'amount' },
      { op: Op.AND, operands: [] },
      {
        op: Op.IN,
        field: 'amount',
        values: [1, { type: 'number', value: '2' }],
      },
      {
        op: Op.BETWEEN,
        field: 'amount',
        lowerBound: 1,
        upperBound: { type: 'number', value: '2' },
      },
      { op: Op.RECENT_DAYS, field: 'created', days: '1' },
      { op: Op.EQ, field: 'amount', value: 1, query: 'unexpected' },
      {
        op: Op.ELEMENT_MATCH,
        field: 'items',
        predicate: { op: Op.ID, value: 'x' },
      },
    ])
      expect(() => createFilterDraft(expression as FilterExpression)).toThrow();
  });
  it('validates the protocol field path before omitting an unset predicate', () => {
    const invalidFields: FilterFieldDefinition[] = [
      { field: 'bad field', label: '错误字段', type: 'number' },
    ];
    expect(compile(node(Op.EQ, 'bad field'), invalidFields).errors).not.toEqual(
      [],
    );
  });
  it('validates malformed operands, search scope and extraneous operator parameters', () => {
    for (const draft of [
      node(Op.AND, undefined, { operands: undefined }),
      node(Op.EQ, 'name', { value: 'x', query: 'ignored' }),
      node(Op.SEARCH, undefined, {
        query: 'x',
        fields: null as unknown as string[],
      }),
      node(Op.CONTAINS, 'name', {
        stringComparison: 'BAD' as StringComparison,
      }),
    ])
      expect(compile(draft).errors).not.toEqual([]);
  });
  it('retains every explicit relative-time and string/search option combination', () => {
    for (const expression of [
      filter.contains('name', '', StringComparison.CASE_SENSITIVE),
      { op: Op.SEARCH, query: 'x', fields: [] },
      { op: Op.SEARCH, query: 'x', mode: SearchMode.TERMS },
      ...calendar.map(op => ({
        op,
        field: 'created',
        zoneId: 'Europe/London',
        datePattern: 'yyyy-MM-dd',
        timeUnit: TimeUnit.SECONDS,
      })),
    ] as FilterExpression[])
      expect(compile(createFilterDraft(expression)).expression).toStrictEqual(
        expression,
      );
  });
  it('keeps local datetime behavior when no field timezone is specified', () => {
    const local = [
      { field: 'created', label: '时间', type: 'datetime' as const },
    ];
    const expected = new Date(2024, 0, 15, 12, 30, 59, 123).getTime();
    expect(
      compile(
        node(Op.EQ, 'created', {
          value: { date: '2024-01-15', time: '12:30:59.123' },
        }),
        local,
      ).expression,
    ).toEqual(filter.eq('created', expected));
  });
  it('recognizes only root match-all, field predicates and flat AND as simple', () => {
    expect(isSimpleFilter(newFilterDraft(Op.MATCH_ALL))).toBe(true);
    expect(isSimpleFilter(node(Op.EQ, 'amount'))).toBe(true);
    expect(
      isSimpleFilter(
        node(Op.AND, undefined, {
          operands: [node(Op.EQ, 'amount'), node(Op.EQ, 'name')],
        }),
      ),
    ).toBe(true);
    for (const draft of [
      node(Op.MATCH_NONE),
      node(Op.ID),
      node(Op.OR, undefined, { operands: [node(Op.EQ, 'amount')] }),
      node(Op.AND, undefined, {
        operands: [
          node(Op.AND, undefined, { operands: [node(Op.EQ, 'amount')] }),
        ],
      }),
      node(Op.ELEMENT_MATCH, 'items'),
      node(Op.EQ),
    ])
      expect(isSimpleFilter(draft)).toBe(false);
  });
});
