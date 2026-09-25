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

import { useCallback, useEffect, useRef } from 'react';
import { dequal } from 'dequal';
import type { DebounceCapable } from './useDebouncedExecutePromise.js';
import { useDebouncedCallbackInternal } from './useDebouncedCallback.js';

/** What the debounced query hooks read from their options. */
export interface DebouncedQueryScheduleOptions<Q> extends DebounceCapable {
  query?: Q;
  autoExecute?: boolean;
}

/** The query hook the schedule drives (`useQuery` or `useFetcherQuery`). */
export interface ScheduledQuery<Q> {
  execute: () => Promise<void>;
  getQuery: () => Q | undefined;
  setQuery: (query: Q) => void;
}

export interface DebouncedQuerySchedule<Q> {
  setQuery: (query: Q) => void;
  run: () => void;
  cancel: () => void;
  isPending: () => boolean;
}

/**
 * The debounced scheduling shared by `useDebouncedQuery` and
 * `useDebouncedFetcherQuery`: `query` must run the underlying query hook with
 * `autoExecute: false`, and this schedules its execution instead — on
 * `run()`, and, when `autoExecute` is on, on mount, on `setQuery` and when the
 * `query` option's content changes. An automatic run already pending for the
 * same query is not rescheduled, including under StrictMode replay.
 *
 * @internal
 */
export function useDebouncedQueryScheduler<Q>(
  options: DebouncedQueryScheduleOptions<Q>,
  query: ScheduledQuery<Q>,
): DebouncedQuerySchedule<Q> {
  const originalAutoExecute = options.autoExecute;
  const hasQuery = 'query' in options;
  const hasQueryToExecute = options.query !== undefined || !hasQuery;
  const { execute, getQuery, setQuery } = query;
  type AutomaticQuery = { query: Q | undefined; invoked: boolean };
  const automaticallyScheduled = useRef<AutomaticQuery | undefined>(undefined);
  const invokeScheduled = useCallback(
    (automatic?: AutomaticQuery) => {
      if (automatic) automatic.invoked = true;
      return execute();
    },
    [execute],
  );
  const {
    run: schedule,
    cancel: cancelScheduled,
    isPending,
  } = useDebouncedCallbackInternal(invokeScheduled, options.debounce);
  const cancel = useCallback(() => {
    automaticallyScheduled.current = undefined;
    cancelScheduled();
  }, [cancelScheduled]);
  const cancelAutomatic = useCallback(() => {
    automaticallyScheduled.current = undefined;
    cancelScheduled(true);
  }, [cancelScheduled]);
  const scheduleAutomatically = useCallback(
    (query: Q | undefined) => {
      const previous = automaticallyScheduled.current;
      const automatic = { query, invoked: false };
      automaticallyScheduled.current = automatic;
      schedule(automatic);
      if (
        automaticallyScheduled.current === automatic &&
        !automatic.invoked &&
        !isPending()
      ) {
        // A suppressed call owns no timer; retain only an already invoked automatic call.
        automaticallyScheduled.current = previous?.invoked
          ? previous
          : undefined;
      }
    },
    [schedule, isPending],
  );
  const run = useCallback(() => {
    automaticallyScheduled.current = undefined;
    schedule();
  }, [schedule]);
  const setQueryFn = useCallback(
    (query: Q) => {
      setQuery(query);
      if (originalAutoExecute) {
        scheduleAutomatically(query);
      }
    },
    [setQuery, scheduleAutomatically, originalAutoExecute],
  );
  const lastExecution = useRef({
    autoExecute: false,
    hasQuery,
    query: options.query,
  });
  useEffect(
    () => () => {
      // The debounce cleanup cancels pending work, including StrictMode replay.
      lastExecution.current.autoExecute = false;
      automaticallyScheduled.current = undefined;
    },
    [],
  );
  useEffect(() => {
    const previous = lastExecution.current;
    lastExecution.current = {
      autoExecute: !!originalAutoExecute,
      hasQuery,
      query: options.query,
    };
    if (
      (!originalAutoExecute && previous.autoExecute) ||
      (originalAutoExecute && !hasQueryToExecute)
    ) {
      if (automaticallyScheduled.current) cancelAutomatic();
    } else if (
      originalAutoExecute &&
      hasQueryToExecute &&
      (!previous.autoExecute ||
        previous.hasQuery !== hasQuery ||
        !dequal(previous.query, options.query))
    ) {
      if (
        previous.autoExecute &&
        previous.hasQuery === hasQuery &&
        automaticallyScheduled.current &&
        dequal(automaticallyScheduled.current.query, options.query)
      ) {
        return;
      }
      scheduleAutomatically(getQuery());
    }
  }, [
    scheduleAutomatically,
    cancelAutomatic,
    originalAutoExecute,
    hasQuery,
    hasQueryToExecute,
    options.query,
    getQuery,
  ]);
  return { setQuery: setQueryFn, run, cancel, isPending };
}
