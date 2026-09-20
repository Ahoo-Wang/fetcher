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
  isFieldlessKind,
  type FieldDefinition,
  type SummaryFunction,
} from '../../model/index.js';

/**
 * The row-key column is pinned left, the host's action column is pinned
 * right, and everything else orders freely between them. A column never
 * leaves the area it is in, which is what makes "drag to reorder" a promise
 * the settings can keep: an order that put the key in the middle would be
 * written to the config and then ignored by the table.
 */
export type ColumnRegion = 'left' | 'middle' | 'right';

/**
 * The action column's stand-in.
 *
 * It is not a field and it is not in the config — the host hands over a
 * render function — but it is a column on screen, so the settings show where
 * it sits rather than pretending the table ends at the last field. `\0`
 * cannot occur in a field name (`FIELD_NAME_PATTERN`), so the sentinel can
 * never collide with one.
 */
export const ACTIONS_COLUMN = '\u0000actions';

/** One line of the column settings, with everything its controls need. */
export interface ColumnSettingRow {
  /** The field's name, or {@link ACTIONS_COLUMN} for the action column. */
  field: string;
  label: string;
  region: ColumnRegion;
  /** Whether the table shows this column. */
  visible: boolean;
  pinned: ColumnPin | null;
  /**
   * True for the two columns whose place is decided by the definition rather
   * than by the user: the row key and the action column. Their controls are
   * shown in the state they are in and disabled, because a control that
   * silently does nothing is worse than one that says it cannot.
   */
  fixed: boolean;
  /** Summary functions the field declares; empty when it offers none. */
  functions: readonly SummaryFunction[];
  /** The function the config summarises this column with, if any. */
  summary: SummaryFunction | null;
  /** Whether this row may be dragged or moved with the arrow keys. */
  movable: boolean;
  /**
   * True for a column the definition no longer offers — a field it dropped,
   * or one whose kind is a handle rather than something a row holds.
   *
   * It is listed precisely because it is broken: `validateRecord` refuses
   * the config over it, which blocks the query and the save, and a row that
   * is not in the list is a column nobody can take out. It carries no
   * controls but its checkbox, which is the repair.
   */
  broken: boolean;
}

export type ColumnPin = 'left' | 'right';

export interface ColumnSettingInput {
  /** The definition's fields, in its order. */
  fields: readonly FieldDefinition[];
  /** The draft's columns, in the order the table shows them. */
  columns: readonly string[];
  /** The field holding each row's identity, when the definition declares one. */
  rowKey?: string;
  /** Whether the table carries the host's action column. */
  actions: boolean;
  pinnedOf(field: string): ColumnPin | null;
  summaryOf(field: string): SummaryFunction | null;
}

/**
 * Every column the settings can offer, in the order they are listed.
 *
 * Shown columns come first in the order the table shows them, then the
 * fields that could be columns and are not — a hidden field has no place in
 * `table.columns`, so it has no order to drag either, and it joins the end
 * when it is switched on. Field-less kinds (a search box, a tenant handle)
 * are left out entirely: their name addresses an editor, not something a row
 * holds, so a column on one would be empty for every record ever shown.
 */
export function columnSettingRows(
  input: ColumnSettingInput,
): ColumnSettingRow[] {
  const candidates = input.fields.filter(field => !isFieldlessKind(field.kind));
  const byName = new Map(candidates.map(field => [field.name, field]));
  const seen = new Set<string>();
  // In the order the table shows them, and one row per column: a config
  // that lists a field twice is two columns claiming one identity, and one
  // checkbox takes both of them out.
  const shown = input.columns.flatMap(name => {
    if (seen.has(name)) return [];
    seen.add(name);
    const field = byName.get(name);
    return [field ? row(field, true, input) : broken(name, input)];
  });
  const hidden = candidates
    .filter(field => !seen.has(field.name))
    .map(field => row(field, false, input));

  const rows = [...shown, ...hidden];
  if (!input.actions) return rows;
  return [
    ...rows,
    {
      field: ACTIONS_COLUMN,
      label: '',
      region: 'right',
      visible: true,
      pinned: 'right',
      fixed: true,
      functions: [],
      summary: null,
      movable: false,
      broken: false,
    },
  ];
}

/**
 * A column the definition no longer offers, listed so it can be taken out.
 *
 * There is no label to show — the field is gone — so it wears its own name,
 * and it carries no control but its checkbox: ordering, pinning and
 * summarising a column that cannot render are all answers to a question
 * nobody asked. Hiding it is the repair, and `setColumns` takes its summary
 * with it.
 */
function broken(field: string, input: ColumnSettingInput): ColumnSettingRow {
  return {
    field,
    label: field,
    region: 'middle',
    visible: true,
    pinned: null,
    fixed: false,
    functions: [],
    summary: input.summaryOf(field),
    movable: false,
    broken: true,
  };
}

function row(
  field: FieldDefinition,
  visible: boolean,
  input: ColumnSettingInput,
): ColumnSettingRow {
  const fixed = field.name === input.rowKey;
  return {
    field: field.name,
    label: field.label,
    region: fixed ? 'left' : 'middle',
    visible,
    // A fixed column shows the side it is held on rather than what the
    // config happens to say, so the two never disagree on screen.
    pinned: fixed ? 'left' : input.pinnedOf(field.name),
    fixed,
    functions: field.summary ?? [],
    summary: input.summaryOf(field.name),
    movable: visible && !fixed,
    broken: false,
  };
}

/** The rows of one area, in the order they are shown. */
export function regionRows(
  rows: readonly ColumnSettingRow[],
  region: ColumnRegion,
): ColumnSettingRow[] {
  return rows.filter(entry => entry.region === region);
}

/** The fields that may be dragged, in their current order. */
export function movableFields(rows: readonly ColumnSettingRow[]): string[] {
  return rows.filter(entry => entry.movable).map(entry => entry.field);
}

/**
 * The whole table's column order after one move, or `null` when the move
 * changes nothing — the top row pushed up, an unknown field, a drop on the
 * row it started from.
 *
 * Only the movable area is reordered, and the order it produces covers every
 * shown column: the pinned key leads, the rest follow. That is what makes a
 * region a region rather than a hint — an order that put the key second
 * would be saved, reopened and silently contradicted by the table.
 */
export function reorderColumns(
  rows: readonly ColumnSettingRow[],
  field: string,
  toIndex: number,
): string[] | null {
  const movable = movableFields(rows);
  const from = movable.indexOf(field);
  if (from < 0 || toIndex < 0 || toIndex >= movable.length || toIndex === from)
    return null;
  const rest = movable.filter((_name, index) => index !== from);
  const moved = [...rest.slice(0, toIndex), field, ...rest.slice(toIndex)];
  return [
    ...rows
      .filter(entry => entry.region === 'left' && entry.visible)
      .map(entry => entry.field),
    ...moved,
  ];
}

/** Where a field sits among the movable rows, or -1 when it is not one. */
export function movableIndex(
  rows: readonly ColumnSettingRow[],
  field: string,
): number {
  return movableFields(rows).indexOf(field);
}

/**
 * How many columns the table is showing that can actually render; the last
 * one of those may not be hidden.
 *
 * A broken column does not count. The rule exists so a table is never left
 * with nothing in it, and a column the definition dropped puts nothing in
 * it either — counting it would guard the one row whose whole purpose is to
 * be switched off.
 */
export function visibleCount(rows: readonly ColumnSettingRow[]): number {
  return rows.filter(
    entry => entry.visible && !entry.broken && entry.field !== ACTIONS_COLUMN,
  ).length;
}

/** The pin state after one press: unpinned, then left, then right again. */
export function nextPin(pinned: ColumnPin | null): ColumnPin | null {
  if (pinned === null) return 'left';
  return pinned === 'left' ? 'right' : null;
}
