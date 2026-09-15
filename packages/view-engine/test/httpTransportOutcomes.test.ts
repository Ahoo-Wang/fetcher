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
import { committedWrite, rejectedWrite } from '@ahoo-wang/fetcher-view-engine';
import { HttpViewHost } from '../dev/http/index.js';
import { definition, instance, setup } from './fixtures/viewPage.js';

const permissions = {
  revision: 1,
  instances: {},
  reorder: true,
  setDefault: true,
};
function respond(status: number, data: unknown) {
  return new Response(JSON.stringify({ data, permissions }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function client(fetchMock: typeof fetch) {
  return new HttpViewHost({
    baseUrl: 'http://service.test/view-service/',
    definitionId: definition.id,
    fetch: fetchMock,
    resolveSource: setup().host.resolveSource,
  });
}

it('accepts a rejected observation only when the status matches its code, and never a committed body on 5xx', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(respond(503, rejectedWrite('UNAVAILABLE', 'down')))
    .mockResolvedValueOnce(
      respond(500, committedWrite(instance, instance.revision)),
    )
    .mockResolvedValueOnce(
      respond(409, rejectedWrite('FORBIDDEN', 'mismatched')),
    );
  const host = client(fetchMock);
  await expect(
    host.instance.save(instance, { requestId: 'r1' }),
  ).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'UNAVAILABLE' },
  });
  await expect(
    host.instance.save(instance, { requestId: 'r2' }),
  ).resolves.toMatchObject({ outcome: 'unknown' });
  await expect(
    host.instance.save(instance, { requestId: 'r3' }),
  ).resolves.toMatchObject({ outcome: 'unknown' });
});

it('forwards the read fence when reconciling an operation', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      respond(200, committedWrite(instance, instance.revision)),
    );
  const host = client(fetchMock);
  await host.operation.reconcile(
    {
      resource: 'instance',
      definitionId: definition.id,
      requestId: 'r1',
      targetId: 'mine',
    },
    { readFence: 'fence-9' },
  );
  const url = String(fetchMock.mock.calls[0][0]);
  expect(url).toContain('/operations/instance/r1?');
  expect(url).toContain('targetId=mine');
  expect(url).toContain('readFence=fence-9');
});
