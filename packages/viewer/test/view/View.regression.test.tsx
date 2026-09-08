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

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
  renderHook,
} from '@testing-library/react';
import { View } from '../../src/view/View';
import { useViewState } from '../../src/view/hooks/useViewState';
import { mapToTableRecord } from '../../src/utils';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { useViewerState } from '../../src/viewer/hooks/useViewerState';
const props = {
  fields: [
    { name: 'id', label: 'ID', type: 'text', primaryKey: true },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      primaryKey: false,
      sorter: true,
    },
  ],
  availableFilters: [],
  dataSource: { list: [{ id: 'a', name: 'A' }], total: 100 },
  defaultColumns: [
    { key: 'id', name: 'id', fixed: true, hidden: false },
    { key: 'name', name: 'name', fixed: false, hidden: false },
  ],
  defaultPageSize: 10,
  defaultTableSize: 'middle',
  pagination: { showSizeChanger: true },
  showFilter: false,
  filterMode: 'none',
  enableRowSelection: false,
} as any;
afterEach(cleanup);
it('initializes the requested default page', () => {
  const { result } = renderHook(() =>
    useViewState({
      defaultColumns: [],
      defaultPage: 5,
      defaultPageSize: 10,
      defaultTableSize: 'middle',
    }),
  );
  expect(result.current.page).toBe(5);
});
it('updates pagination atomically', () => {
  const onChange = vi.fn();
  const { result } = renderHook(() =>
    useViewState({
      defaultColumns: [],
      defaultPageSize: 10,
      defaultTableSize: 'middle',
      onChange,
    }),
  );
  act(() => result.current.setPage(10));
  onChange.mockClear();
  act(() => {
    result.current.setPagination(2, 50);
  });
  expect(result.current.page).toBe(2);
  expect(onChange.mock.calls.at(-1).slice(1, 3)).toEqual([2, 50]);
  expect(onChange).toHaveBeenCalledTimes(1);
});
it('hides pagination while row selection is enabled', () => {
  const { container } = render(
    <View {...props} pagination={false} enableRowSelection />,
  );
  expect(container.querySelector('.ant-pagination')).toBeNull();
});
it('resets an uncontrolled View and queries once', () => {
  const ref = React.createRef<any>();
  const onChange = vi.fn();
  render(<View {...props} ref={ref} onChange={onChange} />);
  fireEvent.click(screen.getByTitle('2'));
  expect(
    document.querySelector('.ant-pagination-item-active')?.textContent,
  ).toBe('2');
  onChange.mockClear();
  act(() => ref.current.reset());
  expect(
    document.querySelector('.ant-pagination-item-active')?.textContent,
  ).toBe('1');
  expect(onChange).toHaveBeenCalledTimes(1);
});
it('keeps nested primary keys stable across reordering', () => {
  const data = [{ state: { id: 'A' } }, { state: { id: 'B' } }];
  expect(mapToTableRecord(data, 'state.id').map(x => x.key)).toEqual([
    'A',
    'B',
  ]);
  expect(
    mapToTableRecord([...data].reverse(), 'state.id').map(x => x.key),
  ).toEqual(['B', 'A']);
});

it('preserves filter configuration when searching', () => {
  const view = {
    id: 'V',
    name: 'V',
    definitionId: 'D',
    type: 'PERSONAL',
    source: 'CUSTOM',
    isDefault: false,
    columns: [],
    filters: [
      {
        key: 'status',
        type: 'select',
        field: { name: 'status', label: 'Status' },
        value: {
          defaultValue: ['open'],
          options: [
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
          ],
        },
        operator: {
          defaultValue: Operator.IN,
          supportedOperators: [Operator.IN],
        },
      },
    ],
    tableSize: 'middle',
    pageSize: 10,
    condition: { operator: 'ALL' },
    sorter: [],
  } as any;
  const { result } = renderHook(() =>
    useViewerState({
      views: [view],
      defaultView: view,
      definition: {
        id: 'D',
        name: 'D',
        fields: [],
        availableFilters: [],
        dataUrl: '/data',
        countUrl: '/count',
      },
    }),
  );
  const condition = { field: 'status', operator: Operator.IN, value: ['open'] };
  act(() =>
    result.current.setCondition(
      condition,
      new Map([['status', condition]]),
      new Map([['status', { operator: Operator.IN, value: ['open'] }]]),
    ),
  );
  expect(result.current.activeFilters[0].value.options).toEqual(
    view.filters[0].value.options,
  );
  expect(result.current.activeFilters[0].operator.supportedOperators).toEqual([
    Operator.IN,
  ]);
  act(() =>
    result.current.setCondition(
      { operator: Operator.ALL },
      new Map(),
      new Map([['status', { operator: Operator.IN, value: undefined }]]),
    ),
  );
  expect(result.current.activeFilters[0].value?.defaultValue).toBeUndefined();
  expect(result.current.activeFilters[0].value.options).toEqual(
    view.filters[0].value.options,
  );
  expect(result.current.activeFilters[0].operator.supportedOperators).toEqual([
    Operator.IN,
  ]);
});
it('updates controlled pagination once and resets controlled state', () => {
  const onChange = vi.fn();
  const columns = [{ key: 'id', name: 'id', hidden: false, fixed: true }];
  const { result } = renderHook(() => {
    const [page, setPage] = React.useState(10);
    const [size, setSize] = React.useState(10);
    const [tableSize, setTableSize] = React.useState<any>('small');
    const [currentColumns, setColumns] = React.useState<any[]>([]);
    return useViewState({
      defaultColumns: columns,
      defaultPage: 5,
      defaultPageSize: 10,
      defaultTableSize: 'middle',
      externalPage: page,
      externalUpdatePage: setPage,
      externalPageSize: size,
      externalUpdatePageSize: setSize,
      externalTableSize: tableSize,
      externalUpdateTableSize: setTableSize,
      externalColumns: currentColumns,
      externalUpdateColumns: setColumns,
      onChange,
    });
  });
  act(() => result.current.setPagination(2, 50));
  expect(result.current.page).toBe(2);
  expect(result.current.pageSize).toBe(50);
  expect(onChange).toHaveBeenCalledExactlyOnceWith(
    { operator: 'ALL' },
    2,
    50,
    [],
  );
  onChange.mockClear();
  act(() => result.current.reset());
  expect(result.current.page).toBe(5);
  expect(result.current.pageSize).toBe(10);
  expect(result.current.tableSize).toBe('middle');
  expect(result.current.columns).toEqual(columns);
  expect(onChange).toHaveBeenCalledTimes(1);
});
it('resets all fields when controlled by useViewerState', () => {
  const original = {
    id: 'original',
    name: 'Original',
    definitionId: 'definition',
    type: 'PERSONAL',
    source: 'CUSTOM',
    isDefault: false,
    columns: [{ name: 'id', key: 'id', fixed: true, hidden: false }],
    filters: [],
    condition: { operator: Operator.ALL },
    sorter: [],
    pageSize: 10,
    tableSize: 'middle',
  } as any;
  const onChange = vi.fn();
  const { result } = renderHook(() => {
    const viewer = useViewerState({
      views: [original],
      defaultView: original,
      definition: {
        id: 'definition',
        name: 'Definition',
        fields: [],
        availableFilters: [],
        dataUrl: '/data',
        countUrl: '/count',
      },
    });
    const view = useViewState({
      defaultColumns: original.columns,
      defaultActiveFilters: original.filters,
      defaultCondition: original.condition,
      defaultPageSize: original.pageSize,
      defaultTableSize: original.tableSize,
      defaultSorter: original.sorter,
      externalColumns: viewer.columns,
      externalUpdateColumns: viewer.setColumns,
      externalActiveFilters: viewer.activeFilters,
      externalUpdateActiveFilters: viewer.setActiveFilters,
      externalCondition: viewer.condition,
      externalUpdateCondition: viewer.setCondition,
      externalPage: viewer.page,
      externalUpdatePage: viewer.setPage,
      externalPageSize: viewer.pageSize,
      externalUpdatePageSize: viewer.setPageSize,
      externalTableSize: viewer.tableSize,
      externalUpdateTableSize: viewer.setTableSize,
      externalSorter: viewer.sorter,
      externalUpdateSorter: viewer.setSorter,
      onChange,
    });
    return { viewer, view };
  });
  act(() => result.current.view.setColumns([]));
  act(() => result.current.view.setPageSize(50));
  act(() => result.current.view.setTableSize('small'));
  onChange.mockClear();
  act(() => result.current.view.reset());
  expect(result.current.viewer.activeView).toEqual(original);
  expect(onChange).toHaveBeenCalledTimes(1);
});
it('requests the clamped page once when the pagination size changes', () => {
  const onChange = vi.fn();
  render(<View {...props} defaultPage={10} onChange={onChange} />);
  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(screen.getByText('50 / page'));
  expect(onChange).toHaveBeenCalledExactlyOnceWith(
    { operator: Operator.ALL },
    2,
    50,
    [],
  );
});
