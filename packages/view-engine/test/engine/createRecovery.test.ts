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

import { afterEach, expect, it, vi } from 'vitest';
import { ViewEngine } from '../../src/engine/ViewEngine.js';
import { MemoryViewHost } from '../../src/record/MemoryViewHost.js';
import {
  ViewServiceError,
  rejectedWrite,
  type ConfigurationWriteContext,
  type ListOptions,
  type Page,
  type WriteObservation,
} from '../../src/contracts/viewServiceContract.js';
import type {
  ViewCreateInput,
  ViewInstance,
  ViewInstanceSummary,
} from '../../src/contracts/viewModel.js';
import type { ViewHost } from '../../src/contracts/ViewHost.js';
import { definition, instance, deferred } from './fixtures.js';
const engines: ViewEngine[] = [];
afterEach(() => {
  for (const engine of engines.splice(0)) engine.dispose();
});
function service(defaultInstanceId: string | null = 'mine') {
  const values = new Map<string, string>();
  return new MemoryViewHost({
    serviceKey: 'recover',
    scopeKey: 'alice',
    definition,
    instances: [instance()],
    defaultInstanceId,
    store: values,
    resolveSource: () => ({ paged: async () => ({ list: [], total: 0 }) }),
  });
}
function engineFor(host: ViewHost) {
  const engine = new ViewEngine({ definitionId: definition.id, host });
  engines.push(engine);
  return engine;
}
/** The committed value of a host observation; anything else fails the test. */
function committed<T>(observation: WriteObservation<T>): T {
  if (observation.outcome !== 'committed')
    throw new Error(`unexpected outcome ${observation.outcome}`);
  return observation.value;
}
async function titled(host: MemoryViewHost, title: string) {
  return (await host.instance.list(definition.id)).items.filter(
    item => item.title === title,
  );
}
const copyOptions = {
  title: 'Shared copy',
  scope: { type: 'public', source: 'shared' } as const,
};
it('confirms an unknown creation by the same request, never by another identical instance', async () => {
  const host = service();
  let submitted!: ViewCreateInput, context!: ConfigurationWriteContext;
  const create = vi.fn(
    async (input: ViewCreateInput, ctx: ConfigurationWriteContext) => {
      if (create.mock.calls.length === 1) {
        submitted = input;
        context = ctx;
        throw new ViewServiceError('UNKNOWN_OUTCOME', 'response missing');
      }
      return host.instance.create(input, ctx);
    },
  );
  const engine = engineFor({
    ...host,
    instance: { ...host.instance, create },
    resolveSource: id => host.resolveSource(id),
  });
  await engine.load();
  await expect(engine.saveAs(copyOptions)).rejects.toThrow('response missing');
  const other = committed(
    await host.instance.create(submitted, { requestId: 'another-request' }),
  );
  await engine.reloadInstance();
  const own = committed(await host.instance.create(submitted, context));
  expect(engine.getSnapshot().selectedInstanceId).toBe(own.id);
  expect(own.id).not.toBe(other.id);
  expect(create.mock.calls[1][1].requestId).toBe(context.requestId);
  expect(engine.getSnapshot().sessions.mine.requiresReload).toBe(false);
});
it('retains the original idempotency key after a denied retry of an uncertain creation', async () => {
  const host = service();
  const create = vi.fn(
    async (input: ViewCreateInput, ctx: ConfigurationWriteContext) => {
      const call = create.mock.calls.length;
      if (call === 2)
        return rejectedWrite<ViewInstance>('FORBIDDEN', 'revoked');
      const created = await host.instance.create(input, ctx);
      if (call === 1)
        throw new ViewServiceError('UNKNOWN_OUTCOME', 'response missing');
      return created;
    },
  );
  const engine = engineFor({
    ...host,
    instance: { ...host.instance, create },
    resolveSource: id => host.resolveSource(id),
  });
  await engine.load();
  await expect(engine.saveAs(copyOptions)).rejects.toThrow('response missing');
  await expect(engine.saveAs(copyOptions)).rejects.toThrow('revoked');
  expect(engine.getSnapshot().sessions.mine.requiresReload).toBe(true);
  await engine.saveAs(copyOptions);
  expect(new Set(create.mock.calls.map(([, ctx]) => ctx.requestId)).size).toBe(
    1,
  );
  expect(await titled(host, copyOptions.title)).toHaveLength(1);
});
it.each([false, true])(
  'keeps original create retry usable after full load (committed=%s)',
  async committedFirst => {
    const host = service();
    const create = vi.fn(
      async (input: ViewCreateInput, ctx: ConfigurationWriteContext) => {
        if (create.mock.calls.length === 1) {
          if (committedFirst) await host.instance.create(input, ctx);
          throw new ViewServiceError('UNAVAILABLE', 'try again');
        }
        return host.instance.create(input, ctx);
      },
    );
    const engine = engineFor({
      ...host,
      instance: { ...host.instance, create },
      resolveSource: id => host.resolveSource(id),
    });
    await engine.load();
    await expect(engine.saveAs(copyOptions)).rejects.toThrow();
    await engine.load();
    await engine.saveAs(copyOptions);
    expect(create.mock.calls[0][1].requestId).toBe(
      create.mock.calls[1][1].requestId,
    );
    expect(new Set(engine.getSnapshot().instanceIds).size).toBe(
      engine.getSnapshot().instanceIds.length,
    );
    expect(await titled(host, copyOptions.title)).toHaveLength(1);
    expect(engine.getSnapshot().sessions.mine.requiresReload).toBe(false);
  },
);
it('replays an invalid create response with its original key and preserves newer source edits', async () => {
  const host = service();
  const create = vi.fn(
    async (input: ViewCreateInput, ctx: ConfigurationWriteContext) => {
      const created = await host.instance.create(input, ctx);
      return create.mock.calls.length === 1
        ? ({ ...created, value: null } as unknown as typeof created)
        : created;
    },
  );
  const engine = engineFor({
    ...host,
    instance: { ...host.instance, create },
    resolveSource: id => host.resolveSource(id),
  });
  await engine.load();
  await expect(engine.saveAs(copyOptions)).rejects.toThrow();
  engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .setColumns([
      { id: 'amount', kind: 'field', field: 'state.amount', width: 321 },
    ]);
  await engine.reloadInstance();
  expect(create.mock.calls[0][1].requestId).toBe(
    create.mock.calls[1][1].requestId,
  );
  const state = engine.getSnapshot(),
    created = state.sessions[state.selectedInstanceId!];
  expect(created.instance.config.presentation.table.columns[0].width).toBe(321);
  expect(created.dirty).toBe(true);
  expect((await host.instance.list(definition.id)).items).toHaveLength(2);
});
it('finishes a lost deletion response by idempotent retry', async () => {
  const host = service();
  let first = true;
  const engine = engineFor({
    ...host,
    instance: {
      ...host.instance,
      delete: async (id, revision, context) => {
        const result = await host.instance.delete(id, revision, context);
        if (first) {
          first = false;
          throw new ViewServiceError(
            'UNKNOWN_OUTCOME',
            'deleted response missing',
          );
        }
        return result;
      },
    },
    resolveSource: id => host.resolveSource(id),
  });
  await engine.load();
  await expect(engine.deleteInstance()).rejects.toThrow(
    'deleted response missing',
  );
  expect(engine.getCapabilitiesSnapshot().instances.mine.retryDelete).toBe(
    true,
  );
  await engine.deleteInstance();
  expect(engine.getSnapshot().instanceIds).toEqual([]);
  expect(engine.getSnapshot().selectedInstanceId).toBeNull();
  expect((await host.instance.list(definition.id)).items).toEqual([]);
});
it('preserves explicit no-default preference across creation and host-backed loading', async () => {
  const host = service(null),
    engine = engineFor(host);
  await engine.load();
  expect(engine.getSnapshot()).toMatchObject({
    selectedInstanceId: null,
    defaultInstanceId: null,
    preference: { status: 'ready', revision: null },
  });
  const { definitionId, kind, scope, config } = instance();
  committed(
    await host.instance.create(
      { definitionId, kind, scope, config, title: 'new' },
      { requestId: 'new' },
    ),
  );
  expect(await host.preference.load(definition.id)).toMatchObject({
    defaultInstanceId: null,
    effectiveDefaultInstanceId: null,
  });
  await engine.load();
  expect(engine.getSnapshot().selectedInstanceId).toBeNull();
});

it('retains creation identity when a full load overlaps the original response', async () => {
  const host = service();
  const response = deferred<WriteObservation<ViewInstance>>();
  let persisted: ViewInstance | undefined;
  const create = vi.fn(
    async (input: ViewCreateInput, ctx: ConfigurationWriteContext) => {
      const result = await host.instance.create(input, ctx);
      if (create.mock.calls.length === 1) {
        persisted = committed(result);
        return response.promise;
      }
      return result;
    },
  );
  const engine = engineFor({
    ...host,
    instance: { ...host.instance, create },
    resolveSource: id => host.resolveSource(id),
  });
  await engine.load();
  const saving = engine.saveAs(copyOptions);
  await vi.waitFor(() => expect(persisted).toBeDefined());
  await engine.load();
  response.resolve(
    await host.instance.create(
      create.mock.calls[0][0],
      create.mock.calls[0][1],
    ),
  );
  await saving;
  await engine.reloadInstance();
  expect(engine.getSnapshot().selectedInstanceId).toBe(persisted!.id);
  expect(create.mock.calls[0][1].requestId).toBe(
    create.mock.calls[1][1].requestId,
  );
  expect(engine.getSnapshot().sessions.mine.requiresReload).toBe(false);
});

it.each(['loading', 'loaded'] as const)(
  'clears a definitively rejected original create after the source is %s again',
  async timing => {
    const host = service();
    const response = deferred<WriteObservation<ViewInstance>>();
    const listing = deferred<Page<ViewInstanceSummary>>();
    let blockListing = false;
    const create = vi.fn(
      (input: ViewCreateInput, context: ConfigurationWriteContext) =>
        create.mock.calls.length === 1
          ? response.promise
          : host.instance.create(input, context),
    );
    const engine = engineFor({
      ...host,
      instance: {
        ...host.instance,
        create,
        list: (id: string, options?: ListOptions) =>
          blockListing ? listing.promise : host.instance.list(id, options),
      },
      resolveSource: id => host.resolveSource(id),
    });
    await engine.load();
    const saving = engine.saveAs(copyOptions);
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    blockListing = timing === 'loading';
    const reloading = engine.load();
    if (timing === 'loaded') {
      await reloading;
      expect(engine.getSnapshot().sessions.mine.requiresReload).toBe(true);
    }
    response.resolve(rejectedWrite('FORBIDDEN', 'create denied'));
    await saving;
    blockListing = false;
    listing.resolve(await host.instance.list(definition.id));
    await reloading;
    expect(engine.getSnapshot().sessions.mine.requiresReload).toBe(false);
    expect(engine.getSnapshot().sessions.mine.writeError).toBeNull();
    await engine.saveAs({ ...copyOptions, title: 'Allowed copy' });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][1].requestId).not.toBe(
      create.mock.calls[0][1].requestId,
    );
    expect((await host.instance.list(definition.id)).items).toHaveLength(2);
  },
);

it('preserves edits to an existing copy made by synchronous query-cancellation observers', async () => {
  const host = service();
  const pending = deferred<{ list: never[]; total: number }>(),
    started = deferred<void>();
  let block = false;
  const create = vi.fn(
    async (input: ViewCreateInput, ctx: ConfigurationWriteContext) => {
      const result = await host.instance.create(input, ctx);
      if (create.mock.calls.length === 1)
        throw new ViewServiceError('UNKNOWN_OUTCOME', 'lost');
      return result;
    },
  );
  const engine = engineFor({
    ...host,
    instance: { ...host.instance, create },
    resolveSource: () => ({
      paged: async () => {
        if (block) {
          started.resolve();
          return pending.promise;
        }
        return { list: [], total: 0 };
      },
    }),
  });
  await engine.load();
  await expect(engine.saveAs(copyOptions)).rejects.toThrow('lost');
  await engine.load();
  const copyId = engine.getSnapshot().instanceIds.find(id => id !== 'mine')!;
  // The copy is listed after the reload; open it so it holds independent edits.
  await engine.selectInstance(copyId);
  await engine.selectInstance('mine');
  block = true;
  const reading = engine
    .record(engine.getSnapshot().selectedInstanceId!)
    .refresh();
  await started.promise;
  let edited = false;
  const stop = engine.subscribe(() => {
    const source = engine.getSnapshot().sessions.mine;
    if (
      !edited &&
      source.queryStatus === 'idle' &&
      source.writeStatus === 'creating'
    ) {
      edited = true;
      block = false;
      engine.setTitle('Newer independent edit', copyId);
    }
  });
  try {
    await engine.saveAs(copyOptions);
    expect(edited).toBe(true);
    expect(engine.getSnapshot().sessions[copyId].instance.title).toBe(
      'Newer independent edit',
    );
  } finally {
    stop();
    pending.resolve({ list: [], total: 0 });
    await reading;
  }
});
