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

import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  DeletionState,
  FilterOperator as Op,
  SearchMode,
  StringComparison,
  TimeUnit,
} from '@ahoo-wang/fetcher-wow';
import { FilterValueEditor } from '../src/filter/FilterValueEditor';
import type {
  FilterDraftNode,
  FilterFieldDefinition,
} from '../src/filter/filterModel';
import { compileFilterDraft } from '../src/filter/filterCore';

afterEach(cleanup);

const fields: FilterFieldDefinition[] = [
  { field: 'name', label: '名称', type: 'string' },
  { field: 'amount', label: '金额', type: 'number' },
  { field: 'enabled', label: '启用', type: 'boolean' },
  {
    field: 'createdAt',
    label: '创建时间',
    type: 'datetime',
    timeZone: 'Asia/Shanghai',
  },
  { field: 'birthday', label: '生日', type: 'date' },
  {
    field: 'status',
    label: '状态',
    options: [
      { value: 0, label: '零' },
      { value: '0', label: '字符串零' },
      { value: false, label: '否' },
      { value: '', label: '空标签' },
    ],
  },
];

function mount(
  initial: FilterDraftNode,
  field = fields.find(item => item.field === initial.field),
) {
  const changes: FilterDraftNode[] = [];
  let current = initial;
  function Example() {
    const [node, setNode] = useState(initial);
    return (
      <FilterValueEditor
        node={node}
        field={field}
        fields={fields}
        onChange={next => {
          current = next;
          changes.push(next);
          setNode(next);
        }}
      />
    );
  }
  const result = render(<Example />);
  return { ...result, changes, current: () => current };
}

function change(label: string, value: string) {
  fireEvent.change(screen.getByRole('textbox', { name: label, exact: true }), {
    target: { value },
  });
}

async function select(label: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name: label, exact: true }));
  const item = await screen.findByRole('option', { name: option, exact: true });
  fireEvent.pointerDown(item, { pointerType: 'mouse' });
  fireEvent.click(item);
}

async function valueAction(label: string, action: string) {
  if (action === '清空值') {
    fireEvent.click(
      screen.getByRole('button', { name: `清空${label}`, exact: true }),
    );
    return;
  }
  fireEvent.click(
    screen.getByRole('button', { name: `${label}选项`, exact: true }),
  );
  fireEvent.click(
    await screen.findByRole('button', { name: action, exact: true }),
  );
}

describe('structured filter values', () => {
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
      (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement)
        .value,
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
      (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement)
        .value,
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

  it('distinguishes unset, null and explicit empty string and lets users edit again', async () => {
    const state = mount({ id: 's', op: Op.EQ, field: 'name' });
    await valueAction('名称值', '设为空字符串');
    expect(state.current().value).toBe('');
    expect(
      (screen.getByRole('textbox', { name: '名称值' }) as HTMLInputElement)
        .placeholder,
    ).toContain('空字符串');
    await valueAction('名称值', '设为空值');
    expect(state.current().value).toBeNull();
    change('名称值', 'hello');
    expect(state.current().value).toBe('hello');
    change('名称值', '');
    expect(state.current().value).toBeUndefined();
  });

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
      fireEvent.click(
        screen.getByRole('button', { name: `删除金额值${index}` }),
      );
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

  it('keeps the selected numeric type when clearing through value options', async () => {
    const field: FilterFieldDefinition = { field: 'loose', label: '任意值' };
    const state = mount(
      { id: 'loose', op: Op.EQ, field: 'loose', value: 0 },
      field,
    );
    await valueAction('任意值值', '清空值');
    expect(
      screen.getByRole('combobox', { name: '任意值值类型' }).textContent,
    ).toContain('数值');
    expect(compileFilterDraft(state.current(), [field])).toEqual({
      expression: { op: Op.MATCH_ALL },
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

  it('round-trips date text and keeps an invalid or partial date raw', () => {
    const state = mount({
      id: 'd',
      op: Op.EQ,
      field: 'birthday',
      value: '2026-09-06',
    });
    expect(
      (screen.getByRole('textbox', { name: '生日日期' }) as HTMLInputElement)
        .value,
    ).toBe('2026-09-06');
    change('生日日期', '2026-09-');
    expect(state.current().value).toBe('2026-09-');
    change('生日日期', '');
    expect(state.current().value).toBeUndefined();
  });

  it('shows timestamp zero in the field timezone and preserves partial datetime input', () => {
    const state = mount({ id: 'dt', op: Op.EQ, field: 'createdAt', value: 0 });
    expect(
      (
        screen.getByRole('textbox', {
          name: '创建时间日期',
        }) as HTMLInputElement
      ).value,
    ).toBe('1970-01-01');
    expect(
      (
        screen.getByRole('textbox', {
          name: '创建时间时间',
        }) as HTMLInputElement
      ).value,
    ).toBe('08:00:00');
    change('创建时间时间', '');
    expect(state.current().value).toEqual({
      date: '1970-01-01',
      time: undefined,
      offsetMinutes: -480,
    });
    change('创建时间日期', '');
    expect(state.current().value).toEqual({
      date: undefined,
      time: undefined,
      offsetMinutes: -480,
    });
    change('创建时间时间', '12:');
    expect(state.current().value).toEqual({
      date: undefined,
      time: '12:',
      offsetMinutes: -480,
    });
  });

  it('starts an unset datetime without injecting a date or midnight', () => {
    const state = mount({ id: 'dt', op: Op.EQ, field: 'createdAt' });
    expect(
      (
        screen.getByRole('textbox', {
          name: '创建时间日期',
        }) as HTMLInputElement
      ).value,
    ).toBe('');
    expect(
      (
        screen.getByRole('textbox', {
          name: '创建时间时间',
        }) as HTMLInputElement
      ).value,
    ).toBe('');
    change('创建时间日期', '2026-09-06');
    expect(state.current().value).toEqual({ date: '2026-09-06' });
  });

  it('preserves milliseconds and the calendar day on the other side of UTC', () => {
    const field: FilterFieldDefinition = {
      field: 'createdAt',
      label: '创建时间',
      type: 'datetime',
      timeZone: 'America/Los_Angeles',
    };
    const state = mount(
      { id: 'west', op: Op.EQ, field: 'createdAt', value: 123 },
      field,
    );
    expect(
      (
        screen.getByRole('textbox', {
          name: '创建时间日期',
        }) as HTMLInputElement
      ).value,
    ).toBe('1969-12-31');
    expect(
      (
        screen.getByRole('textbox', {
          name: '创建时间时间',
        }) as HTMLInputElement
      ).value,
    ).toBe('16:00:00.123');
    change('创建时间时间', '17:00:00.123');
    expect(compileFilterDraft(state.current(), [field])).toEqual({
      expression: { op: Op.EQ, field: 'createdAt', value: 3600123 },
      errors: [],
    });
  });

  it('edits search query, field scope and mode without inserting defaults', async () => {
    const state = mount({ id: 'q', op: Op.SEARCH, query: 'hello' });
    change('搜索内容', 'world');
    expect(state.current()).toEqual({ id: 'q', op: Op.SEARCH, query: 'world' });
    fireEvent.click(screen.getByRole('button', { name: '搜索参数' }));
    await select('搜索模式', '短语');
    expect(state.current().mode).toBe(SearchMode.PHRASE);
    await select('添加搜索字段', '名称');
    expect(state.current().fields).toEqual(['name']);
    fireEvent.click(screen.getByRole('button', { name: '删除搜索字段名称' }));
    expect(state.current().fields).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: '使用默认搜索字段' }));
    expect(state.current().fields).toBeUndefined();
    expect(state.current().query).toBe('world');
  });

  it('retains a loaded search scope and optional mode while raw scope edits remain visible', async () => {
    const initial = {
      id: 'search',
      op: Op.SEARCH,
      query: 'hello',
      fields: ['name', 'amount'],
      mode: SearchMode.TERMS,
    };
    const state = mount(initial);
    change('搜索内容', 'new query');
    expect(state.current()).toEqual({ ...initial, query: 'new query' });
    fireEvent.click(screen.getByRole('button', { name: '搜索参数' }));
    change('搜索字段2', '');
    expect(state.current().fields).toEqual(['name', '']);
    expect(compileFilterDraft(state.current(), fields).errors).toHaveLength(1);
  });

  it('preserves search fields and optional string comparison while editing primary values', async () => {
    const state = mount({
      id: 's',
      op: Op.CONTAINS,
      field: 'name',
      value: 'x',
      stringComparison: StringComparison.CASE_INSENSITIVE,
    });
    change('名称值', 'y');
    expect(state.current().stringComparison).toBe(
      StringComparison.CASE_INSENSITIVE,
    );
    fireEvent.click(screen.getByRole('button', { name: '名称参数' }));
    await select('大小写比较', '区分大小写');
    expect(state.current()).toMatchObject({
      value: 'y',
      stringComparison: StringComparison.CASE_SENSITIVE,
    });
  });

  it('edits relative options without injecting unset defaults and retains invalid day input', async () => {
    const state = mount({
      id: 't',
      op: Op.RECENT_DAYS,
      field: 'createdAt',
      days: 3,
      zoneId: 'UTC',
      datePattern: 'yyyy-MM-dd',
      timeUnit: TimeUnit.SECONDS,
    });
    change('创建时间天数', '1.5');
    expect(state.current()).toMatchObject({
      days: '1.5',
      zoneId: 'UTC',
      datePattern: 'yyyy-MM-dd',
      timeUnit: TimeUnit.SECONDS,
    });
    fireEvent.click(screen.getByRole('button', { name: '创建时间参数' }));
    change('时区', 'Asia/Shanghai');
    change('日期格式', 'yyyy-MM');
    await select('时间单位', '毫秒');
    expect(state.current()).toMatchObject({
      days: '1.5',
      zoneId: 'Asia/Shanghai',
      datePattern: 'yyyy-MM',
      timeUnit: TimeUnit.MILLISECONDS,
    });
  });

  it('edits BEFORE_TODAY time as raw text', () => {
    const state = mount({
      id: 'bt',
      op: Op.BEFORE_TODAY,
      field: 'createdAt',
      time: '12:30',
      zoneId: 'UTC',
    });
    change('创建时间时间', '12:');
    expect(state.current()).toMatchObject({ time: '12:', zoneId: 'UTC' });
  });

  it('edits root metadata as strings and deletion with typed state', async () => {
    const state = mount({ id: 'm', op: Op.ID, value: '001' });
    change('记录标识值', '000');
    expect(state.current().value).toBe('000');
    state.unmount();
    const deletion = mount({
      id: 'x',
      op: Op.DELETION,
      state: DeletionState.ACTIVE,
    });
    await select('删除状态', '已删除');
    expect(deletion.current()).toEqual({
      id: 'x',
      op: Op.DELETION,
      state: DeletionState.DELETED,
    });
  });

  it('renders no value control for presence operators but exposes relative options', async () => {
    const state = mount({ id: 'n', op: Op.IS_NULL, field: 'name' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    state.unmount();
    const today = mount({ id: 'today', op: Op.TODAY, field: 'createdAt' });
    fireEvent.click(screen.getByRole('button', { name: '创建时间参数' }));
    expect(
      (screen.getByRole('textbox', { name: '时区' }) as HTMLInputElement).value,
    ).toBe('');
    expect(today.changes).toEqual([]);
    change('时区', 'UTC');
    expect(today.current()).toEqual({
      id: 'today',
      op: Op.TODAY,
      field: 'createdAt',
      zoneId: 'UTC',
    });
  });

  it.each([
    Op.TODAY,
    Op.TOMORROW,
    Op.YESTERDAY,
    Op.THIS_WEEK,
    Op.NEXT_WEEK,
    Op.LAST_WEEK,
    Op.THIS_MONTH,
    Op.NEXT_MONTH,
    Op.LAST_MONTH,
    Op.THIS_YEAR,
    Op.NEXT_YEAR,
    Op.LAST_YEAR,
  ])('edits %s options without inserting other parameters', op => {
    const initial = { id: op, op, field: 'createdAt' };
    const state = mount(initial);
    fireEvent.click(screen.getByRole('button', { name: '创建时间参数' }));
    change('日期格式', 'yyyy-MM-dd');
    expect(state.current()).toEqual({ ...initial, datePattern: 'yyyy-MM-dd' });
    change('日期格式', '');
    expect(state.current()).toEqual({ ...initial, datePattern: undefined });
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
    const trigger = screen.getByRole('button', { name: '名称值选项' });
    fireEvent.click(trigger);
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(changes).toEqual([]);
  });
});

it('clears a numeric value directly without an options popup', () => {
  const state = mount({ id: 'amount', op: Op.GTE, field: 'amount', value: 10 });
  expect(screen.queryByRole('button', { name: '金额值选项' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '清空金额值' }));
  expect(compileFilterDraft(state.current(), fields).expression).toEqual({
    op: Op.MATCH_ALL,
  });
  expect(screen.getByRole('textbox', { name: '金额值' })).toBeTruthy();
});

it('preserves a loaded instant when editing within a repeated DST hour', () => {
  const field: FilterFieldDefinition = {
    field: 'createdAt',
    label: '创建时间',
    type: 'datetime',
    timeZone: 'America/New_York',
  };
  const value = Date.parse('2026-11-01T06:30:00.000Z');
  const state = mount(
    { id: 'dst', op: Op.EQ, field: 'createdAt', value },
    field,
  );
  change('创建时间时间', '01:30:00.000');
  expect(compileFilterDraft(state.current(), [field]).expression).toEqual({
    op: Op.EQ,
    field: 'createdAt',
    value,
  });
  change('创建时间时间', '01:31:00');
  expect(compileFilterDraft(state.current(), [field]).expression).toEqual({
    op: Op.EQ,
    field: 'createdAt',
    value: value + 60_000,
  });
});
