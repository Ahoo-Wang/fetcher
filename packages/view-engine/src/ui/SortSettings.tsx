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
  ArrowDownIcon,
  ArrowDownUpIcon,
  ArrowUpIcon,
  XIcon,
} from 'lucide-react';
import type {
  FieldDefinition,
  FieldGroupDefinition,
  RecordSort,
  SortDirection,
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
import { FieldPicker } from './FieldMenu.js';
import { useViewMessages, type MessageFormatters } from './MessagesProvider.js';

/** Wording per direction, so an unhandled one cannot go unlabelled. */
const DIRECTION_LABEL = {
  ASC: 'label.sort.asc',
  DESC: 'label.sort.desc',
} as const;

export interface SortSettingsProps {
  table: RecordTableController;
  /** The fields the definition offers; only sortable ones are listed. */
  fields: readonly FieldDefinition[];
  /** The picker groups of the definition the fields come from. */
  fieldGroups?: readonly FieldGroupDefinition[];
}

/**
 * What the rows are ordered by, said on the button and edited behind it.
 *
 * The header's own toggle orders by one column at a time and cannot say
 * which of several comes first. This does both: the button reads the sort
 * back in words, and the editor behind it shows each field with its
 * direction and its place in the priority.
 */
export function SortSettings({
  table,
  fields,
  fieldGroups,
}: SortSettingsProps) {
  const messages = useViewMessages();
  const sortable = fields.filter(field => field.sortable === true);
  // A definition that declares nothing sortable offers no sort at all: a
  // button that opens an empty editor is a button that leads nowhere.
  if (sortable.length === 0) return null;

  const used = new Set(table.sort.map(entry => entry.field));
  const labels = new Map(fields.map(field => [field.name, field.label]));
  const labelOf = (field: string) => labels.get(field) ?? field;

  return (
    <Popover>
      <PopoverTrigger
        data-control="sort"
        render={<Button variant="ghost" size="sm" />}
      >
        <ArrowDownUpIcon data-icon="inline-start" />
        <SortSummary sort={table.sort} labelOf={labelOf} messages={messages} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{messages.label('label.sort.title')}</PopoverTitle>
          <PopoverDescription>
            {messages.label('label.sort.hint')}
          </PopoverDescription>
        </PopoverHeader>

        {table.sort.length === 0 ? (
          <p className="text-muted-foreground">
            {messages.label('label.sort.none')}
          </p>
        ) : (
          <ul
            data-slot="sort-entries"
            aria-label={messages.label('label.sort.title')}
            className="flex flex-col gap-1"
          >
            {table.sort.map((entry, index) => (
              <SortEntry
                key={entry.field}
                entry={entry}
                index={index}
                label={labelOf(entry.field)}
                onFlip={() =>
                  table.setSort(
                    table.sort.map((other, at) =>
                      at === index ? flip(other) : other,
                    ),
                  )
                }
                onRemove={() =>
                  table.setSort(table.sort.filter((_other, at) => at !== index))
                }
              />
            ))}
          </ul>
        )}

        <FieldPicker
          items={sortable.filter(field => !used.has(field.name))}
          groups={fieldGroups ?? []}
          label={messages.label('label.sort.add')}
          disabled={used.size === sortable.length}
          itemKey={field => field.name}
          itemLabel={field => field.label}
          onPick={field =>
            table.setSort([
              ...table.sort,
              { field: field.name, direction: 'ASC' },
            ])
          }
        />
      </PopoverContent>
    </Popover>
  );
}

/** One sort entry: its place, its field, its direction and its way out. */
function SortEntry({
  entry,
  index,
  label,
  onFlip,
  onRemove,
}: {
  entry: RecordSort;
  index: number;
  label: string;
  onFlip(): void;
  onRemove(): void;
}) {
  const messages = useViewMessages();
  return (
    <li
      data-slot="sort-entry"
      data-field={entry.field}
      className="flex items-center gap-1.5"
    >
      <span className="text-muted-foreground w-4 text-center text-xs">
        {index + 1}
      </span>
      <span className="flex-1 truncate">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={messages.label('label.sort.direction', { field: label })}
        onClick={onFlip}
      >
        <DirectionMark direction={entry.direction} />
        {messages.label(DIRECTION_LABEL[entry.direction])}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={messages.label('label.sort.remove', { field: label })}
        onClick={onRemove}
      >
        <XIcon />
      </Button>
    </li>
  );
}

/**
 * The sort on the button: the first field and its direction, plus how many
 * more there are. The whole list would not fit, and the first field is the
 * one the rows are actually in the order of.
 */
function SortSummary({
  sort,
  labelOf,
  messages,
}: {
  sort: readonly RecordSort[];
  labelOf(field: string): string;
  messages: MessageFormatters;
}) {
  const first = sort[0];
  if (!first) return <>{messages.label('label.sort.title')}</>;
  return (
    <>
      {labelOf(first.field)}
      <DirectionMark direction={first.direction} />
      <span className="sr-only">
        {messages.label(DIRECTION_LABEL[first.direction])}
      </span>
      {sort.length > 1 && (
        <span className="text-muted-foreground">
          {messages.label('label.sort.more', { count: sort.length - 1 })}
        </span>
      )}
    </>
  );
}

function DirectionMark({ direction }: { direction: SortDirection }) {
  return direction === 'ASC' ? <ArrowUpIcon /> : <ArrowDownIcon />;
}

function flip(entry: RecordSort): RecordSort {
  return {
    field: entry.field,
    direction: entry.direction === 'ASC' ? 'DESC' : 'ASC',
  };
}
