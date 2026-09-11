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

import { expect, it } from 'vitest';
import { SessionStore } from '../../src/engine/SessionStore.js';
import { EngineScope } from '../../src/engine/EngineScope.js';
import { createSession } from '../../src/engine/sessionState.js';
import { definition, instance } from './fixtures.js';

it.each([
  ['sessions', 'record'],
  ['pendingCreates', 'record'],
  ['sessions', 'analysis'],
  ['pendingCreates', 'analysis'],
] as const)(
  'rejects a mismatched update kind without publishing to %s for %s',
  (target, kind) => {
    const store = new SessionStore(new EngineScope(), {});
    const capableDefinition = {
      ...definition,
      analysis: { count: true, fields: [] },
    };
    const baseline = instance();
    const session = createSession(
      kind === 'record'
        ? baseline
        : {
            ...baseline,
            kind: 'analysis',
            config: {
              filters: baseline.config.filters,
              dimensions: [],
              metrics: [],
              sort: [],
              limit: 100,
              presentation: { layout: 'table', columns: [] },
            },
          },
      capableDefinition,
      {},
    );
    store.publish({
      definition: capableDefinition,
      [target]: { mine: session },
    });
    const before = store.getSnapshot();
    expect(() =>
      store.patch(
        'mine',
        kind === 'record'
          ? { kind: 'analysis', pendingQuery: null }
          : { kind: 'record', page: 2 },
      ),
    ).toThrow('实例类型不能改变');
    expect(store.getSnapshot()).toBe(before);
    store.patch('mine', { filterValid: false });
    expect(store.getSnapshot()[target].mine.filterValid).toBe(false);
    store.patch(
      'mine',
      kind === 'record'
        ? { kind: 'record', page: 2 }
        : { kind: 'analysis', pendingQuery: null },
    );
    expect(store.getSnapshot()[target].mine.kind).toBe(kind);
  },
);
