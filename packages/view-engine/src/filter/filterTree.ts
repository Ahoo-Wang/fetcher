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

import { FilterOperator, type FilterExpression } from '@ahoo-wang/fetcher-wow';
import { newFilterDraft } from './filterDraft.js';
import type { FilterDraftNode, FilterFieldDefinition } from './filterModel.js';
import type { DeepReadonly } from '../lib/types.js';

export function sameFilterState(a: unknown, b: unknown): boolean {
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, value]) => value !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => [key, canonical(value)]),
      );
    return value;
  }
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}
/** Ignore only redundant singleton AND/OR wrappers; keep persisted structure unchanged. */
export function sameFilterQuery(
  a: DeepReadonly<FilterExpression> | null | undefined,
  b: DeepReadonly<FilterExpression> | null | undefined,
): boolean {
  function normalize(
    value: DeepReadonly<FilterExpression> | null | undefined,
  ): unknown {
    if (!value) return value;
    if ('operands' in value) {
      if (
        (value.op === FilterOperator.AND || value.op === FilterOperator.OR) &&
        value.operands.length === 1
      )
        return normalize(value.operands[0]);
      return { ...value, operands: value.operands.map(normalize) };
    }
    return 'predicate' in value
      ? { ...value, predicate: normalize(value.predicate) }
      : value;
  }
  return sameFilterState(normalize(a), normalize(b));
}
export function sameFilterDraft(
  a: DeepReadonly<FilterDraftNode>,
  b: DeepReadonly<FilterDraftNode>,
): boolean {
  function content(node: DeepReadonly<FilterDraftNode>): unknown {
    return {
      ...node,
      id: undefined,
      operands: node.operands?.map(content),
      predicate: node.predicate ? content(node.predicate) : undefined,
    };
  }
  return sameFilterState(content(a), content(b));
}
export function replaceFilterNode(
  root: FilterDraftNode,
  id: string,
  next?: FilterDraftNode,
): FilterDraftNode | undefined {
  if (root.id === id) return next;
  if (root.operands)
    return {
      ...root,
      operands: root.operands.flatMap(node => {
        const updated = replaceFilterNode(node, id, next);
        return updated ? [updated] : [];
      }),
    };
  if (root.predicate)
    return {
      ...root,
      predicate:
        replaceFilterNode(root.predicate, id, next) ??
        newFilterDraft(FilterOperator.AND),
    };
  return root;
}
export interface FilterNodeLocation {
  node: FilterDraftNode;
  fields: readonly FilterFieldDefinition[];
  scope: string;
}
export function locateFilterNodes(
  root: FilterDraftNode,
  fields: readonly FilterFieldDefinition[],
): FilterNodeLocation[] {
  const result: FilterNodeLocation[] = [];
  function visit(
    node: FilterDraftNode,
    fields: readonly FilterFieldDefinition[],
    scope: string,
  ) {
    result.push({ node, fields, scope });
    node.operands?.forEach(child => visit(child, fields, scope));
    if (node.predicate)
      visit(
        node.predicate,
        fields.find(field => field.field === node.field)?.fields ?? [],
        `${scope}/${node.id}`,
      );
  }
  visit(root, fields, 'root');
  return result;
}
