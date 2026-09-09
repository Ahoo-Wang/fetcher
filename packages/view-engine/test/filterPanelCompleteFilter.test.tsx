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

import { useState } from 'react';
import { filter, FilterOperator } from '@ahoo-wang/fetcher-wow';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FilterPanel } from '../src/filter/FilterPanel.js';
import type { FilterComponentProps } from '../src/filter/filterReactTypes.js';
import { createFilterDraft } from '../src/filter/filterCore.js';
import { fields, builtinCompiler, select } from './fixtures/filterPanel.js';

afterEach(cleanup);

it('lets a complete filter own its UI while the panel owns changes, clearing and removal', () => {
  let contract: FilterComponentProps | undefined;
  const apply = vi.fn();
  const context = { page: 'orders' };
  function Custom(props: FilterComponentProps) {
    contract = props;
    return (
      <div aria-label="业务金额筛选器">
        <label htmlFor={props.id}>最低金额</label>
        <input
          id={props.id}
          value={
            props.props.value === undefined ? '' : String(props.props.value)
          }
          onChange={event =>
            props.onChange({
              ...props.props,
              value: Number(event.target.value),
            })
          }
        />
        <button onClick={() => props.onOperatorChange(FilterOperator.GTE)}>
          改为至少
        </button>
        <button onClick={props.onClear}>清空自定义金额</button>
        <button onClick={props.onRemove}>移除自定义金额</button>
      </div>
    );
  }
  render(
    <FilterPanel
      fields={[
        {
          ...fields[0],
          operators: [FilterOperator.EQ, FilterOperator.GTE],
          editor: { name: 'full', options: { unit: '元' } },
        },
      ]}
      value={filter.eq('amount', 10)}
      context={context}
      onApply={apply}
      extensions={{
        filters: {
          full: {
            ...builtinCompiler,
            component: Custom,
            render: 'filter',
            modes: ['simple', 'advanced'],
          },
        },
      }}
    />,
  );
  expect(screen.queryByRole('group', { name: '订单金额筛选' })).toBeNull();
  expect(screen.queryByRole('button', { name: '删除订单金额条件' })).toBeNull();
  expect(contract?.field?.field).toBe('amount');
  expect(contract?.operators.map(item => item.value)).toEqual([
    FilterOperator.EQ,
    FilterOperator.GTE,
  ]);
  expect(contract?.options).toEqual({ unit: '元' });
  expect(contract?.context).toBe(context);
  fireEvent.change(screen.getByLabelText('最低金额'), {
    target: { value: '20' },
  });
  fireEvent.click(screen.getByText('改为至少'));
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith(filter.gte('amount', 20));
  fireEvent.click(screen.getByText('清空自定义金额'));
  expect((screen.getByLabelText('最低金额') as HTMLInputElement).value).toBe(
    '',
  );
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith(filter.matchAll());
  fireEvent.click(screen.getByText('移除自定义金额'));
  expect(screen.queryByLabelText('业务金额筛选器')).toBeNull();
  expect(apply).toHaveBeenCalledTimes(2);
});

it('validates complete-filter operator requests and keeps empty-message errors blocking', () => {
  let contract: FilterComponentProps | undefined;
  const apply = vi.fn();
  function Custom(props: FilterComponentProps) {
    contract = props;
    return <span>完全自定义</span>;
  }
  render(
    <FilterPanel
      fields={[
        {
          ...fields[0],
          operators: [FilterOperator.EQ, FilterOperator.GTE],
          editor: { name: 'full' },
        },
      ]}
      value={filter.eq('amount', 1)}
      onApply={apply}
      extensions={{
        filters: {
          full: {
            ...builtinCompiler,
            component: Custom,
            render: 'filter',
            modes: ['simple'],
          },
        },
      }}
    />,
  );
  act(() => contract!.onOperatorChange(FilterOperator.OR));
  expect(
    (screen.getByRole('button', { name: '查询' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(contract!.errors.length).toBeGreaterThan(0);
  expect(contract!.errorId).toBeTruthy();
  act(() => contract!.onChange({ value: 2 }));
  act(() => contract!.onValidityChange(false, ''));
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).not.toHaveBeenCalled();
});

it('rejects disabled and stale complete-filter actions', () => {
  let contract: FilterComponentProps | undefined;
  const apply = vi.fn();
  function Custom(props: FilterComponentProps) {
    contract = props;
    return <span>完全自定义</span>;
  }
  const definitions = [{ ...fields[0], editor: { name: 'full' } }];
  const extensions = {
    filters: {
      full: {
        ...builtinCompiler,
        component: Custom,
        render: 'filter' as const,
        modes: ['simple' as const],
      },
    },
  };
  const view = render(
    <FilterPanel
      fields={definitions}
      value={filter.eq('amount', 1)}
      onApply={apply}
      extensions={extensions}
      disabled
    />,
  );
  act(() => {
    contract!.onChange({ value: 9 });
    contract!.onClear!();
    contract!.onRemove();
  });
  view.rerender(
    <FilterPanel
      fields={definitions}
      value={filter.eq('amount', 1)}
      onApply={apply}
      extensions={extensions}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith(filter.eq('amount', 1));
  const old = contract!;
  act(() => contract!.onClear!());
  act(() => old.onRemove());
  expect(screen.getByText('完全自定义')).toBeTruthy();
});

it.each(['same-event', 'retained-callback'])(
  'preserves current invalid state across a %s operator request',
  mode => {
    let contract: FilterComponentProps | undefined;
    const apply = vi.fn();
    function Custom(props: FilterComponentProps) {
      contract = props;
      return <span>完整金额</span>;
    }
    render(
      <FilterPanel
        fields={[{ ...fields[0], editor: { name: 'full' } }]}
        value={filter.eq('amount', 1)}
        onApply={apply}
        extensions={{
          filters: {
            full: {
              ...builtinCompiler,
              component: Custom,
              render: 'filter',
              modes: ['simple'],
            },
          },
        }}
      />,
    );
    const changeOperator = contract!.onOperatorChange;
    if (mode === 'same-event')
      act(() => {
        contract!.onValidityChange(false, '金额尚未完成');
        changeOperator(FilterOperator.GTE);
      });
    else {
      act(() => contract!.onValidityChange(false, '金额尚未完成'));
      act(() => changeOperator(FilterOperator.GTE));
    }
    fireEvent.click(screen.getByRole('button', { name: '查询' }));
    expect(apply).not.toHaveBeenCalled();
    expect(contract!.errors).toContain('金额尚未完成');
  },
);

it('limits a saved custom editor to supported operators and retains its properties on a valid switch', () => {
  let contract: FilterComponentProps | undefined;
  const apply = vi.fn();
  function Custom(props: FilterComponentProps) {
    contract = props;
    return <span>持久化金额编辑器</span>;
  }
  function Harness() {
    const [draft, setDraft] = useState({
      id: 'saved',
      op: FilterOperator.EQ,
      field: 'amount',
      editor: { name: 'custom' },
      props: { value: 10, label: '保留' },
    });
    return (
      <FilterPanel
        fields={fields}
        draft={draft}
        onDraftChange={next => setDraft(next as typeof draft)}
        value={filter.eq('amount', 10)}
        onApply={apply}
        extensions={{
          filters: {
            custom: {
              ...builtinCompiler,
              compile: (props, context) =>
                builtinCompiler.compile({ value: props.value }, context),
              component: Custom,
              render: 'filter',
              modes: ['simple'],
              supports: (props, context) =>
                [FilterOperator.EQ, FilterOperator.NE].includes(
                  context.operator,
                ) && props.label === '保留',
            },
          },
        }}
      />
    );
  }
  render(<Harness />);
  expect(
    contract!.operators
      .filter(option => !option.disabled)
      .map(option => option.value),
  ).toEqual([FilterOperator.EQ, FilterOperator.NE]);
  act(() => contract!.onOperatorChange(FilterOperator.GTE));
  expect(contract!.operator).toBe(FilterOperator.EQ);
  expect(screen.getByText('持久化金额编辑器')).toBeTruthy();
  act(() => contract!.onChange({ value: 10, label: '保留' }));
  act(() => contract!.onOperatorChange(FilterOperator.NE));
  expect(contract!.operator).toBe(FilterOperator.NE);
  expect(contract!.props).toEqual({ value: 10, label: '保留' });
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith(filter.ne('amount', 10));
});

it('checks editor support against the properties produced by the operator transition', () => {
  let contract: FilterComponentProps | undefined;
  function Custom(props: FilterComponentProps) {
    contract = props;
    return <span>可变输入编辑器</span>;
  }
  render(
    <FilterPanel
      fields={fields}
      draft={{
        ...createFilterDraft(filter.eq('amount', 10)),
        editor: { name: 'custom' },
      }}
      value={filter.eq('amount', 10)}
      onApply={() => {}}
      extensions={{
        filters: {
          custom: {
            ...builtinCompiler,
            component: Custom,
            render: 'filter',
            modes: ['simple'],
            supports: (props, context) =>
              context.operator === FilterOperator.EQ ||
              (context.operator === FilterOperator.BETWEEN &&
                props.value === undefined),
          },
        },
      }}
    />,
  );
  expect(
    contract!.operators
      .filter(option => !option.disabled)
      .map(option => option.value),
  ).toEqual([FilterOperator.EQ, FilterOperator.BETWEEN]);
});

it('keeps builtin operator transitions available when the new input still needs values', async () => {
  const changed = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      draft={{
        ...createFilterDraft(filter.eq('amount', 10)),
        editor: { name: 'builtin' },
      }}
      value={filter.eq('amount', 10)}
      onDraftChange={changed}
      onApply={() => {}}
    />,
  );
  await select('订单金额操作', '介于');
  expect(changed).toHaveBeenLastCalledWith(
    expect.objectContaining({
      op: FilterOperator.BETWEEN,
      editor: { name: 'builtin' },
    }),
  );
  expect(changed.mock.lastCall![0].value).toBeUndefined();
});
