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
import { ViewServiceError } from '../../src/record/viewServiceContract.js';
import type { ViewInstance } from '../../src/contracts/viewModel.js';
import { instance, setup } from './fixtures.js';

it('does not revert a collaborator config change when the local user only changed title', async () => {
  const remote = instance();
  remote.revision = 'r2';
  remote.config.pagination.size = 50;
  const save = vi
    .fn<(value: ViewInstance) => Promise<ViewInstance>>()
    .mockRejectedValueOnce(
      new ViewServiceError('REVISION_CONFLICT', 'Version changed'),
    )
    .mockImplementation(async value => ({ ...value, revision: 'r3' }));
  const runtime = setup({
    host: {
      resolveSource: () => ({
        paged: async () => ({
          list: [{ state: { id: 'a', amount: 10 } }],
          total: 1,
        }),
      }),
      instance: { load: async () => remote, save },
    },
  });
  try {
    await runtime.engine.load();
    runtime.engine.setTitle('Only my title changed');
    await expect(runtime.engine.save()).rejects.toThrow('Version changed');
    await runtime.engine.reloadInstance();
    const session = runtime.engine.getSnapshot().sessions.mine;
    expect(session.baseline.config.pagination.size).toBe(10);
    expect(session.conflict?.remote.config.pagination.size).toBe(50);
    expect(session.instance.revision).toBe('r1');
    await expect(runtime.engine.save()).rejects.toThrow('冲突');
    expect(save).toHaveBeenCalledTimes(1);
    await runtime.engine.useRemoteInstance(session.conflict!, 'mine');
    expect(
      runtime.engine.getSnapshot().sessions.mine.instance.config.pagination
        .size,
    ).toBe(50);
    expect(save).toHaveBeenCalledTimes(1);
  } finally {
    runtime.engine.dispose();
  }
});

it('binds overwrite to the reviewed local draft and remote revision', async () => {
  let remote = { ...instance(), title: 'Remote', revision: 'r2' };
  const { engine, host } = setup({
    host: { instance: { load: async () => remote } } as never,
  });
  await engine.load();
  engine.setTitle('Local');
  await engine.reloadInstance();
  const review = engine.getSnapshot().sessions.mine.conflict!;
  engine.setTitle('Newer local edit');
  await expect(engine.overwriteInstance(review, 'mine')).rejects.toThrow(
    '重新确认',
  );
  await expect(engine.useRemoteInstance(review, 'mine')).rejects.toThrow(
    '重新确认',
  );
  expect(host.instance!.save).not.toHaveBeenCalled();
  const newer = engine.getSnapshot().sessions.mine.conflict!;
  remote = { ...remote, title: 'Latest remote', revision: 'r3' };
  await engine.reloadInstance();
  await expect(engine.overwriteInstance(newer, 'mine')).rejects.toThrow(
    '重新确认',
  );
  const current = engine.getSnapshot().sessions.mine.conflict!;
  await engine.overwriteInstance(current, 'mine');
  expect(host.instance!.save).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Newer local edit', revision: 'r3' }),
  );
  expect(engine.getSnapshot().sessions.mine.conflict).toBeUndefined();
  engine.dispose();
});

it('accepts remote-only changes and unchanged remote content without conflicts', async () => {
  let remote = { ...instance(), title: 'Remote', revision: 'r2' };
  const { engine } = setup({
    host: { instance: { load: async () => remote } } as never,
  });
  await engine.load();
  await engine.reloadInstance();
  expect(engine.getSnapshot().sessions.mine.instance.title).toBe('Remote');
  engine.setTitle('Local');
  remote = { ...remote, revision: 'r3' };
  await engine.reloadInstance();
  expect(engine.getSnapshot().sessions.mine).toMatchObject({
    instance: { title: 'Local', revision: 'r3' },
    baseline: remote,
  });
  expect(engine.getSnapshot().sessions.mine.conflict).toBeUndefined();
  engine.dispose();
});

it('permits save-as during a known conflict but denies overwrite after permission loss', async () => {
  const remote = { ...instance(), title: 'Remote', revision: 'r2' };
  let canSave = true;
  const { engine, host } = setup({
    host: {
      instance: { load: async () => remote },
      permission: {
        getInstance: () => ({
          save: canSave,
          saveAsPersonal: true,
          saveAsShared: false,
        }),
      },
    } as never,
  });
  await engine.load();
  engine.setTitle('Local');
  await engine.reloadInstance();
  const review = engine.getSnapshot().sessions.mine.conflict!;
  canSave = false;
  await expect(engine.overwriteInstance(review, 'mine')).rejects.toThrow(
    '未允许',
  );
  expect(host.instance!.save).not.toHaveBeenCalled();
  await engine.saveAs(
    { title: 'My copy', scope: { type: 'personal' } },
    'mine',
  );
  expect(engine.getSnapshot().sessions.created.instance.title).toBe('My copy');
  expect(engine.getSnapshot().sessions.mine.conflict).toBeDefined();
  engine.dispose();
});

it('binds resolution to raw filter edits and accepts a later matching remote snapshot', async () => {
  let remote = { ...instance(), title: 'Remote', revision: 'r2' };
  const { engine } = setup({
    host: { instance: { load: async () => remote } } as never,
  });
  await engine.load();
  engine.setTitle('Local');
  await engine.reloadInstance();
  const review = engine.getSnapshot().sessions.mine.conflict!;
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setFilterValidity(false);
  await expect(engine.useRemoteInstance(review, 'mine')).rejects.toThrow(
    '重新确认',
  );
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setFilterValidity(true);
  remote = { ...remote, title: 'Local', revision: 'r3' };
  await engine.reloadInstance();
  expect(engine.getSnapshot().sessions.mine.conflict).toBeUndefined();
  expect(engine.getSnapshot().sessions.mine.baseline.revision).toBe('r3');
  engine.dispose();
});

it('invalidates a reviewed decision even when later edits return to the same content', async () => {
  const { engine } = setup({
    host: {
      instance: {
        load: async () => ({ ...instance(), title: 'Remote', revision: 'r2' }),
      },
    } as never,
  });
  await engine.load();
  engine.setTitle('Local');
  await engine.reloadInstance();
  const review = engine.getSnapshot().sessions.mine.conflict!;
  engine.setTitle('Temporary');
  engine.setTitle('Local');
  await expect(engine.useRemoteInstance(review, 'mine')).rejects.toThrow(
    '重新确认',
  );
  expect(
    engine.getSnapshot().sessions.mine.conflict!.editVersion,
  ).toBeGreaterThan(review.editVersion);
  engine.dispose();
});

it('keeps buffered filter invalidity when accepting remote metadata', async () => {
  const remote = { ...instance(), title: 'Remote', revision: 'r2' };
  const { engine } = setup({
    host: { instance: { load: async () => remote } } as never,
  });
  try {
    await engine.load();
    engine.record('mine').setFilterValidity(false);
    await engine.reloadInstance();
    const review = engine.getSnapshot().sessions.mine.conflict!;
    expect(review).toBeDefined();
    await engine.useRemoteInstance(review, 'mine');
    expect(engine.getSnapshot().sessions.mine.filterValid).toBe(false);
    expect(engine.getSnapshot().sessions.mine.queryStatus).not.toBe('loading');
    engine.record('mine').setFilterValidity(true);
    expect(engine.getSnapshot().sessions.mine.filterValid).toBe(true);
  } finally {
    engine.dispose();
  }
});
