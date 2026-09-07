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
import { expect, it, vi } from 'vitest';
import { newFilterDraft } from '../../src/filter/filterCore.js';
import type { ViewHost, ViewInstance } from '../../src/record/recordModel.js';
import { deferred, instance, selected, setup } from './fixtures.js';

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
