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
  FilterCompileResult,
  FilterCompilerRegistry,
  FilterDraftNode,
  FilterEditorReference,
  FilterFieldDefinition,
} from './filterModel.js';
import {
  createFilterConfiguration,
  compileFilterConfiguration,
} from './filterConfiguration.js';
export { FILTER_OPERATORS, getFieldOperators } from './filterOperators.js';
export {
  createFilterDraft,
  isSimpleFilter,
  newFilterDraft,
} from './filterDraft.js';
export {
  compileBuiltinFilter,
  clearBuiltinFilterProps,
} from './filterBuiltinCompiler.js';

export function compileFilterDraft(
  draft: DeepReadonly<FilterDraftNode>,
  fields: readonly FilterFieldDefinition[],
  allowedOperators?: readonly FilterOperator[],
  compilers?: FilterCompilerRegistry,
  editors?: Readonly<Partial<Record<FilterOperator, FilterEditorReference>>>,
  timeZone?: string,
): FilterCompileResult {
  try {
    return compileFilterConfiguration(
      createFilterConfiguration(draft, undefined, fields, editors),
      fields,
      allowedOperators,
      compilers,
      timeZone,
    );
  } catch (error) {
    return {
      errors: [
        {
          id: draft?.id ?? '',
          message: error instanceof Error ? error.message : '过滤配置无效',
        },
      ],
    };
  }
}

export {
  createFilterConfiguration,
  restoreFilterConfiguration,
  validateFilterConfiguration,
  compileFilterConfiguration,
  clearFilterDraftValues,
} from './filterConfiguration.js';
