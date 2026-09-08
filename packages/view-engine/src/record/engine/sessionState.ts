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

import { compileFilterDraft } from '../../filter/filterCore.js';
import {
  compileFilterConfiguration,
  restoreFilterConfiguration,
} from '../../filter/filterConfiguration.js';
import type { FilterCompilerRegistry } from '../../filter/filterModel.js';
import { sameFilterQuery, sameFilterState } from '../../filter/filterTree.js';
import type { DeepReadonly } from '../../lib/types.js';
import type {
  RecordSession,
  ViewDefinition,
  ViewInstance,
} from '../recordModel.js';
import { EMPTY_RECORD_SUMMARY } from '../recordSummary.js';

export function createSession(
  instance: ViewInstance,
  definition: DeepReadonly<ViewDefinition>,
  compilers: FilterCompilerRegistry,
): RecordSession {
  const filterDraft = restoreFilterConfiguration(instance.config.filters);
  const compiled = compileFilterConfiguration(
    instance.config.filters,
    definition.fields,
    definition.allowedOperators,
    compilers,
  );
  return {
    baseline: instance,
    instance,
    dirty: false,
    filterDraft,
    filterBaseline: filterDraft,
    filterValid: true,
    filterMode: instance.config.filters.mode,
    filterPending: compiled.errors.length > 0,
    appliedFilter: compiled.expression ?? null,
    page: 1,
    cursor: null,
    nextCursor: null,
    rows: [],
    total: null,
    pageSummary: EMPTY_RECORD_SUMMARY,
    allSummary: EMPTY_RECORD_SUMMARY,
    selectedRowKeys: [],
    queryStatus: 'idle',
    refreshing: false,
    queryError: null,
    writeStatus: 'idle',
    writeError: null,
    requiresReload: false,
  };
}

export function instanceContent({
  title,
  scope,
  config,
}: DeepReadonly<ViewInstance>) {
  return { title, scope, config };
}

export function deriveSession(
  session: RecordSession,
  definition: DeepReadonly<ViewDefinition>,
  compilers: FilterCompilerRegistry,
): RecordSession {
  const compiled = compileFilterDraft(
    session.filterDraft,
    definition.fields,
    definition.allowedOperators,
    compilers,
    definition.filterEditors,
  );
  return {
    ...session,
    filterPending:
      !session.filterValid ||
      compiled.errors.length > 0 ||
      !sameFilterQuery(compiled.expression, session.appliedFilter),
    dirty: !sameFilterState(
      instanceContent(session.instance),
      instanceContent(session.baseline),
    ),
  };
}

export function isSystemSession(session: RecordSession): boolean {
  return [session.baseline, session.instance].some(
    value => value.scope.type === 'public' && value.scope.source === 'system',
  );
}

/** A new copy carries the originating editor state without confusing its saved baseline. */
export function inheritEditingSession(
  baseline: ViewInstance,
  source: RecordSession,
  definition: DeepReadonly<ViewDefinition>,
  compilers: FilterCompilerRegistry,
  instance: DeepReadonly<ViewInstance> = {
    ...baseline,
    config: source.instance.config,
  },
): RecordSession {
  return deriveSession(
    {
      ...createSession(baseline, definition, compilers),
      instance,
      filterDraft: source.filterDraft,
      filterBaseline: source.filterBaseline,
      filterValid: source.filterValid,
      filterMode: source.filterMode,
      appliedFilter: source.appliedFilter,
    },
    definition,
    compilers,
  );
}
