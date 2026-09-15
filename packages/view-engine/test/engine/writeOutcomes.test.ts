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
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import {
  ViewServiceError,
  committedWrite,
  issueOf,
  readWriteObservation,
  rejectedWrite,
  unknownWrite,
} from '../../src/contracts/viewServiceContract.js';
import {
  readInstancePage,
  validateViewInstanceSummary,
} from '../../src/contracts/validation/instanceValidation.js';
import { readPreferenceState } from '../../src/contracts/validation/preferenceValidation.js';
import { summaryOf } from '../../src/contracts/viewModel.js';
import { MemoryViewHost } from '../../src/record/MemoryViewHost.js';
import {
  definition,
  instance,
  managementPermissions,
  page,
  preference,
  selected,
  setup,
} from './fixtures.js';

it('parses every write outcome shape and rejects malformed ones', () => {
  expect(readWriteObservation(committedWrite({ id: 'a' }, 'r1'))).toEqual({
    outcome: 'committed',
    value: { id: 'a' },
    revision: 'r1',
    visibility: 'visible',
  });
  expect(
    readWriteObservation({
      outcome: 'committed',
      value: 1,
      revision: 'r1',
      visibility: 'pending',
      readFence: 'fence',
    }),
  ).toMatchObject({ visibility: 'pending', readFence: 'fence' });
  expect(
    readWriteObservation({
      outcome: 'committed_pending_receipt',
      targetId: 't',
      revision: 'r2',
      issue: { code: 'UNAVAILABLE', message: 'later' },
    }),
  ).toMatchObject({ outcome: 'committed_pending_receipt', targetId: 't' });
  expect(readWriteObservation(unknownWrite('lost'))).toMatchObject({
    outcome: 'unknown',
    issue: { code: 'UNKNOWN_OUTCOME', message: 'lost' },
  });
  expect(readWriteObservation(rejectedWrite('FORBIDDEN', 'no'))).toMatchObject({
    outcome: 'rejected',
    issue: { code: 'FORBIDDEN' },
  });
  for (const bad of [
    null,
    [],
    { outcome: 'weird' },
    { outcome: 'committed', revision: '', value: 1, visibility: 'visible' },
    { outcome: 'committed', revision: 'r', visibility: 'visible' },
    { outcome: 'committed', revision: 'r', value: 1, visibility: 'pending' },
    { outcome: 'committed', revision: 'r', value: 1 },
    { outcome: 'committed_pending_receipt', targetId: '', revision: 'r' },
    { outcome: 'unknown', issue: { code: 'NOPE', message: 'x' } },
    { outcome: 'rejected', issue: { code: 'FORBIDDEN' } },
  ])
    expect(() => readWriteObservation(bad)).toThrow();
  expect(issueOf(new ViewServiceError('CONFLICT', 'c'))).toEqual({
    code: 'CONFLICT',
    message: 'c',
  });
  expect(issueOf(new Error('boom'))).toEqual({
    code: 'UNKNOWN_OUTCOME',
    message: 'boom',
  });
  expect(issueOf('text', 'UNAVAILABLE')).toEqual({
    code: 'UNAVAILABLE',
    message: 'text',
  });
});

it('rejects malformed catalog pages, summaries and preference documents', () => {
  const summary = summaryOf(instance());
  expect(() => readInstancePage({ items: [summary] }, definition)).toThrow(
    /nextCursor/,
  );
  expect(() =>
    readInstancePage(
      { items: [summary, summary], nextCursor: null },
      definition,
    ),
  ).toThrow(/重复/);
  expect(() =>
    readInstancePage(
      { items: [summary], nextCursor: null, total: 0 },
      definition,
    ),
  ).toThrow(/total/);
  expect(() => readInstancePage({ items: {} }, definition)).toThrow(/items/);
  expect(
    readInstancePage(
      { items: [summary], nextCursor: 'c', total: 3 },
      definition,
    ),
  ).toEqual({ items: [summary], nextCursor: 'c', total: 3 });
  for (const bad of [
    { ...summary, definitionId: 'other' },
    { ...summary, kind: 'weird' },
    { ...summary, scope: { type: 'public', source: 'nope' } },
    { ...summary, revision: '' },
    { ...summary, title: '' },
  ])
    expect(() => validateViewInstanceSummary(bad, definition)).toThrow();
  for (const bad of [
    { revision: null, order: ['a', 'a'], defaultInstanceId: null },
    { revision: '', order: [], defaultInstanceId: null },
    { revision: null, order: [], defaultInstanceId: 5 },
    {
      revision: null,
      order: [],
      defaultInstanceId: null,
      effectiveDefaultInstanceId: '',
    },
  ])
    expect(() => readPreferenceState(bad)).toThrow();
});

it.each([
  ['committed_pending_receipt', /已提交，回执待核对/, true],
  ['unknown', /lost/, true],
  ['rejected', /denied/, false],
] as const)(
  'keeps the draft and marks reload according to a %s save outcome',
  async (outcome, pattern, reload) => {
    const save = vi.fn(async () =>
      outcome === 'committed_pending_receipt'
        ? {
            outcome,
            targetId: 'mine',
            revision: 'r9',
            issue: { code: 'UNAVAILABLE' as const, message: 'receipt later' },
          }
        : outcome === 'unknown'
          ? unknownWrite('lost')
          : rejectedWrite('FORBIDDEN', 'denied'),
    );
    const { engine } = setup({ host: { instance: { save } } as ViewHost });
    await engine.load();
    engine.setTitle('Draft title');
    await expect(engine.save()).rejects.toThrow(pattern);
    expect(selected(engine)).toMatchObject({
      requiresReload: reload,
      writeStatus: 'idle',
      instance: { title: 'Draft title' },
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Draft title' }),
      expect.objectContaining({ requestId: expect.any(String) }),
    );
    engine.dispose();
  },
);

it('records pending visibility from a committed save and treats a revision mismatch as unverified', async () => {
  const save = vi
    .fn()
    .mockImplementationOnce(async (value: { revision: string }) => ({
      outcome: 'committed',
      value: { ...value, revision: 'r2' },
      revision: 'r2',
      visibility: 'pending',
      readFence: 'fence-1',
    }))
    .mockImplementationOnce(async (value: { revision: string }) =>
      committedWrite({ ...value, revision: 'r3' }, 'r-other'),
    );
  const { engine } = setup({ host: { instance: { save } } as ViewHost });
  await engine.load();
  engine.setTitle('First');
  await engine.save();
  expect(selected(engine)).toMatchObject({
    visibility: 'pending',
    baseline: { title: 'First', revision: 'r2' },
    dirty: false,
  });
  engine.setTitle('Second');
  await expect(engine.save()).rejects.toThrow(/版本/);
  expect(selected(engine)).toMatchObject({
    requiresReload: true,
    instance: { title: 'Second' },
  });
  engine.dispose();
});

it('keeps a create replayable when the host only proves commitment pending its receipt', async () => {
  const create = vi.fn(async () => ({
    outcome: 'committed_pending_receipt' as const,
    targetId: 'created-later',
    revision: 'r1',
    issue: { code: 'UNAVAILABLE' as const, message: 'receipt later' },
  }));
  const { engine } = setup({ host: { instance: { create } } as ViewHost });
  await engine.load();
  await expect(
    engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).rejects.toThrow(/回执待核对/);
  expect(selected(engine).requiresReload).toBe(true);
  expect(engine.canReloadInstance('mine')).toBe(true);
  expect(engine.getCapabilitiesSnapshot().instances.mine.reload).toBe(true);
  engine.dispose();
});

it('renames and deletes catalog entries that were never opened', async () => {
  const all = [instance(), instance('shared'), instance('third')];
  const rename = vi.fn(async (id: string, title: string, revision: string) =>
    committedWrite({ ...instance(id), title, revision: `${revision}+` }, 'r1+'),
  );
  const remove = vi.fn(async (id: string) =>
    committedWrite({ id, revision: 'tomb' }, 'tomb'),
  );
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: async () => page(all),
        load: async (id: string) =>
          structuredClone(all.find(i => i.id === id)!),
        rename,
        delete: remove,
      },
      preference: { load: async () => preference('mine') },
      permission: { getInstance: managementPermissions },
    } as unknown as ViewHost,
  });
  await engine.load();
  expect(Object.keys(engine.getSnapshot().sessions)).toEqual(['mine']);
  expect(engine.getPermissions('shared')).toMatchObject({
    rename: true,
    delete: true,
  });
  await engine.renameInstance('Shared renamed', 'shared');
  expect(rename).toHaveBeenCalledWith(
    'shared',
    'Shared renamed',
    'r1',
    expect.objectContaining({ requestId: expect.any(String) }),
  );
  expect(engine.getSnapshot().catalog.summaries.shared).toMatchObject({
    title: 'Shared renamed',
    revision: 'r1+',
  });
  expect(engine.getSnapshot().sessions.shared).toBeUndefined();
  await engine.renameInstance('Shared renamed', 'shared');
  expect(rename).toHaveBeenCalledTimes(1);
  rename.mockResolvedValueOnce(rejectedWrite('FORBIDDEN', 'locked'));
  await expect(engine.renameInstance('Again', 'third')).rejects.toThrow(
    'locked',
  );
  expect(engine.getSnapshot().catalog.summaries.third.title).toBe('third');
  await engine.deleteInstance('third');
  expect(remove).toHaveBeenCalledWith(
    'third',
    'r1',
    expect.objectContaining({ requestId: expect.any(String) }),
  );
  expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
  expect(engine.getSnapshot().catalog.summaries.third).toBeUndefined();
  expect(engine.getSnapshot().selectedInstanceId).toBe('mine');
  remove.mockResolvedValueOnce(unknownWrite('offline'));
  await expect(engine.deleteInstance('shared')).rejects.toThrow('offline');
  expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
  await expect(engine.renameInstance('x', 'missing')).rejects.toThrow(
    /有效的视图实例/,
  );
  engine.dispose();
});

it('surfaces rejected, mismatched and gated preference writes without changing state', async () => {
  const saveDefault = vi
    .fn()
    .mockResolvedValueOnce(rejectedWrite('REVISION_CONFLICT', 'stale'))
    .mockResolvedValueOnce(
      committedWrite(preference('shared', 'p2'), 'p-other'),
    )
    .mockResolvedValueOnce(committedWrite(preference('shared', 'p2'), 'p2'));
  const saveOrder = vi
    .fn()
    .mockResolvedValueOnce(rejectedWrite('FORBIDDEN', 'no order'))
    .mockResolvedValueOnce(
      committedWrite(preference('shared', 'p3', ['shared', 'mine']), 'p3'),
    );
  const { engine } = setup({
    host: {
      preference: { saveDefault, saveOrder },
      permission: {
        getInstance: managementPermissions,
        getDefinition: () => ({ reorder: true, setDefault: true }),
      },
    } as unknown as ViewHost,
  });
  await engine.load();
  await expect(engine.setDefaultInstance('shared')).rejects.toThrow(/stale/);
  await expect(engine.setDefaultInstance('shared')).rejects.toThrow(/版本/);
  expect(engine.getSnapshot().defaultInstanceId).toBe('mine');
  await engine.setDefaultInstance('shared');
  expect(engine.getSnapshot()).toMatchObject({
    defaultInstanceId: 'shared',
    preference: { revision: 'p2' },
  });
  // Local mode starts without a preference document: every attempt used `absent`.
  expect(saveDefault).toHaveBeenLastCalledWith(
    'orders',
    'shared',
    { type: 'absent' },
    expect.objectContaining({ requestId: expect.any(String) }),
  );
  await expect(engine.reorderInstances(['shared', 'mine'])).rejects.toThrow(
    /no order/,
  );
  expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
  await engine.reorderInstances(['shared', 'mine']);
  expect(engine.getSnapshot().instanceIds).toEqual(['shared', 'mine']);
  expect(saveOrder).toHaveBeenLastCalledWith(
    'orders',
    {
      scopeInstanceIds: ['shared', 'mine'],
      orderedInstanceIds: ['shared', 'mine'],
    },
    { type: 'matches', revision: 'p2' },
    expect.objectContaining({ requestId: expect.any(String) }),
  );
  await expect(
    engine.reorderInstances(['shared'], ['mine', 'shared']),
  ).rejects.toThrow(/相同、不重复/);
  engine.dispose();
});

it('gates preference writes on definition grants and on a loaded preference document', async () => {
  const denied = setup({
    host: {
      preference: { saveDefault: vi.fn(), saveOrder: vi.fn() },
      permission: {
        getInstance: managementPermissions,
        getDefinition: () => ({ reorder: false }),
      },
    } as unknown as ViewHost,
  });
  await denied.engine.load();
  expect(denied.engine.canSetDefaultInstance()).toBe(false);
  expect(denied.engine.canReorderInstances()).toBe(false);
  denied.engine.dispose();
  const throwing = setup({
    host: {
      preference: { saveDefault: vi.fn() },
      permission: {
        getInstance: managementPermissions,
        getDefinition: () => {
          throw new Error('policy outage');
        },
      },
    } as unknown as ViewHost,
  });
  await throwing.engine.load();
  expect(throwing.engine.canSetDefaultInstance()).toBe(false);
  throwing.engine.dispose();
  const unloaded = setup({
    instances: undefined,
    host: {
      instance: {
        list: async () => page([instance()]),
        load: async () => instance(),
      },
      preference: {
        load: vi.fn().mockRejectedValue(new Error('偏好不可用')),
        saveDefault: vi.fn(),
      },
    } as unknown as ViewHost,
  });
  await unloaded.engine.load();
  await unloaded.engine.selectInstance('mine');
  await expect(unloaded.engine.setDefaultInstance('mine')).rejects.toThrow(
    /尚未加载/,
  );
  unloaded.engine.dispose();
});

it('rejects invalid catalog cursors, limits, queries and preference preconditions in the local host', async () => {
  const host = new MemoryViewHost({
    serviceKey: 'svc',
    scopeKey: 'me',
    definition: { ...definition, revision: 'd1' },
    instances: [instance(), instance('shared')],
    defaultInstanceId: 'mine',
    resolveSource: () => ({ paged: vi.fn(), cursor: vi.fn() }),
    canSetDefault: () => false,
  });
  await expect(
    host.instance.list('orders', { cursor: 'nope' }),
  ).rejects.toMatchObject({
    code: 'CURSOR_EXPIRED',
  });
  await expect(
    host.instance.list('orders', { limit: 0 }),
  ).rejects.toMatchObject({
    code: 'INVALID_ARGUMENT',
  });
  await expect(
    host.instance.list('orders', { query: 5 as unknown as string }),
  ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  await expect(
    host.preference.saveDefault(
      'orders',
      'mine',
      { type: 'absent' },
      {
        requestId: 'd-1',
      },
    ),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'FORBIDDEN' },
  });
  await expect(
    host.preference.saveOrder(
      'orders',
      { scopeInstanceIds: 'x' } as never,
      { type: 'absent' },
      { requestId: 'o-1' },
    ),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'INVALID_ARGUMENT' },
  });
  await expect(
    host.preference.saveOrder(
      'orders',
      { scopeInstanceIds: ['mine'], orderedInstanceIds: ['mine'] },
      { type: 'matches', revision: '' } as never,
      { requestId: 'o-2' },
    ),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'PRECONDITION_REQUIRED' },
  });
  await expect(
    host.preference.saveOrder(
      'orders',
      { scopeInstanceIds: ['mine'], orderedInstanceIds: ['mine'] },
      { type: 'matches', revision: 'ghost' },
      { requestId: 'o-3' },
    ),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'REVISION_CONFLICT' },
  });
  const loaded = await host.instance.load('mine');
  await expect(
    host.instance.save({ ...loaded, kind: 'analysis' } as never, {
      requestId: 's-1',
    }),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'INVALID_ARGUMENT' },
  });
  await expect(
    host.instance.save(loaded, { requestId: 's-2', definitionRevision: 'd0' }),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'DEFINITION_CHANGED' },
  });
  await expect(
    host.operation.reconcile({
      resource: 'nope',
      requestId: 'x',
      definitionId: 'orders',
    } as never),
  ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
});

it('refuses to page the catalog while a page is loading or after the catalog failed', async () => {
  const all = [instance(), instance('shared')];
  let release!: () => void;
  const gate = new Promise<void>(resolve => (release = resolve));
  const list = vi
    .fn()
    .mockResolvedValueOnce(page([all[0]], 'next'))
    .mockImplementationOnce(async () => {
      await gate;
      throw new Error('page failed');
    });
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list,
        load: async (id: string) => all.find(i => i.id === id)!,
      },
      preference: { load: async () => preference('mine') },
    } as unknown as ViewHost,
  });
  await engine.load();
  const more = engine.loadMoreInstances();
  // A second request while a page is loading is a no-op, not a second read.
  await expect(engine.loadMoreInstances()).resolves.toBeUndefined();
  expect(list).toHaveBeenCalledTimes(2);
  release();
  await expect(more).rejects.toThrow('page failed');
  expect(engine.getSnapshot().catalog).toMatchObject({
    status: 'error',
    error: 'page failed',
  });
  expect(engine.getSnapshot().instanceIds).toEqual(['mine']);
  // The failed page keeps its cursor, so the next request retries the same page.
  list.mockResolvedValueOnce(page([all[1]]));
  await engine.loadMoreInstances();
  expect(list).toHaveBeenCalledTimes(3);
  expect(engine.getSnapshot()).toMatchObject({
    instanceIds: ['mine', 'shared'],
    catalog: { status: 'ready', error: null, nextCursor: null },
  });
  engine.dispose();
});

it('rejects a rename receipt that changes the scope of an unopened catalog entry', async () => {
  const all = [instance(), instance('shared')];
  const rename = vi.fn(async (id: string, title: string) =>
    committedWrite(
      {
        ...instance(id),
        title,
        scope: { type: 'public', source: 'shared' },
        revision: 'r2',
      },
      'r2',
    ),
  );
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: async () => page(all),
        load: async (id: string) =>
          structuredClone(all.find(i => i.id === id)!),
        rename,
      },
      preference: { load: async () => preference('mine') },
      permission: { getInstance: managementPermissions },
    } as unknown as ViewHost,
  });
  await engine.load();
  await expect(engine.renameInstance('Moved', 'shared')).rejects.toThrow(
    /重新加载核对/,
  );
  expect(engine.getSnapshot().catalog.summaries.shared).toMatchObject({
    title: 'shared',
    scope: { type: 'personal' },
  });
  engine.dispose();
});

it('hands a pending write fence back to the host on the next reload', async () => {
  const all = [instance()];
  const load = vi.fn(async () => ({
    ...instance(),
    title: 'Fenced',
    revision: 'r2',
  }));
  const save = vi.fn(async (value: { revision: string }) => ({
    outcome: 'committed',
    value: { ...value, revision: 'r2' },
    revision: 'r2',
    visibility: 'pending',
    readFence: 'fence-7',
  }));
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { list: async () => page(all), load, save },
      preference: { load: async () => preference('mine') },
    } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('Fenced');
  await engine.save();
  expect(selected(engine).visibility).toBe('pending');
  await engine.reloadInstance();
  expect(load).toHaveBeenLastCalledWith(
    'mine',
    expect.objectContaining({ readFence: 'fence-7' }),
  );
  await engine.reloadInstance();
  expect(load.mock.calls[2][1]).not.toHaveProperty('readFence');
  engine.dispose();
});

it('replays an uncertain default write under its original request identity and precondition', async () => {
  const saveDefault = vi
    .fn()
    .mockResolvedValueOnce(unknownWrite('lost'))
    .mockResolvedValueOnce(committedWrite(preference('shared', 'p2'), 'p2'))
    .mockResolvedValueOnce(committedWrite(preference('mine', 'p3'), 'p3'));
  const { engine } = setup({
    host: {
      preference: { saveDefault },
      permission: { getInstance: managementPermissions },
    } as unknown as ViewHost,
  });
  await engine.load();
  await expect(engine.setDefaultInstance('shared')).rejects.toThrow(/lost/);
  await engine.setDefaultInstance('shared');
  const [first, second] = saveDefault.mock.calls as [
    unknown,
    unknown,
    unknown,
    { requestId: string },
  ][][];
  expect(second[2]).toEqual(first[2]);
  expect(second[3].requestId).toBe(first[3].requestId);
  expect(engine.getSnapshot().defaultInstanceId).toBe('shared');
  await engine.setDefaultInstance('mine');
  expect(saveDefault.mock.calls[2][3].requestId).not.toBe(first[3].requestId);
  engine.dispose();
});

it('rejects a default receipt that names a different target', async () => {
  const saveDefault = vi
    .fn()
    .mockResolvedValueOnce(committedWrite(preference('mine', 'p2'), 'p2'));
  const { engine } = setup({
    host: {
      preference: { saveDefault },
      permission: { getInstance: managementPermissions },
    } as unknown as ViewHost,
  });
  await engine.load();
  await expect(engine.setDefaultInstance('shared')).rejects.toThrow(
    /目标不一致/,
  );
  expect(engine.getSnapshot().defaultInstanceId).toBe('mine');
  engine.dispose();
});

it('rejects catalog summaries of a kind the definition does not declare', () => {
  expect(() =>
    validateViewInstanceSummary(
      { ...summaryOf(instance()), kind: 'analysis' },
      definition,
    ),
  ).toThrow(/未声明/);
});
