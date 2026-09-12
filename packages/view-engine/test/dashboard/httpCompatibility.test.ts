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
import { expect, it } from 'vitest';
import { MemoryViewHost } from '../../src/record/MemoryViewHost.js';
import { ViewServiceError } from '../../src/contracts/viewServiceContract.js';
import { HttpViewHost, VIEW_SERVICE_STATUS } from '../../dev/http/index.js';
import { startViewService } from '../../scripts/fixtures/view-service-server.mjs';
import { definition, instance } from '../engine/fixtures.js';
import type { DashboardViewInstance } from '../../src/dashboard/dashboardModel.js';

it('negotiates dashboard format across real HTTP list, order, single and deletion receipts', async () => {
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
    instances: {
      instances: [instance('a'), dashboard, instance('b')],
      defaultInstanceId: 'dashboard',
    },
    source,
  });
  try {
    const options = {
      baseUrl: server.baseUrl,
      definitionId: definition.id,
      headers: () => ({ Authorization: 'Bearer alice-token' }),
      resolveSource: () => source,
    };
    const old = new HttpViewHost(options);
    const modern = new HttpViewHost({
      ...options,
      supportedFormats: { record: true, analysis: true, dashboard: 1 },
    });
    expect(
      (await old.instance.list(definition.id)).defaultInstanceId,
    ).toBeNull();
    await old.preference.saveOrder(definition.id, ['b', 'a']);
    expect(
      (await modern.instance.list(definition.id)).instances.map(
        item => item.id,
      ),
    ).toEqual(['b', 'dashboard', 'a']);
    const a = await old.instance.load('a');
    expect(await old.instance.delete('a', a.revision)).toEqual({
      defaultInstance: null,
    });
    expect((await modern.instance.list(definition.id)).defaultInstanceId).toBe(
      'dashboard',
    );
    await expect(old.instance.load('dashboard')).rejects.toMatchObject({
      code: 'UNSUPPORTED_FORMAT',
    });
    const saved = await modern.instance.load('dashboard');
    expect(
      (await modern.instance.rename(saved.id, 'New name', saved.revision))
        .title,
    ).toBe('New name');
  } finally {
    await server.close();
  }
});
