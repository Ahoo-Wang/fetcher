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

// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { ViewEngine } from '../../src/engine/ViewEngine.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import { MemoryViewHost } from '../../src/record/MemoryViewHost.js';
import {
  ABSENT_PRECONDITION,
  preconditionFor,
  ViewServiceError,
  type WriteObservation,
} from '../../src/contracts/viewServiceContract.js';
import { HttpViewHost, VIEW_SERVICE_STATUS } from '../../dev/http/index.js';
import { startViewService } from '../../scripts/fixtures/view-service-server.mjs';
import { definition, instance } from '../engine/fixtures.js';
import type { DashboardViewInstance } from '../../src/dashboard/dashboardModel.js';

function committed<T>(observation: WriteObservation<T>): T {
  if (observation.outcome !== 'committed')
    throw new Error(`写入未提交：${JSON.stringify(observation)}`);
  return observation.value;
}

it('serves dashboard instances over real HTTP list, order, single and deletion receipts', async () => {
  const dashboard: DashboardViewInstance = {
    id: 'dashboard',
    definitionId: definition.id,
    title: 'Dashboard',
    scope: { type: 'personal' },
    revision: 'v1',
    kind: 'dashboard',
    config: { schemaVersion: 1, panels: [], filters: [] },
  };
  const source = { paged: async () => ({ list: [], total: 0 }) };
  const server = await startViewService({
    Host: MemoryViewHost,
    ServiceError: ViewServiceError,
    statuses: VIEW_SERVICE_STATUS,
    definition: { ...definition, dashboard: true },
    instances: [instance('a'), dashboard, instance('b')],
    defaultInstanceId: 'dashboard',
    source,
  });
  try {
    const host = new HttpViewHost({
      baseUrl: server.baseUrl,
      definitionId: definition.id,
      headers: () => ({ Authorization: 'Bearer alice-token' }),
      resolveSource: () => source,
    });
    const ids = async () =>
      (await host.instance.list(definition.id)).items.map(item => item.id);
    expect(await host.preference.load(definition.id)).toEqual({
      revision: null,
      order: [],
      defaultInstanceId: 'dashboard',
      effectiveDefaultInstanceId: 'dashboard',
    });
    expect(await ids()).toEqual(['a', 'dashboard', 'b']);
    expect(
      (await host.instance.list(definition.id)).items.find(
        item => item.id === 'dashboard',
      ),
    ).toEqual({
      id: 'dashboard',
      definitionId: definition.id,
      kind: 'dashboard',
      title: 'Dashboard',
      scope: { type: 'personal' },
      revision: expect.any(String),
    });
    const persisted = committed(
      await host.preference.saveDefault(
        definition.id,
        'dashboard',
        ABSENT_PRECONDITION,
        { requestId: 'default' },
      ),
    );
    const ordered = committed(
      await host.preference.saveOrder(
        definition.id,
        { scopeInstanceIds: ['a', 'b'], orderedInstanceIds: ['b', 'a'] },
        preconditionFor(persisted.revision),
        { requestId: 'order' },
      ),
    );
    // Without an explicit order yet, the change applies to the visible order; the unscoped
    // dashboard keeps its slot.
    expect(ordered).toMatchObject({
      order: ['b', 'dashboard', 'a'],
      defaultInstanceId: 'dashboard',
    });
    expect(await ids()).toEqual(['b', 'dashboard', 'a']);
    const a = await host.instance.load('a');
    const deleted = await host.instance.delete('a', a.revision, {
      requestId: 'delete-a',
    });
    expect(deleted).toMatchObject({
      outcome: 'committed',
      value: { id: 'a', revision: expect.any(String) },
    });
    expect(await ids()).toEqual(['b', 'dashboard']);
    expect(await host.preference.load(definition.id)).toMatchObject({
      revision: ordered.revision,
      order: ['b', 'dashboard', 'a'],
      effectiveDefaultInstanceId: 'dashboard',
    });
    // Replaying the delete returns its receipt; a new attempt is a definite NOT_FOUND.
    expect(
      await host.instance.delete('a', a.revision, { requestId: 'delete-a' }),
    ).toEqual(deleted);
    await expect(
      host.instance.delete('a', a.revision, { requestId: 'delete-again' }),
    ).resolves.toMatchObject({
      outcome: 'rejected',
      issue: { code: 'NOT_FOUND' },
    });
    const saved = await host.instance.load('dashboard');
    expect(saved.kind).toBe('dashboard');
    expect(
      committed(
        await host.instance.rename(saved.id, 'New name', saved.revision, {
          requestId: 'rename',
        }),
      ),
    ).toMatchObject({ title: 'New name', kind: 'dashboard' });
  } finally {
    await server.close();
  }
});

it('composes definition-scoped HTTP clients for cross-definition dashboards without mixing permissions or writes', async () => {
  const root = {
    id: 'overview',
    title: 'Overview',
    fields: [],
    dashboard: true as const,
  };
  const dashboard: DashboardViewInstance = {
    id: 'dashboard',
    definitionId: root.id,
    title: 'Dashboard',
    kind: 'dashboard',
    scope: { type: 'personal' },
    revision: 'r1',
    config: {
      schemaVersion: 1,
      panels: [
        {
          kind: 'view',
          id: 'orders',
          instanceId: 'saved-orders',
          layout: { x: 0, y: 0, w: 12, h: 18 },
        },
      ],
      filters: [],
    },
  };
  const source = {
    paged: vi.fn(async () => ({
      total: 1,
      list: [{ state: { id: 'one', amount: 42 } }],
    })),
  };
  const servers = await Promise.all([
    startViewService({
      Host: MemoryViewHost,
      ServiceError: ViewServiceError,
      statuses: VIEW_SERVICE_STATUS,
      definition: root,
      instances: [dashboard],
      defaultInstanceId: dashboard.id,
      source,
    }),
    startViewService({
      Host: MemoryViewHost,
      ServiceError: ViewServiceError,
      statuses: VIEW_SERVICE_STATUS,
      definition,
      instances: [instance('saved-orders')],
      defaultInstanceId: 'saved-orders',
      source,
    }),
  ]);
  let engine: ViewEngine | undefined;
  try {
    servers[0].setWriter('alice-token', false);
    servers[1].setWriter('alice-token', false);
    servers[1].setWriter('alice-token', true);
    const clients = servers.map(
      (server, index) =>
        new HttpViewHost({
          baseUrl: server.baseUrl,
          definitionId: index === 0 ? root.id : definition.id,
          headers: () => ({ Authorization: 'Bearer alice-token' }),
          resolveSource: () => source,
        }),
    );
    const [overview, orders] = clients;
    await expect(overview.instance.load('saved-orders')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(overview.definition.load(definition.id)).rejects.toMatchObject(
      { code: 'NOT_FOUND' },
    );
    const definitions = new Map([
      [root.id, overview],
      [definition.id, orders],
    ]);
    const owners = new Map([
      [dashboard.id, overview],
      ['saved-orders', orders],
    ]);
    const clientFor = (registry: Map<string, HttpViewHost>, id: string) => {
      const client = registry.get(id);
      if (!client)
        throw new ViewServiceError('NOT_FOUND', 'Resource not registered');
      return client;
    };
    const host: ViewHost = {
      definition: {
        load: (id, options) =>
          clientFor(definitions, id).definition.load(id, options),
      },
      instance: {
        list: overview.instance.list,
        load: (id, options) => clientFor(owners, id).instance.load(id, options),
        create: overview.instance.create,
        save: overview.instance.save,
        rename: overview.instance.rename,
        delete: overview.instance.delete,
      },
      permission: overview.permission,
      preference: overview.preference,
      operation: overview.operation,
      resolveSource: overview.resolveSource,
    };
    engine = new ViewEngine({ definitionId: root.id, host });
    await engine.load();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'ready',
      selectedInstanceId: dashboard.id,
      preference: { status: 'ready', revision: null },
    });
    const runtime = engine.dashboard(dashboard.id);
    await vi.waitFor(() =>
      expect(
        runtime.getSnapshot().panels.orders.position?.getSnapshot().queryStatus,
      ).toBe('success'),
    );
    expect(runtime.getSnapshot().panels.orders.definition?.id).toBe(
      definition.id,
    );
    expect(orders.permission.getDefinition().createShared).toBe(true);
    expect(engine.getCapabilitiesSnapshot().createShared).toBe(false);
    engine.setTitle('Updated overview', dashboard.id);
    await engine.save(dashboard.id);
    expect(servers[0].control.mutations).toBe(1);
    expect(servers[1].control.mutations).toBe(0);
    expect(source.paged).toHaveBeenCalledTimes(1);
    expect((await overview.instance.load(dashboard.id)).title).toBe(
      'Updated overview',
    );
  } finally {
    engine?.dispose();
    await Promise.all(servers.map(server => server.close()));
  }
});
