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
  FilterOperator,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { createFilterDraft, newFilterDraft } from '../src/filter/filterCore.js';
import { createFilterConfiguration } from '../src/filter/filterConfiguration.js';
import { ViewEngine } from '../src/record/ViewEngine.js';
import { ViewPageContent } from '../src/record/ViewPage.js';
import { definition, instance, setup } from './fixtures/viewPage.js';

const engines: ViewEngine[] = [];
afterEach(() => {
  cleanup();
  engines.splice(0).forEach(engine => engine.dispose());
});

async function openView(expression: FilterExpression) {
  const { host, paged } = setup();
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition: {
      ...definition,
      fields: [
        ...definition.fields,
        { field: 'customer', label: '客户', type: 'string' },
      ],
    },
    instances: {
      instances: [
        {
          ...instance,
          config: {
            ...instance.config,
            filters: createFilterConfiguration(createFilterDraft(expression)),
          },
        },
      ],
      defaultInstanceId: instance.id,
    },
    host,
  });
  engines.push(engine);
  await engine.load();
  render(<ViewPageContent engine={engine} />);
  await screen.findByRole('cell', { name: '42' });
  return { engine, paged };
}

it('unsets one applied AND value while keeping every filter and editor', async () => {
  const expression = filter.and([
    filter.gte('amount', 10),
    filter.lte('amount', 100),
  ]);
  const { engine, paged } = await openView(expression);
  const baseline = createFilterDraft(expression);
  baseline.operands!.push(newFilterDraft(FilterOperator.EQ, 'customer'));
  await act(async () => {
    engine.setFilterDraft(baseline);
    await engine.applyFilter(expression);
  });
  const customer = screen.getByRole('textbox', { name: '客户值' });
  const summary = screen.getByRole('region', { name: '已应用筛选' });
  const calls = paged.mock.calls.length;
  paged.mockResolvedValue({ list: [{ id: 1, amount: 5 }], total: 1 });
  fireEvent.click(
    within(summary).getByRole('button', { name: /金额 大于等于 10/ }),
  );
  await screen.findByRole('cell', { name: '5' });
  expect(paged).toHaveBeenCalledTimes(calls + 1);
  expect(paged.mock.lastCall?.[0].filter).toEqual(
    filter.and([filter.lte('amount', 100)]),
  );
  expect(summary.textContent).not.toContain('金额 大于等于 10');
  expect(summary.textContent).toContain('金额 小于等于 100');
  expect(screen.getByRole('textbox', { name: '客户值' })).toBe(customer);
  expect(
    screen
      .getAllByRole('textbox', { name: '金额值' })
      .map(input => (input as HTMLInputElement).value),
  ).toEqual(['', '100']);
  expect(
    engine
      .getSnapshot()
      .sessions.mine.filterDraft.operands?.map(node => node.id),
  ).toEqual(baseline.operands!.map(node => node.id));
  expect(engine.getSnapshot().sessions.mine.filterPending).toBe(false);
  expect(document.activeElement).toBe(summary);
});

it('unsets the last value and queries all records while keeping its filter', async () => {
  const { engine, paged } = await openView(filter.gte('amount', 10));
  const input = screen.getByRole('textbox', { name: '金额值' });
  const id = engine.getSnapshot().sessions.mine.filterDraft.id;
  const summary = screen.getByRole('region', { name: '已应用筛选' });
  fireEvent.click(
    within(summary).getByRole('button', { name: /金额 大于等于 10/ }),
  );
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
  expect(paged.mock.lastCall?.[0].filter).toEqual(filter.matchAll());
  expect(summary.textContent).toContain('全部记录');
  expect(within(summary).queryByRole('button')).toBeNull();
  expect(screen.getByRole('textbox', { name: '金额值' })).toBe(input);
  expect((input as HTMLInputElement).value).toBe('');
  expect(engine.getSnapshot().sessions.mine.filterDraft).toMatchObject({
    id,
    op: FilterOperator.GTE,
    field: 'amount',
  });
});

it.each([FilterOperator.OR, FilterOperator.NOR])(
  'keeps the %s group and its filters when unsetting values',
  async op => {
    const expression: FilterExpression = {
      op,
      operands: [filter.lt('amount', 10), filter.gt('amount', 100)],
    };
    const { engine, paged } = await openView(expression);
    const summary = screen.getByRole('region', { name: '已应用筛选' });
    const buttons = within(summary).getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(summary.textContent).toContain('金额 小于 10');
    expect(summary.textContent).toContain('金额 大于 100');
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
    expect(paged.mock.lastCall?.[0].filter).toEqual(filter.matchAll());
    expect(engine.getSnapshot().sessions.mine.filterDraft.op).toBe(op);
    expect(
      screen
        .getAllByRole('textbox', { name: '金额值' })
        .map(input => (input as HTMLInputElement).value),
    ).toEqual(['', '']);
  },
);

it('protects pending input until the user queries or undoes it', async () => {
  const { paged } = await openView(filter.gte('amount', 10));
  const summary = screen.getByRole('region', { name: '已应用筛选' });
  const input = screen.getByRole('textbox', {
    name: '金额值',
  }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'unfinished' } });
  const clearButton = within(summary).getByRole('button', {
    name: /金额 大于等于 10/,
  }) as HTMLButtonElement;
  expect(clearButton.disabled).toBe(true);
  fireEvent.click(clearButton);
  expect(input.value).toBe('unfinished');
  expect(paged).toHaveBeenCalledTimes(1);
  expect(summary.textContent).toContain('先查询或撤销筛选修改');
  fireEvent.click(screen.getByRole('button', { name: '撤销筛选修改' }));
  await waitFor(() => expect(clearButton.disabled).toBe(false));
  fireEvent.click(clearButton);
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
  expect(paged.mock.lastCall?.[0].filter).toEqual(filter.matchAll());
  expect(
    (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement).value,
  ).toBe('');
});

it('does not offer value clearing for a value-free condition', async () => {
  const { engine } = await openView(filter.exists('amount'));
  const summary = screen.getByRole('region', { name: '已应用筛选' });
  expect(summary.textContent).toContain('金额');
  expect(within(summary).queryByRole('button')).toBeNull();
  act(() => engine.setFilterDraft(createFilterDraft(filter.gt('amount', 1))));
  expect(summary.textContent).not.toContain('先查询或撤销筛选修改');
});
