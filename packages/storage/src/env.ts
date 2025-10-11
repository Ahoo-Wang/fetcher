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

import { InMemoryStorage } from './inMemoryStorage';

/**
 * Checks if the current environment is a browser.
 * @returns True if running in a browser environment, false otherwise
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Gets the appropriate storage implementation based on the environment.
 * Returns localStorage in browser environments if available, InMemoryStorage otherwise.
 * @returns A Storage-compatible object
 */
export const getStorage = (): Storage => {
  if (isBrowser()) {
    return window.localStorage;
  }
  return new InMemoryStorage();
};
