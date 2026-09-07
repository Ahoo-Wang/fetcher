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
import { filter, FilterOperator, SortDirection } from '@ahoo-wang/fetcher-wow';
import { createFilterDraft, newFilterDraft } from '../src/filter/filterCore.js';
import { ViewEngine } from '../src/record/ViewEngine.js';
import type {
  ViewDefinition,
  ViewEngineOptions,
  ViewHost,
  ViewInstance,
} from '../src/record/recordModel.js';

const definition: ViewDefinition = {
  id: 'orders',
  title: 'Orders',
  sourceId: 'orders-source',
  rowKey: 'state.id',
  fields: [
    { field: 'state.id', label: 'ID', type: 'string', sortable: true },
    { field: 'state.amount', label: 'Amount', type: 'number', sortable: true },
  ],
};

function instance(
  id = 'mine',
  mode: 'paged' | 'cursor' = 'paged',
): ViewInstance {
  return {
    id,
    definitionId: 'orders',
    title: id,
    kind: 'record',
    scope: { type: 'personal' },
    revision: 'r1',
    config: {
      filter: filter.matchAll(),
      sort: [],
      pagination: { mode, size: 10 },
      presentation: {
        layout: 'table',
        table: {
          columns: [{ id: 'amount', kind: 'field', field: 'state.amount' }],
        },
      },
    },
  };
}

function setup(options: Partial<ViewEngineOptions> = {}) {
  const paged = vi.fn().mockResolvedValue({
    total: 1,
    list: [{ state: { id: 'a', amount: 10 } }],
  });
  const cursor = vi
    .fn()
    .mockResolvedValue({ list: [{ state: { id: 'a' } }], nextCursor: 'next' });
  const host: ViewHost = {
    resolveSource: vi.fn(() => ({ paged, cursor })),
    getInstancePermissions: () => ({
      save: true,
      saveAsPersonal: true,
      saveAsShared: true,
    }),
    saveInstance: vi.fn(async value => ({ ...value, revision: 'r2' })),
    createInstance: vi.fn(async value => ({
      ...value,
      id: 'created',
      revision: 'r1',
    })),
    ...options.host,
  };
  const engine = new ViewEngine({
    definitionId: 'orders',
    definition,
    instances: {
      instances: [instance(), instance('shared')],
      defaultInstanceId: 'mine',
    },
    ...options,
    host,
  });
  return { engine, host, paged, cursor };
}

it('derives pending from core draft changes and only accepts the queried editing baseline', async () => {
  const saved = instance();
  saved.config.filter = filter.gte('state.amount', 10);
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
  expect(selected(engine).baseline.config.filter).toEqual({
    op: 'GTE',
    field: 'state.amount',
    value: 500,
  });
  engine.setFilterDraft(newFilterDraft(FilterOperator.EQ, 'state.amount'));
  expect(selected(engine).filterPending).toBe(true);
  await engine.applyFilter(filter.matchAll());
  expect(selected(engine).filterPending).toBe(false);
  expect(selected(engine).filterDraft.op).toBe(FilterOperator.EQ);
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const selected = (
  engine: ViewEngine,
  id = engine.getSnapshot().selectedInstanceId!,
) => engine.getSnapshot().sessions[id];

describe('ViewEngine loading and query sessions', () => {
  it('keeps absent and invalid defaults unselected without querying', async () => {
    for (const defaultInstanceId of [null, 'missing']) {
      const { engine, paged } = setup({
        instances: { instances: [instance()], defaultInstanceId },
      });
      await engine.load();
      expect(engine.getSnapshot()).toMatchObject({
        status: 'ready',
        selectedInstanceId: null,
        instanceIds: ['mine'],
      });
      expect(paged).not.toHaveBeenCalled();
    }
    const { engine, paged } = setup({
      instances: { instances: [], defaultInstanceId: null },
    });
    await engine.load();
    expect(engine.getSnapshot().instanceIds).toEqual([]);
    expect(paged).not.toHaveBeenCalled();
  });

  it('rejects a foreign or duplicate list before selecting or querying', async () => {
    for (const entries of [
      [instance(), { ...instance('bad'), definitionId: 'foreign' }],
      [instance(), instance()],
    ]) {
      const { engine, paged } = setup({
        instances: { instances: entries, defaultInstanceId: 'mine' },
      });
      await expect(engine.load()).rejects.toThrow();
      expect(engine.getSnapshot()).toMatchObject({
        status: 'error',
        selectedInstanceId: null,
        instanceIds: [],
      });
      expect(paged).not.toHaveBeenCalled();
    }
  });

  it('loads the definition and list concurrently and never rereads a complete selected instance', async () => {
    const definitionRead = deferred<ViewDefinition>();
    const listRead = deferred<{
      instances: ViewInstance[];
      defaultInstanceId: string;
    }>();
    const loadDefinition = vi.fn(() => definitionRead.promise);
    const listInstances = vi.fn(() => listRead.promise);
    const loadInstance = vi.fn();
    const { engine } = setup({
      definition: undefined,
      instances: undefined,
      host: {
        loadDefinition,
        listInstances,
        loadInstance,
      } as unknown as ViewHost,
    });
    const loading = engine.load();
    await vi.waitFor(() => {
      expect(loadDefinition).toHaveBeenCalledOnce();
      expect(listInstances).toHaveBeenCalledOnce();
    });
    definitionRead.resolve(definition);
    listRead.resolve({
      instances: [instance(), instance('shared')],
      defaultInstanceId: 'mine',
    });
    await loading;
    await engine.selectInstance('shared');
    expect(loadInstance).not.toHaveBeenCalled();
    expect(engine.getSnapshot().selectedInstanceId).toBe('shared');
  });

  it('sends server pagination without projection and keeps column edits local', async () => {
    const { engine, paged } = setup();
    await engine.load();
    expect(paged.mock.calls[0]).toEqual([
      {
        filter: { op: 'MATCH_ALL' },
        sort: [],
        pagination: { index: 1, size: 10 },
      },
      undefined,
      expect.any(AbortController),
    ]);
    engine.setSelection(['a']);
    engine.setColumns([
      {
        id: 'amount',
        kind: 'field',
        field: 'state.amount',
        width: 250,
        pinned: 'left',
      },
    ]);
    expect(selected(engine).selectedRowKeys).toEqual(['a']);
    expect(paged).toHaveBeenCalledOnce();
    expect(selected(engine).dirty).toBe(true);
    await engine.setSort([
      { field: 'state.amount', direction: SortDirection.DESC },
    ]);
    expect(selected(engine).selectedRowKeys).toEqual([]);
    expect(paged.mock.calls.at(-1)?.[0]).toMatchObject({
      sort: [{ field: 'state.amount', direction: 'DESC' }],
      pagination: { index: 1, size: 10 },
    });
    engine.setSelection(['a']);
    await engine.setPage(3);
    expect(selected(engine).selectedRowKeys).toEqual([]);
    expect(paged.mock.calls.at(-1)?.[0].pagination.index).toBe(3);
    await engine.setPageSize(25);
    expect(paged.mock.calls.at(-1)?.[0].pagination).toEqual({
      index: 1,
      size: 25,
    });
  });

  it('retains each instance draft and mode, clearing selection for the new query when navigating', async () => {
    const { engine, paged } = setup();
    await engine.load();
    const draft = newFilterDraft(FilterOperator.EQ, 'state.amount');
    engine.setFilterDraft(draft);
    engine.setFilterValidity(false);
    engine.setFilterMode('advanced');
    engine.setTitle('Local draft');
    engine.setSelection(['a']);
    await engine.selectInstance('shared');
    expect(selected(engine).instance.title).toBe('shared');
    expect(selected(engine).filterPending).toBe(false);
    await engine.selectInstance('mine');
    expect(selected(engine)).toMatchObject({
      filterDraft: draft,
      filterPending: true,
      filterMode: 'advanced',
      selectedRowKeys: [],
      instance: { title: 'Local draft' },
    });
    expect(paged).toHaveBeenCalledTimes(3);
    await engine.applyFilter(filter.matchAll());
    expect(selected(engine).filterDraft).toEqual(draft);
    expect(selected(engine).filterPending).toBe(false);
    expect(selected(engine).selectedRowKeys).toEqual([]);
    await engine.restore();
    expect(selected(engine)).toMatchObject({
      dirty: false,
      filterPending: false,
      page: 1,
      instance: { title: 'mine' },
    });
  });

  it('clears stale rows and ignores old query resolution and rejection after a newer filter', async () => {
    const { engine, paged } = setup();
    await engine.load();
    const old = deferred<unknown>();
    paged.mockImplementationOnce(() => old.promise);
    const previous = engine.refresh();
    await vi.waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
    expect(selected(engine)).toMatchObject({
      rows: [],
      queryStatus: 'loading',
      total: null,
    });
    const controller = paged.mock.calls[1][2];
    await engine.applyFilter(filter.gt('state.amount', 5));
    expect(controller.signal.aborted).toBe(true);
    old.reject(new Error('obsolete error'));
    await previous;
    expect(selected(engine)).toMatchObject({
      queryStatus: 'success',
      queryError: null,
      instance: { config: { filter: { op: 'GT', value: 5 } } },
    });
    expect(selected(engine).rows).toEqual([{ state: { id: 'a', amount: 10 } }]);

    const older = deferred<unknown>();
    paged.mockImplementationOnce(() => older.promise);
    const olderQuery = engine.refresh();
    await vi.waitFor(() => expect(paged).toHaveBeenCalledTimes(4));
    await engine.refresh();
    older.resolve({ total: 1, list: [{ state: { id: 'obsolete' } }] });
    await olderQuery;
    expect(selected(engine).rows[0]).toEqual({
      state: { id: 'a', amount: 10 },
    });
  });

  it('ignores a switched-away read and obsolete unknown-instance selections', async () => {
    const first = deferred<ViewInstance>();
    const second = deferred<ViewInstance>();
    const loadInstance = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { engine, paged } = setup({
      host: { loadInstance } as unknown as ViewHost,
    });
    await engine.load();
    const old = deferred<unknown>();
    paged.mockImplementationOnce(() => old.promise);
    const query = engine.refresh();
    await vi.waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
    await engine.selectInstance('shared');
    old.resolve({ total: 1, list: [{ state: { id: 'old' } }] });
    await query;
    expect(selected(engine, 'mine').rows).toEqual([]);
    const readFirst = engine.selectInstance('first');
    const readSecond = engine.selectInstance('second');
    second.resolve(instance('second'));
    await readSecond;
    first.reject(new Error('obsolete selection'));
    await readFirst;
    expect(engine.getSnapshot().selectedInstanceId).toBe('second');
    expect(engine.getSnapshot().error).toBeNull();
    expect(engine.getSnapshot().instanceIds).not.toContain('first');
  });

  it('resets cursor position on filter, sort, size and refresh and exposes no previous-page path', async () => {
    const { engine, cursor } = setup({
      instances: {
        instances: [instance('mine', 'cursor')],
        defaultInstanceId: 'mine',
      },
    });
    await engine.load();
    expect(cursor.mock.calls[0][0]).toEqual({
      filter: { op: 'MATCH_ALL' },
      sort: [],
      size: 10,
      cursor: null,
    });
    engine.setSelection(['a']);
    await engine.nextPage();
    expect(cursor.mock.calls.at(-1)?.[0].cursor).toBe('next');
    expect(selected(engine)).toMatchObject({ page: 2, selectedRowKeys: [] });
    await expect(engine.setPage(1)).rejects.toThrow();
    await engine.applyFilter(filter.gt('state.amount', 2));
    expect(cursor.mock.calls.at(-1)?.[0].cursor).toBeNull();
    await engine.nextPage();
    await engine.setSort([
      { field: 'state.amount', direction: SortDirection.ASC },
    ]);
    expect(cursor.mock.calls.at(-1)?.[0].cursor).toBeNull();
    await engine.nextPage();
    await engine.setPageSize(20);
    expect(cursor.mock.calls.at(-1)?.[0]).toMatchObject({
      cursor: null,
      size: 20,
    });
    await engine.nextPage();
    await engine.refresh();
    expect(selected(engine).page).toBe(1);
    expect(cursor.mock.calls.at(-1)?.[0].cursor).toBeNull();
  });

  it('rejects unstable or duplicate keys and malformed result metadata', async () => {
    for (const result of [
      { total: 1, list: [{ state: {} }] },
      { total: 2, list: [{ state: { id: 'a' } }, { state: { id: 'a' } }] },
      { total: -1, list: [] },
      { total: 1.5, list: [] },
      { total: 0, list: null },
    ]) {
      const { engine, paged } = setup();
      paged.mockResolvedValue(result);
      await expect(engine.load()).rejects.toThrow();
      expect(engine.getSnapshot().status).toBe('ready');
      expect(selected(engine)).toMatchObject({
        rows: [],
        queryStatus: 'error',
      });
      expect(selected(engine).queryError).toBeTruthy();
    }
    const { engine, cursor } = setup({
      instances: {
        instances: [instance('mine', 'cursor')],
        defaultInstanceId: 'mine',
      },
    });
    cursor.mockResolvedValue({ list: [], nextCursor: 5 });
    await expect(engine.load()).rejects.toThrow();
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
    expect(selected(engine).instance.config.filter.op).toBe('MATCH_ALL');
    const draft = newFilterDraft(FilterOperator.EQ, 'state.amount');
    engine.setFilterDraft(draft);
    draft.value = 999;
    expect(selected(engine).filterDraft.value).toBeUndefined();
    expect(snapshot.sessions.mine.instance.title).toBe('mine');
    expect(Object.isFrozen(host.resolveSource)).toBe(false);
  });

  it('ignores obsolete loads and prevents query dispatch or snapshot commits after disposal', async () => {
    const definitionRead = deferred<ViewDefinition>();
    const loadDefinition = vi
      .fn()
      .mockImplementationOnce(() => definitionRead.promise)
      .mockResolvedValue(definition);
    const { engine, paged } = setup({
      definition: undefined,
      host: { loadDefinition } as unknown as ViewHost,
    });
    const first = engine.load();
    await vi.waitFor(() => expect(loadDefinition).toHaveBeenCalledOnce());
    await engine.load();
    definitionRead.reject(new Error('obsolete load'));
    await first;
    expect(engine.getSnapshot().status).toBe('ready');
    const sourceRead = deferred<unknown>();
    const delayed = setup({
      host: { resolveSource: () => sourceRead.promise } as ViewHost,
    });
    const loading = delayed.engine.load();
    await vi.waitFor(() =>
      expect(selected(delayed.engine).queryStatus).toBe('loading'),
    );
    const snapshot = delayed.engine.getSnapshot();
    const listener = vi.fn();
    delayed.engine.subscribe(listener);
    delayed.engine.dispose();
    sourceRead.resolve({ paged, cursor: vi.fn() });
    await loading;
    expect(paged).toHaveBeenCalledOnce();
    expect(delayed.engine.getSnapshot()).toBe(snapshot);
    expect(listener).not.toHaveBeenCalled();
    await expect(delayed.engine.refresh()).rejects.toThrow();
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

  it('ignores an older reload rejection after a newer reload has completed', async () => {
    const old = deferred<ViewInstance>();
    const loadInstance = vi
      .fn()
      .mockImplementationOnce(() => old.promise)
      .mockResolvedValue({ ...instance(), title: 'Fresh', revision: 'r5' });
    const { engine } = setup({ host: { loadInstance } as unknown as ViewHost });
    await engine.load();
    const first = engine.reloadInstance();
    await engine.reloadInstance();
    old.reject(new Error('old reload failed'));
    await first;
    expect(selected(engine)).toMatchObject({
      baseline: { title: 'Fresh', revision: 'r5' },
      instance: { title: 'Fresh', revision: 'r5' },
      writeError: null,
    });
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
});

describe('ViewEngine writes', () => {
  it('denies unavailable writes and pending filter drafts', async () => {
    const { engine, host } = setup({
      host: { getInstancePermissions: undefined } as unknown as ViewHost,
    });
    await engine.load();
    expect(engine.getPermissions()).toEqual({
      save: false,
      saveAsPersonal: false,
      saveAsShared: false,
      delete: false,
      rename: false,
    });
    await expect(engine.save()).rejects.toThrow();
    expect(host.saveInstance).not.toHaveBeenCalled();
    const pending = setup();
    await pending.engine.load();
    pending.engine.setFilterValidity(false);
    await expect(pending.engine.save()).rejects.toThrow();
    await expect(
      pending.engine.saveAs({ title: 'New', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    expect(pending.host.saveInstance).not.toHaveBeenCalled();
    expect(pending.host.createInstance).not.toHaveBeenCalled();
    expect(selected(pending.engine).writeError).toBeTruthy();
  });

  it('captures the submitted snapshot and revision while retaining subsequent edits', async () => {
    const response = deferred<ViewInstance>();
    const saveInstance = vi.fn(() => response.promise);
    const { engine } = setup({ host: { saveInstance } as unknown as ViewHost });
    await engine.load();
    engine.setTitle('Submitted');
    const saving = engine.save();
    engine.setTitle('Latest');
    expect(saveInstance.mock.calls[0][0]).toMatchObject({
      title: 'Submitted',
      revision: 'r1',
    });
    response.resolve({ ...instance(), title: 'Submitted', revision: 'r2' });
    await saving;
    expect(selected(engine)).toMatchObject({
      baseline: { title: 'Submitted', revision: 'r2' },
      instance: { title: 'Latest', revision: 'r2' },
      dirty: true,
      writeStatus: 'idle',
    });
    engine.setTitle('Submitted');
    expect(selected(engine).dirty).toBe(false);
  });

  it('accepts host metadata changes while requiring exact persisted title, scope and config', async () => {
    const { engine } = setup({
      host: {
        saveInstance: async value => ({
          ...value,
          revision: 'r2',
          updatedAt: 'today',
        }),
        createInstance: async value => ({
          ...value,
          id: 'created',
          createdAt: 'today',
        }),
      } as unknown as ViewHost,
    });
    await engine.load();
    engine.setTitle('Submitted');
    await engine.save();
    expect(selected(engine)).toMatchObject({
      dirty: false,
      requiresReload: false,
      instance: { updatedAt: 'today' },
      baseline: { updatedAt: 'today' },
    });
    await engine.saveAs({ title: 'Copy', scope: { type: 'personal' } });
    expect(selected(engine)).toMatchObject({
      dirty: false,
      requiresReload: false,
      instance: { createdAt: 'today' },
      baseline: { createdAt: 'today' },
    });
  });

  it('blocks same-instance concurrent writes and keeps ordinary failures visible without retrying', async () => {
    const response = deferred<ViewInstance>();
    const saveInstance = vi.fn(() => response.promise);
    const { engine, host } = setup({
      host: { saveInstance } as unknown as ViewHost,
    });
    await engine.load();
    engine.setTitle('Keep draft');
    const saving = engine.save();
    await expect(
      engine.saveAs({ title: 'Duplicate', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    expect(host.createInstance).not.toHaveBeenCalled();
    response.reject(new Error('conflict'));
    await expect(saving).rejects.toThrow('conflict');
    expect(selected(engine)).toMatchObject({
      writeError: 'conflict',
      requiresReload: false,
      dirty: true,
      instance: { title: 'Keep draft' },
      baseline: { title: 'mine' },
    });
    expect(saveInstance).toHaveBeenCalledOnce();
  });

  it('requires explicit reload after a malformed or changed echo, preserving local edits against the loaded baseline', async () => {
    for (const response of [
      { ...instance(), title: 'normalized' },
      { ...instance(), definitionId: 'foreign' },
      { ...instance(), id: 'other' },
      { ...instance(), kind: 'dashboard' },
      null,
    ]) {
      const saveInstance = vi.fn().mockResolvedValue(response);
      const loadInstance = vi.fn(async () => ({
        ...instance(),
        title: 'Server title',
        revision: 'r9',
      }));
      const { engine } = setup({
        host: { saveInstance, loadInstance } as unknown as ViewHost,
      });
      await engine.load();
      engine.setTitle('My draft');
      await expect(engine.save()).rejects.toThrow();
      expect(selected(engine)).toMatchObject({
        requiresReload: true,
        instance: { title: 'My draft' },
        baseline: { title: 'mine' },
      });
      await expect(engine.save()).rejects.toThrow();
      expect(saveInstance).toHaveBeenCalledOnce();
      const draft = newFilterDraft(FilterOperator.EQ, 'state.amount');
      engine.setFilterDraft(draft);
      engine.setFilterValidity(false);
      await engine.reloadInstance();
      expect(selected(engine)).toMatchObject({
        requiresReload: false,
        dirty: true,
        filterDraft: draft,
        filterPending: true,
        instance: { title: 'My draft', revision: 'r9' },
        baseline: { title: 'Server title', revision: 'r9' },
      });
    }
  });

  it('does not let a host mutate the write request to validate a changed echo', async () => {
    const { engine } = setup({
      host: {
        saveInstance: async value => {
          value.title = 'Mutated';
          return value;
        },
      } as unknown as ViewHost,
    });
    await engine.load();
    engine.setTitle('Submitted');
    await expect(engine.save()).rejects.toThrow();
    expect(selected(engine)).toMatchObject({
      requiresReload: true,
      baseline: { title: 'mine' },
      instance: { title: 'Submitted' },
    });
  });

  it('selects a saved copy using the latest source config, leaving the source draft untouched', async () => {
    const response = deferred<ViewInstance>();
    const createInstance = vi.fn(() => response.promise);
    const { engine } = setup({
      host: { createInstance } as unknown as ViewHost,
    });
    await engine.load();
    engine.setTitle('Source draft');
    const saving = engine.saveAs({
      title: 'Copy',
      scope: { type: 'public', source: 'shared' },
    });
    engine.setColumns([
      { id: 'amount', kind: 'field', field: 'state.amount', width: 300 },
    ]);
    const latestConfig = selected(engine).instance.config;
    response.resolve({
      ...instance('created'),
      title: 'Copy',
      scope: { type: 'public', source: 'shared' },
    });
    await saving;
    expect(engine.getSnapshot().selectedInstanceId).toBe('created');
    expect(selected(engine)).toMatchObject({
      dirty: true,
      baseline: { title: 'Copy' },
      instance: { title: 'Copy', config: latestConfig },
    });
    expect(selected(engine, 'mine')).toMatchObject({
      dirty: true,
      baseline: { title: 'mine' },
      instance: { title: 'Source draft', config: latestConfig },
    });
  });

  it('adds a saved copy without stealing selection after navigation', async () => {
    const response = deferred<ViewInstance>();
    const { engine } = setup({
      host: { createInstance: () => response.promise } as unknown as ViewHost,
    });
    await engine.load();
    const saving = engine.saveAs({
      title: 'Copy',
      scope: { type: 'personal' },
    });
    await engine.selectInstance('shared');
    response.resolve({ ...instance('created'), title: 'Copy' });
    await saving;
    expect(engine.getSnapshot().selectedInstanceId).toBe('shared');
    expect(selected(engine, 'created')).toMatchObject({
      dirty: false,
      queryStatus: 'idle',
      instance: { title: 'Copy' },
    });
  });

  it('does not let save-as completion cancel a newer pending navigation', async () => {
    const write = deferred<ViewInstance>();
    const read = deferred<ViewInstance>();
    const { engine } = setup({
      host: {
        createInstance: () => write.promise,
        loadInstance: () => read.promise,
      } as unknown as ViewHost,
    });
    await engine.load();
    const saving = engine.saveAs({
      title: 'Copy',
      scope: { type: 'personal' },
    });
    const navigating = engine.selectInstance('remote');
    write.resolve({ ...instance('created'), title: 'Copy' });
    await saving;
    expect(engine.getSnapshot().selectedInstanceId).toBe('mine');
    read.resolve(instance('remote'));
    await navigating;
    expect(engine.getSnapshot().selectedInstanceId).toBe('remote');
    expect(selected(engine, 'created').queryStatus).toBe('idle');
  });

  it('rejects system-copy scopes, duplicate new IDs and mismatched copy content', async () => {
    const { engine, host } = setup();
    await engine.load();
    await expect(
      engine.saveAs({
        title: 'Copy',
        scope: { type: 'public', source: 'system' } as never,
      }),
    ).rejects.toThrow();
    expect(host.createInstance).not.toHaveBeenCalled();
    for (const result of [
      { ...instance(), title: 'Copy' },
      { ...instance('created'), title: 'Changed' },
    ]) {
      const invalid = setup({
        host: { createInstance: async () => result } as unknown as ViewHost,
      });
      await invalid.engine.load();
      await expect(
        invalid.engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
      ).rejects.toThrow();
      expect(selected(invalid.engine).requiresReload).toBe(true);
      expect(invalid.engine.getSnapshot().instanceIds).toEqual([
        'mine',
        'shared',
      ]);
    }
  });

  it('ignores write completion after disposal without adding or selecting the created instance', async () => {
    const response = deferred<ViewInstance>();
    const { engine } = setup({
      host: { createInstance: () => response.promise } as unknown as ViewHost,
    });
    await engine.load();
    const saving = engine.saveAs({
      title: 'Copy',
      scope: { type: 'personal' },
    });
    const snapshot = engine.getSnapshot();
    engine.dispose();
    response.resolve({ ...instance('created'), title: 'Copy' });
    await saving;
    expect(engine.getSnapshot()).toBe(snapshot);
    expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
  });
});

it('reload preserves the local scope against a changed server baseline', async () => {
  const saveInstance = vi.fn(async (value: ViewInstance) => ({
    ...value,
    revision: 'r10',
  }));
  const { engine } = setup({
    host: {
      loadInstance: async () => ({
        ...instance(),
        scope: { type: 'public', source: 'shared' },
        revision: 'r9',
      }),
      saveInstance,
    } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('My draft');
  await engine.reloadInstance();
  expect(selected(engine)).toMatchObject({
    dirty: true,
    instance: {
      scope: { type: 'personal' },
      title: 'My draft',
      revision: 'r9',
    },
    baseline: { scope: { type: 'public', source: 'shared' }, revision: 'r9' },
  });
  await engine.save();
  expect(saveInstance.mock.calls[0][0].scope).toEqual({ type: 'personal' });
  engine.dispose();
});

it('reconciles a changed create echo by reading the created ID and preserving both drafts', async () => {
  const persisted = {
    ...instance('created-1'),
    title: 'Normalized',
    scope: { type: 'public', source: 'shared' } as const,
    revision: 'r2',
  };
  const loadInstance = vi
    .fn<(id: string) => Promise<ViewInstance>>()
    .mockResolvedValue(persisted);
  const { engine, host } = setup({
    host: {
      createInstance: async () => persisted,
      loadInstance,
    } as unknown as ViewHost,
  });
  await engine.load();
  const source = selected(engine);
  await expect(
    engine.saveAs({ title: 'My copy', scope: { type: 'personal' } }),
  ).rejects.toThrow();
  engine.setColumns([
    { id: 'amount', kind: 'field', field: 'state.amount', width: 200 },
  ]);
  const draft = newFilterDraft(FilterOperator.GTE, 'state.amount');
  engine.setFilterDraft(draft);
  engine.setFilterValidity(false);
  await engine.reloadInstance();
  expect(loadInstance.mock.calls[0][0]).toBe('created-1');
  expect(engine.getSnapshot().selectedInstanceId).toBe('created-1');
  expect(selected(engine)).toMatchObject({
    baseline: persisted,
    dirty: true,
    instance: { title: 'My copy', scope: { type: 'personal' }, revision: 'r2' },
    filterDraft: draft,
    filterPending: true,
  });
  expect(
    selected(engine).instance.config.presentation.table.columns[0].width,
  ).toBe(200);
  expect(selected(engine, 'mine').baseline).toEqual(source.baseline);
  expect(selected(engine, 'mine').instance.title).toBe(source.instance.title);
  expect(selected(engine, 'mine').filterDraft).toEqual(draft);
  expect(host.saveInstance).not.toHaveBeenCalled();
  engine.dispose();
});

it('uses a complete list for an unknown create outcome, and keeps ambiguous outcomes blocked', async () => {
  for (const count of [0, 1, 2]) {
    const candidates = Array.from({ length: count }, (_, index) => ({
      ...instance(`created-${index}`),
      title: 'My copy',
    }));
    const listInstances = vi.fn(async () => ({
      instances: [instance(), ...candidates],
      defaultInstanceId: 'mine',
    }));
    const { engine } = setup({
      host: {
        createInstance: vi.fn().mockResolvedValue(null),
        listInstances,
      } as unknown as ViewHost,
    });
    await engine.load();
    await expect(
      engine.saveAs({ title: 'My copy', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    expect(engine.canReloadInstance()).toBe(true);
    if (count === 1) {
      await engine.reloadInstance();
      expect(engine.getSnapshot().selectedInstanceId).toBe('created-0');
      expect(selected(engine, 'mine').requiresReload).toBe(false);
    } else {
      await expect(engine.reloadInstance()).rejects.toThrow('无法确定另存结果');
      expect(selected(engine).requiresReload).toBe(true);
      await expect(
        engine.saveAs({ title: 'Again', scope: { type: 'personal' } }),
      ).rejects.toThrow();
    }
    expect(listInstances).toHaveBeenCalledOnce();
    engine.dispose();
  }
});

it('does not roll back an opened copy when its save finishes before an older reconciliation read', async () => {
  const persisted = { ...instance('created'), title: 'Normalized' };
  const oldRead = deferred<ViewInstance>();
  const loadInstance = vi
    .fn()
    .mockResolvedValueOnce(persisted)
    .mockReturnValueOnce(oldRead.promise);
  const { engine } = setup({
    host: {
      createInstance: async () => persisted,
      loadInstance,
    } as unknown as ViewHost,
  });
  await engine.load();
  await expect(
    engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).rejects.toThrow();
  await engine.selectInstance('created');
  const reload = engine.reloadInstance('mine');
  engine.setTitle('Saved by user');
  await engine.save();
  const saved = selected(engine);
  oldRead.resolve(persisted);
  await reload;
  expect(selected(engine).instance).toEqual(saved.instance);
  expect(selected(engine).baseline).toEqual(saved.baseline);
  expect(selected(engine).baseline.revision).toBe('r2');
  expect(selected(engine, 'mine').requiresReload).toBe(false);
  engine.dispose();
});

describe('ViewEngine instance deletion', () => {
  const permissions = () => ({
    save: true,
    saveAsPersonal: true,
    saveAsShared: true,
    delete: true,
  });

  it('removes only after host success, then selects a remaining instance or leaves an empty page', async () => {
    const response = deferred<void>();
    const deleteInstance = vi.fn(() => response.promise);
    const { engine } = setup({
      host: {
        deleteInstance,
        getInstancePermissions: permissions,
      } as unknown as ViewHost,
    });
    await engine.load();
    engine.setTitle('Unsaved title');
    const deleting = engine.deleteInstance();
    expect(selected(engine).writeStatus).toBe('deleting');
    expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
    expect(deleteInstance).toHaveBeenCalledWith('mine', 'r1');
    response.resolve();
    await deleting;
    expect(engine.getSnapshot().selectedInstanceId).toBe('shared');
    expect(engine.getSnapshot().sessions.mine).toBeUndefined();
    await engine.deleteInstance();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'ready',
      instanceIds: [],
      sessions: {},
      selectedInstanceId: null,
    });
    engine.dispose();
  });

  it.each(['missing-permission', 'missing-callback', 'system'] as const)(
    'denies deletion for %s before calling the host',
    async restriction => {
      const deleteInstance = vi.fn().mockResolvedValue(undefined);
      const value = instance();
      if (restriction === 'system')
        value.scope = { type: 'public', source: 'system' };
      const { engine } = setup({
        instances: { instances: [value], defaultInstanceId: 'mine' },
        host: {
          deleteInstance:
            restriction === 'missing-callback' ? undefined : deleteInstance,
          getInstancePermissions:
            restriction === 'missing-permission' ? undefined : permissions,
        } as unknown as ViewHost,
      });
      await engine.load();
      expect(engine.getPermissions().delete).toBe(false);
      await expect(engine.deleteInstance()).rejects.toThrow();
      expect(deleteInstance).not.toHaveBeenCalled();
      expect(engine.getSnapshot().instanceIds).toEqual(['mine']);
      engine.dispose();
    },
  );

  it('retains drafts on failure and blocks concurrent saves or repeated deletion', async () => {
    const response = deferred<void>();
    const deleteInstance = vi
      .fn()
      .mockReturnValueOnce(response.promise)
      .mockResolvedValue(undefined);
    const { engine } = setup({
      host: {
        deleteInstance,
        getInstancePermissions: permissions,
      } as unknown as ViewHost,
    });
    await engine.load();
    engine.setTitle('Draft');
    const deleting = engine.deleteInstance();
    await expect(engine.deleteInstance()).rejects.toThrow();
    await expect(engine.save()).rejects.toThrow();
    expect(selected(engine).writeStatus).toBe('deleting');
    response.reject(new Error('delete denied'));
    await expect(deleting).rejects.toThrow('delete denied');
    expect(selected(engine)).toMatchObject({
      dirty: true,
      instance: { title: 'Draft' },
      writeStatus: 'idle',
      writeError: 'delete denied',
    });
    expect(deleteInstance).toHaveBeenCalledTimes(1);
    await engine.deleteInstance();
    expect(engine.getSnapshot().instanceIds).toEqual(['shared']);
    engine.dispose();
  });

  it('keeps a pending navigation when deleting its previously selected instance', async () => {
    const response = deferred<void>();
    const loading = deferred<ViewInstance>();
    const { engine } = setup({
      host: {
        deleteInstance: () => response.promise,
        getInstancePermissions: permissions,
        loadInstance: () => loading.promise,
      } as unknown as ViewHost,
    });
    await engine.load();
    const deleting = engine.deleteInstance();
    const navigating = engine.selectInstance('remote');
    response.resolve();
    await deleting;
    loading.resolve(instance('remote'));
    await navigating;
    expect(engine.getSnapshot().selectedInstanceId).toBe('remote');
    expect(engine.getSnapshot().instanceIds).toEqual(['shared', 'remote']);
    engine.dispose();
  });

  it('does not report deletion as failed when the next view query fails', async () => {
    const { engine, paged } = setup({
      host: {
        deleteInstance: async () => {},
        getInstancePermissions: permissions,
      } as unknown as ViewHost,
    });
    await engine.load();
    paged.mockRejectedValue(new Error('query failed'));
    await expect(engine.deleteInstance()).resolves.toBeUndefined();
    await vi.waitFor(() => expect(selected(engine).queryStatus).toBe('error'));
    expect(engine.getSnapshot().instanceIds).toEqual(['shared']);
    expect(selected(engine).writeError).toBeNull();
    engine.dispose();
  });
  it('ignores a late query response after its view is deleted', async () => {
    const response = deferred<{
      list: { state: { id: string; amount: number } }[];
      total: number;
    }>();
    const { engine, paged } = setup({
      host: {
        deleteInstance: async () => {},
        getInstancePermissions: permissions,
      } as unknown as ViewHost,
    });
    await engine.load();
    paged.mockReturnValueOnce(response.promise);
    const refreshing = engine.refresh();
    await vi.waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
    await engine.deleteInstance();
    response.resolve({
      list: [{ state: { id: 'late', amount: 99 } }],
      total: 1,
    });
    await refreshing;
    expect(engine.getSnapshot().sessions.mine).toBeUndefined();
    expect(engine.getSnapshot().selectedInstanceId).toBe('shared');
    expect(selected(engine).rows).not.toEqual([
      { state: { id: 'late', amount: 99 } },
    ]);
    engine.dispose();
  });

  it.each(['load', 'dispose'] as const)(
    'ignores deletion completion after %s',
    async operation => {
      const response = deferred<void>();
      const { engine } = setup({
        host: {
          deleteInstance: () => response.promise,
          getInstancePermissions: permissions,
        } as unknown as ViewHost,
      });
      await engine.load();
      const deleting = engine.deleteInstance();
      await engine[operation]();
      const snapshot = engine.getSnapshot();
      response.resolve();
      await deleting;
      expect(engine.getSnapshot()).toBe(snapshot);
      engine.dispose();
    },
  );
});

describe('ViewEngine view management', () => {
  const permissions = () => ({
    save: true,
    saveAsPersonal: true,
    saveAsShared: true,
    rename: true,
    delete: true,
  });

  it('renames persisted metadata without saving draft filters, columns or newer edits', async () => {
    const response = deferred<ViewInstance>();
    const renameInstance = vi.fn(() => response.promise);
    const { engine, paged } = setup({
      host: {
        renameInstance,
        getInstancePermissions: permissions,
      } as unknown as ViewHost,
    });
    await engine.load();
    engine.setColumns([
      { id: 'amount', kind: 'field', field: 'state.amount', width: 240 },
    ]);
    const draft = newFilterDraft(FilterOperator.GTE, 'state.amount');
    engine.setFilterDraft({ ...draft, value: 50 });
    engine.setFilterValidity(false);
    const before = selected(engine);
    const renaming = engine.renameInstance('  New name  ');
    expect(renameInstance).toHaveBeenCalledWith('mine', 'New name', 'r1');
    expect(selected(engine).writeStatus).toBe('renaming');
    await expect(engine.deleteInstance()).rejects.toThrow();
    response.resolve({ ...instance(), title: 'New name', revision: 'r2' });
    await renaming;
    expect(selected(engine)).toMatchObject({
      baseline: {
        title: 'New name',
        revision: 'r2',
        config: instance().config,
      },
      instance: { title: 'New name', config: before.instance.config },
      dirty: true,
      filterPending: true,
      filterDraft: before.filterDraft,
    });
    expect(paged).toHaveBeenCalledTimes(1);
    engine.dispose();
  });

  it('protects system names even when the host grants every permission', async () => {
    const renameInstance = vi.fn();
    const { engine } = setup({
      instances: {
        instances: [
          { ...instance(), scope: { type: 'public', source: 'system' } },
        ],
        defaultInstanceId: 'mine',
      },
      host: {
        renameInstance,
        getInstancePermissions: permissions,
      } as unknown as ViewHost,
    });
    await engine.load();
    expect(engine.getPermissions().rename).toBe(false);
    expect(() => engine.setTitle('Changed')).toThrow();
    await expect(engine.renameInstance('Changed')).rejects.toThrow();
    expect(renameInstance).not.toHaveBeenCalled();
    expect(selected(engine).instance.title).toBe('mine');
    engine.dispose();
  });

  it('rejects changed content from a rename response and requires reconciliation', async () => {
    const { engine } = setup({
      host: {
        renameInstance: async () => ({
          ...instance(),
          title: 'New',
          config: {
            ...instance().config,
            filter: filter.gte('state.amount', 99),
          },
        }),
        getInstancePermissions: permissions,
      } as unknown as ViewHost,
    });
    await engine.load();
    await expect(engine.renameInstance('New')).rejects.toThrow();
    expect(selected(engine)).toMatchObject({
      requiresReload: true,
      writeStatus: 'idle',
      instance: { title: 'mine' },
    });
    engine.dispose();
  });

  it('persists personal ordering without changing selection or querying', async () => {
    const response = deferred<void>();
    const saveInstanceOrder = vi
      .fn()
      .mockReturnValueOnce(response.promise)
      .mockResolvedValue(undefined);
    const { engine, paged } = setup({
      host: { saveInstanceOrder } as unknown as ViewHost,
    });
    await engine.load();
    const ordering = engine.reorderInstances(['shared', 'mine']);
    expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
    await expect(engine.reorderInstances(['shared', 'mine'])).rejects.toThrow();
    response.reject(new Error('order failed'));
    await expect(ordering).rejects.toThrow('order failed');
    expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
    await engine.reorderInstances(['shared', 'mine']);
    expect(saveInstanceOrder).toHaveBeenLastCalledWith('orders', [
      'shared',
      'mine',
    ]);
    expect(engine.getSnapshot().instanceIds).toEqual(['shared', 'mine']);
    expect(engine.getSnapshot().selectedInstanceId).toBe('mine');
    expect(paged).toHaveBeenCalledTimes(1);
    for (const ids of [['mine'], ['mine', 'mine'], ['mine', 'unknown']])
      await expect(engine.reorderInstances(ids)).rejects.toThrow();
    expect(saveInstanceOrder).toHaveBeenCalledTimes(2);
    engine.dispose();
  });

  it('does not resurrect a deleted view or drop a new one when order persistence finishes late', async () => {
    const response = deferred<void>();
    const { engine } = setup({
      host: {
        saveInstanceOrder: () => response.promise,
        deleteInstance: async () => {},
        getInstancePermissions: permissions,
      } as unknown as ViewHost,
    });
    await engine.load();
    const ordering = engine.reorderInstances(['shared', 'mine']);
    await engine.saveAs({ title: 'Copy', scope: { type: 'personal' } });
    await engine.deleteInstance('mine');
    response.resolve();
    await ordering;
    expect(engine.getSnapshot().instanceIds).toEqual(['shared', 'created']);
    expect(engine.getSnapshot().selectedInstanceId).toBe('created');
    engine.dispose();
  });
});

describe('background record refresh', () => {
  it('retains the current records until a successful refresh replaces them', async () => {
    const response = deferred<{
      list: { state: { id: string; amount: number } }[];
      total: number;
    }>();
    const { engine, paged } = setup();
    await engine.load();
    engine.setColumns([
      { id: 'amount', kind: 'field', field: 'state.amount', width: 240 },
    ]);
    const before = selected(engine);
    paged.mockReturnValueOnce(response.promise);
    const refreshing = engine.refresh(undefined, { background: true });
    expect(selected(engine)).toMatchObject({
      rows: before.rows,
      queryStatus: 'success',
      refreshing: true,
    });
    await engine.refresh(undefined, { background: true });
    response.resolve({ list: [{ state: { id: 'b', amount: 20 } }], total: 1 });
    await refreshing;
    expect(selected(engine)).toMatchObject({
      rows: [{ state: { id: 'b', amount: 20 } }],
      refreshing: false,
      dirty: true,
    });
    expect(paged).toHaveBeenCalledTimes(2);
    engine.dispose();
  });

  it('preserves a selection made while a background read is in flight', async () => {
    const response = deferred<{
      list: { state: { id: string; amount: number } }[];
      total: number;
    }>();
    const { engine, paged } = setup();
    await engine.load();
    paged.mockReturnValueOnce(response.promise);
    const refreshing = engine.refresh(undefined, { background: true });
    await vi.waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
    engine.setSelection(['a']);
    response.resolve({ list: [{ state: { id: 'b', amount: 20 } }], total: 1 });
    await refreshing;
    expect(selected(engine)).toMatchObject({
      selectedRowKeys: ['a'],
      rows: [{ state: { id: 'a', amount: 10 } }],
      refreshing: false,
    });
    engine.dispose();
  });

  it('keeps records on failure and waits for an explicit retry', async () => {
    const { engine, paged } = setup();
    await engine.load();
    paged.mockRejectedValueOnce(new Error('temporarily unavailable'));
    await expect(
      engine.refresh(undefined, { background: true }),
    ).rejects.toThrow('temporarily unavailable');
    expect(selected(engine)).toMatchObject({
      rows: [{ state: { id: 'a', amount: 10 } }],
      queryStatus: 'error',
      refreshing: false,
    });
    await engine.refresh(undefined, { background: true });
    expect(paged).toHaveBeenCalledTimes(2);
    await engine.refresh();
    expect(selected(engine).queryStatus).toBe('success');
    engine.dispose();
  });

  it('does not refresh selected records, pending filters or a later cursor page', async () => {
    const { engine, paged } = setup();
    await engine.load();
    engine.setSelection(['a']);
    await engine.refresh(undefined, { background: true });
    engine.setSelection([]);
    engine.setFilterValidity(false);
    await engine.refresh(undefined, { background: true });
    expect(paged).toHaveBeenCalledTimes(1);
    engine.dispose();
    const cursorView = setup({
      instances: {
        instances: [instance('mine', 'cursor')],
        defaultInstanceId: 'mine',
      },
    });
    await cursorView.engine.load();
    await cursorView.engine.nextPage();
    await cursorView.engine.refresh(undefined, { background: true });
    expect(cursorView.cursor).toHaveBeenCalledTimes(2);
    expect(selected(cursorView.engine).page).toBe(2);
    cursorView.engine.dispose();
  });
});

it('waits for an in-flight all-record summary before another background refresh', async () => {
  const paged = vi.fn().mockResolvedValue({
    list: [{ state: { id: 'a', amount: 10 } }],
    total: 1,
  });
  const aggregate = vi.fn(() => new Promise<never>(() => {}));
  const value = instance();
  value.config.presentation.table.columns[0] = {
    id: 'amount',
    kind: 'field',
    field: 'state.amount',
    summary: ['SUM'],
  };
  const { engine } = setup({
    instances: { instances: [value], defaultInstanceId: value.id },
    host: {
      resolveSource: () => ({ paged, cursor: vi.fn(), aggregate }),
    } as unknown as ViewHost,
  });
  await engine.load();
  expect(selected(engine).allSummary.status).toBe('loading');
  await engine.refresh(undefined, { background: true });
  expect(paged).toHaveBeenCalledTimes(1);
  engine.dispose();
});
