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

/**
 * Module state shared by every copy of this package in a realm (its ES module
 * and CommonJS builds, say), so instances from different copies sharing a bus
 * still agree. Internal; not exported from the package.
 */
export function sharedState<T>(name: string, create: () => T): T {
  const key = Symbol.for(`@ahoo-wang/fetcher-storage/${name}`);
  const realm = globalThis as typeof globalThis & Record<symbol, T>;
  if (!(key in realm)) {
    Object.defineProperty(realm, key, { value: create() });
  }
  return realm[key];
}
