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

import { filter, FilterOperator } from '@ahoo-wang/fetcher-wow';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FilterPanel } from '../src/filter/FilterPanel.js';
import { fields } from './fixtures/filterPanel.js';

afterEach(cleanup);

it.each([FilterOperator.AND, FilterOperator.OR, FilterOperator.NOR])(
  'adds %s from the advanced group menu without querying',
  async op => {
    const apply = vi.fn();
    const change = vi.fn();
    const view = render(
      <FilterPanel
        fields={fields}
        value={filter.matchAll()}
        onApply={apply}
        onDraftChange={change}
      />,
    );
    expect(screen.queryByRole('button', { name: '添加逻辑分组' })).toBeNull();
    view.rerender(
      <FilterPanel
        fields={fields}
        value={filter.matchAll()}
        mode="advanced"
        onApply={apply}
        onDraftChange={change}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '添加逻辑分组' }));
    for (const operator of ['AND', 'OR', 'NOR'])
      expect(
        await screen.findByRole('menuitem', {
          name: new RegExp(`^${operator}`),
        }),
      ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('menuitem', { name: new RegExp(`^${op}`) }),
    );
    expect(change.mock.lastCall?.[0]).toMatchObject({ op, operands: [] });
    expect(apply).not.toHaveBeenCalled();
  },
);

it('keeps logical groups out of the picker and respects the allowed-operator list', async () => {
  render(
    <FilterPanel
      fields={fields}
      value={filter.eq('amount', 1)}
      mode="advanced"
      allowedOperators={[FilterOperator.EQ, FilterOperator.AND]}
      onApply={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '添加筛选' }));
  const picker = within(
    await screen.findByRole('dialog', { name: '选择筛选字段' }),
  );
  expect(
    picker.queryByRole('button', {
      name: /满足全部条件|满足任一条件|全部条件均不满足/,
    }),
  ).toBeNull();
  expect(picker.queryByText('组合条件')).toBeNull();
  expect(picker.getByRole('checkbox', { name: '订单金额' })).toBeTruthy();
  fireEvent.click(picker.getByRole('button', { name: '完成' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: '添加逻辑分组' }));
  expect(
    (await screen.findByRole('menuitem', { name: /^OR/ })).getAttribute(
      'aria-disabled',
    ),
  ).toBe('true');
  expect(
    screen
      .getByRole('menuitem', { name: /^NOR/ })
      .getAttribute('aria-disabled'),
  ).toBe('true');
  expect(
    screen
      .getByRole('menuitem', { name: /^AND/ })
      .getAttribute('aria-disabled'),
  ).not.toBe('true');
});

it('adds a logical group to the selected nested target', async () => {
  const change = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.and([
        filter.eq('amount', 1),
        filter.or([filter.eq('status', 'pending')]),
      ])}
      onApply={() => {}}
      onDraftChange={change}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: '添加到组合 3：添加逻辑分组' }),
  );
  fireEvent.click(await screen.findByRole('menuitem', { name: /^NOR/ }));
  expect(change.mock.lastCall?.[0]).toMatchObject({
    op: FilterOperator.AND,
    operands: [
      { field: 'amount', value: 1 },
      {
        op: FilterOperator.OR,
        operands: [
          { field: 'status', value: 'pending' },
          { op: FilterOperator.NOR, operands: [] },
        ],
      },
    ],
  });
});

it('loads nested scopes in advanced mode without losing structure', () => {
  const apply = vi.fn();
  const value = filter.or([
    filter.eq('status', 'pending'),
    filter.elementMatch('items', filter.gte('quantity', 2)),
  ]);
  render(<FilterPanel fields={fields} value={value} onApply={apply} />);
  expect(screen.getByLabelText('数量值')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenCalledWith(value);
});

it('omits group-move controls in advanced mode and preserves the condition tree', () => {
  const apply = vi.fn();
  const value = filter.and([
    filter.eq('amount', 10),
    filter.or([filter.eq('status', 'pending')]),
  ]);
  render(<FilterPanel fields={fields} value={value} onApply={apply} />);
  expect(screen.queryAllByRole('button', { name: /移动.*条件/ })).toHaveLength(
    0,
  );
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenCalledWith(value);
});

it('loaded single-predicate element scopes can add another child', () => {
  render(
    <FilterPanel
      fields={fields}
      value={filter.elementMatch('items', filter.eq('quantity', 1))}
      onApply={() => {}}
    />,
  );
  const element = within(
    screen.getByRole('group', { name: '商品明细元素条件' }),
  );
  expect(
    element.queryByRole('button', { name: '商品明细元素内添加筛选' }),
  ).not.toBeNull();
});
