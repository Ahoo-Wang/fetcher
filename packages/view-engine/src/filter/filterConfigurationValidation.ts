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
import type {
  FilterComponentConfig,
  FilterConfiguration,
  FilterFieldDefinition,
} from './filterModel.js';
import { definition, getFieldOperators } from './filterOperators.js';
import { checkShape, checkBuiltinProps } from './filterProtocol.js';

/** Check before JSON serialization so values that JSON silently drops cannot lose state. */
export function validateFilterJson(
  value: unknown,
  ancestors = new Set<object>(),
  arrayItem = false,
): void {
  if (value === undefined && !arrayItem) return;
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
    return;
  if (!value || typeof value !== 'object' || ancestors.has(value))
    throw new TypeError('筛选属性必须是无循环的 JSON 值');
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (Reflect.ownKeys(value).length !== value.length + 1)
      throw new TypeError('JSON 数组不能包含额外属性');
    for (let index = 0; index < value.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, index);
      if (!descriptor?.enumerable || !('value' in descriptor))
        throw new TypeError('JSON 数组不能包含空位或访问器');
      validateFilterJson(descriptor.value, ancestors, true);
    }
  } else {
    object(value);
    for (const key of Reflect.ownKeys(value)) {
      if (
        typeof key !== 'string' ||
        !Object.getOwnPropertyDescriptor(value, key)?.enumerable ||
        !('value' in Object.getOwnPropertyDescriptor(value, key)!)
      )
        throw new TypeError('筛选属性必须是普通 JSON 对象');
      validateFilterJson((value as Record<string, unknown>)[key], ancestors);
    }
  }
  ancestors.delete(value);
}
function object(value: unknown): asserts value is Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    throw new TypeError('筛选配置必须是普通对象');
}
function keys(value: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key)))
    throw new TypeError('筛选配置包含未知属性');
}
export function validateFilterConfiguration(
  value: unknown,
  fields?: readonly FilterFieldDefinition[],
  allowedOperators?: readonly FilterOperator[],
): asserts value is FilterConfiguration {
  validateFilterJson(value);
  object(value);
  keys(value, ['mode', 'root']);
  if (value.mode !== 'simple' && value.mode !== 'advanced')
    throw new TypeError('筛选模式无效');
  const ids = new Set<string>();
  function visit(value: unknown, scope?: readonly FilterFieldDefinition[]) {
    object(value);
    keys(value, [
      'id',
      'component',
      'operator',
      'field',
      'props',
      'operands',
      'predicate',
    ]);
    if (typeof value.id !== 'string' || !value.id.trim())
      throw new TypeError('筛选组件标识无效');
    if (ids.has(value.id)) throw new TypeError('筛选组件标识不能重复');
    ids.add(value.id);
    object(value.component);
    keys(value.component, ['name', 'options']);
    if (
      typeof value.component.name !== 'string' ||
      !value.component.name.trim()
    )
      throw new TypeError('筛选组件引用无效');
    if (value.component.options !== undefined) object(value.component.options);
    object(value.props);
    const operator = value.operator as FilterOperator;
    const descriptor = definition(operator);
    if (allowedOperators && !allowedOperators.includes(operator))
      throw new TypeError(`当前视图不允许操作 ${String(value.operator)}`);
    const bound =
      descriptor.category === 'field' || descriptor.category === 'element';
    if (bound && (typeof value.field !== 'string' || !value.field))
      throw new TypeError('筛选组件缺少绑定字段');
    if (!bound && value.field !== undefined)
      throw new TypeError('根级操作不能绑定字段');
    const field = scope?.find(field => field.field === value.field);
    if (
      scope &&
      bound &&
      (!field || !getFieldOperators(field).includes(operator))
    )
      throw new TypeError(
        `字段 ${String(value.field)} 不支持操作 ${String(value.operator)}`,
      );
    if (descriptor.category === 'logical') {
      if (!Array.isArray(value.operands))
        throw new TypeError('分组条件必须是数组');
      value.operands.forEach(child => visit(child, scope));
    } else if (value.operands !== undefined)
      throw new TypeError('非分组组件不能包含 operands');
    if (descriptor.category === 'element') {
      visit(value.predicate, field?.fields);
    } else if (value.predicate !== undefined)
      throw new TypeError('非元素组件不能包含 predicate');
    if (
      descriptor.category === 'logical' ||
      descriptor.category === 'element'
    ) {
      if (value.component.name !== 'builtin')
        throw new TypeError('条件容器必须使用 builtin 组件');
    }
    if (value.component.name === 'builtin') {
      checkBuiltinProps(value.props);
      checkShape({
        ...value.props,
        id: value.id,
        op: value.operator,
        ...(bound ? { field: value.field } : {}),
        ...(descriptor.category === 'logical' ? { operands: [] } : {}),
        ...(descriptor.category === 'element' ? { predicate: {} } : {}),
      } as Parameters<typeof checkShape>[0]);
    }
  }
  visit(value.root, fields);
  if (value.mode === 'simple') {
    const root = value.root as FilterComponentConfig;
    const ordinary = (node: FilterComponentConfig) =>
      definition(node.operator).category === 'field';
    if (!(
      root.operator === FilterOperator.MATCH_ALL ||
      ordinary(root) ||
      (root.operator === FilterOperator.AND &&
        root.operands!.length > 0 &&
        root.operands!.every(ordinary) &&
        new Set(root.operands!.map(node => node.field)).size ===
          root.operands!.length)
    ))
      throw new TypeError('当前筛选结构不支持简单模式');
  }
}
