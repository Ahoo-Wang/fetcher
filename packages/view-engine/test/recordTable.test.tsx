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
import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { filter, SortDirection } from '@ahoo-wang/fetcher-wow';
import { RecordTable } from '../src/record/RecordTable.js';
import { RecordColumnSettings } from '../src/record/RecordColumnSettings.js';
import type {
  RecordColumn,
  ViewDefinition,
  ViewInstance,
} from '../src/record/recordModel.js';
import { getRecordColumnPinning } from '../src/record/recordModel.js';
import type { RecordTableProps } from '../src/record/recordReactTypes.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockColumnLayout() {
  // jsdom has no DragEvent constructor; MouseEvent preserves client coordinates.
  vi.stubGlobal('DragEvent', MouseEvent);
  const list = screen
    .getByRole('dialog', { name: '列设置' })
    .querySelector('ol')!;
  for (const item of Array.from(list.children)) {
    vi.spyOn(item, 'getBoundingClientRect').mockImplementation(() => {
      const index = Array.from(list.children).indexOf(item);
      return DOMRect.fromRect({
        x: 0,
        y: 100 + index * 56,
        width: 360,
        height: 44,
      });
    });
  }
  return list;
}

it('fills available width with automatic business columns and preserves explicit widths after resizing', () => {
  let resize!: (width: number) => void;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = width =>
          callback(
            [{ contentRect: { width } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
      }
      observe() {}
      disconnect() {}
    },
  );
  const onColumnsChange = vi.fn();
  const configured: RecordColumn[] = [
    { id: 'key', kind: 'field', field: 'meta.id', width: 120 },
    { id: 'name', kind: 'field', field: 'name' },
    {
      id: 'amount',
      kind: 'field',
      field: 'amount',
      width: 100,
      summary: ['SUM'],
    },
    { id: 'actions', kind: 'actions', width: 80 },
  ];
  function Example() {
    const [current, setCurrent] = useState(configured);
    return (
      <RecordTable
        {...props({
          definition: {
            ...definition,
            fields: [
              ...definition.fields,
              { field: 'meta.id', label: '编号', type: 'string' },
            ],
            recordActions: { row: { name: 'actions' } },
          },
          instance: {
            ...instance,
            config: {
              ...instance.config,
              presentation: { layout: 'table', table: { columns: current } },
            },
          },
          selectable: true,
          extensions: { rowActions: { actions: () => <button>查看</button> } },
          onColumnsChange: columns => {
            onColumnsChange(columns);
            setCurrent(columns);
          },
        })}
      />
    );
  }
  render(<Example />);
  act(() => resize(1000));
  const name = screen.getByRole('columnheader', { name: /名称/ });
  expect(name.style.width).toBe('480px');
  expect(screen.getByRole('columnheader', { name: /编号/ }).style.width).toBe(
    '120px',
  );
  expect(screen.getByRole('columnheader', { name: /金额/ }).style.width).toBe(
    '100px',
  );
  expect(screen.getByRole('columnheader', { name: /操作/ }).style.width).toBe(
    '80px',
  );
  expect(onColumnsChange).not.toHaveBeenCalled();
  act(() => resize(600));
  expect(name.style.width).toBe('252px');
  act(() => resize(1000));
  fireEvent.keyDown(screen.getByRole('separator', { name: '调整名称列宽' }), {
    key: 'ArrowLeft',
  });
  expect(onColumnsChange).toHaveBeenLastCalledWith(
    configured.map(column =>
      column.id === 'name' ? { ...column, width: 470 } : column,
    ),
  );
  expect(name.style.width).toBe('470px');
  act(() => resize(1200));
  expect(name.style.width).toBe('470px');
  expect(screen.getByRole('table').style.width).toBe('1200px');
  expect(screen.getByRole('columnheader', { name: /操作/ }).style.right).toBe(
    '0px',
  );
  expect(screen.getAllByRole('columnheader')).toHaveLength(5);
  expect(onColumnsChange).toHaveBeenCalledTimes(1);
  act(() => resize(400));
  expect(screen.getByRole('table').style.width).toBe('818px');
});

it('keeps fractional automatic columns automatic after a resize gesture without movement', () => {
  let resize!: (width: number) => void;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = width =>
          callback(
            [{ contentRect: { width } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
      }
      observe() {}
      disconnect() {}
    },
  );
  const onColumnsChange = vi.fn();
  function Example() {
    const [current, setCurrent] = useState<RecordColumn[]>(
      ['a', 'b', 'c'].map(id => ({ id, kind: 'field', field: 'name' })),
    );
    return (
      <RecordTable
        {...props({
          instance: {
            ...instance,
            config: {
              ...instance.config,
              presentation: { layout: 'table', table: { columns: current } },
            },
          },
          onColumnsChange: columns => {
            onColumnsChange(columns);
            setCurrent(columns);
          },
        })}
      />
    );
  }
  render(<Example />);
  act(() => resize(1000));
  const handle = screen.getAllByRole('separator', { name: '调整名称列宽' })[0];
  fireEvent.mouseDown(handle, { clientX: 334 });
  fireEvent.mouseUp(document, { clientX: 334 });
  expect(onColumnsChange).not.toHaveBeenCalled();
  fireEvent.mouseDown(handle, { clientX: 334 });
  act(() => resize(1200));
  fireEvent.mouseUp(document, { clientX: 334 });
  expect(onColumnsChange).not.toHaveBeenCalled();
  for (const column of screen.getAllByRole('columnheader'))
    expect(column.style.width).toBe('400px');
  fireEvent.mouseDown(handle, { clientX: 400 });
  fireEvent.mouseUp(document, { clientX: 440 });
  expect(onColumnsChange).toHaveBeenCalledTimes(1);
  expect(onColumnsChange.mock.lastCall?.[0]).toEqual([
    { id: 'a', kind: 'field', field: 'name', width: 440 },
    { id: 'b', kind: 'field', field: 'name' },
    { id: 'c', kind: 'field', field: 'name' },
  ]);
});

it('keeps headers, records and summaries aligned with default action pins, resizing and hidden columns', () => {
  const pinnedColumns: RecordColumn[] = [
    { id: 'review', title: '审核', kind: 'actions', width: 80 },
    {
      id: 'name',
      kind: 'field',
      field: 'name',
      width: 120,
      pinned: 'left',
    },
    {
      id: 'hidden',
      kind: 'field',
      field: 'status',
      width: 900,
      pinned: 'left',
      visible: false,
    },
    {
      id: 'amount',
      kind: 'field',
      field: 'amount',
      width: 200,
      summary: ['SUM'],
    },
    {
      id: 'alias',
      title: '别名',
      kind: 'field',
      field: 'name',
      width: 100,
      pinned: 'left',
    },
    { id: 'more', title: '更多', kind: 'actions', width: 64 },
  ];
  const onColumnsChange = vi.fn();
  const draw = (next = pinnedColumns, selectable = true) => (
    <RecordTable
      {...props({
        instance: {
          ...instance,
          config: {
            ...instance.config,
            presentation: { layout: 'table', table: { columns: next } },
          },
        },
        definition: {
          ...definition,
          recordActions: { row: { name: 'actions' } },
        },
        extensions: { rowActions: { actions: () => <button>查看</button> } },
        pageSummary: {
          status: 'success',
          values: { amount: { SUM: 10 } },
          error: null,
        },
        allSummary: {
          status: 'success',
          values: { amount: { SUM: 100 } },
          error: null,
        },
        selectable,
        onColumnsChange,
      })}
    />
  );
  const view = render(draw());
  const cells = (selector: string) =>
    Array.from(view.container.querySelectorAll<HTMLElement>(selector));
  expect(cells('thead th').map(cell => cell.textContent)).toEqual([
    '',
    '名称',
    '别名',
    '金额',
    '审核',
    '更多',
  ]);
  expect(cells('tbody td').map(cell => cell.textContent)).toEqual([
    '',
    'Zulu',
    'Zulu',
    '10',
    '查看',
    '查看',
  ]);
  expect(
    cells('tfoot tr:first-child > *').map(cell => cell.textContent),
  ).toEqual(['本页', '', '', '合计10', '', '']);
  for (const selector of [
    'thead th',
    'tbody td',
    'tfoot tr:first-child > *',
    'tfoot tr:last-child > *',
  ]) {
    const row = cells(selector);
    expect(row[0].style.left).toBe('0px');
    expect(row[1].style.left).toBe('48px');
    expect(row[2].style.left).toBe('168px');
    expect(row[4].style.right).toBe('64px');
    expect(row[5].style.right).toBe('0px');
  }
  view.rerender(
    draw(
      pinnedColumns.map(column =>
        column.id === 'name' ? { ...column, width: 140 } : column,
      ),
    ),
  );
  expect(cells('tbody td')[2].style.left).toBe('188px');
  view.rerender(
    draw(
      pinnedColumns.map(column =>
        column.id === 'name'
          ? { ...column, visible: false }
          : column.id === 'more'
            ? { ...column, pinned: false }
            : column,
      ),
      false,
    ),
  );
  expect(cells('thead th').map(cell => cell.textContent)).toEqual([
    '别名',
    '金额',
    '审核',
    '更多',
  ]);
  expect(cells('tbody td')[0].style.left).toBe('0px');
  expect(cells('tbody td')[2].style.right).toBe('64px');
  expect(cells('tbody td')[3].style.right).toBe('0px');
  expect(onColumnsChange).not.toHaveBeenCalled();
});

const definition: ViewDefinition = {
  id: 'orders',
  title: '订单',
  sourceId: 'orders',
  rowKey: 'meta.id',
  fields: [
    { field: 'name', label: '名称', type: 'string', sortable: true },
    { field: 'amount', label: '金额', type: 'number', sortable: true },
    {
      field: 'status',
      label: '状态',
      options: [{ value: 1, label: '已付款' }],
    },
    { field: 'active', label: '启用', type: 'boolean' },
    { field: 'detail', label: '详情' },
  ],
};
const columns: RecordColumn[] = [
  { id: 'name', kind: 'field', field: 'name', width: 180 },
  { id: 'amount', kind: 'field', field: 'amount', width: 180 },
];

it('keeps business fields readable in compact tables and restores saved pinning and widths', async () => {
  let resize!: (width: number) => void;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe(target: Element) {
        if (!target.querySelector('table')) return;
        resize = width =>
          this.callback(
            [{ contentRect: { width } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
      }
      disconnect() {}
    },
  );
  const onColumnsChange = vi.fn();
  const configured: RecordColumn[] = [
    { id: 'key', kind: 'field', field: 'meta.id', width: 210 },
    { id: 'name', kind: 'field', field: 'name', width: 180, pinned: 'left' },
    { id: 'amount', kind: 'field', field: 'amount', width: 150 },
    { id: 'actions', kind: 'actions', width: 110 },
  ];
  render(
    <RecordTable
      {...props({
        definition: {
          ...definition,
          fields: [
            ...definition.fields,
            { field: 'meta.id', label: '编号', type: 'string' },
          ],
          recordActions: { row: { name: 'actions' } },
        },
        instance: {
          ...instance,
          config: {
            ...instance.config,
            presentation: { layout: 'table', table: { columns: configured } },
          },
        },
        selectable: true,
        extensions: {
          rowActions: {
            actions: ({ rowKey }) => <button>查看 {rowKey}</button>,
          },
        },
        onColumnsChange,
      })}
    />,
  );
  act(() => resize(356));
  const key = screen.getByRole('columnheader', { name: /编号/ });
  const actions = screen.getByRole('columnheader', { name: /操作/ });
  expect(
    356 - 48 - parseFloat(key.style.width) - parseFloat(actions.style.width),
  ).toBeGreaterThanOrEqual(128);
  expect(key.getAttribute('data-pinned')).toBe('start');
  expect(actions.getAttribute('data-pinned')).toBe('end');
  expect(
    screen
      .getByRole('columnheader', { name: /名称/ })
      .getAttribute('data-pinned'),
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '记录 0 操作' }));
  expect(
    within(
      await screen.findByRole('dialog', { name: '记录 0 操作' }),
    ).getByRole('button', { name: '查看 0' }),
  ).toBeTruthy();
  act(() => resize(160));
  expect(screen.getByText('空间不足，请展开视图或减少显示列。')).toBeTruthy();
  act(() => resize(1000));
  expect(screen.queryByText('空间不足，请展开视图或减少显示列。')).toBeNull();
  expect(screen.getByRole('columnheader', { name: /编号/ }).style.width).toBe(
    '210px',
  );
  expect(screen.getByRole('columnheader', { name: /操作/ }).style.width).toBe(
    '110px',
  );
  expect(
    screen
      .getByRole('columnheader', { name: /名称/ })
      .getAttribute('data-pinned'),
  ).toBe('start');
  expect(onColumnsChange).not.toHaveBeenCalled();
});
const instance: ViewInstance = {
  id: 'mine',
  definitionId: 'orders',
  title: '我的订单',
  kind: 'record',
  scope: { type: 'personal' },
  config: {
    filter: filter.matchAll(),
    sort: [],
    pagination: { mode: 'paged', size: 20 },
    presentation: { layout: 'table', table: { columns } },
  },
};
function props(overrides: Partial<RecordTableProps> = {}): RecordTableProps {
  return {
    definition,
    instance,
    rows: [{ meta: { id: 0 }, name: 'Zulu', amount: 10 }],
    selectedRowKeys: [],
    onSelectionChange: vi.fn(),
    onColumnsChange: vi.fn(),
    onSortChange: vi.fn(),
    refresh: vi.fn(async () => {}),
    ...overrides,
  };
}

it('locks the bound row key and actions to opposite edges despite conflicting preferences or order', () => {
  const configured: RecordColumn[] = [
    {
      id: 'actions',
      kind: 'actions',
      title: '操作',
      width: 80,
      pinned: 'left',
    },
    {
      id: 'left',
      kind: 'field',
      field: 'name',
      title: '左侧字段',
      width: 100,
      pinned: 'left',
    },
    {
      id: 'right',
      kind: 'field',
      field: 'amount',
      title: '右侧字段',
      width: 90,
      pinned: 'right',
    },
    {
      id: 'primary',
      kind: 'field',
      field: 'meta.id',
      title: '主键',
      width: 70,
      pinned: false,
    },
    {
      id: 'id',
      kind: 'field',
      field: 'name',
      title: '普通 ID 列',
      width: 110,
      pinned: false,
    },
  ];
  const before = structuredClone(configured);
  expect(getRecordColumnPinning(configured[0], definition.rowKey)).toBe(
    'right',
  );
  expect(getRecordColumnPinning(configured[3], definition.rowKey)).toBe('left');
  expect(getRecordColumnPinning(configured[4], definition.rowKey)).toBe(false);
  const boundDefinition: ViewDefinition = {
    ...definition,
    fields: [
      ...definition.fields,
      { field: 'meta.id', label: '主键', type: 'number' },
    ],
    recordActions: { row: { name: 'actions' } },
  };
  const onChange = vi.fn();
  const view = render(
    <>
      <RecordColumnSettings
        definition={boundDefinition}
        columns={configured}
        onChange={onChange}
      />
      <RecordTable
        {...props({
          definition: boundDefinition,
          instance: {
            ...instance,
            config: {
              ...instance.config,
              presentation: { layout: 'table', table: { columns: configured } },
            },
          },
          selectable: true,
          extensions: { rowActions: { actions: () => <button>查看</button> } },
          onColumnsChange: onChange,
        })}
      />
    </>,
  );
  const headers = Array.from(
    view.container.querySelectorAll<HTMLElement>('thead th'),
  );
  expect(headers.map(cell => cell.textContent)).toEqual([
    '',
    '主键',
    '左侧字段',
    '普通 ID 列',
    '右侧字段',
    '操作',
  ]);
  for (const selector of ['thead th', 'tbody td']) {
    const cells = view.container.querySelectorAll<HTMLElement>(selector);
    expect(cells[1].style.left).toBe('48px');
    expect(cells[2].style.left).toBe('118px');
    expect(cells[4].style.right).toBe('80px');
    expect(cells[5].style.right).toBe('0px');
  }
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  expect(screen.queryByRole('combobox', { name: '主键固定位置' })).toBeNull();
  expect(screen.queryByRole('combobox', { name: '操作固定位置' })).toBeNull();
  expect(screen.getByRole('button', { name: '固定普通 ID 列' })).toBeTruthy();
  for (const name of ['固定主键', '固定操作']) {
    const button = screen.getByRole('button', { name }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
  }
  for (const name of ['主键', '左侧字段', '右侧字段', '操作'])
    expect(
      (
        screen.getByRole('button', {
          name: `拖动调整${name}顺序`,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  expect(configured).toEqual(before);
  expect(onChange).not.toHaveBeenCalled();
});

it('toggles a pin icon without asking for a side and preserves configured sides until edited', () => {
  const configured: RecordColumn[] = [
    { ...columns[0], pinned: 'right' },
    columns[1],
  ];
  const onChange = vi.fn();
  function Example({ disabled = false }) {
    const [value, setValue] = useState(configured);
    return (
      <RecordColumnSettings
        definition={definition}
        columns={value}
        disabled={disabled}
        onChange={next => {
          onChange(next);
          setValue(next);
        }}
      />
    );
  }
  const view = render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  expect(screen.queryByRole('combobox', { name: /固定位置/ })).toBeNull();
  const amountPin = screen.getByRole('button', { name: '固定金额' });
  expect(amountPin.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(amountPin);
  expect(amountPin.getAttribute('aria-pressed')).toBe('true');
  expect(onChange.mock.lastCall?.[0]).toEqual([
    { ...columns[1], pinned: 'right' },
    configured[0],
  ]);
  fireEvent.click(amountPin);
  expect(amountPin.getAttribute('aria-pressed')).toBe('false');
  expect(onChange.mock.lastCall?.[0]).toEqual([
    { ...columns[1], pinned: false },
    configured[0],
  ]);
  const namePin = screen.getByRole('button', { name: '固定名称' });
  expect(namePin.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(namePin);
  expect(namePin.getAttribute('aria-pressed')).toBe('false');
  expect((namePin as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(namePin);
  expect(onChange).toHaveBeenCalledTimes(3);
  view.rerender(<Example disabled />);
  fireEvent.click(namePin);
  expect(onChange).toHaveBeenCalledTimes(3);
  expect(configured[0].pinned).toBe('right');
});

it('pins only beside one pinned neighbor and inherits that side', () => {
  const configured: RecordColumn[] = [
    { id: 'key', kind: 'field', field: 'meta.id', title: '主键' },
    ...columns,
    { id: 'status', kind: 'field', field: 'status', title: '状态' },
    { id: 'actions', kind: 'actions', title: '操作' },
  ];
  const onChange = vi.fn();
  function Example() {
    const [current, setCurrent] = useState(configured);
    return (
      <RecordColumnSettings
        definition={definition}
        columns={current}
        onChange={next => {
          onChange(next);
          setCurrent(next);
        }}
      />
    );
  }
  render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  const pin = (title: string) =>
    screen.getByRole('button', { name: `固定${title}` }) as HTMLButtonElement;
  expect(pin('金额').disabled).toBe(true);
  fireEvent.click(pin('金额'));
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(pin('名称'));
  expect(
    onChange.mock.lastCall?.[0].find(
      (column: RecordColumn) => column.id === 'name',
    ).pinned,
  ).toBe('left');
  fireEvent.click(pin('状态'));
  expect(
    onChange.mock.lastCall?.[0].find(
      (column: RecordColumn) => column.id === 'status',
    ).pinned,
  ).toBe('right');
  expect(pin('金额').disabled).toBe(true);
  expect(pin('金额').title).toContain('上下列均已固定');
  fireEvent.click(pin('名称'));
  expect(pin('金额').disabled).toBe(false);
  fireEvent.click(pin('金额'));
  expect(
    onChange.mock.lastCall?.[0].find(
      (column: RecordColumn) => column.id === 'amount',
    ).pinned,
  ).toBe('right');
  expect(pin('名称').disabled).toBe(true);
  expect(pin('主键').disabled).toBe(true);
  expect(pin('操作').disabled).toBe(true);
  expect(screen.queryByRole('spinbutton')).toBeNull();
});

it('keeps zero, string and number keys distinct and selects only the supplied page', () => {
  const onSelectionChange = vi.fn();
  const rows = [
    { meta: { id: 0 }, name: '零' },
    { meta: { id: '1' }, name: '字符串' },
    { meta: { id: 1 }, name: '数字' },
  ];
  const view = render(
    <RecordTable
      {...props({
        rows,
        selectable: true,
        selectedRowKeys: ['1', 'off-page'],
        onSelectionChange,
      })}
    />,
  );
  const boxes = screen.getAllByRole('checkbox');
  expect(boxes.map(box => box.getAttribute('aria-checked'))).toEqual([
    'mixed',
    'false',
    'true',
    'false',
  ]);
  fireEvent.click(boxes[3]);
  expect(onSelectionChange).toHaveBeenLastCalledWith(['1', 1]);
  fireEvent.click(boxes[0]);
  expect(onSelectionChange).toHaveBeenLastCalledWith([0, '1', 1]);
  view.rerender(<RecordTable {...props({ rows, selectable: false })} />);
  expect(screen.queryByRole('checkbox')).toBeNull();
});

it('emits server multi-sort with a reset cycle and leaves server row order unchanged', () => {
  const onSortChange = vi.fn();
  function Example() {
    const [sort, setSort] = useState(instance.config.sort);
    return (
      <RecordTable
        {...props({
          rows: [
            { meta: { id: 1 }, name: 'Zulu', amount: 10 },
            { meta: { id: 2 }, name: 'Alpha', amount: 20 },
          ],
          instance: { ...instance, config: { ...instance.config, sort } },
          onSortChange: next => {
            onSortChange(next);
            setSort(next);
          },
        })}
      />
    );
  }
  render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: /名称.*排序/ }));
  expect(onSortChange).toHaveBeenLastCalledWith([
    { field: 'name', direction: SortDirection.ASC },
  ]);
  fireEvent.click(screen.getByRole('button', { name: /金额.*排序/ }), {
    shiftKey: true,
  });
  expect(onSortChange).toHaveBeenLastCalledWith([
    { field: 'name', direction: SortDirection.ASC },
    { field: 'amount', direction: SortDirection.ASC },
  ]);
  fireEvent.click(screen.getByRole('button', { name: /金额.*排序/ }), {
    shiftKey: true,
  });
  fireEvent.click(screen.getByRole('button', { name: /金额.*排序/ }), {
    shiftKey: true,
  });
  expect(onSortChange).toHaveBeenLastCalledWith([
    { field: 'name', direction: SortDirection.ASC },
  ]);
  expect(
    screen
      .getAllByRole('row')
      .slice(1)
      .map(row => within(row).getAllByRole('cell')[0].textContent),
  ).toEqual(['Zulu', 'Alpha']);
});

it('resolves explicit cells and row actions with complete records and preserved options', () => {
  const record = {
    meta: { id: 0 },
    name: 'A',
    amount: 9,
    secret: 'full record',
  };
  const tableInstance: ViewInstance = {
    ...instance,
    config: {
      ...instance.config,
      presentation: {
        layout: 'table',
        table: {
          columns: [
            {
              ...columns[0],
              renderer: { name: 'explicit', options: { prefix: '金额' } },
            },
            { id: 'actions', kind: 'actions' },
          ],
        },
      },
    },
  };
  const refresh = vi.fn(async () => {});
  render(
    <RecordTable
      {...props({
        rows: [record],
        instance: tableInstance,
        refresh,
        definition: {
          ...definition,
          fields: [
            { ...definition.fields[0], cellRenderer: { name: 'fallback' } },
          ],
          recordActions: {
            row: { name: 'actions', options: { label: '刷新' } },
          },
        },
        extensions: {
          cells: {
            explicit: p => (
              <span>
                {p.options?.prefix}:{p.record.secret}:{p.rowKey}:{p.value}
              </span>
            ),
            fallback: () => <span>错误回退</span>,
          },
          rowActions: {
            actions: p => (
              <button onClick={() => void p.refresh()}>
                {p.options?.label}:{p.record.secret}:{p.rowKey}
              </button>
            ),
          },
        },
      })}
    />,
  );
  expect(screen.getByText('金额:full record:0:A')).toBeTruthy();
  expect(screen.queryByText('错误回退')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '刷新:full record:0' }));
  expect(refresh).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button', { name: /操作.*排序/ })).toBeNull();
});

it('isolates missing and throwing renderers while keeping built-in values readable', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const tableColumns: RecordColumn[] = [
    {
      id: 'missing',
      kind: 'field',
      field: 'name',
      renderer: { name: 'missing' },
    },
    {
      id: 'broken',
      kind: 'field',
      field: 'amount',
      renderer: { name: 'broken' },
    },
    { id: 'status', kind: 'field', field: 'status' },
    { id: 'active', kind: 'field', field: 'active' },
    { id: 'detail', kind: 'field', field: 'detail' },
  ];
  render(
    <RecordTable
      {...props({
        instance: {
          ...instance,
          config: {
            ...instance.config,
            presentation: { layout: 'table', table: { columns: tableColumns } },
          },
        },
        rows: [
          {
            meta: { id: 1 },
            name: 'A',
            amount: 5,
            status: 1,
            active: false,
            detail: { value: 2 },
          },
        ],
        extensions: {
          cells: {
            broken: () => {
              throw new Error('cell failed');
            },
          },
        },
      })}
    />,
  );
  expect(screen.getByText(/未注册.*missing/)).toBeTruthy();
  expect(screen.getByText(/渲染失败/)).toBeTruthy();
  expect(screen.getByText('已付款')).toBeTruthy();
  expect(screen.getByText('否')).toBeTruthy();
  expect(screen.getByText('{"value":2}')).toBeTruthy();
});

it('commits resizing at drag end and supports keyboard resizing', () => {
  const onColumnsChange = vi.fn();
  render(<RecordTable {...props({ onColumnsChange })} />);
  const handle = screen.getByRole('separator', { name: '调整名称列宽' });
  fireEvent.mouseDown(handle, { clientX: 180 });
  fireEvent.mouseMove(document, { clientX: 220 });
  expect(onColumnsChange).not.toHaveBeenCalled();
  fireEvent.mouseUp(document, { clientX: 220 });
  expect(onColumnsChange).toHaveBeenLastCalledWith([
    { ...columns[0], width: 220 },
    columns[1],
  ]);
  fireEvent.keyDown(handle, { key: 'ArrowRight' });
  expect(onColumnsChange).toHaveBeenLastCalledWith([
    { ...columns[0], width: 190 },
    columns[1],
  ]);
});

it('keeps renderer failures isolated across unrelated updates and recovers after extension changes', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const broken = vi.fn(() => {
    throw new Error('broken renderer');
  });
  const value = props({
    instance: {
      ...instance,
      config: {
        ...instance.config,
        presentation: {
          layout: 'table',
          table: { columns: [{ ...columns[0], renderer: { name: 'custom' } }] },
        },
      },
    },
    extensions: { cells: { custom: broken } },
  });
  const view = render(<RecordTable {...value} />);
  const attempts = broken.mock.calls.length;
  view.rerender(<RecordTable {...value} selectedRowKeys={[0]} />);
  expect(broken).toHaveBeenCalledTimes(attempts);
  view.rerender(
    <RecordTable
      {...value}
      extensions={{ cells: { custom: () => <span>渲染已恢复</span> } }}
    />,
  );
  expect(screen.getByText('渲染已恢复')).toBeTruthy();
});

it('honors configured numeric precision and shows date-only, zoned datetime and null values', () => {
  const fields = [
    { ...definition.fields[1], numberFormat: { maximumFractionDigits: 8 } },
    { field: 'date', label: '日期', type: 'date' as const },
    {
      field: 'datetime',
      label: '时间',
      type: 'datetime' as const,
      timeZone: 'Asia/Shanghai',
    },
    { field: 'absent', label: '空值' },
  ];
  render(
    <RecordTable
      {...props({
        definition: { ...definition, fields },
        instance: {
          ...instance,
          config: {
            ...instance.config,
            presentation: {
              layout: 'table',
              table: {
                columns: fields.map(field => ({
                  id: field.field,
                  kind: 'field',
                  field: field.field,
                })),
              },
            },
          },
        },
        rows: [
          {
            meta: { id: 0 },
            amount: 1.2345678,
            date: '2026-09-06',
            datetime: '2026-09-06T12:30:45Z',
            absent: null,
          },
        ],
      })}
    />,
  );
  expect(screen.getByText('1.2345678')).toBeTruthy();
  expect(screen.getByText('2026-09-06')).toBeTruthy();
  expect(screen.getByText(/20:30:45/)).toBeTruthy();
  expect(screen.getByText('—')).toBeTruthy();
});

it('changes column order and visibility without hiding the final column', () => {
  const onChange = vi.fn();
  function Example() {
    const [value, setValue] = useState(columns);
    return (
      <RecordColumnSettings
        definition={definition}
        columns={value}
        onChange={next => {
          onChange(next);
          setValue(next);
        }}
      />
    );
  }
  render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  mockColumnLayout();
  const handle = screen.getByRole('button', { name: '拖动调整金额顺序' });
  const target = screen
    .getByRole('checkbox', { name: '显示名称' })
    .closest('li')!;
  const dataTransfer = {
    setData: vi.fn(),
    setDragImage: vi.fn(),
    effectAllowed: '',
    dropEffect: '',
  };
  fireEvent.dragStart(handle, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer, clientY: 110 });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.drop(target, { dataTransfer, clientY: 110 });
  fireEvent.dragEnd(handle, { dataTransfer });
  expect(onChange).toHaveBeenLastCalledWith([columns[1], columns[0]]);
  fireEvent.click(screen.getByRole('checkbox', { name: '显示名称' }));
  expect(
    (
      screen.getByRole('checkbox', { name: '显示金额' }) as HTMLInputElement
    ).getAttribute('aria-disabled'),
  ).toBe('true');
  expect(screen.queryByRole('spinbutton')).toBeNull();
});

it('keeps drag reordering within its fixed region and cancels without changing columns', () => {
  const configured: RecordColumn[] = [
    { id: 'key', kind: 'field', field: 'meta.id', title: '主键' },
    ...columns,
    { id: 'status', kind: 'field', field: 'status', title: '状态' },
    {
      id: 'right',
      kind: 'field',
      field: 'status',
      title: '右侧',
      pinned: 'right',
    },
    { id: 'actions', kind: 'actions' },
  ];
  const onChange = vi.fn();
  const view = render(
    <RecordColumnSettings
      definition={definition}
      columns={configured}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  mockColumnLayout();
  const handle = screen.getByRole('button', { name: '拖动调整金额顺序' });
  const dataTransfer = {
    setData: vi.fn(),
    setDragImage: vi.fn(),
    effectAllowed: '',
    dropEffect: '',
  };
  const target = (title: string) =>
    screen.getByRole('checkbox', { name: `显示${title}` }).closest('li')!;
  const nameHandle = screen.getByRole('button', { name: '拖动调整名称顺序' });
  fireEvent.dragStart(nameHandle, { dataTransfer });
  fireEvent.drop(target('状态'), { dataTransfer, clientY: 300 });
  expect(
    onChange.mock.lastCall?.[0].map((column: RecordColumn) => column.id),
  ).toEqual(['key', 'amount', 'status', 'name', 'right', 'actions']);
  onChange.mockClear();
  for (const title of ['主键', '右侧', '操作']) {
    fireEvent.dragStart(handle, { dataTransfer });
    const clientY = target(title).getBoundingClientRect().top + 10;
    fireEvent.dragOver(target(title), { dataTransfer, clientY });
    fireEvent.drop(target(title), { dataTransfer, clientY });
  }
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.dragStart(handle, { dataTransfer });
  fireEvent.dragOver(target('名称'), { dataTransfer, clientY: 166 });
  fireEvent.dragEnd(handle, { dataTransfer });
  fireEvent.drop(target('名称'), { dataTransfer, clientY: 166 });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.dragStart(handle, { dataTransfer });
  view.rerender(
    <RecordColumnSettings
      definition={definition}
      columns={configured}
      onChange={onChange}
      disabled
    />,
  );
  fireEvent.drop(target('名称'), { dataTransfer, clientY: 166 });
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /上移|下移/ })).toBeNull();
});

it('accepts the gap shown by the drop marker and uses the pointer side of each row', () => {
  const configured: RecordColumn[] = [
    ...columns,
    { id: 'status', kind: 'field', field: 'status', title: '状态' },
  ];
  const onChange = vi.fn();
  render(
    <RecordColumnSettings
      definition={definition}
      columns={configured}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  const list = mockColumnLayout();
  const handle = screen.getByRole('button', { name: '拖动调整名称顺序' });
  const dataTransfer = {
    setData: vi.fn(),
    setDragImage: vi.fn(),
    effectAllowed: '',
    dropEffect: '',
  };
  fireEvent.dragStart(handle, { dataTransfer });
  // A fast drag may leave its last dragover at the unchanged position.
  expect(fireEvent.dragOver(list, { dataTransfer, clientY: 166 })).toBe(false);
  // Amount ends at 200; status starts at 212. The insertion line is in this gap.
  expect(fireEvent.dragOver(list, { dataTransfer, clientY: 206 })).toBe(false);
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.drop(list, { dataTransfer, clientY: 206 });
  expect(onChange).toHaveBeenLastCalledWith([
    configured[1],
    configured[0],
    configured[2],
  ]);
  onChange.mockClear();
  const status = list.children[2];
  fireEvent.dragStart(handle, { dataTransfer });
  fireEvent.dragOver(status, { dataTransfer, clientY: 220 });
  fireEvent.drop(status, { dataTransfer, clientY: 220 });
  expect(onChange).toHaveBeenLastCalledWith([
    configured[1],
    configured[0],
    configured[2],
  ]);
  fireEvent.dragStart(handle, { dataTransfer });
  fireEvent.dragOver(status, { dataTransfer, clientY: 248 });
  fireEvent.drop(status, { dataTransfer, clientY: 248 });
  expect(onChange).toHaveBeenLastCalledWith([
    configured[1],
    configured[2],
    configured[0],
  ]);
});

it('supports keyboard reordering on the drag handle without crossing fixed regions', () => {
  const onChange = vi.fn();
  function Example() {
    const [value, setValue] = useState<RecordColumn[]>([
      { id: 'key', kind: 'field', field: 'meta.id', title: '主键' },
      ...columns,
      { id: 'actions', kind: 'actions' },
    ]);
    return (
      <RecordColumnSettings
        definition={definition}
        columns={value}
        onChange={next => {
          setValue(next);
          onChange(next);
        }}
      />
    );
  }
  render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  const handle = screen.getByRole('button', { name: '拖动调整金额顺序' });
  handle.focus();
  fireEvent.keyDown(handle, { key: 'ArrowUp' });
  expect(
    onChange.mock.lastCall?.[0].map((column: RecordColumn) => column.id),
  ).toEqual(['key', 'amount', 'name', 'actions']);
  expect(document.activeElement).toBe(handle);
  expect(screen.getByRole('status').textContent).toContain('金额已移至第 2 列');
  fireEvent.keyDown(handle, { key: 'ArrowUp' });
  expect(onChange).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(handle, { key: 'ArrowDown' });
  expect(
    onChange.mock.lastCall?.[0].map((column: RecordColumn) => column.id),
  ).toEqual(['key', 'name', 'amount', 'actions']);
});

it('selects multiple summary functions and clears the last selection without closing the list', async () => {
  const onChange = vi.fn();
  function Example() {
    const [columns, setColumns] = useState<RecordColumn[]>([
      { id: 'amount', kind: 'field', field: 'amount', summary: ['SUM'] },
    ]);
    return (
      <RecordColumnSettings
        definition={definition}
        columns={columns}
        onChange={next => {
          setColumns(next);
          onChange(next);
        }}
      />
    );
  }
  render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  fireEvent.click(screen.getByRole('combobox', { name: '金额汇总方式' }));
  const average = await screen.findByRole('option', { name: '平均值' });
  fireEvent.pointerDown(average, { pointerType: 'mouse' });
  fireEvent.click(average);
  expect(onChange.mock.lastCall?.[0][0].summary).toEqual(['SUM', 'AVG']);
  expect(
    screen.getByRole('option', { name: '合计' }).getAttribute('aria-selected'),
  ).toBe('true');
  expect(
    screen
      .getByRole('option', { name: '平均值' })
      .getAttribute('aria-selected'),
  ).toBe('true');
  const sum = screen.getByRole('option', { name: '合计' });
  fireEvent.pointerDown(sum, { pointerType: 'mouse' });
  fireEvent.click(sum);
  expect(onChange.mock.lastCall?.[0][0].summary).toEqual(['AVG']);
  fireEvent.pointerDown(average, { pointerType: 'mouse' });
  fireEvent.click(average);
  expect(onChange.mock.lastCall?.[0][0].summary).toBeUndefined();
  expect(
    screen.getByRole('combobox', { name: '金额汇总方式' }).textContent,
  ).toContain('不汇总');
  expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe(
    'true',
  );
});

it('shows one spinner per loading scope instead of repeating loading text for every metric', () => {
  const configured: ViewInstance = {
    ...instance,
    config: {
      ...instance.config,
      presentation: {
        layout: 'table',
        table: {
          columns: [
            {
              id: 'amount',
              kind: 'field',
              field: 'amount',
              summary: ['AVG', 'MIN', 'MAX'],
            },
            {
              id: 'amount-copy',
              kind: 'field',
              field: 'amount',
              summary: ['SUM'],
            },
          ],
        },
      },
    },
  };
  const loading = { status: 'loading' as const, values: {}, error: null };
  const draw = (selectable: boolean, querying = true) => (
    <RecordTable
      {...props({
        instance: configured,
        selectable,
        querying,
        rows: querying ? [] : props().rows,
        pageSummary: querying
          ? loading
          : {
              status: 'success',
              values: { amount: { AVG: 1, MIN: 0, MAX: 2 } },
              error: null,
            },
        allSummary: loading,
      })}
    />
  );
  const view = render(draw(true));
  expect(screen.getAllByRole('status')).toHaveLength(3);
  expect(screen.getByRole('status', { name: '正在加载记录' })).toBeTruthy();
  expect(screen.getByRole('status', { name: '本页汇总加载中' })).toBeTruthy();
  expect(screen.getByRole('status', { name: '所有汇总加载中' })).toBeTruthy();
  expect(screen.queryByText(/统计中|正在加载/)).toBeNull();
  view.rerender(draw(false));
  expect(screen.getAllByRole('status')).toHaveLength(3);
  view.rerender(draw(false, false));
  expect(screen.getAllByRole('status')).toHaveLength(1);
  expect(screen.getByRole('status', { name: '所有汇总加载中' })).toBeTruthy();
});

it('formats numeric records and ordered metrics consistently with one fixed scope label', () => {
  const numberFormat = { style: 'currency' as const, currency: 'CNY' };
  const formattedDefinition = {
    ...definition,
    fields: definition.fields.map(field =>
      field.field === 'amount' ? { ...field, numberFormat } : field,
    ),
  };
  const value = 2025.3333333333333;
  const configured: ViewInstance = {
    ...instance,
    config: {
      ...instance.config,
      presentation: {
        layout: 'table',
        table: {
          columns: [
            {
              id: 'amount',
              kind: 'field',
              field: 'amount',
              summary: ['MAX', 'AVG', 'SUM'],
            },
          ],
        },
      },
    },
  };
  const drawProps = props({
    definition: formattedDefinition,
    instance: configured,
    selectable: true,
    rows: [{ meta: { id: 'one' }, amount: value }],
    pageSummary: {
      status: 'success',
      values: { amount: { SUM: 6076, AVG: value, MAX: 3600 } },
      error: null,
    },
    allSummary: {
      status: 'success',
      values: { amount: { SUM: 6076, AVG: value, MAX: 3600 } },
      error: null,
    },
  });
  const view = render(<RecordTable {...drawProps} />);
  expect(screen.getByRole('cell', { name: '¥2,025.33' })).toBeTruthy();
  const page = within(screen.getByRole('row', { name: '本页汇总' }));
  expect(
    page.getByRole('rowheader', { name: '本页' }).getAttribute('data-pinned'),
  ).toBe('start');
  expect(screen.getAllByText('本页')).toHaveLength(1);
  expect(screen.getAllByText('所有')).toHaveLength(1);
  expect(
    page.getAllByRole('group').map(node => node.getAttribute('aria-label')),
  ).toEqual(['金额合计', '金额平均值', '金额最大值']);
  expect(page.getByText('¥2,025.33')).toBeTruthy();
  expect(page.queryByText(/本页 ·/)).toBeNull();
  view.rerender(<RecordTable {...drawProps} selectable={false} />);
  const singleColumn = within(screen.getByRole('row', { name: '本页汇总' }));
  expect(singleColumn.getByRole('rowheader', { name: '本页' })).toBeTruthy();
  expect(singleColumn.getByText('¥2,025.33')).toBeTruthy();
});

it('keeps summary failures in their scope and retries from its error details', async () => {
  const configured: ViewInstance = {
    ...instance,
    config: {
      ...instance.config,
      presentation: {
        layout: 'table',
        table: {
          columns: [
            { id: 'name', kind: 'field', field: 'name' },
            {
              id: 'amount',
              kind: 'field',
              field: 'amount',
              summary: ['SUM', 'AVG'],
            },
          ],
        },
      },
    },
  };
  const retry = vi.fn();
  const pageSummary = {
    status: 'success' as const,
    values: { amount: { SUM: 0, AVG: 0 } },
    error: null,
  };
  const view = render(
    <RecordTable
      {...props({
        instance: configured,
        pageSummary,
        allSummary: {
          status: 'success',
          values: { amount: { SUM: null, AVG: null } },
          error: null,
        },
        onSummaryRetry: retry,
      })}
    />,
  );
  const footer = screen.getByRole('row', { name: '所有汇总' });
  expect(screen.getByRole('row', { name: '本页汇总' }).textContent).toContain(
    '合计0',
  );
  expect(footer.textContent).toContain('合计—');
  expect(footer.textContent).toContain('平均值—');
  expect(screen.getByRole('row', { name: '本页汇总' }).textContent).toContain(
    '平均值0',
  );
  expect(screen.queryByRole('combobox', { name: '汇总范围' })).toBeNull();
  expect(screen.queryByText('记录数')).toBeNull();
  expect(screen.getByRole('cell', { name: 'Zulu' })).toBeTruthy();
  view.rerender(
    <RecordTable
      {...props({
        instance: configured,
        pageSummary,
        allSummary: { status: 'error', values: {}, error: '统计失败' },
        onSummaryRetry: retry,
      })}
    />,
  );
  const scope = within(screen.getByRole('row', { name: '所有汇总' }));
  expect(scope.getByRole('alert').textContent).toContain('所有汇总失败');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  expect(screen.queryByText('统计失败')).toBeNull();
  const error = scope.getByRole('button', { name: '所有汇总失败，查看详情' });
  expect(screen.getByRole('row', { name: '本页汇总' }).textContent).toContain(
    '合计0',
  );
  expect(screen.getByRole('cell', { name: 'Zulu' })).toBeTruthy();
  fireEvent.click(error);
  const details = within(
    await screen.findByRole('dialog', { name: '所有汇总失败' }),
  );
  expect(details.getByText('统计失败')).toBeTruthy();
  fireEvent.click(details.getByRole('button', { name: '重试汇总' }));
  expect(retry).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(error));
});

it.each([true, false])(
  'shows one error per scope with selection %s and keeps page errors separate',
  async selectable => {
    const configured: ViewInstance = {
      ...instance,
      config: {
        ...instance.config,
        presentation: {
          layout: 'table',
          table: {
            columns: [
              {
                id: 'amount',
                kind: 'field',
                field: 'amount',
                summary: ['SUM', 'AVG', 'MIN'],
              },
            ],
          },
        },
      },
    };
    render(
      <RecordTable
        {...props({
          instance: configured,
          selectable,
          pageSummary: {
            status: 'error',
            values: {},
            error: '本页有非数值内容',
          },
          allSummary: { status: 'error', values: {}, error: '聚合服务不可用' },
          onSummaryRetry: vi.fn(),
        })}
      />,
    );
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    for (const label of ['本页', '所有']) {
      const scope = within(screen.getByRole('row', { name: `${label}汇总` }));
      expect(
        scope.getAllByRole('button', { name: /汇总失败，查看详情/ }),
      ).toHaveLength(1);
      expect(scope.getAllByText('—')).toHaveLength(3);
    }
    fireEvent.click(
      screen.getByRole('button', { name: '本页汇总失败，查看详情' }),
    );
    const details = within(
      await screen.findByRole('dialog', { name: '本页汇总失败' }),
    );
    expect(details.getByText('本页有非数值内容')).toBeTruthy();
    expect(details.queryByRole('button', { name: '重试汇总' })).toBeNull();
  },
);
