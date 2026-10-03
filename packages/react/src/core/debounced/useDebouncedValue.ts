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

import { useCallback, useEffect, useState } from 'react';
import { dequal } from 'dequal';
import { useLatest } from '../useLatest.js';
import { useStableValue } from '../useStableValue.js';
import type { UseDebouncedCallbackOptions } from './useDebouncedCallback.js';
import { useDebouncedCallback } from './useDebouncedCallback.js';

export interface UseDebouncedValueReturn<T> {
  /** The value, `delay` milliseconds after it last changed. */
  value: T;
  /** Whether `value` is behind the latest one. */
  pending: boolean;
  /** Applies the latest value now. */
  flush: () => void;
}

/**
 * Follows `value` once it has stopped changing (content compared deeply).
 * The first render returns `value` itself.
 *
 * @example
 * const [keyword, setKeyword] = useState('');
 * const { value: debouncedKeyword } = useDebouncedValue(keyword, { delay: 300 });
 */
export function useDebouncedValue<T>(
  value: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedValueReturn<T> {
  const latestValue = useStableValue(value);
  const [debounced, setDebounced] = useState(latestValue);
  const { run, cancel } = useDebouncedCallback(
    (next: T) => setDebounced(() => next),
    options,
  );
  const pending = !dequal(debounced, latestValue);
  useEffect(() => {
    if (pending) run(latestValue);
    else cancel();
  }, [latestValue, pending, run, cancel]);
  const latest = useLatest(latestValue);
  const flush = useCallback(() => {
    cancel();
    setDebounced(() => latest.current);
  }, [cancel, latest]);
  return { value: debounced, pending, flush };
}
