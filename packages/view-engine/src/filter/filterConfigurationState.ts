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
import type { FilterOperator } from '@ahoo-wang/fetcher-wow';
import type { DeepReadonly } from '../lib/types.js';
import type {
  FilterComponentConfig,
  FilterComponentProperties,
  FilterConfiguration,
  FilterDraftNode,
  FilterEditorReference,
  FilterFieldDefinition,
  FilterMode,
} from './filterModel.js';
import { isSimpleFilter } from './filterDraft.js';
import { definition } from './filterOperators.js';
import {
  validateFilterJson,
  validateFilterConfiguration,
} from './filterConfigurationValidation.js';

export function filterComponentReference(
  node: DeepReadonly<FilterDraftNode>,
  field?: DeepReadonly<FilterFieldDefinition>,
  editors?: Readonly<Partial<Record<FilterOperator, FilterEditorReference>>>,
): FilterEditorReference {
  if (node.editor) return node.editor;
  if (['logical', 'element'].includes(definition(node.op).category))
    return { name: 'builtin' };
  return field?.editor ?? editors?.[node.op] ?? { name: 'builtin' };
}

/** Copy attributes directly; compiled query values cannot recover component state. */
export function filterComponentProps(
  node: DeepReadonly<FilterDraftNode>,
): FilterComponentProperties {
  const value =
    node.props ??
    Object.fromEntries(
      Object.entries(node).filter(
        ([key]) =>
          ![
            'id',
            'op',
            'field',
            'editor',
            'props',
            'operands',
            'predicate',
          ].includes(key),
      ),
    );
  validateFilterJson(value);
  return JSON.parse(JSON.stringify(value)) as FilterComponentProperties;
}

export function createFilterConfiguration(
  draft: DeepReadonly<FilterDraftNode>,
  mode?: FilterMode,
  fields: readonly FilterFieldDefinition[] = [],
  editors?: Readonly<Partial<Record<FilterOperator, FilterEditorReference>>>,
): FilterConfiguration {
  function visit(
    node: DeepReadonly<FilterDraftNode>,
    scope: readonly FilterFieldDefinition[],
  ): FilterComponentConfig {
    const descriptor = definition(node.op);
    const field = scope.find(field => field.field === node.field);
    const component = filterComponentReference(node, field, editors);
    const result: FilterComponentConfig = {
      id: node.id,
      operator: node.op,
      component: structuredClone(component),
      props: filterComponentProps(node),
      ...(node.field === undefined ? {} : { field: node.field }),
    };
    if (node.operands !== undefined)
      result.operands = Array.from(node.operands, child => visit(child, scope));
    if (node.predicate !== undefined)
      result.predicate = visit(node.predicate, field?.fields ?? []);
    if (descriptor.category === 'element' && !node.predicate)
      throw new TypeError('请补全元素条件');
    return result;
  }
  // Reject cycles and non-JSON buffers before descending through the tree.
  validateFilterJson(draft);
  const config = {
    mode: mode ?? (isSimpleFilter(draft) ? 'simple' : 'advanced'),
    root: visit(draft, fields),
  };
  validateFilterConfiguration(config);
  return config;
}

export function restoreFilterConfiguration(
  config: DeepReadonly<FilterConfiguration>,
): FilterDraftNode {
  validateFilterConfiguration(config);
  function visit(node: DeepReadonly<FilterComponentConfig>): FilterDraftNode {
    return {
      ...(node.component.name === 'builtin'
        ? structuredClone(node.props)
        : { props: structuredClone(node.props) }),
      id: node.id,
      op: node.operator,
      editor: structuredClone(node.component),
      ...(node.field === undefined ? {} : { field: node.field }),
      ...(node.operands ? { operands: node.operands.map(visit) } : {}),
      ...(node.predicate ? { predicate: visit(node.predicate) } : {}),
    } as FilterDraftNode;
  }
  return visit(config.root);
}
