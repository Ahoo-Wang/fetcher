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

import { useCallback, useMemo } from 'react';
import type { ViewConfig } from '../model/index.js';
import { refreshIntervalOf, type ViewRuntime } from '../runtime/index.js';
import { useViewRuntime } from './useViewEngine.js';

/**
 * The ladder an interval control offers from, before the limits cut it and
 * the interval in force is folded in.
 *
 * Ten seconds is the shortest anything on a wall needs, an hour the longest
 * that still reads as "this keeps itself up to date"; the rungs between are
 * the ones a person asks for by name. Every one of them divides into whole
 * seconds, minutes or hours, so each has a label nobody has to decode.
 */
const REFRESH_INTERVALS = [10, 30, 60, 300, 900, 1800, 3600];

/** Stable identity for "no runtime, nothing on offer". */
const NO_INTERVALS: readonly number[] = [];

/**
 * How often this view renews its own answer, and the way to run one now.
 *
 * There is no state here beside the config: the interval *is*
 * `ViewConfigBase.refresh.interval`, saved with the view and read by the
 * runtime's one timer. A control that kept its own copy would give the saved
 * config, the timer and the screen three opinions about the same number.
 */
export interface RefreshController {
  /**
   * Seconds between automatic refreshes, or `null` when off.
   *
   * It is the draft's, which is what the view is *set* to and what a save
   * would write. Choosing an interval edits and applies in one gesture, so
   * the two agree except while a draft the kernel refuses holds `apply`
   * back — and a refused draft is one of the four reasons the runtime holds
   * the timer anyway (`docs/design/runtime.md`).
   */
  interval: number | null;
  /**
   * The intervals on offer, ascending, already cut to what
   * `RuntimeLimits.minRefreshInterval` and `maxRefreshInterval` admit. An
   * interval the limits refuse is absent rather than disabled (D4), so an
   * empty list means this view has no interval to choose and a control over
   * it has nothing to open.
   */
  intervals: readonly number[];
  /**
   * Writes `refresh.interval` and applies it, the way a sort or a column
   * change does: without the apply the runtime's timer, which reads
   * `applied`, would never hear about it.
   */
  setInterval(interval: number | null): void;
  /** One refresh, now. Unchanged by any of the above. */
  now(): void;
  /** True while a query of this view is in flight. */
  loading: boolean;
}

/**
 * The auto-refresh of one open view, as a control can offer it.
 *
 * The runtime decides when the timer runs and when it pauses — an invalid
 * draft, an editor with focus, a hidden page, a request in flight — and this
 * adds no rule of its own. All it does is make the interval reachable.
 */
export function useAutoRefresh(
  runtime: ViewRuntime<ViewConfig> | null,
): RefreshController {
  const state = useViewRuntime(runtime);
  const draft = state?.draft;
  // Read through the runtime's own reading of it: a config arrives from a
  // store, and "what the timer will use" must be the one answer on screen.
  const interval = draft ? refreshIntervalOf(draft) : null;
  const limits = runtime?.limits;

  return {
    interval,
    intervals: useMemo(() => {
      if (!limits) return NO_INTERVALS;
      const admits = (seconds: number) =>
        seconds >= limits.minRefreshInterval &&
        seconds <= limits.maxRefreshInterval;
      // The interval in force joins the ladder when the limits admit it: a
      // view saved at 45 seconds has to show the interval it is running at.
      // One they refuse does not — the config is already refused, said in
      // the strip above the result, and the way out of it is a rung that
      // works or Off, not the number that broke.
      const offered = REFRESH_INTERVALS.filter(admits);
      if (interval !== null && admits(interval)) offered.push(interval);
      return [...new Set(offered)].sort((left, right) => left - right);
    }, [interval, limits]),
    setInterval: useCallback(
      (next: number | null) => {
        if (!runtime) return;
        runtime.edit({ refresh: { interval: next } });
        runtime.apply();
      },
      [runtime],
    ),
    now: useCallback(() => runtime?.refresh(), [runtime]),
    loading: state?.query.status === 'loading',
  };
}
