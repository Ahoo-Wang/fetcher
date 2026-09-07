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

import { useRef, useState } from 'react';
import type { FilterExpression } from '@ahoo-wang/fetcher-wow';
import type { FilterCompileResult, FilterDraftNode } from './filterModel.js';
import type { FilterPanelProps } from './filterReactTypes.js';
import { sameFilterState } from './filterTree.js';
import { message } from './filterPanelUtils.js';

/** The ref guards immediate callbacks; state drives the query button. */
export function useFilterPanelQuery(
  { value, querying = false, disabled = false, onApply }: FilterPanelProps,
  draft: FilterDraftNode,
  compiled: FilterCompileResult,
  valid: boolean,
  setBaseline: (draft: FilterDraftNode) => void,
) {
  const submittedRef = useRef<FilterExpression | undefined>(undefined);
  const [submission, setSubmission] = useState<FilterExpression>();
  const [applyError, setApplyError] = useState<string>();
  function apply() {
    if (
      disabled ||
      !valid ||
      !compiled.expression ||
      (querying &&
        sameFilterState(compiled.expression, submittedRef.current ?? value))
    )
      return;
    const before = submittedRef.current;
    submittedRef.current = compiled.expression;
    try {
      onApply(compiled.expression);
      setBaseline(structuredClone(draft));
      setSubmission(compiled.expression);
      setApplyError(undefined);
    } catch (error) {
      submittedRef.current = before;
      setApplyError(message(error));
    }
  }

  return {
    apply,
    applyError,
    setApplyError,
    submittedRef,
    setSubmission,
    submitting:
      querying && sameFilterState(compiled.expression, submission ?? value),
  };
}
