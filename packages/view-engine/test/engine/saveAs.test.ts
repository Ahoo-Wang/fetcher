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
import type { ViewInstance } from '../../src/contracts/viewModel.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import {
  committedWrite,
  type WriteObservation,
} from '../../src/contracts/viewServiceContract.js';
import {
  catalogHost,
  deferred,
  instance,
  selected,
  setup,
} from './fixtures.js';

it('selects a saved copy using the latest source config, leaving the source draft untouched', async () => {
  const response = deferred<WriteObservation<ViewInstance>>();
  const createInstance = vi.fn(() => response.promise);
  const { engine } = setup({
    host: { instance: { create: createInstance } } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('Source draft');
  const saving = engine.saveAs({
    title: 'Copy',
    scope: { type: 'public', source: 'shared' },
  });
  expect(createInstance).toHaveBeenCalledWith(
    {
      definitionId: 'orders',
      kind: 'record',
      title: 'Copy',
      scope: { type: 'public', source: 'shared' },
      config: instance().config,
    },
    expect.objectContaining({ requestId: expect.any(String) }),
  );
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setColumns([
      { id: 'amount', kind: 'field', field: 'state.amount', width: 300 },
    ]);
  const latestConfig = selected(engine).instance.config;
  response.resolve(
    committedWrite(
      {
        ...instance('created'),
        title: 'Copy',
        scope: { type: 'public', source: 'shared' },
      },
      'r1',
    ),
  );
  await expect(saving).resolves.toBe('created');
  expect(engine.getSnapshot().selectedInstanceId).toBe('created');
  expect(engine.getSnapshot().catalog.summaries.created).toMatchObject({
    id: 'created',
    title: 'Copy',
  });
  expect(selected(engine)).toMatchObject({
    dirty: true,
    baseline: { title: 'Copy' },
    instance: { title: 'Copy', config: latestConfig },
  });
  expect(selected(engine, 'mine')).toMatchObject({
    dirty: true,
    baseline: { title: 'mine' },
    instance: { title: 'Source draft', config: latestConfig },
  });
});

it('adds a saved copy without stealing selection after navigation', async () => {
  const response = deferred<WriteObservation<ViewInstance>>();
  const { engine } = setup({
    host: {
      instance: { create: () => response.promise },
    } as unknown as ViewHost,
  });
  await engine.load();
  const saving = engine.saveAs({
    title: 'Copy',
    scope: { type: 'personal' },
  });
  await engine.selectInstance('shared');
  response.resolve(
    committedWrite({ ...instance('created'), title: 'Copy' }, 'r1'),
  );
  await saving;
  expect(engine.getSnapshot().selectedInstanceId).toBe('shared');
  expect(engine.getSnapshot().instanceIds).toEqual([
    'mine',
    'shared',
    'created',
  ]);
  expect(selected(engine, 'created')).toMatchObject({
    dirty: false,
    queryStatus: 'idle',
    instance: { title: 'Copy' },
  });
});

it('does not let save-as completion cancel a newer pending navigation', async () => {
  const write = deferred<WriteObservation<ViewInstance>>();
  const read = deferred<ViewInstance>();
  const catalog = catalogHost([instance(), instance('shared')]);
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: catalog.instance.list,
        load: (id: string) =>
          id === 'remote' ? read.promise : catalog.instance.load(id),
        create: () => write.promise,
      },
    } as unknown as ViewHost,
  });
  await engine.load();
  const saving = engine.saveAs({
    title: 'Copy',
    scope: { type: 'personal' },
  });
  const navigating = engine.selectInstance('remote');
  write.resolve(
    committedWrite({ ...instance('created'), title: 'Copy' }, 'r1'),
  );
  await saving;
  expect(engine.getSnapshot().selectedInstanceId).toBe('mine');
  expect(engine.getSnapshot().openingInstanceId).toBe('remote');
  read.resolve(instance('remote'));
  await navigating;
  expect(engine.getSnapshot().selectedInstanceId).toBe('remote');
  expect(selected(engine, 'created').queryStatus).toBe('idle');
});

it('rejects system-copy scopes, duplicate new IDs and mismatched copy content', async () => {
  const { engine, host } = setup();
  await engine.load();
  await expect(
    engine.saveAs({
      title: 'Copy',
      scope: { type: 'public', source: 'system' } as never,
    }),
  ).rejects.toThrow();
  expect(host.instance!.create).not.toHaveBeenCalled();
  for (const result of [
    committedWrite({ ...instance(), title: 'Copy' }, 'r1'),
    committedWrite({ ...instance('created'), title: 'Changed' }, 'r1'),
    committedWrite({ ...instance('created'), title: 'Copy' }, 'r2'),
  ]) {
    const invalid = setup({
      host: { instance: { create: async () => result } } as unknown as ViewHost,
    });
    await invalid.engine.load();
    await expect(
      invalid.engine.saveAs({ title: 'Copy', scope: { type: 'personal' } }),
    ).rejects.toThrow();
    expect(selected(invalid.engine).requiresReload).toBe(true);
    expect(invalid.engine.getSnapshot().instanceIds).toEqual([
      'mine',
      'shared',
    ]);
  }
});

it('ignores write completion after disposal without adding or selecting the created instance', async () => {
  const response = deferred<WriteObservation<ViewInstance>>();
  const { engine } = setup({
    host: {
      instance: { create: () => response.promise },
    } as unknown as ViewHost,
  });
  await engine.load();
  const saving = engine.saveAs({
    title: 'Copy',
    scope: { type: 'personal' },
  });
  const snapshot = engine.getSnapshot();
  engine.dispose();
  response.resolve(
    committedWrite({ ...instance('created'), title: 'Copy' }, 'r1'),
  );
  await saving;
  expect(engine.getSnapshot()).toBe(snapshot);
  expect(engine.getSnapshot().instanceIds).toEqual(['mine', 'shared']);
});
