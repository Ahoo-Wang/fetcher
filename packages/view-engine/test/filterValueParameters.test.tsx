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
  FilterOperator as Op,
  SearchMode,
  StringComparison,
  TimeUnit,
} from '@ahoo-wang/fetcher-wow';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { compileFilterDraft } from '../src/filter/filterCore';
import { change, fields, mount, select } from './fixtures/filterValueEditor.js';

afterEach(cleanup);

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
