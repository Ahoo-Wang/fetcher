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

import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LocalStorageViewHost } from '../src/record/LocalStorageViewHost.js';
import { ViewEngine } from '../src/record/ViewEngine.js';
import { definition, instance, setup } from './fixtures/viewPage.js';

import { storageLock } from './fixtures/storageLock.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
function options(scopeKey = 'developer') {
  return {
    scopeKey,
    storage: localStorage,
    serviceKey: 'test-service',
    lock: storageLock,
    definition,
    instances: {
      instances: [
        instance,
        {
          ...instance,
          id: 'system',
          title: '系统视图',
          scope: { type: 'public', source: 'system' } as const,
        },
      ],
      defaultInstanceId: instance.id,
    },
    resolveSource: setup().host.resolveSource,
  };
}

it('persists component configuration, names, creation, deletion and ordering across new hosts', async () => {
  const host = new LocalStorageViewHost(options());
  const edited = await host.loadInstance(instance.id);
  edited.config.filters.root.props = {
    ...edited.config.filters.root.props,
    value: 77,
  };
  const saved = await host.saveInstance(edited);
  expect(saved.revision).not.toBe(edited.revision);
  const copy = await host.createInstance(
    { ...saved, title: '副本' },
    { requestId: 'copy' },
  );
  const renamed = await host.renameInstance(copy.id, '本地副本', copy.revision);
  await host.saveInstanceOrder(definition.id, [copy.id, 'system', instance.id]);
  const restored = new LocalStorageViewHost(options());
  expect(
    (await restored.listInstances(definition.id)).instances.map(
      item => item.id,
    ),
  ).toEqual([copy.id, 'system', instance.id]);
  expect(await restored.loadInstance(instance.id)).toEqual(saved);
  expect((await restored.loadInstance(copy.id)).title).toBe('本地副本');
  expect(
    JSON.parse(localStorage.getItem(host.storageKey)!).instances[2].config,
  ).not.toHaveProperty('filter');
  await restored.deleteInstance(copy.id, renamed.revision);
  expect((await host.listInstances(definition.id)).instances).toHaveLength(2);
});

it('isolates scope and definition, preserves seeds, and resets only its own key', async () => {
  const input = options();
  const host = new LocalStorageViewHost(input);
  input.instances.instances[0] = { ...instance, title: '外部修改' };
  const loaded = await host.loadInstance(instance.id);
  expect(loaded.title).toBe(instance.title);
  loaded.title = '保存的标题';
  await host.saveInstance(loaded);
  const other = new LocalStorageViewHost(options('another-user'));
  expect((await other.loadInstance(instance.id)).title).toBe(instance.title);
  const differentDefinition = new LocalStorageViewHost({
    ...options(),
    definition: { ...definition, id: 'other' },
    instances: { instances: [], defaultInstanceId: null },
  });
  expect(differentDefinition.storageKey).not.toBe(host.storageKey);
  localStorage.setItem('unrelated', 'keep');
  await host.reset();
  expect((await host.loadInstance(instance.id)).title).toBe(instance.title);
  expect(localStorage.getItem('unrelated')).toBe('keep');
});

it('rejects stale writes and protects system views even when callers bypass UI permissions', async () => {
  const host = new LocalStorageViewHost(options());
  const stale = await host.loadInstance(instance.id);
  await host.saveInstance({ ...stale, title: '最新版本' });
  await expect(host.saveInstance(stale)).rejects.toThrow(/重新加载/);
  await expect(
    host.renameInstance(stale.id, '旧版本', stale.revision),
  ).rejects.toThrow(/重新加载/);
  await expect(host.deleteInstance(stale.id, stale.revision)).rejects.toThrow(
    /重新加载/,
  );
  const system = await host.loadInstance('system');
  expect(host.getInstancePermissions(system)).toMatchObject({
    save: false,
    rename: false,
    delete: false,
  });
  await expect(host.saveInstance(system)).rejects.toThrow(/系统/);
  await expect(
    host.renameInstance('system', '改名', system.revision),
  ).rejects.toThrow(/系统/);
  await expect(host.deleteInstance('system', system.revision)).rejects.toThrow(
    /系统/,
  );
  await expect(
    host.createInstance(system, { requestId: 'system' }),
  ).rejects.toThrow(/系统/);
  await expect(
    host.saveInstanceOrder(definition.id, [stale.id, stale.id]),
  ).rejects.toThrow();
});

it('reports corrupted data and storage failures without overwriting existing records', async () => {
  const host = new LocalStorageViewHost(options());
  localStorage.setItem(host.storageKey, '{broken');
  await expect(host.listInstances(definition.id)).rejects.toThrow();
  expect(localStorage.getItem(host.storageKey)).toBe('{broken');
  await host.reset();
  const saved = await host.saveInstance(await host.loadInstance(instance.id));
  const before = localStorage.getItem(host.storageKey);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError');
  });
  await expect(
    host.saveInstance({ ...saved, title: '不会保存' }),
  ).rejects.toThrow('full');
  expect(localStorage.getItem(host.storageKey)).toBe(before);
});

it('keeps the default selection valid after deletion and honors aborted reads', async () => {
  const host = new LocalStorageViewHost(options());
  await host.deleteInstance(
    instance.id,
    (await host.loadInstance(instance.id)).revision,
  );
  expect((await host.listInstances(definition.id)).defaultInstanceId).toBe(
    'system',
  );
  const controller = new AbortController();
  controller.abort();
  await expect(
    host.loadDefinition(definition.id, controller.signal),
  ).rejects.toThrow();
  await expect(host.listInstances('unknown')).rejects.toThrow();
  await expect(host.loadInstance('unknown')).rejects.toThrow();
});

it('restores a saved view through a fresh engine while delegating record queries', async () => {
  const { host: source, paged } = setup();
  const input = { ...options(), resolveSource: source.resolveSource };
  const first = new ViewEngine({
    definitionId: definition.id,
    host: new LocalStorageViewHost(input),
  });
  await first.load();
  first.setTitle('持久化视图');
  await first.save();
  first.dispose();
  const second = new ViewEngine({
    definitionId: definition.id,
    host: new LocalStorageViewHost(input),
  });
  await second.load();
  expect(second.getSnapshot().sessions.mine.instance.title).toBe('持久化视图');
  expect(second.getSnapshot().sessions.mine.rows[0].amount).toBe(42);
  expect(paged).toHaveBeenCalledTimes(2);
  second.dispose();
});
