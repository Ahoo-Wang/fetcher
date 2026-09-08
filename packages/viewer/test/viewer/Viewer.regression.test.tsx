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
  waitFor,
} from '@testing-library/react';
const state = vi.hoisted(() => ({ topbar: null as any }));
vi.mock('../../src/topbar/TopBar', () => ({
  TopBar: (props: any) => {
    state.topbar = props;
    return <output>{JSON.stringify(props.tableSelectedItems)}</output>;
  },
}));
vi.mock('../../src/viewer/panel/ViewPanel', () => ({
  ViewPanel: (props: any) => (
    <button onClick={() => props.onSwitchView(props.views[1])}>
      switch view B
    </button>
  ),
}));
vi.mock('@ahoo-wang/fetcher-react', async original => ({
  ...(await original<any>()),
  dataMonitorService: { initialize: () => {} },
}));
import { Viewer } from '../../src/viewer/Viewer';
import { all } from '@ahoo-wang/fetcher-wow';
const definition = {
  id: 'D',
  name: 'D',
  fields: [{ name: 'id', label: 'ID', type: 'text', primaryKey: true }],
  availableFilters: [],
  dataUrl: '/data',
  countUrl: '/count',
};
const a = {
  id: 'A',
  name: 'A',
  definitionId: 'D',
  type: 'PERSONAL',
  source: 'CUSTOM',
  isDefault: false,
  columns: [{ key: 'id', name: 'id', fixed: true, hidden: false }],
  filters: [],
  tableSize: 'middle',
  pageSize: 10,
  condition: { operator: 'ALL' },
  sorter: [],
} as any;
const b = { ...a, id: 'B', name: 'B' };
afterEach(cleanup);
it('requests ALL exactly once when resetting a saved view without a condition', () => {
  const onLoadData = vi.fn();
  const savedView = { ...a };
  delete savedView.condition;
  render(
    <Viewer
      defaultViews={[savedView]}
      defaultView={savedView}
      definition={definition}
      dataSource={{ list: [], total: 0 }}
      pagination={{}}
      onLoadData={onLoadData}
    />,
  );
  onLoadData.mockClear();
  act(() => state.topbar.onReset());
  expect(onLoadData).toHaveBeenCalledExactlyOnceWith(all(), 1, 10, []);
});

it('clears batch selection when switching views', () => {
  const ref = React.createRef<any>();
  const onLoadData = vi.fn();
  render(
    <Viewer
      ref={ref}
      defaultViews={[a, b]}
      defaultView={a}
      definition={definition}
      dataSource={{ list: [{ id: 'old-A-record' }], total: 1 }}
      pagination={false}
      onLoadData={onLoadData}
    />,
  );
  const checkboxes = screen.getAllByRole('checkbox');
  fireEvent.click(checkboxes[checkboxes.length - 1]);
  expect(state.topbar.tableSelectedItems).toHaveLength(1);
  fireEvent.click(screen.getByText('switch view B'));
  expect(ref.current.getActiveView().id).toBe('B');
  expect(state.topbar.tableSelectedItems).toEqual([]);
  expect(screen.getAllByRole('checkbox').every((c: any) => !c.checked)).toBe(
    true,
  );
  expect(onLoadData).not.toHaveBeenCalled();
});
it('selects a remaining view after deleting the active view', () => {
  const ref = React.createRef<any>();
  render(
    <Viewer
      ref={ref}
      defaultViews={[a, b]}
      defaultView={a}
      definition={definition}
      dataSource={{ list: [], total: 0 }}
      pagination={false}
      onDeleteView={(v, done) => done?.(v)}
    />,
  );
  act(() => state.topbar.onDeleteView(a));
  expect(state.topbar.views.map((v: any) => v.id)).toEqual(['B']);
  expect(ref.current.getActiveView().id).toBe('B');
});
it.each(['create', 'update'])(
  'clears selection on %s success, including same-view updates',
  operation => {
    const onSwitchView = vi.fn();
    render(
      <Viewer
        defaultViews={[a, b]}
        defaultView={a}
        definition={definition}
        dataSource={{ list: [{ id: 'old-A-record' }], total: 1 }}
        pagination={false}
        onSwitchView={onSwitchView}
        onCreateView={(view, done) => done?.(view)}
        onUpdateView={(view, done) => done?.(view)}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[checkboxes.length - 1]);
    act(() =>
      operation === 'create'
        ? state.topbar.onCreateView({ ...a, id: 'created' })
        : state.topbar.onUpdateView({ ...a, name: 'Renamed' }),
    );
    expect(state.topbar.tableSelectedItems).toEqual([]);
    expect(screen.getAllByRole('checkbox').every((c: any) => !c.checked)).toBe(
      true,
    );
    expect(onSwitchView).toHaveBeenCalledTimes(1);
  },
);
it('renders an empty viewer after deleting its last view', () => {
  const ref = React.createRef<any>();
  const { container } = render(
    <Viewer
      ref={ref}
      defaultViews={[a]}
      defaultView={a}
      definition={definition}
      dataSource={{ list: [], total: 0 }}
      pagination={false}
      onDeleteView={(v, done) => done?.(v)}
    />,
  );
  act(() => state.topbar.onDeleteView(a));
  expect(container.querySelector('.ant-table')).toBeNull();
  expect(ref.current.getActiveView()).toBeUndefined();
});
it('creates a replacement view from the empty state after deleting the last view', async () => {
  const ref = React.createRef<any>();
  render(
    <Viewer
      ref={ref}
      defaultViews={[a]}
      defaultView={a}
      definition={definition}
      dataSource={{ list: [], total: 0 }}
      pagination={false}
      onDeleteView={(view, done) => done?.(view)}
      onCreateView={(view, done) => done?.({ ...view, id: 'replacement' })}
    />,
  );
  act(() => state.topbar.onDeleteView(a));
  expect(ref.current.getActiveView()).toBeUndefined();

  fireEvent.click(screen.getByRole('button', { name: '创建视图' }));
  fireEvent.change(screen.getByLabelText('视图名称'), {
    target: { value: 'Replacement' },
  });
  fireEvent.click(screen.getByRole('button', { name: '确 认' }));

  await waitFor(() => {
    expect(ref.current.getActiveView()).toMatchObject({
      id: 'replacement',
      name: 'Replacement',
      type: 'PERSONAL',
      source: 'CUSTOM',
      isDefault: false,
    });
  });
  expect(screen.queryByText('未找到视图')).toBeNull();
});
it('restores saved filters and requests exactly once when resetting Viewer', () => {
  const onLoadData = vi.fn();
  const originalCondition = {
    operator: 'EQ',
    field: 'status',
    value: 'original',
  } as any;
  const originalView = {
    ...a,
    condition: originalCondition,
    filters: [
      {
        key: 'status',
        type: 'text',
        field: { name: 'status', label: 'Status' },
        operator: { defaultValue: 'EQ' },
        value: { defaultValue: 'original' },
      },
    ],
  } as any;
  const { container } = render(
    <Viewer
      defaultViews={[originalView]}
      defaultView={originalView}
      definition={definition}
      dataSource={{ list: [], total: 0 }}
      pagination={{}}
      onLoadData={onLoadData}
    />,
  );
  fireEvent.change(screen.getByLabelText('Status value'), {
    target: { value: 'changed' },
  });
  fireEvent.click(container.querySelector('button.ant-btn-primary')!);
  onLoadData.mockClear();
  act(() => state.topbar.onReset());
  expect(screen.getByLabelText('Status value')).toHaveValue('original');
  expect(onLoadData).toHaveBeenCalledExactlyOnceWith(
    originalCondition,
    1,
    10,
    [],
  );
});
