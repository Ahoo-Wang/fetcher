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

import {
  createFilterConfiguration,
  newFilterNode,
} from '../../src/filter/filterCore.js';
import { FilterOperator } from '@ahoo-wang/fetcher-wow';
import { vi } from 'vitest';
import { ViewEngine } from '../../src/engine/ViewEngine.js';
import {
  summaryOf,
  type RecordViewDefinition,
  type ViewEngineOptions,
  type RecordViewInstance,
  type ViewInstance,
} from '../../src/contracts/viewModel.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import {
  ViewServiceError,
  committedWrite,
  type PreferenceState,
  type ViewDeleteReceipt,
  type WriteObservation,
} from '../../src/contracts/viewServiceContract.js';

export const definition: RecordViewDefinition = {
  id: 'orders',
  title: 'Orders',
  sourceId: 'orders-source',
  record: { allowedLayouts: ['table', 'card'], rowKey: 'state.id' },
  fields: [
    { field: 'state.id', label: 'ID', type: 'string', sortable: true },
    { field: 'state.amount', label: 'Amount', type: 'number', sortable: true },
  ],
};

export function instance(
  id = 'mine',
  mode: 'paged' | 'cursor' = 'paged',
): RecordViewInstance {
  return {
    id,
    definitionId: 'orders',
    title: id,
    kind: 'record',
    scope: { type: 'personal' },
    revision: 'r1',
    config: {
      filters: createFilterConfiguration({
        ...newFilterNode(FilterOperator.MATCH_ALL),
        id: 'filter-root',
      }),
      sort: [],
      pagination: { mode, size: 10 },
      presentation: {
        layout: 'table',
        table: {
          columns: [{ id: 'amount', kind: 'field', field: 'state.amount' }],
        },
      },
    },
  };
}

export function setup(options: Partial<ViewEngineOptions> = {}) {
  const paged = vi.fn().mockResolvedValue({
    total: 1,
    list: [{ state: { id: 'a', amount: 10 } }],
  });
  const cursor = vi
    .fn()
    .mockResolvedValue({ list: [{ state: { id: 'a' } }], nextCursor: 'next' });
  const host: ViewHost = {
    resolveSource: vi.fn(() => ({ paged, cursor })),
    ...options.host,
    permission: {
      getInstance: () => ({
        save: true,
        saveAsPersonal: true,
        saveAsShared: true,
      }),
      ...options.host?.permission,
    },
    instance: {
      save: vi.fn(async value =>
        committedWrite({ ...value, revision: 'r2' }, 'r2'),
      ),
      create: vi.fn(async value =>
        committedWrite({ ...value, id: 'created', revision: 'r1' }, 'r1'),
      ),
      ...options.host?.instance,
    },
  };
  const engine = new ViewEngine({
    definitionId: 'orders',
    definition,
    instances: [instance(), instance('shared')],
    defaultInstanceId: 'mine',
    ...options,
    host,
  });
  return { engine, host, paged, cursor };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

/** Preference document a mock host returns; `revision` null means none exists yet. */
export function preference(
  defaultInstanceId: string | null,
  revision: string | null = 'p1',
  order: string[] = [],
): PreferenceState {
  return {
    revision,
    order,
    defaultInstanceId,
    effectiveDefaultInstanceId: defaultInstanceId,
  };
}
/** A host catalog page built from full instances. */
export function page(
  instances: readonly ViewInstance[],
  nextCursor: string | null = null,
) {
  return {
    items: instances.map(summaryOf),
    nextCursor,
    total: instances.length,
  };
}

export const selected = (
  engine: ViewEngine,
  id = engine.getSnapshot().selectedInstanceId!,
) => engine.getSnapshot().sessions[id];

export const deletionPermissions = () => ({
  save: true,
  saveAsPersonal: true,
  saveAsShared: true,
  delete: true,
});

export const managementPermissions = () => ({
  save: true,
  saveAsPersonal: true,
  saveAsShared: true,
  rename: true,
  delete: true,
});

/** Committed delete observation for `id`; the receipt carries only identity and tombstone revision. */
export function deleteReceipt(
  id: string,
  revision = 'tomb',
): WriteObservation<ViewDeleteReceipt> {
  return committedWrite({ id, revision }, revision);
}

/** Committed preference observation whose revision matches the returned document. */
export function preferenceWrite(
  defaultInstanceId: string | null,
  revision = 'p2',
  order: string[] = [],
): WriteObservation<PreferenceState> {
  return committedWrite(
    preference(defaultInstanceId, revision, order),
    revision,
  );
}

/**
 * Host read ports serving `instances` as a one-page catalog with point reads; pass together
 * with `instances: undefined` so the engine reads through the host. `defaultInstanceId`
 * undefined omits the preference port (the engine then uses `options.defaultInstanceId`).
 * The first point read of an ID serves the seed; later reads call `reload(id)` when given,
 * so reload tests can present a newer remote revision.
 */
export function catalogHost(
  instances: readonly ViewInstance[],
  defaultInstanceId?: string | null,
  revision: string | null = null,
  reload?: (id: string) => ViewInstance | Promise<ViewInstance>,
) {
  const opened = new Set<string>();
  const list = vi.fn(async () => page(instances));
  const load = vi.fn(async (id: string) => {
    if (reload && opened.has(id)) return reload(id);
    const found = instances.find(item => item.id === id);
    if (!found) throw new ViewServiceError('NOT_FOUND', `无法加载实例：${id}`);
    opened.add(id);
    return structuredClone(found);
  });
  return {
    instance: { list, load },
    ...(defaultInstanceId === undefined
      ? {}
      : {
          preference: {
            load: vi.fn(async () => preference(defaultInstanceId, revision)),
          },
        }),
  };
}

/**
 * Host read ports over a catalog the test mutates between loads through `set(...)`; point reads
 * of an ID that is no longer listed reject with NOT_FOUND. Pass `host` with `instances: undefined`.
 */
export function liveCatalog(
  instances: readonly ViewInstance[],
  defaultInstanceId: string | null = 'mine',
) {
  let current = { instances, defaultInstanceId };
  const list = vi.fn(async () => page(current.instances));
  const load = vi.fn(async (id: string) => {
    const found = current.instances.find(item => item.id === id);
    if (!found) throw new ViewServiceError('NOT_FOUND', `无法加载实例：${id}`);
    return structuredClone(found);
  });
  const loadPreference = vi.fn(async () =>
    preference(current.defaultInstanceId),
  );
  return {
    host: { instance: { list, load }, preference: { load: loadPreference } },
    set(
      next: readonly ViewInstance[],
      nextDefault: string | null = current.defaultInstanceId,
    ) {
      current = { instances: next, defaultInstanceId: nextDefault };
    },
  };
}
