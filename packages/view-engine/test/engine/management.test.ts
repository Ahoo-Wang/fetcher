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

import { createFilterConfiguration } from '../../src/filter/filterCore.js';
import { FilterOperator } from '@ahoo-wang/fetcher-wow';
import { expect, it, vi } from 'vitest';
import { newFilterNode } from '../../src/filter/filterCore.js';
import type { ViewInstance } from '../../src/contracts/viewModel.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import {
  committedWrite,
  type PreferenceState,
  type WriteObservation,
} from '../../src/contracts/viewServiceContract.js';
import {
  deferred,
  deleteReceipt,
  instance,
  managementPermissions as permissions,
  preferenceWrite,
  selected,
  setup,
} from './fixtures.js';

const writeContext = expect.objectContaining({ requestId: expect.any(String) });

it('renames persisted metadata without saving draft filters, columns or newer edits', async () => {
  const response = deferred<WriteObservation<ViewInstance>>();
  const renameInstance = vi.fn(() => response.promise);
  const { engine, paged } = setup({
    host: {
      instance: { rename: renameInstance },
      permission: { getInstance: permissions },
    } as unknown as ViewHost,
  });
  await engine.load();
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setColumns([
      { id: 'amount', kind: 'field', field: 'state.amount', width: 240 },
    ]);
  const draft = newFilterNode(FilterOperator.GTE, 'state.amount');
  engine.record(engine.getSnapshot().selectedInstanceId!).setFilterDraft(
    createFilterConfiguration({
      ...draft,
      props: { ...draft.props, value: 50 },
    }),
  );
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setFilterValidity(false);
  const before = selected(engine);
  const renaming = engine.renameInstance('  New name  ');
  expect(renameInstance).toHaveBeenCalledWith(
    'mine',
    'New name',
    'r1',
    writeContext,
  );
  expect(selected(engine).writeStatus).toBe('renaming');
  await expect(engine.deleteInstance()).rejects.toThrow();
  response.resolve(
    committedWrite({ ...instance(), title: 'New name', revision: 'r2' }, 'r2'),
  );
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
  expect(engine.getSnapshot().catalog.summaries.mine).toMatchObject({
    title: 'New name',
    revision: 'r2',
  });
  expect(paged).toHaveBeenCalledTimes(1);
  engine.dispose();
});

it('renames a listed but unopened instance through its catalog summary', async () => {
  const renameInstance = vi.fn(async (id: string, title: string) =>
    committedWrite({ ...instance(id), title, revision: 'r2' }, 'r2'),
  );
  const { engine } = setup({
    host: {
      instance: { rename: renameInstance },
      permission: { getInstance: permissions },
    } as unknown as ViewHost,
  });
  await engine.load();
  expect(engine.getSnapshot().sessions.shared).toBeUndefined();
  await engine.renameInstance('Renamed', 'shared');
  expect(renameInstance).toHaveBeenCalledWith(
    'shared',
    'Renamed',
    'r1',
    writeContext,
  );
  expect(engine.getSnapshot().sessions.shared).toBeUndefined();
  expect(engine.getSnapshot().catalog.summaries.shared).toMatchObject({
    title: 'Renamed',
    revision: 'r2',
  });
  engine.dispose();
});

it('protects system names even when the host grants every permission', async () => {
  const renameInstance = vi.fn();
  const { engine } = setup({
    instances: [{ ...instance(), scope: { type: 'public', source: 'system' } }],
    defaultInstanceId: 'mine',
    host: {
      instance: { rename: renameInstance },
      permission: { getInstance: permissions },
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
      instance: {
        rename: async () =>
          committedWrite(
            {
              ...instance(),
              title: 'New',
              config: {
                ...instance().config,
                filters: createFilterConfiguration({
                  ...newFilterNode(FilterOperator.GTE, 'state.amount'),
                  props: { value: 99 },
                }),
              },
            },
            'r1',
          ),
      },
      permission: { getInstance: permissions },
    } as unknown as ViewHost,
  });
  await engine.load();
  await expect(engine.renameInstance('New')).rejects.toThrow(/修改了其他/);
  expect(selected(engine)).toMatchObject({
    requiresReload: true,
    writeStatus: 'idle',
    instance: { title: 'mine' },
  });
  engine.dispose();
});

it('persists personal ordering without changing selection or querying', async () => {
  const response = deferred<WriteObservation<PreferenceState>>();
  const saveInstanceOrder = vi
    .fn()
    .mockReturnValueOnce(response.promise)
    .mockResolvedValue(preferenceWrite('mine', 'p2', ['shared', 'mine']));
  const { engine, paged } = setup({
    host: {
      preference: { saveOrder: saveInstanceOrder },
    } as unknown as ViewHost,
  });
  await engine.load();
  const ordering = engine.reorderInstances(['shared', 'mine']);
  expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
  await expect(engine.reorderInstances(['shared', 'mine'])).rejects.toThrow();
  response.reject(new Error('order failed'));
  await expect(ordering).rejects.toThrow('order failed');
  expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
  await engine.reorderInstances(['shared', 'mine']);
  expect(saveInstanceOrder).toHaveBeenLastCalledWith(
    'orders',
    {
      scopeInstanceIds: ['shared', 'mine'],
      orderedInstanceIds: ['shared', 'mine'],
    },
    { type: 'absent' },
    writeContext,
  );
  expect(engine.getSnapshot()).toMatchObject({
    instanceIds: ['shared', 'mine'],
    selectedInstanceId: 'mine',
    defaultInstanceId: 'mine',
    preference: { status: 'ready', revision: 'p2' },
  });
  expect(paged).toHaveBeenCalledTimes(1);
  // An unchanged relative order is a no-op; malformed scopes never reach the host.
  await engine.reorderInstances(['mine']);
  for (const [ids, scope] of [
    [[], undefined],
    [['mine', 'mine'], undefined],
    [['mine', 'unknown'], undefined],
    [['shared', 'mine'], ['mine']],
    [['mine'], ['mine', 'shared']],
  ] as const)
    await expect(engine.reorderInstances(ids, scope)).rejects.toThrow(
      /相同、不重复的已加载视图/,
    );
  expect(saveInstanceOrder).toHaveBeenCalledTimes(2);
  engine.dispose();
});

it('reorders a scoped subset with the next preference revision and keeps other slots', async () => {
  const saveOrder = vi
    .fn()
    .mockResolvedValueOnce(preferenceWrite('mine', 'p2', ['third', 'mine']))
    .mockResolvedValueOnce(
      preferenceWrite('mine', 'p3', ['third', 'mine', 'shared']),
    );
  const { engine } = setup({
    instances: [instance(), instance('shared'), instance('third')],
    host: { preference: { saveOrder } } as unknown as ViewHost,
  });
  await engine.load();
  await engine.reorderInstances(['third', 'mine'], ['mine', 'third']);
  expect(saveOrder).toHaveBeenLastCalledWith(
    'orders',
    {
      scopeInstanceIds: ['mine', 'third'],
      orderedInstanceIds: ['third', 'mine'],
    },
    { type: 'absent' },
    writeContext,
  );
  expect(engine.getSnapshot().instanceIds).toEqual(['third', 'shared', 'mine']);
  await engine.reorderInstances(['mine', 'shared']);
  expect(saveOrder).toHaveBeenLastCalledWith(
    'orders',
    {
      scopeInstanceIds: ['mine', 'shared'],
      orderedInstanceIds: ['mine', 'shared'],
    },
    { type: 'matches', revision: 'p2' },
    writeContext,
  );
  expect(engine.getSnapshot()).toMatchObject({
    instanceIds: ['third', 'mine', 'shared'],
    preference: { revision: 'p3' },
  });
  engine.dispose();
});

it('does not resurrect a deleted view or drop a new one when order persistence finishes late', async () => {
  const response = deferred<WriteObservation<PreferenceState>>();
  const { engine } = setup({
    host: {
      preference: { saveOrder: () => response.promise },
      instance: { delete: async (id: string) => deleteReceipt(id) },
      permission: { getInstance: permissions },
    } as unknown as ViewHost,
  });
  await engine.load();
  const ordering = engine.reorderInstances(['shared', 'mine']);
  await engine.saveAs({ title: 'Copy', scope: { type: 'personal' } });
  await engine.deleteInstance('mine');
  response.resolve(preferenceWrite('mine', 'p2', ['shared', 'mine']));
  await ordering;
  expect(engine.getSnapshot().instanceIds).toEqual(['shared', 'created']);
  expect(engine.getSnapshot().selectedInstanceId).toBe('created');
  engine.dispose();
});
