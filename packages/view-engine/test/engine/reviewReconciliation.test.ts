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
import { FilterOperator } from '@ahoo-wang/fetcher-wow';
import {
  newFilterNode,
  createFilterConfiguration,
} from '../../src/filter/filterCore.js';

import { afterEach, expect, it, vi } from 'vitest';

import {
  ViewServiceError,
  committedWrite,
  rejectedWrite,
  type WriteObservation,
} from '../../src/contracts/viewServiceContract.js';
import {
  catalogHost,
  deferred,
  deleteReceipt,
  instance,
  liveCatalog,
  selected,
  setup,
} from './fixtures.js';
import type { ViewEngine } from '../../src/engine/ViewEngine.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import type {
  ViewCreateInput,
  ViewInstance,
} from '../../src/contracts/viewModel.js';

const engines: ViewEngine[] = [];
afterEach(() => engines.splice(0).forEach(engine => engine.dispose()));

/** Create port whose first response is lost; every replay commits the copy as `created`. */
function lostThenCommitted() {
  return vi
    .fn()
    .mockRejectedValueOnce(new ViewServiceError('UNKNOWN_OUTCOME', 'lost'))
    .mockImplementation(async (value: ViewCreateInput) =>
      committedWrite({ ...value, id: 'created', revision: 'r1' }, 'r1'),
    );
}
/** Point reads over a live catalog with a dedicated response for the created copy. */
function readsWithCreated(
  catalog: ReturnType<typeof liveCatalog>,
  created: (reads: number) => Promise<ViewInstance> | ViewInstance,
) {
  let reads = 0;
  return vi.fn(async (id: string) =>
    id === 'created' ? created(reads++) : catalog.host.instance.load(id),
  );
}

it('uses authoritative scope while retaining editable title and filter draft on reload', async () => {
  const remote = {
    ...instance(),
    scope: { type: 'public', source: 'shared' } as const,
    revision: 'r2',
  };
  const catalog = catalogHost(
    [instance(), instance('shared')],
    'mine',
    null,
    () => remote,
  );
  const { engine, host } = setup({
    instances: undefined,
    host: catalog as unknown as ViewHost,
  });
  engines.push(engine);
  await engine.load();
  engine.setTitle('Local title');
  const draft = {
    ...newFilterNode(FilterOperator.GTE, 'state.amount'),
    props: { value: 42 },
  };
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setFilterDraft(createFilterConfiguration(draft));
  await engine.reloadInstance();
  expect(selected(engine).instance.scope).toEqual(remote.scope);
  expect(selected(engine).instance.title).toBe('Local title');
  expect(selected(engine).filterDraft.root).toEqual(draft);
  await engine.record(engine.getSnapshot().selectedInstanceId!).applyFilter();
  await engine.save();
  expect(vi.mocked(host.instance!.save!).mock.calls[0][0].scope).toEqual(
    remote.scope,
  );
});

it('retains an absent source only for creation recovery across repeated full loads', async () => {
  const catalog = liveCatalog([instance()]);
  const create = lostThenCommitted();
  const { engine, paged } = setup({
    instances: undefined,
    host: {
      instance: { ...catalog.host.instance, create },
      preference: catalog.host.preference,
    } as unknown as ViewHost,
  });
  engines.push(engine);
  await engine.load();
  engine.setTitle('Local title');
  await expect(
    engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('lost');
  const draft = {
    ...newFilterNode(FilterOperator.GTE, 'state.amount'),
    props: { value: 42 },
  };
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setFilterDraft(createFilterConfiguration(draft));
  catalog.set([], null);
  await engine.load();
  await engine.load();
  expect(engine.getSnapshot().instanceIds).toEqual([]);
  expect(engine.getSnapshot().sessions.mine).toBeUndefined();
  expect(engine.getSnapshot().pendingCreates.mine.filterDraft.root).toEqual(
    draft,
  );
  expect(engine.getSnapshot().pendingCreates.mine.rows).toEqual([]);
  expect(engine.canReloadInstance('mine')).toBe(true);
  await expect(engine.record('mine').refresh()).rejects.toThrow();
  await expect(engine.save('mine')).rejects.toThrow();
  await engine.reloadInstance('mine');
  expect(create.mock.calls[1][1].requestId).toBe(
    create.mock.calls[0][1].requestId,
  );
  expect(create.mock.calls[1][0]).toEqual(create.mock.calls[0][0]);
  expect(engine.getSnapshot().pendingCreates).toEqual({});
  expect(engine.getSnapshot().instanceIds).toEqual(['created']);
  expect(selected(engine, 'created').filterDraft.root).toEqual(draft);
  expect(selected(engine, 'created').appliedFilter).toEqual({
    op: FilterOperator.MATCH_ALL,
  });
  expect(selected(engine, 'created').filterPending).toBe(true);
  expect(paged).toHaveBeenCalledOnce();
});

it('removes an absent recovery entry when the original creation is definitively rejected', async () => {
  const pending = deferred<WriteObservation<ViewInstance>>();
  const catalog = liveCatalog([instance()]);
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { ...catalog.host.instance, create: () => pending.promise },
      preference: catalog.host.preference,
    } as unknown as ViewHost,
  });
  engines.push(engine);
  await engine.load();
  const writing = engine.saveAs({ title: 'Copy', scope: { type: 'personal' } });
  catalog.set([], null);
  await engine.load();
  expect(engine.canReloadInstance('mine')).toBe(true);
  pending.resolve(rejectedWrite('FORBIDDEN', 'denied'));
  await writing;
  expect(engine.getSnapshot().pendingCreates).toEqual({});
  expect(engine.canReloadInstance('mine')).toBe(false);
});

it('keeps absent recovery context on permission denial and uses current authority when access returns', async () => {
  const catalog = liveCatalog([instance()]);
  const create = lostThenCommitted();
  let allowed = true;
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { ...catalog.host.instance, create },
      preference: catalog.host.preference,
      permission: { getInstance: () => ({ saveAsPersonal: allowed }) },
    } as unknown as ViewHost,
  });
  engines.push(engine);
  await engine.load();
  await expect(
    engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('lost');
  catalog.set([], null);
  await engine.load();
  allowed = false;
  await expect(engine.reloadInstance('mine')).rejects.toThrow('未允许');
  expect(create).toHaveBeenCalledOnce();
  expect(engine.getSnapshot().pendingCreates.mine.requiresReload).toBe(true);
  expect(engine.canReloadInstance('constructor')).toBe(false);
  await expect(engine.selectInstance('mine')).rejects.toThrow('待核对');
  allowed = true;
  await engine.reloadInstance('mine');
  expect(create).toHaveBeenCalledTimes(2);
  expect(engine.getSnapshot().pendingCreates).toEqual({});
});

it('adopts authoritative scope when reconciling a known created ID after its source disappears', async () => {
  const catalog = liveCatalog([instance()]);
  const created = {
    ...instance('created'),
    title: 'Copy',
    scope: { type: 'public', source: 'shared' } as const,
  };
  const create = vi
    .fn()
    .mockResolvedValue(
      committedWrite({ ...created, title: 'Wrong response' }, 'r1'),
    );
  const load = readsWithCreated(catalog, () => created);
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { list: catalog.host.instance.list, create, load },
      preference: catalog.host.preference,
    } as unknown as ViewHost,
  });
  engines.push(engine);
  await engine.load();
  await expect(
    engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('原样保存');
  catalog.set([], null);
  await engine.load();
  await engine.reloadInstance('mine');
  expect(load.mock.calls.map(([id]) => id)).toEqual(['mine', 'created']);
  expect(create).toHaveBeenCalledOnce();
  expect(selected(engine, 'created').instance.scope).toEqual(created.scope);
  expect(engine.getSnapshot().pendingCreates).toEqual({});
});

it('retains recovery editor if source reappears before reconciliation', async () => {
  const catalog = liveCatalog([instance()]);
  const create = lostThenCommitted();
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { ...catalog.host.instance, create },
      preference: catalog.host.preference,
    } as unknown as ViewHost,
  });
  try {
    await engine.load();
    engine.setTitle('local title');
    await expect(
      engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    const draft = structuredClone(
      engine.getSnapshot().sessions.mine.filterDraft.root,
    );
    draft.id = 'local-filter-draft';
    engine
      .record(engine.getSnapshot().selectedInstanceId!)
      .setFilterDraft(createFilterConfiguration(draft));
    catalog.set([], null);
    await engine.load();
    expect(engine.getSnapshot().pendingCreates.mine.filterDraft.root.id).toBe(
      'local-filter-draft',
    );
    catalog.set([instance()], 'mine');
    await engine.load();
    await engine.reloadInstance('mine');
    expect(engine.getSnapshot().sessions.created.filterDraft.root.id).toBe(
      'local-filter-draft',
    );
  } finally {
    engine.dispose();
  }
});
it('adopts authoritative scope when created copy is already listed', async () => {
  const catalog = liveCatalog([instance()]);
  const old = { ...instance('created'), title: 'Copy' };
  const authoritative = {
    ...old,
    scope: { type: 'public', source: 'shared' } as const,
    revision: 'r2',
  };
  const create = vi
    .fn()
    .mockResolvedValue(committedWrite({ ...old, title: 'wrong' }, 'r1'));
  const load = readsWithCreated(catalog, () => authoritative);
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { list: catalog.host.instance.list, create, load },
      preference: catalog.host.preference,
    } as unknown as ViewHost,
  });
  try {
    await engine.load();
    await expect(
      engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    catalog.set([old], 'created');
    await engine.load();
    engine.setTitle('local copy title');
    await engine.reloadInstance('mine');
    expect(engine.getSnapshot().sessions.created.instance.scope).toEqual(
      authoritative.scope,
    );
    expect(engine.getSnapshot().sessions.created.instance.title).toBe(
      'local copy title',
    );
  } finally {
    engine.dispose();
  }
});

it('does not resurrect a copy deleted while reconciliation was in flight', async () => {
  const catalog = liveCatalog([instance()]);
  const old = { ...instance('created'), title: 'Copy' };
  const create = vi
    .fn()
    .mockResolvedValue(committedWrite({ ...old, title: 'wrong' }, 'r1'));
  const loaded = deferred<ViewInstance>();
  // The default copy opens at once; the reconciliation read of it stays in flight.
  const load = readsWithCreated(catalog, reads =>
    reads === 0 ? old : loaded.promise,
  );
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: catalog.host.instance.list,
        create,
        load,
        delete: vi.fn(async (id: string) => deleteReceipt(id)),
      },
      preference: catalog.host.preference,
      permission: {
        getInstance: () => ({ save: true, saveAsPersonal: true, delete: true }),
      },
    } as unknown as ViewHost,
  });
  try {
    await engine.load();
    await expect(
      engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    catalog.set([old], 'created');
    await engine.load();
    expect(engine.getSnapshot().selectedInstanceId).toBe('created');
    const reconciliation = engine.reloadInstance('mine');
    await engine.deleteInstance('created');
    expect(engine.getSnapshot().instanceIds).toEqual([]);
    loaded.resolve(old);
    await reconciliation;
    expect(engine.getSnapshot().instanceIds).toEqual([]);
    expect(engine.getSnapshot().sessions.created).toBeUndefined();
  } finally {
    engine.dispose();
  }
});
it('preserves independent copy unknown-save state during reconciliation', async () => {
  const catalog = liveCatalog([instance()]);
  const old = { ...instance('created'), title: 'Copy' };
  const create = vi
    .fn()
    .mockResolvedValue(committedWrite({ ...old, title: 'wrong' }, 'r1'));
  const loaded = deferred<ViewInstance>();
  const load = readsWithCreated(catalog, reads =>
    reads === 0 ? old : loaded.promise,
  );
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: catalog.host.instance.list,
        create,
        load,
        save: vi
          .fn()
          .mockRejectedValue(
            new ViewServiceError('UNKNOWN_OUTCOME', 'independent save lost'),
          ),
      },
      preference: catalog.host.preference,
    } as unknown as ViewHost,
  });
  try {
    await engine.load();
    await expect(
      engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    catalog.set([old], 'created');
    await engine.load();
    const reconciliation = engine.reloadInstance('mine');
    engine.setTitle('new title', 'created');
    await expect(engine.save('created')).rejects.toThrow(
      'independent save lost',
    );
    expect(engine.getSnapshot().sessions.created.requiresReload).toBe(true);
    loaded.resolve(old);
    await reconciliation;
    expect(engine.getSnapshot().sessions.created.requiresReload).toBe(true);
    expect(engine.getSnapshot().sessions.created.writeError).toBe(
      'independent save lost',
    );
  } finally {
    engine.dispose();
  }
});
it('does not resurrect a copy first opened and deleted during reconciliation', async () => {
  const catalog = liveCatalog([instance()]);
  const old = { ...instance('created'), title: 'Copy' };
  const create = vi
    .fn()
    .mockResolvedValue(committedWrite({ ...old, title: 'wrong' }, 'r1'));
  const loaded = deferred<ViewInstance>();
  // The reconciliation read stays in flight; the explicit open afterwards resolves at once.
  const load = readsWithCreated(catalog, reads =>
    reads === 0 ? loaded.promise : old,
  );
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: catalog.host.instance.list,
        create,
        load,
        delete: vi.fn(async (id: string) => deleteReceipt(id)),
      },
      preference: catalog.host.preference,
      permission: {
        getInstance: () => ({ save: true, saveAsPersonal: true, delete: true }),
      },
    } as unknown as ViewHost,
  });
  try {
    await engine.load();
    await expect(
      engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    const reconciliation = engine.reloadInstance('mine');
    await engine.selectInstance('created');
    await engine.deleteInstance('created');
    expect(engine.getSnapshot().instanceIds).toEqual(['mine']);
    loaded.resolve(old);
    await reconciliation;
    expect(engine.getSnapshot().instanceIds).toEqual(['mine']);
  } finally {
    engine.dispose();
  }
});
it('does not resurrect a copy opened and deleted before original create receipt', async () => {
  const catalog = liveCatalog([instance()]);
  const old = { ...instance('created'), title: 'Copy' };
  const created = deferred<WriteObservation<ViewInstance>>();
  const create = vi.fn(() => created.promise);
  const load = readsWithCreated(catalog, () => old);
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: catalog.host.instance.list,
        create,
        load,
        delete: vi.fn(async (id: string) => deleteReceipt(id)),
      },
      preference: catalog.host.preference,
      permission: {
        getInstance: () => ({ save: true, saveAsPersonal: true, delete: true }),
      },
    } as unknown as ViewHost,
  });
  try {
    await engine.load();
    const saving = engine.saveAs({
      title: 'Copy',
      scope: { type: 'personal' },
    });
    await engine.selectInstance('created');
    await engine.deleteInstance('created');
    expect(engine.getSnapshot().instanceIds).toEqual(['mine']);
    created.resolve(committedWrite(old, 'r1'));
    await saving;
    expect(engine.getSnapshot().instanceIds).toEqual(['mine']);
  } finally {
    engine.dispose();
  }
});
