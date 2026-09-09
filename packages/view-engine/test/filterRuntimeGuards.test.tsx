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
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { filter, FilterOperator as Op } from '@ahoo-wang/fetcher-wow';
import type { ComponentType } from 'react';
import { FilterValueEditor } from '../src/filter/FilterValueEditor.js';
import { getBuiltinFilterRegistration } from '../src/filter/builtinFilterRegistrations.js';
import { useFilterPanelQuery } from '../src/filter/useFilterPanelQuery.js';
import type { FilterEditorProps } from '../src/filter/filterReactTypes.js';
import type { FilterDraftNode } from '../src/filter/filterModel.js';

afterEach(cleanup);

it('shows an actionable error when the standalone value editor receives an unknown operator', () => {
  const change = vi.fn();
  render(
    <FilterValueEditor
      node={{ id: 'unknown', op: 'UNKNOWN' as Op, field: 'amount' }}
      fields={[]}
      onChange={change}
    />,
  );
  expect(screen.getByRole('alert').textContent).toBe('未知操作');
  expect(change).not.toHaveBeenCalled();
});

it('does not inherit a candidate source from the registry prototype', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const source = { search: vi.fn(), resolve: vi.fn() };
  const Remote = getBuiltinFilterRegistration('remote-select')!
    .component as ComponentType<FilterEditorProps>;
  expect(() =>
    render(
      <Remote
        mode="simple"
        disabled={false}
        fields={[]}
        operator={Op.EQ}
        props={{}}
        options={{ source: 'inherited' }}
        optionSources={Object.create({ inherited: source })}
        onChange={() => {}}
        onValidityChange={() => {}}
      />,
    ),
  ).toThrow('未注册候选数据源');
  expect(source.search).not.toHaveBeenCalled();
  expect(source.resolve).not.toHaveBeenCalled();
});

it('rejects duplicate in-flight submissions while allowing a changed query', () => {
  const onApply = vi.fn(),
    setBaseline = vi.fn();
  const value = filter.eq('amount', 0);
  const draft: FilterDraftNode = {
    id: 'amount',
    op: Op.EQ,
    field: 'amount',
    value: 1,
  };
  const { result, rerender } = renderHook(
    ({ expression }) =>
      useFilterPanelQuery(
        { value, querying: true, fields: [], onApply },
        draft,
        { expression, errors: [] },
        true,
        setBaseline,
      ),
    { initialProps: { expression: value } },
  );
  act(() => result.current.apply());
  expect(onApply).not.toHaveBeenCalled();
  rerender({ expression: filter.eq('amount', 1) });
  act(() => {
    result.current.apply();
    result.current.apply();
  });
  expect(onApply).toHaveBeenCalledExactlyOnceWith(filter.eq('amount', 1));
  expect(setBaseline).toHaveBeenCalledExactlyOnceWith(draft);
  expect(setBaseline.mock.calls[0][0]).not.toBe(draft);
});
