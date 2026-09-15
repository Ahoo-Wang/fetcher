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
import { MemoryViewHost } from '../src/record/MemoryViewHost.js';
import { ViewEngine } from '../src/engine/ViewEngine.js';
import { summaryOf, type ViewInstance } from '../src/contracts/viewModel.js';
import {
  ABSENT_PRECONDITION,
  preconditionFor,
  type ViewServiceErrorCode,
  type WriteObservation,
  type WritePrecondition,
} from '../src/contracts/viewServiceContract.js';
import { definition, instance, setup } from './fixtures/viewPage.js';

const store = new Map<string, string | null>();
beforeEach(() => store.clear());
afterEach(() => vi.restoreAllMocks());
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
function options(scopeKey = 'developer') {
  return {
    scopeKey,
    store,
    serviceKey: 'test-service',
    definition,
    instances: [
      instance,
      {
        ...instance,
        id: 'system',
        title: '系统视图',
        scope: { type: 'public', source: 'system' } as const,
      },
    ] as ViewInstance[],
    defaultInstanceId: instance.id as string | null,
    resolveSource: setup().host.resolveSource,
  };
}
const ids = async (host: MemoryViewHost) =>
  (await host.instance.list(definition.id)).items.map(item => item.id);

it('keeps other sessions and clears the default after deleting the default view without re-reading the catalog', async () => {
  const input = options();
  input.instances.push({ ...structuredClone(instance), id: 'other' });
  const host = new MemoryViewHost(input);
  const otherClient = new MemoryViewHost(input);
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    selectedInstanceId: 'mine',
    defaultInstanceId: 'mine',
    instanceIds: ['mine', 'system', 'other'],
  });
  await engine.selectInstance('system');
  engine
    .record('system')
    .setColumns([{ id: 'amount', kind: 'field', field: 'amount', width: 240 }]);
  const draft = engine.getSnapshot().sessions.system;
  committed(
    await otherClient.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['mine', 'other', 'system'],
        orderedInstanceIds: ['mine', 'other', 'system'],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  const list = vi
    .spyOn(host.instance, 'list')
    .mockRejectedValue(new Error('list unavailable'));
  await engine.deleteInstance('mine');
  expect(list).not.toHaveBeenCalled();
  // The receipt only proves the deletion; the engine never derives a fallback default.
  expect(engine.getSnapshot()).toMatchObject({
    defaultInstanceId: null,
    selectedInstanceId: 'system',
    instanceIds: ['system', 'other'],
  });
  expect(engine.getSnapshot().sessions.system).toMatchObject({
    instance: draft.instance,
    dirty: true,
    filterDraft: draft.filterDraft,
  });
  expect(await otherClient.preference.load(definition.id)).toMatchObject({
    effectiveDefaultInstanceId: null,
    order: ['mine', 'other', 'system'],
  });
  engine.dispose();
});

it.each([true, false])(
  'adopts a default created elsewhere only after reloading (with system view: %s)',
  async withSystem => {
    const input = options();
    if (!withSystem) input.instances = [instance];
    const host = new MemoryViewHost(input);
    const otherClient = new MemoryViewHost(input);
    const engine = new ViewEngine({ definitionId: definition.id, host });
    await engine.load();
    const created = committed(
      await otherClient.instance.create(
        { ...instance, title: 'New default' },
        { requestId: 'new-default' },
      ),
    );
    committed(
      await otherClient.preference.saveDefault(
        definition.id,
        created.id,
        ABSENT_PRECONDITION,
        ctx(),
      ),
    );
    await engine.deleteInstance('mine');
    expect(engine.getSnapshot()).toMatchObject({
      defaultInstanceId: null,
      selectedInstanceId: withSystem ? 'system' : null,
    });
    expect(engine.getSnapshot().instanceIds).not.toContain(created.id);
    await engine.load();
    expect(engine.getSnapshot()).toMatchObject({
      defaultInstanceId: created.id,
      selectedInstanceId: created.id,
    });
    expect(engine.getSnapshot().sessions[created.id].instance).toEqual(created);
    await vi.waitFor(() =>
      expect(engine.getSnapshot().sessions[created.id].queryStatus).toBe(
        'success',
      ),
    );
    await expect(
      host.instance.delete('mine', created.revision, ctx()),
    ).resolves.toMatchObject(rejected('NOT_FOUND'));
    engine.dispose();
  },
);

it('persists component configuration, names, creation, deletion and ordering across new hosts', async () => {
  const host = new MemoryViewHost(options());
  const edited = await host.instance.load(instance.id);
  if (edited.kind !== 'record') throw new Error('expected a record view');
  edited.config.filters.root.props = {
    ...edited.config.filters.root.props,
    value: 77,
  };
  const saved = committed(await host.instance.save(edited, ctx()));
  expect(saved.revision).not.toBe(edited.revision);
  const copy = committed(
    await host.instance.create(
      { ...saved, title: '副本' },
      { requestId: 'copy' },
    ),
  );
  const renamed = committed(
    await host.instance.rename(copy.id, '本地副本', copy.revision, ctx()),
  );
  committed(
    await host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: [copy.id, 'system', instance.id],
        orderedInstanceIds: [copy.id, 'system', instance.id],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  const restored = new MemoryViewHost(options());
  expect(await ids(restored)).toEqual([copy.id, 'system', instance.id]);
  expect(await restored.instance.load(instance.id)).toEqual(saved);
  expect((await restored.instance.load(copy.id)).title).toBe('本地副本');
  expect(
    JSON.parse(store.get(host.storageKey)!).instances[2].config,
  ).not.toHaveProperty('filter');
  committed(await restored.instance.delete(copy.id, renamed.revision, ctx()));
  expect((await host.instance.list(definition.id)).items).toHaveLength(2);
});

it('persists a personal default without editing views or another user', async () => {
  const host = new MemoryViewHost(options());
  const before = await host.instance.list(definition.id);
  const first = committed(
    await host.preference.saveDefault(
      definition.id,
      'system',
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  const restored = new MemoryViewHost(options());
  expect(await restored.preference.load(definition.id)).toEqual({
    revision: first.revision,
    order: [],
    defaultInstanceId: 'system',
    effectiveDefaultInstanceId: 'system',
  });
  expect((await restored.instance.list(definition.id)).items).toEqual(
    before.items,
  );
  expect(
    await new MemoryViewHost(options('bob')).preference.load(definition.id),
  ).toEqual({
    revision: null,
    order: [],
    defaultInstanceId: instance.id,
    effectiveDefaultInstanceId: instance.id,
  });
  const cleared = committed(
    await host.preference.saveDefault(
      definition.id,
      null,
      preconditionFor(first.revision),
      ctx(),
    ),
  );
  expect(cleared.defaultInstanceId).toBeNull();
  await expect(
    host.preference.saveDefault(
      definition.id,
      'unknown',
      preconditionFor(cleared.revision),
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('NOT_FOUND'));
  expect(await host.preference.load(definition.id)).toMatchObject({
    revision: cleared.revision,
    defaultInstanceId: null,
    effectiveDefaultInstanceId: null,
  });
});

it.each([undefined, 123, '', '.'])(
  'rejects invalid default instance ID %j without creating a preference',
  async value => {
    const host = new MemoryViewHost(options());
    await expect(
      host.preference.saveDefault(
        definition.id,
        value as unknown as string | null,
        ABSENT_PRECONDITION,
        ctx(),
      ),
    ).resolves.toMatchObject(rejected('INVALID_ARGUMENT'));
    expect((await host.preference.load(definition.id)).revision).toBeNull();
  },
);

it('allows visible personal and shared defaults without edit rights', async () => {
  const input = options();
  const shared = {
    ...structuredClone(instance),
    id: 'shared',
    title: '共享视图',
    scope: { type: 'public', source: 'shared' } as const,
  };
  const host = new MemoryViewHost({
    ...input,
    instances: [...input.instances, shared],
    instancePermissions: () => ({
      save: false,
      rename: false,
      delete: false,
      saveAsPersonal: false,
      saveAsShared: false,
    }),
  });
  let revision: string | null = null;
  for (const id of [instance.id, 'shared']) {
    expect(
      host.permission.getInstance(summaryOf(await host.instance.load(id))).save,
    ).toBe(false);
    const state = committed(
      await host.preference.saveDefault(
        definition.id,
        id,
        preconditionFor(revision),
        ctx(),
      ),
    );
    revision = state.revision;
    expect(await host.preference.load(definition.id)).toMatchObject({
      defaultInstanceId: id,
      effectiveDefaultInstanceId: id,
    });
  }
});

it('rejects another definition and another users personal instance', async () => {
  const alice = new MemoryViewHost(options('alice'));
  const bob = new MemoryViewHost(options('bob'));
  const bobOnly = committed(
    await bob.instance.create(
      { ...instance, title: 'Bob 私有视图' },
      { requestId: 'bob-private' },
    ),
  );
  await expect(
    alice.preference.saveDefault(
      definition.id,
      bobOnly.id,
      ABSENT_PRECONDITION,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('NOT_FOUND'));
  await expect(
    alice.preference.saveDefault(
      'unknown',
      'system',
      ABSENT_PRECONDITION,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('NOT_FOUND'));
  expect((await alice.preference.load(definition.id)).revision).toBeNull();

  const otherInput = options('alice');
  const otherDefinition = { ...definition, id: 'other' };
  const other = new MemoryViewHost({
    ...otherInput,
    definition: otherDefinition,
    instances: otherInput.instances.map(item => ({
      ...structuredClone(item),
      definitionId: otherDefinition.id,
    })),
  });
  expect(
    (await other.preference.load(otherDefinition.id)).defaultInstanceId,
  ).toBe(instance.id);
  committed(
    await alice.preference.saveDefault(
      definition.id,
      'system',
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  expect(
    (await other.preference.load(otherDefinition.id)).defaultInstanceId,
  ).toBe(instance.id);
  await expect(other.preference.load(definition.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
});

it('clears the effective default after deleting the personal default and preserves repeated null', async () => {
  const host = new MemoryViewHost(options());
  const first = committed(
    await host.preference.saveDefault(
      definition.id,
      instance.id,
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  const selected = await host.instance.load(instance.id);
  committed(await host.instance.delete(selected.id, selected.revision, ctx()));
  expect(await host.preference.load(definition.id)).toMatchObject({
    revision: first.revision,
    defaultInstanceId: instance.id,
    effectiveDefaultInstanceId: null,
  });
  const cleared = committed(
    await host.preference.saveDefault(
      definition.id,
      null,
      preconditionFor(first.revision),
      ctx(),
    ),
  );
  const again = committed(
    await host.preference.saveDefault(
      definition.id,
      null,
      preconditionFor(cleared.revision),
      ctx(),
    ),
  );
  expect(again).toMatchObject({
    defaultInstanceId: null,
    effectiveDefaultInstanceId: null,
  });
  expect(again.revision).not.toBe(cleared.revision);
  expect(
    (await host.preference.load(definition.id)).defaultInstanceId,
  ).toBeNull();
});

it('isolates scope and definition, preserves seeds, and resets only its own key', async () => {
  const input = options();
  const host = new MemoryViewHost(input);
  input.instances[0] = { ...instance, title: '外部修改' };
  const loaded = await host.instance.load(instance.id);
  expect(loaded.title).toBe(instance.title);
  loaded.title = '保存的标题';
  committed(await host.instance.save(loaded, ctx()));
  const other = new MemoryViewHost(options('another-user'));
  expect((await other.instance.load(instance.id)).title).toBe(instance.title);
  const differentDefinition = new MemoryViewHost({
    ...options(),
    definition: { ...definition, id: 'other' },
    instances: [],
    defaultInstanceId: null,
  });
  expect(differentDefinition.storageKey).not.toBe(host.storageKey);
  store.set('unrelated', 'keep');
  await host.reset();
  expect((await host.instance.load(instance.id)).title).toBe(instance.title);
  expect(store.get('unrelated')).toBe('keep');
});

it('rejects stale writes and protects system views even when callers bypass UI permissions', async () => {
  const host = new MemoryViewHost(options());
  const stale = await host.instance.load(instance.id);
  committed(await host.instance.save({ ...stale, title: '最新版本' }, ctx()));
  const conflict = {
    outcome: 'rejected',
    issue: {
      code: 'REVISION_CONFLICT',
      message: expect.stringMatching(/重新加载/),
    },
  };
  await expect(host.instance.save(stale, ctx())).resolves.toMatchObject(
    conflict,
  );
  await expect(
    host.instance.rename(stale.id, '旧版本', stale.revision, ctx()),
  ).resolves.toMatchObject(conflict);
  await expect(
    host.instance.delete(stale.id, stale.revision, ctx()),
  ).resolves.toMatchObject(conflict);
  const system = await host.instance.load('system');
  expect(host.permission.getInstance(summaryOf(system))).toMatchObject({
    save: false,
    rename: false,
    delete: false,
  });
  const forbidden = {
    outcome: 'rejected',
    issue: { code: 'FORBIDDEN', message: expect.stringMatching(/系统/) },
  };
  await expect(host.instance.save(system, ctx())).resolves.toMatchObject(
    forbidden,
  );
  await expect(
    host.instance.rename('system', '改名', system.revision, ctx()),
  ).resolves.toMatchObject(forbidden);
  await expect(
    host.instance.delete('system', system.revision, ctx()),
  ).resolves.toMatchObject(forbidden);
  await expect(
    host.instance.create(system, { requestId: 'system' }),
  ).resolves.toMatchObject(forbidden);
  await expect(
    host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: [stale.id, stale.id],
        orderedInstanceIds: [stale.id, stale.id],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('INVALID_ARGUMENT'));
  expect((await host.instance.load('system')).title).toBe('系统视图');
  expect((await host.preference.load(definition.id)).revision).toBeNull();
});

it('reports corrupted data and storage failures without overwriting existing records', async () => {
  const host = new MemoryViewHost(options());
  store.set(host.storageKey, '{broken');
  await expect(host.instance.list(definition.id)).rejects.toMatchObject({
    code: 'CORRUPT_STATE',
  });
  await expect(host.instance.save(instance, ctx())).resolves.toMatchObject(
    rejected('CORRUPT_STATE'),
  );
  expect(store.get(host.storageKey)).toBe('{broken');
  await host.reset();
  const saved = committed(
    await host.instance.save(await host.instance.load(instance.id), ctx()),
  );
  const before = store.get(host.storageKey);
  vi.spyOn(store, 'set').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError');
  });
  await expect(
    host.instance.save({ ...saved, title: '不会保存' }, ctx()),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'UNAVAILABLE', message: expect.stringContaining('full') },
  });
  await expect(
    host.instance.delete(saved.id, saved.revision, ctx()),
  ).resolves.toMatchObject(rejected('UNAVAILABLE'));
  expect(store.get(host.storageKey)).toBe(before);
});

it('clears the effective default after deleting the seed default and honors aborted reads', async () => {
  const host = new MemoryViewHost(options());
  committed(
    await host.instance.delete(
      instance.id,
      (await host.instance.load(instance.id)).revision,
      ctx(),
    ),
  );
  expect(await host.preference.load(definition.id)).toEqual({
    revision: null,
    order: [],
    defaultInstanceId: instance.id,
    effectiveDefaultInstanceId: null,
  });
  const controller = new AbortController();
  controller.abort();
  await expect(
    host.definition.load(definition.id, { signal: controller.signal }),
  ).rejects.toThrow();
  await expect(
    host.instance.list(definition.id, { signal: controller.signal }),
  ).rejects.toBe(controller.signal.reason);
  await expect(host.instance.list('unknown')).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  await expect(host.instance.load('unknown')).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  await expect(host.preference.load('unknown')).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
});

it('restores a saved view through a fresh engine while delegating record queries', async () => {
  const { host: source, paged } = setup();
  const input = { ...options(), resolveSource: source.resolveSource };
  const first = new ViewEngine({
    definitionId: definition.id,
    host: new MemoryViewHost(input),
  });
  await first.load();
  first.setTitle('持久化视图');
  await first.save();
  first.dispose();
  const second = new ViewEngine({
    definitionId: definition.id,
    host: new MemoryViewHost(input),
  });
  await second.load();
  expect(second.getSnapshot().sessions.mine.instance.title).toBe('持久化视图');
  expect(second.getSnapshot().sessions.mine.rows[0].amount).toBe(42);
  expect(paged).toHaveBeenCalledTimes(2);
  second.dispose();
});

it('replays a scoped deletion by request identity and rejects a repeated delete without touching another users instance', async () => {
  const alice = new MemoryViewHost(options('alice'));
  const bob = new MemoryViewHost(options('bob'));
  const own = await alice.instance.load(instance.id);
  const others = await bob.instance.load(instance.id);
  const receipt = await alice.instance.delete(own.id, own.revision, {
    requestId: 'delete-mine',
  });
  expect(receipt).toMatchObject({
    outcome: 'committed',
    value: { id: own.id, revision: expect.any(String) },
  });
  expect(
    await alice.instance.delete(own.id, own.revision, {
      requestId: 'delete-mine',
    }),
  ).toEqual(receipt);
  expect(
    await new MemoryViewHost(options('alice')).instance.delete(
      own.id,
      own.revision,
      { requestId: 'delete-mine' },
    ),
  ).toEqual(receipt);
  await expect(
    alice.instance.delete(own.id, own.revision, ctx()),
  ).resolves.toMatchObject(rejected('NOT_FOUND'));
  expect(await bob.instance.load(instance.id)).toEqual(others);
  expect(JSON.parse(store.get(alice.storageKey)!).preferences).toEqual({});
  expect(
    (await alice.preference.load(definition.id)).effectiveDefaultInstanceId,
  ).toBeNull();
  expect(
    (await bob.preference.load(definition.id)).effectiveDefaultInstanceId,
  ).toBe(instance.id);
  const system = await alice.instance.load('system');
  await expect(
    alice.instance.delete('system', system.revision, ctx()),
  ).resolves.toMatchObject(rejected('FORBIDDEN'));
});

it('persists both layouts and restores each configuration after reloading', async () => {
  const host = new MemoryViewHost(options());
  const first = new ViewEngine({ definitionId: definition.id, host });
  try {
    await first.load();
    first.record(first.getSnapshot().selectedInstanceId!).setLayout('card');
    first.record(first.getSnapshot().selectedInstanceId!).setCardConfig({
      title: { id: 'title', field: 'amount' },
      fields: [],
      actions: { visible: false, renderer: { name: 'custom' } },
    });
    const savedPresentation =
      first.getSnapshot().sessions[instance.id].instance.config.presentation;
    await first.save();
    const second = new ViewEngine({
      definitionId: definition.id,
      host: new MemoryViewHost(options()),
    });
    try {
      await second.load();
      expect(
        second.getSnapshot().sessions[instance.id].instance.config.presentation,
      ).toEqual(savedPresentation);
      second
        .record(second.getSnapshot().selectedInstanceId!)
        .setLayout('table');
      second.record(second.getSnapshot().selectedInstanceId!).setLayout('card');
      expect(
        second.getSnapshot().sessions[instance.id].instance.config.presentation,
      ).toEqual(savedPresentation);
    } finally {
      second.dispose();
    }
  } finally {
    first.dispose();
  }
});

it('keeps default stores independent even for the same service identity', async () => {
  const input = { ...options(), store: undefined };
  const left = new MemoryViewHost(input);
  const right = new MemoryViewHost(input);
  const created = committed(
    await left.instance.create(
      { ...instance, title: 'only left' },
      { requestId: 'private-store' },
    ),
  );
  await expect(right.instance.load(created.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  // Receipts live with their store: the same request identity creates a distinct view elsewhere.
  expect(
    committed(
      await right.instance.create(
        { ...instance, title: 'only left' },
        { requestId: 'private-store' },
      ),
    ).id,
  ).not.toBe(created.id);
});

it('keeps the stored default and explicit order after deleting the default and loads a fresh engine without a fallback', async () => {
  const input = options();
  input.instances.push({ ...instance, id: 'other' });
  const host = new MemoryViewHost(input);
  const first = committed(
    await host.preference.saveDefault(
      definition.id,
      instance.id,
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  const ordered = committed(
    await host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: [instance.id, 'other', 'system'],
        orderedInstanceIds: [instance.id, 'other', 'system'],
      },
      preconditionFor(first.revision),
      ctx(),
    ),
  );
  expect(ordered.defaultInstanceId).toBe(instance.id);
  const selected = await host.instance.load(instance.id);
  committed(await host.instance.delete(selected.id, selected.revision, ctx()));
  expect(await host.preference.load(definition.id)).toEqual({
    revision: ordered.revision,
    order: [instance.id, 'other', 'system'],
    defaultInstanceId: instance.id,
    effectiveDefaultInstanceId: null,
  });
  expect(
    JSON.parse(store.get(host.storageKey)!).preferences.developer
      .defaultInstanceId,
  ).toBe(instance.id);
  const reordered = committed(
    await host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['system', 'other'],
        orderedInstanceIds: ['system', 'other'],
      },
      preconditionFor(ordered.revision),
      ctx(),
    ),
  );
  expect(reordered.order).toEqual(['system', 'other']);
  const engine = new ViewEngine({
    definitionId: definition.id,
    host: new MemoryViewHost(input),
  });
  try {
    await engine.load();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'ready',
      instanceIds: ['system', 'other'],
      defaultInstanceId: null,
      selectedInstanceId: null,
      preference: { status: 'ready', revision: reordered.revision },
    });
  } finally {
    engine.dispose();
  }
});

it('keeps every users stored preference after a shared default is deleted; only the effective default changes', async () => {
  const input = options();
  input.instances.push({
    ...instance,
    id: 'shared',
    scope: { type: 'public', source: 'shared' },
  });
  const alice = new MemoryViewHost({ ...input, scopeKey: 'alice' });
  const bob = new MemoryViewHost({ ...input, scopeKey: 'bob' });
  const cleared = new MemoryViewHost({ ...input, scopeKey: 'cleared' });
  const unrelated = new MemoryViewHost({ ...input, scopeKey: 'unrelated' });
  const saveDefault = (host: MemoryViewHost, id: string | null) =>
    host.preference.saveDefault(definition.id, id, ABSENT_PRECONDITION, ctx());
  const aliceDefault = committed(await saveDefault(alice, 'shared'));
  const bobDefault = committed(await saveDefault(bob, 'shared'));
  committed(await saveDefault(cleared, null));
  committed(await saveDefault(unrelated, 'system'));
  committed(
    await alice.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['shared', 'system', instance.id],
        orderedInstanceIds: ['shared', 'system', instance.id],
      },
      preconditionFor(aliceDefault.revision),
      ctx(),
    ),
  );
  committed(
    await bob.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['shared', instance.id, 'system'],
        orderedInstanceIds: ['shared', instance.id, 'system'],
      },
      preconditionFor(bobDefault.revision),
      ctx(),
    ),
  );
  const selected = await alice.instance.load('shared');
  committed(await alice.instance.delete(selected.id, selected.revision, ctx()));
  expect(JSON.parse(store.get(alice.storageKey)!).preferences).toMatchObject({
    alice: {
      defaultInstanceId: 'shared',
      order: ['shared', 'system', instance.id],
    },
    bob: {
      defaultInstanceId: 'shared',
      order: ['shared', instance.id, 'system'],
    },
    cleared: { defaultInstanceId: null },
    unrelated: { defaultInstanceId: 'system' },
  });
  for (const [host, effective] of [
    [alice, null],
    [bob, null],
    [cleared, null],
    [unrelated, 'system'],
  ] as const)
    expect(
      (await host.preference.load(definition.id)).effectiveDefaultInstanceId,
    ).toBe(effective);
  expect(await ids(bob)).toEqual([instance.id, 'system']);
});

it('clears the effective default when its last visible instance is deleted', async () => {
  const input = options();
  input.instances = [instance];
  const host = new MemoryViewHost(input);
  const selected = await host.instance.load(instance.id);
  committed(await host.instance.delete(selected.id, selected.revision, ctx()));
  expect(JSON.parse(store.get(host.storageKey)!).preferences).toEqual({});
  expect(await host.preference.load(definition.id)).toEqual({
    revision: null,
    order: [],
    defaultInstanceId: instance.id,
    effectiveDefaultInstanceId: null,
  });
  expect(await host.instance.list(definition.id)).toEqual({
    items: [],
    nextCursor: null,
    total: 0,
  });
});

it('resolves a new users seed default to null when the shared seed was already deleted', async () => {
  const input = options();
  input.instances.push({
    ...instance,
    id: 'shared',
    scope: { type: 'public', source: 'shared' },
  });
  input.defaultInstanceId = 'shared';
  const alice = new MemoryViewHost({ ...input, scopeKey: 'alice' });
  const shared = await alice.instance.load('shared');
  committed(await alice.instance.delete(shared.id, shared.revision, ctx()));
  const bobOptions = { ...input, scopeKey: 'bob' };
  const bob = new MemoryViewHost(bobOptions);
  expect(await bob.preference.load(definition.id)).toEqual({
    revision: null,
    order: [],
    defaultInstanceId: 'shared',
    effectiveDefaultInstanceId: null,
  });
  expect(JSON.parse(store.get(bob.storageKey)!).preferences).not.toHaveProperty(
    'bob',
  );
  const ordered = committed(
    await bob.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['system', instance.id],
        orderedInstanceIds: ['system', instance.id],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  expect(ordered.effectiveDefaultInstanceId).toBeNull();
  expect(await ids(new MemoryViewHost(bobOptions))).toEqual([
    'system',
    instance.id,
  ]);
  const engine = new ViewEngine({ definitionId: definition.id, host: bob });
  try {
    await engine.load();
    expect(engine.getSnapshot()).toMatchObject({
      defaultInstanceId: null,
      selectedInstanceId: null,
      instanceIds: ['system', instance.id],
    });
  } finally {
    engine.dispose();
  }
});

it('grants dashboard creation from definition permissions and publishes changes to the engine', async () => {
  let allowed = false;
  const host = new MemoryViewHost({
    ...options(),
    definition: { ...definition, dashboard: true },
    definitionPermissions: () => ({
      createPersonal: allowed,
      createShared: allowed,
    }),
  });
  expect(host.permission.getDefinition()).toEqual({
    createPersonal: false,
    createShared: false,
    reorder: true,
    setDefault: true,
  });
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  expect(engine.getCapabilitiesSnapshot()).toMatchObject({
    createPersonal: false,
    createShared: false,
  });
  allowed = true;
  host.publishPermissions();
  expect(engine.getCapabilitiesSnapshot()).toMatchObject({
    createPersonal: true,
    createShared: true,
    reorder: true,
    setDefault: true,
  });
  expect(host.permission.getInstance(summaryOf(instance)).saveAsPersonal).toBe(
    true,
  );
  engine.dispose();
});

it('returns the identical receipt for a replayed write and rejects a different body under the same requestId', async () => {
  const host = new MemoryViewHost(options());
  const loaded = await host.instance.load(instance.id);
  const first = await host.instance.save(
    { ...loaded, title: '第一次' },
    { requestId: 'save-once' },
  );
  expect(first).toMatchObject({ outcome: 'committed', visibility: 'visible' });
  expect(
    await host.instance.save(
      { ...loaded, title: '第一次' },
      { requestId: 'save-once' },
    ),
  ).toEqual(first);
  expect(
    await new MemoryViewHost(options()).instance.save(
      { ...loaded, title: '第一次' },
      { requestId: 'save-once' },
    ),
  ).toEqual(first);
  await expect(
    host.instance.save(
      { ...loaded, title: '第二次' },
      { requestId: 'save-once' },
    ),
  ).resolves.toMatchObject(rejected('CONFLICT'));
  // A different action under the same identity is a different body as well.
  await expect(
    host.instance.rename(loaded.id, '第一次', loaded.revision, {
      requestId: 'save-once',
    }),
  ).resolves.toMatchObject(rejected('CONFLICT'));
  expect((await host.instance.load(instance.id)).title).toBe('第一次');
  expect(JSON.parse(store.get(host.storageKey)!).receipts).toHaveProperty(
    JSON.stringify(['developer', 'instance', 'save-once']),
  );
  // Preference writes have their own identity space.
  const preference = await host.preference.saveDefault(
    definition.id,
    'system',
    ABSENT_PRECONDITION,
    { requestId: 'save-once' },
  );
  expect(preference.outcome).toBe('committed');
  expect(
    await host.preference.saveDefault(
      definition.id,
      'system',
      ABSENT_PRECONDITION,
      { requestId: 'save-once' },
    ),
  ).toEqual(preference);
  await expect(
    host.preference.saveDefault(definition.id, null, ABSENT_PRECONDITION, {
      requestId: 'save-once',
    }),
  ).resolves.toMatchObject(rejected('CONFLICT'));
  await expect(
    host.instance.save(
      { ...loaded, title: '第三次' },
      {
        requestId: ' ',
      },
    ),
  ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
});

it('requires the exact preference precondition for order and default writes', async () => {
  const host = new MemoryViewHost(options());
  const change = {
    scopeInstanceIds: ['system', instance.id],
    orderedInstanceIds: ['system', instance.id],
  };
  await expect(
    host.preference.saveOrder(
      definition.id,
      change,
      { type: 'matches', revision: 'p0' },
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('REVISION_CONFLICT'));
  const first = committed(
    await host.preference.saveOrder(
      definition.id,
      change,
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  await expect(
    host.preference.saveOrder(
      definition.id,
      change,
      ABSENT_PRECONDITION,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('REVISION_CONFLICT'));
  await expect(
    host.preference.saveDefault(
      definition.id,
      'system',
      ABSENT_PRECONDITION,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('REVISION_CONFLICT'));
  await expect(
    host.preference.saveDefault(
      definition.id,
      'system',
      undefined as unknown as WritePrecondition,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('PRECONDITION_REQUIRED'));
  const second = committed(
    await host.preference.saveDefault(
      definition.id,
      'system',
      preconditionFor(first.revision),
      ctx(),
    ),
  );
  expect(second).toMatchObject({
    order: ['system', instance.id],
    defaultInstanceId: 'system',
  });
  await expect(
    host.preference.saveOrder(
      definition.id,
      change,
      preconditionFor(first.revision),
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('REVISION_CONFLICT'));
  expect(await host.preference.load(definition.id)).toEqual(second);
});

it('reorders only the scoped slots of the explicit order and keeps the rest in place', async () => {
  const input = options();
  input.instances = ['A', 'B', 'C', 'D'].map(id => ({
    ...structuredClone(instance),
    id,
    title: `视图 ${id}`,
  }));
  input.defaultInstanceId = 'B';
  const host = new MemoryViewHost(input);
  expect(await ids(host)).toEqual(['A', 'B', 'C', 'D']);
  // Before an explicit order exists, the change applies to the visible order the user sees:
  // unscoped slots (B, D) keep their positions instead of falling behind the scoped ones.
  const partial = committed(
    await host.preference.saveOrder(
      definition.id,
      { scopeInstanceIds: ['A', 'C'], orderedInstanceIds: ['C', 'A'] },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  expect(partial.order).toEqual(['C', 'B', 'A', 'D']);
  expect(await ids(host)).toEqual(['C', 'B', 'A', 'D']);
  const full = committed(
    await host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['A', 'B', 'C', 'D'],
        orderedInstanceIds: ['A', 'B', 'C', 'D'],
      },
      preconditionFor(partial.revision),
      ctx(),
    ),
  );
  expect(full.order).toEqual(['A', 'B', 'C', 'D']);
  const swapped = committed(
    await host.preference.saveOrder(
      definition.id,
      { scopeInstanceIds: ['A', 'C'], orderedInstanceIds: ['C', 'A'] },
      preconditionFor(full.revision),
      ctx(),
    ),
  );
  expect(swapped.order).toEqual(['C', 'B', 'A', 'D']);
  expect((await host.preference.load(definition.id)).order).toEqual([
    'C',
    'B',
    'A',
    'D',
  ]);
  expect(await ids(host)).toEqual(['C', 'B', 'A', 'D']);
  await expect(
    host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['A', 'missing'],
        orderedInstanceIds: ['missing', 'A'],
      },
      preconditionFor(swapped.revision),
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('NOT_FOUND'));
  const engine = new ViewEngine({ definitionId: definition.id, host });
  try {
    await engine.load();
    expect(engine.getSnapshot().instanceIds).toEqual(['C', 'B', 'A', 'D']);
    await engine.reorderInstances(['D', 'C'], ['C', 'D']);
    expect(engine.getSnapshot().instanceIds).toEqual(['D', 'B', 'A', 'C']);
    expect((await host.preference.load(definition.id)).order).toEqual([
      'D',
      'B',
      'A',
      'C',
    ]);
    expect(engine.getSnapshot().preference.revision).toBe(
      (await host.preference.load(definition.id)).revision,
    );
  } finally {
    engine.dispose();
  }
});

it('pages and filters the catalog with cursors that expire on a preference change', async () => {
  const input = options();
  input.instances = ['a', 'b', 'c', 'd', 'e'].map((id, index) => ({
    ...structuredClone(instance),
    id,
    title: index % 2 ? `奇数 ${id}` : `偶数 ${id}`,
  }));
  input.defaultInstanceId = null;
  const host = new MemoryViewHost(input);
  const first = await host.instance.list(definition.id, { limit: 2 });
  expect(first).toMatchObject({ total: 5, nextCursor: expect.any(String) });
  expect(first.items.map(item => item.id)).toEqual(['a', 'b']);
  expect(first.items[0]).not.toHaveProperty('config');
  const second = await host.instance.list(definition.id, {
    limit: 2,
    cursor: first.nextCursor,
  });
  expect(second.items.map(item => item.id)).toEqual(['c', 'd']);
  const last = await host.instance.list(definition.id, {
    limit: 2,
    cursor: second.nextCursor,
  });
  expect(last).toMatchObject({ nextCursor: null, total: 5 });
  expect(last.items.map(item => item.id)).toEqual(['e']);
  const odd = await host.instance.list(definition.id, {
    query: '奇数',
    limit: 1,
  });
  expect(odd).toMatchObject({ total: 2, nextCursor: expect.any(String) });
  expect(odd.items.map(item => item.id)).toEqual(['b']);
  expect(
    (
      await host.instance.list(definition.id, {
        query: '奇数',
        limit: 1,
        cursor: odd.nextCursor,
      })
    ).items.map(item => item.id),
  ).toEqual(['d']);
  // A cursor is bound to its query and to the user's preference revision.
  await expect(
    host.instance.list(definition.id, { cursor: odd.nextCursor }),
  ).rejects.toMatchObject({ code: 'CURSOR_EXPIRED' });
  await expect(
    host.instance.list(definition.id, { cursor: 'not-a-cursor' }),
  ).rejects.toMatchObject({ code: 'CURSOR_EXPIRED' });
  for (const limit of [0, 201, 1.5])
    await expect(
      host.instance.list(definition.id, { limit }),
    ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  committed(
    await host.preference.saveOrder(
      definition.id,
      { scopeInstanceIds: ['a', 'e'], orderedInstanceIds: ['e', 'a'] },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  await expect(
    host.instance.list(definition.id, { limit: 2, cursor: first.nextCursor }),
  ).rejects.toMatchObject({ code: 'CURSOR_EXPIRED' });
  expect(
    (await host.instance.list(definition.id, { limit: 2 })).items.map(
      item => item.id,
    ),
  ).toEqual(['e', 'b']);
  // Another user's preference does not invalidate this user's cursor.
  const bob = new MemoryViewHost({ ...input, scopeKey: 'bob' });
  const bobFirst = await bob.instance.list(definition.id, { limit: 2 });
  committed(
    await host.preference.saveDefault(
      definition.id,
      'a',
      preconditionFor((await host.preference.load(definition.id)).revision),
      ctx(),
    ),
  );
  expect(
    (
      await bob.instance.list(definition.id, {
        limit: 2,
        cursor: bobFirst.nextCursor,
      })
    ).items.map(item => item.id),
  ).toEqual(['c', 'd']);
});

it('rejects configuration writes designed against another definition revision', async () => {
  const revisioned = new MemoryViewHost({
    ...options(),
    definition: { ...definition, revision: 'd2' },
  });
  const loaded = await revisioned.instance.load(instance.id);
  await expect(
    revisioned.instance.save(loaded, {
      requestId: 'stale-save',
      definitionRevision: 'd1',
    }),
  ).resolves.toMatchObject(rejected('DEFINITION_CHANGED'));
  await expect(
    revisioned.instance.create(
      { ...instance, title: '旧定义' },
      { requestId: 'stale-create', definitionRevision: 'd1' },
    ),
  ).resolves.toMatchObject(rejected('DEFINITION_CHANGED'));
  expect((await revisioned.instance.list(definition.id)).items).toHaveLength(2);
  const saved = committed(
    await revisioned.instance.save(loaded, {
      requestId: 'current-save',
      definitionRevision: 'd2',
    }),
  );
  expect(saved.revision).not.toBe(loaded.revision);
  // Without a context revision nothing can be compared.
  committed(
    await revisioned.instance.save(
      { ...saved, title: '无版本上下文' },
      { requestId: 'unversioned-save' },
    ),
  );
  // A definition without a revision cannot be compared either.
  const unversioned = new MemoryViewHost({
    ...options(),
    serviceKey: 'unversioned',
  });
  committed(
    await unversioned.instance.create(
      { ...instance, title: '任意版本' },
      { requestId: 'any-revision', definitionRevision: 'anything' },
    ),
  );
  const engine = new ViewEngine({
    definitionId: definition.id,
    host: revisioned,
  });
  try {
    await engine.load();
    engine.setTitle('引擎按当前定义保存');
    await engine.save();
    expect((await revisioned.instance.load(instance.id)).title).toBe(
      '引擎按当前定义保存',
    );
  } finally {
    engine.dispose();
  }
});

it('reconciles an earlier write by request identity without replaying it', async () => {
  const host = new MemoryViewHost(options());
  const reference = (requestId: string, targetId?: string) => ({
    resource: 'instance' as const,
    definitionId: definition.id,
    requestId,
    ...(targetId ? { targetId } : {}),
  });
  await expect(host.operation.reconcile(reference('never'))).resolves.toEqual({
    outcome: 'unknown',
    issue: { code: 'NOT_FOUND', message: expect.any(String) },
  });
  const loaded = await host.instance.load(instance.id);
  const receipt = await host.instance.rename(
    loaded.id,
    '核对',
    loaded.revision,
    {
      requestId: 'rename-1',
    },
  );
  expect(receipt.outcome).toBe('committed');
  expect(await host.operation.reconcile(reference('rename-1'))).toEqual(
    receipt,
  );
  expect(
    await host.operation.reconcile(reference('rename-1', loaded.id)),
  ).toEqual(receipt);
  await expect(
    host.operation.reconcile(reference('rename-1', 'system')),
  ).resolves.toMatchObject({
    outcome: 'unknown',
    issue: { code: 'NOT_FOUND' },
  });
  await expect(
    host.operation.reconcile({
      ...reference('rename-1'),
      resource: 'preference',
    }),
  ).resolves.toMatchObject({
    outcome: 'unknown',
    issue: { code: 'NOT_FOUND' },
  });
  // Rejected outcomes leave no receipt.
  await expect(
    host.instance.rename(loaded.id, '过期', loaded.revision, {
      requestId: 'rename-2',
    }),
  ).resolves.toMatchObject(rejected('REVISION_CONFLICT'));
  await expect(
    host.operation.reconcile(reference('rename-2')),
  ).resolves.toMatchObject({
    outcome: 'unknown',
    issue: { code: 'NOT_FOUND' },
  });
  // Receipts are scoped to the user and definition, and survive host reconstruction.
  await expect(
    new MemoryViewHost(options('bob')).operation.reconcile(
      reference('rename-1'),
    ),
  ).resolves.toMatchObject({ outcome: 'unknown' });
  expect(
    await new MemoryViewHost(options()).operation.reconcile(
      reference('rename-1'),
    ),
  ).toEqual(receipt);
  await expect(
    host.operation.reconcile({
      ...reference('rename-1'),
      definitionId: 'unknown',
    }),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(host.operation.reconcile(reference(' '))).rejects.toMatchObject({
    code: 'INVALID_ARGUMENT',
  });
  expect((await host.instance.load(instance.id)).title).toBe('核对');
});

it('drops stored order entries for instances that are no longer visible', async () => {
  const input = options();
  input.instances.push({ ...instance, id: 'gone' }, { ...instance, id: 'kept' });
  const host = new MemoryViewHost(input);
  const first = committed(
    await host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: [instance.id, 'gone', 'kept'],
        orderedInstanceIds: [instance.id, 'gone', 'kept'],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  const gone = await host.instance.load('gone');
  committed(await host.instance.delete(gone.id, gone.revision, ctx()));
  const next = committed(
    await host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: [instance.id, 'kept'],
        orderedInstanceIds: [instance.id, 'kept'],
      },
      preconditionFor(first.revision),
      ctx(),
    ),
  );
  expect(next.order).toEqual([instance.id, 'system', 'kept']);
});
