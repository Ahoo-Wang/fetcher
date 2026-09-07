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

// Run after building the package: node packages/view-engine/examples/core.mjs
import assert from 'node:assert/strict';
import {
  ViewEngine,
  compileFilterDraft,
  newFilterDraft,
} from '@ahoo-wang/fetcher-view-engine';

const definition = {
  id: 'orders',
  title: 'Orders',
  sourceId: 'orders',
  rowKey: 'id',
  allowedOperators: ['MATCH_ALL', 'GTE'],
  fields: [
    { field: 'id', label: 'Order', type: 'string' },
    { field: 'amount', label: 'Amount', type: 'number', operators: ['GTE'] },
  ],
};
const initial = {
  id: 'mine',
  definitionId: definition.id,
  title: 'My orders',
  kind: 'record',
  scope: { type: 'personal' },
  revision: '1',
  config: {
    filter: { op: 'MATCH_ALL' },
    sort: [],
    pagination: { mode: 'paged', size: 2 },
    presentation: {
      layout: 'table',
      table: {
        columns: [
          { id: 'id', kind: 'field', field: 'id' },
          { id: 'amount', kind: 'field', field: 'amount' },
        ],
      },
    },
  },
};
const records = [
  { id: 'order-1', amount: 10 },
  { id: 'order-2', amount: 30 },
  { id: 'order-3', amount: 50 },
];
const saved = new Map([[initial.id, structuredClone(initial)]]);
const queries = [];
const writes = [];
let delayedQuery;
function deferred() {
  let resolve;
  const promise = new Promise(complete => {
    resolve = complete;
  });
  return { promise, resolve };
}
const source = {
  async paged(query, _attributes, controller) {
    controller?.signal.throwIfAborted();
    queries.push(structuredClone(query));
    if (delayedQuery) {
      const pending = delayedQuery;
      delayedQuery = undefined;
      pending.started.resolve(controller);
      // Deliberately complete after abort to exercise the public lifecycle guard.
      return pending.result.promise;
    }
    // ponytail: this local demo supports only MATCH_ALL/GTE; use a QueryApi for a full backend.
    assert.ok(['MATCH_ALL', 'GTE'].includes(query.filter.op));
    const matched = records.filter(
      record =>
        query.filter.op === 'MATCH_ALL' || record.amount >= query.filter.value,
    );
    const { index, size } = query.pagination;
    return {
      total: matched.length,
      list: structuredClone(matched.slice((index - 1) * size, index * size)),
    };
  },
  async cursor() {
    throw new Error('This example uses paged records.');
  },
};
const host = {
  async loadDefinition(id) {
    assert.equal(id, definition.id);
    return structuredClone(definition);
  },
  async listInstances(id) {
    assert.equal(id, definition.id);
    return {
      instances: [...saved.values()].map(value => structuredClone(value)),
      defaultInstanceId: initial.id,
    };
  },
  async loadInstance(id) {
    assert.ok(saved.has(id));
    return structuredClone(saved.get(id));
  },
  resolveSource(id) {
    assert.equal(id, definition.sourceId);
    return source;
  },
  getInstancePermissions() {
    return { save: true, saveAsPersonal: true, saveAsShared: true };
  },
  async saveInstance(instance) {
    assert.equal(instance.revision, saved.get(instance.id).revision);
    const next = {
      ...structuredClone(instance),
      revision: String(Number(instance.revision) + 1),
    };
    saved.set(next.id, next);
    writes.push('save');
    return structuredClone(next);
  },
  async createInstance(instance) {
    assert.equal('id' in instance, false);
    assert.equal('revision' in instance, false);
    const created = {
      ...structuredClone(instance),
      id: 'shared-copy',
      revision: '1',
    };
    saved.set(created.id, created);
    writes.push('create');
    return structuredClone(created);
  },
};
const engine = new ViewEngine({ definitionId: definition.id, host });
const session = () => {
  const state = engine.getSnapshot();
  return state.sessions[state.selectedInstanceId];
};
let notifications = 0;
const unsubscribe = engine.subscribe(() => {
  notifications++;
});
try {
  await engine.load();
  assert.equal(engine.getSnapshot().status, 'ready');
  assert.equal(engine.getSnapshot().selectedInstanceId, initial.id);
  assert.deepEqual(
    session().rows.map(row => row.id),
    ['order-1', 'order-2'],
  );
  assert.equal(session().total, 3);
  assert.equal(queries.length, 1);
  assert.ok(notifications > 0);
  assert.throws(() => {
    session().rows[0].amount = 999;
  }, TypeError);
  assert.equal(records[0].amount, 10);

  // An intentionally unset numeric control is valid and remains in the editor baseline.
  const unset = newFilterDraft('GTE', 'amount');
  const compiledUnset = compileFilterDraft(
    unset,
    definition.fields,
    definition.allowedOperators,
  );
  assert.deepEqual(compiledUnset, {
    expression: { op: 'MATCH_ALL' },
    errors: [],
  });
  engine.setFilterDraft(unset, undefined, true);
  assert.equal(session().filterPending, true);
  await engine.applyFilter(compiledUnset.expression);
  assert.equal(session().filterDraft.op, 'GTE');
  assert.equal(session().filterDraft.value, undefined);
  assert.equal(session().filterPending, false);

  const invalid = { ...unset, value: 'not-a-number' };
  const compiledInvalid = compileFilterDraft(
    invalid,
    definition.fields,
    definition.allowedOperators,
  );
  assert.ok(compiledInvalid.errors.length > 0);
  assert.equal(compiledInvalid.expression, undefined);
  engine.setFilterDraft(invalid, undefined, false);
  const callsBeforeInvalid = queries.length;
  await assert.rejects(engine.applyFilter({ op: 'MATCH_ALL' }));
  await assert.rejects(engine.save());
  assert.equal(queries.length, callsBeforeInvalid);
  assert.deepEqual(writes, []);

  const valid = { ...unset, value: 25 };
  engine.setFilterDraft(valid, undefined, true);
  const compiled = compileFilterDraft(
    valid,
    definition.fields,
    definition.allowedOperators,
  );
  assert.deepEqual(compiled.errors, []);
  await engine.applyFilter(compiled.expression);
  assert.deepEqual(
    session().rows.map(row => row.id),
    ['order-2', 'order-3'],
  );
  assert.deepEqual(queries.at(-1).filter, {
    op: 'GTE',
    field: 'amount',
    value: 25,
  });
  assert.equal(session().filterPending, false);
  await engine.save();
  assert.equal(session().baseline.revision, '2');
  assert.equal(session().dirty, false);
  await engine.saveAs({
    title: 'Shared orders',
    scope: { type: 'public', source: 'shared' },
  });
  assert.deepEqual(writes, ['save', 'create']);
  assert.equal(engine.getSnapshot().selectedInstanceId, 'shared-copy');
  assert.deepEqual(session().instance.scope, {
    type: 'public',
    source: 'shared',
  });
  assert.equal(session().dirty, false);
  assert.deepEqual(
    session().rows.map(row => row.id),
    ['order-2', 'order-3'],
  );
  assert.equal(saved.get('mine').title, 'My orders');

  const pending = { started: deferred(), result: deferred() };
  delayedQuery = pending;
  const refresh = engine.refresh();
  const controller = await pending.started.promise;
  const beforeDispose = engine.getSnapshot();
  const notificationsBeforeDispose = notifications;
  engine.dispose();
  assert.equal(controller.signal.aborted, true);
  pending.result.resolve({ total: 1, list: [{ id: 'late', amount: 999 }] });
  await refresh;
  assert.equal(engine.getSnapshot(), beforeDispose);
  assert.equal(notifications, notificationsBeforeDispose);
  await assert.rejects(engine.refresh());
  console.log(
    'Core example passed: load, immutable snapshots, unset/invalid filters, query, save/saveAs, dispose and stale results.',
  );
} finally {
  unsubscribe();
  engine.dispose();
}
