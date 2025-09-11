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

import { Fetcher } from './fetcher';
import { fetcherRegistrar } from './fetcherRegistrar';
import { fetcher as defaultNamedFetcher } from './namedFetcher';

/**
 * Interface that defines a capability for objects that can have a fetcher.
 * This interface is typically used to mark components or objects that can perform fetching operations
 * and may need access to fetcher functionality.
 */
export interface FetcherCapable {
  /**
   * Optional fetcher property that can be either a string identifier or a Fetcher instance.
   * When present, this property indicates the fetcher associated with the implementing object.
   */
  fetcher?: string | Fetcher;
}

/**
 * Gets a Fetcher instance based on the provided fetcher parameter.
 *
 * @param fetcher - A string identifier or Fetcher instance to resolve
 * @param defaultFetcher - The default Fetcher to use when fetcher is not provided, defaults to defaultNamedFetcher
 * @returns A Fetcher instance if found, otherwise returns the default Fetcher
 */
export function getFetcher(fetcher?: string | Fetcher, defaultFetcher: Fetcher = defaultNamedFetcher): Fetcher {
  // Return undefined if no fetcher is provided
  if (!fetcher) {
    return defaultFetcher;
  }

  // Return the fetcher directly if it's already a Fetcher instance,
  // otherwise resolve it through the fetcher registrar
  return fetcher instanceof Fetcher
    ? fetcher
    : fetcherRegistrar.requiredGet(fetcher);
}
