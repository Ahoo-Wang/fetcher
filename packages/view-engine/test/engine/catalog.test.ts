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

import { expect, it, vi } from 'vitest';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import { instance, page, preference, setup } from './fixtures.js';

function pagedHost(size = 3) {
  const all = Array.from({ length: 7 }, (_, i) => instance(`v${i}`));
  const list = vi.fn(
    async (_id: string, options: { cursor?: string | null }) => {
      const offset = options.cursor ? Number(options.cursor) : 0;
      const items = all.slice(offset, offset + size);
      return page(
        items,
        offset + size < all.length ? String(offset + size) : null,
      );
    },
  );
  const load = vi.fn(async (id: string) => {
    const found = all.find(item => item.id === id);
    if (!found) throw new Error(`无法加载实例：${id}`);
    return structuredClone(found);
  });
  return { all, list, load };
}

it('loads the first catalog page, then appends pages without opening sessions', async () => {
  const { list, load } = pagedHost();
  const { engine, paged } = setup({
    instances: undefined,
    host: {
      instance: { list, load },
      preference: { load: async () => preference('v1') },
    } as unknown as ViewHost,
  });
  await engine.load();
  const state = engine.getSnapshot();
  expect(state.status).toBe('ready');
  expect(state.catalog).toMatchObject({ status: 'ready', nextCursor: '3' });
  expect(state.instanceIds).toEqual(['v0', 'v1', 'v2']);
  expect(Object.keys(state.sessions)).toEqual(['v1']);
  expect(state.selectedInstanceId).toBe('v1');
  expect(load).toHaveBeenCalledTimes(1);
  await engine.loadMoreInstances();
  await engine.loadMoreInstances();
  expect(engine.getSnapshot().instanceIds).toEqual([
    'v0',
    'v1',
    'v2',
    'v3',
    'v4',
    'v5',
    'v6',
  ]);
  expect(engine.getSnapshot().catalog.nextCursor).toBeNull();
  expect(Object.keys(engine.getSnapshot().sessions)).toEqual(['v1']);
  expect(paged).toHaveBeenCalledTimes(1);
  await engine.loadMoreInstances();
  expect(list).toHaveBeenCalledTimes(3);
  engine.dispose();
});

it('keeps the engine ready when the catalog fails and still opens an explicit instance', async () => {
  const { load } = pagedHost();
  const { engine } = setup({
    instances: undefined,
    instanceId: 'v4',
    host: {
      instance: {
        list: vi.fn().mockRejectedValue(new Error('目录不可用')),
        load,
      },
      preference: { load: async () => preference('v1') },
    } as unknown as ViewHost,
  });
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    catalog: { status: 'error', error: '目录不可用' },
    selectedInstanceId: 'v4',
    instanceIds: ['v4'],
    defaultInstanceId: 'v1',
  });
  expect(engine.getSnapshot().catalog.summaries.v4).toMatchObject({
    id: 'v4',
    title: 'v4',
  });
  engine.dispose();
});

it('refuses catalog pages beyond the summary budget without touching opened sessions', async () => {
  const { list, load } = pagedHost();
  const { engine } = setup({
    instances: undefined,
    limits: { maxCatalogSummaries: 4 },
    host: {
      instance: { list, load },
      preference: { load: async () => preference('v1') },
    } as unknown as ViewHost,
  });
  await engine.load();
  // The second page (3 more) would exceed the budget of 4: it is refused whole, nothing is hidden.
  await expect(engine.loadMoreInstances()).rejects.toMatchObject({
    code: 'RESOURCE_LIMIT',
  });
  expect(engine.getSnapshot().instanceIds).toEqual(['v0', 'v1', 'v2']);
  expect(engine.getSnapshot().catalog).toMatchObject({
    status: 'error',
    nextCursor: '3',
  });
  expect(engine.getSnapshot().selectedInstanceId).toBe('v1');
  expect(Object.keys(engine.getSnapshot().sessions)).toEqual(['v1']);
  expect(list).toHaveBeenCalledTimes(2);
  engine.dispose();
});

it('reports a failed preference read separately and selects nothing', async () => {
  const { list, load } = pagedHost();
  const { engine, paged } = setup({
    instances: undefined,
    host: {
      instance: { list, load },
      preference: { load: vi.fn().mockRejectedValue(new Error('偏好不可用')) },
    } as unknown as ViewHost,
  });
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    preference: { status: 'error', error: '偏好不可用' },
    selectedInstanceId: null,
    defaultInstanceId: null,
  });
  expect(paged).not.toHaveBeenCalled();
  await expect(engine.setDefaultInstance('v0')).rejects.toThrow();
  engine.dispose();
});

it('never lets a late personal default take the selection back from the user', async () => {
  const { list, load } = pagedHost();
  let releaseDefault!: (state: ReturnType<typeof preference>) => void;
  const slowDefault = new Promise<ReturnType<typeof preference>>(resolve => {
    releaseDefault = resolve;
  });
  const { engine, paged } = setup({
    instances: undefined,
    host: {
      instance: { list, load },
      preference: { load: () => slowDefault },
    } as unknown as ViewHost,
  });
  const loading = engine.load();
  await vi.waitFor(() =>
    expect(engine.getSnapshot().catalog.status).toBe('ready'),
  );
  await engine.selectInstance('v2');
  releaseDefault(preference('v1'));
  await loading;
  expect(engine.getSnapshot()).toMatchObject({
    selectedInstanceId: 'v2',
    defaultInstanceId: 'v1',
  });
  expect(Object.keys(engine.getSnapshot().sessions)).toEqual(['v2']);
  expect(paged).toHaveBeenCalledTimes(1);
  engine.dispose();
});

it('opens an explicit instance before the catalog or the preference has answered', async () => {
  const { load } = pagedHost();
  let releaseList!: () => void;
  const slowList = new Promise<void>(resolve => {
    releaseList = resolve;
  });
  const list = vi.fn(async () => {
    await slowList;
    return page([instance('v0')], null);
  });
  const { engine } = setup({
    instances: undefined,
    instanceId: 'v4',
    host: {
      instance: { list, load },
      preference: { load: () => new Promise(() => {}) },
    } as unknown as ViewHost,
  });
  const loading = engine.load();
  await vi.waitFor(() =>
    expect(engine.getSnapshot().selectedInstanceId).toBe('v4'),
  );
  expect(engine.getSnapshot().catalog.status).toBe('loading');
  releaseList();
  await vi.waitFor(() =>
    expect(engine.getSnapshot().catalog.status).toBe('ready'),
  );
  expect(engine.getSnapshot().instanceIds).toEqual(['v0', 'v4']);
  engine.dispose();
  await loading;
});

it('rejects a point read whose signal was already aborted without calling the host', async () => {
  const { list, load } = pagedHost();
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { list, load },
      preference: { load: async () => preference(null) },
    } as unknown as ViewHost,
  });
  await engine.load();
  load.mockClear();
  await expect(
    engine.loadSavedInstance('v3', AbortSignal.abort(new Error('gone'))),
  ).rejects.toThrow('gone');
  expect(load).not.toHaveBeenCalled();
  engine.dispose();
});

it('turns a slow catalog read into a catalog error without touching the preference read', async () => {
  const { load } = pagedHost();
  const { engine } = setup({
    instances: undefined,
    limits: { loadTimeoutMs: 40 },
    host: {
      instance: { list: () => new Promise(() => {}), load },
      preference: { load: async () => preference('v1') },
    } as unknown as ViewHost,
  });
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    catalog: { status: 'error' },
    preference: { status: 'ready', revision: 'p1' },
    defaultInstanceId: 'v1',
    selectedInstanceId: 'v1',
  });
  expect(engine.getSnapshot().catalog.error).toMatch(/超时/);
  engine.dispose();
});

it('reloads the catalog from its first page after a failed first read', async () => {
  const { all, load } = pagedHost();
  const list = vi
    .fn()
    .mockRejectedValueOnce(new Error('目录不可用'))
    .mockResolvedValueOnce(page(all.slice(0, 2)));
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { list, load },
      preference: { load: async () => preference('v1') },
    } as unknown as ViewHost,
  });
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    catalog: { status: 'error', error: '目录不可用', nextCursor: null },
    selectedInstanceId: 'v1',
    instanceIds: ['v1'],
  });
  await engine.reloadCatalog();
  expect(engine.getSnapshot()).toMatchObject({
    catalog: { status: 'ready', error: null },
    instanceIds: ['v0', 'v1'],
    selectedInstanceId: 'v1',
  });
  expect(Object.keys(engine.getSnapshot().sessions)).toEqual(['v1']);
  engine.dispose();
});

it('raises the known catalog total when a visible copy is created', async () => {
  const { all, list, load } = pagedHost();
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list,
        load,
        create: vi.fn(async (input: object) => {
          const created = { ...all[0], ...input, id: 'copy', revision: 'c1' };
          return {
            outcome: 'committed',
            value: created,
            revision: 'c1',
            visibility: 'visible',
          };
        }),
      },
      preference: { load: async () => preference('v1') },
    } as unknown as ViewHost,
  });
  await engine.load();
  // The fixture page reports the page size as its total.
  expect(engine.getSnapshot().catalog.total).toBe(3);
  await engine.saveAs({ title: 'Copy', scope: { type: 'personal' } });
  expect(engine.getSnapshot().catalog.total).toBe(4);
  expect(engine.getSnapshot().instanceIds).toContain('copy');
  engine.dispose();
});

it('reports a missing explicit instance as a workspace error without selecting anything', async () => {
  const { list, load } = pagedHost();
  const { engine } = setup({
    instances: undefined,
    instanceId: 'ghost',
    host: {
      instance: { list, load },
      preference: { load: async () => preference('v1') },
    } as unknown as ViewHost,
  });
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    selectedInstanceId: null,
    error: '无法加载实例：ghost',
    catalog: { status: 'ready' },
  });
  engine.dispose();
});
