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

import { createRef, useRef } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import { Operator, SortDirection } from '@ahoo-wang/fetcher-wow';
import { useViewerState, View } from '../../src';
import type { ViewDefinition, ViewRef, ViewState } from '../../src';

afterEach(cleanup);

it.each(['normal', 'editable'] as const)(
  'resets controlled %s filter inputs before the next search',
  filterMode => {
    const definition: ViewDefinition = {
      id: 'definition',
      name: 'Definition',
      fields: [],
      availableFilters: [],
      dataUrl: '/data',
      countUrl: '/count',
    };
    const savedView: ViewState = {
      id: 'saved',
      name: 'Saved',
      definitionId: definition.id,
      type: 'PERSONAL',
      source: 'CUSTOM',
      isDefault: false,
      columns: [],
      pageSize: 10,
      tableSize: 'middle',
      sorter: [],
      condition: { field: 'status', operator: Operator.EQ, value: 'saved' },
      filters: [
        {
          key: 'status',
          type: 'text',
          field: { name: 'status', label: 'Status' },
          operator: { defaultValue: Operator.EQ },
          value: { defaultValue: 'saved' },
        },
      ],
    };
    const queries: Condition[] = [];
    function ControlledView() {
      const state = useViewerState({
        views: [savedView],
        defaultView: savedView,
        definition,
      });
      const ref = useRef<ViewRef>(null);
      return (
        <>
          <button onClick={() => ref.current?.reset()}>Reset view</button>
          <View
            ref={ref}
            fields={[]}
            availableFilters={[]}
            dataSource={{ list: [], total: 0 }}
            defaultColumns={[]}
            defaultPageSize={10}
            defaultTableSize="middle"
            defaultActiveFilters={savedView.filters}
            defaultCondition={savedView.condition}
            externalActiveFilters={state.activeFilters}
            externalUpdateActiveFilters={state.setActiveFilters}
            externalCondition={state.condition}
            externalUpdateCondition={state.setCondition}
            pagination={false}
            enableRowSelection={false}
            showFilter
            filterMode={filterMode}
            onChange={condition => queries.push(condition)}
          />
        </>
      );
    }
    render(<ControlledView />);
    fireEvent.change(screen.getByLabelText('Status value'), {
      target: { value: 'edited' },
    });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    expect(queries.at(-1)?.value).toBe('edited');
    queries.length = 0;

    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }));

    expect(queries).toEqual([savedView.condition]);
    expect(screen.getByLabelText('Status value')).toHaveValue('saved');
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    expect(queries.at(-1)).toEqual(savedView.condition);
  },
);

it('restores the default table sort and clears row selection once on reset', () => {
  const ref = createRef<ViewRef>();
  const onChange = vi.fn();
  const onSelectedDataChange = vi.fn();
  const defaultSorter = [{ field: 'name', direction: SortDirection.ASC }];
  render(
    <View
      ref={ref}
      fields={[
        { name: 'id', label: 'ID', type: 'text', primaryKey: true },
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          primaryKey: false,
          sorter: true,
        },
      ]}
      availableFilters={[]}
      dataSource={{ list: [{ id: 'record', name: 'Alice' }], total: 1 }}
      defaultColumns={[
        { key: 'id', name: 'id', fixed: true, hidden: false },
        {
          key: 'name',
          name: 'name',
          fixed: false,
          hidden: false,
          sortOrder: 'ascend',
        },
      ]}
      defaultSorter={defaultSorter}
      defaultCondition={{ operator: Operator.ALL }}
      defaultPageSize={10}
      defaultTableSize="middle"
      pagination={false}
      enableRowSelection
      showFilter={false}
      filterMode="none"
      onChange={onChange}
      onSelectedDataChange={onSelectedDataChange}
    />,
  );
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  expect(onChange).toHaveBeenLastCalledWith({ operator: Operator.ALL }, 1, 10, [
    { field: 'name', direction: SortDirection.DESC },
  ]);
  fireEvent.click(screen.getAllByRole('checkbox').at(-1)!);
  expect(screen.getAllByRole('checkbox').at(-1)).toBeChecked();
  onChange.mockClear();
  onSelectedDataChange.mockClear();

  act(() => ref.current?.reset());

  expect(onChange).toHaveBeenCalledExactlyOnceWith(
    { operator: Operator.ALL },
    1,
    10,
    defaultSorter,
  );
  expect(onSelectedDataChange).toHaveBeenCalledExactlyOnceWith([]);
  for (const checkbox of screen.getAllByRole('checkbox')) {
    expect(checkbox).not.toBeChecked();
  }
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  expect(onChange).toHaveBeenLastCalledWith({ operator: Operator.ALL }, 1, 10, [
    { field: 'name', direction: SortDirection.DESC },
  ]);
});
