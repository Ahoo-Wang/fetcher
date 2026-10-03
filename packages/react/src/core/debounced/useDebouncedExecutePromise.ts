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

import type { FetcherError } from '@ahoo-wang/fetcher';
import type {
  UseExecutePromiseOptions,
  UseExecutePromiseReturn,
} from '../useExecutePromise.js';
import { useExecutePromise } from '../useExecutePromise.js';
import type {
  UseDebouncedCallbackOptions,
  UseDebouncedCallbackReturn,
} from './useDebouncedCallback.js';
import { useDebouncedCallback } from './useDebouncedCallback.js';

export interface DebounceCapable {
  debounce: UseDebouncedCallbackOptions;
}

export interface UseDebouncedExecutePromiseOptions<R, E = FetcherError>
  extends UseExecutePromiseOptions<R, E>, DebounceCapable {}

export interface UseDebouncedExecutePromiseReturn<R, E = FetcherError>
  extends
    Omit<UseExecutePromiseReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseExecutePromiseReturn<R, E>['execute']> {}

/** `useExecutePromise` whose executions are debounced through `run`. */
export function useDebouncedExecutePromise<R = unknown, E = FetcherError>(
  options: UseDebouncedExecutePromiseOptions<R, E>,
): UseDebouncedExecutePromiseReturn<R, E> {
  const { execute, ...state } = useExecutePromise<R, E>(options);
  const debounced = useDebouncedCallback(execute, options.debounce);
  return { ...state, ...debounced };
}
