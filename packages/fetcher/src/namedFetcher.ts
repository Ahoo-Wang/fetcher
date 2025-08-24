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

import { NamedCapable } from './types';
import { defaultOptions, Fetcher, FetcherOptions } from './fetcher';
import { DEFAULT_FETCHER_NAME, fetcherRegistrar } from './fetcherRegistrar';

/**
 * NamedFetcher is an extension of the Fetcher class that automatically registers
 * itself with the global fetcherRegistrar using a provided name.
 * This allows for easy management and retrieval of multiple fetcher instances
 * throughout an application by name.
 *
 * @example
 * // Create a named fetcher that automatically registers itself
 * const apiFetcher = new NamedFetcher('api', {
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000
 * });
 *
 * // Retrieve the fetcher later by name
 * const sameFetcher = fetcherRegistrar.get('api');
 * console.log(apiFetcher === sameFetcher); // true
 *
 * // Use the fetcher normally
 * const response = await apiFetcher.get('/users');
 */
export class NamedFetcher extends Fetcher implements NamedCapable {
  /**
   * The name of this fetcher instance, used for registration and retrieval
   */
  name: string;

  /**
   * Create a NamedFetcher instance and automatically register it with the global fetcherRegistrar
   *
   * @param name - The name to register this fetcher under
   * @param options - Fetcher configuration options (same as Fetcher constructor)
   *
   * @example
   * // Create with default options
   * const fetcher1 = new NamedFetcher('default');
   *
   * // Create with custom options
   * const fetcher2 = new NamedFetcher('api', {
   *   baseURL: 'https://api.example.com',
   *   timeout: 5000,
   *   headers: { 'Authorization': 'Bearer token' }
   * });
   */
  constructor(name: string, options: FetcherOptions = defaultOptions) {
    super(options);
    this.name = name;
    fetcherRegistrar.register(name, this);
  }
}

/**
 * Default named fetcher instance registered with the name 'default'.
 * This provides a convenient way to use a pre-configured fetcher instance
 * without having to create and register one manually.
 *
 * @example
 * // Use the default fetcher directly
 * import { fetcher } from '@ahoo-wang/fetcher';
 *
 * fetcher.get('/users')
 *   .then(response => response.json())
 *   .then(data => console.log(data));
 *
 * // Or retrieve it from the registrar
 * import { fetcherRegistrar } from '@ahoo-wang/fetcher';
 *
 * const defaultFetcher = fetcherRegistrar.default;
 * defaultFetcher.get('/users')
 *   .then(response => response.json())
 *   .then(data => console.log(data));
 */
export const fetcher = new NamedFetcher(DEFAULT_FETCHER_NAME);
