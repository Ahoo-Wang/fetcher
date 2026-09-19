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

import type {
  FieldKindId,
  FieldDefinition,
  FilterGroupOperator,
  FilterLeaf,
  FilterOperatorName,
  FilterTree,
  IssuePath,
  NumberFormat,
} from '../model/index.js';
import {
  isBlankLeafValue,
  type FieldKind,
  type FieldKindRegistry,
} from './fieldKind.js';
import { isFilterGroup, isFilterNode } from './tree.js';
import type {
  DateTimePreset,
  RelativeDateDirection,
  RelativeDateUnit,
} from './values.js';

/**
 * What a condition compares against, as its kind read it.
 *
 * A closed union, and the reason the summary can be translated at all: the
 * bar used to be handed one English sentence per condition, so the most
 * visible line of the result area was the one line no catalogue could reach.
 * Each variant carries the raw value, plus the labels a kind has already
 * resolved — `/ui` turns it into words with the wording in force.
 */
export type FilterSummaryValue =
  /** The operator is the whole condition: `IS_NULL`, `IS_EMPTY`. */
  | { kind: 'none' }
  /**
   * The kind cannot read this value, so only the field's name is true of it.
   * A stored config outlives the definition that admitted it.
   */
  | { kind: 'blank' }
  /** One value, as the field holds it; `label` when the kind resolved one. */
  | { kind: 'text'; value: string | number | boolean; label?: string }
  /** Several values; `labels` when the kind resolved them, in the same order. */
  | {
      kind: 'list';
      values: readonly (string | number)[];
      labels?: readonly string[];
    }
  /** Two bounds in the field's own units; `to` is absent for an open one. */
  | { kind: 'range'; from: string | number; to?: string | number }
  /** A window measured from the evaluation moment. */
  | {
      kind: 'relative';
      amount: number;
      unit: RelativeDateUnit;
      direction: RelativeDateDirection;
    }
  /** A named calendar period, resolved at compile time. */
  | { kind: 'preset'; preset: DateTimePreset };

/**
 * What a `FieldKind` says about one applied condition.
 *
 * `text` is the English line the kind has always produced, kept because a
 * host may read `FilterSummaryItem.text` directly; the parts beside it are
 * what `/ui` formats the badge from.
 */
export interface FieldKindDescription {
  /** The English reading, for a host that consumes `text` as it stands. */
  text: string;
  /** How the condition reads; the leaf's own operator unless given. */
  operator?: FilterOperatorName;
  value: FilterSummaryValue;
  /** For a predicate-valued kind: the conditions inside it. */
  items?: readonly FilterSummaryItem[];
  /** The operator joining `items`. */
  group?: FilterGroupOperator;
}

/** One applied condition, for the summary bar above a result. */
export interface FilterSummaryItem {
  /** Location of the node, so the bar can remove or focus it. */
  path: IssuePath;
  /**
   * The condition in English, as the kind reads it out. It is a fallback
   * rather than the summary: `/ui` builds the badge from the parts below, so
   * the bar reads in the language the catalogue is in.
   */
  text: string;
  /** The field or its kind is no longer available, in it or under it. */
  unresolved: boolean;
  /** A condition's field; a group has none. */
  field?: string;
  /** Field label, or the raw name when the field is gone. */
  label?: string;
  /** The field's kind, so the bar shows the value the way the field does. */
  kind?: FieldKindId;
  /** The field's number format, for the same reason. */
  numberFormat?: NumberFormat;
  /** How the condition reads; absent on a group. */
  operator?: FilterOperatorName;
  /** What the condition compares against; absent on a group. */
  value?: FilterSummaryValue;
  /**
   * The operator joining `items`: a group's own, or the one inside a
   * predicate. An item with no `field` is a group.
   */
  group?: FilterGroupOperator;
  /** The conditions read out inside: a group's children, or a predicate's. */
  items?: readonly FilterSummaryItem[];
}

/** How a group's own operator reads between its conditions. */
export function groupJoinWord(op: FilterGroupOperator): string {
  return op === 'or' ? ' or ' : op === 'nor' ? ' nor ' : ' and ';
}

/**
 * Whether this item is a group rather than one condition.
 *
 * A group names no field. A predicate-valued condition carries `items` and a
 * `group` too — it reads its predicate out — but it is one condition, and the
 * bar draws it as one.
 */
export function isGroupItem(item: FilterSummaryItem): boolean {
  return item.field === undefined && item.items !== undefined;
}

/**
 * The conditions in force, one item per child of the root, so the summary
 * keeps the tree's logic: a group under the root is one item that reads out
 * its own conditions joined by its own operator, with a group inside it in
 * parentheses. Items side by side read as "all of"; a root that is `or` or
 * `nor` therefore folds into one item that says so. Blank conditions never
 * reached the query and are left out; a condition whose field or kind is
 * gone is named rather than hidden.
 */
export function describeFilter(
  fields: readonly FieldDefinition[],
  tree: FilterTree,
  kinds: FieldKindRegistry,
): FilterSummaryItem[] {
  const byName = new Map(fields.map(field => [field.name, field]));
  const items = describeGroup(tree, [], byName, kinds);
  // Items side by side read as "all of", and one item alone reads the same
  // under `or`; `nor` negates even a lone condition, so it always says so.
  if (tree.op === 'and' || (tree.op === 'or' && items.length < 2)) return items;
  if (items.length === 0) return items;
  return [groupItem(tree.op, [], items)];
}

function describeGroup(
  group: FilterTree,
  path: IssuePath,
  byName: ReadonlyMap<string, FieldDefinition>,
  kinds: FieldKindRegistry,
): FilterSummaryItem[] {
  const items: FilterSummaryItem[] = [];
  group.children.forEach((node, index) => {
    const at: IssuePath = [...path, 'children', index];
    if (!isFilterNode(node)) return;
    if (isFilterGroup(node)) {
      const inner = describeGroup(node, at, byName, kinds);
      if (inner.length > 0) items.push(groupItem(node.op, at, inner));
      return;
    }
    const item = describeCondition(node, at, byName, kinds);
    if (item) items.push(item);
  });
  return items;
}

function groupItem(
  op: FilterGroupOperator,
  path: IssuePath,
  inner: readonly FilterSummaryItem[],
): FilterSummaryItem {
  // A group inside a group is parenthesised; a predicate leaf carries a
  // `group` of its own and is a condition, not a nesting of this one.
  const parts = inner.map(item =>
    isGroupItem(item) ? `(${item.text})` : item.text,
  );
  // "A nor B" needs both sides; a lone condition under `nor` is its negation.
  const text =
    op === 'nor' && parts.length === 1
      ? `not ${parts[0]}`
      : parts.join(groupJoinWord(op));
  return {
    path,
    text,
    unresolved: inner.some(item => item.unresolved),
    group: op,
    items: inner,
  };
}

function describeCondition(
  node: FilterLeaf,
  path: IssuePath,
  byName: ReadonlyMap<string, FieldDefinition>,
  kinds: FieldKindRegistry,
): FilterSummaryItem | null {
  const field = byName.get(node.field);
  const kind = field ? kinds.get(field.kind) : undefined;
  // A condition that was never finished did not reach the query, so it is
  // not one of the conditions in force.
  if (
    field &&
    kind &&
    isBlankLeafValue(node.value, node.operator, field, kind, kinds)
  )
    return null;
  const described =
    field && kind ? describeLeaf(kind, node, field, kinds) : undefined;
  if (!field || described === undefined)
    return {
      path,
      field: node.field,
      label: field?.label ?? node.field,
      ...(field ? fieldParts(field) : {}),
      // Nothing is known about the value, but the question still is: the
      // bar names the field and the operator, and says no more.
      operator: node.operator,
      value: { kind: 'blank' },
      text: `${field?.label ?? node.field} ${node.operator}`,
      unresolved: true,
    };
  return {
    path,
    field: field.name,
    label: field.label,
    ...fieldParts(field),
    operator: described.operator ?? node.operator,
    value: described.value,
    ...(described.items ? { items: described.items } : {}),
    ...(described.group ? { group: described.group } : {}),
    text: described.text,
    unresolved: false,
  };
}

/** What the bar needs about the field to show its value the way it does. */
function fieldParts(
  field: FieldDefinition,
): Pick<FilterSummaryItem, 'kind' | 'numberFormat'> {
  return {
    kind: field.kind,
    ...(field.numberFormat ? { numberFormat: field.numberFormat } : {}),
  };
}

function describeLeaf(
  kind: FieldKind,
  leaf: FilterLeaf,
  field: FieldDefinition,
  kinds: FieldKindRegistry,
): FieldKindDescription | undefined {
  try {
    return kind.describe({ leaf, field, kinds });
  } catch {
    return undefined;
  }
}
