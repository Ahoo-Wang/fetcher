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

import { filter, FilterOperator as Op } from '@ahoo-wang/fetcher-wow';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FilterPanel } from '../src/filter/FilterPanel.js';
import type { FilterComponentProps } from '../src/filter/filterReactTypes.js';
import type { FilterOptionSource } from '../src/filter/filterOptionSource.js';
import { builtinCompiler, fields, select } from './fixtures/filterPanel.js';

afterEach(cleanup);

function AmountEditor({
  props,
  operator,
  onChange,
  onOperatorChange,
  onClear,
}: FilterComponentProps) {
  return (
    <>
      <input
        aria-label="自定义金额"
        defaultValue={String(props.value ?? '')}
        onChange={event => onChange({ value: Number(event.target.value) })}
      />
      <button onClick={() => onOperatorChange(operator)}>保持当前操作</button>
      <button onClick={onClear}>清空自定义金额</button>
    </>
  );
}
const amountField = { ...fields[0], editor: { name: 'amount' } };
const amountEditor = {
  ...builtinCompiler,
  component: AmountEditor,
  render: 'filter' as const,
  modes: ['simple', 'advanced'] as const,
};

it('rejects a non-serializable numeric editor output without replacing its previous value and recovers on valid input', () => {
  const apply = vi.fn(),
    changed = vi.fn();
  render(
    <FilterPanel
      fields={[amountField]}
      value={filter.eq('amount', 10)}
      onApply={apply}
      onDraftChange={changed}
      extensions={{ filters: { amount: amountEditor } }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '保持当前操作' }));
  expect(changed).not.toHaveBeenCalled();
  const input = screen.getByRole('textbox', { name: '自定义金额' });
  fireEvent.change(input, { target: { value: 'not-a-number' } });
  const error = screen.getByRole('alert').textContent;
  expect(error).toBeTruthy();
  expect(screen.getByRole('button', { name: '查询' })).toHaveProperty(
    'disabled',
    true,
  );
  fireEvent.change(input, { target: { value: 'still-not-a-number' } });
  expect(screen.getAllByRole('alert').map(alert => alert.textContent)).toEqual([
    error,
  ]);
  expect(changed).not.toHaveBeenCalled();
  expect(apply).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: '25' } });
  expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenCalledExactlyOnceWith(filter.eq('amount', 25));
});

it.each(['清空自定义金额', '清空条件'])(
  'preserves the draft when %s fails and recovers after editing',
  label => {
    const apply = vi.fn(),
      changed = vi.fn();
    render(
      <FilterPanel
        fields={[amountField]}
        value={filter.eq('amount', -10)}
        onApply={apply}
        onDraftChange={changed}
        extensions={{
          filters: {
            amount: {
              ...amountEditor,
              clear: props => {
                if (Number(props.value) < 0)
                  throw new Error('负数金额无法清空');
                return {};
              },
            },
          },
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('alert').textContent).toBe('负数金额无法清空');
    expect(screen.getByRole('textbox', { name: '自定义金额' })).toHaveProperty(
      'value',
      '-10',
    );
    expect(changed).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: '自定义金额' }), {
      target: { value: '10' },
    });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('textbox', { name: '自定义金额' })).toHaveProperty(
      'value',
      '',
    );
    fireEvent.click(screen.getByRole('button', { name: '查询' }));
    expect(apply).toHaveBeenCalledExactlyOnceWith(filter.matchAll());
  },
);

it('removes an entire nested logical group without retaining its child criteria', () => {
  const apply = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.and([
        filter.eq('amount', 10),
        filter.or([filter.eq('status', 'paid')]),
      ])}
      onApply={apply}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '删除满足任一条件条件' }));
  expect(screen.queryByLabelText('订单状态值')).toBeNull();
  expect(screen.getByLabelText('订单金额值')).toHaveProperty('value', '10');
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenCalledExactlyOnceWith(
    filter.and([filter.eq('amount', 10)]),
  );
});

it('changes and removes a root-only condition through its own operator and delete controls', async () => {
  const apply = vi.fn();
  render(
    <FilterPanel fields={fields} value={filter.matchNone()} onApply={apply} />,
  );
  await select('特殊条件类型', '记录标识');
  fireEvent.change(screen.getByRole('textbox', { name: '记录标识值' }), {
    target: { value: 'order-1' },
  });
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith({ op: Op.ID, value: 'order-1' });
  fireEvent.click(screen.getByRole('button', { name: '删除记录标识条件' }));
  expect(screen.queryByRole('combobox', { name: '特殊条件类型' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith(filter.matchAll());
});

it.each([{ pageSize: 0 }, { debounceMs: -1 }])(
  'rejects out-of-range remote options %o before any source request',
  options => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const source: FilterOptionSource = {
      search: vi.fn(async () => ({ list: [], nextCursor: null })),
      resolve: vi.fn(async () => ({ list: [], missing: [] })),
    };
    const apply = vi.fn();
    render(
      <FilterPanel
        fields={[
          {
            ...fields[0],
            editor: {
              name: 'remote-select',
              options: { source: 'customers', ...options },
            },
          },
        ]}
        draft={{ id: 'remote', field: 'amount', op: Op.EQ }}
        value={filter.matchAll()}
        onApply={apply}
        extensions={{ optionSources: { customers: source } }}
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain(
      '远程候选的分页大小或防抖时间无效',
    );
    expect(screen.getByRole('button', { name: '查询' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(source.search).not.toHaveBeenCalled();
    expect(source.resolve).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '使用内置编辑器' }));
    expect(screen.getByRole('textbox', { name: '订单金额值' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '查询' }));
    expect(apply).toHaveBeenCalledExactlyOnceWith(filter.matchAll());
  },
);

it('adds only allowed fields, root conditions and logical groups from the advanced picker', async () => {
  const apply = vi.fn(),
    changed = vi.fn();
  render(
    <FilterPanel
      fields={fields.map(field =>
        field.field === 'items'
          ? { ...field, operators: [Op.ELEMENT_MATCH] }
          : field,
      )}
      value={filter.matchAll()}
      mode="advanced"
      onApply={apply}
      onDraftChange={changed}
      allowedOperators={[Op.EQ, Op.AND, Op.MATCH_NONE]}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '添加筛选' }));
  const picker = within(
    await screen.findByRole('dialog', { name: '选择筛选字段' }),
  );
  expect(picker.queryByRole('checkbox', { name: '商品明细' })).toBeNull();
  fireEvent.click(picker.getByRole('checkbox', { name: '订单金额' }));
  fireEvent.click(picker.getByRole('button', { name: '不匹配记录' }));
  fireEvent.click(picker.getByRole('button', { name: '完成' }));
  fireEvent.change(screen.getByRole('textbox', { name: '订单金额值' }), {
    target: { value: '15' },
  });
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenCalledExactlyOnceWith(
    filter.and([filter.eq('amount', 15), filter.matchNone()]),
  );
  fireEvent.click(screen.getByRole('button', { name: '添加逻辑分组' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: /^AND/ }));
  expect(changed.mock.lastCall![0]).toMatchObject({
    op: Op.AND,
    operands: [
      { field: 'amount' },
      { op: Op.MATCH_NONE },
      { op: Op.AND, operands: [] },
    ],
  });
  expect(apply).toHaveBeenCalledTimes(1);
});

it('does not query when Enter belongs to a checkbox in a custom editor', () => {
  const apply = vi.fn();
  render(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'check' } }]}
      value={filter.eq('amount', 10)}
      onApply={apply}
      extensions={{
        filters: {
          check: {
            ...builtinCompiler,
            modes: ['simple'],
            component: () => <input type="checkbox" aria-label="启用预览" />,
          },
        },
      }}
    />,
  );
  fireEvent.keyDown(screen.getByRole('checkbox', { name: '启用预览' }), {
    key: 'Enter',
  });
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenCalledExactlyOnceWith(filter.eq('amount', 10));
});

it('preserves the day count and relative options when switching between day operators', async () => {
  const apply = vi.fn();
  render(
    <FilterPanel
      fields={[{ field: 'created', label: '创建', type: 'datetime' }]}
      value={{ op: Op.RECENT_DAYS, field: 'created', days: 3, zoneId: 'UTC' }}
      onApply={apply}
      timeZone="UTC"
    />,
  );
  await select('创建操作', '早于天数');
  expect(screen.getByRole('textbox', { name: '创建天数' })).toHaveProperty(
    'value',
    '3',
  );
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenCalledExactlyOnceWith({
    op: Op.EARLIER_DAYS,
    field: 'created',
    days: 3,
    zoneId: 'UTC',
  });
});

it('keeps the draft available when a query handler throws without a message and allows retry', () => {
  const failure: unknown = '';
  const apply = vi.fn().mockImplementationOnce(() => {
    throw failure;
  });
  render(
    <FilterPanel
      value={filter.eq('amount', 0)}
      draft={{ id: 'amount', op: Op.EQ, field: 'amount', value: 1 }}
      fields={[{ field: 'amount', label: '金额', type: 'number' }]}
      onApply={apply}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(screen.getByRole('alert').textContent).toContain('筛选器处理失败。');
  expect(
    (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement).value,
  ).toBe('1');
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenCalledTimes(2);
  expect(apply).toHaveBeenLastCalledWith(filter.eq('amount', 1));
  expect(screen.queryByRole('alert')).toBeNull();
});
