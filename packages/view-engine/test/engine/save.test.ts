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

import { createFilterConfiguration } from '../../src/filter/filterCore.js';
import { FilterOperator } from '@ahoo-wang/fetcher-wow';
import { expect, it, vi } from 'vitest';
import { newFilterNode } from '../../src/filter/filterCore.js';
import type { ViewInstance } from '../../src/contracts/viewModel.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import {
  committedWrite,
  rejectedWrite,
  type WriteObservation,
} from '../../src/contracts/viewServiceContract.js';
import {
  catalogHost,
  deferred,
  instance,
  selected,
  setup,
} from './fixtures.js';

it('denies unavailable writes and pending filter drafts', async () => {
  const { engine, host } = setup({
    host: { permission: { getInstance: undefined } } as unknown as ViewHost,
  });
  await engine.load();
  expect(engine.getPermissions()).toEqual({
    save: false,
    saveAsPersonal: false,
    saveAsShared: false,
    delete: false,
    rename: false,
  });
  await expect(engine.save()).rejects.toThrow();
  expect(host.instance!.save).not.toHaveBeenCalled();
  expect(selected(engine).requiresReload).toBe(false);
  const pending = setup();
  await pending.engine.load();
  pending.engine
    .record(pending.engine.getSnapshot().selectedInstanceId!)
    .setFilterValidity(false);
  await expect(pending.engine.save()).rejects.toThrow();
  await expect(
    pending.engine.saveAs({ title: 'New', scope: { type: 'personal' } }),
  ).rejects.toThrow();
  expect(pending.host.instance!.save).not.toHaveBeenCalled();
  expect(pending.host.instance!.create).not.toHaveBeenCalled();
  expect(selected(pending.engine).writeError).toBeTruthy();
  expect(selected(pending.engine).requiresReload).toBe(false);
});

it('captures the submitted snapshot and revision while retaining subsequent edits', async () => {
  const response = deferred<WriteObservation<ViewInstance>>();
  const saveInstance = vi.fn(() => response.promise);
  const { engine } = setup({
    host: { instance: { save: saveInstance } } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('Submitted');
  const saving = engine.save();
  engine.setTitle('Latest');
  expect(saveInstance).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Submitted', revision: 'r1' }),
    expect.objectContaining({
      requestId: expect.any(String),
      signal: expect.any(AbortSignal),
    }),
  );
  response.resolve(
    committedWrite({ ...instance(), title: 'Submitted', revision: 'r2' }, 'r2'),
  );
  await saving;
  expect(selected(engine)).toMatchObject({
    baseline: { title: 'Submitted', revision: 'r2' },
    instance: { title: 'Latest', revision: 'r2' },
    dirty: true,
    writeStatus: 'idle',
    visibility: 'visible',
  });
  engine.setTitle('Submitted');
  expect(selected(engine).dirty).toBe(false);
});

it('accepts host metadata changes while requiring exact persisted title, scope and config', async () => {
  const { engine } = setup({
    host: {
      instance: {
        save: async value =>
          committedWrite(
            { ...value, revision: 'r2', updatedAt: 'today' },
            'r2',
          ),
        create: async value =>
          committedWrite(
            {
              ...value,
              id: 'created',
              createdAt: 'today',
              revision: 'created-r1',
            },
            'created-r1',
          ),
      },
    } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('Submitted');
  await engine.save();
  expect(selected(engine)).toMatchObject({
    dirty: false,
    requiresReload: false,
    instance: { updatedAt: 'today' },
    baseline: { updatedAt: 'today' },
  });
  await engine.saveAs({ title: 'Copy', scope: { type: 'personal' } });
  expect(selected(engine)).toMatchObject({
    dirty: false,
    requiresReload: false,
    instance: { createdAt: 'today' },
    baseline: { createdAt: 'today' },
  });
});

it('blocks same-instance concurrent writes and keeps ordinary failures visible without retrying', async () => {
  const response = deferred<WriteObservation<ViewInstance>>();
  const saveInstance = vi.fn(() => response.promise);
  const { engine, host } = setup({
    host: { instance: { save: saveInstance } } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('Keep draft');
  const saving = engine.save();
  await expect(
    engine.saveAs({ title: 'Duplicate', scope: { type: 'personal' } }),
  ).rejects.toThrow();
  expect(host.instance!.create).not.toHaveBeenCalled();
  response.resolve(rejectedWrite('REVISION_CONFLICT', 'conflict'));
  await expect(saving).rejects.toMatchObject({
    name: 'ViewServiceError',
    code: 'REVISION_CONFLICT',
    message: 'conflict',
  });
  expect(selected(engine)).toMatchObject({
    writeError: 'conflict',
    requiresReload: false,
    dirty: true,
    instance: { title: 'Keep draft' },
    baseline: { title: 'mine' },
  });
  expect(saveInstance).toHaveBeenCalledOnce();
});

it('requires explicit reload after a malformed or changed echo, preserving local edits against the loaded baseline', async () => {
  for (const response of [
    committedWrite({ ...instance(), title: 'normalized' }, 'r1'),
    committedWrite({ ...instance(), definitionId: 'foreign' }, 'r1'),
    committedWrite({ ...instance(), id: 'other' }, 'r1'),
    committedWrite({ ...instance(), kind: 'dashboard' }, 'r1'),
    committedWrite(null, 'r1'),
    committedWrite({ ...instance(), title: 'My draft' }, 'r2'),
    { outcome: 'committed', value: instance(), revision: 'r1' },
    null,
  ]) {
    const saveInstance = vi.fn().mockResolvedValue(response);
    const catalog = catalogHost([instance(), instance('shared')]);
    const loadInstance = vi
      .fn()
      .mockImplementationOnce(catalog.instance.load)
      .mockResolvedValue({
        ...instance(),
        title: 'Server title',
        revision: 'r9',
      });
    const { engine } = setup({
      instances: undefined,
      host: {
        instance: {
          list: catalog.instance.list,
          save: saveInstance,
          load: loadInstance,
        },
      } as unknown as ViewHost,
    });
    await engine.load();
    engine.setTitle('My draft');
    await expect(engine.save()).rejects.toThrow();
    expect(selected(engine)).toMatchObject({
      requiresReload: true,
      instance: { title: 'My draft' },
      baseline: { title: 'mine' },
    });
    await expect(engine.save()).rejects.toThrow();
    expect(saveInstance).toHaveBeenCalledOnce();
    const draft = newFilterNode(FilterOperator.EQ, 'state.amount');
    engine
      .record(engine.getSnapshot().selectedInstanceId!)
      .setFilterDraft(createFilterConfiguration(draft));
    engine
      .record(engine.getSnapshot().selectedInstanceId!)
      .setFilterValidity(false);
    await engine.reloadInstance();
    expect(selected(engine)).toMatchObject({
      requiresReload: false,
      dirty: true,
      filterDraft: { root: draft },
      filterPending: true,
      instance: { title: 'My draft', revision: 'r1' },
      baseline: { title: 'mine', revision: 'r1' },
      conflict: { remote: { title: 'Server title', revision: 'r9' } },
    });
  }
});

it('does not let a host mutate the write request to validate a changed echo', async () => {
  const { engine } = setup({
    host: {
      instance: {
        save: async value => {
          value.title = 'Mutated';
          return committedWrite(value, value.revision);
        },
      },
    } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('Submitted');
  await expect(engine.save()).rejects.toThrow();
  expect(selected(engine)).toMatchObject({
    requiresReload: true,
    baseline: { title: 'mine' },
    instance: { title: 'Submitted' },
  });
});

it('reload adopts server scope while preserving locally editable content', async () => {
  const saveInstance = vi.fn(async (value: ViewInstance) =>
    committedWrite({ ...value, revision: 'r10' }, 'r10'),
  );
  const catalog = catalogHost([instance(), instance('shared')]);
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: {
        list: catalog.instance.list,
        load: vi
          .fn()
          .mockImplementationOnce(catalog.instance.load)
          .mockResolvedValue({
            ...instance(),
            scope: { type: 'public', source: 'shared' },
            revision: 'r9',
          }),
        save: saveInstance,
      },
    } as unknown as ViewHost,
  });
  await engine.load();
  engine.setTitle('My draft');
  await engine.reloadInstance();
  expect(selected(engine)).toMatchObject({
    dirty: true,
    instance: {
      scope: { type: 'public', source: 'shared' },
      title: 'My draft',
      revision: 'r9',
    },
    baseline: { scope: { type: 'public', source: 'shared' }, revision: 'r9' },
  });
  await engine.save();
  expect(saveInstance.mock.calls[0][0].scope).toEqual({
    type: 'public',
    source: 'shared',
  });
  engine.dispose();
});
