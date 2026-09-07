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
  filter,
  FilterOperator as Op,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import type { DeepReadonly } from '../lib/types.js';
import type {
  FilterCompileResult,
  FilterDraftNode,
  FilterFieldDefinition,
  FilterValidationError,
} from './filterModel.js';
import { getFieldOperators, stringOperators } from './filterOperators.js';
import { build, checkShape, type CompiledNode } from './filterProtocol.js';
import { numeric, scalar } from './filterScalar.js';

export { FILTER_OPERATORS, getFieldOperators } from './filterOperators.js';
export {
  createFilterDraft,
  isSimpleFilter,
  newFilterDraft,
} from './filterDraft.js';

export function compileFilterDraft(
  draft: DeepReadonly<FilterDraftNode>,
  fields: readonly FilterFieldDefinition[],
  allowedOperators?: readonly Op[],
): FilterCompileResult {
  const errors: FilterValidationError[] = [];
  const visit = (
    node: DeepReadonly<FilterDraftNode>,
    scope: readonly FilterFieldDefinition[],
    element = false,
  ): FilterExpression | undefined => {
    try {
      const descriptor = checkShape(node);
      if (allowedOperators && !allowedOperators.includes(node.op))
        throw new TypeError(`当前视图不允许操作 ${node.op}`);
      if (
        element &&
        descriptor.category === 'root' &&
        node.op !== Op.MATCH_ALL &&
        node.op !== Op.MATCH_NONE
      )
        throw new TypeError('元素条件不能使用根级操作');
      const field = scope.find(candidate => candidate.field === node.field);
      if (
        descriptor.category === 'field' ||
        descriptor.category === 'element'
      ) {
        if (!field)
          throw new TypeError(
            `当前作用域没有字段 ${node.field ?? '（未指定）'}`,
          );
        filter.exists(field.field);
        if (!getFieldOperators(field).includes(node.op))
          throw new TypeError(`字段 ${field.label} 不支持操作 ${node.op}`);
      }
      if (descriptor.category === 'logical') {
        if (!Array.isArray(node.operands) || node.operands.length === 0)
          throw new TypeError('分组至少需要一个条件');
        const operands = Array.from(node.operands, child =>
          visit(child, scope, element),
        ).filter((child): child is FilterExpression => child !== undefined);
        return operands.length
          ? build({ ...node, operands, predicate: undefined })
          : undefined;
      }
      if (descriptor.category === 'element') {
        if (!node.predicate) throw new TypeError('请补全元素条件');
        const predicate = visit(node.predicate, field?.fields ?? [], true);
        return predicate
          ? build({ ...node, operands: undefined, predicate })
          : undefined;
      }
      const compiled: CompiledNode = {
        ...node,
        operands: undefined,
        predicate: undefined,
      };
      if (node.op === Op.SEARCH && node.fields !== undefined) {
        if (
          !Array.isArray(node.fields) ||
          Array.from(node.fields).some(
            name => !scope.some(candidate => candidate.field === name),
          )
        )
          throw new TypeError('搜索包含当前作用域没有的字段');
      }
      // Validate optional parameters even while the corresponding value is unset.
      if (stringOperators.includes(node.op)) build({ ...compiled, value: '' });
      if (descriptor.relativeTime)
        build({
          ...compiled,
          time: node.time ?? '00:00',
          days: node.days === undefined ? 1 : numeric(node.days),
        });
      if (node.op === Op.SEARCH)
        build({ ...compiled, query: node.query ?? '_' });
      switch (descriptor.input) {
        case 'value':
          compiled.value = scalar(
            node.value,
            stringOperators.includes(node.op) ? undefined : field,
          );
          if (compiled.value === undefined) return undefined;
          break;
        case 'values':
          if (node.values === undefined) return undefined;
          if (!Array.isArray(node.values))
            throw new TypeError('集合值必须是数组');
          if (node.values.length === 0) return undefined;
          compiled.values = Array.from(node.values, value => {
            const result = scalar(value, field);
            if (result === undefined) throw new TypeError('请补全集合中的值');
            return result;
          });
          break;
        case 'between': {
          const lower = scalar(node.lowerBound, field);
          const upper = scalar(node.upperBound, field);
          if (lower === undefined && upper === undefined) return undefined;
          if (lower === undefined || upper === undefined)
            throw new TypeError('请补全范围上下界');
          if (
            lower === null ||
            upper === null ||
            typeof lower !== typeof upper ||
            lower > upper
          )
            throw new TypeError('范围上下界类型必须相同且下界不能大于上界');
          compiled.lowerBound = lower;
          compiled.upperBound = upper;
          break;
        }
        case 'deletion':
          if (node.state === undefined) return undefined;
          break;
        case 'search':
          if (node.query === undefined) return undefined;
          break;
        case 'time':
          if (node.time === undefined) return undefined;
          break;
        case 'days':
          if (node.days === undefined) return undefined;
          compiled.days = numeric(node.days);
          break;
      }
      return build(compiled);
    } catch (error) {
      errors.push({
        id: node?.id ?? draft.id,
        message: error instanceof Error ? error.message : '过滤条件无效',
      });
      return undefined;
    }
  };
  const expression = visit(draft, fields);
  return errors.length
    ? { errors }
    : { expression: expression ?? filter.matchAll(), errors };
}
