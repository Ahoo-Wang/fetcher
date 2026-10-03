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
  DebounceCapable,
  UseDebouncedCallbackReturn,
} from '../../core/index.js';
import { useDebouncedCallback } from '../../core/index.js';
import type { UseFetcherOptions, UseFetcherReturn } from '../useFetcher.js';
import { useFetcher } from '../useFetcher.js';

export interface UseDebouncedFetcherOptions<R, E = FetcherError>
  extends UseFetcherOptions<R, E>, DebounceCapable {}

export interface UseDebouncedFetcherReturn<R, E = FetcherError>
  extends
    Omit<UseFetcherReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseFetcherReturn<R, E>['execute']> {}

/** `useFetcher` whose requests are debounced through `run`. */
export function useDebouncedFetcher<R, E = FetcherError>(
  options: UseDebouncedFetcherOptions<R, E>,
): UseDebouncedFetcherReturn<R, E> {
  const { execute, ...state } = useFetcher<R, E>(options);
  const debounced = useDebouncedCallback(execute, options.debounce);
  return { ...state, ...debounced };
}
