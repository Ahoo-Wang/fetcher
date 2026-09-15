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

import { expect, it } from 'vitest';
import { MemoryViewHost } from '../src/record/MemoryViewHost.js';
import type { ViewInstancePermissions } from '../src/contracts/viewModel.js';
import { definition, instance, setup } from './fixtures/viewPage.js';

function host(
  store: Map<string, string | null>,
  scopeKey = 'developer',
  options: {
    instancePermissions?: () => ViewInstancePermissions;
    canReorder?: () => boolean;
    revision?: string;
  } = {},
) {
  return new MemoryViewHost({
    store,
    scopeKey,
    serviceKey: 'guards',
    definition: options.revision
      ? { ...definition, revision: options.revision }
      : definition,
    instances: [instance],
    defaultInstanceId: instance.id,
    resolveSource: setup().host.resolveSource,
    instancePermissions: options.instancePermissions,
    canReorder: options.canReorder,
  });
}

it.each(['constructor', 'toString', '__proto__'])(
  'keeps preferences per user for the prototype-like scope key %s',
  async scopeKey => {
    const store = new Map<string, string | null>();
    const service = host(store, scopeKey);
    expect(await service.preference.load(definition.id)).toMatchObject({
      revision: null,
      defaultInstanceId: instance.id,
      effectiveDefaultInstanceId: instance.id,
    });
    const written = await service.preference.saveDefault(
      definition.id,
      null,
      { type: 'absent' },
      { requestId: 'first' },
    );
    expect(written).toMatchObject({ outcome: 'committed' });
    const reloaded = await host(store, scopeKey).preference.load(definition.id);
    expect(reloaded).toMatchObject({ defaultInstanceId: null });
    expect(reloaded.revision).not.toBeNull();
    expect(
      await host(store, 'someone-else').preference.load(definition.id),
    ).toMatchObject({ revision: null, defaultInstanceId: instance.id });
  },
);

it('re-checks the current grants before replaying a stored receipt', async () => {
  const store = new Map<string, string | null>();
  const writer = host(store);
  const created = await writer.instance.create(
    { ...instance, title: 'Mine' },
    { requestId: 'create-1' },
  );
  expect(created).toMatchObject({ outcome: 'committed' });
  const revoked = host(store, 'developer', {
    instancePermissions: () => ({
      save: false,
      saveAsPersonal: false,
      saveAsShared: false,
      rename: false,
      delete: false,
    }),
    canReorder: () => false,
  });
  await expect(
    revoked.instance.create(
      { ...instance, title: 'Mine' },
      { requestId: 'create-1' },
    ),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'FORBIDDEN' },
  });
  const ordered = await writer.preference.saveOrder(
    definition.id,
    { scopeInstanceIds: [instance.id], orderedInstanceIds: [instance.id] },
    { type: 'absent' },
    { requestId: 'order-1' },
  );
  expect(ordered).toMatchObject({ outcome: 'committed' });
  await expect(
    revoked.preference.saveOrder(
      definition.id,
      { scopeInstanceIds: [instance.id], orderedInstanceIds: [instance.id] },
      { type: 'absent' },
      { requestId: 'order-1' },
    ),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'FORBIDDEN' },
  });
  await expect(
    writer.preference.saveOrder(
      definition.id,
      { scopeInstanceIds: [instance.id], orderedInstanceIds: [instance.id] },
      { type: 'absent' },
      { requestId: 'order-1' },
    ),
  ).resolves.toEqual(ordered);
});

it('treats the definition revision as part of a configuration write identity', async () => {
  const store = new Map<string, string | null>();
  const service = host(store, 'developer', { revision: 'd1' });
  const loaded = await service.instance.load(instance.id);
  const saved = await service.instance.save(loaded, {
    requestId: 'save-1',
    definitionRevision: 'd1',
  });
  expect(saved).toMatchObject({ outcome: 'committed' });
  await expect(
    service.instance.save(loaded, {
      requestId: 'save-1',
      definitionRevision: 'd1',
    }),
  ).resolves.toEqual(saved);
  await expect(
    service.instance.save(loaded, { requestId: 'save-1' }),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'CONFLICT' },
  });
});

it('expires catalog cursors when the catalog membership changes', async () => {
  const store = new Map<string, string | null>();
  const service = host(store);
  await service.instance.create(
    { ...instance, title: 'Second' },
    { requestId: 'c-2' },
  );
  await service.instance.create(
    { ...instance, title: 'Third' },
    { requestId: 'c-3' },
  );
  const first = await service.instance.list(definition.id, { limit: 1 });
  expect(first.nextCursor).not.toBeNull();
  const loaded = await service.instance.load(first.items[0].id);
  await service.instance.delete(loaded.id, loaded.revision, {
    requestId: 'd-1',
  });
  await expect(
    service.instance.list(definition.id, {
      limit: 1,
      cursor: first.nextCursor,
    }),
  ).rejects.toMatchObject({ code: 'CURSOR_EXPIRED' });
  const fresh = await service.instance.list(definition.id, { limit: 1 });
  expect(fresh.total).toBe(2);
});

it('reports a receipt whose value does not fit its action as corrupt storage', async () => {
  const store = new Map<string, string | null>();
  const service = host(store);
  await service.instance.load(instance.id);
  const raw = JSON.parse(store.get(service.storageKey)!) as {
    receipts: Record<string, unknown>;
  };
  raw.receipts['["developer","instance","forged"]'] = {
    resource: 'instance',
    action: 'save',
    targetId: instance.id,
    input: {},
    observation: {
      outcome: 'committed',
      value: null,
      revision: 'x',
      visibility: 'visible',
    },
  };
  store.set(service.storageKey, JSON.stringify(raw));
  await expect(service.instance.load(instance.id)).rejects.toMatchObject({
    code: 'CORRUPT_STATE',
  });
});
