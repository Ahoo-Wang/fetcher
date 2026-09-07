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
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { FilterValueEditor } from '../src/filter/FilterValueEditor';
import { compileFilterDraft } from '../src/filter/filterCore';
import type {
  FilterDraftNode,
  FilterFieldDefinition,
} from '../src/filter/filterModel';
import { change, fields, mount, select } from './fixtures/filterValueEditor.js';

afterEach(cleanup);

it('keeps invalid numeric input raw and preserves the bound node', () => {
  const initial = {
    id: 'a',
    op: Op.EQ,
    field: 'amount',
    value: 0,
    zoneId: 'UTC',
  };
  const state = mount(initial);
  expect(
    (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement).value,
  ).toBe('0');
  change('金额值', '-');
  expect(state.current()).toEqual({
    ...initial,
    value: { type: 'number', value: '-' },
  });
  expect(initial.value).toBe(0);
  change('金额值', '');
  expect(state.current().value).toEqual({ type: 'number', value: undefined });
});

it('preserves a loaded numeric-looking string until an explicit numeric edit', () => {
  const initial = {
    id: 'loaded-string',
    op: Op.EQ,
    field: 'amount',
    value: '001',
  };
  const state = mount(initial);
  expect(
    (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement).value,
  ).toBe('001');
  expect(screen.getByRole('alert').textContent).toContain('不兼容');
  expect(state.changes).toEqual([]);
  expect(state.current().value).toBe('001');
  change('金额值', '002');
  expect(state.current()).toEqual({
    ...initial,
    value: { type: 'number', value: '002' },
  });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(compileFilterDraft(state.current(), fields)).toEqual({
    expression: { op: Op.EQ, field: 'amount', value: 2 },
    errors: [],
  });
});

it.each([undefined, null, ''])(
  'preserves loaded special value %s without extra action buttons',
  initial => {
    const state = mount({
      id: 's',
      op: Op.EQ,
      field: 'name',
      value: initial,
    });
    expect(state.current().value).toBe(initial);
    expect(screen.queryByRole('button', { name: '名称值选项' })).toBeNull();
    expect(screen.queryByRole('button', { name: '清空名称值' })).toBeNull();
    change('名称值', 'hello');
    expect(state.current().value).toBe('hello');
    change('名称值', '');
    expect(state.current().value).toBeUndefined();
  },
);

it('retains false and clears it without converting to a string', async () => {
  const state = mount({ id: 'b', op: Op.EQ, field: 'enabled', value: false });
  expect(
    screen.getByRole('combobox', { name: '启用值' }).textContent,
  ).toContain('否');
  await select('启用值', '是');
  expect(state.current().value).toBe(true);
  await select('启用值', '清空选择');
  expect(state.current().value).toBeUndefined();
  await select('启用值', '否');
  expect(state.current().value).toBe(false);
});

it('maps enum labels to the original types including zero and empty string', async () => {
  const state = mount({ id: 'e', op: Op.NE, field: 'status', value: 0 });
  expect(screen.getByRole('combobox', { name: '状态值' }).textContent).toBe(
    '零',
  );
  for (const [label, value] of [
    ['字符串零', '0'],
    ['否', false],
    ['空标签', ''],
    ['零', 0],
  ] as const) {
    await select('状态值', label);
    expect(state.current().value).toBe(value);
  }
});

it('round-trips null in enum equality without assigning a default option', async () => {
  const state = mount({
    id: 'null-enum',
    op: Op.EQ,
    field: 'status',
    value: null,
  });
  expect(screen.getByRole('combobox', { name: '状态值' }).textContent).toBe(
    '空值',
  );
  expect(state.changes).toEqual([]);
  await select('状态值', '零');
  await select('状态值', '空值');
  expect(state.current().value).toBeNull();
});

it('shows incompatible loaded values and retains them until explicitly replaced', async () => {
  const initial = {
    id: 'bad-enum',
    op: Op.EQ,
    field: 'status',
    value: 'missing',
  };
  const state = mount(initial);
  expect(screen.getByRole('alert').textContent).toContain('不兼容');
  expect(
    screen.getByRole('combobox', { name: '状态值' }).textContent,
  ).toContain('missing');
  expect(state.changes).toEqual([]);
  await select('状态值', '零');
  expect(state.changes.map(node => node.value)).toEqual([0]);
  expect(state.current()).toEqual({ ...initial, value: 0 });
  expect(screen.queryByRole('alert')).toBeNull();
});

it('keeps the selected numeric type when deleting input text', async () => {
  const field: FilterFieldDefinition = { field: 'loose', label: '任意值' };
  const state = mount(
    { id: 'loose', op: Op.EQ, field: 'loose', value: 0 },
    field,
  );
  change('任意值值', '');
  expect(
    screen.getByRole('combobox', { name: '任意值值类型' }).textContent,
  ).toContain('数值');
  expect(compileFilterDraft(state.current(), [field])).toEqual({
    expression: { op: Op.MATCH_ALL },
    errors: [],
  });
});

it('disables inputs and parameter triggers without emitting a change', () => {
  const changes: FilterDraftNode[] = [];
  const node = { id: 'disabled', op: Op.EQ, field: 'name', value: 'hello' };
  render(
    <FilterValueEditor
      node={node}
      field={fields[0]}
      fields={fields}
      disabled
      onChange={next => changes.push(next)}
    />,
  );
  expect(
    (screen.getByRole('textbox', { name: '名称值' }) as HTMLInputElement)
      .disabled,
  ).toBe(true);
  expect(screen.queryByRole('button', { name: '名称值选项' })).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(changes).toEqual([]);
});

it('clears a numeric value by deleting its input text', () => {
  const state = mount({ id: 'amount', op: Op.GTE, field: 'amount', value: 10 });
  expect(screen.queryByRole('button', { name: '金额值选项' })).toBeNull();
  expect(screen.queryByRole('button', { name: '清空金额值' })).toBeNull();
  change('金额值', '');
  expect(compileFilterDraft(state.current(), fields).expression).toEqual({
    op: Op.MATCH_ALL,
  });
  expect(screen.getByRole('textbox', { name: '金额值' })).toBeTruthy();
});
