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
 * The column settings popover and the pure model under it. The controller is
 * a stub here: what is being tested is which controls a column gets, which
 * of them are refused and what each one writes — not what the runtime does
 * with the write, which `recordTableCommands.test.tsx` covers.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { FieldDefinition } from '../src/model/index.js';
import type { RecordTableController } from '../src/react/index.js';
import { ColumnSettings } from '../src/ui/ColumnSettings.js';
import {
  ACTIONS_COLUMN,
  columnSettingRows,
  movableFields,
  nextPin,
  reorderColumns,
  visibleCount,
} from '../src/ui/columns/rows.js';
import { columnDragAccessibility } from '../src/ui/columns/announce.js';
import { defaultMessages } from '../src/ui/messages.js';
import { formattersFor, tableController } from './fixtures/columns.js';

afterEach(cleanup);

const FIELDS: FieldDefinition[] = [
  { name: 'id', label: 'Order', kind: 'string' },
  { name: 'warehouse', label: 'Warehouse', kind: 'string' },
  { name: 'amount', label: 'Amount', kind: 'number', summary: ['SUM', 'AVG'] },
  // A field-less kind addresses an editor rather than something a row
  // holds, so it can never be a column and is never offered as one.
  { name: 'q', label: 'Search', kind: 'search' },
];

function open(overrides: Partial<RecordTableController> = {}, props = {}) {
  const table = tableController({
    columnFields: ['id', 'amount'],
    ...overrides,
  });
  render(
    <ColumnSettings table={table} fields={FIELDS} rowKey="id" {...props} />,
  );
  return table;
}

/**
 * What the settings' own live region says. The library puts a second one on
 * `document.body` for its pick-up and cancel, so this addresses ours.
 */
function announced(): string {
  return (
    document.querySelector('[data-slot="column-announcement"]')?.textContent ??
    ''
  );
}

/** The rows of the popover, top to bottom, by the field each one is for. */
function listed(): string[] {
  return [...document.querySelectorAll('[data-slot="column-setting"]')].map(
    row => row.getAttribute('data-field')!,
  );
}

describe('the column settings model', () => {
  const input = {
    fields: FIELDS,
    columns: ['amount', 'id'],
    rowKey: 'id',
    actions: false,
    pinnedOf: () => null,
    summaryOf: () => null,
  };

  it('lists shown columns first, then the fields that could be ones', () => {
    const rows = columnSettingRows(input);

    expect(rows.map(row => row.field)).toEqual(['amount', 'id', 'warehouse']);
    expect(rows.map(row => row.visible)).toEqual([true, true, false]);
    // A hidden column has no place in the config, so it has no order to drag.
    expect(movableFields(rows)).toEqual(['amount']);
    expect(visibleCount(rows)).toBe(2);
  });

  it('holds the row key on the left and the actions on the right', () => {
    const rows = columnSettingRows({ ...input, actions: true });

    expect(rows.map(row => row.region)).toEqual([
      'middle',
      'left',
      'middle',
      'right',
    ]);
    expect(rows[1]).toMatchObject({ fixed: true, pinned: 'left' });
    expect(rows[3]).toMatchObject({
      field: ACTIONS_COLUMN,
      fixed: true,
      pinned: 'right',
      movable: false,
    });
  });

  /**
   * The order it produces covers every shown column with the pinned key in
   * front, because that is where the table draws it: an order that put the
   * key second would be saved and then quietly contradicted.
   */
  it('reorders the movable area and leads with the pinned key', () => {
    const rows = columnSettingRows({
      ...input,
      columns: ['amount', 'id', 'warehouse'],
    });

    expect(reorderColumns(rows, 'warehouse', 0)).toEqual([
      'id',
      'warehouse',
      'amount',
    ]);
    expect(reorderColumns(rows, 'amount', 1)).toEqual([
      'id',
      'warehouse',
      'amount',
    ]);
  });

  it('refuses a move that would change nothing', () => {
    const rows = columnSettingRows({
      ...input,
      columns: ['amount', 'id', 'warehouse'],
    });

    expect(reorderColumns(rows, 'amount', 0)).toBeNull();
    expect(reorderColumns(rows, 'amount', -1)).toBeNull();
    expect(reorderColumns(rows, 'amount', 2)).toBeNull();
    // The key is not in the movable area at all.
    expect(reorderColumns(rows, 'id', 1)).toBeNull();
    expect(reorderColumns(rows, 'gone', 0)).toBeNull();
  });

  it('cycles a pin through both sides and off again', () => {
    expect(nextPin(null)).toBe('left');
    expect(nextPin('left')).toBe('right');
    expect(nextPin('right')).toBeNull();
  });
});

describe('the column settings popover', () => {
  it('lists every column that can be one, in their areas', async () => {
    const user = userEvent.setup();
    open({}, { actions: true });

    await user.click(screen.getByRole('button', { name: /Columns/ }));

    expect(listed()).toEqual(['id', 'amount', 'warehouse', ACTIONS_COLUMN]);
    expect(
      [...document.querySelectorAll('[data-slot="column-region"]')].map(
        region => region.getAttribute('aria-label'),
      ),
    ).toEqual(['Pinned left', 'Column settings', 'Pinned right']);
    // The search handle is not something a row holds, so it is not offered.
    expect(screen.queryByRole('checkbox', { name: 'Show Search' })).toBeNull();
  });

  it('leaves the action column out when the host offers no row actions', async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole('button', { name: /Columns/ }));

    expect(listed()).toEqual(['id', 'amount', 'warehouse']);
    expect(
      document.querySelector(
        '[data-slot="column-region"][data-region="right"]',
      ),
    ).toBeNull();
  });

  it('shows and hides a column from its checkbox', async () => {
    const user = userEvent.setup();
    const table = open();

    await user.click(screen.getByRole('button', { name: /Columns/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Show Warehouse' }));
    expect(table.setColumns).toHaveBeenCalledWith([
      'id',
      'amount',
      'warehouse',
    ]);

    await user.click(screen.getByRole('checkbox', { name: 'Show Amount' }));
    expect(table.setColumns).toHaveBeenLastCalledWith(['id']);
  });

  /**
   * Hiding the last column leaves a result with nothing in it and no way
   * back except the control that emptied it, so the checkbox is refused and
   * the popover says why rather than leaving a control that does nothing.
   */
  it('refuses to hide the last column, and says why', async () => {
    const user = userEvent.setup();
    const table = open({ columnFields: ['id'] });

    await user.click(screen.getByRole('button', { name: /Columns/ }));
    const only = screen.getByRole('checkbox', { name: 'Show Order' });

    // Base UI's checkbox is a span in the accessibility tree, so "refused"
    // is `aria-disabled` rather than the attribute a native input carries.
    expect(only.getAttribute('aria-disabled')).toBe('true');
    expect(
      document.getElementById(only.getAttribute('aria-describedby')!)!
        .textContent,
    ).toContain(defaultMessages['label.columns.last-visible']);
    expect(table.setColumns).not.toHaveBeenCalled();
  });

  /**
   * `setPinned` maps the columns the draft holds and `config.summaries` is
   * only shown under a column that is there, so both controls on a hidden
   * field would write nothing a reader could see — repeatedly, and
   * silently. They say they cannot instead, and the popover says why.
   */
  it('refuses to pin or summarise a column that is switched off', async () => {
    const user = userEvent.setup();
    const table = open({ columnFields: ['id'] });

    await user.click(screen.getByRole('button', { name: /Columns/ }));
    const pin = screen.getByRole('button', {
      name: 'Pinning of Amount: Not pinned',
    });
    const summary = screen.getByRole('combobox', {
      name: 'Summary under Amount',
    });

    expect(pin.hasAttribute('disabled')).toBe(true);
    expect(summary.hasAttribute('disabled')).toBe(true);
    expect(
      document.getElementById(pin.getAttribute('aria-describedby')!)!
        .textContent,
    ).toContain(defaultMessages['label.columns.hidden']);

    await user.click(pin);
    expect(table.setPinned).not.toHaveBeenCalled();
  });

  it('offers a summary only where the field declares one', async () => {
    const user = userEvent.setup();
    const table = open();

    await user.click(screen.getByRole('button', { name: /Columns/ }));
    expect(
      screen.queryByRole('combobox', { name: 'Summary under Order' }),
    ).toBeNull();

    await user.click(
      screen.getByRole('combobox', { name: 'Summary under Amount' }),
    );
    await user.click(await screen.findByRole('option', { name: 'Average' }));
    expect(table.setSummary).toHaveBeenCalledWith('amount', 'AVG');
  });

  it('takes a summary off again', async () => {
    const user = userEvent.setup();
    const table = open({
      summaryOf: (field: string) => (field === 'amount' ? 'SUM' : null),
    });

    await user.click(screen.getByRole('button', { name: /Columns/ }));
    await user.click(
      screen.getByRole('combobox', { name: 'Summary under Amount' }),
    );
    await user.click(await screen.findByRole('option', { name: 'No summary' }));

    expect(table.setSummary).toHaveBeenCalledWith('amount', null);
  });

  it('cycles the pin of a column that may move', async () => {
    const user = userEvent.setup();
    const table = open();

    await user.click(screen.getByRole('button', { name: /Columns/ }));
    await user.click(
      screen.getByRole('button', { name: 'Pinning of Amount: Not pinned' }),
    );

    expect(table.setPinned).toHaveBeenCalledWith('amount', 'left');
  });

  /**
   * The two columns the definition places show the state they are in and
   * refuse to change it: a pin toggle that silently does nothing is worse
   * than one that says it cannot.
   */
  it('shows the fixed columns’ pinning and refuses to change it', async () => {
    const user = userEvent.setup();
    open({}, { actions: true });

    await user.click(screen.getByRole('button', { name: /Columns/ }));

    for (const name of [
      'Pinning of Order: Pinned left',
      'Pinning of Actions: Pinned right',
      'Reorder Order',
      'Reorder Actions',
    ])
      expect(
        screen.getByRole('button', { name }).hasAttribute('disabled'),
      ).toBe(true);
    expect(
      screen
        .getByRole('checkbox', { name: 'Show Actions' })
        .getAttribute('aria-disabled'),
    ).toBe('true');
  });
});

describe('moving a column with the keyboard', () => {
  async function twoMovable() {
    const user = userEvent.setup();
    const table = open({ columnFields: ['id', 'amount', 'warehouse'] });
    await user.click(screen.getByRole('button', { name: /Columns/ }));
    return { user, table };
  }

  it('moves the row down and says where it landed', async () => {
    const { user, table } = await twoMovable();

    const handle = screen.getByRole('button', { name: 'Reorder Amount' });
    handle.focus();
    expect(document.activeElement).toBe(handle);
    await user.keyboard('{ArrowDown}');

    expect(table.setColumnOrder).toHaveBeenCalledWith([
      'id',
      'warehouse',
      'amount',
    ]);
    expect(announced()).toBe('Amount moved to position 3 of 3');
  });

  /**
   * Counted over what the reader is looking at. The action column is on
   * screen and is not in the config, so counting configured columns alone
   * said "of 3" to someone looking at four.
   */
  it('counts the action column in the position it announces', async () => {
    const user = userEvent.setup();
    open({ columnFields: ['id', 'amount', 'warehouse'] }, { actions: true });
    await user.click(screen.getByRole('button', { name: /Columns/ }));

    screen.getByRole('button', { name: 'Reorder Amount' }).focus();
    await user.keyboard('{ArrowDown}');

    expect(announced()).toBe('Amount moved to position 3 of 4');
  });

  it('moves the row up', async () => {
    const { user, table } = await twoMovable();

    screen.getByRole('button', { name: 'Reorder Warehouse' }).focus();
    await user.keyboard('{ArrowUp}');

    expect(table.setColumnOrder).toHaveBeenCalledWith([
      'id',
      'warehouse',
      'amount',
    ]);
  });

  /** The top row has nowhere up to go, and neither does a stray key. */
  it('does nothing at the end of the area, or on another key', async () => {
    const { user, table } = await twoMovable();

    screen.getByRole('button', { name: 'Reorder Amount' }).focus();
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowLeft}');

    expect(table.setColumnOrder).not.toHaveBeenCalled();
    expect(announced()).toBe('');
  });

  /**
   * A popover that closed onto nothing leaves the keyboard at the top of the
   * page, which is the other end of the toolbar from where the user was.
   */
  it('gives the focus back to the trigger when it closes', async () => {
    const user = userEvent.setup();
    open();
    const trigger = screen.getByRole('button', { name: /Columns/ });

    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Reorder Amount' })).toBeTruthy();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

describe('what a drag says out loud', () => {
  const accessibility = columnDragAccessibility(
    formattersFor(defaultMessages),
    field => (field === 'amount' ? 'Amount' : field),
  );

  it('names the column in the reader’s own words', () => {
    expect(
      accessibility.announcements.dragstart({
        operation: { source: { id: 'amount' } },
      }),
    ).toBe('Amount picked up');
  });

  /** A completed drop is announced by the settings, so it says nothing here. */
  it('speaks only when a drag is given up', () => {
    const dropped = { operation: { source: { id: 'amount' } } };

    expect(accessibility.announcements.dragend(dropped)).toBeUndefined();
    expect(
      accessibility.announcements.dragend({ ...dropped, canceled: true }),
    ).toBe('Move cancelled; Amount stayed where it was');
  });

  it('says nothing about a drag with no source', () => {
    const none = { operation: { source: null } };

    expect(accessibility.announcements.dragstart(none)).toBeUndefined();
    expect(
      accessibility.announcements.dragend({ ...none, canceled: true }),
    ).toBeUndefined();
  });

  it('carries the instructions a reader is given on the handle', () => {
    expect(accessibility.screenReaderInstructions.draggable).toBe(
      defaultMessages['label.columns.instructions'],
    );
  });
});
