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
import { filter, FilterOperator as Op } from '@ahoo-wang/fetcher-wow';
import { expect, it } from 'vitest';
import { createFilterDraft } from '../src/filter/filterCore.js';
import {
  createFilterConfiguration,
  restoreFilterConfiguration,
  compileFilterConfiguration,
  validateFilterConfiguration,
  clearFilterDraftValues,
} from '../src/filter/filterConfiguration.js';
import type {
  FilterConfiguration,
  FilterDraftNode,
} from '../src/filter/filterModel.js';
import { fields } from './fixtures/filterCore.js';

it('round trips stable identities, unset controls, typed buffers and date/time attributes through JSON', () => {
  const draft: FilterDraftNode = {
    id: 'group',
    op: Op.AND,
    operands: [
      { id: 'unset', op: Op.EQ, field: 'amount' },
      {
        id: 'date',
        op: Op.GTE,
        field: 'created',
        value: { date: '2026-09-08', time: '09:00', offsetMinutes: -480 },
      },
      {
        id: 'typed',
        op: Op.EQ,
        field: 'items',
        value: { type: 'number', value: undefined },
      },
    ],
  };
  const config = createFilterConfiguration(draft, 'advanced', fields);
  const reloaded = JSON.parse(JSON.stringify(config)) as FilterConfiguration;
  expect(reloaded.root.operands?.map(node => node.id)).toEqual([
    'unset',
    'date',
    'typed',
  ]);
  expect(reloaded.root.operands?.[0].props).toEqual({});
  expect(reloaded.root.operands?.[1].props.value).toEqual(
    draft.operands?.[1].value,
  );
  expect(restoreFilterConfiguration(reloaded).operands?.[2].value).toEqual({
    type: 'number',
  });
  expect(compileFilterConfiguration(reloaded, fields).errors).toEqual([]);
});

it('serializes the chosen component and opaque props without deriving them from its expression', () => {
  const draft = {
    ...createFilterDraft(filter.eq('amount', 0)),
    editor: { name: 'custom', options: { compact: false } },
    props: { selected: 0, displayLabel: '', nullable: null, visible: false },
  };
  const config = createFilterConfiguration(draft, 'simple', fields);
  const result = restoreFilterConfiguration(JSON.parse(JSON.stringify(config)));
  expect(result.editor).toEqual(draft.editor);
  expect(result.props).toEqual(draft.props);
  expect(result.value).toBeUndefined();
  expect(compileFilterConfiguration(config, fields).expression).toBeUndefined();
  expect(() => validateFilterConfiguration(config, fields)).not.toThrow();
});

it('rejects values that JSON drops or changes, including sparse arrays and cyclic props', () => {
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  for (const value of [
    () => 1,
    new Date(),
    new Map(),
    NaN,
    Infinity,
    Symbol('value'),
    BigInt(1),
    [undefined],
    new Array(1),
    cycle,
  ]) {
    expect(() =>
      createFilterConfiguration({
        id: 'bad',
        op: Op.EQ,
        field: 'amount',
        editor: { name: 'custom' },
        props: { value },
      } as FilterDraftNode),
    ).toThrow();
  }
});

it('rejects malformed component references, field bindings and container shapes', () => {
  const base = createFilterConfiguration(
    createFilterDraft(filter.eq('amount', 1)),
  );
  for (const patch of [
    { component: { name: '' } },
    { component: 'custom' },
    { props: [] },
    { operator: 'BOGUS' },
    { operands: [] },
    { predicate: base.root },
    { field: undefined },
    { unexpected: true },
  ])
    expect(() =>
      validateFilterConfiguration({
        ...base,
        root: { ...base.root, ...patch },
      }),
    ).toThrow();
});

it('clears builtin and custom values while retaining components, IDs and non-query properties', () => {
  const draft: FilterDraftNode = {
    id: 'group',
    op: Op.AND,
    operands: [
      { id: 'builtin', op: Op.EQ, field: 'amount', value: 1 },
      {
        id: 'custom',
        op: Op.EQ,
        field: 'name',
        editor: { name: 'custom' },
        props: { selected: 'a', displayLabel: '姓名' },
      },
    ],
  };
  const cleared = clearFilterDraftValues(draft, fields, {
    custom: {
      compile: () => undefined,
      clear: props => ({ ...props, selected: undefined }),
    },
  });
  expect(cleared.id).toBe('group');
  expect(cleared.operands?.map(node => node.id)).toEqual(['builtin', 'custom']);
  expect(cleared.operands?.[0].value).toBeUndefined();
  expect(cleared.operands?.[1].props).toEqual({
    displayLabel: '姓名',
    selected: undefined,
  });
  expect(draft.operands?.[0].value).toBe(1);
});

it('rejects duplicate stable IDs and incompatible saved simple mode without changing the configuration', () => {
  const config = createFilterConfiguration(
    createFilterDraft(
      filter.or([filter.eq('amount', 1), filter.eq('amount', 2)]),
    ),
    'advanced',
  );
  expect(() =>
    validateFilterConfiguration({ ...config, mode: 'simple' }),
  ).toThrow();
  config.root.operands![1].id = config.root.operands![0].id;
  expect(() => validateFilterConfiguration(config)).toThrow();
});

it('rejects structural attributes hidden inside builtin props and extra array properties', () => {
  const config = createFilterConfiguration(
    createFilterDraft(filter.eq('amount', 1)),
  );
  for (const props of [
    { id: 'hidden' },
    { op: Op.NE },
    { field: 'name' },
    { operands: [] },
  ])
    expect(() =>
      validateFilterConfiguration({
        ...config,
        root: { ...config.root, props },
      }),
    ).toThrow();
  const values = Object.assign([1], { label: 'would be lost' });
  expect(() =>
    createFilterConfiguration({
      id: 'array',
      op: Op.IN,
      field: 'amount',
      values,
    }),
  ).toThrow();
});

it('keeps element and logical containers builtin when a field has a custom leaf default', () => {
  const draft = createFilterDraft(
    filter.elementMatch('items', filter.eq('quantity', 1)),
  );
  const config = createFilterConfiguration(
    draft,
    'advanced',
    fields.map(field => ({ ...field, editor: { name: 'custom' } })),
  );
  expect(config.root.component.name).toBe('builtin');
  expect(compileFilterConfiguration(config, fields).errors).toEqual([]);
});
