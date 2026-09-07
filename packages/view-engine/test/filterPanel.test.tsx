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

import { useEffect, useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  filter,
  FilterOperator,
  DeletionState,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import { createFilterDraft } from '../src/filter/filterCore.js';
import { FilterPanel } from '../src/filter/FilterPanel.js';
import type { FilterFieldDefinition } from '../src/filter/filterModel.js';
import type {
  FilterEditorProps,
  FilterComponentProps,
} from '../src/filter/filterReactTypes.js';

afterEach(cleanup);
const fields: FilterFieldDefinition[] = [
  { field: 'amount', label: '订单金额', type: 'number' },
  { field: 'status', label: '订单状态', type: 'string' },
  {
    field: 'items',
    label: '商品明细',
    type: 'array',
    fields: [{ field: 'quantity', label: '数量', type: 'number' }],
  },
];

it('buffers edits and clears until Query, retains unset controls, and undoes without querying', () => {
  const apply = vi.fn();
  function Example() {
    const [value, setValue] = useState<FilterExpression>(
      filter.gte('amount', 10),
    );
    return (
      <FilterPanel
        fields={fields}
        value={value}
        onApply={value => {
          apply(value);
          setValue(value);
        }}
      />
    );
  }
  render(<Example />);
  fireEvent.change(screen.getByLabelText('订单金额值'), {
    target: { value: '20' },
  });
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenLastCalledWith(filter.gte('amount', 20));
  fireEvent.change(screen.getByLabelText('订单金额值'), {
    target: { value: '' },
  });
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenLastCalledWith(filter.matchAll());
  expect(screen.getByLabelText('订单金额值')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('订单金额值'), {
    target: { value: '30' },
  });
  fireEvent.click(screen.getByRole('button', { name: '撤销筛选修改' }));
  expect((screen.getByLabelText('订单金额值') as HTMLInputElement).value).toBe(
    '',
  );
  expect(apply).toHaveBeenCalledTimes(2);
});

it('does not silently apply partial or invalid input, or submit on Enter during composition', () => {
  const apply = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.between('amount', 1, 10)}
      onApply={apply}
    />,
  );
  const upper = screen.getByLabelText('订单金额上限');
  fireEvent.change(upper, { target: { value: '' } });
  expect(
    (
      screen.getByRole('button', {
        name: '查询',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.keyDown(upper, { key: 'Enter', isComposing: true });
  expect(apply).not.toHaveBeenCalled();
});

it('keeps mode guards in the panel when its toolbar is composed externally', () => {
  const apply = vi.fn();
  const modeChange = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.between('amount', 1, 10)}
      onApply={apply}
      onModeChange={modeChange}
      renderToolbar={({ mode, options, onModeChange }) => (
        <div>
          <span>{mode}</span>
          <button onClick={() => onModeChange('advanced')}>高级模式</button>
          <button
            aria-disabled={options[0].disabled}
            onClick={() => onModeChange('simple')}
          >
            简单模式
          </button>
        </div>
      )}
    />,
  );
  expect(screen.queryByRole('combobox', { name: '筛选模式' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '高级模式' }));
  const upper = screen.getByLabelText('订单金额上限');
  fireEvent.change(upper, { target: { value: '' } });
  const simple = screen.getByRole('button', { name: '简单模式' });
  expect(simple.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(simple);
  expect(modeChange).toHaveBeenCalledTimes(1);
  expect(modeChange).toHaveBeenLastCalledWith('advanced');
  fireEvent.change(upper, { target: { value: '30' } });
  fireEvent.click(simple);
  expect(modeChange).toHaveBeenLastCalledWith('simple');
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith(filter.between('amount', 1, 30));
});

it('preserves edits during a request acknowledgement and resets only for an external value', () => {
  const apply = vi.fn();
  const initial = filter.gte('amount', 10);
  const view = render(
    <FilterPanel fields={fields} value={initial} onApply={apply} />,
  );
  fireEvent.change(screen.getByLabelText('订单金额值'), {
    target: { value: '20' },
  });
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  fireEvent.change(screen.getByLabelText('订单金额值'), {
    target: { value: '30' },
  });
  view.rerender(
    <FilterPanel
      fields={fields}
      value={filter.gte('amount', 20)}
      onApply={apply}
      querying
    />,
  );
  expect((screen.getByLabelText('订单金额值') as HTMLInputElement).value).toBe(
    '30',
  );
  view.rerender(
    <FilterPanel
      fields={fields}
      value={filter.gte('amount', 40)}
      onApply={apply}
    />,
  );
  expect((screen.getByLabelText('订单金额值') as HTMLInputElement).value).toBe(
    '40',
  );
  view.rerender(
    <FilterPanel
      fields={fields}
      value={filter.gte('amount', 20)}
      onApply={apply}
    />,
  );
  expect((screen.getByLabelText('订单金额值') as HTMLInputElement).value).toBe(
    '20',
  );
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

it('blocks stale valid custom values and rejects changed field bindings', () => {
  const apply = vi.fn();
  function Custom({ onChange, onValidityChange }: FilterEditorProps) {
    return (
      <>
        <button onClick={() => onValidityChange(false)}>无效输入</button>
        <button onClick={() => onChange(filter.eq('status', 'wrong'))}>
          改字段
        </button>
        <button
          onClick={() => {
            onChange(filter.eq('amount', 0));
            onValidityChange(true);
          }}
        >
          零
        </button>
      </>
    );
  }
  render(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'custom' } }, fields[1]]}
      value={filter.eq('amount', 1)}
      onApply={apply}
      extensions={{
        filters: {
          custom: { component: Custom, modes: ['simple', 'advanced'] },
        },
      }}
    />,
  );
  fireEvent.click(screen.getByText('无效输入'));
  expect(
    (
      screen.getByRole('button', {
        name: '查询',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByText('改字段'));
  expect(screen.getByRole('alert').textContent).toContain('字段');
  fireEvent.click(screen.getByText('零'));
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenCalledWith(filter.eq('amount', 0));
});

it.each(['value', 'filter'] as const)(
  'reports missing custom editors and contains %s rendering errors',
  renderMode => {
    const broken = [{ ...fields[0], editor: { name: 'missing' } }];
    const { unmount } = render(
      <FilterPanel
        fields={broken}
        value={filter.eq('amount', 1)}
        onApply={() => {}}
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain('missing');
    unmount();
    function Broken(): never {
      throw new Error('editor crash');
    }
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <FilterPanel
        fields={broken}
        value={filter.eq('amount', 1)}
        onApply={() => {}}
        extensions={{
          filters: {
            missing: {
              component: Broken,
              render: renderMode,
              modes: ['simple', 'advanced'],
            },
          },
        }}
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain('editor crash');
    fireEvent.click(screen.getByRole('button', { name: '使用内置编辑器' }));
    expect(screen.getByLabelText('订单金额值')).toBeTruthy();
    log.mockRestore();
  },
);

it('keeps separate panels isolated and allows query-error retry', () => {
  const apply = vi.fn();
  render(
    <>
      <div data-testid="first">
        <FilterPanel
          fields={fields}
          value={filter.eq('amount', 1)}
          onApply={apply}
          queryError="请求失败"
        />
      </div>
      <div data-testid="second">
        <FilterPanel
          fields={fields}
          value={filter.eq('amount', 2)}
          onApply={() => {}}
        />
      </div>
    </>,
  );
  const first = within(screen.getByTestId('first'));
  fireEvent.change(first.getByLabelText('订单金额值'), {
    target: { value: '3' },
  });
  expect(
    (
      within(screen.getByTestId('second')).getByLabelText(
        '订单金额值',
      ) as HTMLInputElement
    ).value,
  ).toBe('2');
  fireEvent.click(first.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenCalledWith(filter.eq('amount', 3));
});

async function select(label: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name: label }));
  const item = await screen.findByRole('option', { name: option, exact: true });
  fireEvent.pointerDown(item, { pointerType: 'mouse' });
  fireEvent.click(item);
}

it('adds fields without rebinding and changes modes without querying', async () => {
  const apply = vi.fn(),
    mode = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.matchAll()}
      onApply={apply}
      onModeChange={mode}
    />,
  );
  await select('添加筛选', '订单金额');
  expect(screen.getByLabelText('订单金额值')).toBeTruthy();
  expect(screen.queryByRole('combobox', { name: '字段' })).toBeNull();
  await select('筛选模式', '高级');
  expect(mode).toHaveBeenCalledWith('advanced');
  await select('筛选模式', '简单');
  expect(mode).toHaveBeenCalledWith('simple');
  expect(apply).not.toHaveBeenCalled();
});

it('keeps simple filters free of condition menus and applies the original order', () => {
  const apply = vi.fn();
  const value = filter.and([
    filter.eq('amount', 10),
    filter.eq('status', 'pending'),
  ]);
  render(<FilterPanel fields={fields} value={value} onApply={apply} />);
  expect(
    screen.queryByRole('button', { name: /条件操作|移动.*条件/ }),
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenCalledWith(value);
});

it('moves a predicate into another group without changing its scope or parameters', async () => {
  const apply = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.and([
        filter.eq('amount', 10),
        filter.or([filter.eq('status', 'pending')]),
      ])}
      onApply={apply}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '移动订单金额条件' }));
  await select('移动到分组', '满足任一条件 · 1');
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenCalledWith(
    filter.and([
      filter.or([filter.eq('status', 'pending'), filter.eq('amount', 10)]),
    ]),
  );
});

it('does not offer cross-element moves or destructive simple-mode conversion', async () => {
  render(
    <FilterPanel
      fields={fields}
      value={filter.and([
        filter.eq('amount', 10),
        filter.elementMatch('items', filter.and([filter.eq('quantity', 2)])),
      ])}
      onApply={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole('combobox', { name: '筛选模式' }));
  expect(
    (
      await screen.findByRole('option', { name: '简单', exact: true })
    ).getAttribute('aria-disabled'),
  ).toBe('true');
  fireEvent.keyDown(screen.getByRole('option', { name: '高级', exact: true }), {
    key: 'Escape',
  });
  expect(screen.queryByRole('button', { name: '移动订单金额条件' })).toBeNull();
});

it('keeps mode-specific extension fallback and ignores unused lower-priority references', () => {
  function Custom({ onValidityChange }: FilterEditorProps) {
    useEffect(() => onValidityChange(true), [onValidityChange]);
    return <span>业务编辑器</span>;
  }
  const view = render(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'custom' } }]}
      value={filter.eq('amount', 1)}
      onApply={() => {}}
      editors={{ [FilterOperator.EQ]: { name: 'not-used' } }}
      extensions={{
        filters: { custom: { component: Custom, modes: ['simple'] } },
      }}
    />,
  );
  expect(screen.getByText('业务编辑器')).toBeTruthy();
  expect(
    (
      screen.getByRole('button', {
        name: '查询',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  view.rerender(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'custom' } }]}
      value={filter.eq('amount', 1)}
      onApply={() => {}}
      mode="advanced"
      extensions={{
        filters: { custom: { component: Custom, modes: ['simple'] } },
      }}
    />,
  );
  expect(screen.queryByText('业务编辑器')).toBeNull();
  expect(screen.getByLabelText('订单金额值')).toBeTruthy();
});

it('blocks a failing extension compatibility predicate instead of applying stale state', () => {
  render(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'custom' } }]}
      value={filter.eq('amount', 1)}
      onApply={() => {}}
      extensions={{
        filters: {
          custom: {
            component: () => null,
            modes: ['simple'],
            supports: () => {
              throw new Error('unsupported editor state');
            },
          },
        },
      }}
    />,
  );
  expect(screen.getByRole('alert').textContent).toContain(
    'unsupported editor state',
  );
  expect(
    (
      screen.getByRole('button', {
        name: '查询',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});

it('clears only values while preserving parameters and really clears deletion state', async () => {
  const apply = vi.fn(),
    draft = vi.fn();
  const view = render(
    <FilterPanel
      fields={[{ field: 'createdAt', label: '创建时间', type: 'datetime' }]}
      value={filter.beforeToday('createdAt', '09:00', {
        zoneId: 'Asia/Shanghai',
      })}
      onApply={apply}
      onDraftChange={draft}
    />,
  );
  fireEvent.change(screen.getByRole('textbox', { name: '创建时间时间' }), {
    target: { value: '' },
  });
  expect(draft.mock.lastCall?.[0].zoneId).toBe('Asia/Shanghai');
  expect(draft.mock.lastCall?.[0].time).toBeUndefined();
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith(filter.matchAll());
  view.unmount();
  render(
    <FilterPanel
      fields={[]}
      value={{ op: FilterOperator.DELETION, state: DeletionState.ACTIVE }}
      onApply={apply}
    />,
  );
  await select('删除状态', '清空选择');
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(apply).toHaveBeenLastCalledWith(filter.matchAll());
});

it('restored unapplied controlled drafts must remain pending and undoable', () => {
  const pending = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.eq('amount', 1)}
      draft={createFilterDraft(filter.eq('amount', 2))}
      onApply={() => {}}
      onPendingChange={pending}
    />,
  );
  expect((screen.getByLabelText('订单金额值') as HTMLInputElement).value).toBe(
    '2',
  );
  expect(pending).toHaveBeenLastCalledWith(true);
  expect(
    (screen.getByRole('button', { name: '撤销筛选修改' }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});
it('does not repeat an in-flight expression after editing only its number format', () => {
  const apply = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.eq('amount', 1)}
      onApply={apply}
      querying
    />,
  );
  fireEvent.change(screen.getByLabelText('订单金额值'), {
    target: { value: '1.0' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^查询/ }));
  expect(apply).not.toHaveBeenCalled();
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
  expect(element.queryByRole('combobox', { name: /添加/ })).not.toBeNull();
});
it('changing an operator cannot clear a custom editors reported invalid input', async () => {
  const apply = vi.fn();
  function Custom({
    onValidityChange,
  }: {
    onValidityChange(valid: boolean): void;
  }) {
    return (
      <input
        aria-label="自定义金额值"
        defaultValue="1"
        onChange={() => onValidityChange(false)}
      />
    );
  }
  render(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'custom' } }]}
      value={filter.eq('amount', 1)}
      onApply={apply}
      extensions={{
        filters: {
          custom: { component: Custom, modes: ['simple', 'advanced'] },
        },
      }}
    />,
  );
  fireEvent.change(screen.getByLabelText('自定义金额值'), {
    target: { value: 'abc' },
  });
  expect(
    (screen.getByRole('button', { name: /^查询/ }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('combobox', { name: '订单金额操作' }));
  const item = await screen.findByRole('option', { name: '不等于' });
  fireEvent.pointerDown(item, { pointerType: 'mouse' });
  fireEvent.click(item);
  expect(
    (screen.getByLabelText('自定义金额值') as HTMLInputElement).value,
  ).toBe('abc');
  fireEvent.click(screen.getByRole('button', { name: /^查询/ }));
  expect(apply).not.toHaveBeenCalled();
});

it('merges an asynchronous custom change into the latest tree and ignores it after unmount', () => {
  let publish: FilterEditorProps['onChange'] | undefined;
  const drafts = vi.fn();
  function Custom(props: FilterEditorProps) {
    publish ??= props.onChange;
    return <span>自定义状态</span>;
  }
  const view = render(
    <FilterPanel
      fields={[fields[0], { ...fields[1], editor: { name: 'custom' } }]}
      value={filter.and([
        filter.eq('amount', 1),
        filter.eq('status', 'pending'),
      ])}
      onApply={() => {}}
      onDraftChange={drafts}
      extensions={{
        filters: {
          custom: { component: Custom, modes: ['simple', 'advanced'] },
        },
      }}
    />,
  );
  fireEvent.change(screen.getByLabelText('订单金额值'), {
    target: { value: '2' },
  });
  act(() => publish!(filter.eq('status', 'paid')));
  expect((screen.getByLabelText('订单金额值') as HTMLInputElement).value).toBe(
    '2',
  );
  view.unmount();
  const count = drafts.mock.calls.length;
  act(() => publish!(filter.eq('status', 'closed')));
  expect(drafts).toHaveBeenCalledTimes(count);
});

it('remounting an already-applied numeric draft must stay synchronized', () => {
  const apply = vi.fn(),
    changed = vi.fn(),
    pending = vi.fn();
  const view = render(
    <FilterPanel
      fields={fields}
      value={filter.eq('amount', 1)}
      onApply={apply}
      onDraftChange={changed}
    />,
  );
  fireEvent.change(screen.getByLabelText('订单金额值'), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^查询/ }));
  const applied = apply.mock.lastCall![0],
    retained = changed.mock.lastCall![0];
  view.unmount();
  render(
    <FilterPanel
      fields={fields}
      value={applied}
      draft={retained}
      onApply={apply}
      onPendingChange={pending}
    />,
  );
  expect(pending).toHaveBeenLastCalledWith(false);
});
it('clearing a value rejects callbacks from the custom editor it just unmounted', async () => {
  let publish: ((node: ReturnType<typeof filter.eq>) => void) | undefined;
  const apply = vi.fn();
  function Custom({ onChange }: FilterEditorProps) {
    publish ??= onChange;
    return <button onClick={() => onChange(undefined)}>清空自定义值</button>;
  }
  render(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'custom' } }]}
      value={filter.eq('amount', 1)}
      onApply={apply}
      extensions={{
        filters: {
          custom: { component: Custom, modes: ['simple', 'advanced'] },
        },
      }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '清空自定义值' }));
  act(() => publish!(filter.eq('amount', 7)));
  fireEvent.click(screen.getByRole('button', { name: /^查询/ }));
  expect(apply).toHaveBeenLastCalledWith(filter.matchAll());
});
it('adds a same-scope sibling to an existing element predicate without changing it', async () => {
  const apply = vi.fn();
  render(
    <FilterPanel
      fields={fields}
      value={filter.elementMatch('items', filter.eq('quantity', 1))}
      onApply={apply}
    />,
  );
  fireEvent.click(
    screen.getByRole('combobox', { name: '商品明细元素内添加筛选' }),
  );
  const item = await screen.findByRole('option', { name: '数量' });
  fireEvent.pointerDown(item, { pointerType: 'mouse' });
  fireEvent.click(item);
  fireEvent.change(screen.getAllByLabelText('数量值')[1], {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^查询/ }));
  expect(apply).toHaveBeenLastCalledWith(
    filter.elementMatch(
      'items',
      filter.and([filter.eq('quantity', 1), filter.eq('quantity', 2)]),
    ),
  );
});

it('accepts validity reporting immediately after a custom operator change', () => {
  const apply = vi.fn();
  function Custom({ onChange, onValidityChange }: FilterEditorProps) {
    return (
      <button
        onClick={() => {
          onChange(filter.ne('amount', 1));
          onValidityChange(false);
        }}
      >
        继续编辑
      </button>
    );
  }
  render(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'custom' } }]}
      value={filter.eq('amount', 1)}
      onApply={apply}
      extensions={{
        filters: {
          custom: { component: Custom, modes: ['simple', 'advanced'] },
        },
      }}
    />,
  );
  fireEvent.click(screen.getByText('继续编辑'));
  expect(
    (screen.getByRole('button', { name: '查询' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

it('blocks invalid custom input even when its message is empty', () => {
  const apply = vi.fn();
  function Custom({ onValidityChange }: FilterEditorProps) {
    return (
      <button onClick={() => onValidityChange(false, '')}>输入无效</button>
    );
  }
  render(
    <FilterPanel
      fields={[{ ...fields[0], editor: { name: 'custom' } }]}
      value={filter.eq('amount', 1)}
      onApply={apply}
      extensions={{
        filters: {
          custom: { component: Custom, modes: ['simple', 'advanced'] },
        },
      }}
    />,
  );
  fireEvent.click(screen.getByText('输入无效'));
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).not.toHaveBeenCalled();
});

it('never revives callbacks when a replaced custom component returns', () => {
  let oldChange: FilterEditorProps['onChange'] | undefined;
  const apply = vi.fn();
  function A({ onChange }: FilterEditorProps) {
    oldChange ??= onChange;
    return <span>A</span>;
  }
  function B() {
    return <span>B</span>;
  }
  function panel(component: typeof A | typeof B) {
    return (
      <FilterPanel
        fields={[{ ...fields[0], editor: { name: 'custom' } }]}
        value={filter.eq('amount', 1)}
        onApply={apply}
        extensions={{
          filters: { custom: { component, modes: ['simple', 'advanced'] } },
        }}
      />
    );
  }
  const view = render(panel(A));
  view.rerender(panel(B));
  expect(screen.getByText('B')).toBeTruthy();
  view.rerender(panel(A));
  act(() => oldChange!(filter.eq('amount', 7)));
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(apply).toHaveBeenLastCalledWith(filter.eq('amount', 1));
});

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
            props.node && 'value' in props.node ? String(props.node.value) : ''
          }
          onChange={event =>
            props.onChange(
              filter.eq(props.field!.field, Number(event.target.value)),
            )
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
          full: { component: Custom, render: 'filter', modes: ['simple'] },
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
  act(() => contract!.onChange(filter.eq('amount', 2)));
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
    contract!.onChange(filter.eq('amount', 9));
    contract!.onClear();
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
  act(() => contract!.onClear());
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
            full: { component: Custom, render: 'filter', modes: ['simple'] },
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
