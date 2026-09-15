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
import { IndexedDBViewHost } from '../src/record/IndexedDBViewHost.js';
import { ABSENT_PRECONDITION } from '../src/contracts/viewServiceContract.js';
import { definition, instance, setup } from './fixtures/viewPage.js';

afterEach(() => vi.unstubAllGlobals());
it('reports database access failure and rejects pre-aborted work without opening storage', async () => {
  const open = vi.fn(() => {
    throw new Error('database unavailable');
  });
  vi.stubGlobal('indexedDB', { open });
  const host = new IndexedDBViewHost({
    serviceKey: 'test',
    scopeKey: 'alice',
    definition,
    instances: [instance],
    defaultInstanceId: instance.id,
    resolveSource: setup().host.resolveSource,
  });
  await expect(host.instance.load(instance.id)).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
  const controller = new AbortController();
  controller.abort();
  await expect(
    host.instance.load(instance.id, { signal: controller.signal }),
  ).rejects.toBe(controller.signal.reason);
  expect(open).toHaveBeenCalledTimes(1);
});

// Drive the native event boundary explicitly; cross-process storage behavior is tested in the browser verifier.
function databasePort(raw?: string | null) {
  const read = { result: raw } as IDBRequest;
  const store = { get: vi.fn(() => read), put: vi.fn() };
  const transaction = {
    objectStore: vi.fn(() => store),
    abort: vi.fn(),
  } as unknown as IDBTransaction;
  const connection = {
    transaction: vi.fn(() => transaction),
    close: vi.fn(),
    createObjectStore: vi.fn(),
  };
  const request = { result: connection } as unknown as IDBOpenDBRequest;
  vi.stubGlobal('indexedDB', { open: vi.fn(() => request) });
  return {
    request,
    read,
    store,
    transaction,
    connection,
    open: () => request.onsuccess!.call(request, new Event('success')),
    readSuccess: () => read.onsuccess!.call(read, new Event('success')),
    commit: () =>
      transaction.oncomplete!.call(transaction, new Event('complete')),
    rollback: () => transaction.onabort!.call(transaction, new Event('abort')),
  };
}
function createHost() {
  return new IndexedDBViewHost({
    serviceKey: 'test',
    scopeKey: 'alice',
    definition,
    instances: [instance],
    defaultInstanceId: instance.id,
    resolveSource: setup().host.resolveSource,
  });
}
it('returns a loaded snapshot only after the database transaction commits', async () => {
  const db = databasePort();
  const done = vi.fn();
  const pending = createHost().instance.load(instance.id).then(done);
  db.request.onupgradeneeded!.call(
    db.request,
    new Event('upgradeneeded') as IDBVersionChangeEvent,
  );
  expect(db.connection.createObjectStore).toHaveBeenCalledWith('states');
  db.open();
  db.readSuccess();
  expect(db.store.put).toHaveBeenCalledOnce();
  await Promise.resolve();
  expect(done).not.toHaveBeenCalled();
  db.commit();
  await pending;
  expect(done).toHaveBeenCalledWith(
    expect.objectContaining({ id: instance.id }),
  );
  expect(db.connection.close).toHaveBeenCalledOnce();
});
it('commits an explicit reset tombstone', async () => {
  const db = databasePort(null);
  const pending = createHost().reset();
  db.open();
  db.readSuccess();
  expect(db.store.put).toHaveBeenCalledWith(null, expect.any(String));
  db.commit();
  await pending;
});
it('closes the connection on a version change without resolving before commit', async () => {
  const db = databasePort();
  const done = vi.fn();
  const pending = createHost().instance.load(instance.id).then(done);
  db.open();
  db.readSuccess();
  const connection = db.request.result;
  connection.onversionchange!.call(
    connection,
    new Event('versionchange') as IDBVersionChangeEvent,
  );
  expect(db.connection.close).toHaveBeenCalledOnce();
  await Promise.resolve();
  expect(done).not.toHaveBeenCalled();
  db.commit();
  await pending;
  expect(done).toHaveBeenCalledWith(
    expect.objectContaining({ id: instance.id }),
  );
});
it('reports a transaction startup failure and closes the connection', async () => {
  const db = databasePort();
  db.connection.transaction.mockImplementation(() => {
    throw new DOMException('connection closing', 'InvalidStateError');
  });
  const pending = createHost().instance.load(instance.id);
  const rejected = expect(pending).rejects.toMatchObject({
    code: 'UNAVAILABLE',
    message: 'InvalidStateError: connection closing',
  });
  db.open();
  await rejected;
  expect(db.store.get).not.toHaveBeenCalled();
  expect(db.connection.close).toHaveBeenCalledOnce();
});
it('rejects a native commit failure even after the write request succeeds', async () => {
  const db = databasePort();
  const pending = createHost().instance.load(instance.id);
  const rejected = expect(pending).rejects.toMatchObject({
    code: 'UNAVAILABLE',
    message: 'QuotaExceededError: disk full',
  });
  db.open();
  db.readSuccess();
  expect(db.store.put).toHaveBeenCalledOnce();
  Object.defineProperty(db.transaction, 'error', {
    value: new DOMException('disk full', 'QuotaExceededError'),
  });
  db.rollback();
  await rejected;
  expect(db.connection.close).toHaveBeenCalledOnce();
});
it('keeps a committed result when cancellation arrives before the complete event', async () => {
  const db = databasePort();
  const controller = new AbortController();
  const pending = createHost().instance.load(instance.id, {
    signal: controller.signal,
  });
  db.open();
  db.readSuccess();
  vi.mocked(db.transaction.abort).mockImplementation(() => {
    throw new DOMException('already committed', 'InvalidStateError');
  });
  controller.abort();
  expect(db.transaction.abort).toHaveBeenCalledOnce();
  db.commit();
  await expect(pending).resolves.toMatchObject({ id: instance.id });
  expect(db.connection.close).toHaveBeenCalledOnce();
});
it('keeps the first open failure when a blocked request subsequently errors', async () => {
  const db = databasePort();
  const pending = createHost().instance.load(instance.id);
  const rejected = expect(pending).rejects.toMatchObject({
    code: 'UNAVAILABLE',
    message: '视图数据库被旧连接阻塞，请关闭旧页面后重试',
  });
  db.request.onblocked!.call(
    db.request,
    new Event('blocked') as IDBVersionChangeEvent,
  );
  db.request.onerror!.call(db.request, new Event('error'));
  await rejected;
  expect(db.connection.transaction).not.toHaveBeenCalled();
});
it('reports write failures only after rollback', async () => {
  const db = databasePort();
  db.store.put.mockImplementation(() => {
    throw new Error('denied');
  });
  const pending = createHost().instance.load(instance.id);
  const rejected = expect(pending).rejects.toMatchObject({
    code: 'UNAVAILABLE',
    message: 'denied',
  });
  db.open();
  db.readSuccess();
  expect(db.transaction.abort).toHaveBeenCalledOnce();
  db.rollback();
  await rejected;
  expect(db.connection.close).toHaveBeenCalledOnce();
});
it('preserves domain errors when aborting a transaction', async () => {
  const db = databasePort();
  const pending = createHost().instance.load('absent');
  const rejected = expect(pending).rejects.toMatchObject({ code: 'NOT_FOUND' });
  db.open();
  db.readSuccess();
  expect(db.store.put).not.toHaveBeenCalled();
  db.rollback();
  await rejected;
});
it('waits for transaction rollback before reporting cancellation', async () => {
  const db = databasePort();
  const controller = new AbortController();
  const pending = createHost().instance.load(instance.id, {
    signal: controller.signal,
  });
  const settled = vi.fn();
  void pending.then(settled, settled);
  db.open();
  controller.abort();
  const rejected = expect(pending).rejects.toBe(controller.signal.reason);
  expect(db.transaction.abort).toHaveBeenCalledOnce();
  await Promise.resolve();
  expect(settled).not.toHaveBeenCalled();
  db.rollback();
  await rejected;
  expect(db.store.put).not.toHaveBeenCalled();
});
it('closes an opening connection that arrives after cancellation', async () => {
  const db = databasePort();
  const controller = new AbortController();
  const pending = createHost().instance.load(instance.id, {
    signal: controller.signal,
  });
  controller.abort();
  await expect(pending).rejects.toBe(controller.signal.reason);
  db.open();
  expect(db.connection.close).toHaveBeenCalledOnce();
  expect(db.connection.transaction).not.toHaveBeenCalled();
});
it.each(['blocked', 'error'] as const)(
  'reports an open %s and closes any late connection',
  async event => {
    const db = databasePort();
    const pending = createHost().instance.load(instance.id);
    const rejected = expect(pending).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    });
    if (event === 'blocked')
      db.request.onblocked!.call(
        db.request,
        new Event('blocked') as IDBVersionChangeEvent,
      );
    else db.request.onerror!.call(db.request, new Event('error'));
    await rejected;
    db.open();
    expect(db.connection.close).toHaveBeenCalledOnce();
    expect(db.connection.transaction).not.toHaveBeenCalled();
  },
);

it('commits a cleared default, restores it in a fresh host and replays the receipt without writing', async () => {
  const db = databasePort();
  const done = vi.fn();
  const pending = createHost()
    .preference.saveDefault(definition.id, null, ABSENT_PRECONDITION, {
      requestId: 'clear-default',
    })
    .then(done);
  db.open();
  db.readSuccess();
  const raw = db.store.put.mock.calls[0][0];
  expect(JSON.parse(raw).preferences.alice).toMatchObject({
    revision: expect.any(String),
    order: [],
    defaultInstanceId: null,
  });
  await Promise.resolve();
  expect(done).not.toHaveBeenCalled();
  db.commit();
  await pending;
  expect(done).toHaveBeenCalledOnce();
  const observation = done.mock.calls[0][0];
  expect(observation).toMatchObject({
    outcome: 'committed',
    value: { defaultInstanceId: null, effectiveDefaultInstanceId: null },
  });
  const restored = databasePort(raw);
  const loaded = createHost().preference.load(definition.id);
  restored.open();
  restored.readSuccess();
  expect(restored.store.put).not.toHaveBeenCalled();
  restored.commit();
  await expect(loaded).resolves.toEqual({
    revision: observation.revision,
    order: [],
    defaultInstanceId: null,
    effectiveDefaultInstanceId: null,
  });
  // The same request identity returns the stored receipt; nothing is written again.
  const replayed = databasePort(raw);
  const replay = createHost().preference.saveDefault(
    definition.id,
    null,
    ABSENT_PRECONDITION,
    { requestId: 'clear-default' },
  );
  replayed.open();
  replayed.readSuccess();
  expect(replayed.store.put).not.toHaveBeenCalled();
  replayed.commit();
  await expect(replay).resolves.toEqual(observation);
});
it('resolves a domain rejection as an observation and commits without writing', async () => {
  const db = databasePort();
  const pending = createHost().instance.delete('absent', 'r1', {
    requestId: 'delete-absent',
  });
  db.open();
  db.readSuccess();
  // An expected domain failure persists nothing, not even the seed or a receipt.
  expect(db.store.put).not.toHaveBeenCalled();
  expect(db.transaction.abort).not.toHaveBeenCalled();
  db.commit();
  await expect(pending).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'NOT_FOUND' },
  });
  expect(db.connection.close).toHaveBeenCalledOnce();
});
it('resolves a rejected UNAVAILABLE observation when the write transaction aborts', async () => {
  const db = databasePort();
  db.store.put.mockImplementation(() => {
    throw new Error('denied');
  });
  const pending = createHost().preference.saveDefault(
    definition.id,
    null,
    ABSENT_PRECONDITION,
    { requestId: 'denied-default' },
  );
  db.open();
  db.readSuccess();
  expect(db.transaction.abort).toHaveBeenCalledOnce();
  db.rollback();
  await expect(pending).resolves.toMatchObject({
    outcome: 'rejected',
    issue: { code: 'UNAVAILABLE', message: 'denied' },
  });
  expect(db.connection.close).toHaveBeenCalledOnce();
});
