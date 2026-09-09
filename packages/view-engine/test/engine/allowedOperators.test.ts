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

import {
  filter,
  FilterOperator as Op,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import { afterEach, expect, it, vi } from 'vitest';
import {
  createFilterConfiguration,
  createFilterDraft,
  validateFilterConfiguration,
} from '../../src/filter/filterCore.js';
import { validateViewInstance } from '../../src/record/recordValidation.js';
import type { ViewDefinition } from '../../src/record/recordModel.js';
import type { ViewEngine } from '../../src/record/ViewEngine.js';
import { definition, instance, setup } from './fixtures.js';

const engines: ViewEngine[] = [];
afterEach(() => engines.splice(0).forEach(engine => engine.dispose()));
const restricted: ViewDefinition = {
  ...definition,
  allowedOperators: [Op.MATCH_ALL, Op.AND, Op.ELEMENT_MATCH, Op.EQ],
  fields: [
    ...definition.fields,
    {
      field: 'state.items',
      label: 'Items',
      type: 'array',
      fields: [{ field: 'qty', label: 'Quantity', type: 'number' }],
    },
  ],
};
const cases: FilterExpression[] = [
  filter.gt('state.amount', 1),
  filter.or([filter.eq('state.amount', 1), filter.eq('state.amount', 2)]),
  filter.and([filter.eq('state.id', 'a'), filter.gt('state.amount', 1)]),
  {
    op: Op.ELEMENT_MATCH,
    field: 'state.items',
    predicate: filter.gt('qty', 1),
  },
];
it.each(cases)(
  'rejects excluded operators before publishing sessions: $op',
  async expression => {
    const saved = instance();
    saved.config.filters = createFilterConfiguration(
      createFilterDraft(expression),
    );
    expect(() => validateViewInstance(saved, restricted)).toThrow(
      '当前视图不允许操作',
    );
    const { engine, paged } = setup({
      definition: restricted,
      instances: undefined,
      host: {
        instance: {
          list: async () => ({
            instances: [saved],
            defaultInstanceId: saved.id,
          }),
        },
      },
    });
    engines.push(engine);
    await expect(engine.load()).rejects.toThrow('当前视图不允许操作');
    expect(engine.getSnapshot()).toMatchObject({
      status: 'error',
      definition: null,
      sessions: {},
    });
    expect(paged).not.toHaveBeenCalled();
  },
);
it('uses the same boundary when selecting or reloading a remote instance', async () => {
  const forbidden = instance('other');
  forbidden.config.filters = createFilterConfiguration(
    createFilterDraft(filter.gt('state.amount', 1)),
  );
  const load = vi.fn().mockResolvedValue(forbidden);
  const { engine, paged } = setup({
    definition: restricted,
    host: { instance: { load } },
  });
  engines.push(engine);
  await engine.load();
  await expect(engine.selectInstance('other')).rejects.toThrow(
    '当前视图不允许操作',
  );
  expect(engine.getSnapshot().sessions.other).toBeUndefined();
  engine.setTitle('Keep this title');
  const before = engine.getSnapshot().sessions.mine;
  load.mockResolvedValue({ ...forbidden, id: 'mine' });
  await expect(engine.reloadInstance('mine')).rejects.toThrow(
    '当前视图不允许操作',
  );
  expect(engine.getSnapshot().sessions.mine.instance).toEqual(before.instance);
  expect(paged).toHaveBeenCalledOnce();
});
it('keeps permitted opaque editor props valid without requiring a compiler at the structural boundary', () => {
  const saved = instance();
  saved.config.filters = createFilterConfiguration({
    ...createFilterDraft(filter.eq('state.amount', 1)),
    editor: { name: 'custom' },
    props: { tokens: ['a'] },
  });
  expect(() => validateViewInstance(saved, restricted)).not.toThrow();
  expect(() =>
    validateFilterConfiguration(saved.config.filters, restricted.fields),
  ).not.toThrow();
  expect(() =>
    validateFilterConfiguration(saved.config.filters, restricted.fields, []),
  ).toThrow('当前视图不允许操作');
});
