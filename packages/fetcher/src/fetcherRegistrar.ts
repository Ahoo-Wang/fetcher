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

/**
 * Default fetcher name used when no name is specified
 */
const defaultFetcherName = 'default';

/**
 * FetcherRegistrar is a registry for managing multiple Fetcher instances.
 * It allows registering, retrieving, and unregistering Fetcher instances by name.
 * This is useful for applications that need to manage multiple HTTP clients
 * with different configurations.
 *
 * @example
 * // Register a fetcher
 * const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
 * fetcherRegistrar.register('api', fetcher);
 *
 * // Retrieve a fetcher
 * const apiFetcher = fetcherRegistrar.get('api');
 *
 * // Use the default fetcher
 * const defaultFetcher = fetcherRegistrar.default;
 *
 * // Unregister a fetcher
 * fetcherRegistrar.unregister('api');
 */
export class FetcherRegistrar {
  /**
   * Internal map for storing registered fetchers
   * @private
   */
  private registrar: Map<string, Fetcher> = new Map();

  /**
   * Register a Fetcher instance with a given name
   *
   * @param name - The name to register the fetcher under
   * @param fetcher - The Fetcher instance to register
   * @example
   * const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
   * fetcherRegistrar.register('api', fetcher);
   */
  register(name: string, fetcher: Fetcher): void {
    this.registrar.set(name, fetcher);
  }

  /**
   * Unregister a Fetcher instance by name
   *
   * @param name - The name of the fetcher to unregister
   * @returns boolean - True if the fetcher was successfully unregistered, false otherwise
   * @example
   * const success = fetcherRegistrar.unregister('api');
   * if (success) {
   *   console.log('Fetcher unregistered successfully');
   * }
   */
  unregister(name: string): boolean {
    return this.registrar.delete(name);
  }

  /**
   * Get a Fetcher instance by name
   *
   * @param name - The name of the fetcher to retrieve
   * @returns Fetcher | undefined - The Fetcher instance if found, undefined otherwise
   * @example
   * const fetcher = fetcherRegistrar.get('api');
   * if (fetcher) {
   *   // Use the fetcher
   * }
   */
  get(name: string): Fetcher | undefined {
    return this.registrar.get(name);
  }

  /**
   * Get a Fetcher instance by name, throwing an error if not found
   *
   * @param name - The name of the fetcher to retrieve
   * @returns Fetcher - The Fetcher instance
   * @throws Error - If no fetcher is registered with the given name
   * @example
   * try {
   *   const fetcher = fetcherRegistrar.requiredGet('api');
   *   // Use the fetcher
   * } catch (error) {
   *   console.error('Fetcher not found:', error.message);
   * }
   */
  requiredGet(name: string): Fetcher {
    const fetcher = this.get(name);
    if (!fetcher) {
      throw new Error(`Fetcher ${name} not found`);
    }
    return fetcher;
  }

  /**
   * Get the default Fetcher instance
   *
   * @returns Fetcher - The default Fetcher instance
   * @throws Error - If no default fetcher is registered
   * @example
   * const defaultFetcher = fetcherRegistrar.default;
   */
  get default(): Fetcher {
    return this.requiredGet(defaultFetcherName);
  }

  /**
   * Set the default Fetcher instance
   *
   * @param fetcher - The Fetcher instance to set as default
   * @example
   * const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
   * fetcherRegistrar.default = fetcher;
   */
  set default(fetcher: Fetcher) {
    this.register(defaultFetcherName, fetcher);
  }

  /**
   * Get a copy of all registered fetchers
   *
   * @returns Map<string, Fetcher> - A copy of the internal registrar map
   * @example
   * const allFetchers = fetcherRegistrar.fetchers;
   * for (const [name, fetcher] of allFetchers) {
   *   console.log(`Fetcher ${name}:`, fetcher);
   * }
   */
  get fetchers(): Map<string, Fetcher> {
    return new Map(this.registrar);
  }
}

/**
 * Global instance of FetcherRegistrar
 * This is the default registrar used throughout the application
 *
 * @example
 * import { fetcherRegistrar } from '@ahoo-wang/fetcher';
 *
 * // Register a fetcher
 * const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
 * fetcherRegistrar.register('api', fetcher);
 *
 * // Retrieve a fetcher
 * const apiFetcher = fetcherRegistrar.get('api');
 */
export const fetcherRegistrar = new FetcherRegistrar();
