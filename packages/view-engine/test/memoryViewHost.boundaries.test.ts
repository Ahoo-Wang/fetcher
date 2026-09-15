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

import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryViewHost } from '../src/record/MemoryViewHost.js';
import type { ViewInstance } from '../src/contracts/viewModel.js';
import {
  ABSENT_PRECONDITION,
  type ViewServiceErrorCode,
  type WriteContext,
  type WriteObservation,
} from '../src/contracts/viewServiceContract.js';
import { definition, instance } from './engine/fixtures.js';

const store = new Map<string, string | null>();
beforeEach(() => store.clear());
const ctx = () => ({ requestId: crypto.randomUUID() });
function committed<T>(observation: WriteObservation<T>): T {
  if (observation.outcome !== 'committed')
    throw new Error(`写入未提交：${JSON.stringify(observation)}`);
  return observation.value;
}
const rejected = (code: ViewServiceErrorCode) => ({
  outcome: 'rejected',
  issue: { code },
});
function options() {
  return {
    serviceKey: 'boundary-service',
    scopeKey: 'alice',
    definition,
    instances: [instance()],
    defaultInstanceId: 'mine' as string | null,
    store,
    resolveSource: vi.fn(() => ({
      paged: async () => ({ list: [], total: 0 }),
    })),
  };
}
const ids = async (host: MemoryViewHost) =>
  (await host.instance.list(definition.id)).items.map(item => item.id);

it('rejects an unusable service identity or seed default before writing storage', () => {
  const seed = options();
  for (const patch of [
    { scopeKey: '' },
    { serviceKey: ' ' },
    { defaultInstanceId: 'missing' },
  ]) {
    expect(() => new MemoryViewHost({ ...seed, ...patch })).toThrow(
      expect.objectContaining({ code: 'INVALID_ARGUMENT' }),
    );
    expect(store.size).toBe(0);
  }
  expect(() => new MemoryViewHost(seed)).not.toThrow();
  expect(
    () => new MemoryViewHost({ ...seed, defaultInstanceId: null }),
  ).not.toThrow();
});

it('routes only the configured record source without invoking an unrelated resolver', () => {
  const seed = options();
  const host = new MemoryViewHost(seed);
  expect(() => host.resolveSource('another-source')).toThrow(
    expect.objectContaining({ code: 'NOT_FOUND' }),
  );
  expect(seed.resolveSource).not.toHaveBeenCalled();
  expect(host.resolveSource(definition.sourceId)).toHaveProperty('paged');
  expect(seed.resolveSource).toHaveBeenCalledWith(definition.sourceId);
});

it('rejects a missing create request identity without inserting a view or receipt', async () => {
  const host = new MemoryViewHost(options());
  const before = await ids(host);
  const raw = store.get(host.storageKey);
  for (const context of [
    { requestId: '' },
    { requestId: ' ' },
    undefined as unknown as WriteContext,
  ]) {
    await expect(
      host.instance.create(instance(), context),
    ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    expect(store.get(host.storageKey)).toBe(raw);
  }
  const created = committed(
    await host.instance.create(instance(), { requestId: 'valid' }),
  );
  expect(await ids(host)).toEqual([...before, created.id]);
  expect(JSON.parse(store.get(host.storageKey)!).receipts).toHaveProperty(
    JSON.stringify(['alice', 'instance', 'valid']),
  );
});

it('enforces creation permissions at dispatch and permits the same request after access is granted', async () => {
  let allowed = false;
  const host = new MemoryViewHost({
    ...options(),
    instancePermissions: () => ({
      save: allowed,
      saveAsPersonal: allowed,
      saveAsShared: allowed,
    }),
  });
  await host.instance.list(definition.id);
  const before = store.get(host.storageKey);
  for (const scope of [
    { type: 'personal' },
    { type: 'public', source: 'shared' },
  ] as const) {
    await expect(
      host.instance.create({ ...instance(), scope }, { requestId: scope.type }),
    ).resolves.toMatchObject(rejected('FORBIDDEN'));
    expect(store.get(host.storageKey)).toBe(before);
  }
  allowed = true;
  const created = committed(
    await host.instance.create(instance(), { requestId: 'personal' }),
  );
  expect(await host.instance.load(created.id)).toEqual(created);
});

it('rejects visibility changes and invalid renames without consuming the current revision', async () => {
  const host = new MemoryViewHost(options());
  const saved = await host.instance.load('mine');
  const raw = store.get(host.storageKey);
  await expect(
    host.instance.save(
      { ...saved, scope: { type: 'public', source: 'shared' } },
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('INVALID_ARGUMENT'));
  await expect(
    host.instance.rename(saved.id, ' ', saved.revision, ctx()),
  ).resolves.toMatchObject(rejected('INVALID_ARGUMENT'));
  expect(store.get(host.storageKey)).toBe(raw);
  const renamed = committed(
    await host.instance.rename(saved.id, 'Valid name', saved.revision, ctx()),
  );
  expect(renamed.title).toBe('Valid name');
  expect(renamed.revision).not.toBe(saved.revision);
});

it('rejects stale ordering membership and accepts a refreshed partial order under the exact precondition', async () => {
  const host = new MemoryViewHost(options());
  const created = committed(
    await host.instance.create(instance(), { requestId: 'new-view' }),
  );
  const raw = store.get(host.storageKey);
  for (const stale of [
    ['mine', 'missing'],
    [created.id, 'gone'],
  ]) {
    await expect(
      host.preference.saveOrder(
        definition.id,
        { scopeInstanceIds: stale, orderedInstanceIds: [...stale].reverse() },
        ABSENT_PRECONDITION,
        ctx(),
      ),
    ).resolves.toMatchObject(rejected('NOT_FOUND'));
    expect(store.get(host.storageKey)).toBe(raw);
  }
  const ordered = committed(
    await host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: [created.id, 'mine'],
        orderedInstanceIds: [created.id, 'mine'],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  expect(ordered.order).toEqual([created.id, 'mine']);
  expect(await ids(host)).toEqual([created.id, 'mine']);
  const after = store.get(host.storageKey);
  // The document now exists: an `absent` precondition is a stale view of it.
  await expect(
    host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['mine', created.id],
        orderedInstanceIds: ['mine', created.id],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('REVISION_CONFLICT'));
  expect(store.get(host.storageKey)).toBe(after);
});

it('reports unavailable reads without rewriting storage and succeeds after the adapter recovers', async () => {
  const seed = options();
  const original = new MemoryViewHost(seed);
  const saved = await original.instance.load('mine');
  const raw = store.get(original.storageKey);
  vi.spyOn(store, 'get').mockImplementationOnce(() => {
    throw new Error('storage offline');
  });
  const set = vi.spyOn(store, 'set');
  const host = new MemoryViewHost(seed);
  await expect(host.instance.load('mine')).rejects.toMatchObject({
    code: 'UNAVAILABLE',
    message: 'storage offline',
  });
  expect(set).not.toHaveBeenCalled();
  expect(store.get(host.storageKey)).toBe(raw);
  expect(await host.instance.load('mine')).toEqual(saved);
  expect(set).not.toHaveBeenCalled();
});

it.each([
  'invalid instance collection',
  'invalid seeded list',
  'invalid preference dictionary',
  'invalid receipt dictionary',
  'missing revision',
  'wrong private owner',
  'wrong public owner',
  'duplicate preference order',
  'invalid default type',
  'invalid receipt observation',
  'visible ID collision',
])(
  'preserves corrupt storage with %s and recovers when valid persisted state is restored',
  async problem => {
    const host = new MemoryViewHost(options());
    const observation = await host.instance.create(instance(), {
      requestId: 'receipt',
    });
    const created = committed(observation);
    const valid = store.get(host.storageKey)!;
    const state = JSON.parse(valid);
    const mine = state.instances.find(
      (item: ViewInstance) => item.id === 'mine',
    );
    const key = JSON.stringify(['alice', 'instance', 'receipt']);
    const invalid = {
      'invalid instance collection': { ...state, instances: {} },
      'invalid seeded list': { ...state, seeded: 'alice' },
      'invalid preference dictionary': { ...state, preferences: [] },
      'invalid receipt dictionary': { ...state, receipts: [] },
      'missing revision': { ...state, instances: [{ ...mine, revision: '' }] },
      'wrong private owner': {
        ...state,
        instances: [{ ...mine, ownerKey: null }],
      },
      'wrong public owner': {
        ...state,
        instances: [{ ...mine, scope: { type: 'public', source: 'shared' } }],
      },
      'duplicate preference order': {
        ...state,
        preferences: {
          alice: {
            revision: 'p1',
            order: ['mine', 'mine'],
            defaultInstanceId: 'mine',
          },
        },
      },
      'invalid default type': {
        ...state,
        preferences: {
          alice: { revision: 'p1', order: ['mine'], defaultInstanceId: 1 },
        },
      },
      'invalid receipt observation': {
        ...state,
        receipts: {
          [key]: { ...state.receipts[key], observation: { outcome: 'done' } },
        },
      },
      'visible ID collision': {
        ...state,
        instances: [
          ...state.instances,
          {
            ...mine,
            ownerKey: null,
            scope: { type: 'public', source: 'shared' },
          },
        ],
      },
    }[problem];
    const corrupt = JSON.stringify(invalid);
    store.set(host.storageKey, corrupt);
    await expect(host.instance.list(definition.id)).rejects.toMatchObject({
      code: 'CORRUPT_STATE',
    });
    await expect(
      host.instance.create(instance(), { requestId: 'while-corrupt' }),
    ).resolves.toMatchObject(rejected('CORRUPT_STATE'));
    expect(store.get(host.storageKey)).toBe(corrupt);
    store.set(host.storageKey, valid);
    expect(await host.instance.load(created.id)).toEqual(created);
    expect(
      await host.instance.create(instance(), { requestId: 'receipt' }),
    ).toEqual(observation);
    expect((await host.instance.list(definition.id)).items).toHaveLength(2);
  },
);
