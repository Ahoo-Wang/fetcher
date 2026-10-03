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

import { useCallback, useEffect, useInsertionEffect, useRef } from 'react';
import type { PromiseState } from './usePromiseState.js';
import { idleState, PromiseStatus } from './usePromiseState.js';
import { useStableValue } from './useStableValue.js';

/** The first status of a query hook: `loading` when it executes on mount. */
export function initialQueryStatus(
  query: unknown,
  autoExecute: boolean,
  initialStatus: PromiseStatus | undefined,
): PromiseStatus {
  return (
    initialStatus ??
    (autoExecute && query !== undefined
      ? PromiseStatus.LOADING
      : PromiseStatus.IDLE)
  );
}

/**
 * Drives a controlled query: runs `run` whenever `autoExecute` is on and the
 * query is defined and its content changed. Returns `execute`, which runs the
 * current query on demand.
 */
export function useQueryTrigger<Q, R, E>(
  query: Q | undefined,
  autoExecute: boolean,
  run: (query: Q) => Promise<PromiseState<R, E>>,
): () => Promise<PromiseState<R, E>> {
  const stableQuery = useStableValue(query);
  const latest = useRef({ query, run });
  useInsertionEffect(() => {
    latest.current = { query, run };
  });
  useEffect(() => {
    if (autoExecute && stableQuery !== undefined) {
      latest.current.run(stableQuery);
    }
  }, [autoExecute, stableQuery, latest]);
  return useCallback(() => {
    const { query, run } = latest.current;
    return query === undefined
      ? Promise.resolve(idleState<R, E>())
      : run(query);
  }, [latest]);
}
