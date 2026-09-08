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

import { filter, FilterOperator } from '@ahoo-wang/fetcher-wow';
import { expect, it, vi } from 'vitest';
import {
  createFilterConfiguration,
  createFilterDraft,
  newFilterDraft,
} from '../../src/filter/filterCore.js';
import type { FilterCompilerRegistry } from '../../src/filter/filterModel.js';
import type { ViewInstance } from '../../src/record/recordModel.js';
import { instance, selected, setup } from './fixtures.js';

it('saves an added unset control without a query and restores its identity through JSON', async () => {
  const { engine, host, paged } = setup();
  await engine.load();
  const condition = createFilterDraft(filter.gte('state.amount', 10));
  engine.setFilterDraft(condition);
  await engine.applyFilter(filter.gte('state.amount', 10));
  const unset = newFilterDraft(FilterOperator.EQ, 'state.id');
  engine.setFilterDraft({
    id: 'saved-group',
    op: FilterOperator.AND,
    operands: [condition, unset],
  });
  expect(selected(engine).filterPending).toBe(false);
  expect(selected(engine).dirty).toBe(true);
  await engine.save();
  expect(paged).toHaveBeenCalledTimes(2);
  const saved = JSON.parse(JSON.stringify(selected(engine).baseline));
  expect(saved.config).not.toHaveProperty('filter');
  expect(saved.config.filters.root.operands[1]).toMatchObject({
    id: unset.id,
    operator: 'EQ',
    field: 'state.id',
    props: {},
  });
  const restored = setup({
    instances: { instances: [saved], defaultInstanceId: saved.id },
    host,
  });
  await restored.engine.load();
  expect(selected(restored.engine).filterDraft).toMatchObject({
    id: 'saved-group',
    operands: [condition, unset],
  });
  expect(selected(restored.engine).dirty).toBe(false);
});

const compilers: FilterCompilerRegistry = {
  amountPicker: {
    compile(props, context) {
      return typeof props.selectedAmount === 'number'
        ? filter.gte(context.field!.field, props.selectedAmount)
        : undefined;
    },
  },
};
function customView(): ViewInstance {
  const saved = instance();
  saved.config.filters = createFilterConfiguration({
    id: 'amount-picker',
    op: FilterOperator.GTE,
    field: 'state.amount',
    editor: { name: 'amountPicker', options: { searchable: true } },
    props: { selectedAmount: 10, displayLabel: 'Ten', appearance: 'compact' },
  });
  return saved;
}

it('saves non-query custom props without querying and requires Query for changed semantics', async () => {
  let saved = customView();
  const saveInstance = vi.fn(async (value: ViewInstance) => {
    saved = JSON.parse(JSON.stringify({ ...value, revision: 'r2' }));
    return saved;
  });
  const active = setup({
    instances: { instances: [saved], defaultInstanceId: saved.id },
    filterCompilers: compilers,
  });
  active.host.saveInstance = saveInstance;
  await active.engine.load();
  expect(active.paged.mock.calls[0][0].filter).toEqual(
    filter.gte('state.amount', 10),
  );
  const original = selected(active.engine).filterDraft;
  active.engine.setFilterDraft({
    ...original,
    props: { ...original.props, displayLabel: '十元' },
  });
  expect(selected(active.engine)).toMatchObject({
    dirty: true,
    filterPending: false,
  });
  await active.engine.save();
  expect(active.paged).toHaveBeenCalledTimes(1);
  expect(saved.config.filters.root.props).toEqual({
    selectedAmount: 10,
    displayLabel: '十元',
    appearance: 'compact',
  });
  active.engine.setFilterDraft({
    ...original,
    props: { ...original.props, selectedAmount: 50, displayLabel: 'Fifty' },
  });
  await expect(active.engine.save()).rejects.toThrow(/先查询/);
  expect(selected(active.engine).appliedFilter).toEqual(
    filter.gte('state.amount', 10),
  );
  await active.engine.applyFilter();
  await active.engine.save();
  expect(active.paged).toHaveBeenCalledTimes(2);
  expect(saved.config).not.toHaveProperty('filter');
  const reloaded = setup({
    filterCompilers: compilers,
    instances: { instances: [saved], defaultInstanceId: saved.id },
  });
  await reloaded.engine.load();
  expect(selected(reloaded.engine).filterDraft).toMatchObject({
    id: original.id,
    editor: original.editor,
    props: { selectedAmount: 50, displayLabel: 'Fifty', appearance: 'compact' },
  });
  expect(reloaded.paged.mock.calls[0][0].filter).toEqual(
    filter.gte('state.amount', 50),
  );
});

it('preserves an unresolved component and prevents every record and aggregate request', async () => {
  const saved = customView();
  saved.config.presentation.table.columns[0].summary = ['SUM'];
  const { engine, host, paged, cursor } = setup({
    instances: { instances: [saved], defaultInstanceId: saved.id },
  });
  await expect(engine.load()).rejects.toThrow(/编译/);
  expect(selected(engine)).toMatchObject({
    appliedFilter: null,
    filterPending: true,
    queryStatus: 'error',
  });
  expect(selected(engine).instance.config.filters).toEqual(
    saved.config.filters,
  );
  await engine.refreshSummary();
  await expect(engine.refresh()).rejects.toThrow(/编译/);
  await expect(engine.applyFilter()).rejects.toThrow(/未注册/);
  await expect(engine.save()).rejects.toThrow(/先查询/);
  expect(host.resolveSource).not.toHaveBeenCalled();
  expect(paged).not.toHaveBeenCalled();
  expect(cursor).not.toHaveBeenCalled();
});

it('rejects a caller-supplied query that was not compiled from its components', async () => {
  const { engine, paged } = setup();
  await engine.load();
  const draft = selected(engine).filterDraft;
  await expect(
    engine.applyFilter(filter.gte('state.amount', 20)),
  ).rejects.toThrow(/组件配置/);
  expect(selected(engine).filterDraft).toBe(draft);
  expect(paged).toHaveBeenCalledTimes(1);
});

it('blocks a registered compiler which tries to query another field', async () => {
  const saved = customView();
  const { engine, host } = setup({
    instances: { instances: [saved], defaultInstanceId: saved.id },
    filterCompilers: {
      amountPicker: { compile: () => filter.eq('state.id', 'foreign') },
    },
  });
  await expect(engine.load()).rejects.toThrow(/编译/);
  expect(host.resolveSource).not.toHaveBeenCalled();
  expect(selected(engine).instance.config.filters.root.props).toEqual(
    saved.config.filters.root.props,
  );
});

it('persists filter mode independently of a query and restores the saved mode', async () => {
  const { engine, paged } = setup();
  await engine.load();
  engine.setFilterMode('advanced');
  expect(selected(engine)).toMatchObject({ dirty: true, filterPending: false });
  await engine.save();
  engine.setFilterMode('simple');
  await engine.restore();
  expect(selected(engine).filterMode).toBe('advanced');
  expect(selected(engine).dirty).toBe(false);
  expect(paged).toHaveBeenCalledTimes(2);
});

it('rejects non-JSON component edits even when JSON.stringify would hide the change', async () => {
  const { engine } = setup();
  await engine.load();
  const initial = selected(engine).filterDraft;
  for (const value of [() => {}, Number.NaN, new Date(), [undefined]]) {
    expect(() =>
      engine.setFilterDraft({ ...initial, extra: value } as typeof initial),
    ).toThrow();
    expect(selected(engine).filterDraft).toBe(initial);
  }
});
