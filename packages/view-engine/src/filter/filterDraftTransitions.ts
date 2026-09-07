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

import { FilterOperator } from '@ahoo-wang/fetcher-wow';
import type { FilterDraftNode } from './filterModel.js';
import { newFilterDraft } from './filterDraft.js';
import { FILTER_OPERATORS } from './filterOperators.js';

export function appendNode(
  target: FilterDraftNode,
  child: FilterDraftNode,
): FilterDraftNode {
  if (target.operands)
    return { ...target, operands: [...target.operands, child] };
  if (target.op === FilterOperator.MATCH_ALL) return child;
  return { ...newFilterDraft(FilterOperator.AND), operands: [target, child] };
}
export function clearValue(node: FilterDraftNode): FilterDraftNode {
  const next = { ...node };
  for (const key of [
    'value',
    'values',
    'lowerBound',
    'upperBound',
    'query',
    'state',
    'time',
    'days',
  ] as const)
    delete next[key];
  return next;
}
export function transitionFilterOperator(
  node: FilterDraftNode,
  op: FilterOperator,
): FilterDraftNode {
  const next = { ...newFilterDraft(op, node.field), id: node.id };
  const before = FILTER_OPERATORS[node.op]?.input,
    after = FILTER_OPERATORS[op]?.input;
  if (before === after) {
    const keys =
      after === 'value'
        ? ['value']
        : after === 'values'
          ? ['values']
          : after === 'between'
            ? ['lowerBound', 'upperBound']
            : after === 'time'
              ? ['time']
              : after === 'days'
                ? ['days']
                : [];
    for (const key of keys)
      if (key in node)
        Object.assign(next, { [key]: node[key as keyof FilterDraftNode] });
  }
  if (
    FILTER_OPERATORS[node.op]?.relativeTime &&
    FILTER_OPERATORS[op]?.relativeTime
  ) {
    for (const key of ['zoneId', 'datePattern', 'timeUnit'] as const)
      if (key in node) Object.assign(next, { [key]: node[key] });
  }
  return next;
}
