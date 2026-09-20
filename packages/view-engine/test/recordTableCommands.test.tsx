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

/**
 * The commands the column settings and the sort control write through:
 * order, pinning, summaries and the whole sort. Each is an `edit` followed
 * by an `apply`, like the column and sort commands that were here before —
 * the table renders the result the kernel projected, so a change that is not
 * applied is a change nobody can see.
 */

import { MAX_CURSOR_SORT_FIELDS } from '@ahoo-wang/fetcher-wow';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MemoryViewStore,
  ViewEngine,
  type DataViewDefinition,
  type RecordViewConfig,
  type RecordViewRuntime,
  type ViewInstance,
} from '../src/index.js';
import { useOpenView, useRecordTable } from '../src/react/index.js';
import { ordersDefinition, recordConfig, testSource } from './fixtures.js';

afterEach(cleanup);

/**
 * Orders with two summarisable fields and two sortable ones, so a command
 * that replaces one of several has something to leave alone. Everything the
 * commands write is admitted, so `apply` runs and the assertions are about
 * the command rather than about a validation error.
 */
function definition(): DataViewDefinition {
  return ordersDefinition({
    fields: ordersDefinition().fields.map(field => {
      if (field.name === 'amount')
        return { ...field, summary: ['SUM', 'AVG', 'MAX'] as const };
      if (field.name === 'warehouse')
        return { ...field, summary: ['COUNT'] as const };
      if (field.name === 'id') return { ...field, sortable: true };
      return field;
    }),
  });
}

const mine: ViewInstance = {
  id: 'orders-1',
  definitionId: 'orders',
  title: 'Mine',
  scope: 'personal',
  revision: '1',
  config: recordConfig(),
};

async function openTable(
  config?: Partial<RecordViewConfig>,
  overrides: Partial<DataViewDefinition> = {},
) {
  const engine = new ViewEngine({
    definitions: [{ ...definition(), ...overrides }],
    store: new MemoryViewStore({
      instances: [config ? { ...mine, config: recordConfig(config) } : mine],
    }),
    resolveSource: () => testSource(),
  });
  const { result } = renderHook(() => {
    const opened = useOpenView(engine, 'orders-1');
    return {
      runtime: opened.runtime as RecordViewRuntime | null,
      table: useRecordTable(opened.runtime as RecordViewRuntime | null),
    };
  });
  await waitFor(() => expect(result.current.table.status).toBe('success'));
  return result;
}

/** The draft as the runtime holds it, which is what a save would write. */
function draft(result: {
  current: { runtime: RecordViewRuntime | null };
}): RecordViewConfig {
  return result.current.runtime!.getSnapshot().draft;
}

describe('setColumnOrder', () => {
  it('puts the columns in the order it is given, and applies at once', async () => {
    const result = await openTable();

    act(() => result.current.table.setColumnOrder(['amount', 'id']));

    await waitFor(() =>
      expect(result.current.table.columnFields).toEqual(['amount', 'id']),
    );
    // The result on screen answers the new order rather than the old one:
    // the kernel projects columns from the config that ran.
    expect(result.current.table.columns.map(column => column.field)).toEqual([
      'amount',
      'id',
    ]);
  });

  /**
   * Each column is reused rather than rebuilt from its name, so a width or a
   * pinning set earlier survives a reorder instead of being dropped on the
   * next save.
   */
  it('carries each column’s own settings through the move', async () => {
    const result = await openTable({
      table: {
        columns: [
          { field: 'id', pinned: 'left' },
          { field: 'amount', width: 120 },
        ],
      },
    });

    act(() => result.current.table.setColumnOrder(['amount', 'id']));

    await waitFor(() =>
      expect(draft(result).table.columns).toEqual([
        { field: 'amount', width: 120 },
        { field: 'id', pinned: 'left' },
      ]),
    );
  });

  /**
   * A control that knows about one area of the table names only that area.
   * Dropping everything it did not mention would empty the table from a
   * control that was asked to reorder two of its columns.
   */
  it('keeps a column it was not told about, at the end', async () => {
    const result = await openTable({
      table: {
        columns: [{ field: 'id' }, { field: 'warehouse' }, { field: 'amount' }],
      },
    });

    act(() => result.current.table.setColumnOrder(['amount', 'id']));

    await waitFor(() =>
      expect(result.current.table.columnFields).toEqual([
        'amount',
        'id',
        'warehouse',
      ]),
    );
  });

  it('ignores an unknown name and a name said twice', async () => {
    const result = await openTable();

    act(() =>
      result.current.table.setColumnOrder(['amount', 'amount', 'gone', 'id']),
    );

    await waitFor(() =>
      expect(result.current.table.columnFields).toEqual(['amount', 'id']),
    );
  });
});

describe('setPinned', () => {
  it('holds a column on a side and lets it go again', async () => {
    const result = await openTable();

    act(() => result.current.table.setPinned('amount', 'right'));
    await waitFor(() =>
      expect(result.current.table.pinnedOf('amount')).toBe('right'),
    );
    expect(result.current.table.pinnedOf('id')).toBeNull();

    act(() => result.current.table.setPinned('amount', null));
    await waitFor(() =>
      expect(result.current.table.pinnedOf('amount')).toBeNull(),
    );
  });

  /**
   * A config is JSON, and `{ pinned: undefined }` is not the same object as
   * one without the key: it reads as a difference against the saved baseline
   * for the rest of the session, so a column pinned and unpinned again is
   * the config it started as.
   */
  it('leaves no trace of a pinning that was taken back', async () => {
    const result = await openTable();
    const before = draft(result).table.columns;

    act(() => result.current.table.setPinned('amount', 'left'));
    await waitFor(() =>
      expect(result.current.table.pinnedOf('amount')).toBe('left'),
    );
    act(() => result.current.table.setPinned('amount', null));

    await waitFor(() => expect(draft(result).table.columns).toEqual(before));
    expect(Object.keys(draft(result).table.columns[1]).includes('pinned')).toBe(
      false,
    );
  });

  it('does nothing to a column the draft does not hold', async () => {
    const result = await openTable();

    act(() => result.current.table.setPinned('gone', 'left'));

    await waitFor(() =>
      expect(result.current.table.columnFields).toEqual(['id', 'amount']),
    );
    expect(result.current.table.pinnedOf('gone')).toBeNull();
  });
});

describe('setSummary', () => {
  it('summarises a column, and stops', async () => {
    const result = await openTable();

    act(() => result.current.table.setSummary('amount', 'SUM'));
    await waitFor(() =>
      expect(result.current.table.summaryOf('amount')).toBe('SUM'),
    );
    expect(draft(result).summaries).toEqual([{ field: 'amount', fn: 'SUM' }]);

    act(() => result.current.table.setSummary('amount', null));
    await waitFor(() =>
      expect(result.current.table.summaryOf('amount')).toBeNull(),
    );
    expect(draft(result).summaries).toEqual([]);
  });

  /**
   * The settings offer a column one summary, so setting one replaces
   * whatever that column had — and leaves every other column alone.
   */
  it('replaces a column’s own summary and no other', async () => {
    const result = await openTable({
      summaries: [
        { field: 'amount', fn: 'SUM' },
        { field: 'warehouse', fn: 'COUNT' },
      ],
    });

    act(() => result.current.table.setSummary('amount', 'MAX'));

    await waitFor(() =>
      expect(draft(result).summaries).toEqual([
        { field: 'warehouse', fn: 'COUNT' },
        { field: 'amount', fn: 'MAX' },
      ]),
    );
  });
});

describe('maxSortFields', () => {
  /**
   * A control that offers a sort field has to stop where the kernel starts
   * refusing, so the ceiling comes from the kernel rather than being spelled
   * a second time in the UI.
   */
  it('answers the cursor ceiling for a cursor source', async () => {
    const result = await openTable(undefined, {
      record: { rowKey: 'id', paging: 'cursor', layouts: ['table'] },
    });

    expect(result.current.table.maxSortFields).toBe(MAX_CURSOR_SORT_FIELDS);
  });

  it('is bounded only by the fields there are on a paged source', async () => {
    const result = await openTable();

    expect(result.current.table.maxSortFields).toBe(definition().fields.length);
  });
});

describe('setSort', () => {
  it('replaces the whole sort in priority order', async () => {
    const result = await openTable();

    act(() =>
      result.current.table.setSort([
        { field: 'amount', direction: 'DESC' },
        { field: 'id', direction: 'ASC' },
      ]),
    );

    await waitFor(() =>
      expect(result.current.table.sort).toEqual([
        { field: 'amount', direction: 'DESC' },
        { field: 'id', direction: 'ASC' },
      ]),
    );
    expect(result.current.table.sortOf('amount')).toBe('DESC');
  });

  it('clears the sort, which is a sort of none', async () => {
    const result = await openTable({
      sort: [{ field: 'amount', direction: 'ASC' }],
    });

    act(() => result.current.table.setSort([]));

    await waitFor(() => expect(result.current.table.sort).toEqual([]));
  });
});
