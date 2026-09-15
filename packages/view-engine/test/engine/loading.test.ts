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
import type {
  ViewDefinition,
  ViewInstanceSummary,
} from '../../src/contracts/viewModel.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import type {
  Page,
  PreferenceState,
} from '../../src/contracts/viewServiceContract.js';
import {
  deferred,
  definition,
  instance,
  page,
  preference,
  selected,
  setup,
} from './fixtures.js';

it.each([{ instances: [] }, { instances: [instance()] }])(
  'keeps explicit null defaults unselected without querying (%j)',
  async ({ instances }) => {
    const { engine, paged } = setup({
      instances,
      defaultInstanceId: null,
    });
    await engine.load();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'ready',
      selectedInstanceId: null,
      instanceIds: instances.map(item => item.id),
      sessions: {},
      catalog: { status: 'ready', total: instances.length },
      preference: { status: 'ready', revision: null },
    });
    expect(paged).not.toHaveBeenCalled();
    engine.dispose();
  },
);

it('rejects a foreign or duplicate list before selecting or querying', async () => {
  for (const entries of [
    [instance(), { ...instance('bad'), definitionId: 'foreign' }],
    [instance(), instance()],
  ]) {
    const { engine, paged } = setup({
      instances: entries,
      defaultInstanceId: 'mine',
    });
    await expect(engine.load()).rejects.toThrow();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'error',
      selectedInstanceId: null,
      instanceIds: [],
    });
    expect(paged).not.toHaveBeenCalled();
  }
});

it('loads the definition, catalog page and preference concurrently and never rereads an opened instance', async () => {
  const definitionRead = deferred<ViewDefinition>();
  const listRead = deferred<Page<ViewInstanceSummary>>();
  const preferenceRead = deferred<PreferenceState>();
  const loadDefinition = vi.fn(() => definitionRead.promise);
  const listInstances = vi.fn(() => listRead.promise);
  const loadPreference = vi.fn(() => preferenceRead.promise);
  const loadInstance = vi.fn(async (id: string) => instance(id));
  const { engine } = setup({
    definition: undefined,
    instances: undefined,
    host: {
      definition: { load: loadDefinition },
      instance: { list: listInstances, load: loadInstance },
      preference: { load: loadPreference },
    } as unknown as ViewHost,
  });
  const loading = engine.load();
  await vi.waitFor(() => expect(loadDefinition).toHaveBeenCalledOnce());
  expect(listInstances).not.toHaveBeenCalled();
  definitionRead.resolve(definition);
  await vi.waitFor(() => {
    expect(listInstances).toHaveBeenCalledOnce();
    expect(loadPreference).toHaveBeenCalledOnce();
  });
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    catalog: { status: 'loading' },
    preference: { status: 'loading' },
  });
  expect(loadInstance).not.toHaveBeenCalled();
  listRead.resolve(page([instance(), instance('shared')]));
  preferenceRead.resolve(preference('mine'));
  await loading;
  expect(loadInstance).toHaveBeenCalledTimes(1);
  expect(engine.getSnapshot()).toMatchObject({
    selectedInstanceId: 'mine',
    instanceIds: ['mine', 'shared'],
    catalog: { status: 'ready', nextCursor: null, total: 2 },
    preference: { status: 'ready', revision: 'p1' },
  });
  expect(engine.getSnapshot().sessions.shared).toBeUndefined();
  await engine.selectInstance('shared');
  expect(loadInstance).toHaveBeenCalledTimes(2);
  expect(engine.getSnapshot().selectedInstanceId).toBe('shared');
  await engine.selectInstance('mine');
  await engine.selectInstance('shared');
  expect(loadInstance).toHaveBeenCalledTimes(2);
  engine.dispose();
});

it('keeps the definition ready when the host catalog or preference read fails', async () => {
  const { engine, paged } = setup({
    instances: undefined,
    host: {
      instance: {
        list: vi.fn().mockRejectedValue(new Error('catalog offline')),
        load: vi.fn(async (id: string) => instance(id)),
      },
      preference: {
        load: vi.fn().mockRejectedValue(new Error('preference offline')),
      },
    } as unknown as ViewHost,
  });
  await expect(engine.load()).resolves.toBeUndefined();
  expect(engine.getSnapshot()).toMatchObject({
    status: 'ready',
    error: null,
    selectedInstanceId: null,
    instanceIds: [],
    catalog: { status: 'error', error: 'catalog offline' },
    preference: { status: 'error', error: 'preference offline' },
  });
  expect(paged).not.toHaveBeenCalled();
  engine.dispose();
});

it('ignores obsolete loads and prevents query dispatch or snapshot commits after disposal', async () => {
  const definitionRead = deferred<ViewDefinition>();
  const loadDefinition = vi
    .fn()
    .mockImplementationOnce(() => definitionRead.promise)
    .mockResolvedValue(definition);
  const { engine, paged } = setup({
    definition: undefined,
    host: { definition: { load: loadDefinition } } as unknown as ViewHost,
  });
  const first = engine.load();
  await vi.waitFor(() => expect(loadDefinition).toHaveBeenCalledOnce());
  await engine.load();
  definitionRead.reject(new Error('obsolete load'));
  await first;
  expect(engine.getSnapshot().status).toBe('ready');
  const sourceRead = deferred<unknown>();
  const delayed = setup({
    host: { resolveSource: () => sourceRead.promise } as ViewHost,
  });
  const loading = delayed.engine.load();
  await vi.waitFor(() =>
    expect(selected(delayed.engine).queryStatus).toBe('loading'),
  );
  const snapshot = delayed.engine.getSnapshot();
  const listener = vi.fn();
  delayed.engine.subscribe(listener);
  delayed.engine.dispose();
  sourceRead.resolve({ paged, cursor: vi.fn() });
  await loading;
  expect(paged).toHaveBeenCalledOnce();
  expect(delayed.engine.getSnapshot()).toBe(snapshot);
  expect(listener).not.toHaveBeenCalled();
  await expect(
    delayed.engine
      .record(delayed.engine.getSnapshot().selectedInstanceId!)
      .refresh(),
  ).rejects.toThrow();
});
