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
import { useLatest } from '../useLatest.js';

export interface UseDebouncedCallbackOptions {
  /** Milliseconds to wait after the last call. */
  delay: number;
  /** Invoke on the first call of a burst. @default false */
  leading?: boolean;
  /** Invoke with the last arguments once the burst ends. @default true */
  trailing?: boolean;
}

export interface UseDebouncedCallbackReturn<T extends (...args: any[]) => any> {
  /** Schedules the callback; the arguments of the last call win. */
  readonly run: (...args: Parameters<T>) => void;
  /** Drops the scheduled call, if any. */
  readonly cancel: () => void;
  /** Whether a trailing call is scheduled. */
  readonly isPending: () => boolean;
}

/**
 * Debounces `callback`. The latest callback and options are used; the
 * returned functions are stable, and unmounting cancels the scheduled call.
 *
 * @example
 * const { run } = useDebouncedCallback(search, { delay: 300 });
 * <input onChange={e => run(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedCallbackReturn<T> {
  if (options.leading === false && options.trailing === false) {
    throw new Error(
      'useDebouncedCallback: at least one of leading or trailing must be true',
    );
  }
  const latest = useLatest({ callback, options });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastInvokeRef = useRef<number | undefined>(undefined);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }, []);

  const run = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      const {
        delay,
        leading = false,
        trailing = true,
      } = latest.current.options;
      const now = Date.now();
      if (
        leading &&
        (lastInvokeRef.current === undefined ||
          now - lastInvokeRef.current >= delay)
      ) {
        lastInvokeRef.current = now;
        latest.current.callback(...args);
        return;
      }
      if (!trailing) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined;
        lastInvokeRef.current = Date.now();
        latest.current.callback(...args);
      }, delay);
    },
    [cancel, latest],
  );

  const isPending = useCallback(() => timerRef.current !== undefined, []);

  useEffect(() => cancel, [cancel]);

  return { run, cancel, isPending };
}
