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

import { expect, it, vi } from 'vitest';
import {
  AggregationFunction as Fn,
  AggregationGroupType as Group,
  AggregationDateUnit as Unit,
  FilterOperator,
} from '@ahoo-wang/fetcher-wow';
import { ViewEngine } from '../src/engine/ViewEngine.js';
import { createFilterConfiguration } from '../src/filter/filterConfiguration.js';
import type {
  AnalysisViewConfig,
  AnalysisCompileContext,
} from '../src/analysis/analysisModel.js';
import type {
  ViewDefinition,
  AnalysisViewInstance,
} from '../src/contracts/viewModel.js';
const context: AnalysisCompileContext = {
  fields: [
    { field: 'state', label: 'State', type: 'string' },
    { field: 'amount', label: 'Amount', type: 'number' },
    { field: 'created', label: 'Created', type: 'datetime' },
  ],
  capability: {
    count: true,
    fields: [
      { field: 'state', groups: [Group.TERMS], functions: [] },
      { field: 'amount', groups: [Group.HISTOGRAM], functions: [Fn.SUM] },
      {
        field: 'created',
        groups: [Group.DATE_HISTOGRAM],
        functions: [],
        dateUnits: [Unit.MONTH],
      },
    ],
  },
  timeZone: 'Asia/Shanghai',
};
const config: AnalysisViewConfig = {
  filters: createFilterConfiguration({
    id: 'all',
    component: { name: 'builtin' },
    operator: FilterOperator.MATCH_ALL,
    props: {},
  }),
  dimensions: [],
  metrics: [
    {
      id: 'count',
      component: { name: 'count' },
      alias: 'orders',
      title: 'Orders',
      props: {},
    },
    {
      id: 'sum',
      component: { name: 'numeric' },
      field: 'amount',
      alias: 'total',
      title: 'Total',
      props: { function: Fn.SUM },
    },
  ],
  sort: [],
  limit: 100,
  presentation: { layout: 'table', columns: [] },
};

const definition: ViewDefinition = {
  id: 'orders',
  title: 'Orders',
  sourceId: 'orders',
  fields: context.fields,
  analysis: context.capability,
};
const instance: AnalysisViewInstance = {
  id: 'analysis',
  definitionId: 'orders',
  kind: 'analysis',
  title: 'Totals',
  scope: { type: 'personal' },
  revision: '1',
  config,
};
function setup(instances = [instance]) {
  const aggregate = vi.fn().mockResolvedValue([{ orders: 2, total: 30 }]);
  const save = vi.fn(async value => ({ ...value, revision: '2' }));
  const engine = new ViewEngine({
    definitionId: 'orders',
    definition,
    instances: { instances, defaultInstanceId: 'analysis' },
    host: {
      resolveSource: () => ({ aggregate }),
      instance: { save },
      permission: {
        getInstance: () => ({
          save: true,
          saveAsPersonal: true,
          saveAsShared: false,
        }),
      },
    },
  });
  return { engine, aggregate, save };
}
it('saves valid count/sum working configuration without running and restores the confirmed baseline', async () => {
  const { engine, aggregate, save } = setup();
  await engine.load();
  expect(aggregate).toHaveBeenCalledTimes(1);
  engine.analysis('analysis').edit(value => ({ ...value, limit: 50 }));
  await engine.save('analysis');
  expect(save.mock.calls[0][0].config.limit).toBe(50);
  expect(aggregate).toHaveBeenCalledTimes(1);
  engine.analysis('analysis').edit(value => ({ ...value, limit: 60 }));
  await engine.restore('analysis');
  expect(engine.getSnapshot().sessions.analysis.instance.config.limit).toBe(50);
  await engine.analysis('analysis').run();
  const session = engine.getSnapshot().sessions.analysis;
  expect(session.kind).toBe('analysis');
  if (session.kind === 'analysis')
    expect(session.result?.rows).toEqual([{ orders: 2, total: 30 }]);
  engine.dispose();
});
it('keeps invalid configuration repairable without blocking a healthy sibling', async () => {
  const broken = structuredClone(instance);
  broken.id = 'broken';
  broken.config.metrics[0].component.name = 'missing';
  const { engine } = setup([instance, broken]);
  await engine.load();
  await engine.selectInstance('broken');
  const bad = engine.getSnapshot().sessions.broken;
  expect(bad.kind).toBe('analysis');
  if (bad.kind === 'analysis') expect(bad.validation.length).toBeGreaterThan(0);
  await expect(engine.save('broken')).rejects.toThrow();
  await engine.selectInstance('analysis');
  await engine.analysis('analysis').run();
  expect(engine.getSnapshot().sessions.analysis.queryStatus).toBe('success');
  engine.dispose();
});
it('ignores late results after navigation and keeps submitted schema independent of edits', async () => {
  const other = { ...instance, id: 'other' };
  const { engine, aggregate } = setup([instance, other]);
  await engine.load();
  let resolve!: (rows: unknown[]) => void;
  aggregate.mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done;
      }),
  );
  const pending = engine.analysis('analysis').run();
  await Promise.resolve();
  await Promise.resolve();
  engine.analysis('analysis').edit(value => ({ ...value, metrics: [] }));
  await engine.selectInstance('other');
  resolve([{ orders: 2, total: 30 }]);
  await pending;
  const session = engine.getSnapshot().sessions.analysis;
  if (session.kind === 'analysis')
    expect(session.result?.config.limit).toBe(100);
  engine.dispose();
});

it('uses the shared conflict decisions for analysis documents without running on adoption or overwrite', async () => {
  let remote = structuredClone(instance);
  const aggregate = vi.fn().mockResolvedValue([{ orders: 2, total: 30 }]);
  const save = vi.fn(async (value: AnalysisViewInstance) => {
    remote = { ...value, revision: 'r4' };
    return remote;
  });
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition,
    instances: { instances: [instance], defaultInstanceId: instance.id },
    host: {
      resolveSource: () => ({ aggregate }),
      instance: { load: async () => remote, save: save as never },
      permission: {
        getInstance: () => ({
          save: true,
          saveAsPersonal: true,
          saveAsShared: false,
        }),
      },
    },
  });
  await engine.load();
  engine.setTitle('Local');
  remote = {
    ...remote,
    revision: 'r2',
    config: { ...remote.config, limit: 20 },
  };
  await engine.reloadInstance(instance.id);
  const review = engine.getSnapshot().sessions[instance.id].conflict!;
  expect(review).toBeDefined();
  await engine.useRemoteInstance(review, instance.id);
  expect(engine.getSnapshot().sessions[instance.id].baseline.revision).toBe(
    'r2',
  );
  expect(aggregate).toHaveBeenCalledOnce();
  engine.analysis(instance.id).edit(value => ({ ...value, limit: 50 }));
  remote = {
    ...remote,
    revision: 'r3',
    config: { ...remote.config, limit: 80 },
  };
  await engine.reloadInstance(instance.id);
  await engine.overwriteInstance(
    engine.getSnapshot().sessions[instance.id].conflict!,
    instance.id,
  );
  expect(save.mock.calls[0][0].revision).toBe('r3');
  expect(save.mock.calls[0][0].config.limit).toBe(50);
  expect(aggregate).toHaveBeenCalledOnce();
  engine.dispose();
});

it('evicts results across record and analysis while retaining both working documents', async () => {
  const record = {
    id: 'records',
    definitionId: definition.id,
    title: 'Records',
    revision: 'r1',
    scope: { type: 'personal' as const },
    kind: 'record' as const,
    config: {
      filters: config.filters,
      sort: [],
      pagination: { mode: 'paged' as const, size: 10 },
      presentation: {
        layout: 'table' as const,
        table: {
          columns: [{ id: 'amount', kind: 'field' as const, field: 'amount' }],
        },
      },
    },
  };
  const aggregate = vi.fn().mockResolvedValue([{ orders: 2, total: 30 }]);
  const paged = vi
    .fn()
    .mockResolvedValue({ list: [{ id: 'one', amount: 30 }], total: 1 });
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition: {
      ...definition,
      record: { rowKey: 'id', allowedLayouts: ['table'] },
    },
    instances: { instances: [record, instance], defaultInstanceId: record.id },
    limits: { maxRetainedResults: 1 },
    host: { resolveSource: () => ({ paged, aggregate }) },
  });
  await engine.load();
  engine.setTitle('Unsaved record', record.id);
  const original = engine.getSnapshot().sessions.records;
  if (original.kind === 'record') expect(original.result?.page).toBe(1);
  await engine.selectInstance(instance.id);
  const evicted = engine.getSnapshot().sessions.records;
  expect(evicted.result).toBeNull();
  expect(evicted.instance.title).toBe('Unsaved record');
  expect(evicted.dirty).toBe(true);
  if (evicted.kind === 'record') expect(evicted.rows).toEqual([]);
  await engine.selectInstance(record.id);
  expect(engine.getSnapshot().sessions.analysis.result).toBeNull();
  await engine.selectInstance(instance.id);
  expect(aggregate).toHaveBeenCalledOnce();
  engine.dispose();
});

it('deduplicates the same pending plan and lets changed configuration replace it', async () => {
  const { engine, aggregate } = setup();
  await engine.load();
  let finish!: (rows: unknown[]) => void;
  aggregate.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const first = engine.analysis(instance.id).run();
  await vi.waitFor(() => expect(aggregate).toHaveBeenCalledTimes(2));
  await engine.analysis(instance.id).run();
  expect(aggregate).toHaveBeenCalledTimes(2);
  engine.analysis(instance.id).edit(value => ({ ...value, limit: 50 }));
  await engine.analysis(instance.id).run();
  finish([{ orders: 999, total: 999 }]);
  await first;
  const session = engine.getSnapshot().sessions[instance.id];
  if (session.kind === 'analysis') {
    expect(session.pendingQuery).toBeNull();
    expect(session.result?.config.limit).toBe(50);
    expect(session.result?.rows).toEqual([{ orders: 2, total: 30 }]);
  }
  engine.dispose();
});

it('preserves invalid analysis editor input across reloads without a JSON change', async () => {
  const aggregate = vi.fn().mockResolvedValue([{ orders: 2, total: 30 }]);
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition,
    instances: { instances: [instance], defaultInstanceId: instance.id },
    host: {
      resolveSource: () => ({ aggregate }),
      instance: { load: async () => ({ ...instance, revision: '2' }) },
    },
  });
  try {
    await engine.load();
    engine.analysis(instance.id).setFilterValidity(false);
    await engine.reloadInstance(instance.id);
    expect(engine.getSnapshot().sessions[instance.id].filterValid).toBe(false);
    await expect(engine.analysis(instance.id).run()).rejects.toThrow();
    expect(aggregate).toHaveBeenCalledOnce();
  } finally {
    engine.dispose();
  }
});
