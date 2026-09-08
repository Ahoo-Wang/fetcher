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
import { LocalStorageViewHost } from '../src/record/LocalStorageViewHost.js';
import { HttpViewHost } from '../src/record/HttpViewHost.js';
import { ViewEngine } from '../src/record/ViewEngine.js';
import {
  ViewServiceError,
  VIEW_SERVICE_STATUS,
} from '../src/record/viewServiceContract.js';
import { startViewService } from '../scripts/fixtures/view-service-server.mjs';
import { definition, instance, setup } from './fixtures/viewPage.js';

let server: Awaited<ReturnType<typeof startViewService>>;
beforeEach(async () => {
  server = await startViewService({
    Host: LocalStorageViewHost,
    ServiceError: ViewServiceError,
    statuses: VIEW_SERVICE_STATUS,
    definition,
    instances: { instances: [instance], defaultInstanceId: instance.id },
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
it('executes JSON writes over HTTP with shared visibility, private isolation and typed errors', async () => {
  const alice = client(),
    bob = client('bob-token');
  const shared = await alice.createInstance(
    { ...instance, title: '公共', scope: { type: 'public', source: 'shared' } },
    { requestId: 'shared' },
  );
  expect((await bob.loadInstance(shared.id)).title).toBe('公共');
  await expect(
    bob.renameInstance(shared.id, '越权', shared.revision),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  const privateView = await alice.createInstance(
    { ...instance, title: '私人' },
    { requestId: 'private' },
  );
  await expect(bob.loadInstance(privateView.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  await expect(
    client('outsider-token').loadInstance(shared.id),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(
    client('invalid-token').listInstances(definition.id),
  ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  const renamed = await alice.renameInstance(
    shared.id,
    '新名称',
    shared.revision,
  );
  await expect(alice.saveInstance(shared)).rejects.toMatchObject({
    code: 'REVISION_CONFLICT',
  });
  await alice.deleteInstance(renamed.id, renamed.revision);
  await expect(bob.loadInstance(renamed.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
});
it('does not trust posted ownership, and stores each users order independently', async () => {
  const alice = client(),
    bob = client('bob-token');
  const privateView = await alice.createInstance(
    { ...instance, ownerKey: 'bob' } as typeof instance,
    { requestId: 'owner-forgery' },
  );
  await expect(bob.loadInstance(privateView.id)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  const shared = await alice.createInstance(
    { ...instance, scope: { type: 'public', source: 'shared' } },
    { requestId: 'public' },
  );
  const before = (await alice.listInstances(definition.id)).instances.map(
    item => item.id,
  );
  const order = (await bob.listInstances(definition.id)).instances
    .map(item => item.id)
    .reverse();
  await bob.saveInstanceOrder(definition.id, order);
  expect(
    (await bob.listInstances(definition.id)).instances.map(item => item.id),
  ).toEqual(order);
  expect(
    (await alice.listInstances(definition.id)).instances.map(item => item.id),
  ).toEqual(before);
  expect(order).toContain(shared.id);
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
  expect(
    (await host.listInstances(definition.id)).instances.filter(
      item => item.title === request.title,
    ),
  ).toHaveLength(1);
  await expect(
    engine.saveAs({ ...request, title: '先不能改请求' }),
  ).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
  await engine.saveAs(request);
  expect(
    (await host.listInstances(definition.id)).instances.filter(
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
  expect((await host.listInstances(definition.id)).instances).toHaveLength(3);
  engine.dispose();
});
it('forwards cancellation and distinguishes read timeout from an unknown write outcome', async () => {
  const host = client('alice-token', 50);
  server.control.delayNextRead = 200;
  await expect(host.listInstances(definition.id)).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
  await delay(30);
  expect(server.control.abortedReads).toBe(1);
  server.control.delayNextRead = 200;
  const controller = new AbortController();
  const pending = host.listInstances(definition.id, controller.signal);
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
  const shared = await host.createInstance(
    { ...instance, scope: { type: 'public', source: 'shared' } },
    { requestId: 'shared' },
  );
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  expect(
    engine.getCapabilitiesSnapshot().instances[shared.id].permissions.save,
  ).toBe(true);
  const sessions = engine.getSnapshot().sessions;
  server.control.delayNextPermissionResponse = 300;
  const oldPermissions = host.refreshPermissions();
  await vi.waitFor(() =>
    expect(server.control.delayedPermissionResponses).toBe(1),
  );
  server.setWriter('alice-token', false);
  await host.refreshPermissions();
  await oldPermissions;
  expect(
    engine.getCapabilitiesSnapshot().instances[shared.id].permissions.save,
  ).toBe(false);
  expect(engine.getSnapshot().sessions).toBe(sessions);
  await expect(host.saveInstance(shared)).rejects.toMatchObject({
    code: 'FORBIDDEN',
  });
  engine.dispose();
});

it('keeps one create after timeout or cancellation after the server commit', async () => {
  const host = client('alice-token', 70);
  server.control.delayNextCreateResponse = 300;
  const input = { ...instance, title: '超时创建' };
  await expect(
    host.createInstance(input, { requestId: 'timeout' }),
  ).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
  const result = await host.createInstance(input, { requestId: 'timeout' });
  expect(
    (await host.listInstances(definition.id)).instances.filter(
      item => item.id === result.id,
    ),
  ).toHaveLength(1);
  const normal = client();
  const controller = new AbortController();
  server.control.delayNextCreateResponse = 300;
  const pending = normal.createInstance(
    { ...input, title: '取消响应' },
    { requestId: 'canceled', signal: controller.signal },
  );
  const assertion = expect(pending).rejects.toMatchObject({
    code: 'UNKNOWN_OUTCOME',
  });
  await vi.waitFor(() => expect(server.control.delayedCreateResponses).toBe(2));
  controller.abort();
  await assertion;
  await normal.createInstance(
    { ...input, title: '取消响应' },
    { requestId: 'canceled' },
  );
  expect(
    (await normal.listInstances(definition.id)).instances.filter(
      item => item.title === '取消响应',
    ),
  ).toHaveLength(1);
});
it('performs competing HTTP writes with one authoritative winner', async () => {
  const left = client(),
    right = client();
  const old = await left.loadInstance(instance.id);
  const results = await Promise.allSettled([
    left.saveInstance({ ...old, title: 'first' }),
    right.saveInstance({ ...old, title: 'second' }),
  ]);
  expect(results.filter(item => item.status === 'fulfilled')).toHaveLength(1);
  expect(results.find(item => item.status === 'rejected')).toMatchObject({
    reason: { code: 'REVISION_CONFLICT' },
  });
});

it('clears grants on session rejection and ignores an older successful permission response', async () => {
  let token = 'alice-token';
  const host = new HttpViewHost({
    baseUrl: server.baseUrl,
    definitionId: definition.id,
    headers: () => ({ Authorization: `Bearer ${token}` }),
    resolveSource: setup().host.resolveSource,
  });
  const current = await host.loadInstance(instance.id);
  expect(host.getInstancePermissions(current).save).toBe(true);
  server.control.delayNextPermissionResponse = 300;
  const old = host.refreshPermissions();
  await vi.waitFor(() =>
    expect(server.control.delayedPermissionResponses).toBe(1),
  );
  token = 'expired';
  await expect(host.refreshPermissions()).rejects.toMatchObject({
    code: 'UNAUTHENTICATED',
  });
  await old;
  expect(host.getInstancePermissions(current).save).toBe(false);
  token = 'alice-token';
  await host.refreshPermissions();
  expect(host.getInstancePermissions(current).save).toBe(true);
});

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
});
