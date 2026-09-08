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
import { copy } from '../lib/snapshot.js';
import type { DeepReadonly } from '../lib/types.js';
import type {
  FilterCompilerRegistry,
  FilterConfiguration,
  FilterDraftNode,
  FilterEditorReference,
  FilterFieldDefinition,
} from './filterModel.js';
import {
  createFilterConfiguration,
  restoreFilterConfiguration,
} from './filterConfigurationState.js';
import { filterCompilerContext } from './filterConfigurationCompiler.js';
import { clearBuiltinFilterProps } from './filterBuiltinCompiler.js';
import { validateFilterConfiguration } from './filterConfigurationValidation.js';

export function clearFilterDraftValues(
  node: DeepReadonly<FilterDraftNode>,
  fields: readonly FilterFieldDefinition[],
  compilers?: FilterCompilerRegistry,
  editors?: Readonly<Partial<Record<FilterOperator, FilterEditorReference>>>,
): FilterDraftNode {
  const config = createFilterConfiguration(node, undefined, fields, editors);
  function clear(
    node: FilterConfiguration['root'],
    scope: readonly FilterFieldDefinition[],
  ) {
    if (node.operands) node.operands.forEach(child => clear(child, scope));
    else if (node.predicate)
      clear(
        node.predicate,
        scope.find(field => field.field === node.field)?.fields ?? [],
      );
    else {
      const compiler =
        node.component.name === 'builtin'
          ? { clear: clearBuiltinFilterProps }
          : compilers &&
              Object.prototype.hasOwnProperty.call(
                compilers,
                node.component.name,
              )
            ? compilers[node.component.name]
            : undefined;
      if (!compiler)
        throw new TypeError(`未注册筛选编译器：${node.component.name}`);
      if (compiler.clear)
        node.props = compiler.clear(
          copy(node.props),
          filterCompilerContext(node, scope),
        );
    }
  }
  clear(config.root, fields);
  validateFilterConfiguration(config);
  return restoreFilterConfiguration(config);
}
