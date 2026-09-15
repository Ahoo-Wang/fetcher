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
import { ViewEngine } from '../../src/engine/ViewEngine.js';
import { createFilterConfiguration } from '../../src/filter/filterCore.js';
import { filter } from '@ahoo-wang/fetcher-wow';
import { committedWrite } from '../../src/contracts/viewServiceContract.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import {
  setup,
  instance,
  definition,
  deleteReceipt,
  preferenceWrite,
  selected,
  managementPermissions,
} from './fixtures.js';

it.each(['rename', 'delete'] as const)(
  'isolates throwing subscribers during %s and releases the write lock',
  async operation => {
    const { engine, host } = setup();
    host.permission!.getInstance = managementPermissions;
    host.instance!.rename = vi.fn(async (id, title) =>
      committedWrite({ ...instance(id), title, revision: '2' }, '2'),
    );
    host.instance!.delete = vi.fn(async id => deleteReceipt(id));
    await engine.load();
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    const notified = vi.fn();
    const stop = engine.subscribe(() => {
      throw new Error('broken subscriber');
    });
    engine.subscribe(notified);
    await expect(
      operation === 'rename'
        ? engine.renameInstance('Renamed')
        : engine.deleteInstance(),
    ).resolves.toBeUndefined();
    expect(host.instance![operation]).toHaveBeenCalledOnce();
    expect(notified).toHaveBeenCalled();
    expect(report).toHaveBeenCalled();
    stop();
    await expect(engine.save()).resolves.toBeUndefined();
    engine.dispose();
  },
);

it('reads permissions synchronously, becomes ready without awaiting them and follows host notifications', async () => {
  const { host, paged } = setup();
  let ready = false;
  let notify: (() => void) | undefined;
  const refresh = vi.fn(async () => {});
  const subscribe = vi.fn((listener: () => void) => {
    notify = listener;
    return () => {
      notify = undefined;
    };
  });
  host.permission = {
    getInstance: () => ({ ...managementPermissions(), save: ready }),
    getDefinition: () => ({ reorder: ready, setDefault: ready }),
    subscribe,
    // Application-facing refresh of an HTTP permission client; never called by the engine.
    refresh,
  } as ViewHost['permission'];
  host.preference = {
    saveOrder: async () => preferenceWrite('mine'),
    saveDefault: async () => preferenceWrite('mine'),
  };
  const engine = new ViewEngine({
    definitionId: 'orders',
    definition,
    instances: [instance()],
    defaultInstanceId: 'mine',
    host,
  });
  expect(subscribe).toHaveBeenCalledOnce();
  await engine.load();
  expect(engine.getSnapshot().status).toBe('ready');
  expect(paged).toHaveBeenCalledOnce();
  expect(engine.getCapabilitiesSnapshot().instances.mine.permissions.save).toBe(
    false,
  );
  expect(engine.canReorderInstances()).toBe(false);
  expect(engine.canSetDefaultInstance()).toBe(false);
  const listener = vi.fn();
  engine.subscribe(listener);
  ready = true;
  notify!();
  expect(listener).toHaveBeenCalled();
  expect(engine.getCapabilitiesSnapshot().instances.mine.permissions.save).toBe(
    true,
  );
  expect(engine.canReorderInstances()).toBe(true);
  expect(engine.canSetDefaultInstance()).toBe(true);
  expect(refresh).not.toHaveBeenCalled();
  engine.dispose();
  expect(notify).toBeUndefined();
});

it('fails closed while a permission port throws and recovers once it answers', async () => {
  let offline = true;
  const { engine, host } = setup({
    host: {
      preference: { saveDefault: async () => preferenceWrite('shared') },
      permission: {
        getInstance: () => {
          if (offline) throw new Error('policy offline');
          return managementPermissions();
        },
        getDefinition: () => {
          if (offline) throw new Error('policy offline');
          return { setDefault: true };
        },
      },
    } as ViewHost,
  });
  await engine.load();
  expect(engine.getSnapshot().status).toBe('ready');
  expect(engine.getPermissions()).toEqual({
    save: false,
    saveAsPersonal: false,
    saveAsShared: false,
    delete: false,
    rename: false,
  });
  expect(engine.canSetDefaultInstance()).toBe(false);
  await expect(engine.save()).rejects.toThrow('未允许');
  await expect(engine.setDefaultInstance('shared')).rejects.toThrow(
    '默认视图保存接口',
  );
  expect(host.instance!.save).not.toHaveBeenCalled();
  offline = false;
  expect(engine.getPermissions().save).toBe(true);
  expect(engine.canSetDefaultInstance()).toBe(true);
  await engine.save();
  await engine.setDefaultInstance('shared');
  expect(engine.getSnapshot().defaultInstanceId).toBe('shared');
  engine.dispose();
});

it('does not recompile filters for selection, title or query status changes', async () => {
  const value = instance();
  value.config.filters = createFilterConfiguration({
    id: 'custom',
    operator: 'EQ',
    field: 'state.amount',
    component: { name: 'custom' },
    props: { value: 1 },
  });
  const compile = vi.fn((props: { value?: unknown }) =>
    filter.eq('state.amount', props.value),
  );
  const { engine } = setup({
    instances: [value],
    defaultInstanceId: 'mine',
    filterCompilers: { custom: { compile } },
  });
  await engine.load();
  compile.mockClear();
  engine.record(engine.getSnapshot().selectedInstanceId!).setSelection(['a']);
  engine.setTitle('new title');
  await engine.record(engine.getSnapshot().selectedInstanceId!).refresh();
  expect(compile).not.toHaveBeenCalled();
  expect(selected(engine).dirty).toBe(true);
  engine.record(engine.getSnapshot().selectedInstanceId!).setFilterDraft(
    createFilterConfiguration({
      ...selected(engine).filterDraft.root,
      props: { value: 2 },
    }),
  );
  expect(compile).toHaveBeenCalled();
  expect(selected(engine).filterPending).toBe(true);
  await engine.record(engine.getSnapshot().selectedInstanceId!).applyFilter();
  expect(selected(engine).filterPending).toBe(false);
  engine.dispose();
});

it.each(['paged', 'cursor'] as const)(
  'accepts a %s-only source and rejects unsupported modes before queries or summaries',
  async mode => {
    const request = vi.fn(async () =>
      mode === 'paged'
        ? { list: [], total: 0 }
        : { list: [], nextCursor: null },
    );
    const aggregate = vi.fn();
    const { engine, host } = setup({
      instances: [instance('mine', mode)],
      defaultInstanceId: 'mine',
    });
    host.resolveSource = () =>
      ({ [mode]: request, aggregate }) as ReturnType<
        Exclude<typeof host.resolveSource, undefined>
      >;
    await engine.load();
    expect(request).toHaveBeenCalledOnce();
    engine.dispose();
    const opposite = mode === 'paged' ? 'cursor' : 'paged';
    const unsupported = instance('mine', opposite);
    unsupported.config.presentation.table.columns = [
      { id: 'amount', kind: 'field', field: 'state.amount', summary: ['SUM'] },
    ];
    const other = setup({
      instances: [unsupported],
      defaultInstanceId: 'mine',
      host,
    });
    // The definition and catalog load; the unsupported mode fails the opened view's query.
    await other.engine.load();
    expect(other.engine.getSnapshot()).toMatchObject({
      status: 'ready',
      selectedInstanceId: 'mine',
    });
    expect(selected(other.engine)).toMatchObject({
      queryStatus: 'error',
      queryError: `数据源不支持 ${opposite} 分页查询`,
      rows: [],
    });
    expect(request).toHaveBeenCalledOnce();
    expect(aggregate).not.toHaveBeenCalled();
    other.engine.dispose();
  },
);
