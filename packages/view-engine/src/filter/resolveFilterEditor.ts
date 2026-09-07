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
import type { FilterEditorReference, FilterMode } from './filterModel.js';
import type {
  FilterPanelProps,
  FilterRegistration,
} from './filterReactTypes.js';
import type { FilterNodeLocation } from './filterTree.js';
import { compileFilterDraft } from './filterCore.js';
import { message } from './filterPanelUtils.js';

export function resolveFilterEditor(
  location: FilterNodeLocation,
  props: FilterPanelProps,
  mode: FilterMode,
  builtIn: ReadonlySet<string>,
): {
  expression?: FilterExpression;
  registration?: FilterRegistration;
  options?: FilterEditorReference['options'];
  error?: string;
} {
  if (builtIn.has(location.node.id)) return {};
  const { node, fields: scopeFields } = location;
  const field = scopeFields.find(field => field.field === node.field);
  const result = compileFilterDraft(node, scopeFields, props.allowedOperators);
  const expression =
    result.expression?.op === FilterOperator.MATCH_ALL &&
    node.op !== FilterOperator.MATCH_ALL
      ? undefined
      : result.expression;
  for (const reference of [field?.editor, props.editors?.[node.op]]) {
    if (!reference) continue;
    const registration = props.extensions?.filters?.[reference.name];
    if (!registration) return { error: `未注册筛选器：${reference.name}` };
    if (!registration.modes.includes(mode)) continue;
    try {
      if (registration.supports && !registration.supports(expression)) continue;
    } catch (error) {
      return { error: message(error) };
    }
    return { expression, registration, options: reference.options };
  }
  return { expression };
}
