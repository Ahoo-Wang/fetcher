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

import { FilterOperator as Op } from '@ahoo-wang/fetcher-wow';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { compileFilterDraft } from '../src/filter/filterCore';
import type { FilterFieldDefinition } from '../src/filter/filterModel';
import { change, fields, mount, select } from './fixtures/filterValueEditor.js';

afterEach(cleanup);

it('preserves loaded string bounds and only wraps the numeric bound being edited', () => {
  const initial = {
    id: 'loaded-bounds',
    op: Op.BETWEEN,
    field: 'amount',
    lowerBound: '001',
    upperBound: '020',
  };
  const state = mount(initial);
  expect(state.changes).toEqual([]);
  expect(screen.getAllByRole('alert')).toHaveLength(2);
  change('金额上限', '030');
  expect(state.current()).toEqual({
    ...initial,
    upperBound: { type: 'number', value: '030' },
  });
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  change('金额下限', '002');
  expect(compileFilterDraft(state.current(), fields)).toEqual({
    expression: {
      op: Op.BETWEEN,
      field: 'amount',
      lowerBound: 2,
      upperBound: 30,
    },
    errors: [],
  });
});

it('preserves loaded string collection items and only wraps the edited numeric item', () => {
  const initial = {
    id: 'loaded-items',
    op: Op.IN,
    field: 'amount',
    values: ['001', 2],
  };
  const state = mount(initial);
  expect(state.changes).toEqual([]);
  expect(screen.getByRole('alert').textContent).toContain('不兼容');
  change('金额值2', '3');
  expect(state.current()).toEqual({
    ...initial,
    values: ['001', { type: 'number', value: '3' }],
  });
  change('金额值1', '002');
  expect(compileFilterDraft(state.current(), fields)).toEqual({
    expression: { op: Op.IN, field: 'amount', values: [2, 3] },
    errors: [],
  });
});

it('keeps incomplete collection entries and removes the last entry to an empty collection', async () => {
  const initial = { id: 'c', op: Op.IN, field: 'amount', values: [0, 2] };
  const state = mount(initial);
  change('金额值2', '-');
  expect(state.current().values).toEqual([0, { type: 'number', value: '-' }]);
  fireEvent.click(screen.getByRole('button', { name: '添加金额值' }));
  expect(state.current().values).toEqual([
    0,
    { type: 'number', value: '-' },
    undefined,
  ]);
  change('金额值3', '3');
  expect(state.current().values).toEqual([
    0,
    { type: 'number', value: '-' },
    { type: 'number', value: '3' },
  ]);
  for (const index of [3, 2, 1])
    fireEvent.click(screen.getByRole('button', { name: `删除金额值${index}` }));
  expect(state.current().values).toEqual([]);
  expect(initial.values).toEqual([0, 2]);
});

it('preserves mixed collection types and keeps the selected type after clearing a boolean', async () => {
  const field: FilterFieldDefinition = {
    field: 'tags',
    label: '标签',
    type: 'array',
  };
  const state = mount(
    {
      id: 'mixed',
      op: Op.CONTAINS_ALL,
      field: 'tags',
      values: [0, false, '0'],
    },
    field,
  );
  change('标签值1', '-');
  expect(state.current().values).toEqual([
    { type: 'number', value: '-' },
    false,
    '0',
  ]);
  expect(compileFilterDraft(state.current(), [field]).errors).toHaveLength(1);
  change('标签值1', '2');
  await select('标签值2', '清空选择');
  expect(
    screen.getByRole('combobox', { name: '标签值2类型' }).textContent,
  ).toContain('布尔');
  expect(state.current().values).toEqual([
    { type: 'number', value: '2' },
    { type: 'boolean', value: undefined },
    '0',
  ]);
  await select('标签值2', '否');
  expect(compileFilterDraft(state.current(), [field])).toEqual({
    expression: {
      op: Op.CONTAINS_ALL,
      field: 'tags',
      values: [2, false, '0'],
    },
    errors: [],
  });
});

it('edits between bounds independently without losing zero or a partial bound', () => {
  const state = mount({
    id: 'r',
    op: Op.BETWEEN,
    field: 'amount',
    lowerBound: 0,
    upperBound: 10,
  });
  change('金额上限', '');
  expect(state.current()).toMatchObject({
    lowerBound: 0,
    upperBound: { type: 'number', value: undefined },
  });
  change('金额下限', '-');
  expect(state.current()).toMatchObject({
    lowerBound: { type: 'number', value: '-' },
    upperBound: { type: 'number', value: undefined },
  });
});
