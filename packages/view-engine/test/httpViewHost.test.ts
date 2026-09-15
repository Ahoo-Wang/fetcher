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
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { setTimeout as delay } from 'node:timers/promises';
import {
  MemoryViewHost,
  ViewEngine,
  ViewServiceError,
  summaryOf,
} from '@ahoo-wang/fetcher-view-engine';
import {
  HttpViewHost,
  HttpViewTransport,
  HttpViewInstanceService,
  VIEW_SERVICE_STATUS,
} from '../dev/http/index.js';
import {
  ABSENT_PRECONDITION,
  preconditionFor,
  type ViewServiceErrorCode,
  type WriteObservation,
} from '../src/contracts/viewServiceContract.js';

import { startViewService } from '../scripts/fixtures/view-service-server.mjs';
import { definition, instance, setup } from './fixtures/viewPage.js';

let server: Awaited<ReturnType<typeof startViewService>>;
beforeEach(async () => {
  server = await startViewService({
    Host: MemoryViewHost,
    ServiceError: ViewServiceError,
    statuses: VIEW_SERVICE_STATUS,
    definition,
    instances: [instance],
    defaultInstanceId: instance.id,
    source: setup().host.resolveSource('orders'),
  });
});
afterEach(async () => {
  await server.close();
});
function client(token = 'alice-token', timeoutMs = 1000) {
  return new HttpViewHost({
    baseUrl: server.baseUrl,
    definitionId: definition.id,
    headers: () => ({ Authorization: `Bearer ${token}` }),
    timeoutMs,
    resolveSource: setup().host.resolveSource,
  });
}
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
const ids = async (host: { instance: HttpViewInstanceService }) =>
  (await host.instance.list(definition.id)).items.map(item => item.id);

it('deletes through the engine with a receipt that only proves the deletion, after another client reorders views', async () => {
  const host = client();
  const other = client();
  const first = committed(
    await other.instance.create(
      { ...instance, title: 'First' },
      { requestId: 'first' },
    ),
  );
  const second = committed(
    await other.instance.create(
      { ...instance, title: 'Second' },
      { requestId: 'second' },
    ),
  );
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    defaultInstanceId: instance.id,
    selectedInstanceId: instance.id,
    instanceIds: [instance.id, first.id, second.id],
  });
  const revision = engine.getSnapshot().sessions[instance.id].baseline.revision;
  committed(
    await other.preference.saveOrder(
      definition.id,
      {
        scopeInstanceIds: [instance.id, second.id, first.id],
        orderedInstanceIds: [instance.id, second.id, first.id],
      },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  await engine.deleteInstance(instance.id);
  // The engine keeps its loaded order and never derives a fallback default.
  expect(engine.getSnapshot()).toMatchObject({
    defaultInstanceId: null,
    selectedInstanceId: first.id,
    instanceIds: [first.id, second.id],
  });
  await expect(
    host.instance.delete(instance.id, revision, { requestId: 'again' }),
  ).resolves.toMatchObject(rejected('NOT_FOUND'));
  expect(await ids(other)).toEqual([second.id, first.id]);
  expect(await other.preference.load(definition.id)).toMatchObject({
    effectiveDefaultInstanceId: null,
    order: [instance.id, second.id, first.id],
  });
  engine.dispose();
});
it('allows only the configured browser origin before preflight or writes', async () => {
  const endpoint = `${server.baseUrl}definitions/${definition.id}/instances`;
  for (const method of ['OPTIONS', 'POST']) {
    const rejected = await fetch(endpoint, {
      method,
      headers: {
        Origin: 'https://untrusted.example',
        Authorization: 'Bearer alice-token',
      },
    });
    expect(rejected.status).toBe(403);
    expect(rejected.headers.has('Access-Control-Allow-Origin')).toBe(false);
  }
  expect(server.control.mutations).toBe(0);
  const allowed = await fetch(endpoint, {
    method: 'OPTIONS',
    headers: { Origin: 'http://127.0.0.1:6006' },
  });
  expect(allowed.status).toBe(204);
  expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe(
    'http://127.0.0.1:6006',
  );
  expect(allowed.headers.get('Access-Control-Allow-Headers')).toContain(
    'idempotency-key',
  );
  expect(allowed.headers.get('Vary')).toBe('Origin');
  // Node service clients do not send a browser Origin header.
  expect((await client().instance.list(definition.id)).items).toHaveLength(1);
});
it('executes JSON writes over HTTP with shared visibility, private isolation and typed errors', async () => {
  const alice = client(),
    bob = client('bob-token');
  const shared = committed(
    await alice.instance.create(
      {
        ...instance,
        title: '公共',
        scope: { type: 'public', source: 'shared' },
      },
      { requestId: 'shared' },
    ),
  );
  expect((await bob.instance.load(shared.id)).title).toBe('公共');
  await expect(
    bob.instance.rename(shared.id, '越权', shared.revision, ctx()),
  ).resolves.toMatchObject(rejected('FORBIDDEN'));
  const privateView = committed(
    await alice.instance.create(
      { ...instance, title: '私人' },
      { requestId: 'private' },
    ),
  );
  await expect(bob.instance.load(privateView.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  await expect(
    client('outsider-token').instance.load(shared.id),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(
    client('invalid-token').instance.list(definition.id),
  ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  const renamed = committed(
    await alice.instance.rename(shared.id, '新名称', shared.revision, ctx()),
  );
  await expect(alice.instance.save(shared, ctx())).resolves.toMatchObject(
    rejected('REVISION_CONFLICT'),
  );
  expect(
    await alice.instance.delete(renamed.id, renamed.revision, ctx()),
  ).toMatchObject({
    outcome: 'committed',
    value: { id: renamed.id, revision: expect.any(String) },
  });
  await expect(bob.instance.load(renamed.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
});
it('does not trust posted ownership, and stores each users order independently', async () => {
  const alice = client(),
    bob = client('bob-token');
  const privateView = committed(
    await alice.instance.create(
      { ...instance, ownerKey: 'bob' } as typeof instance,
      { requestId: 'owner-forgery' },
    ),
  );
  await expect(bob.instance.load(privateView.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  const shared = committed(
    await alice.instance.create(
      { ...instance, scope: { type: 'public', source: 'shared' } },
      { requestId: 'public' },
    ),
  );
  const before = await ids(alice);
  const order = (await ids(bob)).reverse();
  committed(
    await bob.preference.saveOrder(
      definition.id,
      { scopeInstanceIds: order, orderedInstanceIds: order },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  expect(await ids(bob)).toEqual(order);
  expect(await ids(alice)).toEqual(before);
  expect(order).toContain(shared.id);
});
it('round trips a private default preference over HTTP', async () => {
  const alice = client();
  const bob = client('bob-token');
  const cleared = committed(
    await alice.preference.saveDefault(
      definition.id,
      null,
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  expect(await client().preference.load(definition.id)).toEqual({
    revision: cleared.revision,
    order: [],
    defaultInstanceId: null,
    effectiveDefaultInstanceId: null,
  });
  expect(await bob.preference.load(definition.id)).toMatchObject({
    revision: null,
    defaultInstanceId: instance.id,
    effectiveDefaultInstanceId: instance.id,
  });
  const restored = committed(
    await alice.preference.saveDefault(
      definition.id,
      instance.id,
      preconditionFor(cleared.revision),
      ctx(),
    ),
  );
  expect(
    (await client().preference.load(definition.id)).effectiveDefaultInstanceId,
  ).toBe(instance.id);
  const shared = committed(
    await alice.instance.create(
      { ...instance, scope: { type: 'public', source: 'shared' } },
      { requestId: 'shared-default' },
    ),
  );
  expect(
    bob.permission.getInstance(summaryOf(await bob.instance.load(shared.id)))
      .save,
  ).toBe(false);
  committed(
    await bob.preference.saveDefault(
      definition.id,
      shared.id,
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  expect((await bob.preference.load(definition.id)).defaultInstanceId).toBe(
    shared.id,
  );
  await expect(
    alice.preference.saveDefault(
      definition.id,
      'unknown',
      preconditionFor(restored.revision),
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('NOT_FOUND'));
  await expect(
    alice.preference.saveDefault(
      definition.id,
      instance.id,
      ABSENT_PRECONDITION,
      ctx(),
    ),
  ).resolves.toMatchObject(rejected('REVISION_CONFLICT'));
});
it('retries a response-lost create through the real engine with the same idempotency key', async () => {
  const host = client();
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  const request = { title: '只创建一次', scope: { type: 'personal' } as const };
  server.control.dropNextCreateResponse = true;
  await expect(engine.saveAs(request)).rejects.toMatchObject({
    code: 'UNKNOWN_OUTCOME',
  });
  expect(engine.getSnapshot().sessions[instance.id]).toMatchObject({
    requiresReload: true,
    writeStatus: 'idle',
  });
  expect(
    (await host.instance.list(definition.id)).items.filter(
      item => item.title === request.title,
    ),
  ).toHaveLength(1);
  await expect(
    engine.saveAs({ ...request, title: '先不能改请求' }),
  ).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
  await engine.saveAs(request);
  expect(
    (await host.instance.list(definition.id)).items.filter(
      item => item.title === request.title,
    ),
  ).toHaveLength(1);
  expect(
    engine.getSnapshot().sessions[engine.getSnapshot().selectedInstanceId!]
      .instance.title,
  ).toBe(request.title);
  engine.dispose();
});
it('reconciles an unknown create by reload and then allows a distinct create', async () => {
  const host = client();
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  server.control.dropNextCreateResponse = true;
  await expect(
    engine.saveAs({ title: '待核对副本', scope: { type: 'personal' } }),
  ).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
  await engine.reloadInstance();
  const selected = engine.getSnapshot().selectedInstanceId!;
  expect(engine.getSnapshot().sessions[selected].instance.title).toBe(
    '待核对副本',
  );
  await engine.saveAs({ title: '下一次创建', scope: { type: 'personal' } });
  expect((await host.instance.list(definition.id)).items).toHaveLength(3);
  engine.dispose();
});
it.each(['save', 'rename', 'delete'] as const)(
  'blocks writes and retains edits after losing a committed %s response',
  async operation => {
    const method = { save: 'PUT', rename: 'PATCH', delete: 'DELETE' }[
      operation
    ];
    let dropResponse = true;
    const host = new HttpViewHost({
      baseUrl: server.baseUrl,
      definitionId: definition.id,
      headers: () => ({ Authorization: 'Bearer alice-token' }),
      resolveSource: setup().host.resolveSource,
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        if (dropResponse && init?.method === method) {
          dropResponse = false;
          await response.body?.cancel();
          throw new TypeError('Connection lost after the service committed');
        }
        return response;
      },
    });
    const engine = new ViewEngine({ definitionId: definition.id, host });
    try {
      await engine.load();
      engine.setTitle('本地编辑');
      const session = () => engine.getSnapshot().sessions[instance.id];
      const revision = session().baseline.revision;
      await expect(
        operation === 'save'
          ? engine.save()
          : operation === 'rename'
            ? engine.renameInstance('服务端名称')
            : engine.deleteInstance(),
      ).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
      expect(session()).toMatchObject({
        requiresReload: true,
        writeStatus: 'idle',
        instance: { title: '本地编辑' },
        baseline: { revision },
      });
      const mutations = server.control.mutations;
      await expect(engine.save()).rejects.toThrow('核对');
      await expect(engine.renameInstance('不能写入')).rejects.toThrow('核对');
      await expect(
        engine.saveAs({ title: '不能另存', scope: { type: 'personal' } }),
      ).rejects.toThrow('核对');
      expect(server.control.mutations).toBe(mutations);
      if (operation === 'delete') {
        // The retry reuses the original request identity and receives the stored receipt.
        await engine.deleteInstance();
        expect(session()).toBeUndefined();
        expect((await client().instance.list(definition.id)).items).toEqual([]);
      } else {
        await expect(engine.deleteInstance()).rejects.toThrow('核对');
        await engine.reloadInstance();
        expect(session().requiresReload).toBe(false);
        if (operation === 'rename')
          expect(session().conflict?.remote.revision).not.toBe(revision);
        else expect(session().baseline.revision).not.toBe(revision);
        expect(session().instance.title).toBe('本地编辑');
        engine.setTitle('核对后的编辑');
        if (session().conflict)
          await engine.overwriteInstance(session().conflict!);
        else await engine.save();
        expect((await client().instance.load(instance.id)).title).toBe(
          '核对后的编辑',
        );
      }
    } finally {
      engine.dispose();
    }
  },
);
it('forwards cancellation and distinguishes read timeout from an unknown write outcome', async () => {
  const host = client('alice-token', 50);
  server.control.delayNextRead = 200;
  await expect(host.instance.list(definition.id)).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
  await delay(30);
  expect(server.control.abortedReads).toBe(1);
  server.control.delayNextRead = 200;
  const controller = new AbortController();
  const pending = host.instance.list(definition.id, {
    signal: controller.signal,
  });
  const assertion = expect(pending).rejects.toMatchObject({
    name: 'AbortError',
  });
  await delay(10);
  controller.abort();
  await assertion;
  await delay(30);
  expect(server.control.abortedReads).toBe(2);
});
it('updates permission subscribers and prevents a delayed old snapshot from restoring revoked grants', async () => {
  const host = client();
  const shared = committed(
    await host.instance.create(
      { ...instance, scope: { type: 'public', source: 'shared' } },
      { requestId: 'shared' },
    ),
  );
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  expect(
    engine.getCapabilitiesSnapshot().instances[shared.id].permissions.save,
  ).toBe(true);
  const sessions = engine.getSnapshot().sessions;
  server.control.delayNextPermissionResponse = 300;
  const oldPermissions = host.permission.refresh();
  await vi.waitFor(() =>
    expect(server.control.delayedPermissionResponses).toBe(1),
  );
  server.setWriter('alice-token', false);
  await host.permission.refresh();
  await oldPermissions;
  expect(
    engine.getCapabilitiesSnapshot().instances[shared.id].permissions.save,
  ).toBe(false);
  expect(engine.getSnapshot().sessions).toBe(sessions);
  await expect(host.instance.save(shared, ctx())).resolves.toMatchObject(
    rejected('FORBIDDEN'),
  );
  engine.dispose();
});

it('keeps one create after timeout or cancellation after the server commit', async () => {
  const host = client('alice-token', 70);
  server.control.delayNextCreateResponse = 300;
  const input = { ...instance, title: '超时创建' };
  await expect(
    host.instance.create(input, { requestId: 'timeout' }),
  ).resolves.toMatchObject({
    outcome: 'unknown',
    issue: { code: 'UNKNOWN_OUTCOME' },
  });
  const result = committed(
    await host.instance.create(input, { requestId: 'timeout' }),
  );
  expect(
    (await host.instance.list(definition.id)).items.filter(
      item => item.id === result.id,
    ),
  ).toHaveLength(1);
  const normal = client();
  const controller = new AbortController();
  server.control.delayNextCreateResponse = 300;
  const pending = normal.instance.create(
    { ...input, title: '取消响应' },
    { requestId: 'canceled', signal: controller.signal },
  );
  // Cancellation is the caller's own signal: the promise rejects instead of observing an outcome.
  const assertion = expect(pending).rejects.toMatchObject({
    name: 'AbortError',
  });
  await vi.waitFor(() => expect(server.control.delayedCreateResponses).toBe(2));
  controller.abort();
  await assertion;
  committed(
    await normal.instance.create(
      { ...input, title: '取消响应' },
      { requestId: 'canceled' },
    ),
  );
  expect(
    (await normal.instance.list(definition.id)).items.filter(
      item => item.title === '取消响应',
    ),
  ).toHaveLength(1);
});
it('performs competing HTTP writes with one authoritative winner', async () => {
  const left = client(),
    right = client();
  const old = await left.instance.load(instance.id);
  const results = await Promise.all([
    left.instance.save({ ...old, title: 'first' }, ctx()),
    right.instance.save({ ...old, title: 'second' }, ctx()),
  ]);
  expect(results.filter(item => item.outcome === 'committed')).toHaveLength(1);
  expect(results.find(item => item.outcome !== 'committed')).toMatchObject(
    rejected('REVISION_CONFLICT'),
  );
});

it.each(['json', 'text', 'null'] as const)(
  'clears grants on %s session rejection and ignores older permission replies',
  async format => {
    let token = 'alice-token';
    const host = new HttpViewHost({
      baseUrl: server.baseUrl,
      definitionId: definition.id,
      headers: () => ({ Authorization: `Bearer ${token}` }),
      resolveSource: setup().host.resolveSource,
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        if (response.status !== 401 || format === 'json') return response;
        await response.body?.cancel();
        return new Response(format === 'text' ? 'Session expired' : 'null', {
          status: 401,
        });
      },
    });
    const current = summaryOf(await host.instance.load(instance.id));
    expect(host.permission.getInstance(current).save).toBe(true);
    server.control.delayNextPermissionResponse = 300;
    const old = host.permission.refresh();
    await vi.waitFor(() =>
      expect(server.control.delayedPermissionResponses).toBe(1),
    );
    token = 'expired';
    const failure = await host.permission.refresh().catch(error => error);
    const revoked = host.permission.getInstance(current).save;
    await old;
    expect(revoked).toBe(false);
    expect(host.permission.getInstance(current).save).toBe(false);
    expect(failure).toMatchObject({ code: 'UNAUTHENTICATED' });
    // A write during the expired session is a definite rejection, not an unknown outcome.
    await expect(
      host.instance.rename(current.id, '过期会话', current.revision, ctx()),
    ).resolves.toMatchObject(rejected('UNAUTHENTICATED'));
    token = 'alice-token';
    await host.permission.refresh();
    expect(host.permission.getInstance(current).save).toBe(true);
  },
);

it('returns stable protocol errors for malformed inputs and missing preconditions', async () => {
  const headers = {
    Authorization: 'Bearer alice-token',
    'Content-Type': 'application/json',
    'Idempotency-Key': 'invalid',
  };
  const response = await fetch(
    `${server.baseUrl}definitions/${definition.id}/instances`,
    { method: 'POST', headers, body: 'null' },
  );
  expect(response.status).toBe(400);
  expect((await response.json()).error.code).toBe('INVALID_ARGUMENT');
  const missing = await fetch(
    `${server.baseUrl}definitions/${definition.id}/instances/${instance.id}`,
    { method: 'DELETE', headers },
  );
  expect(missing.status).toBe(428);
  expect((await missing.json()).error.code).toBe('PRECONDITION_REQUIRED');
  const unidentified = await fetch(
    `${server.baseUrl}definitions/${definition.id}/instances/${instance.id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: headers.Authorization,
        'If-Match': JSON.stringify('r1'),
      },
    },
  );
  expect(unidentified.status).toBe(400);
  expect((await unidentified.json()).error.code).toBe('INVALID_ARGUMENT');

  const endpoint = `${server.baseUrl}definitions/${definition.id}/preferences/default`;
  for (const [body, status, code] of [
    ['{}', 400, 'INVALID_ARGUMENT'],
    ['{"instanceId":1}', 400, 'INVALID_ARGUMENT'],
    [JSON.stringify({ instanceId: instance.id }), 428, 'PRECONDITION_REQUIRED'],
    [
      JSON.stringify({
        instanceId: instance.id,
        precondition: { type: 'matches', revision: 'p0' },
      }),
      412,
      'REVISION_CONFLICT',
    ],
  ] as const) {
    const invalid = await fetch(endpoint, { method: 'PUT', headers, body });
    expect(invalid.status).toBe(status);
    const envelope = await invalid.json();
    expect(envelope.error.code).toBe(code);
    expect(envelope.data).toMatchObject({
      outcome: 'rejected',
      issue: { code },
    });
  }
  expect((await client().preference.load(definition.id)).revision).toBeNull();

  const bobPrivate = committed(
    await client('bob-token').instance.create(
      { ...instance, title: 'Bob private' },
      { requestId: 'bob-private-default' },
    ),
  );
  for (const [token, instanceId, status, code] of [
    ['alice-token', bobPrivate.id, 404, 'NOT_FOUND'],
    ['invalid-token', instance.id, 401, 'UNAUTHENTICATED'],
  ] as const) {
    const rejected = await fetch(endpoint, {
      method: 'PUT',
      headers: { ...headers, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        instanceId,
        precondition: { type: 'absent' },
      }),
    });
    expect(rejected.status).toBe(status);
    expect((await rejected.json()).error.code).toBe(code);
  }
  expect((await client().preference.load(definition.id)).revision).toBeNull();
  expect(await ids(client())).toEqual([instance.id]);
});

it('composes independently supplied definition, instance and policy services', async () => {
  const remote = client();
  const loadDefinition = vi.fn(async () => structuredClone(definition));
  const localSource = setup().host.resolveSource;
  const host = {
    definition: { load: loadDefinition },
    instance: remote.instance,
    preference: remote.preference,
    permission: remote.permission,
    operation: remote.operation,
    resolveSource: localSource,
  };
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  expect(loadDefinition).toHaveBeenCalledOnce();
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    catalog: { status: 'ready' },
    preference: { status: 'ready', revision: null },
    selectedInstanceId: instance.id,
  });
  engine.setTitle('组合服务保存');
  await engine.save();
  expect((await remote.instance.load(instance.id)).title).toBe('组合服务保存');
  expect(remote).not.toHaveProperty('loadDefinition');
  expect(remote).not.toHaveProperty('saveInstance');
  engine.dispose();
});

it('uses the instance REST client without a ViewHost or runtime source resolver', async () => {
  const transport = new HttpViewTransport({
    baseUrl: server.baseUrl,
    definitionId: definition.id,
    headers: () => ({ Authorization: 'Bearer alice-token' }),
  });
  const instances = new HttpViewInstanceService(transport);
  const list = await instances.list(definition.id);
  expect(list.items[0].id).toBe(instance.id);
  expect(list.items[0]).not.toHaveProperty('config');
  expect(transport.permission.getInstance(list.items[0]).save).toBe(true);
  const loaded = await instances.load(list.items[0].id);
  const saved = committed(
    await instances.save({ ...loaded, title: '独立客户端' }, ctx()),
  );
  expect((await instances.load(saved.id)).title).toBe('独立客户端');
});

it('refreshes the permission resource directly and shares its projection with instance clients', async () => {
  const host = client();
  const notified = vi.fn();
  host.permission.subscribe(notified);
  expect(host.permission.getInstance(summaryOf(instance)).save).toBe(false);
  expect(host.permission.getDefinition()).toEqual({
    reorder: false,
    setDefault: false,
    createPersonal: false,
    createShared: false,
  });
  await host.permission.refresh();
  expect(notified).toHaveBeenCalledTimes(1);
  expect(host.permission.getInstance(summaryOf(instance)).save).toBe(true);
  expect(host.permission.getDefinition()).toEqual({
    reorder: true,
    setDefault: true,
    createPersonal: true,
    createShared: true,
  });
  // An unchanged projection does not notify subscribers again.
  await host.permission.refresh();
  expect(notified).toHaveBeenCalledTimes(1);
  // Instance reads carry the same projection to the shared transport.
  const created = committed(
    await host.instance.create(
      { ...instance, title: '新实例' },
      { requestId: 'projected' },
    ),
  );
  expect(notified).toHaveBeenCalledTimes(2);
  expect(host.permission.getInstance(summaryOf(created)).delete).toBe(true);
  expect(client().permission.getInstance(summaryOf(created)).save).toBe(false);
});

it('rejects an invalid permission projection without replacing the accepted snapshot', async () => {
  let corrupt = false;
  const host = new HttpViewHost({
    baseUrl: server.baseUrl,
    definitionId: definition.id,
    headers: () => ({ Authorization: 'Bearer alice-token' }),
    resolveSource: setup().host.resolveSource,
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      if (!corrupt) return response;
      const envelope = await response.json();
      return Response.json({ ...envelope, permissions: { revision: 'x' } });
    },
  });
  const current = summaryOf(await host.instance.load(instance.id));
  expect(host.permission.getInstance(current).save).toBe(true);
  corrupt = true;
  await expect(host.permission.refresh()).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
  await expect(host.instance.load(instance.id)).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
  await expect(
    host.instance.rename(current.id, '无法证明', current.revision, ctx()),
  ).resolves.toMatchObject({
    outcome: 'unknown',
    issue: { code: 'UNKNOWN_OUTCOME' },
  });
  expect(host.permission.getInstance(current).save).toBe(true);
});

it.each(['revocation', 'session'] as const)(
  'ignores a stale permission reply after %s',
  async reason => {
    let token = 'alice-token';
    const host = new HttpViewHost({
      baseUrl: server.baseUrl,
      definitionId: definition.id,
      headers: () => ({ Authorization: `Bearer ${token}` }),
      resolveSource: setup().host.resolveSource,
    });
    const shared = committed(
      await host.instance.create(
        { ...instance, scope: { type: 'public', source: 'shared' } },
        { requestId: 'permission-race' },
      ),
    );
    expect(host.permission.getInstance(summaryOf(shared)).save).toBe(true);
    server.control.delayNextPermissionResponse = 150;
    const old = host.permission.refresh();
    await vi.waitFor(() =>
      expect(server.control.delayedPermissionResponses).toBe(1),
    );
    if (reason === 'revocation') {
      server.setWriter('alice-token', false);
      await host.permission.refresh();
    } else {
      token = 'expired';
      await expect(host.permission.refresh()).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      });
    }
    await expect(old).resolves.toBeUndefined();
    expect(host.permission.getInstance(summaryOf(shared)).save).toBe(false);
  },
);

it('preserves the configured source resolver receiver after facade composition', () => {
  const source = setup().host.resolveSource('orders');
  const options = {
    baseUrl: server.baseUrl,
    definitionId: definition.id,
    resolveSource(id: string) {
      expect(id).toBe('orders');
      expect(this.definitionId).toBe(definition.id);
      return source;
    },
  };
  const host = new HttpViewHost(options);
  expect(host.resolveSource('orders')).toBe(source);
  const resolve = host.resolveSource;
  options.definitionId = 'changed-after-construction';
  expect(resolve('orders')).toBe(source);
});

it.each(['', ' ', '.', '..', '\ud800', null, 1])(
  'rejects invalid resource ID %j before dispatching any request',
  async input => {
    const id = input as string;
    const request = vi.fn<typeof fetch>(async () =>
      Response.json({
        data: instance,
        permissions: {
          revision: 1,
          instances: {},
          reorder: false,
          setDefault: false,
        },
      }),
    );
    const options = {
      baseUrl: server.baseUrl,
      definitionId: definition.id,
      fetch: request,
      resolveSource: setup().host.resolveSource,
    };
    const host = new HttpViewHost(options);
    const results = await Promise.allSettled([
      host.instance.load(id),
      host.instance.save({ ...instance, id, revision: 'r1' }, ctx()),
      host.instance.rename(id, 'title', 'r1', ctx()),
      host.instance.delete(id, 'r1', ctx()),
      host.instance.list(id),
      host.definition.load(id),
      host.preference.load(id),
      host.preference.saveOrder(
        id,
        { scopeInstanceIds: [], orderedInstanceIds: [] },
        ABSENT_PRECONDITION,
        ctx(),
      ),
      host.preference.saveDefault(id, null, ABSENT_PRECONDITION, ctx()),
      host.operation.reconcile({
        resource: 'instance',
        definitionId: id,
        requestId: 'r',
      }),
    ]);
    expect(
      results.every(
        result =>
          result.status === 'rejected' &&
          result.reason.code === 'INVALID_ARGUMENT',
      ),
    ).toBe(true);
    expect(request).not.toHaveBeenCalled();
    expect(() => new HttpViewHost({ ...options, definitionId: id })).toThrow(
      expect.objectContaining({ code: 'INVALID_ARGUMENT' }),
    );
  },
);

it.each(['', ' '])(
  'rejects a blank request identity %j before dispatching a write',
  async requestId => {
    const request = vi.fn<typeof fetch>();
    const host = new HttpViewHost({
      baseUrl: server.baseUrl,
      definitionId: definition.id,
      fetch: request,
      resolveSource: setup().host.resolveSource,
    });
    const results = await Promise.allSettled([
      host.instance.create(instance, { requestId }),
      host.instance.save(instance, { requestId }),
      host.instance.rename(instance.id, 'title', 'r1', { requestId }),
      host.instance.delete(instance.id, 'r1', { requestId }),
      host.preference.saveDefault(definition.id, null, ABSENT_PRECONDITION, {
        requestId,
      }),
    ]);
    expect(
      results.every(
        result =>
          result.status === 'rejected' &&
          result.reason.code === 'INVALID_ARGUMENT',
      ),
    ).toBe(true);
    await expect(
      host.instance.save({ ...instance, revision: '' }, ctx()),
    ).rejects.toMatchObject({ code: 'PRECONDITION_REQUIRED' });
    expect(request).not.toHaveBeenCalled();
  },
);

it('encodes valid resource IDs exactly once without changing the requested resource', async () => {
  for (const id of ['订单 /%?#', '%2e%2e', 'orders.v1']) {
    const request = vi.fn<typeof fetch>(async () =>
      Response.json({
        data: { ...instance, id, definitionId: id },
        permissions: {
          revision: 1,
          instances: {},
          reorder: false,
          setDefault: false,
        },
      }),
    );
    const host = new HttpViewHost({
      baseUrl: server.baseUrl,
      definitionId: id,
      fetch: request,
      resolveSource: setup().host.resolveSource,
    });
    expect((await host.instance.load(id)).id).toBe(id);
    await host.preference.saveDefault(id, null, ABSENT_PRECONDITION, {
      requestId: 'default',
    });
    await host.operation.reconcile({
      resource: 'instance',
      definitionId: id,
      requestId: id,
    });
    const root = `/view-service/definitions/${encodeURIComponent(id)}`;
    expect(new URL(request.mock.calls[0][0] as string).pathname).toBe(
      `${root}/instances/${encodeURIComponent(id)}`,
    );
    expect(new URL(request.mock.calls[1][0] as string).pathname).toBe(
      `${root}/preferences/default`,
    );
    expect(
      new Headers(request.mock.calls[1][1]?.headers).get('Idempotency-Key'),
    ).toBe('default');
    expect(new URL(request.mock.calls[2][0] as string).pathname).toBe(
      `${root}/operations/instance/${encodeURIComponent(id)}`,
    );
  }
});

it('projects definition grants from the accepted permission snapshot', () => {
  const transport = new HttpViewTransport({
    baseUrl: server.baseUrl,
    definitionId: definition.id,
  });
  const { permission } = transport;
  expect(permission.getDefinition()).toEqual({
    reorder: false,
    setDefault: false,
    createPersonal: false,
    createShared: false,
  });
  permission.acceptSnapshot({
    revision: 100,
    instances: {},
    reorder: true,
    setDefault: true,
    createPersonal: true,
    createShared: true,
  });
  expect(permission.getDefinition()).toEqual({
    reorder: true,
    setDefault: true,
    createPersonal: true,
    createShared: true,
  });
  permission.acceptSnapshot({
    revision: 101,
    instances: {},
    reorder: true,
    setDefault: false,
  });
  expect(permission.getDefinition()).toEqual({
    reorder: true,
    setDefault: false,
    createPersonal: false,
    createShared: false,
  });
  // An older authority revision cannot restore grants.
  permission.acceptSnapshot({
    revision: 50,
    instances: {},
    reorder: false,
    setDefault: false,
    createPersonal: true,
    createShared: true,
  });
  expect(permission.getDefinition().createPersonal).toBe(false);
  expect(() =>
    permission.acceptSnapshot({
      revision: 102,
      instances: [],
      reorder: true,
      setDefault: true,
    }),
  ).toThrow(expect.objectContaining({ code: 'UNAVAILABLE' }));
});

it('pages and filters the catalog over HTTP', async () => {
  const alice = client();
  // Request identities travel as an HTTP header, so they stay ASCII here.
  for (const [index, title] of ['甲', '乙', '丙'].entries())
    committed(
      await alice.instance.create(
        { ...instance, title },
        { requestId: `page-${index}` },
      ),
    );
  const first = await alice.instance.list(definition.id, { limit: 2 });
  expect(first).toMatchObject({ total: 4, nextCursor: expect.any(String) });
  expect(first.items).toHaveLength(2);
  const rest = await alice.instance.list(definition.id, {
    limit: 2,
    cursor: first.nextCursor,
  });
  expect(rest.nextCursor).toBeNull();
  expect([...first.items, ...rest.items].map(item => item.title)).toEqual([
    instance.title,
    '甲',
    '乙',
    '丙',
  ]);
  expect(
    (await alice.instance.list(definition.id, { query: '乙' })).items.map(
      item => item.title,
    ),
  ).toEqual(['乙']);
  await expect(
    alice.instance.list(definition.id, { cursor: 'expired' }),
  ).rejects.toMatchObject({ code: 'CURSOR_EXPIRED' });
  await expect(
    alice.instance.list(definition.id, { limit: 0 }),
  ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  committed(
    await alice.preference.saveOrder(
      definition.id,
      { scopeInstanceIds: [instance.id], orderedInstanceIds: [instance.id] },
      ABSENT_PRECONDITION,
      ctx(),
    ),
  );
  await expect(
    alice.instance.list(definition.id, { limit: 2, cursor: first.nextCursor }),
  ).rejects.toMatchObject({ code: 'CURSOR_EXPIRED' });
});

it('reconciles an earlier write by request identity over HTTP', async () => {
  const host = client();
  const reference = (requestId: string, definitionId = definition.id) => ({
    resource: 'instance' as const,
    definitionId,
    requestId,
  });
  await expect(
    host.operation.reconcile(reference('never')),
  ).resolves.toMatchObject({
    outcome: 'unknown',
    issue: { code: 'NOT_FOUND' },
  });
  const created = await host.instance.create(
    { ...instance, title: '可核对' },
    { requestId: 'traceable' },
  );
  expect(created.outcome).toBe('committed');
  expect(await host.operation.reconcile(reference('traceable'))).toEqual(
    created,
  );
  expect(
    await host.operation.reconcile({
      ...reference('traceable'),
      targetId: committed(created).id,
    }),
  ).toEqual(created);
  // A create receipt carries no target, so a target filter cannot exclude it; a rename
  // receipt is bound to its instance and another target reads as not found.
  const renamed = await host.instance.rename(
    committed(created).id,
    '已核对',
    committed(created).revision,
    { requestId: 'traceable-rename' },
  );
  expect(renamed.outcome).toBe('committed');
  expect(
    await host.operation.reconcile({
      ...reference('traceable-rename'),
      targetId: committed(created).id,
    }),
  ).toEqual(renamed);
  await expect(
    host.operation.reconcile({
      ...reference('traceable-rename'),
      targetId: 'other',
    }),
  ).resolves.toMatchObject({
    outcome: 'unknown',
    issue: { code: 'NOT_FOUND' },
  });
  await expect(
    client('bob-token').operation.reconcile(reference('traceable')),
  ).resolves.toMatchObject({
    outcome: 'unknown',
    issue: { code: 'NOT_FOUND' },
  });
  await expect(
    host.operation.reconcile(reference('traceable', 'other')),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(
    client('invalid-token').operation.reconcile(reference('traceable')),
  ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
});

it('rejects writes designed against another definition revision over HTTP', async () => {
  const versioned = await startViewService({
    Host: MemoryViewHost,
    ServiceError: ViewServiceError,
    statuses: VIEW_SERVICE_STATUS,
    definition: { ...definition, revision: 'd2' },
    instances: [instance],
    defaultInstanceId: instance.id,
    source: setup().host.resolveSource('orders'),
  });
  let engine: ViewEngine | undefined;
  try {
    const host = new HttpViewHost({
      baseUrl: versioned.baseUrl,
      definitionId: definition.id,
      headers: () => ({ Authorization: 'Bearer alice-token' }),
      resolveSource: setup().host.resolveSource,
    });
    const loaded = await host.instance.load(instance.id);
    await expect(
      host.instance.save(loaded, {
        requestId: 'stale-save',
        definitionRevision: 'd1',
      }),
    ).resolves.toMatchObject(rejected('DEFINITION_CHANGED'));
    await expect(
      host.instance.create(
        { ...instance, title: '旧定义' },
        { requestId: 'stale-create', definitionRevision: 'd1' },
      ),
    ).resolves.toMatchObject(rejected('DEFINITION_CHANGED'));
    expect((await host.instance.list(definition.id)).items).toHaveLength(1);
    const saved = committed(
      await host.instance.save(loaded, {
        requestId: 'current-save',
        definitionRevision: 'd2',
      }),
    );
    expect(saved.revision).not.toBe(loaded.revision);
    engine = new ViewEngine({ definitionId: definition.id, host });
    await engine.load();
    expect(engine.getSnapshot().definition?.revision).toBe('d2');
    engine.setTitle('引擎按当前定义保存');
    await engine.save();
    expect((await host.instance.load(instance.id)).title).toBe(
      '引擎按当前定义保存',
    );
  } finally {
    engine?.dispose();
    await versioned.close();
  }
});
