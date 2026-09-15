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
import { ViewEngine } from '../src/engine/ViewEngine.js';
import {
  ABSENT_PRECONDITION,
  type ViewServiceErrorCode,
  type WriteObservation,
} from '../src/contracts/viewServiceContract.js';
import { definition, instance, setup } from './fixtures/viewPage.js';

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
function options(scopeKey = 'alice') {
  return {
    serviceKey: 'tenant',
    scopeKey,
    store,
    definition,
    instances: [
      instance,
      {
        ...instance,
        id: 'system',
        scope: { type: 'public', source: 'system' } as const,
      },
    ],
    defaultInstanceId: instance.id,
    resolveSource: setup().host.resolveSource,
  };
}
const ids = async (host: MemoryViewHost) =>
  (await host.instance.list(definition.id)).items.map(item => item.id);

it('shares public content while isolating personal views, user ordering and tenants', async () => {
  const alice = new MemoryViewHost(options());
  const bob = new MemoryViewHost(options('bob'));
  const shared = committed(
    await alice.instance.create(
      {
        ...instance,
        title: '共享',
        scope: { type: 'public', source: 'shared' },
      },
      { requestId: 'shared' },
    ),
  );
  const privateView = committed(
    await alice.instance.create(
      { ...instance, title: '私人' },
      { requestId: 'personal' },
    ),
  );
  expect((await bob.instance.load(shared.id)).title).toBe('共享');
  await expect(bob.instance.load(privateView.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  committed(
    await bob.instance.rename(shared.id, '共同更新', shared.revision, ctx()),
  );
  expect((await alice.instance.load(shared.id)).title).toBe('共同更新');
  const bobIds = (await ids(bob)).reverse();
  const aliceIds = await ids(alice);
  committed(
    await bob.preference.saveOrder(
      definition.id,
      { scopeInstanceIds: bobIds, orderedInstanceIds: bobIds },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  expect(await ids(bob)).toEqual(bobIds);
  expect(await ids(alice)).toEqual(aliceIds);
  const isolated = new MemoryViewHost({
    ...options(),
    serviceKey: 'other-tenant',
  });
  await expect(isolated.instance.load(shared.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
});

it('serializes competing writes and rejects the stale revision inside the lock', async () => {
  const left = new MemoryViewHost(options()),
    right = new MemoryViewHost(options());
  const old = await left.instance.load(instance.id);
  const results = await Promise.all([
    left.instance.save({ ...old, title: 'A' }, ctx()),
    right.instance.save({ ...old, title: 'B' }, ctx()),
  ]);
  expect(results.filter(item => item.outcome === 'committed')).toHaveLength(1);
  expect(results.find(item => item.outcome !== 'committed')).toMatchObject(
    rejected('REVISION_CONFLICT'),
  );
  const winner = results.find(item => item.outcome === 'committed')!;
  expect(await left.instance.load(instance.id)).toEqual(committed(winner));
});

it('replays a create receipt across host reconstruction and refuses request ID payload reuse', async () => {
  const host = new MemoryViewHost(options());
  const input = { ...instance, title: '幂等创建' };
  const first = await host.instance.create(input, {
    requestId: 'stable-request',
  });
  expect(first).toMatchObject({ outcome: 'committed', visibility: 'visible' });
  const replay = await new MemoryViewHost(options()).instance.create(input, {
    requestId: 'stable-request',
  });
  expect(replay).toEqual(first);
  expect(
    (await host.instance.list(definition.id)).items.filter(
      item => item.title === input.title,
    ),
  ).toHaveLength(1);
  await expect(
    host.instance.create(
      { ...input, title: '不同内容' },
      { requestId: 'stable-request' },
    ),
  ).resolves.toMatchObject(rejected('CONFLICT'));
  const bob = committed(
    await new MemoryViewHost(options('bob')).instance.create(input, {
      requestId: 'stable-request',
    }),
  );
  expect(bob.id).not.toBe(committed(first).id);
});

it('publishes revoked permissions without replacing the engine and enforces them on direct writes', async () => {
  let allowed = true;
  const { host: source, paged } = setup();
  const host = new MemoryViewHost({
    ...options(),
    resolveSource: source.resolveSource,
    instancePermissions: () => ({
      save: allowed,
      rename: allowed,
      delete: allowed,
      saveAsPersonal: allowed,
      saveAsShared: allowed,
    }),
    canReorder: () => allowed,
  });
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  engine.setTitle('保留草稿');
  const sessions = engine.getSnapshot().sessions;
  expect(engine.getCapabilitiesSnapshot().instances.mine.permissions.save).toBe(
    true,
  );
  expect(engine.canReorderInstances()).toBe(true);
  const listener = vi.fn();
  engine.subscribe(listener);
  allowed = false;
  host.publishPermissions();
  expect(listener).toHaveBeenCalled();
  expect(engine.getCapabilitiesSnapshot().instances.mine.permissions.save).toBe(
    false,
  );
  expect(engine.canReorderInstances()).toBe(false);
  expect(engine.getSnapshot().sessions).toBe(sessions);
  expect(paged).toHaveBeenCalledTimes(1);
  const current = await host.instance.load(instance.id);
  await expect(host.instance.save(current, ctx())).resolves.toMatchObject(
    rejected('FORBIDDEN'),
  );
  await expect(
    host.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['mine', 'system'],
        orderedInstanceIds: ['system', 'mine'],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('FORBIDDEN'));
  engine.dispose();
  listener.mockClear();
  host.publishPermissions();
  expect(listener).not.toHaveBeenCalled();
});

it('rejects a cancelled create without changing the in-process store', async () => {
  const host = new MemoryViewHost(options());
  await host.instance.list(definition.id);
  const controller = new AbortController();
  controller.abort();
  await expect(
    host.instance.create(
      { ...instance, title: '不能创建' },
      { requestId: 'aborted', signal: controller.signal },
    ),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect((await host.instance.list(definition.id)).items).toHaveLength(2);
  // The cancelled request left no receipt, so its identity is still free.
  expect(
    committed(
      await host.instance.create(
        { ...instance, title: '不能创建' },
        { requestId: 'aborted' },
      ),
    ).title,
  ).toBe('不能创建');
});
