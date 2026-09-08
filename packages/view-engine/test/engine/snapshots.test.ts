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
  createFilterDraft,
  createFilterConfiguration,
  newFilterDraft,
} from '../../src/filter/filterCore.js';
import type { ViewDefinition } from '../../src/record/recordModel.js';
import { definition, instance, selected, setup } from './fixtures.js';

it('derives pending from core draft changes and only accepts the queried editing baseline', async () => {
  const saved = instance();
  saved.config.filters = createFilterConfiguration(
    createFilterDraft(filter.gte('state.amount', 10)),
  );
  const { engine, host } = setup({
    instances: { instances: [saved], defaultInstanceId: saved.id },
  });
  await engine.load();
  engine.setTitle('Edited title');
  engine.setFilterDraft(createFilterDraft(filter.gte('state.amount', 500)));
  expect(selected(engine).filterPending).toBe(true);
  await expect(engine.save()).rejects.toThrow(/先查询/);
  expect(host.saveInstance).not.toHaveBeenCalled();
  engine.setFilterDraft(createFilterDraft(filter.gte('state.amount', 10)));
  expect(selected(engine).filterPending).toBe(false);
  engine.setFilterValidity(false);
  expect(selected(engine).filterPending).toBe(true);
  engine.setFilterDraft(
    createFilterDraft(filter.gte('state.amount', 500)),
    undefined,
    true,
  );
  expect(selected(engine).filterPending).toBe(true);
  await engine.applyFilter(filter.gte('state.amount', 500));
  expect(selected(engine).filterPending).toBe(false);
  await engine.save();
  expect(selected(engine).baseline.config.filters.root).toMatchObject({
    operator: 'GTE',
    field: 'state.amount',
    props: { value: 500 },
  });
  engine.setFilterDraft(newFilterDraft(FilterOperator.EQ, 'state.amount'));
  expect(selected(engine).filterPending).toBe(true);
  await engine.applyFilter(filter.matchAll());
  expect(selected(engine).filterPending).toBe(false);
  expect(selected(engine).filterDraft.op).toBe(FilterOperator.EQ);
});

it('isolates snapshots and request payloads from caller and host mutation', async () => {
  const original = instance();
  const { engine, paged, host } = setup({
    instances: { instances: [original], defaultInstanceId: 'mine' },
  });
  const initial = engine.getSnapshot();
  expect(engine.getSnapshot()).toBe(initial);
  original.title = 'external before load';
  await engine.load();
  expect(selected(engine).instance.title).toBe('mine');
  const snapshot = engine.getSnapshot();
  expect(() => {
    selected(engine).instance.title = 'external';
  }).toThrow();
  expect(() => {
    (selected(engine).rows[0].state as { id: string }).id = 'external';
  }).toThrow();
  paged.mock.calls[0][0].filter.op = 'MATCH_NONE';
  expect(selected(engine).appliedFilter?.op).toBe('MATCH_ALL');
  const draft = newFilterDraft(FilterOperator.EQ, 'state.amount');
  engine.setFilterDraft(draft);
  draft.value = 999;
  expect(selected(engine).filterDraft.value).toBeUndefined();
  expect(snapshot.sessions.mine.instance.title).toBe('mine');
  expect(Object.isFrozen(host.resolveSource)).toBe(false);
});

it('does not publish identical controlled filter state again', async () => {
  const { engine } = setup();
  await engine.load();
  const snapshot = engine.getSnapshot();
  const listener = vi.fn();
  engine.subscribe(listener);
  engine.setFilterValidity(true);
  engine.setFilterMode('simple');
  engine.setFilterDraft(structuredClone(selected(engine).filterDraft));
  expect(engine.getSnapshot()).toBe(snapshot);
  expect(listener).not.toHaveBeenCalled();
});

it('reports non-JSON local data during load and rejects mutable non-JSON result values', async () => {
  const invalid = setup({
    definition: {
      ...definition,
      metadata: () => 'not JSON',
    } as ViewDefinition,
  });
  await expect(invalid.engine.load()).rejects.toThrow('JSON');
  expect(invalid.engine.getSnapshot().status).toBe('error');
  for (const value of [
    new Date(),
    new Map(),
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    const { engine, paged } = setup();
    paged.mockResolvedValue({
      total: 1,
      list: [{ state: { id: 'a' }, value }],
    });
    await expect(engine.load()).rejects.toThrow('JSON');
    expect(selected(engine).rows).toEqual([]);
  }
});
