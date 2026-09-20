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

import { useCallback, useId, useMemo, useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { Accessibility } from '@dnd-kit/dom';
import { Columns3Icon } from 'lucide-react';
import {
  columnPin,
  type FieldDefinition,
  type SummaryFunction,
} from '../model/index.js';
import type { RecordTableController } from '../react/index.js';
import { Button } from './components/button.js';
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './components/popover.js';
import { PopoverContent } from './popups.js';
import { ColumnRow, SortableColumnRow } from './columns/ColumnRow.js';
import { columnDragAccessibility } from './columns/announce.js';
import {
  columnSettingRows,
  movableIndex,
  nextPin,
  regionRows,
  reorderColumns,
  visibleCount,
  type ColumnRegion,
  type ColumnSettingRow,
} from './columns/rows.js';
import { useViewMessages } from './MessagesProvider.js';

/** The one sortable group; a fixed row never joins it, so it cannot leave. */
const MOVABLE_GROUP = 'columns';

/** Each area's accessible name, so a list of rows says which area it is. */
const REGION_LABEL = {
  left: 'label.columns.pin.left',
  middle: 'label.columns.title',
  right: 'label.columns.pin.right',
} as const;

export interface ColumnSettingsProps {
  table: RecordTableController;
  /** The fields the definition offers, in its order. */
  fields: readonly FieldDefinition[];
  /** The field holding each row's identity, when the definition declares one. */
  rowKey?: string;
  /** Whether the table carries the host's action column. */
  actions?: boolean;
}

/**
 * Which columns the table shows, in which order, pinned where, summarised
 * how.
 *
 * All four are one question — "what does a row look like" — and they were
 * three controls in three places before this: a checklist for visibility,
 * the config for the order, and nothing at all for pinning or summaries. A
 * column keeps to its area: the row key is held on the left, the host's
 * actions on the right, and what is between them orders freely.
 */
export function ColumnSettings({
  table,
  fields,
  rowKey,
  actions = false,
}: ColumnSettingsProps) {
  const messages = useViewMessages();
  const hintId = useId();
  const [announcement, setAnnouncement] = useState('');

  const rows = useMemo(
    () =>
      columnSettingRows({
        fields,
        columns: table.columnFields,
        ...(rowKey === undefined ? {} : { rowKey }),
        actions,
        pinnedOf: table.pinnedOf,
        summaryOf: table.summaryOf,
      }),
    [
      actions,
      fields,
      rowKey,
      table.columnFields,
      table.pinnedOf,
      table.summaryOf,
    ],
  );
  const shown = visibleCount(rows);
  // What the reader is looking at, which is every column on screen — the
  // action column included. `shown` counts the configured ones, because the
  // rule it serves is "a table keeps one column of its own".
  const onScreen = rows.filter(row => row.visible).length;
  const anyHidden = rows.some(row => !row.visible);

  /** Commits one move and says where the column landed, for both inputs. */
  const moveTo = useCallback(
    (field: string, toIndex: number) => {
      const order = reorderColumns(rows, field, toIndex);
      if (!order) return;
      table.setColumnOrder(order);
      // Counted over every column the table shows rather than over the
      // movable ones alone: "second of four" is what the user is looking at,
      // and "first of three" names a place the table does not have.
      setAnnouncement(
        messages.label('label.columns.moved', {
          field: labelOf(rows, field),
          index: order.indexOf(field) + 1,
          total: onScreen,
        }),
      );
    },
    [messages, onScreen, rows, table],
  );

  return (
    <Popover>
      <PopoverTrigger
        data-control="columns"
        render={<Button variant="ghost" size="sm" />}
      >
        <Columns3Icon data-icon="inline-start" />
        {messages.label('label.toolbar.columns')}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <PopoverHeader>
          <PopoverTitle>{messages.label('label.columns.title')}</PopoverTitle>
          <PopoverDescription id={hintId}>
            {messages.label('label.columns.hint')}
            {shown <= 1 && ` ${messages.label('label.columns.last-visible')}`}
            {anyHidden && ` ${messages.label('label.columns.hidden')}`}
          </PopoverDescription>
        </PopoverHeader>

        <DragDropProvider
          plugins={defaults =>
            defaults.map(plugin =>
              plugin === Accessibility
                ? Accessibility.configure(
                    columnDragAccessibility(messages, field =>
                      labelOf(rows, field),
                    ),
                  )
                : plugin,
            )
          }
          onDragEnd={({ operation, canceled }) => {
            const { source, target } = operation;
            if (canceled || !source || !target || source.id === target.id)
              return;
            moveTo(String(source.id), movableIndex(rows, String(target.id)));
          }}
        >
          {(['left', 'middle', 'right'] as ColumnRegion[]).map(region => (
            <Region
              key={region}
              region={region}
              rows={rows}
              shown={shown}
              hintId={hintId}
              table={table}
              onMove={moveTo}
            />
          ))}
        </DragDropProvider>

        {/* One voice for a move the user asked for with the arrow keys; the
            library announces its own pick-up and cancel. */}
        <div
          data-slot="column-announcement"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {announcement}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** One area's rows, or nothing at all when the area holds none. */
function Region({
  region,
  rows,
  shown,
  hintId,
  table,
  onMove,
}: {
  region: ColumnRegion;
  rows: readonly ColumnSettingRow[];
  shown: number;
  hintId: string;
  table: RecordTableController;
  onMove(field: string, toIndex: number): void;
}) {
  const messages = useViewMessages();
  const own = regionRows(rows, region);
  if (own.length === 0) return null;

  return (
    <ul
      data-slot="column-region"
      data-region={region}
      aria-label={messages.label(REGION_LABEL[region])}
      className="flex flex-col"
    >
      {own.map(row => {
        const shared = {
          row,
          shownCount: shown,
          hintId,
          onToggle: () => table.setColumns(toggled(table.columnFields, row)),
          onPin: () =>
            table.setPinned(row.field, nextPin(columnPin(row.pinned))),
          onSummary: (fn: SummaryFunction | null) =>
            table.setSummary(row.field, fn),
          onMove: (step: -1 | 1) =>
            onMove(row.field, movableIndex(rows, row.field) + step),
        };
        return row.movable ? (
          <SortableColumnRow
            key={row.field}
            {...shared}
            index={movableIndex(rows, row.field)}
            group={MOVABLE_GROUP}
          />
        ) : (
          <ColumnRow key={row.field} {...shared} />
        );
      })}
    </ul>
  );
}

/** The shown columns after this row's checkbox is flipped. */
function toggled(columns: readonly string[], row: ColumnSettingRow): string[] {
  return row.visible
    ? columns.filter(field => field !== row.field)
    : [...columns, row.field];
}

function labelOf(rows: readonly ColumnSettingRow[], field: string): string {
  return rows.find(row => row.field === field)?.label ?? field;
}
