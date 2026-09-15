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

import { afterEach, expect, it, vi } from 'vitest';
import type { ViewEngine } from '../../src/engine/ViewEngine.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import type {
  ViewEngineOptions,
  ViewInstance,
} from '../../src/contracts/viewModel.js';
import {
  ViewServiceError,
  committedWrite,
  rejectedWrite,
  type PreferenceState,
  type ReadOptions,
  type WriteObservation,
} from '../../src/contracts/viewServiceContract.js';
import {
  catalogHost,
  deferred,
  definition,
  instance,
  page,
  preference,
  preferenceWrite,
  selected,
  setup,
} from './fixtures.js';

const engines: ViewEngine[] = [];
function fixture(options: Partial<ViewEngineOptions> = {}) {
  const result = setup(options);
  engines.push(result.engine);
  return result;
}
afterEach(() => engines.splice(0).forEach(engine => engine.dispose()));

it.each(['success', 'failure'] as const)(
  'blocks full load until an ordering write completes with %s',
  async result => {
    const pending = deferred<WriteObservation<PreferenceState>>();
    const saveOrder = vi.fn(() => pending.promise);
    const catalog = catalogHost([instance(), instance('shared')], 'mine');
    const { engine } = fixture({
      instances: undefined,
      host: {
        instance: catalog.instance,
        preference: { ...catalog.preference, saveOrder },
      } as ViewHost,
    });
    await engine.load();
    const ordering = engine.reorderInstances(['shared', 'mine']);
    const before = engine.getSnapshot();
    try {
      await expect(engine.load()).rejects.toThrow('视图顺序正在保存');
      expect(catalog.instance.list).toHaveBeenCalledOnce();
      expect(engine.getSnapshot()).toBe(before);
      if (result === 'failure') {
        pending.resolve(rejectedWrite('REVISION_CONFLICT', 'stale order'));
        await expect(ordering).rejects.toThrow('stale order');
        expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
      } else {
        pending.resolve(preferenceWrite('mine', 'p2', ['shared', 'mine']));
        await ordering;
        expect(engine.getSnapshot().instanceIds).toEqual(['shared', 'mine']);
      }
      await engine.load();
      expect(catalog.instance.list).toHaveBeenCalledTimes(2);
    } finally {
      pending.resolve(preferenceWrite('mine'));
      await ordering.catch(() => {});
    }
  },
);

it('retries the failed cursor page without losing its position or cycle history, while refresh starts over', async () => {
  const { engine, cursor } = fixture({
    instances: [instance('mine', 'cursor')],
    defaultInstanceId: 'mine',
  });
  cursor
    .mockResolvedValueOnce({ list: [], nextCursor: 'a' })
    .mockResolvedValueOnce({ list: [], nextCursor: 'b' })
    .mockRejectedValueOnce(new Error('temporary failure'))
    .mockResolvedValueOnce({ list: [], nextCursor: 'c' })
    .mockResolvedValueOnce({ list: [], nextCursor: 'a' })
    .mockResolvedValueOnce({ list: [], nextCursor: 'a' });
  await engine.load();
  await engine.record(engine.getSnapshot().selectedInstanceId!).nextPage();
  await expect(
    engine.record(engine.getSnapshot().selectedInstanceId!).nextPage(),
  ).rejects.toThrow('temporary failure');
  await engine.record(engine.getSnapshot().selectedInstanceId!).retryQuery();
  expect(selected(engine)).toMatchObject({
    page: 3,
    cursor: 'b',
    nextCursor: 'c',
    queryStatus: 'success',
  });
  await expect(
    engine.record(engine.getSnapshot().selectedInstanceId!).nextPage(),
  ).rejects.toThrow('重复分页游标');
  await engine.record(engine.getSnapshot().selectedInstanceId!).refresh();
  expect(selected(engine)).toMatchObject({
    page: 1,
    cursor: null,
    nextCursor: 'a',
    queryStatus: 'success',
  });
  expect(cursor.mock.calls.map(([query]) => query.cursor)).toEqual([
    null,
    'a',
    'b',
    'b',
    'c',
    null,
  ]);
});

it.each(['', 'missing', 0, false])(
  'rejects invalid local default %s before any instance is opened',
  async defaultInstanceId => {
    const { engine, paged } = fixture({
      instances: [instance()],
      defaultInstanceId: defaultInstanceId as string,
    });
    await expect(engine.load()).rejects.toThrow('默认视图');
    expect(engine.getSnapshot()).toMatchObject({
      status: 'error',
      selectedInstanceId: null,
    });
    expect(paged).not.toHaveBeenCalled();
  },
);

it.each([undefined, '', 0, false])(
  'isolates an invalid host preference default %s from the catalog and from instance reloads',
  async defaultInstanceId => {
    let remote = instance();
    const catalog = catalogHost([instance()], undefined, null, () => remote);
    const loadPreference = vi.fn(async () => ({
      ...preference('mine'),
      defaultInstanceId,
      effectiveDefaultInstanceId: defaultInstanceId,
    }));
    const { engine, paged } = fixture({
      instances: undefined,
      host: {
        instance: catalog.instance,
        preference: { load: loadPreference },
      } as unknown as ViewHost,
    });
    await engine.load();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'ready',
      error: null,
      selectedInstanceId: null,
      instanceIds: ['mine'],
      catalog: { status: 'ready' },
      preference: {
        status: 'error',
        error: expect.stringContaining('默认视图'),
      },
    });
    expect(paged).not.toHaveBeenCalled();
    await engine.selectInstance('mine');
    engine.setTitle('Local edit');
    remote = { ...instance(), revision: 'r2' };
    // A point reload never consults the preference document again.
    await engine.reloadInstance();
    expect(selected(engine)).toMatchObject({
      baseline: { revision: 'r2' },
      instance: { title: 'Local edit' },
    });
    expect(loadPreference).toHaveBeenCalledOnce();
  },
);

it('keeps the workspace usable when the host default is not in the catalog', async () => {
  const catalog = catalogHost([instance()], 'missing');
  const { engine, paged } = fixture({
    instances: undefined,
    host: catalog as unknown as ViewHost,
  });
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    error: '无法加载实例：missing',
    selectedInstanceId: null,
    instanceIds: ['mine'],
    preference: { status: 'ready' },
  });
  expect(paged).not.toHaveBeenCalled();
  await engine.selectInstance('mine');
  expect(engine.getSnapshot()).toMatchObject({
    selectedInstanceId: 'mine',
    error: null,
  });
  expect(paged).toHaveBeenCalledOnce();
});

it('clears failed navigation when the current valid instance is selected without discarding edits or querying again', async () => {
  const catalog = catalogHost([instance(), instance('shared')], 'mine');
  const load = vi.fn((id: string) =>
    id === 'missing'
      ? Promise.reject(new Error('not found'))
      : catalog.instance.load(id),
  );
  const { engine, paged } = fixture({
    instances: undefined,
    host: {
      instance: { list: catalog.instance.list, load },
      preference: catalog.preference,
    } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('Draft');
  await expect(engine.selectInstance('missing')).rejects.toThrow('not found');
  const session = selected(engine, 'mine');
  expect(engine.getSnapshot().error).toBe('not found');
  await engine.selectInstance('mine');
  expect(engine.getSnapshot().error).toBeNull();
  expect(selected(engine).instance).toBe(session.instance);
  expect(paged).toHaveBeenCalledOnce();
});

it.each([undefined, '', '   '])(
  'rejects an empty revision %j from lists, reads and writes without replacing the baseline',
  async revision => {
    const invalid = { ...instance(), revision } as unknown as ViewInstance;
    const listed = fixture({
      instances: [invalid],
      defaultInstanceId: 'mine',
    });
    await expect(listed.engine.load()).rejects.toThrow('revision');
    expect(listed.paged).not.toHaveBeenCalled();
    const catalogued = fixture({
      instances: undefined,
      host: {
        instance: { list: async () => page([invalid]) },
      } as unknown as ViewHost,
    });
    await catalogued.engine.load();
    expect(catalogued.engine.getSnapshot()).toMatchObject({
      status: 'ready',
      instanceIds: [],
      catalog: { status: 'error', error: expect.stringContaining('revision') },
    });
    expect(catalogued.paged).not.toHaveBeenCalled();
    let remote = invalid;
    const catalog = catalogHost([instance()], 'mine', null, () => remote);
    const { engine, host } = fixture({
      instances: undefined,
      host: catalog as unknown as ViewHost,
    });
    await engine.load();
    const baseline = selected(engine).baseline;
    await expect(engine.reloadInstance()).rejects.toThrow('revision');
    expect(selected(engine).baseline).toBe(baseline);
    host.instance!.save = vi.fn(async () => committedWrite(invalid, 'r2'));
    await expect(engine.save()).rejects.toThrow('revision');
    expect(selected(engine)).toMatchObject({ baseline, requiresReload: true });
    remote = { ...instance(), revision: 'r2' };
    await engine.reloadInstance();
    expect(selected(engine)).toMatchObject({
      baseline: { revision: 'r2' },
      requiresReload: false,
    });
  },
);

it('saves a copy without querying and keeps a later explicit query failure out of write recovery', async () => {
  const { engine, host, paged } = fixture();
  await engine.load();
  expect(
    await engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).toBe('created');
  expect(paged).toHaveBeenCalledOnce();
  expect(engine.getSnapshot().selectedInstanceId).toBe('created');
  paged.mockRejectedValueOnce(new Error('records offline'));
  await expect(
    engine.record(engine.getSnapshot().selectedInstanceId!).refresh(),
  ).rejects.toThrow('records offline');
  expect(selected(engine)).toMatchObject({
    writeError: null,
    requiresReload: false,
    queryStatus: 'error',
  });
  await engine.record(engine.getSnapshot().selectedInstanceId!).retryQuery();
  expect(selected(engine).queryStatus).toBe('success');
  expect(host.instance!.create).toHaveBeenCalledOnce();
});

it('keeps a successful creation reconciliation successful when its record query fails', async () => {
  const create = vi
    .fn()
    .mockRejectedValueOnce(
      new ViewServiceError('UNKNOWN_OUTCOME', 'lost response'),
    )
    .mockResolvedValueOnce(
      committedWrite({ ...instance('created'), title: 'Copy' }, 'r1'),
    );
  const { engine, paged } = fixture({
    host: { instance: { create } } as ViewHost,
  });
  await engine.load();
  await expect(
    engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('lost response');
  paged.mockRejectedValueOnce(new Error('query offline'));
  await expect(engine.reloadInstance()).resolves.toBeUndefined();
  await vi.waitFor(() =>
    expect(selected(engine).queryError).toBe('query offline'),
  );
  expect(selected(engine, 'mine').requiresReload).toBe(false);
  expect(engine.getSnapshot().selectedInstanceId).toBe('created');
  await engine.record(engine.getSnapshot().selectedInstanceId!).retryQuery();
  expect(create).toHaveBeenCalledTimes(2);
});

it.each(['save', 'rename', 'delete', 'order'] as const)(
  'rejects a new %s dispatched by query cancellation while a full load is starting',
  async operation => {
    const stalled = deferred<{ list: never[]; total: number }>();
    const rename = vi.fn(),
      remove = vi.fn(),
      saveOrder = vi.fn().mockResolvedValue(undefined);
    const { engine, host, paged } = fixture({
      host: {
        instance: { rename, delete: remove },
        preference: { saveOrder },
        permission: {
          getInstance: () => ({ save: true, rename: true, delete: true }),
        },
      } as ViewHost,
    });
    await engine.load();
    let outcome: Promise<unknown> | undefined;
    paged.mockImplementationOnce(
      (_query, _attributes, controller: AbortController) => {
        controller.signal.addEventListener(
          'abort',
          () => {
            outcome = (
              operation === 'save'
                ? engine.save()
                : operation === 'rename'
                  ? engine.renameInstance('Changed')
                  : operation === 'delete'
                    ? engine.deleteInstance()
                    : engine.reorderInstances(['shared', 'mine'])
            ).then(
              () => null,
              error => error,
            );
          },
          { once: true },
        );
        return stalled.promise;
      },
    );
    const reading = engine
      .record(engine.getSnapshot().selectedInstanceId!)
      .refresh();
    await vi.waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
    await engine.load();
    expect(await outcome).toBeInstanceOf(Error);
    expect(String(await outcome)).toContain('正在加载');
    expect(host.instance!.save).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(saveOrder).not.toHaveBeenCalled();
    expect(engine.getSnapshot().status).toBe('ready');
    stalled.resolve({ list: [], total: 0 });
    await reading;
  },
);

it('keeps an in-flight navigation newer than the copy recovered by reconciliation', async () => {
  const remote = deferred<ViewInstance>();
  const persisted = { ...instance('created'), title: 'Normalized' };
  const catalog = catalogHost([instance(), instance('shared')], 'mine');
  const load = vi.fn((id: string) => {
    if (id === 'created') return Promise.resolve(persisted);
    if (id !== 'remote') return catalog.instance.load(id);
    return remote.promise;
  });
  const { engine } = fixture({
    instances: undefined,
    host: {
      instance: {
        list: catalog.instance.list,
        create: async () => committedWrite(persisted, 'r1'),
        load,
      },
      preference: catalog.preference,
    } as unknown as ViewHost,
  });
  await engine.load();
  await expect(
    engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('原样保存契约');
  const navigating = engine.selectInstance('remote');
  await engine.reloadInstance('mine');
  // The reconciled copy is opened but never steals the selection from the pending navigation.
  expect(engine.getSnapshot().openingInstanceId).toBe('remote');
  remote.resolve(instance('remote'));
  await navigating;
  expect(engine.getSnapshot().selectedInstanceId).toBe('remote');
  expect(engine.getSnapshot().sessions.created.baseline).toEqual(persisted);
  expect(selected(engine, 'mine').requiresReload).toBe(false);
});

it('does not abort a newer full load started by a canceled instance-selection observer', async () => {
  const pending = deferred<ViewInstance>();
  let newest: Promise<void> | undefined;
  const catalog = catalogHost([instance(), instance('shared')], 'mine');
  const { engine } = fixture({
    definition: undefined,
    instances: undefined,
    host: {
      definition: {
        load: async (_id: string, { signal }: ReadOptions = {}) => {
          signal?.throwIfAborted();
          return definition;
        },
      },
      instance: {
        list: catalog.instance.list,
        load: (id: string, { signal }: ReadOptions = {}) => {
          if (id !== 'remote') return catalog.instance.load(id);
          signal!.addEventListener(
            'abort',
            () => {
              newest = engine.load();
            },
            { once: true },
          );
          return pending.promise;
        },
      },
      preference: catalog.preference,
    } as unknown as ViewHost,
  });
  await engine.load();
  const selecting = engine.selectInstance('remote');
  await engine.load();
  await expect(newest).resolves.toBeUndefined();
  pending.resolve(instance('remote'));
  await selecting;
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    selectedInstanceId: 'mine',
    error: null,
  });
});

it('keeps a newer load in progress when failure cleanup aborts the older request', async () => {
  const repaired = deferred<typeof definition>();
  let newest: Promise<void> | undefined;
  let attempts = 0;
  const { engine } = fixture({
    definition: undefined,
    host: {
      definition: {
        load: async (_id: string, { signal }: ReadOptions = {}) => {
          if (attempts++ === 0) {
            signal!.addEventListener(
              'abort',
              () => {
                newest = engine.load();
              },
              { once: true },
            );
            throw new Error('old definition failed');
          }
          return repaired.promise;
        },
      },
    } as ViewHost,
  });
  await expect(engine.load()).resolves.toBeUndefined();
  expect(engine.getSnapshot()).toMatchObject({
    status: 'loading',
    error: null,
  });
  repaired.resolve(definition);
  await newest;
  expect(engine.getSnapshot()).toMatchObject({ status: 'ready', error: null });
});

it('rejects selection reentered during full load before it can capture an obsolete definition', async () => {
  const oldRead = deferred<ViewInstance>();
  const lateRead = deferred<ViewInstance>();
  let currentDefinition = definition;
  let currentInstance = instance();
  let reentered: Promise<unknown> | undefined;
  const load = vi.fn((id: string, { signal }: ReadOptions = {}) => {
    if (id === 'mine') return Promise.resolve(structuredClone(currentInstance));
    if (id === 'late') return lateRead.promise;
    signal!.addEventListener(
      'abort',
      () => {
        reentered = engine.selectInstance('late').then(
          () => null,
          error => error,
        );
      },
      { once: true },
    );
    return oldRead.promise;
  });
  const { engine } = fixture({
    definition: undefined,
    instances: undefined,
    host: {
      definition: { load: async () => currentDefinition },
      instance: { list: async () => page([currentInstance]), load },
      preference: { load: async () => preference('mine') },
    } as unknown as ViewHost,
  });
  await engine.load();
  const selecting = engine.selectInstance('old');
  currentDefinition = { ...definition, fields: [definition.fields[0]] };
  currentInstance = instance();
  currentInstance.config.presentation.table.columns = [
    { id: 'id', kind: 'field', field: 'state.id' },
  ];
  await engine.load();
  lateRead.resolve(instance('late'));
  oldRead.resolve(instance('old'));
  await selecting;
  expect(await reentered).toBeInstanceOf(Error);
  expect(String(await reentered)).toContain('正在加载');
  expect(load.mock.calls.map(([id]) => id)).toEqual(['mine', 'old', 'mine']);
  expect(
    engine.getSnapshot().definition?.fields.map(field => field.field),
  ).toEqual(['state.id']);
  expect(engine.getSnapshot().instanceIds).toEqual(['mine']);
  expect(engine.getSnapshot().sessions.late).toBeUndefined();
  load.mockResolvedValueOnce({ ...currentInstance, id: 'late' });
  await engine.selectInstance('late');
  expect(engine.getSnapshot().selectedInstanceId).toBe('late');
  expect(
    selected(engine).instance.config.presentation.table.columns[0].field,
  ).toBe('state.id');
});

it.each([
  'refresh',
  'retry',
  'sort',
  'apply',
  'page',
  'pageSize',
  'next',
  'restore',
  'summary',
] as const)(
  'rejects %s reentered by summary cancellation before it can capture a stale query context',
  async operation => {
    const oldRows = deferred<{
      list: { state: { id: string; amount: number } }[];
      total: number;
    }>();
    const firstSummary = deferred<{ summary0: number }[]>();
    const lateSummary = deferred<{ summary0: number }[]>();
    const oldDefinition = { ...definition, sourceId: 'old' };
    let currentDefinition = oldDefinition;
    const saved = instance();
    saved.config.presentation.table.columns[0].summary = ['SUM'];
    let attempt: Promise<unknown> | undefined;
    const paged = vi
      .fn()
      .mockResolvedValueOnce({
        list: [{ state: { id: 'original', amount: 1 } }],
        total: 1,
      })
      .mockReturnValue(oldRows.promise);
    const aggregate = vi.fn(
      (_query, _attributes, controller: AbortController) => {
        if (aggregate.mock.calls.length > 1) return lateSummary.promise;
        controller.signal.addEventListener(
          'abort',
          () => {
            const actions = {
              refresh: () => engine.record('mine').refresh(),
              retry: () => engine.record('mine').retryQuery(),
              sort: () => engine.record('mine').setSort([]),
              apply: () => engine.record('mine').applyFilter(),
              page: () => engine.record('mine').setPage(2),
              pageSize: () => engine.record('mine').setPageSize(20),
              next: () => engine.record('mine').nextPage(),
              restore: () => engine.restore('mine'),
              summary: () => engine.record('mine').refreshSummary(),
            };
            attempt = actions[operation]().then(
              () => null,
              error => error,
            );
          },
          { once: true },
        );
        return firstSummary.promise;
      },
    );
    const newerSource = {
      paged: vi.fn().mockResolvedValue({
        list: [{ state: { newId: 'fresh', amount: 2 } }],
        total: 1,
      }),
      aggregate: vi.fn().mockResolvedValue([{ summary0: 2 }]),
    };
    const { engine } = fixture({
      definition: undefined,
      instances: undefined,
      host: {
        definition: { load: async () => currentDefinition },
        instance: {
          list: async () => page([saved]),
          load: async () => structuredClone(saved),
        },
        preference: {
          load: async () =>
            preference(currentDefinition === oldDefinition ? 'mine' : null),
        },
        resolveSource: id =>
          id === 'old' ? { paged, aggregate } : newerSource,
      } as unknown as ViewHost,
    });
    await engine.load();
    currentDefinition = {
      ...definition,
      sourceId: 'new',
      record: { ...definition.record, rowKey: 'state.newId' },
      fields: [
        { field: 'state.newId', label: 'ID', type: 'string' },
        definition.fields[1],
      ],
    };
    await engine.load();
    oldRows.resolve({
      list: [{ state: { id: 'stale', amount: 999 } }],
      total: 1,
    });
    lateSummary.resolve([{ summary0: 999 }]);
    firstSummary.resolve([{ summary0: 1 }]);
    expect(await attempt).toBeInstanceOf(Error);
    expect(String(await attempt)).toContain('正在加载');
    expect(paged).toHaveBeenCalledOnce();
    expect(aggregate).toHaveBeenCalledOnce();
    expect(engine.getSnapshot().selectedInstanceId).toBeNull();
    // Nothing is selected after the newer load, so the stale results have no session to land in.
    expect(engine.getSnapshot().sessions.mine).toBeUndefined();
    await engine.selectInstance('mine');
    expect(selected(engine).rows).toEqual([
      { state: { newId: 'fresh', amount: 2 } },
    ]);
    await vi.waitFor(() =>
      expect(selected(engine).allSummary.status).toBe('success'),
    );
    expect(newerSource.paged).toHaveBeenCalledOnce();
    expect(newerSource.aggregate).toHaveBeenCalledOnce();
  },
);
