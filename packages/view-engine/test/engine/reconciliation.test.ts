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
import { committedWrite } from '../../src/contracts/viewServiceContract.js';
import {
  catalogHost,
  definition,
  deferred,
  instance,
  page,
  selected,
  setup,
} from './fixtures.js';

it('reconciles a changed create echo by reading the created ID and preserving both drafts', async () => {
  const persisted = {
    ...instance('created-1'),
    title: 'Normalized',
    scope: { type: 'public', source: 'shared' } as const,
    revision: 'r2',
  };
  const catalog = catalogHost([instance(), instance('shared')]);
  const loadInstance = vi.fn(async (id: string) =>
    id === 'created-1' ? persisted : catalog.instance.load(id),
  );
  const { engine, host } = setup({
    instances: undefined,
    host: {
      instance: {
        list: catalog.instance.list,
        create: async () => committedWrite(persisted, 'r2'),
        load: loadInstance,
      },
    } as unknown as ViewHost,
  });
  await engine.load();
  const source = selected(engine);
  await expect(
    engine.saveAs({ title: 'My copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('原样保存');
  expect(loadInstance).toHaveBeenCalledTimes(1);
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setColumns([
      { id: 'amount', kind: 'field', field: 'state.amount', width: 200 },
    ]);
  const draft = newFilterNode(FilterOperator.GTE, 'state.amount');
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setFilterDraft(createFilterConfiguration(draft));
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setFilterValidity(false);
  await engine.reloadInstance();
  expect(loadInstance).toHaveBeenLastCalledWith(
    'created-1',
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(engine.getSnapshot().selectedInstanceId).toBe('created-1');
  expect(selected(engine)).toMatchObject({
    baseline: persisted,
    dirty: true,
    instance: { title: 'My copy', scope: persisted.scope, revision: 'r2' },
    filterDraft: { root: draft },
    filterPending: true,
  });
  expect(
    selected(engine).instance.config.presentation.table.columns[0].width,
  ).toBe(200);
  expect(selected(engine, 'mine').baseline).toEqual(source.baseline);
  expect(selected(engine, 'mine').instance.title).toBe(source.instance.title);
  expect(selected(engine, 'mine').filterDraft.root).toEqual(draft);
  expect(host.instance!.save).not.toHaveBeenCalled();
  engine.dispose();
});

it('never treats matching catalog content as confirmation of a malformed creation', async () => {
  const catalog = catalogHost([
    instance(),
    { ...instance('other-request'), title: 'My copy' },
  ]);
  const create = vi.fn().mockResolvedValue(committedWrite(null, 'r1'));
  const { engine } = setup({
    instances: undefined,
    host: { instance: { create, ...catalog.instance } } as unknown as ViewHost,
  });
  await engine.load();
  expect(catalog.instance.list).toHaveBeenCalledTimes(1);
  await expect(
    engine.saveAs({ title: 'My copy', scope: { type: 'personal' } }),
  ).rejects.toThrow();
  await expect(engine.reloadInstance()).rejects.toThrow('视图实例必须是对象');
  expect(engine.getSnapshot().selectedInstanceId).toBe('mine');
  expect(selected(engine).requiresReload).toBe(true);
  expect(catalog.instance.list).toHaveBeenCalledTimes(1);
  expect(catalog.instance.load).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledTimes(2);
  expect(create.mock.calls[0][1].requestId).toBe(
    create.mock.calls[1][1].requestId,
  );
  await expect(
    engine.saveAs({ title: 'Changed copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('原配置重试');
  engine.dispose();
});

it('does not roll back an opened copy when its save finishes before an older reconciliation read', async () => {
  const persisted = { ...instance('created'), title: 'Normalized' };
  const oldRead = deferred<ViewInstance>();
  const createdReads = vi
    .fn<() => Promise<ViewInstance>>()
    .mockResolvedValueOnce(persisted)
    .mockReturnValueOnce(oldRead.promise);
  const catalog = catalogHost([instance(), instance('shared')]);
  const loadInstance = vi.fn((id: string) =>
    id === 'created' ? createdReads() : catalog.instance.load(id),
  );
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: catalog.instance.list,
        create: async () => committedWrite(persisted, 'r1'),
        load: loadInstance,
      },
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

it('never confirms a returned created ID from catalog content when it cannot be point-read', async () => {
  const persisted = { ...instance('created-known'), title: 'Normalized' };
  const list = vi.fn(async () => page([instance(), persisted]));
  const create = vi.fn(async () => committedWrite(persisted, 'r1'));
  const { engine } = setup({
    host: { instance: { create, list } } as unknown as ViewHost,
  });
  await engine.load();
  await expect(
    engine.saveAs({ title: 'My copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('原样保存');
  expect(engine.canReloadInstance()).toBe(true);
  await expect(engine.reloadInstance()).rejects.toThrow(
    '无法加载实例：created-known',
  );
  expect(engine.getSnapshot().selectedInstanceId).toBe('mine');
  expect(selected(engine).requiresReload).toBe(true);
  expect(engine.getSnapshot().sessions['created-known']).toBeUndefined();
  expect(list).not.toHaveBeenCalled();
  expect(create).toHaveBeenCalledOnce();
  engine.dispose();
});

it('does not settle a receipt-pending save with a stale point read', async () => {
  let remoteRevision = 'r1';
  const save = vi.fn(() => ({
    outcome: 'committed_pending_receipt' as const,
    targetId: 'mine',
    revision: 'r9',
    issue: { code: 'UNAVAILABLE' as const, message: 'receipt later' },
  }));
  const load = vi.fn(async () => ({
    ...instance(),
    title: remoteRevision === 'r9' ? 'Draft title' : 'mine',
    revision: remoteRevision,
  }));
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: async () => page([instance(), instance('shared')]),
        load,
        save,
      },
    } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('Draft title');
  await expect(engine.save()).rejects.toThrow(/回执待核对/);
  remoteRevision = 'r1';
  await expect(engine.reloadInstance()).rejects.toThrow(/早于已确认|核对/);
  expect(selected(engine).requiresReload).toBe(true);
  remoteRevision = 'r9';
  await engine.reloadInstance();
  expect(selected(engine)).toMatchObject({
    requiresReload: false,
    baseline: { title: 'Draft title', revision: 'r9' },
  });
  engine.dispose();
});

it('replays an unverified creation with the definition revision it was dispatched under', async () => {
  let hostRevision = 'd1';
  const create = vi.fn(async () => {
    throw new Error('timeout');
  });
  const definitionAt = (revision: string) => ({
    ...definition,
    revision,
  });
  const { engine } = setup({
    definition: undefined,
    instances: undefined,
    host: {
      definition: {
        load: async () => definitionAt(hostRevision),
      },
      instance: {
        list: async () => page([instance()]),
        create,
        load: async (id: string) => structuredClone(instance(id)),
      },
    } as unknown as ViewHost,
  });
  await engine.load();
  await expect(
    engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
  ).rejects.toThrow('timeout');
  hostRevision = 'd2';
  await engine.load();
  await expect(engine.reloadInstance()).rejects.toThrow('timeout');
  expect(create).toHaveBeenCalledTimes(2);
  expect(create.mock.calls[0][1].definitionRevision).toBe('d1');
  expect(create.mock.calls[1][1].definitionRevision).toBe('d1');
  engine.dispose();
});
