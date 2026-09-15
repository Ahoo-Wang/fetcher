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

import { describe, expect, it } from 'vitest';
import { MemoryViewHost } from '../../src/record/MemoryViewHost.js';
import { definition, instance } from '../engine/fixtures.js';
import type { DashboardViewInstance } from '../../src/dashboard/dashboardModel.js';

const dashboard: DashboardViewInstance = {
  id: 'dashboard',
  definitionId: definition.id,
  title: 'Dashboard',
  scope: { type: 'personal' },
  revision: 'v1',
  kind: 'dashboard',
  config: { schemaVersion: 1, panels: [], filters: [] },
};
function host() {
  return new MemoryViewHost({
    serviceKey: 'service',
    scopeKey: 'alice',
    store: new Map<string, string | null>(),
    definition: { ...definition, dashboard: true as const },
    instances: [instance('a'), dashboard, instance('b')],
    defaultInstanceId: 'dashboard',
    resolveSource: () => ({ paged: async () => ({ total: 0, list: [] }) }),
    definitionPermissions: () => ({
      createPersonal: true,
      createShared: false,
    }),
  });
}
const ids = async (service: MemoryViewHost) =>
  (await service.instance.list(definition.id)).items.map(item => item.id);

describe('dashboard service compatibility', () => {
  it('lists dashboards with records and keeps the stored default across delete and replay', async () => {
    const service = host();
    expect(await ids(service)).toEqual(['a', 'dashboard', 'b']);
    expect(await service.preference.load(definition.id)).toMatchObject({
      revision: null,
      defaultInstanceId: 'dashboard',
      effectiveDefaultInstanceId: 'dashboard',
    });
    const a = (await service.instance.list(definition.id)).items[0];
    const deleted = await service.instance.delete(a.id, a.revision, {
      requestId: 'delete-a',
    });
    expect(deleted).toEqual({
      outcome: 'committed',
      visibility: 'visible',
      value: { id: 'a', revision: expect.any(String) },
      revision: expect.any(String),
    });
    if (deleted.outcome !== 'committed') throw new Error('committed');
    expect(deleted.revision).toBe(deleted.value.revision);
    expect(
      await service.instance.delete(a.id, a.revision, {
        requestId: 'delete-a',
      }),
    ).toEqual(deleted);
    expect(
      await service.instance.delete(a.id, a.revision, {
        requestId: 'delete-a-again',
      }),
    ).toMatchObject({ outcome: 'rejected', issue: { code: 'NOT_FOUND' } });
    await expect(
      service.instance.delete(
        a.id,
        a.revision,
        undefined as unknown as { requestId: string },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    expect(await ids(service)).toEqual(['dashboard', 'b']);
    expect(await service.preference.load(definition.id)).toMatchObject({
      defaultInstanceId: 'dashboard',
      effectiveDefaultInstanceId: 'dashboard',
    });
    expect(await service.instance.load('dashboard')).toMatchObject({
      kind: 'dashboard',
    });
  });
  it('reorders scoped slots around fixed ones and rejects stale writes to dashboards', async () => {
    const service = host();
    const ordered = await service.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: ['a', 'dashboard', 'b'],
        orderedInstanceIds: ['b', 'dashboard', 'a'],
      },
      { type: 'absent' },
      { requestId: 'order-1' },
    );
    expect(ordered).toMatchObject({
      outcome: 'committed',
      value: { order: ['b', 'dashboard', 'a'] },
    });
    if (ordered.outcome !== 'committed') throw new Error('committed');
    expect(await ids(service)).toEqual(['b', 'dashboard', 'a']);
    // Only the scoped slots move; the dashboard keeps its position.
    expect(
      await service.preference.saveOrder(
        definition.id,
        { scopeInstanceIds: ['b', 'a'], orderedInstanceIds: ['a', 'b'] },
        { type: 'matches', revision: ordered.revision },
        { requestId: 'order-2' },
      ),
    ).toMatchObject({
      outcome: 'committed',
      value: { order: ['a', 'dashboard', 'b'] },
    });
    expect(await ids(service)).toEqual(['a', 'dashboard', 'b']);
    const saved = await service.instance.load('dashboard');
    expect(
      await service.instance.save(
        { ...saved, title: 'Changed', revision: 'stale' },
        { requestId: 'stale-save' },
      ),
    ).toMatchObject({
      outcome: 'rejected',
      issue: { code: 'REVISION_CONFLICT' },
    });
    expect((await service.instance.load('dashboard')).title).toBe('Dashboard');
  });
  it('requires definition creation grants and replays exact dashboard create receipts', async () => {
    const service = host();
    const input = { ...dashboard, title: 'Created' };
    const created = await service.instance.create(input, {
      requestId: 'once',
    });
    expect(created).toMatchObject({
      outcome: 'committed',
      value: { kind: 'dashboard', title: 'Created' },
    });
    expect(await service.instance.create(input, { requestId: 'once' })).toEqual(
      created,
    );
    expect(
      await service.instance.create(
        { ...input, scope: { type: 'public', source: 'shared' } },
        { requestId: 'shared' },
      ),
    ).toMatchObject({ outcome: 'rejected', issue: { code: 'FORBIDDEN' } });
  });
});
