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
import { getBuiltinFilterCompiler } from './builtinFilterCompilers.js';
import {
  filter,
  FilterOperator as Op,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import { copy } from '../lib/snapshot.js';
import type { DeepReadonly } from '../lib/types.js';
import type {
  FilterCompileResult,
  FilterCompilerContext,
  FilterCompilerRegistry,
  FilterComponentConfig,
  FilterConfiguration,
  FilterFieldDefinition,
  FilterValidationError,
} from './filterModel.js';
import {
  validateFilterConfiguration,
  validateFilterJson,
} from './filterConfigurationValidation.js';
import {
  compileBuiltinDraft,
  compileBuiltinFilter,
} from './filterBuiltinCompiler.js';
import { createFilterDraft } from './filterDraft.js';
import { definition, getFieldOperators } from './filterOperators.js';
import { build } from './filterProtocol.js';

export function filterCompilerContext(
  node: DeepReadonly<FilterComponentConfig>,
  fields: readonly FilterFieldDefinition[],
): FilterCompilerContext {
  const field = fields.find(field => field.field === node.field);
  return copy({
    operator: node.operator,
    fields,
    ...(field ? { field } : {}),
    ...(node.component.options ? { options: node.component.options } : {}),
  });
}
function validateOutput(
  expression: FilterExpression,
  node: DeepReadonly<FilterComponentConfig>,
  fields: readonly FilterFieldDefinition[],
  allowedOperators?: readonly Op[],
): FilterExpression {
  validateFilterJson(expression);
  const draft = createFilterDraft(expression);
  const bound = definition(node.operator).category === 'field';
  function binding(output: DeepReadonly<ReturnType<typeof createFilterDraft>>) {
    const category = definition(output.op).category;
    if (bound && category === 'logical') output.operands!.forEach(binding);
    else if (
      bound
        ? category !== 'field' || output.field !== node.field
        : output.op !== node.operator || output.field !== node.field
    )
      throw new TypeError('自定义筛选器不能改变绑定字段或条件容器。');
  }
  binding(draft);
  const result = compileBuiltinDraft(draft, fields, allowedOperators);
  if (result.errors.length)
    throw new TypeError(result.errors.map(error => error.message).join('；'));
  return result.expression!;
}

export function compileFilterConfiguration(
  config: DeepReadonly<FilterConfiguration>,
  fields: readonly FilterFieldDefinition[],
  allowedOperators?: readonly Op[],
  compilers?: FilterCompilerRegistry,
): FilterCompileResult {
  const errors: FilterValidationError[] = [];
  try {
    validateFilterConfiguration(config);
  } catch (error) {
    return {
      errors: [
        {
          id: config?.root?.id ?? '',
          message: error instanceof Error ? error.message : '筛选配置无效',
        },
      ],
    };
  }
  function visit(
    node: DeepReadonly<FilterComponentConfig>,
    scope: readonly FilterFieldDefinition[],
    element = false,
  ): FilterExpression | undefined {
    try {
      const descriptor = definition(node.operator);
      if (allowedOperators && !allowedOperators.includes(node.operator))
        throw new TypeError(`当前视图不允许操作 ${node.operator}`);
      if (
        element &&
        descriptor.category === 'root' &&
        ![Op.MATCH_ALL, Op.MATCH_NONE].includes(node.operator)
      )
        throw new TypeError('元素条件不能使用根级操作');
      const field = scope.find(field => field.field === node.field);
      if (
        descriptor.category === 'field' ||
        descriptor.category === 'element'
      ) {
        if (!field)
          throw new TypeError(
            `当前作用域没有字段 ${node.field ?? '（未指定）'}`,
          );
        filter.exists(field.field);
        if (!getFieldOperators(field).includes(node.operator))
          throw new TypeError(
            `字段 ${field.label} 不支持操作 ${node.operator}`,
          );
      }
      if (descriptor.category === 'logical') {
        if (!node.operands?.length) throw new TypeError('分组至少需要一个条件');
        const operands = node.operands
          .map(child => visit(child, scope, element))
          .filter((value): value is FilterExpression => value !== undefined);
        return operands.length
          ? build({ id: node.id, op: node.operator, operands })
          : undefined;
      }
      if (descriptor.category === 'element') {
        const predicate = visit(node.predicate!, field?.fields ?? [], true);
        return predicate
          ? build({
              id: node.id,
              op: node.operator,
              field: node.field,
              predicate,
            })
          : undefined;
      }
      const compiler =
        node.component.name === 'builtin'
          ? { compile: compileBuiltinFilter }
          : compilers &&
              Object.prototype.hasOwnProperty.call(
                compilers,
                node.component.name,
              )
            ? compilers[node.component.name]
            : getBuiltinFilterCompiler(node.component.name);
      if (!compiler || typeof compiler.compile !== 'function')
        throw new TypeError(`未注册筛选编译器：${node.component.name}`);
      const expression = compiler.compile(
        copy(node.props),
        filterCompilerContext(node, scope),
      );
      if (expression === undefined) return undefined;
      return validateOutput(expression, node, scope, allowedOperators);
    } catch (error) {
      errors.push({
        id: node.id,
        message: error instanceof Error ? error.message : '筛选编译失败',
      });
      return undefined;
    }
  }
  const expression = visit(config.root, fields);
  return errors.length
    ? { errors }
    : { expression: expression ?? filter.matchAll(), errors };
}
