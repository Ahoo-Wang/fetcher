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

import type { FocusEvent } from 'react';
import { FilterIcon, PlusIcon, XIcon } from 'lucide-react';
import type {
  FieldOption,
  FilterGroup,
  FilterLeaf,
  FilterTree,
  Issue,
  IssuePath,
} from '../model/index.js';
import {
  elementFields,
  isBlankLeafValue,
  writeValue,
  type FilterPath,
} from '../filter/index.js';
import {
  treeController,
  type FilterEditorController,
  type FilterTreeController,
} from '../react/index.js';
import { Badge } from './components/badge.js';
import { Button } from './components/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './components/dropdown-menu.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/select.js';
import { ToggleGroup, ToggleGroupItem } from './components/toggle-group.js';
import { useViewMessages } from './MessagesProvider.js';
import { FilterValueEditor } from './FilterValueEditor.js';

export interface FilterPanelProps {
  filter: FilterEditorController;
  /** Candidates for a `remote` value editor, by the key its kind declared. */
  optionsFor?(remote: string): FieldOption[] | undefined;
  disabled?: boolean;
}

/**
 * The condition builder. A group is a framed block: its operator, its
 * conditions and room to add. A condition is a compact inline pill — field,
 * operator, value editor — and a group's conditions wrap in one strip, so a
 * filter of five conditions reads in a line rather than five rows. A
 * condition that holds a tree (an element match) is a block like a group,
 * since it is one. Simple mode shows the root's conditions as one strip;
 * anything the simple editor cannot show faithfully — a group anywhere — gets
 * the advanced one, where groups can be flipped between and/or, nested,
 * filled and removed.
 *
 * Nothing is applied until submit, which is the whole point of keeping a
 * draft apart from what ran: typing in here never re-queries.
 */
export function FilterPanel({
  filter,
  optionsFor,
  disabled,
}: FilterPanelProps) {
  const advanced = filter.mode === 'advanced' || !filter.simple;
  const messages = useViewMessages();
  // A stored tree can exceed the depth or node budget; the validator reports
  // it as an error, and the panel must not recurse into it anyway.
  const overBudget = filter.issues.some(
    found =>
      found.severity === 'error' &&
      (found.code === 'filter.tree.too-deep' ||
        found.code === 'filter.tree.too-many-nodes'),
  );

  return (
    <section
      data-slot="filter-panel"
      aria-label={messages.label('label.filter.panel')}
      className="flex flex-col gap-3"
      // Auto-refresh holds while any control in here has focus. Focus events
      // bubble in React, so the root sees every input; a move from one
      // control to another inside the panel is not a leave and not an enter.
      onFocus={event => {
        if (crossesBoundary(event)) filter.focus();
      }}
      onBlur={event => {
        if (leavesEditor(event)) filter.blur();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          // The effective mode, not the saved one: a simple config holding a
          // tree the simple editor cannot show opens in the advanced one, and
          // the toggle says so instead of contradicting the editor below.
          value={[advanced ? 'advanced' : 'simple']}
          onValueChange={value => {
            const next = value[0];
            if (next === 'simple' || next === 'advanced') filter.setMode(next);
          }}
          variant="outline"
          size="sm"
          aria-label={messages.label('label.filter.mode')}
        >
          <ToggleGroupItem value="simple">
            {messages.label('label.filter.simple')}
          </ToggleGroupItem>
          <ToggleGroupItem value="advanced">
            {messages.label('label.filter.advanced')}
          </ToggleGroupItem>
        </ToggleGroup>

        <AddCondition filter={filter} parent={[]} disabled={disabled} />

        {advanced && (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => filter.addGroup('or')}
          >
            <PlusIcon data-icon="inline-start" />
            {messages.label('label.filter.add-group')}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          // An over-budget tree may hold no leaf at all — deep groups — and
          // clearing it is then the only way back to an editable filter.
          disabled={disabled || (filter.count === 0 && !overBudget)}
          onClick={filter.clear}
        >
          {messages.label('label.filter.clear')}
        </Button>
        <Button size="sm" disabled={disabled} onClick={filter.submit}>
          <FilterIcon data-icon="inline-start" />
          {messages.label('label.filter.apply')}
        </Button>

        {filter.applied.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {filter.applied.map(item => (
              <Badge key={item.path.join('.')} variant="secondary">
                {item.text}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {overBudget ? (
        <p
          data-slot="filter-too-large"
          className="text-muted-foreground text-sm"
        >
          {messages.label('label.filter.too-large')}
        </p>
      ) : advanced ? (
        <GroupBlock
          filter={filter}
          group={filter.tree}
          path={[]}
          disabled={disabled}
          optionsFor={optionsFor}
        />
      ) : (
        filter.count > 0 && (
          <ConditionStrip
            filter={filter}
            group={filter.tree}
            path={[]}
            disabled={disabled}
            optionsFor={optionsFor}
          />
        )
      )}
    </section>
  );
}

/** One group as a framed block: its operator, its children, room to add. */
function GroupBlock({
  filter,
  group,
  path,
  disabled,
  optionsFor,
  scope,
}: {
  filter: FilterTreeController;
  group: FilterGroup;
  path: FilterPath;
  disabled?: boolean;
  optionsFor?: (remote: string) => FieldOption[] | undefined;
  /**
   * What this group is a group of, for the controls' accessible names. A
   * predicate renders a second root group on the same screen as the view's
   * own, and two controls called "Group operator" are two controls a screen
   * reader cannot tell apart.
   */
  scope?: string;
}) {
  const nested = path.length > 0;
  const messages = useViewMessages();

  return (
    <div
      data-slot="filter-group"
      role="group"
      aria-label={messages.label(
        group.op === 'or' ? 'label.filter.any-of' : 'label.filter.all-of',
      )}
      className="flex flex-col gap-2 rounded-md border border-border p-2"
    >
      <div className="flex items-center gap-1">
        <ToggleGroup
          value={[group.op]}
          onValueChange={value => {
            const next = value[0];
            if (next === 'and' || next === 'or' || next === 'nor')
              filter.updateGroup(path, next);
          }}
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label={within(
            scope,
            nested
              ? `${messages.label('label.filter.group-operator')} ${path.join('.')}`
              : messages.label('label.filter.group-operator'),
          )}
        >
          <ToggleGroupItem value="and">
            {messages.label('label.filter.all-of')}
          </ToggleGroupItem>
          <ToggleGroupItem value="or">
            {messages.label('label.filter.any-of')}
          </ToggleGroupItem>
          <ToggleGroupItem value="nor">
            {messages.label('label.filter.none-of')}
          </ToggleGroupItem>
        </ToggleGroup>

        {nested && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={messages.label('label.filter.remove-group')}
            disabled={disabled}
            onClick={() => filter.remove(path)}
          >
            <XIcon />
          </Button>
        )}
      </div>

      <ConditionStrip
        filter={filter}
        group={group}
        path={path}
        disabled={disabled}
        optionsFor={optionsFor}
        scope={scope}
      />

      <div className="flex flex-wrap items-center gap-1">
        <AddCondition
          filter={filter}
          parent={path}
          disabled={disabled}
          label={within(
            scope,
            messages.label('label.filter.add-condition-here'),
          )}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => filter.addGroup('and', path)}
        >
          <PlusIcon data-icon="inline-start" />
          {messages.label('label.filter.add-group')}
        </Button>
      </div>
    </div>
  );
}

/**
 * A group's conditions in one wrapping strip. Conditions are pills and sit
 * side by side; a nested group, and a condition that holds a tree, takes a
 * whole line of its own, since it holds conditions of its own.
 */
function ConditionStrip({
  filter,
  group,
  path,
  disabled,
  optionsFor,
  scope,
}: {
  filter: FilterTreeController;
  group: FilterGroup;
  path: FilterPath;
  disabled?: boolean;
  optionsFor?: (remote: string) => FieldOption[] | undefined;
  scope?: string;
}) {
  if (group.children.length === 0) return null;
  return (
    <div
      data-slot="filter-conditions"
      className="flex flex-wrap items-center gap-1.5"
    >
      {group.children.map((child, index) =>
        'children' in child ? (
          <div key={index} className="basis-full">
            <GroupBlock
              filter={filter}
              group={child}
              path={[...path, index]}
              disabled={disabled}
              optionsFor={optionsFor}
              scope={scope}
            />
          </div>
        ) : (
          <Condition
            key={`${child.field}-${index}`}
            filter={filter}
            leaf={child}
            path={[...path, index]}
            disabled={disabled}
            optionsFor={optionsFor}
          />
        ),
      )}
    </div>
  );
}

/** The field picker that appends a leaf to one group. */
function AddCondition({
  filter,
  parent,
  disabled,
  label,
}: {
  filter: FilterTreeController;
  parent: FilterPath;
  disabled?: boolean;
  /** The accessible name; the catalogue's own when a caller names none. */
  label?: string;
}) {
  const messages = useViewMessages();
  const name = label ?? messages.label('label.filter.add-condition');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} />}
      >
        <PlusIcon data-icon="inline-start" />
        {name}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {filter.fieldsFor(parent).map(field => (
            <DropdownMenuItem
              key={field.name}
              onClick={() => filter.addLeaf(field.name, parent)}
            >
              {field.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * One condition: a field, an operator and whatever value editor the kind
 * implies, as one inline pill. Blank — a field chosen and nothing said yet —
 * it is dashed; wrong, it is marked invalid. A condition that holds a tree
 * is a block instead: its header is the same field and operator, its body
 * the group it holds.
 */
function Condition({
  filter,
  leaf,
  path,
  disabled,
  optionsFor,
}: {
  filter: FilterTreeController;
  leaf: FilterLeaf;
  path: FilterPath;
  disabled?: boolean;
  optionsFor?: (remote: string) => FieldOption[] | undefined;
}) {
  const messages = useViewMessages();
  const field = filter.fields.find(entry => entry.name === leaf.field);
  const label = field?.label ?? leaf.field;
  const operators = filter.operatorsFor(leaf.field).map(operator => ({
    // The catalogue names the ones worth naming; the rest keep the derived
    // spelling, which reads well enough for `EQ` and `BETWEEN` and not at all
    // for `IDS` or `OWNER_ID`.
    label: messages.label(
      `label.operator.${operator}`,
      undefined,
      operator.split('_').join(' ').toLowerCase(),
    ),
    value: operator,
  }));
  const editor = filter.editorFor(path);
  const kind = field && filter.kinds?.get(field.kind);
  const blank =
    field !== undefined &&
    kind !== undefined &&
    filter.kinds !== undefined &&
    isBlankLeafValue(leaf.value, leaf.operator, field, kind, filter.kinds);
  // `validateFilter` addresses a node as ['children', 0, 'children', 1, …];
  // its numeric segments are exactly this leaf's path.
  const invalid = filter.issues.some(found =>
    samePath(numericPath(found.path), path),
  );
  const holdsTree = editor?.input === 'predicate';

  const operatorSelect = (
    <Select
      items={operators}
      value={leaf.operator}
      disabled={disabled}
      onValueChange={value => {
        if (typeof value === 'string')
          filter.updateLeaf(path, { operator: value });
      }}
    >
      <SelectTrigger
        aria-label={messages.label('label.filter.operator-of', {
          field: label,
        })}
        size="sm"
        className="h-7 border-0 bg-transparent px-1 shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {operators.map(operator => (
            <SelectItem key={operator.value} value={operator.value}>
              {operator.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  const remove = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={messages.label('label.filter.remove-of', { field: label })}
      disabled={disabled}
      onClick={() => filter.remove(path)}
    >
      <XIcon />
    </Button>
  );

  if (holdsTree)
    return (
      <div
        data-slot="filter-element"
        role="group"
        aria-label={messages.label('label.filter.condition-of', {
          field: label,
        })}
        data-invalid={invalid || undefined}
        className="flex basis-full flex-col gap-1 rounded-md border border-border p-2 data-[invalid]:border-destructive"
      >
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{label}</span>
          {operatorSelect}
          {remove}
        </div>
        <NestedPredicate
          filter={filter}
          leaf={leaf}
          path={path}
          disabled={disabled}
          optionsFor={optionsFor}
        />
      </div>
    );

  return (
    <div
      data-slot="filter-condition"
      role="group"
      aria-label={messages.label('label.filter.condition-of', {
        field: label,
      })}
      data-invalid={invalid || undefined}
      data-blank={blank || undefined}
      className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/40 py-0.5 pr-0.5 pl-2 text-sm data-[blank]:border-dashed data-[invalid]:border-destructive"
    >
      <span className="font-medium whitespace-nowrap">{label}</span>
      {operatorSelect}
      {editor && (
        <FilterValueEditor
          editor={editor}
          value={leaf.value}
          label={messages.label('label.filter.value-of', {
            field: leaf.field,
          })}
          disabled={disabled}
          options={editor.remote ? optionsFor?.(editor.remote) : undefined}
          onChange={value => filter.updateLeaf(path, { value })}
        />
      )}
      {remove}
    </div>
  );
}

/**
 * Whether a focus event entered or left the element it was handled on, as
 * opposed to moving between two of its descendants. `relatedTarget` is the
 * other side of the move: on focus the element left, on blur the one gained.
 */
export function crossesBoundary(event: FocusEvent<HTMLElement>): boolean {
  const other = event.relatedTarget;
  return !(other instanceof Node && event.currentTarget.contains(other));
}

/**
 * Whether a blur means the user left the editor. A select, a date picker or
 * a menu of one of its controls renders in a portal outside the element, and
 * focus in there is still focus in the editor. Base UI marks the trigger of
 * an open popup, so the editor can tell one of its own is open; when it
 * closes, focus returns to the trigger and a later blur is judged afresh.
 */
export function leavesEditor(event: FocusEvent<HTMLElement>): boolean {
  if (!crossesBoundary(event)) return false;
  return event.currentTarget.querySelector('[data-popup-open]') === null;
}

/**
 * One control's accessible name, told apart by what it belongs to.
 *
 * A predicate renders a second root group on the same screen as the view's
 * own, so without this two controls would answer to "Group operator" and a
 * screen reader could not say which filter either one edits.
 */
function within(scope: string | undefined, name: string): string {
  return scope ? `${scope} ${name}` : name;
}

/**
 * A condition whose value is itself a condition, on the fields of an array's
 * elements.
 *
 * It renders the same group the outer filter renders, because it is the same
 * thing: `treeController` writes each change straight back into the leaf that
 * carries the tree. Two conditions written side by side outside this block
 * are satisfied by any entries, one each; inside it they must be satisfied by
 * the same entry.
 */
function NestedPredicate({
  filter,
  leaf,
  path,
  disabled,
  optionsFor,
}: {
  filter: FilterTreeController;
  leaf: FilterLeaf;
  path: FilterPath;
  disabled?: boolean;
  optionsFor?: (remote: string) => FieldOption[] | undefined;
}) {
  const field = filter.fields.find(entry => entry.name === leaf.field);
  // Built on every render rather than memoised: `filter` and `path` are fresh
  // each time, so a memo keyed on them memoised nothing and only hid that a
  // controller is a plain object over the values already in hand.
  const nested = treeController({
    tree: asTree(leaf.value),
    fields: field ? elementFields(field) : [],
    kinds: filter.kinds,
    // The kind reports a predicate's findings under the leaf that holds it,
    // so they are rebased here to address the nested tree instead.
    issues: rebase(filter.issues, path),
    onChange: tree => filter.updateLeaf(path, { value: writeValue(tree) }),
  });

  return (
    <div className="min-w-0">
      <GroupBlock
        filter={nested}
        group={nested.tree}
        path={[]}
        disabled={disabled}
        optionsFor={optionsFor}
        scope={field?.label ?? leaf.field}
      />
    </div>
  );
}

/** A leaf's value read as the tree it holds; an unfinished one is empty. */
function asTree(value: unknown): FilterTree {
  return value !== null &&
    typeof value === 'object' &&
    Array.isArray((value as FilterTree).children)
    ? (value as FilterTree)
    : { op: 'and', children: [] };
}

/** Findings under one leaf, addressed against the tree that leaf carries. */
function rebase(issues: readonly Issue[], path: FilterPath): Issue[] {
  const prefix = path.flatMap(index => ['children', index]);
  return issues.flatMap(found => {
    const own = found.path.slice(0, prefix.length);
    if (own.join('.') !== prefix.join('.')) return [];
    return [{ ...found, path: found.path.slice(prefix.length) }];
  });
}

/** The node indexes of an issue path, comparable against a `FilterPath`. */
function numericPath(path: IssuePath): FilterPath {
  return path.filter(segment => typeof segment === 'number');
}

function samePath(a: FilterPath, b: FilterPath): boolean {
  return (
    a.length === b.length && a.every((segment, index) => segment === b[index])
  );
}
