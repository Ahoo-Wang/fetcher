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
  DeletionState,
  FilterOperator as Op,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import type { DeepReadonly } from '../lib/types.js';
import type { FilterDraftNode } from './filterModel.js';
import { definition, FILTER_OPERATORS } from './filterOperators.js';
import { build, checkShape, type CompiledNode } from './filterProtocol.js';

export function createFilterDraft(
  expression: DeepReadonly<FilterExpression>,
): FilterDraftNode {
  if (
    !expression ||
    typeof expression !== 'object' ||
    Array.isArray(expression)
  )
    throw new TypeError('过滤表达式必须是对象');
  const node: FilterDraftNode = {
    ...expression,
    id: crypto.randomUUID(),
  } as FilterDraftNode;
  const descriptor = checkShape(node);
  if (node.operands !== undefined) {
    if (!Array.isArray(node.operands))
      throw new TypeError('分组条件必须是数组');
    node.operands = Array.from(
      (expression as { operands: DeepReadonly<FilterExpression[]> }).operands,
      createFilterDraft,
    );
  }
  if (node.predicate !== undefined)
    node.predicate = createFilterDraft(
      (expression as { predicate: DeepReadonly<FilterExpression> }).predicate,
    );
  if (node.values !== undefined) {
    if (!Array.isArray(node.values)) throw new TypeError('集合值必须是数组');
    node.values = [...node.values];
  }
  if (node.fields !== undefined) {
    if (!Array.isArray(node.fields)) throw new TypeError('搜索字段必须是数组');
    node.fields = [...node.fields];
  }
  // No editor conversion here: remote objects are not protocol literals.
  if (descriptor.input === 'values' && !Array.isArray(node.values))
    throw new TypeError('缺少集合值');
  if (descriptor.category === 'logical' && !Array.isArray(node.operands))
    throw new TypeError('缺少分组条件');
  build(node as unknown as CompiledNode);
  return node;
}

export function newFilterDraft(op: Op, field?: string): FilterDraftNode {
  const descriptor = definition(op);
  const node: FilterDraftNode = {
    id: crypto.randomUUID(),
    op,
    ...(field === undefined ? {} : { field }),
  };
  if (descriptor.category === 'logical') node.operands = [];
  if (descriptor.category === 'element')
    node.predicate = newFilterDraft(Op.AND);
  if (op === Op.DELETION) node.state = DeletionState.ACTIVE;
  return node;
}

export function isSimpleFilter(draft: DeepReadonly<FilterDraftNode>): boolean {
  const ordinary = (node: DeepReadonly<FilterDraftNode>) =>
    Object.prototype.hasOwnProperty.call(FILTER_OPERATORS, node.op) &&
    FILTER_OPERATORS[node.op].category === 'field' &&
    typeof node.field === 'string' &&
    node.field.length > 0 &&
    node.operands === undefined &&
    node.predicate === undefined;
  return (
    draft.op === Op.MATCH_ALL ||
    ordinary(draft) ||
    (draft.op === Op.AND &&
      Array.isArray(draft.operands) &&
      draft.operands.length > 0 &&
      draft.operands.every(ordinary) &&
      new Set(draft.operands.map(node => node.field)).size ===
        draft.operands.length)
  );
}
