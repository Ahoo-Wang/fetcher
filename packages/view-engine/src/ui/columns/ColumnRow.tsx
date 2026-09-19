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

import type { KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { OptimisticSortingPlugin } from '@dnd-kit/dom/sortable';
import { GripVerticalIcon, PinIcon } from 'lucide-react';
import type { SummaryFunction } from '../../model/index.js';
import { Button } from '../components/button.js';
import { Checkbox } from '../components/checkbox.js';
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select.js';
import { SelectContent } from '../popups.js';
import { useViewMessages } from '../MessagesProvider.js';
import { ACTIONS_COLUMN, type ColumnSettingRow } from './rows.js';

/** The value the summary select carries for "summarise nothing". */
const NO_SUMMARY = 'none';

/** Wording per pin state, so an unhandled one cannot go unlabelled. */
const PIN_LABEL = {
  left: 'label.columns.pin.left',
  right: 'label.columns.pin.right',
  none: 'label.columns.pin.none',
} as const;

export interface ColumnRowProps {
  row: ColumnSettingRow;
  /** How many columns the table shows; the last one may not be hidden. */
  shownCount: number;
  /** Id of the line that explains why a disabled control is disabled. */
  hintId: string;
  onToggle(): void;
  onPin(): void;
  onSummary(fn: SummaryFunction | null): void;
  /** Moves the row one place, from the arrow keys on its handle. */
  onMove(step: -1 | 1): void;
  /** True while the library is carrying this row, so the arrows are its. */
  dragging?: boolean;
  elementRef?(element: HTMLElement | null): void;
  handleRef?(element: HTMLElement | null): void;
}

/**
 * One column in the settings: drag handle, visibility, name, summary, pin.
 *
 * The two columns the definition places — the row key and the host's action
 * column — show their state and disable their controls rather than leaving
 * them out: a row that is missing its pin toggle reads as an oversight,
 * while one that shows a pin it cannot change says who decides.
 */
export function ColumnRow({
  row,
  shownCount,
  hintId,
  onToggle,
  onPin,
  onSummary,
  onMove,
  dragging,
  elementRef,
  handleRef,
}: ColumnRowProps) {
  const messages = useViewMessages();
  const actions = row.field === ACTIONS_COLUMN;
  const label = actions ? messages.label('label.toolbar.actions') : row.label;
  // The table has to keep one column: hiding the last one leaves a result
  // with nothing in it and no way back except the picker that emptied it.
  const last = row.visible && shownCount <= 1;
  const pinState = messages.label(PIN_LABEL[row.pinned ?? 'none']);

  return (
    <li
      ref={elementRef}
      data-slot="column-setting"
      data-field={row.field}
      data-region={row.region}
      data-dragging={dragging ? '' : undefined}
      className="flex items-center gap-1.5 rounded-md px-1 py-0.5 data-dragging:bg-muted"
    >
      <Button
        ref={handleRef}
        type="button"
        variant="ghost"
        size="icon-xs"
        className="cursor-grab"
        disabled={!row.movable}
        aria-label={messages.label('label.columns.drag', { field: label })}
        aria-describedby={row.movable ? undefined : hintId}
        onKeyDown={(event: KeyboardEvent) => {
          // While the library is carrying the row the arrows are its: two
          // handlers on one press would move the column twice.
          if (dragging) return;
          const step = STEP[event.key];
          if (!step) return;
          event.preventDefault();
          onMove(step);
        }}
      >
        <GripVerticalIcon />
      </Button>

      <Checkbox
        checked={row.visible}
        disabled={actions || last}
        aria-label={messages.label('label.columns.show', { field: label })}
        aria-describedby={actions || last ? hintId : undefined}
        onCheckedChange={onToggle}
      />

      <span className="flex-1 truncate">{label}</span>

      {row.functions.length > 0 && (
        <Select
          items={[
            {
              value: NO_SUMMARY,
              label: messages.label('label.summary.function.none'),
            },
            ...row.functions.map(fn => ({
              value: fn,
              label: messages.label(`label.summary.function.${fn}`),
            })),
          ]}
          value={row.summary ?? NO_SUMMARY}
          onValueChange={(value: string | null) =>
            // Matched against what the field declares rather than cast: the
            // list the control was built from is the list of legal answers.
            onSummary(row.functions.find(fn => fn === value) ?? null)
          }
        >
          <SelectTrigger
            size="sm"
            className="w-28"
            aria-label={messages.label('label.columns.summary', {
              field: label,
            })}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={NO_SUMMARY}>
                {messages.label('label.summary.function.none')}
              </SelectItem>
              {row.functions.map(fn => (
                <SelectItem key={fn} value={fn}>
                  {messages.label(`label.summary.function.${fn}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={row.fixed}
        aria-describedby={row.fixed ? hintId : undefined}
        aria-label={messages.label('label.columns.pin', {
          field: label,
          state: pinState,
        })}
        onClick={onPin}
      >
        <PinIcon
          data-pinned={row.pinned ?? undefined}
          className={
            row.pinned === null
              ? 'text-muted-foreground'
              : 'fill-current text-foreground'
          }
        />
      </Button>
    </li>
  );
}

/** Arrow keys that move a row, and how far. */
const STEP: Record<string, -1 | 1 | undefined> = {
  ArrowUp: -1,
  ArrowDown: 1,
};

/**
 * A column that can be dragged, wired to the library.
 *
 * Only movable rows become sortable items, which is how an area keeps its
 * columns: a fixed row is not a drop target at all, so nothing can be
 * carried past the key column or behind the actions.
 *
 * The optimistic plugin is left out on purpose. It reorders the DOM while
 * the pointer moves, which makes the indexes this component is rendered
 * from stale exactly when the drop is read; without it the library still
 * draws the drag preview, and the committed order is computed from the two
 * ids the drop reports.
 */
export function SortableColumnRow(
  props: ColumnRowProps & { index: number; group: string },
) {
  const { index, group, ...rest } = props;
  const { ref, handleRef, isDragging } = useSortable({
    id: rest.row.field,
    index,
    group,
    plugins: defaults =>
      defaults.filter(plugin => plugin !== OptimisticSortingPlugin),
  });

  return (
    <ColumnRow
      {...rest}
      dragging={isDragging}
      elementRef={ref}
      handleRef={handleRef}
    />
  );
}
