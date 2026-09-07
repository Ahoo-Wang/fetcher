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
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { FilterPanel } from '../src/filter/FilterPanel.js';
import type { FilterEditorProps } from '../src/filter/filterReactTypes.js';
import { fields } from './fixtures/filterPanel.js';

afterEach(cleanup);

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
