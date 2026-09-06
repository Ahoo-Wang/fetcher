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

import { collectMethods, methodNameToHookName } from './apiHooks';
import type { ApiMethod } from './apiHooks';

/** Maps API methods to hooks, resolving accessors on access or enumeration. */
export function mapApiHooks<Method extends ApiMethod, Hook>(
  api: Record<string, unknown>,
  createHook: (method: Method) => Hook,
): Record<string, Hook> {
  const hooks: Record<string, Hook> = {};
  const mappedMethods = new Set<string>();
  // ponytail: O(methods * accessors); add a per-method callback only
  // if profiling large APIs shows a bottleneck.
  const mapMethods = (methods: ReadonlyMap<string, Method>) => {
    methods.forEach((method, name) => {
      if (mappedMethods.has(name)) return;
      mappedMethods.add(name);
      Object.defineProperty(hooks, methodNameToHookName(name), {
        value: createHook(method),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    });
  };
  const methods = collectMethods<Method>(api, (name, get, priorMethods) => {
    mapMethods(priorMethods);
    const hookName = methodNameToHookName(name);
    const previous = Object.getOwnPropertyDescriptor(hooks, hookName);
    Object.defineProperty(hooks, hookName, {
      configurable: true,
      get() {
        const method = get();
        if (typeof method !== 'function') {
          if (previous?.get) return previous.get();
          if (previous) {
            hooks[hookName] = previous.value;
            return previous.value;
          }
          delete hooks[hookName];
          return undefined;
        }
        const hook = createHook(method.bind(api) as Method);
        hooks[hookName] = hook;
        return hook;
      },
      set(hook: Hook) {
        Object.defineProperty(hooks, hookName, {
          value: hook,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      },
    });
  });
  mapMethods(methods);
  return new Proxy(hooks, {
    has(target, key) {
      if (Reflect.getOwnPropertyDescriptor(target, key)?.get) {
        Reflect.get(target, key);
      }
      return Reflect.has(target, key);
    },
    getOwnPropertyDescriptor(target, key) {
      if (Reflect.getOwnPropertyDescriptor(target, key)?.get) {
        Reflect.get(target, key);
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    ownKeys(target) {
      for (const key of Reflect.ownKeys(target)) {
        if (Reflect.getOwnPropertyDescriptor(target, key)?.get) {
          Reflect.get(target, key);
        }
      }
      return Reflect.ownKeys(target);
    },
  });
}
