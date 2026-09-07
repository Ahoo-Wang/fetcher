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

import { createFilterDraft, isSimpleFilter } from '../../filter/filterCore.js';
import {
  isFilterDraftPending,
  sameFilterState,
} from '../../filter/filterTree.js';
import type { DeepReadonly } from '../../lib/types.js';
import type { RecordSession, ViewInstance } from '../recordModel.js';
import { EMPTY_RECORD_SUMMARY } from '../recordSummary.js';

export function createSession(instance: ViewInstance): RecordSession {
  const filterDraft = createFilterDraft(instance.config.filter);
  return {
    baseline: instance,
    instance,
    dirty: false,
    filterDraft,
    filterBaseline: filterDraft,
    filterValid: true,
    filterMode: isSimpleFilter(filterDraft) ? 'simple' : 'advanced',
    filterPending: false,
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

export function deriveSession(session: RecordSession): RecordSession {
  return {
    ...session,
    filterPending: isFilterDraftPending(
      session.filterDraft,
      session.filterBaseline,
      session.filterValid,
    ),
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
  instance: DeepReadonly<ViewInstance> = {
    ...baseline,
    config: source.instance.config,
  },
): RecordSession {
  return deriveSession({
    ...createSession(baseline),
    instance,
    filterDraft: source.filterDraft,
    filterBaseline: source.filterBaseline,
    filterValid: source.filterValid,
    filterMode: source.filterMode,
  });
}
