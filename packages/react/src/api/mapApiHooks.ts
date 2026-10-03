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

import type { ApiMethod } from './apiHooks.js';
import { collectMethods, methodNameToHookName } from './apiHooks.js';

/** One hook per method of `api`, named by `methodNameToHookName`. */
export function mapApiHooks<Method extends ApiMethod, Hook>(
  api: object,
  createHook: (method: Method) => Hook,
): Record<string, Hook> {
  const hooks: Record<string, Hook> = {};
  collectMethods<Method>(api).forEach((method, name) => {
    hooks[methodNameToHookName(name)] = createHook(method);
  });
  return hooks;
}
